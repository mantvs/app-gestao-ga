
# Importa os módulos para FastAPI, rotas e banco de dados.
from fastapi import FastAPI
from app.routes import auth, analytics
from app.database import engine, Base

# Cria as tabelas no banco de dados automaticamente.
Base.metadata.create_all(bind=engine)

#Inicializa a aplicação FastAPI.
app = FastAPI()

#Registra os roteadores de autenticação e análise, organizando as rotas
app.include_router(auth.router, prefix="/api/auth")
app.include_router(analytics.router, prefix="/api/analytics")
