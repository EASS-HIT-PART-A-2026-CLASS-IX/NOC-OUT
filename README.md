# NOC OUT — ESS HIT

A NOC/SOC-style operations dashboard: static web UI (HTML/CSS/JS) with a **FastAPI** backend and **PostgreSQL**. Built for demos and development, including QA helpers for synthetic test data.

## Screenshots

*Representative UI previews for the README. You can replace these files under `screenshots/` with your own captures anytime.*

### Overview

![Overview — main workspace](./screenshots/overview.png)

### Dashboard

![Dashboard — metrics and charts](./screenshots/dashboard.png)

### QA Lab

![QA Lab — test data and tooling](./screenshots/qa-lab.png)

---

## Stack

| Layer | Details |
|--------|---------|
| **Frontend** | `frontend/` — static SPA served by **Nginx**; `/api/...` is reverse-proxied to the backend. |
| **Backend** | `backend/` — **FastAPI**, **SQLModel**, **Uvicorn**; retries DB connection on startup. |
| **Database** | **PostgreSQL 15** in Docker; tables created on startup (`SQLModel.metadata.create_all`). |

## Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Docker Compose plugin)

## Quick start

From the project root:

```bash
docker compose up --build
```

When services are healthy:

- **Web UI:** [http://localhost](http://localhost) (port 80)
- **API (direct):** [http://localhost:8000](http://localhost:8000) — interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

Stop with `Ctrl+C` or `docker compose down`. Database files live in the Docker volume `postgres_data` until you remove it (`docker compose down -v`).

## Default ports

| Service | Host port |
|---------|-----------|
| Frontend (Nginx) | 80 |
| Backend (Uvicorn) | 8000 |
| PostgreSQL | 5432 |

## Environment

`compose.yaml` sets `DATABASE_URL` for the backend. For local runs outside Docker, set the same variable to your Postgres connection string.

> **Security:** default credentials in Compose are for **local development only**. Use strong secrets and proper configuration before any real deployment; do not commit production passwords to GitHub.

## API (current `main.py`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/qa/advanced-random` | Synthetic bundle: person, addresses, phones, device profile. |
| GET | `/api/qa/device-lookup?q=...` | Search the internal device catalog by name, codename, or model code. |

Models in `backend/models.py` (e.g. `Incident`, `RunLog`, `IPInvestigation`) define the data layer. Additional routers under `backend/api/` may be wired into `main.py` as the project grows.

## Development

- **Backend:** `./backend` is mounted into the container and Uvicorn runs with `--reload` — Python changes apply without rebuilding the image.
- **Frontend:** static files are mounted into Nginx — refresh the browser after editing HTML/JS/CSS.

## Repository layout

```
ESS HIT/
├── compose.yaml
├── README.md
├── screenshots/       # UI images for this README
├── backend/           # FastAPI app, models, device catalog
└── frontend/          # index.html, app.js, nginx.conf, Dockerfile
```

## License

No license file is included yet. Add a `LICENSE` if you publish the repository publicly.
