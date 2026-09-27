from fastapi import APIRouter, HTTPException, Query

from app.store import store
from app.dgms_compliance import evaluate_dgms_compliance
from app.schemas import DgmsAuditResponse

router = APIRouter(prefix="/api/dgms", tags=["dgms"])


@router.get("/compliance", response_model=DgmsAuditResponse)
def dgms_compliance(mine_id: str = Query(..., description="Statutory checks are always evaluated for one specific mine")):
    mine = store.mine_row(mine_id)
    if mine is None:
        raise HTTPException(404, f"Unknown mine_id={mine_id}")
    result = evaluate_dgms_compliance(mine_id)
    return DgmsAuditResponse(mine_id=mine_id, mine_name=mine.mine_name, **result)
