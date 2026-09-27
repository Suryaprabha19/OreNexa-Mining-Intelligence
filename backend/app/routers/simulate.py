from fastapi import APIRouter, HTTPException
import pandas as pd
from app.store import store
from app.schemas import SimulationRequest, SimulationResult, Recommendation
from app.recommend import generate_recommendations
from app.routers.risk import _risk_level

router = APIRouter(prefix="/api/simulate", tags=["simulate"])


@router.post("", response_model=SimulationResult)
def simulate(req: SimulationRequest):
    if store.mines[store.mines.mine_id == req.mine_id].empty:
        raise HTTPException(404, f"Unknown mine_id={req.mine_id}")

    today = pd.Timestamp.today()
    features = pd.DataFrame([{
        "planned_tonnes": req.planned_tonnes,
        "equipment_downtime_hours": req.equipment_downtime_hours,
        "equipment_breakdowns": req.equipment_breakdowns,
        "blasting_delay_hours": req.blasting_delay_hours,
        "rainfall_mm": req.rainfall_mm,
        "temperature_c": req.temperature_c,
        "humidity_pct": req.humidity_pct,
        "labour_availability_pct": req.labour_availability_pct,
        "month": today.month,
        "is_monsoon": int(today.month in (6, 7, 8, 9)),
    }])[store.shortfall_features]

    prob = float(store.shortfall_classifier.predict_proba(features)[0, 1])
    tonnes = float(max(0, store.shortfall_regressor.predict(features)[0]))
    predicted_actual = max(0.0, req.planned_tonnes - tonnes)

    recs = generate_recommendations(req.dict(), prob, tonnes)

    return SimulationResult(
        shortfall_probability=round(prob, 3),
        predicted_shortfall_tonnes=round(tonnes, 1),
        predicted_actual_tonnes=round(predicted_actual, 1),
        risk_level=_risk_level(prob),
        recommendations=[Recommendation(**r) for r in recs],
    )
