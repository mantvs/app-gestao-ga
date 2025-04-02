from fastapi import APIRouter, Depends, HTTPException
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Metric
from sqlalchemy.orm import Session
from app.database import get_db
import httpx
from app.models import GAAccount
from google.oauth2.credentials import Credentials
from app.utils.periods import get_last_month_range
from google.analytics.data_v1beta.types import Dimension

router = APIRouter()

# Função para buscar a URL do site
async def get_site_url(property_id: str, access_token: str):
    # Buscar os Web Data Streams associados à propriedade GA4
    url_streams = f"https://analyticsadmin.googleapis.com/v1beta/properties/{property_id}/webDataStreams"
    headers = {"Authorization": f"Bearer {access_token}"}

    async with httpx.AsyncClient() as client:
        response_streams = await client.get(url_streams, headers=headers)

    if response_streams.status_code != 200:
        print(response_streams.status_code, response_streams.text)  # Testa a resposta da API
        return "URL não disponível"

    streams_data = response_streams.json()
    print("Resposta da API:", streams_data)
    
    if not streams_data.get("webDataStreams"):
        return "URL não disponível"

    # Pegar a primeira URL associada ao Web Data Stream
    site_url = streams_data["webDataStreams"][0].get("defaultUri", "URL não disponível")
    
    return site_url

# Função para buscar dados do GA4
async def get_ga_traffic(property_id: str, access_token: str):
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
            metrics=[Metric(name="activeUsers")],
            dimensions=[Dimension(name="HostName")]
        )
        for date_range in date_ranges
    ]

    traffic_data = []
    periods = ["Hoje", "7 dias atrás", "Mês anterior", "Últimos 6 meses"]

    for idx, request in enumerate(report_requests):
        response = client.run_report(request)
        active_users = int(response.rows[0].metric_values[0].value) if response.rows else 0
        traffic_data.append({"period": periods[idx], "activeUsers": active_users})
        
    site_url = await get_site_url(property_id, access_token)
    
    HostName = response.rows[0].dimension_values[0].value if response.rows else "URL não disponível"

    return {"site_url": HostName, "traffic": traffic_data}

@router.get("/data_ga")
async def get_data_ga(property_id: str, db: Session = Depends(get_db)):
    account = db.query(GAAccount).filter(GAAccount.property_id == property_id).first()
    
    if not account:
        return {"error": "Conta do GA não encontrada"}

    return await get_ga_traffic(property_id, account.access_token)
