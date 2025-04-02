from fastapi import APIRouter, Depends
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Metric
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import GAAccount
from google.oauth2.credentials import Credentials
from app.utils.periods import get_last_month_range

router = APIRouter()

# Função para buscar dados do GA4
def get_ga_traffic(property_id: str, access_token: str):
    credentials = Credentials(token=access_token)
    client = BetaAnalyticsDataClient(credentials=credentials)
    
    start_date, end_date = get_last_month_range()
        
    date_ranges = [
        DateRange(start_date="today", end_date="today"),  # Hoje
        DateRange(start_date="7daysAgo", end_date="7daysAgo"),  # 7 dias atrás
        DateRange(start_date=start_date, end_date=end_date),  # Mês anterior
        DateRange(start_date="180daysAgo", end_date="today"),  # Últimos 6 meses
    ]
    
    report_requests = [
        RunReportRequest(
            property=f"properties/{property_id}",
            date_ranges=[date_range],
            metrics=[Metric(name="activeUsers")]
        )
        for date_range in date_ranges
    ]

    traffic_data = []
    periods = ["Hoje", "7 dias atrás", "Mês anterior", "Últimos 6 meses"]

    for idx, request in enumerate(report_requests):
        response = client.run_report(request)
        active_users = int(response.rows[0].metric_values[0].value) if response.rows else 0
        traffic_data.append({"period": periods[idx], "activeUsers": active_users})

    return {"traffic": traffic_data}

@router.get("/data_ga")
def get_data_ga(property_id: str, db: Session = Depends(get_db)):
    account = db.query(GAAccount).filter(GAAccount.property_id == property_id).first()
    
    if not account:
        return {"error": "Conta do GA não encontrada"}

    return get_ga_traffic(property_id, account.access_token)
