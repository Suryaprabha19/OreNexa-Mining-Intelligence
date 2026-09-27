from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import reserves, production, risk, recommendations, dashboard, simulate, equipment, optimize, telemetry, data_entry, dgms

app = FastAPI(
    title="MOIL Reserve & Production Intelligence API",
    description="AI/ML backend for manganese reserve estimation, production shortfall prediction, "
                "and corrective-action recommendations.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(reserves.router)
app.include_router(production.router)
app.include_router(risk.router)
app.include_router(recommendations.router)
app.include_router(simulate.router)
app.include_router(equipment.router)
app.include_router(optimize.router)
app.include_router(telemetry.router)
app.include_router(data_entry.router)
app.include_router(dgms.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "MOIL Reserve & Production Intelligence API"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}
