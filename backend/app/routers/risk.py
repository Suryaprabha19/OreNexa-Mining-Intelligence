from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
import pandas as pd
from app.store import store
from app.schemas import ShortfallRisk

router = APIRouter(prefix="/api/risk", tags=["risk"])


def _risk_level(prob: float) -> str:
    if prob >= 0.6:
        return "High"
    if prob >= 0.3:
        return "Medium"
    return "Low"


def _predict_for_row(row: pd.Series):
    date = pd.to_datetime(row["date"])
    features = pd.DataFrame([{
        "planned_tonnes": row["planned_tonnes"],
        "equipment_downtime_hours": row["equipment_downtime_hours"],
        "equipment_breakdowns": row["equipment_breakdowns"],
        "blasting_delay_hours": row["blasting_delay_hours"],
        "rainfall_mm": row["rainfall_mm"],
        "temperature_c": row["temperature_c"],
        "humidity_pct": row["humidity_pct"],
        "labour_availability_pct": row["labour_availability_pct"],
        "month": date.month,
        "is_monsoon": int(date.month in (6, 7, 8, 9)),
    }])[store.shortfall_features]

    prob = float(store.shortfall_classifier.predict_proba(features)[0, 1])
    tonnes = float(max(0, store.shortfall_regressor.predict(features)[0]))
    return prob, tonnes


@router.get("", response_model=List[ShortfallRisk])
def shortfall_risk(mine_id: Optional[str] = Query(None)):
    df = store.production.copy()
    df["date"] = pd.to_datetime(df["date"])
    results = []

    mines = store.mines[store.mines.mine_id == mine_id] if mine_id else store.mines
    if mines.empty:
        raise HTTPException(404, f"Unknown mine_id={mine_id}")

    for _, m in mines.iterrows():
        sub = df[df.mine_id == m.mine_id].sort_values("date")
        if sub.empty:
            continue
        latest = sub.iloc[-1]
        prob, tonnes = _predict_for_row(latest)
        results.append(ShortfallRisk(
            mine_id=m.mine_id,
            mine_name=m.mine_name,
            date=latest.date.date().isoformat(),
            shortfall_probability=round(prob, 3),
            predicted_shortfall_tonnes=round(tonnes, 1),
            risk_level=_risk_level(prob),
            contributing_factors={
                "equipment_downtime_hours": float(latest.equipment_downtime_hours),
                "blasting_delay_hours": float(latest.blasting_delay_hours),
                "rainfall_mm": float(latest.rainfall_mm),
                "labour_availability_pct": float(latest.labour_availability_pct),
            },
        ))
    return results
