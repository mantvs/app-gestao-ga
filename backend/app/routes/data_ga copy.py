from fastapi import APIRouter, Depends, HTTPException
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Metric, Dimension
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import GAAccount
from google.oauth2.credentials import Credentials
from app.utils.periods import get_last_month_range

router = APIRouter()

# Função para buscar tráfego por HostName
async def get_ga_traffic(property_id: str, access_token: str):
    credentials = Credentials(token=access_token)
    client = BetaAnalyticsDataClient(credentials=credentials)
    
    start_date, end_date = get_last_month_range()
        
    date_ranges = [
        DateRange(start_date="today", end_date="today"),
        DateRange(start_date="7daysAgo", end_date="7daysAgo"),
        DateRange(start_date=start_date, end_date=end_date),
        DateRange(start_date="180daysAgo", end_date="today"),
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

    traffic_data = {}
    consolidated_traffic = [0] * len(date_ranges)
    
    periods = ["Hoje", "7 dias atrás", "Mês anterior", "Últimos 6 meses"]

    for idx, request in enumerate(report_requests):
        response = client.run_report(request)
        
        if response.rows:
            for row in response.rows:
                host = row.dimension_values[0].value
                active_users = int(row.metric_values[0].value)

                if host not in traffic_data:
                    traffic_data[host] = [{"period": periods[i], "activeUsers": 0} for i in range(len(date_ranges))]

                traffic_data[host][idx]["activeUsers"] = active_users
                consolidated_traffic[idx] += active_users
        
    return {
        "traffic": traffic_data,
        "consolidated": [{"period": periods[i], "activeUsers": consolidated_traffic[i]} for i in range(len(date_ranges))]
    }

# Nova função para buscar páginas mais acessadas
async def get_top_pages(property_id: str, access_token: str):
    credentials = Credentials(token=access_token)
    client = BetaAnalyticsDataClient(credentials=credentials)

    start_date, end_date = get_last_month_range()
    
    request = RunReportRequest(
        property=f"properties/{property_id}",
        date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
        metrics=[Metric(name="screenPageViews")],
        dimensions=[Dimension(name="pagePath"), Dimension(name="HostName")],
        order_bys=[{"metric": {"metric_name": "screenPageViews"}, "desc": True}],
        limit=10
    )

    response = client.run_report(request)

    pages_data = {}

    if response.rows:
        for row in response.rows:
            host = row.dimension_values[1].value
            page = row.dimension_values[0].value
            views = int(row.metric_values[0].value)

            if host not in pages_data:
                pages_data[host] = []
            
            pages_data[host].append({"pagePath": page, "views": views})

    # Criando dados consolidados
    consolidated_pages = {}
    for host, pages in pages_data.items():
        for page in pages:
            if page["pagePath"] not in consolidated_pages:
                consolidated_pages[page["pagePath"]] = 0
            consolidated_pages[page["pagePath"]] += page["views"]

    consolidated_pages_list = [{"pagePath": page, "views": views} for page, views in consolidated_pages.items()]
    consolidated_pages_list.sort(key=lambda x: x["views"], reverse=True)

    return {
        "pages": pages_data,
        "consolidated": consolidated_pages_list[:10]  # Top 10 páginas consolidadas
    }

@router.get("/data_ga")
async def get_data_ga(property_id: str, db: Session = Depends(get_db)):
    account = db.query(GAAccount).filter(GAAccount.property_id == property_id).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Conta do GA não encontrada")

    traffic_data = await get_ga_traffic(property_id, account.access_token)
    top_pages = await get_top_pages(property_id, account.access_token)

    return {
        "traffic": traffic_data["traffic"],
        "consolidated": traffic_data["consolidated"],
        "topPages": top_pages["pages"],
        "consolidatedPages": top_pages["consolidated"]
    }
