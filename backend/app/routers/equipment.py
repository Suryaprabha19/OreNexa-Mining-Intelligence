from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.store import store
from app.schemas import EquipmentHealth

router = APIRouter(prefix="/api/equipment", tags=["equipment"])


def _risk_level(score: float) -> str:
    if score >= 0.55:
        return "High"
    if score >= 0.3:
        return "Medium"
    return "Low"


@router.get("/health", response_model=List[EquipmentHealth])
def equipment_health(mine_id: Optional[str] = Query(None)):
    df = store.equipment_health
    if mine_id:
        df = df[df.mine_id == mine_id]
        if df.empty:
            raise HTTPException(404, f"No equipment data for mine_id={mine_id}")
    df = df.sort_values("breakdown_risk_7d", ascending=False)
    return [
        EquipmentHealth(
            equipment_id=r.equipment_id,
            mine_id=r.mine_id,
            equipment_type=r.equipment_type,
            age_years=r.age_years,
            overdue_days=int(r.overdue_days),
            breakdown_risk_7d=r.breakdown_risk_7d,
            risk_level=_risk_level(r.breakdown_risk_7d),
        )
        for r in df.itertuples()
    ]
