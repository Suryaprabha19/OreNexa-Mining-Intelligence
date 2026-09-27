from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
import pandas as pd
from app.store import store
from app.schemas import ProductionTrendPoint

router = APIRouter(prefix="/api/production", tags=["production"])

AGG_COLS = [
    "planned_tonnes", "actual_tonnes", "shortfall_tonnes",
    "equipment_downtime_hours", "blasting_delay_hours", "rainfall_mm",
]


@router.get("/trend", response_model=List[ProductionTrendPoint])
def production_trend(mine_id: Optional[str] = Query(None), days: int = Query(90, ge=7, le=730)):
    df = store.production.copy()
    if mine_id:
        df = df[df.mine_id == mine_id]
        if df.empty:
            raise HTTPException(404, f"No production data for mine_id={mine_id}")
    else:
        agg = {c: "sum" if c in ("planned_tonnes", "actual_tonnes", "shortfall_tonnes") else "mean" for c in AGG_COLS}
        agg["is_manual"] = "max"
        df = df.groupby("date", as_index=False).agg(agg)

    df["date_dt"] = pd.to_datetime(df["date"])
    df = df.sort_values("date_dt").tail(days)
    return [
        ProductionTrendPoint(
            date=row.date_dt.date().isoformat(),
            planned_tonnes=round(float(row.planned_tonnes), 1),
            actual_tonnes=round(float(row.actual_tonnes), 1),
            shortfall_tonnes=round(float(row.shortfall_tonnes), 1),
            equipment_downtime_hours=round(float(row.equipment_downtime_hours), 1),
            blasting_delay_hours=round(float(row.blasting_delay_hours), 2),
            rainfall_mm=round(float(row.rainfall_mm), 1),
            target_tonnes=round(store.target_for(mine_id, row.date), 1) if mine_id and store.target_for(mine_id, row.date) is not None else None,
            is_manual=bool(row.is_manual) if "is_manual" in row._fields else False,
        )
        for row in df.itertuples()
    ]
