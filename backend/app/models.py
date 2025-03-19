from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

#
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))

class OAuthCredential(Base):
    __tablename__ = "oauth_credentials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    access_token = Column(String(512))
    refresh_token = Column(String(512))
    token_type = Column(String(50))
    expires_in = Column(Integer)
    scope = Column(String(255))
    user = relationship("User")
