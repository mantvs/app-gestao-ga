from sqlalchemy import Column, Integer, String
from app.database import Base

class GAAccount(Base):
    __tablename__ = "ga_accounts"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False)
    account_id = Column(String(255), nullable=False)
