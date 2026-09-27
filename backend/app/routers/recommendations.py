import hashlib
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
import pandas as pd
from app.store import store
from app.schemas import Recommendation, RecommendationActionRequest, RecommendationActionResponse
from app.recommend import generate_recommendations
from app.routers.risk import _predict_for_row
from app import actions_store

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


def _rec_id(mine_id: str, rule_key: str) -> str:
    """
    Stable identity for "this class of issue at this mine", independent of the
    day's exact numeric readings - so a supervisor's Authorize/Dismiss action
    persists meaningfully even as the underlying numbers change day to day.
    """
    raw = f"{mine_id}|{rule_key}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


@router.get("", response_model=List[Recommendation])
def recommendations(mine_id: Optional[str] = Query(None)):
    df = store.production.copy()
    df["date"] = pd.to_datetime(df["date"])

    if mine_id:
        mines = store.mines[store.mines.mine_id == mine_id]
        if mines.empty:
            raise HTTPException(404, f"Unknown mine_id={mine_id}")
    else:
        mines = store.mines

    saved_actions = actions_store.get_all()

    all_recs = []
    for _, m in mines.iterrows():
        sub = df[df.mine_id == m.mine_id].sort_values("date")
        if sub.empty:
            continue
        latest = sub.iloc[-1]
        prob, tonnes = _predict_for_row(latest)
        recs = generate_recommendations(latest.to_dict(), prob, tonnes)
        for r in recs:
            r["issue"] = f"[{m.mine_name}] {r['issue']}"
            rec_id = _rec_id(m.mine_id, r["rule_key"])
            r["rec_id"] = rec_id
            saved = saved_actions.get(rec_id)
            r["status"] = saved["status"] if saved else "pending"
            r["status_updated_at"] = saved["updated_at"] if saved else None
        all_recs.extend(recs)

    order = {"High": 0, "Medium": 1, "Low": 2}
    all_recs.sort(key=lambda r: order[r["priority"]])
    return all_recs


@router.post("/{rec_id}/action", response_model=RecommendationActionResponse)
def set_recommendation_action(rec_id: str, req: RecommendationActionRequest):
    if req.status == "pending":
        actions_store.clear_status(rec_id)
        return RecommendationActionResponse(rec_id=rec_id, status="pending", updated_at=None)

    if req.status not in actions_store.VALID_STATUSES:
        raise HTTPException(400, "status must be one of: authorized, dismissed, pending")

    result = actions_store.set_status(rec_id, req.status)
    return RecommendationActionResponse(rec_id=rec_id, status=result["status"], updated_at=result["updated_at"])
