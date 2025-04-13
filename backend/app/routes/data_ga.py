# Imports de bibliotecas e pacotes
from fastapi import APIRouter, Depends, HTTPException
import redis
import json
from datetime import date, datetime, time, timedelta
from sqlalchemy.orm import Session
from google.oauth2.credentials import Credentials
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest,
    RunRealtimeReportRequest,
    DateRange,
    Metric,
    Dimension,
    OrderBy
)

# Imports do projeto
from app.database import get_db
from app.models import GAAccount
from app.utils.periods import get_last_month_range

# Conecta ao Redis
redis_client = redis.Redis(host="analytics-redis", port=6379, db=0)

def get_cached_data(key):
    cached = redis_client.get(key)
    if cached:
        return json.loads(cached)
    return None

def set_cached_data(key, value, ttl=30):  # TTL = tempo de vida em segundos
    redis_client.setex(key, ttl, json.dumps(value))

router = APIRouter()

# Função: Busca dados de tráfego por período (hoje, 7 dias atrás, mês anterior, últimos 6 meses)
async def get_ga_traffic(property_id: str, access_token: str):
    
    cache_key = f"ga_traffic:{property_id}"
    cached = get_cached_data(cache_key)
    if cached:
        return cached    
    
    credentials = Credentials(token=access_token)
    client = BetaAnalyticsDataClient(credentials=credentials)
    
    # Define os períodos de consulta
    date_ranges = [
        DateRange(start_date="today", end_date="today"),
        DateRange(start_date="7daysAgo", end_date="today"),
        DateRange(start_date="30daysAgo", end_date="today"),
        DateRange(start_date="180daysAgo", end_date="today"),
    ]

    # Monta uma lista de requisições para cada período
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
    periods = ["Hoje", "Ultimos 7 dias", "Ultimos 30 dias", "Últimos 6 meses"]

    # Executa os relatórios e organiza os dados por host
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
                
    set_cached_data(cache_key, {
        "traffic": traffic_data,
        "consolidated": [{"period": periods[i], "activeUsers": consolidated_traffic[i]} for i in range(len(date_ranges))]
    })          
                
    return {
        "traffic": traffic_data,
        "consolidated": [{"period": periods[i], "activeUsers": consolidated_traffic[i]} for i in range(len(date_ranges))]
    }

# Obtem TopFivePages (Period in Data API)
async def get_top_pages(property_id: str, access_token: str, period: str = "mes"):
    
    cache_key = f"top_pages:{property_id}:{period}"
    cached = get_cached_data(cache_key)
    if cached:
        return cached    
    
    def get_date_range(period: str):
        today = datetime.today()
        if period == "mes":
            start_date = today.replace(day=1)
            end_date = today
        else:
            raise ValueError("Período inválido. Use: hoje, semana, mes, semestre.")

        return start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d")

    # Define intervalo de datas
    start_date, end_date = get_date_range(period)
    
    # Inicializa cliente
    credentials = Credentials(token=access_token)
    client = BetaAnalyticsDataClient(credentials=credentials)

    # Requisição ao GA4
    request = RunReportRequest(
        property=f"properties/{property_id}",
        date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
        metrics=[Metric(name="screenPageViews")],
        dimensions=[Dimension(name="pagePath"), Dimension(name="hostName")],
        order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="screenPageViews"), desc=True)],
        limit=5 
    )

    response = client.run_report(request)
    pages_data = {}
    consolidated_page = {}
    
    if response.rows:   
        for row in response.rows:
            host = row.dimension_values[1].value
            page = row.dimension_values[0].value
            views = int(row.metric_values[0].value)
            if host not in pages_data:
                pages_data[host] = []
            pages_data[host].append({"pagePath": page, "views": views})
            consolidated_page[page] = consolidated_page.get(page, 0) + views

    consolidated_data = sorted(
        [{"pagePath": page, "views": views} for page, views in consolidated_page.items()],
        key=lambda x: x["views"],
        reverse=True
    )
        
    set_cached_data(cache_key, {
        "pages": pages_data,
        "consolidated": consolidated_data[:5]
    })    

    return {"pages": pages_data, "consolidated": consolidated_data[:5]}
    
# Obtém UserActives (Realtime API)
async def get_realtime_users(property_id: str, access_token: str):
    
    cache_key = f"realtime_users:{property_id}"
    cached = get_cached_data(cache_key)
    if cached:
        return cached  
    
    credentials = Credentials(token=access_token)
    client = BetaAnalyticsDataClient(credentials=credentials)

    request = RunRealtimeReportRequest(
        property=f"properties/{property_id}",
        metrics=[Metric(name="activeUsers")],
        dimensions=[Dimension(name="streamName")]
    )

    response = client.run_realtime_report(request)
    user_data = {}
    total_users = 0

    if response.rows:
        for row in response.rows:
            host = row.dimension_values[0].value
            users = int(row.metric_values[0].value)
            user_data[host] = users
            total_users += users
            
    set_cached_data(cache_key, {
        "hosts": user_data,
        "total": total_users
    })

    return {"hosts": user_data, "total": total_users}


# Obtém TopFivePages (Realtime API)
async def get_realtime_top_pages(property_id: str, access_token: str):
    
    cache_key = f"realtime_top_pages:{property_id}"
    cached = get_cached_data(cache_key)
    if cached:
        return cached    
    
    credentials = Credentials(token=access_token)
    client = BetaAnalyticsDataClient(credentials=credentials)

    request = RunRealtimeReportRequest(
        property=f"properties/{property_id}",
        metrics=[Metric(name="screenPageViews")],
        dimensions=[Dimension(name="unifiedScreenName"), Dimension(name="streamName")],
        order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="screenPageViews"), desc=True)],
        limit=10
    )

    response = client.run_realtime_report(request)
    pages = {}
    consolidated = {}

    if response.rows:
        for row in response.rows:
            host = row.dimension_values[1].value
            page = row.dimension_values[0].value
            views = int(row.metric_values[0].value)
            if host not in pages:
                pages[host] = []
            pages[host].append({"pagePath": page, "views": views})
            consolidated[page] = consolidated.get(page, 0) + views
    
    consolidated_list = sorted(
        [{"pagePath": page, "views": views} for page, views in consolidated.items()],
        key=lambda x: x["views"],
        reverse=True
    )
    
    set_cached_data(cache_key, {
        "pages": pages,
        "consolidated": consolidated_list[:5]
    })

    return {"pages": pages, "consolidated": consolidated_list[:5]}

#Endpoint principal: Consolida todos os dados de tráfego, páginas e realtime de todas as contas GA associadas ao e-mail
@router.get("/data_ga")
async def get_data_ga(email: str, db: Session = Depends(get_db)):
    
    # Redis    
    cache_key = f"data_ga:{email}"
    cached = get_cached_data(cache_key)
    if cached:
        return cached    
    
    # Obtenção dos dados das Contas GA via BD    
    accounts = db.query(GAAccount).filter(GAAccount.email == email).all()
    if not accounts:
        raise HTTPException(status_code=404, detail="Contas do GA não encontradas")

    # Estrutura base de dados consolidados
    consolidated = {
        "traffic": {},
        "consolidatedTraffic": [0, 0, 0, 0],
        "topPages": {},
        "consolidatedTopPages": {},
        "realtimeUsers": {},
        "consolidatedRealtimeUsers": 0,
        "realtimeTopPages": {},
        "consolidatedRealtimeTopPages": {}
    }

    # Requsições para cada conta GA vinculada ao usuário
    for account in accounts:
        traffic_data = await get_ga_traffic(account.property_id, account.access_token)
        top_pages_mes = await get_top_pages(account.property_id, account.access_token, period="mes")
        realtime_users = await get_realtime_users(account.property_id, account.access_token)
        realtime_pages = await get_realtime_top_pages(account.property_id, account.access_token) 

        # Obtem e consolida ActiveUsers (Period)
        for host, values in traffic_data["traffic"].items():
            account_name = account.account_name
            property_name = account.property_name
            if account_name not in consolidated["traffic"]:
                consolidated["traffic"][account_name] = {}
            if account.property_name not in consolidated["traffic"][account_name]:
                consolidated["traffic"][account_name][property_name] = []
                consolidated["traffic"][account_name][property_name] = values
            else:
                for i in range(len(values)):
                    consolidated["traffic"][account_name][property_name][i]["activeUsers"] += values[i]["activeUsers"]

        for i, val in enumerate(traffic_data["consolidated"]):
            consolidated["consolidatedTraffic"][i] += val["activeUsers"]

        # Obtem e consolida TopPages (Period)        
        for host, pages in top_pages_mes["pages"].items():  
            account_name = account.account_name
            property_name = account.property_name          
            if account.account_name not in consolidated["topPages"]:
                consolidated["topPages"][account_name] = {}
            if account.property_name not in consolidated["topPages"][account_name]:
                consolidated["topPages"][account_name][property_name] = []
            consolidated["topPages"][account_name][property_name].extend(pages)        
            
        for page in top_pages_mes["consolidated"]:
          consolidated["consolidatedTopPages"][page["pagePath"]] = consolidated["consolidatedTopPages"].get(page["pagePath"], 0) + page["views"]      
        
        # Obtem e consolida UserActives (Realtime)
        for host, count in realtime_users["hosts"].items():
            account_name = account.account_name
            property_name = account.property_name 
            if account_name not in consolidated["realtimeUsers"]:
                consolidated["realtimeUsers"][account_name] = {}
            consolidated["realtimeUsers"][account_name][property_name] = \
                consolidated["realtimeUsers"][account_name].get(property_name, 0) + count
                
        consolidated["consolidatedRealtimeUsers"] += realtime_users["total"]

        # Obtem e consolida TopPages (Realtime)
        for host, pages in realtime_pages["pages"].items():  
            account_name = account.account_name
            property_name = account.property_name          
            if account.account_name not in consolidated["realtimeTopPages"]:
                consolidated["realtimeTopPages"][account_name] = {}
            if account.property_name not in consolidated["realtimeTopPages"][account_name]:
                consolidated["realtimeTopPages"][account_name][property_name] = []
            consolidated["realtimeTopPages"][account_name][property_name].extend(pages)        
            
        for page in realtime_pages["consolidated"]:
          consolidated["consolidatedRealtimeTopPages"][page["pagePath"]] = consolidated["consolidatedRealtimeTopPages"].get(page["pagePath"], 0) + page["views"]

    # Ordena top páginas (por período e realtime)
    consolidated["consolidatedTopPages"] = sorted(
        [{"pagePath": page, "views": views} for page, views in consolidated["consolidatedTopPages"].items()],
        key=lambda x: x["views"],
        reverse=True
    )[:10]

    consolidated["consolidatedRealtimeTopPages"] = sorted(
        [{"pagePath": page, "views": views} for page, views in consolidated["consolidatedRealtimeTopPages"].items()],
        key=lambda x: x["views"],
        reverse=True
    )[:5]
    
    consolidated["consolidatedTopPages"] = sorted(
    consolidated["consolidatedTopPages"],
    key=lambda x: x["views"],
    reverse=True
    )[:5]
    
    set_cached_data(cache_key, consolidated)
    return consolidated