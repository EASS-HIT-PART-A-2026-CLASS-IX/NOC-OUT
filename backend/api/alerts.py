from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from database import get_session
from models import Incident

router = APIRouter()

@router.post("/incidents")
def create_incident(incident: Incident, session: Session = Depends(get_session)):
    session.add(incident)
    session.commit()
    session.refresh(incident)
    return incident

@router.get("/incidents")
def get_incidents(session: Session = Depends(get_session)):
    return session.exec(select(Incident)).all()