from pydantic import BaseModel

class AccountCreate(BaseModel):
    email: str
    account_id: str

class AccountResponse(BaseModel):
    email: str
    account_id: str

    class Config:
        from_attributes = True  # Para compatibilidade com o SQLAlchemy
