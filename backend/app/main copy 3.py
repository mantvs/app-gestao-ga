from fastapi import FastAPI, Depends, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer
from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware
import os
from app.config import settings


app = FastAPI()

# Middleware de sessão
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

# Configurar OAuth com o Authlib
oauth = OAuth()

# Configurar provedor de autenticação (Google, neste caso)
oauth.register(
    'google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    authorize_params=None,
    access_token_url='https://oauth2.googleapis.com/token',
    refresh_token_url=None,
    jwks_uri="https://www.googleapis.com/oauth2/v3/certs",
    client_kwargs={'scope': 'openid profile email'},
)

@app.get("/login")
async def login(request: Request):
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth")
async def auth(request: Request):
    token = await oauth.google.authorize_access_token(request)
    user = await oauth.google.parse_id_token(request, token)
    return {"user": user}

@app.get("/api/auth/callback")
async def auth_callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    id_token = token.get('id_token')  # Usar `.get()` ao invés de acessar diretamente

    if id_token:
        user = await oauth.google.parse_id_token(request, id_token)
        return {"user": user}
    else:
        return {"error": "id_token not found"}

