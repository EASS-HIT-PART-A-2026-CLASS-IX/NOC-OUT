from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, create_engine
from faker import Faker
import os, random, time

from device_catalog import lookup_devices, random_device_entry

# --- Database (Postgres — startup waits for Docker compose) ---
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://itay_admin:password123@db:5432/soc_data")
engine = create_engine(DATABASE_URL)

connected = False
while not connected:
    try:
        with engine.connect() as connection:
            connected = True
            print("Successfully connected to Database!")
    except Exception:
        print("Waiting for Database to start... (2s)")
        time.sleep(2)

app = FastAPI()
fake_us = Faker("en_US")
try:
    fake_il = Faker("he_IL")
except Exception:
    fake_il = fake_us

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)


def _random_israeli_mobile() -> dict[str, str]:
    """Israeli mobile: local 05X-XXX-XXXX and E.164 +9725XXXXXXXX."""
    second = random.choice("23456789")
    body = "".join(str(random.randint(0, 9)) for _ in range(7))
    digits = "05" + second + body
    formatted = f"05{second}{body[:2]}-{body[2:5]}-{body[5:]}"
    e164 = "+972" + digits[1:]
    return {"local": formatted, "e164": e164}


def _fake_imei() -> str:
    return "".join(str(random.randint(0, 9)) for _ in range(15))


@app.get("/api/qa/advanced-random")
def advanced_random_data():
    """Faker-backed bundle: addresses, IL/intl phones, device profile."""
    try:
        dev = random_device_entry()
        try:
            address_il = f"{fake_il.street_address()}, {fake_il.city()}, Israel"
        except Exception:
            address_il = f"{fake_us.street_address()}, {fake_us.city()}, Israel (IL locale fallback)"
        address_intl = f"{fake_us.street_address()}, {fake_us.city()}, {fake_us.country()}"
        il_phone = _random_israeli_mobile()
        intl_phone = fake_us.phone_number()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"advanced-random failed: {e!s}") from e

    return {
        "person": {
            "full_name": fake_us.name(),
            "email": fake_us.email(),
            "job_title": fake_us.job(),
        },
        "addresses": {
            "israel": address_il,
            "international": address_intl,
        },
        "phones": {
            "israel_mobile_e164": il_phone["e164"],
            "israel_mobile_local": il_phone["local"],
            "international_sample": intl_phone,
        },
        "device": {
            "market_name": dev["market_name"],
            "model_codes": dev.get("model_codes", []),
            "codename": dev.get("codename"),
            "android_version": dev.get("android_version"),
            "api_level": dev.get("api_level"),
            "os_skin": dev.get("os_skin"),
            "chipset": dev.get("chipset"),
            "display": dev.get("display"),
            "ram": dev.get("ram"),
            "fake_imei": _fake_imei(),
            "android_id": "".join(random.choice("0123456789abcdef") for _ in range(16)),
        },
    }


@app.get("/api/qa/device-lookup")
def device_lookup(q: str = ""):
    """Search internal device dictionary by name, codename, or model code."""
    matches = lookup_devices(q, limit=10)
    return {"query": q.strip(), "count": len(matches), "matches": matches}
