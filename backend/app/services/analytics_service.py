from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

def get_analytics_data(token):
    credentials = Credentials(token)
    service = build('analyticsdata', 'v1beta', credentials=credentials)

    request = service.properties().runRealtimeReport(
        property="properties/YOUR_PROPERTY_ID",
        body={"dimensions": [{"name": "pagePath"}], "metrics": [{"name": "activeUsers"}]}
    )
    return request.execute()
