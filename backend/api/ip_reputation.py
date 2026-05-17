import ipaddress
import os
from datetime import datetime

import requests
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from database import get_session
from models import IPInvestigation

router = APIRouter(prefix="/api/ip", tags=["ip-reputation"])

ABUSEIPDB_URL = "https://api.abuseipdb.com/api/v2/check"


def _require_api_key() -> str:
    key = os.getenv("ABUSEIPDB_API_KEY", "")
    if not key:
        raise HTTPException(
            status_code=503,
            detail="ABUSEIPDB_API_KEY is not configured on this server.",
        )
    return key


@router.get("/scan")
def scan_ip(
    ip: str = Query(..., description="IPv4 or IPv6 address to scan"),
    session: Session = Depends(get_session),
):
    """Query AbuseIPDB for IP reputation data and cache the result in the database."""
    try:
        ipaddress.ip_address(ip)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"'{ip}' is not a valid IP address.")

    api_key = _require_api_key()

    try:
        resp = requests.get(
            ABUSEIPDB_URL,
            headers={"Key": api_key, "Accept": "application/json"},
            params={"ipAddress": ip, "maxAgeInDays": 90, "verbose": True},
            timeout=10,
        )
        resp.raise_for_status()
    except requests.Timeout:
        raise HTTPException(status_code=504, detail="AbuseIPDB API timed out.")
    except requests.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"AbuseIPDB returned an error: {e}")
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Could not reach AbuseIPDB: {e}")

    data = resp.json().get("data", {})

    # Upsert into IPInvestigation — best-effort, never fails the request.
    try:
        existing = session.exec(
            select(IPInvestigation).where(IPInvestigation.ip_address == ip)
        ).first()
        if existing:
            existing.isp = data.get("isp") or "Unknown"
            existing.threat_score = data.get("abuseConfidenceScore", 0)
            existing.last_checked = datetime.utcnow()
            session.add(existing)
        else:
            session.add(
                IPInvestigation(
                    ip_address=ip,
                    isp=data.get("isp") or "Unknown",
                    threat_score=data.get("abuseConfidenceScore", 0),
                )
            )
        session.commit()
    except Exception:
        session.rollback()

    return {
        "ip": data.get("ipAddress", ip),
        "abuse_confidence_score": data.get("abuseConfidenceScore", 0),
        "isp": data.get("isp"),
        "domain": data.get("domain"),
        "usage_type": data.get("usageType"),
        "country_code": data.get("countryCode"),
        "total_reports": data.get("totalReports", 0),
        "last_reported_at": data.get("lastReportedAt"),
        "is_whitelisted": data.get("isWhitelisted", False),
    }
