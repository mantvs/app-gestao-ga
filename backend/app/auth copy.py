from fastapi import APIRouter, Depends, HTTPException
import httpx
import jwt
from app.config import settings
from fastapi.responses import RedirectResponse
from app.database import get_db
from app.models import GAAccount
from sqlalchemy.orm import Session

router = APIRouter()

@router.get("/login")
async def login():
    """Redireciona o usuário para a página de login do Google"""
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/auth"
        "?response_type=code"
        f"&client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        "&scope=email%20profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fanalytics.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fanalytics.manage.users.readonly"
        "&access_type=offline"
        "&prompt=consent"
    )
    return {"url": google_auth_url}

@router.get("/callback")
async def callback(code: str, db: Session = Depends(get_db)):
    """Recebe o código do Google e troca por um token de acesso"""
    token_url = "https://oauth2.googleapis.com/token"
    
    async with httpx.AsyncClient() as client:
        token_response = await client.post(token_url, data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        })
    
    if token_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Erro ao obter token do Google")

    tokens = token_response.json()
    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")

    # Obter informações do usuário autenticado    
    async with httpx.AsyncClient() as client:
        
        userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        userinfo_response = await client.get(userinfo_url, headers=headers)
 
    if userinfo_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Erro ao obter informações do usuário")

    user_info = userinfo_response.json()
    user_email = user_info.get("email")

    # Verifica se o usuário está autorizado
    if user_email not in settings.AUTHORIZED_EMAILS:
        raise HTTPException(status_code=403, detail="Usuário não autorizado")

    # Gera um token JWT para a sessão
    jwt_token = jwt.encode({"email": user_email}, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
    # Buscar o GA4 Property ID do usuário
    async with httpx.AsyncClient() as client:
        analytics_admin_url = "https://analyticsadmin.googleapis.com/v1beta/accounts"
        headers = {"Authorization": f"Bearer {access_token}"}
        accounts_response = await client.get(analytics_admin_url, headers=headers)

    if accounts_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Erro ao obter contas do Google Analytics")

    accounts_data = accounts_response.json()
    
    if not accounts_data.get("accounts"):
        raise HTTPException(status_code=404, detail="Nenhuma conta GA4 encontrada")

    account_id = accounts_data["accounts"][0]["name"].split("/")[-1]

    # Buscar propriedades (property_id) da conta
    async with httpx.AsyncClient() as client:
        properties_url = f"https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:accounts/{account_id}"
        properties_response = await client.get(properties_url, headers=headers)

    if properties_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Erro ao obter propriedades do GA4")

    properties_data = properties_response.json()
        
    if not properties_data.get("properties"):
        raise HTTPException(status_code=404, detail="Nenhuma propriedade GA4 encontrada")

    property_id = properties_data["properties"][0]["name"].split("/")[-1]
    
    # Armazenando Tokens e Conta do Usuário
    
    existing_account = db.query(GAAccount).filter(GAAccount.email == user_email).first()
    
    if existing_account:
        
        # Atualiza os tokens existentes
        existing_account.access_token = access_token
        existing_account.refresh_token = refresh_token
    
    else :
            
        account = GAAccount(
            email=user_email,
            access_token=access_token,
            refresh_token=refresh_token,
            property_id=property_id            
        )

        db.add(account)
        db.commit()
        db.refresh(account)

    # Redireciona usuário de volta ao frontend com o token
    frontend_url = f"http://localhost:3000/auth-success?token={jwt_token}"
    return RedirectResponse(url=frontend_url)