from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
import httpx
import jwt
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.analytics_service import get_analytics_data
from app.database import get_db
from app.config import settings
from app.models import GAAccount

router = APIRouter()

@router.get("/login_ga")
async def login():
    """Redireciona o usuário para a página de login do Google"""
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/auth"
        "?response_type=code"
        f"&client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI_GA}"
        "&scope=email%20profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fanalytics.readonly"
        "&access_type=offline"
        "&prompt=consent"
    )
    return {"url": google_auth_url}

@router.get("/callback_ga")
async def callback(code: str, db: Session = Depends(get_db)):
    """Recebe o código do Google e troca por um token de acesso"""
    token_url = "https://oauth2.googleapis.com/token"
    
    async with httpx.AsyncClient() as client:
        token_response = await client.post(token_url, data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI_GA,
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

    # Gera um token JWT para a sessão
    jwt_token = jwt.encode({"email": user_email}, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
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
            refresh_token=refresh_token
        )

        db.add(account)
        db.commit()
        db.refresh(account)

    # Redireciona usuário de volta ao frontend com o token
    frontend_url = f"http://localhost:3000/auth-success-ga?token={jwt_token}"
    return RedirectResponse(url=frontend_url)



