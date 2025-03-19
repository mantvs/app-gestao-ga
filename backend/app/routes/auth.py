from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from app.services.google_auth import get_google_auth_flow
from app.database import SessionLocal
from app.models import OAuthCredential
from sqlalchemy.orm import Session

router = APIRouter()

@router.get("/login")
def login():
    flow = get_google_auth_flow()
    auth_url, _ = flow.authorization_url(prompt="consent")
    return RedirectResponse(auth_url)

@router.get("/callback")
def callback(code: str, db: Session = Depends(SessionLocal)):
    flow = get_google_auth_flow()
    flow.fetch_token(code=code)

    credentials = flow.credentials
    oauth_data = OAuthCredential(
        access_token=credentials.token,
        refresh_token=credentials.refresh_token,
        token_type=credentials.token_uri,
        expires_in=credentials.expiry.timestamp()
    )
    db.add(oauth_data)
    db.commit()
    return {"message": "Conta conectada com sucesso"}
