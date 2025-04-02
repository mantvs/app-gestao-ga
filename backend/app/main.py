from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth import router as auth_router
from app.routes.accounts import router as accounts_ga_router
from app.routes.auth_ga import router as auth_ga_router
from app.routes.data_ga import router as data_ga_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:3000"],  # Ajuste para o frontend em produção
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth")
app.include_router(accounts_ga_router, prefix="/api/ga")
app.include_router(auth_ga_router, prefix="/api/ga")
app.include_router(data_ga_router, prefix="/api/ga")


@app.get("/")
async def root():
    return {"message": "API de Autenticação com Google"}
