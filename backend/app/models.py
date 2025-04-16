from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base, engine
from datetime import datetime

class GAAccount(Base):
    __tablename__ = "ga_accounts"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False)
    access_token = Column(String(255), nullable=False)
    refresh_token = Column(String(255), nullable=False)
    account_id = Column(String(255), nullable=False)
    account_name = Column(String(255), nullable=False)    
    property_id = Column(String(255), nullable=False)
    property_name = Column(String(255), nullable=False)
    time_zone = Column(String(255), nullable=False)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    
class OauthCredentials(Base):
    __tablename__ = "oauth_credentials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    access_token = Column(String(255))
    refresh_token = Column(String(255))

Base.metadata.create_all(bind=engine)