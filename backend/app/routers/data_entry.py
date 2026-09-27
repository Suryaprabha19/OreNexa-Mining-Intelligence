"""
Manual data-entry endpoints:

  - POST /api/production/actuals  - a supervisor logs today's real production
    figures (actual tonnes, downtime, delays, weather actually observed).
    Persisted to SQLite (manual_data_store.py) and patched into the live
    in-memory production frame immediately, so /api/production/trend,
    /api/risk, /api/recommendations, etc. reflect it on the very next request
    with no backend restart needed.
  - GET  /api/production/actuals  - list what's been manually logged.
  - POST /api/production/targets  - a planner sets next month's target tonnage
    for a mine, distinct from the synthetic "planned_tonnes" baseline.
  - GET  /api/production/targets  - list targets that have been set.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
import re

from app.store import store
from app.schemas import DailyActualIn, DailyActualOut, MonthlyTargetIn, MonthlyTargetOut
from app import manual_data_store

router = APIRouter(prefix="/api/production", tags=["data-entry"])

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
MONTH_RE = re.compile(r"^\d{4}-\d{2}$")


def _require_mine(mine_id: str):
    if store.mine_row(mine_id) is None:
        raise HTTPException(404, f"Unknown mine_id={mine_id}")


@router.post("/actuals", response_model=DailyActualOut)
def add_daily_actual(payload: DailyActualIn):
    _require_mine(payload.mine_id)
    if not DATE_RE.match(payload.date):
        raise HTTPException(400, "date must be in YYYY-MM-DD format")
    if payload.actual_tonnes < 0:
        raise HTTPException(400, "actual_tonnes cannot be negative")

    saved = store.record_daily_actual(payload.model_dump())
    return DailyActualOut(**saved)


@router.get("/actuals", response_model=List[DailyActualOut])
def list_daily_actuals(mine_id: Optional[str] = Query(None)):
    if mine_id:
        _require_mine(mine_id)
    rows = manual_data_store.get_all_daily_actuals(mine_id)
    return [DailyActualOut(**r) for r in rows]


@router.post("/targets", response_model=MonthlyTargetOut)
def set_monthly_target(payload: MonthlyTargetIn):
    _require_mine(payload.mine_id)
    if not MONTH_RE.match(payload.month):
        raise HTTPException(400, "month must be in YYYY-MM format")
    if payload.target_tonnes <= 0:
        raise HTTPException(400, "target_tonnes must be positive")

    saved = store.set_monthly_target(payload.mine_id, payload.month, payload.target_tonnes, payload.notes)
    return MonthlyTargetOut(**saved)


@router.get("/targets", response_model=List[MonthlyTargetOut])
def list_monthly_targets(mine_id: Optional[str] = Query(None)):
    if mine_id:
        _require_mine(mine_id)
    rows = manual_data_store.get_all_monthly_targets(mine_id)
    return [MonthlyTargetOut(**r) for r in rows]
