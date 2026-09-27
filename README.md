# OreNexa — MOIL Reserve & Production Intelligence

> **SIH 2026 • Problem ID 26009 — Manganese Reserve Analysis System**
> Ministry of Steel / MOIL Limited — Strategic AI Command (SEC-L3)

OreNexa is a production-grade intelligence platform that fuses **Cartosat-3 / Sentinel-1 satellite proxies, drill stratigraphy, LSTM equipment health, XGBoost shortfall forecasting and GA reallocation** into one Light Bento command center for MOIL’s manganese estate (Balaghat, Ukwa, Kandri, Mansar — WGS84 21.8049°N 80.1852°E).

![Inter — single font throughout](https://img.shields.io/badge/font-Inter%20only-0f172a) ![Docker Ready](https://img.shields.io/badge/docker-compose-up-2496ed) ![RBAC](https://img.shields.io/badge/RBAC-4%20roles-7c3aed)

---

## 1. What It Does

| Tab | What you see | Who sees it |
|-----|--------------|-------------|
| **Overview** | Command hero (SEC-L3, Sat-Risk, Mine Unit) + 4 KPIs (28.40 MT @43.8% Mn, 76% MTD 28.4k/37.5k, HIGH -4,900 MT, Space/Fleet 38mm/84%/SWIR 1.92) + TelemetryStrip + 4 index cards + Top Recommendation | All |
| **Reserves** | GIS map (5 layers: reserve/NDVI/soil/LST/drilling) + heatmap + Boreholes BG-101 46.2% / 108 42.5% / 204 39.8% / SW9 47.1% + PPV Isoseismals (Highwall 4.8 mm/s 96% of DGMS 5.0) + Life-of-Mine exhaustion timeline + Summary table (tap → drill-down) | Admin, Planner, Field |
| **Production** | KPI 4-up (Planned/Actual/Shortfall/Days <90%) + Trend chart (teal actual, amber planned, grey target, disruption flags) + Constraint Root Cause + Space Radar Inundation + Daily Ledger (Log Actuals + Set Targets) | Admin, Planner, Field, Equip(view) |
| **Historic Trends** | 90/180/365/730d window + avg/range/samples KPIs + full chart + last-20 ledger + **CSV / Report JSON export** | Admin, Planner, Field, Equip |
| **Risk & Planning** | DGMS Compliance (Safety Index, 4 checks, 5.6 mm/s violation) + Shortfall Risk + Recommendations (Admin-only Authorize) + **Single What-if Simulator** (5 sliders → `POST /api/simulate` → shortfall % + recs + **log → CSV/Report JSON**) | Admin, Planner |
| **Command Center** | Unified alerts (Risk High + DGMS Critical + Fleet High + Action High) + filter ALL/High/Medium/Risk/DGMS/Fleet + 4 KPI (Critical/Warnings/Total/DGMS) + **Download Report** | Admin, Planner, Equip |
| **Fleet** | LSTM health list (High→Low) + Telemetry cards (Winder 91%, LHD 64% degraded, Pump 98%, Jumbo 84%) + Blasting schedule (PPV 4.1 vs 5.6) + **GA Reallocation Optimizer** | Admin, Equip |
| **Mine 360°** | `/mine/:mineId` — 360° dossier (reserve, KPI, Life-of-Mine, 90d trend, risk, DGMS, fleet, telemetry) + **Download Mine Report** | All (via row click or `Drill down →`) |

**Single typeface:** `Inter 400-800` everywhere (`font-variant-numeric: tabular-nums`) — no mixed display/mono.

---

## 2. Roles & Access (RBAC)

`frontend/src/context/AuthContext.jsx` — `localStorage("orenexa_auth")`, `ProtectedRoute` + rail filtering.

| Role | Username / Password | Can view | Can authorize |
|------|---------------------|----------|---------------|
| **Admin** | `admin` / `admin123` | **All 7 tabs + `/mine/:id`** | **Yes — Authorize/Dismiss/Undo replicates to all roles via `actions.db`** |
| **Mine Planner / Supervisor** | `planner` / `planner123` | Overview, Reserves, Production, Historic, Risk, Command, Mine | No — `Awaiting Admin authorization — read-only` |
| **Field Team** | `field` / `field123` | Overview, Reserves, Production, Historic, Mine | No |
| **Equipment Ops** | `equip` / `equip123` | Overview, Fleet, Command, Production(view), Historic, Mine | No |

Login at `/login` — centered premium card (no demo text clutter). Header shows `name` pill + `roleLabel` + `LogOut`.

---

## 3. Tech Stack

* **Frontend:** Vite 5 + React 18 + React Router 7 + Recharts + Leaflet + `leaflet.heat` + Axios + Lucide — `frontend/src/styles/global.css` Light Bento (`#f7f9fc` paper, glass `#ffffff`, ink `#0f172a`, amber `#ff7a18`, cyan `#0e9b8e`)
* **Backend:** FastAPI 0.115 + Uvicorn + Pandas/Numpy/Scikit-learn/Torch — `backend/app/main.py` (`CORS *`, 11 routers)
* **State:** SQLite `backend/app/state/actions.db` (Authorize log, shared across roles) — swap to Postgres via `DATABASE_URL` for prod
* **Maps:** CARTO `light_all` keyless (fallback pure OSM `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` — no API key needed)

---

## 4. Quick Start (Windows — no WSL shell needed)

### Prereq
- **Docker Desktop** (Hyper-V backend, no manual `wsl` commands) → `docker --version` `29.x` / `docker compose version` `v5.x`
- **Node 20+**, **Python 3.11** (for non-Docker fallback)

### Docker (prod-identical, recommended)
```powershell
cd "D:\Hackathon\SIH 26"
docker compose up --build -d
docker compose ps          # orenexa-frontend :80, orenexa-backend :8010 (health: starting → healthy)
docker compose logs -f
# Open
# http://localhost              → frontend (nginx proxies /api → backend:8010)
# http://localhost:8010/api/health → {"status":"healthy"}
# http://localhost:8010/docs        → Swagger
```

### Without Docker (Windows native)
```powershell
# Terminal 1
.\setup_backend.bat
.\start_backend.bat   # → http://127.0.0.1:8010

# Terminal 2
.\start_frontend.bat  # or cd frontend; npm install; npm run dev → http://127.0.0.1:5173
```

---

## 5. API — All proxied via `/api` (no key)

`frontend/src/api/client.js` → `baseURL "/api"` → Vite `proxy 5173→8010` (dev) / nginx `proxy_pass backend:8010` (prod).

| Method | Path | Used by |
|--------|------|---------|
| GET | `/api/mines` | Layout mine-select, drill-down |
| GET | `/api/dashboard/kpis?mine_id=` | KPI cards |
| GET | `/api/telemetry?mine_id=` | TelemetryStrip |
| GET | `/api/reserves/map?mine_id=` | GIS heatmap |
| GET | `/api/reserves/summary` | Reserves table |
| GET | `/api/reserves/life-of-mine?mine_id=&scenario=` | Life-of-Mine chart |
| GET | `/api/production/trend?mine_id=&days=` | Production + Historic |
| POST | `/api/production/actuals` | Log Today's Data |
| POST / GET | `/api/production/targets` | Set/Check monthly targets |
| GET | `/api/risk?mine_id=` | Risk badge |
| GET | `/api/recommendations?mine_id=` | Recommendations |
| POST | `/api/recommendations/{rec_id}/action` | Authorize/Dismiss (Admin only, persists in SQLite) |
| POST | `/api/simulate` | What-if simulator |
| GET | `/api/equipment/health?mine_id=` | Fleet health |
| GET | `/api/optimize/reallocate` | GA reallocation |
| GET | `/api/dgms/compliance?mine_id=` | DGMS audit |

---

## 6. Docker Production — Windows Server / NIC VM

```powershell
# On prod VM (Windows Server 2022)
git clone <repo> C:\orenexa; cd C:\orenexa
docker compose up --build -d
New-NetFirewallRule -DisplayName "OreNexa" -Direction Inbound -LocalPort 80,8010 -Protocol TCP -Action Allow
# Domain: point orenexa.moil.in A → VM IP, add IIS Reverse Proxy → localhost:80 for HTTPS
# Update: git pull; docker compose up --build -d
# Backup DB: docker run --rm -v sih26_backend_state:/data -v ${PWD}:/backup alpine tar czf /backup/actions-2026-09-27.tgz /data
```

`docker-compose.yml` already sets `restart: unless-stopped`, named volume `backend_state`, healthcheck `wget /api/health`.

---

## 7. SIH Demo Script (4 roles, one ore flow — 3 min)

1. **Admin** login → Overview shows HIGH -4,900 MT → **Reserves** PPV 4.8 mm/s near DGMS limit
2. **Planner** login → **Reserves** SWIR 1.92 apex, **Historic** export CSV, **Risk** run simulator (rainfall 10→60mm) → shortfall 92%
3. **Field** login → **Production** Log 410t → teal dot appears → **Mine drill-down** `/mine/MN01` → 360° dossier
4. **Equipment** login → **Fleet** LHD 64% degraded + GA reallocation
5. Back as **Admin** → Authorize silo blend → refresh as Planner/Field/Equip → shows `Authorized by Admin · Deployed · Replicated to all roles`

---

## 8. Project Layout

```
SIH 26/
├─ frontend/          # Vite React — 7 tabs + RBAC + Inter single font
│  ├─ src/pages/      # Overview, Reserves, Production, Historic, Risk, Command, Fleet, MineDetail, Login
│  ├─ src/components/ # Sidebar (rail), Layout, SimulatorPanel (log export), RiskPanel, etc.
│  ├─ src/context/AuthContext.jsx
│  ├─ Dockerfile + nginx.conf
│  └─ vite.config.js
├─ backend/
│  ├─ app/main.py + routers/* + actions_store.py (SQLite)
│  ├─ requirements.txt
│  └─ Dockerfile
├─ docker-compose.yml
└─ README.md
```

---

## 9. License & Credits

SIH 2026 Prototype — Synthetic data preview · MOIL Ltd., Ministry of Steel, Govt. of India · Cartosat-3 · Sentinel-2 · DGMS MMR 1961
