from fastapi import APIRouter, Query
from typing import Optional, List
import pandas as pd
from app.store import store
from app.schemas import DashboardKPIs, Mine
from app.routers.risk import _predict_for_row, _risk_level

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/mines", response_model=List[Mine])
def list_mines():
    return store.mines.to_dict(orient="records")


@router.get("/dashboard/kpis", response_model=DashboardKPIs)
def dashboard_kpis(mine_id: Optional[str] = Query(None)):
    geo = store.geo if not mine_id else store.geo[store.geo.mine_id == mine_id]
    prod = store.production.copy()
    prod["date"] = pd.to_datetime(prod["date"])
    if mine_id:
        prod = prod[prod.mine_id == mine_id]

    recent = prod[prod.date >= prod.date.max() - pd.Timedelta(days=30)]
    shortfall_rate = float((recent.actual_tonnes < 0.9 * recent.planned_tonnes).mean() * 100) if len(recent) else 0.0
    avg_daily = float(recent.groupby("date").actual_tonnes.sum().mean()) if len(recent) else 0.0

    high_risk = 0
    mines = store.mines if not mine_id else store.mines[store.mines.mine_id == mine_id]
    for _, m in mines.iterrows():
        sub = prod[prod.mine_id == m.mine_id] if not mine_id else prod
        if sub.empty:
            continue
        latest = sub.sort_values("date").iloc[-1]
        prob, _ = _predict_for_row(latest)
        if _risk_level(prob) == "High":
            high_risk += 1

    return DashboardKPIs(
        mine_id=mine_id,
        total_predicted_reserve_tonnes=round(float(geo.predicted_reserve_tonnes.sum()), 0),
        avg_daily_production_tonnes=round(avg_daily, 1),
        shortfall_rate_pct=round(shortfall_rate, 1),
        active_high_risk_mines=high_risk,
        total_mines=int(len(store.mines)),
    )
