from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import OAuthCredential
from app.services.analytics_service import get_analytics_data

router = APIRouter()

@router.get("/realtime")
def get_realtime_analytics(db: Session = Depends(SessionLocal)):
    credentials = db.query(OAuthCredential).first()
    if not credentials:
        return {"error": "Nenhuma conta conectada"}

    data = get_analytics_data(credentials.access_token)
    return {"realtime_data": data}
