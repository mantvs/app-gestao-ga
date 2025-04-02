from fastapi import APIRouter, Depends, HTTPException
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Metric
from sqlalchemy.orm import Session
from app.database import get_db
import httpx
from app.models import GAAccount
from google.oauth2.credentials import Credentials
from app.utils.periods import get_last_month_range

router = APIRouter()

# Função para buscar o nome do site (Propriedade GA4)
async def get_site_name(property_id: str, access_token: str):
    
    async with httpx.AsyncClient() as client:
        analytics_admin_url = "https://analyticsadmin.googleapis.com/v1beta/accounts"
        headers_admin = {"Authorization": f"Bearer {access_token}"}
        accounts_response = await client.get(analytics_admin_url, headers=headers_admin)

    if accounts_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Erro ao obter contas do Google Analytics")

    accounts_data = accounts_response.json()
    
    if not accounts_data.get("accounts"):
        raise HTTPException(status_code=404, detail="Nenhuma conta GA4 encontrada")

    account_id = accounts_data["accounts"][0]["name"].split("/")[-1]
        
    #url = f"https://analyticsadmin.googleapis.com/v1beta/{property_id}?filter=parent:accounts/{account_id}"
    url = f"https://analyticsadmin.googleapis.com/v1beta/properties/{property_id}"
    headers = {"Authorization": f"Bearer {access_token}"}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)

    if response.status_code == 200:
        return response.json().get("displayName", "Nome não disponível")
    
    return "Nome não disponível"

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
        
    site_name = await get_site_name(property_id, access_token)

    return {"site_name": site_name, "traffic": traffic_data}

@router.get("/data_ga")
async def get_data_ga(property_id: str, db: Session = Depends(get_db)):
    account = db.query(GAAccount).filter(GAAccount.property_id == property_id).first()
    
    if not account:
        return {"error": "Conta do GA não encontrada"}

    return await get_ga_traffic(property_id, account.access_token)
