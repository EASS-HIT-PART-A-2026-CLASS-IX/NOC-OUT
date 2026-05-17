# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NOC OUT** is a Network/Security Operations Center (NOC/SOC) dashboard built for demo and QA use. It generates synthetic test data and provides utilities for incident management, device lookups, and operations workflows.

## Running the Project

All development is Docker-first. There is no local Python/Node setup — everything runs in containers.

```bash
# Start all services (builds on first run)
docker compose up --build

# Stop (keep database volume)
docker compose down

# Stop and wipe the database
docker compose down -v
```

**Endpoints after startup:**
- Frontend: http://localhost (Nginx on port 80)
- Backend API: http://localhost:8000
- Interactive API docs: http://localhost:8000/docs

**Hot reload is enabled in development:**
- Backend: Python changes are picked up automatically (Uvicorn `--reload`, volume-mounted at `/app`)
- Frontend: Static file changes are visible on browser refresh (volume-mounted into Nginx)

## Architecture

```
Browser
  └── Nginx (port 80)
        ├── Serves static files: frontend/index.html, app.js, qtt-extras.js
        └── Proxies /api/* → FastAPI backend (port 8000)
                └── SQLModel ORM → PostgreSQL (port 5432)
```

**Three Docker services** (compose.yaml): `db` (PostgreSQL 15), `backend` (FastAPI/Uvicorn), `frontend` (Nginx/Alpine).

The Nginx reverse proxy (`frontend/nginx.conf`) transparently forwards `/api/` requests to the backend container, so the frontend always calls `/api/...` regardless of environment.

## Backend (`backend/`)

- **`main.py`** — FastAPI app entry point. On startup it waits for PostgreSQL with a retry loop, then calls `SQLModel.metadata.create_all(engine)` to auto-create tables.
- **`models.py`** — SQLModel data models: `Incident`, `RunLog`, `IPInvestigation`.
- **`database.py`** — SQLAlchemy engine and session dependency.
- **`device_catalog.py`** — Static catalog of ~20 Android devices (codename, model, API level, specs) used by the device lookup endpoint.
- **`api/alerts.py`** — Incident CRUD router (POST/GET `/incidents`); not yet registered in `main.py`.
- **`api/weather.py`** — Placeholder weather integration (requires external API key).

**Active API endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/qa/advanced-random` | Returns a synthetic bundle: person, Israeli/international addresses, phone numbers, Android device specs |
| GET | `/api/qa/device-lookup` | Searches device catalog by name, codename, or model (`?q=...`) |

## Frontend (`frontend/`)

Vanilla JavaScript SPA — no build step, no framework.

- **`index.html`** — Shell with all bundled CDN libraries (Chart.js, ExcelJS, js-yaml, marked, sql-formatter).
- **`app.js`** — All page logic, navigation, API calls, and state management. Includes an API URL builder that handles Docker reverse-proxy, direct port 8000, and `file://` fallback scenarios.
- **`qtt-extras.js`** — Additional UI tooling (QA helpers, canned responses, Linux snippets, roster).

Pages: Overview, Dashboard (charts/bookmarks), QA Lab (synthetic data + device lookup), Roster, Library.

Persistent state (roster, bookmarks, etc.) is stored in `localStorage`.

## Database

Credentials are set in `compose.yaml` (development only):
- URL: `postgresql://itay_admin:password123@db:5432/soc_data`

Tables are created automatically at backend startup — no migrations tool is in use.

## Adding a New API Router

1. Define the router in `backend/api/<name>.py`
2. Import and register it in `backend/main.py` with `app.include_router(...)`
3. Call the endpoint from `app.js` using the existing `apiUrl()` helper (prefixes `/api/`)
