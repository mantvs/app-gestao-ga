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
    """Recebe o código do Google e troca por um token de acesso, coletando todas as propriedades GA4 disponíveis."""
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

    if user_email not in settings.AUTHORIZED_EMAILS:
        raise HTTPException(status_code=403, detail="Usuário não autorizado")

    # Gera o JWT de sessão
    jwt_token = jwt.encode({"email": user_email}, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    # Buscar todas as contas GA4 disponíveis
    async with httpx.AsyncClient() as client:
        analytics_admin_url = "https://analyticsadmin.googleapis.com/v1beta/accounts"
        headers = {"Authorization": f"Bearer {access_token}"}
        accounts_response = await client.get(analytics_admin_url, headers=headers)
  
    if accounts_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Erro ao obter contas do Google Analytics")

    accounts_data = accounts_response.json().get("accounts", [])
       
    if not accounts_data:
        raise HTTPException(status_code=404, detail="Nenhuma conta GA encontrada")

    # Iterar por todas as contas e coletar todas as propriedades GA4
    all_accounts_and_properties = []
    async with httpx.AsyncClient() as client:
        for account in accounts_data:
            account_id = account["name"].split("/")[-1]
            account_name = account["displayName"]
            properties_url = f"https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:accounts/{account_id}"
            props_response = await client.get(properties_url, headers=headers)
            if props_response.status_code == 200:
                props_data = props_response.json()
                properties = props_data.get("properties", [])
                for prop in properties:
                    prop_id = prop["name"].split("/")[-1]
                    all_accounts_and_properties.append({
                        "account_id": account_id,
                        "account_name": account_name,  
                        "property_id": prop_id,                 
                        "property_name": prop.get("displayName", ""),                                                                    
                        "time_zone": prop.get("timeZone", ""),
                        "email": user_email
                    })
                    
    print(f"Contas e propriedades: {all_accounts_and_properties}")

    if not all_accounts_and_properties:
        raise HTTPException(status_code=404, detail="Nenhuma propriedade GA4 encontrada")

    # Armazenar (criar ou atualizar) todas as contas e propriedades no banco, permitindo múltiplos registros para um mesmo usuário
    for prop in all_accounts_and_properties:
        # Aqui usamos prop["property_id"] ao invés de uma variável externa
        existing_account = db.query(GAAccount).filter(
            GAAccount.email == user_email,
            GAAccount.property_id == prop["property_id"]
        ).first()

        if existing_account:
            existing_account.access_token = access_token
            existing_account.refresh_token = refresh_token
            existing_account.account_id = prop["account_id"]
            existing_account.account_name = prop["account_name"]
            existing_account.property_name = prop["property_name"]            
            
        else:
            new_record = GAAccount(
                email=user_email,
                access_token=access_token,
                refresh_token=refresh_token,
                account_id=prop["account_id"],
                account_name=prop["account_name"],
                property_id=prop["property_id"],
                property_name=prop["property_name"],
                time_zone=prop["time_zone"]
            )
            db.add(new_record)

    db.commit()

    # Redireciona o usuário para o frontend com o token JWT
    frontend_url = f"http://localhost:3000/auth-success?token={jwt_token}"
    return RedirectResponse(url=frontend_url)
