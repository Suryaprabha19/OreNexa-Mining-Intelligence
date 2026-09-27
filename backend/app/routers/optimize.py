from fastapi import APIRouter
from app.store import store
from app.schemas import ReallocationResult, ReallocationMove
from app.optimize_reallocation import run_reallocation_ga

router = APIRouter(prefix="/api/optimize", tags=["optimize"])


@router.get("/reallocate", response_model=ReallocationResult)
def reallocate_equipment():
    result = run_reallocation_ga(store.equipment_health, store.mines)
    mine_names = dict(zip(store.mines.mine_id, store.mines.mine_name))

    moves = [
        ReallocationMove(
            equipment_id=m["equipment_id"],
            equipment_type=m["equipment_type"],
            from_mine=m["from_mine"],
            from_mine_name=mine_names.get(m["from_mine"], m["from_mine"]),
            to_mine=m["to_mine"],
            to_mine_name=mine_names.get(m["to_mine"], m["to_mine"]),
            unit_risk=m["unit_risk"],
            covers_equipment_id=m["covers_equipment_id"],
            covered_unit_risk=m["covered_unit_risk"],
        )
        for m in result["moves"]
    ]

    if moves:
        summary = (
            f"{len(moves)} of {result['critical_units_identified']} at-risk units covered by "
            f"re-routing healthy equipment ({result['distance_km_moved']} km total haul)."
        )
    else:
        summary = "No equipment reallocation needed right now - fleet risk is currently well balanced across mines."

    return ReallocationResult(
        moves=moves,
        critical_units_identified=result["critical_units_identified"],
        critical_units_covered=result["critical_units_covered"],
        distance_km_moved=result["distance_km_moved"],
        summary=summary,
    )
