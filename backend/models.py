from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Incident(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    client_name: str
    severity: int
    description: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "Open"

class RunLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    distance_km: float
    duration_minutes: float
    date: datetime = Field(default_factory=datetime.utcnow)

class IPInvestigation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ip_address: str = Field(index=True)
    isp: str
    threat_score: int
    last_checked: datetime = Field(default_factory=datetime.utcnow)
