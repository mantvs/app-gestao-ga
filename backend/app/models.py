from sqlalchemy import Column, Integer, String
from app.database import Base

class GAAccount(Base):
    __tablename__ = "ga_accounts"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False)
    account_id = Column(String(255), nullable=False)
    access_token = Column(String(255), nullable=False)
    refresh_token = Column(String(255), nullable=False)
    property_id = Column(String(255), nullable=False)
    display_name = Column(String(255), nullable=False)
    time_zone = Column(String(255), nullable=False)
    
class OauthCredentials(Base):
    __tablename__ = "oauth_credentials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    access_token = Column(String(255))
    refresh_token = Column(String(255))
