import requests

def refresh_access_token(refresh_token: str, client_id: str, client_secret: str):
    token_url = "https://oauth2.googleapis.com/token"
    payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }

    response = requests.post(token_url, data=payload)
    if response.status_code == 200:
        token_data = response.json()
        return {
            "access_token": token_data["access_token"],
            "expires_in": token_data.get("expires_in", 3600),
        }
    else:
        raise Exception(f"Erro ao renovar token: {response.text}")
