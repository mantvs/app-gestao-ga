from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import OAuthCredential
from app.services.analytics_service import get_analytics_data
from app.database import get_db
from app.config import settings

router = APIRouter()

router.get("/login")
def login_with_google():
    flow = Flow.from_client_secrets_file(
        settings.CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=settings.GOOGLE_REDIRECT_URI
    )
    auth_url, _ = flow.authorization_url(prompt="consent")
    return {"url": auth_url}

router.get("/callback")
async def callback(request: Request, db: Session = Depends(get_db)):
    code = request.query_params.get("code")

    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )

    flow.fetch_token(code=code)
    credentials = flow.credentials

    account = Account(
        email=credentials.id_token["email"],
        access_token=credentials.token,
        refresh_token=credentials.refresh_token
    )

    db.add(account)
    db.commit()

    return RedirectResponse("http://localhost:3000/accounts")  # Redireciona para a página de contas


@router.get("/realtime")
def get_realtime_analytics(db: Session = Depends(SessionLocal)):
    credentials = db.query(OAuthCredential).first()
    if not credentials:
        return {"error": "Nenhuma conta conectada"}

    data = get_analytics_data(credentials.access_token)
    return {"realtime_data": data}
