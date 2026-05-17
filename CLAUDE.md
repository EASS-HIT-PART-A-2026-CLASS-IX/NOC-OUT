# Project Overview
NOC OUT: A Network/Security Operations Center (NOC/SOC) dashboard for demo and QA use. It handles synthetic test data generation, incident management, and operational workflows.

## Tech Stack & Architecture
- **Backend**: Python, FastAPI, SQLModel, PostgreSQL 15.
- **Frontend**: Vanilla JavaScript SPA, HTML (No build step/bundler).
- **Infrastructure**: Docker Compose. Nginx (port 80) serves static files and proxies `/api/*` to the FastAPI backend (port 8000).

## Core Commands
- **Start/Rebuild**: `docker compose up --build`
- **Stop**: `docker compose down`
- **Wipe Database**: `docker compose down -v`

## Coding Conventions
- **Backend**: Use strict Python type hints. Manage DB interactions exclusively via SQLModel. Tables are auto-created on startup; do not use external migration tools. 
- **Frontend**: Stick to Vanilla JS and external CDN libraries. Manage API calls using the existing `apiUrl()` helper. Use `localStorage` for persistent client state (like roster/bookmarks).
- **API Routing**: Add new endpoints by defining routers in `backend/api/` and including them in `main.py` via `app.include_router()`.

## Hard Rules & Boundaries
- **Docker-First Strictness**: Never suggest running `pip` or local environments. All logic, testing, and execution must happen within the Docker containers.
- **No Frontend Frameworks**: DO NOT introduce React, Vue, Vite, Webpack, or npm `package.json`. Keep the frontend strictly Vanilla SPA.
- **Routing Awareness**: The frontend always calls endpoints prefixed with `/api/` (handled by Nginx). Never hardcode `localhost:8000` inside frontend fetch requests.
- **Data Safety**: Do not commit secrets or real external API keys (e.g., for weather integration).