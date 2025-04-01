from sqlalchemy.orm import Session
from app.models import GAAccount

def get_accounts(db: Session):
    return db.query(GAAccount).all()

def add_account(db: Session, email: str, account_id: str):
    new_account = GAAccount(email=email, account_id=account_id)
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account

def remove_account(db: Session, id: str):
    account = db.query(GAAccount).filter(GAAccount.id == id).first()
    if account:
        db.delete(account)
        db.commit()
