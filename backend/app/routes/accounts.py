from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.crud import get_accounts, add_account, remove_account
from app.schemas import AccountCreate, AccountResponse

router = APIRouter()

@router.get("/accounts", response_model=list[AccountResponse])
async def list_accounts(db: Session = Depends(get_db)):
    return get_accounts(db)

@router.post("/accounts", response_model=AccountResponse)
async def add_ga_account(account: AccountCreate, db: Session = Depends(get_db)):
    return add_account(db, account.email, account.account_id)

@router.delete("/accounts/{account_id}")
async def delete_account(account_id: str, db: Session = Depends(get_db)):
    remove_account(db, account_id)
    return {"message": "Conta removida com sucesso"}