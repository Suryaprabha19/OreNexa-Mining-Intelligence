import datetime

import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.store import store
from app.schemas import ReserveGridPoint, ReserveSummary, LifeOfMineResult, LifeOfMinePoint

router = APIRouter(prefix="/api/reserves", tags=["reserves"])

LOM_SCENARIOS = {"current", "nameplate", "accelerated"}


@router.get("/map", response_model=List[ReserveGridPoint])
def reserve_map(mine_id: Optional[str] = Query(None)):
    df = store.geo
    if mine_id:
        df = df[df.mine_id == mine_id]
        if df.empty:
            raise HTTPException(404, f"No geological data for mine_id={mine_id}")
    out = df[[
        "grid_id", "mine_id", "latitude", "longitude", "predicted_reserve_tonnes",
        "drilling_confidence", "ore_grade_pct", "rock_type",
        "soil_moisture_pct", "ndvi", "land_surface_temp_c", "rainfall_mm_monthly", "magnetic_anomaly_index",
    ]].to_dict(orient="records")
    return out


@router.get("/summary", response_model=List[ReserveSummary])
def reserve_summary():
    results = []
    for _, m in store.mines.iterrows():
        sub = store.geo[store.geo.mine_id == m.mine_id]
        results.append(ReserveSummary(
            mine_id=m.mine_id,
            mine_name=m.mine_name,
            total_predicted_reserve_tonnes=round(float(sub.predicted_reserve_tonnes.sum()), 0),
            avg_confidence=round(float(sub.drilling_confidence.mean()), 3),
            grid_points=int(len(sub)),
        ))
    return results


@router.get("/life-of-mine", response_model=LifeOfMineResult)
def life_of_mine(mine_id: str = Query(...), scenario: str = Query("current")):
    """
    Reserve-exhaustion / Life-of-Mine forecast. Splits predicted reserves into
    a 'proved' vs 'probable' tranche using drilling_confidence as a stand-in
    for the real UNFC 111/121 classification (>=0.7 confidence = proved),
    then projects year-by-year depletion at three extraction-rate scenarios:
    current 30-day actual run-rate, nameplate (historical average planned
    tonnage), and an accelerated +20% expansion case.
    """
    mine = store.mine_row(mine_id)
    if mine is None:
        raise HTTPException(404, f"Unknown mine_id={mine_id}")
    if scenario not in LOM_SCENARIOS:
        raise HTTPException(400, f"scenario must be one of {sorted(LOM_SCENARIOS)}")

    geo_mine = store.geo[store.geo.mine_id == mine_id]
    total_reserves = float(geo_mine.predicted_reserve_tonnes.sum())
    proved_reserves = float(geo_mine[geo_mine.drilling_confidence >= 0.7].predicted_reserve_tonnes.sum())
    probable_reserves = total_reserves - proved_reserves

    prod = store.production[store.production.mine_id == mine_id].copy()
    prod["date"] = pd.to_datetime(prod["date"])
    recent = prod[prod.date >= prod.date.max() - pd.Timedelta(days=30)] if len(prod) else prod
    current_annual_rate = float(recent.actual_tonnes.mean() * 365) if len(recent) else 0.0
    nameplate_annual_rate = float(prod.planned_tonnes.mean() * 365) if len(prod) else 0.0
    accelerated_annual_rate = nameplate_annual_rate * 1.2

    rate_map = {"current": current_annual_rate, "nameplate": nameplate_annual_rate, "accelerated": accelerated_annual_rate}
    effective_rate = max(rate_map[scenario], 1.0)

    start_year = datetime.date.today().year
    timeline: List[LifeOfMinePoint] = []
    remaining_total = total_reserves
    remaining_proved = proved_reserves
    exhaustion_year_proved = None
    exhaustion_year_total = None

    for i in range(31):
        year = start_year + i
        if remaining_proved <= 0 and exhaustion_year_proved is None:
            exhaustion_year_proved = year
        if remaining_total <= 0 and exhaustion_year_total is None:
            exhaustion_year_total = year
        depletion_pct = round(((total_reserves - max(0.0, remaining_total)) / total_reserves) * 100, 1) if total_reserves else 0.0
        timeline.append(LifeOfMinePoint(
            year=year,
            total_reserves_tonnes=round(max(0.0, remaining_total), 0),
            proved_reserves_tonnes=round(max(0.0, remaining_proved), 0),
            accelerated_reserves_tonnes=round(max(0.0, total_reserves - accelerated_annual_rate * i), 0),
            depletion_pct=depletion_pct,
        ))
        if remaining_total <= 0 and i > 5:
            break
        remaining_proved = max(0.0, remaining_proved - effective_rate)
        remaining_total = max(0.0, remaining_total - effective_rate)

    lom_years = round(total_reserves / effective_rate, 1) if effective_rate else 0.0

    return LifeOfMineResult(
        mine_id=mine_id, mine_name=mine.mine_name,
        total_reserves_tonnes=round(total_reserves, 0),
        proved_reserves_tonnes=round(proved_reserves, 0),
        probable_reserves_tonnes=round(probable_reserves, 0),
        current_annual_rate_tonnes=round(current_annual_rate, 0),
        nameplate_annual_rate_tonnes=round(nameplate_annual_rate, 0),
        effective_annual_rate_tonnes=round(effective_rate, 0),
        life_of_mine_years=lom_years,
        exhaustion_year_proved=exhaustion_year_proved or (start_year + 30),
        exhaustion_year_total=exhaustion_year_total or (start_year + 30),
        scenario=scenario,
        timeline=timeline,
    )
