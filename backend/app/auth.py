from fastapi import APIRouter, Depends, HTTPException
import httpx
import jwt
from app.config import settings
from fastapi.responses import RedirectResponse

router = APIRouter()

@router.get("/login")
async def login():
    """Redireciona o usuário para a página de login do Google"""
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/auth"
        "?response_type=code"
        f"&client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        "&scope=email%20profile"
        "&access_type=offline"
        "&prompt=consent"
    )
    return {"url": google_auth_url}

@router.get("/callback")
async def callback(code: str):
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

    # Redireciona usuário de volta ao frontend com o token
    frontend_url = f"http://localhost:3000/auth-success?token={jwt_token}"
    return RedirectResponse(url=frontend_url)