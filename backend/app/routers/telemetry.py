"""
Command-center telemetry endpoint.
----------------------------------
Aggregates several existing model outputs into the single feed the KPI strip
needs: predicted yield vs target, shortfall risk, fleet utilization, and a
pit-water-level proxy.

Honesty note on "pit water level": there is no real IoT water-level sensor
here (MOIL's actual telemetry wasn't available for this build). What's shown
is an exponentially-smoothed function of the rainfall_mm feature already in
the production dataset - it behaves like a plausible accumulation/drainage
curve (spikes on heavy rain, decays afterward) and is a reasonable stand-in
for the kind of pit-inundation sensor feed a real deployment would plug in,
but it should not be read as an actual physical measurement.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import pandas as pd
from app.store import store
from app.routers.risk import _predict_for_row, _risk_level

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])

IDLE_HOURS_THRESHOLD = 7.0  # below this, a unit counts as "idling" rather than "active" for the day


def _fleet_summary(mine_id: Optional[str]):
    eq = store.equipment.copy()
    eq["date"] = pd.to_datetime(eq["date"])
    if mine_id:
        eq = eq[eq.mine_id == mine_id]
    latest_date = eq["date"].max()
    today = eq[eq["date"] == latest_date]

    down = int((today["breakdown_flag"] == 1).sum())
    idling = int(((today["breakdown_flag"] == 0) & (today["hours_operated"] < IDLE_HOURS_THRESHOLD)).sum())
    total = int(len(today))
    active = max(0, total - down - idling)
    utilization_pct = round((active / total) * 100, 1) if total else 0.0

    return {"active": active, "idling": idling, "down": down, "total": total, "utilization_pct": utilization_pct}


def _pit_water_level(mine_id: Optional[str]) -> float:
    prod = store.production.copy()
    prod["date"] = pd.to_datetime(prod["date"])
    if mine_id:
        prod = prod[prod.mine_id == mine_id]
    else:
        prod = prod.groupby("date", as_index=False)["rainfall_mm"].mean()
    series = prod.sort_values("date")["rainfall_mm"].tail(21).tolist()

    level = 0.0
    for rainfall in series:
        level = level * 0.72 + rainfall * 1.15  # simple accumulate-and-drain smoothing
    return round(level, 1)


@router.get("")
def telemetry(mine_id: Optional[str] = Query(None)):
    prod = store.production.copy()
    prod["date"] = pd.to_datetime(prod["date"])
    if mine_id:
        if store.mines[store.mines.mine_id == mine_id].empty:
            raise HTTPException(404, f"Unknown mine_id={mine_id}")
        sub = prod[prod.mine_id == mine_id].sort_values("date")
    else:
        sub = prod.groupby("date", as_index=False)[[
            "planned_tonnes", "actual_tonnes", "equipment_downtime_hours", "equipment_breakdowns",
            "blasting_delay_hours", "rainfall_mm", "temperature_c", "humidity_pct", "labour_availability_pct",
        ]].mean().sort_values("date")

    latest = sub.iloc[-1]
    prob, predicted_shortfall = _predict_for_row(latest)
    target = float(latest.planned_tonnes)
    predicted_yield = max(0.0, target - predicted_shortfall)

    return {
        "mine_id": mine_id,
        "predicted_yield_tonnes": round(predicted_yield, 1),
        "target_tonnes": round(target, 1),
        "yield_pct_of_target": round((predicted_yield / target) * 100, 1) if target else 0.0,
        "shortfall_risk_pct": round(prob * 100, 1),
        "risk_level": _risk_level(prob),
        "fleet": _fleet_summary(mine_id),
        "pit_water_level_mm": _pit_water_level(mine_id),
    }
