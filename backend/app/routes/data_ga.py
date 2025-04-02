
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from googleapiclient.discovery import build
import httpx
import jwt
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.analytics_service import get_analytics_data
from app.database import get_db
from app.config import settings
from app.models import GAAccount

router = APIRouter()

@router.get("/data_ga")
def get_data_ga(db: Session = Depends(get_db)):
    account = db.query(GAAccount).first()  # Pega a primeira conta salva
    if not account:
        return {"error": "Nenhuma conta conectada"}

    service = build("analyticsreporting", "v4", credentials=account.access_token)

    response = service.reports().batchGet(
        body={
            "reportRequests": [
                {
                    "viewId": "XXXXX",  # Substituir pelo ID da Vista GA4
                    "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
                    "metrics": [{"expression": "ga:sessions"}],
                }
            ]
        }
    ).execute()

    return response
  
  
@router.get("/realtime")
def get_realtime_analytics(db: Session = Depends(SessionLocal)):
    credentials = db.query(GAAccount).first()
    if not credentials:
        return {"error": "Nenhuma conta conectada"}

    data = get_analytics_data(credentials.access_token)
    return {"realtime_data": data}