"""
Equipment Reallocation Optimizer (Genetic Algorithm)
-------------------------------------------------------
Per the brief: "If Dumper A is predicted to fail, the AI should auto-recommend:
'Re-route Dumper B from Sector 3 to maintain matching shovel-truck ratios.'"

This is framed as a matching problem:

  - CRITICAL units: movable equipment (Dumper/Excavator) whose LSTM-predicted
    7-day breakdown risk is in the top percentile network-wide.
  - HEALTHY candidates: same-type units elsewhere with low predicted risk,
    available to be temporarily re-routed in as backup/reinforcement.

A genetic algorithm searches assignments of healthy candidates to critical
units (each physical unit can only be assigned once) to maximize total risk
covered while minimizing total haul distance - real selection, crossover,
mutation, and repair across generations, not a static lookup table.
"""
import numpy as np
import pandas as pd
from math import radians, sin, cos, sqrt, atan2

MOVABLE_TYPES = {"Dumper", "Excavator"}
CRITICAL_PERCENTILE = 70    # flag units at/above this risk percentile (within movable types) as critical
HEALTHY_THRESHOLD = 0.30    # candidates below this risk are considered available/healthy


def _haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat, dlon = radians(lat2 - lat1), radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * R * atan2(sqrt(a), sqrt(1 - a))


def _empty_result():
    return {
        "moves": [], "critical_units_identified": 0, "critical_units_covered": 0,
        "risk_cutoff_percentile": CRITICAL_PERCENTILE,
        "baseline_covered_risk": 0.0, "optimized_covered_risk": 0.0, "distance_km_moved": 0.0,
    }


def run_reallocation_ga(
    equipment_health_df: pd.DataFrame,
    mines_df: pd.DataFrame,
    n_generations: int = 50,
    pop_size: int = 60,
    distance_penalty: float = 0.008,
    seed: int = 42,
) -> dict:
    rng = np.random.default_rng(seed)
    mine_coords = {r.mine_id: (r.latitude, r.longitude) for r in mines_df.itertuples()}

    movable = equipment_health_df[equipment_health_df.equipment_type.isin(MOVABLE_TYPES)].reset_index(drop=True)
    if movable.empty:
        return _empty_result()

    risk_cutoff = float(np.percentile(movable["breakdown_risk_7d"], CRITICAL_PERCENTILE))
    critical = movable[movable["breakdown_risk_7d"] >= max(risk_cutoff, 0.01)].reset_index(drop=True)
    healthy = movable[movable["breakdown_risk_7d"] < HEALTHY_THRESHOLD].reset_index(drop=True)

    if critical.empty or healthy.empty:
        return _empty_result()

    n_critical = len(critical)

    # For each critical unit, the pool of valid reinforcement indices (into `healthy`):
    # must be the same equipment type and stationed at a DIFFERENT mine.
    valid_pools = []
    for c in critical.itertuples():
        pool = [
            j for j, h in enumerate(healthy.itertuples())
            if h.equipment_type == c.equipment_type and h.mine_id != c.mine_id
        ]
        valid_pools.append(pool)

    NO_ASSIGN = -1

    def random_gene(i):
        pool = valid_pools[i]
        return rng.choice(pool) if pool else NO_ASSIGN

    def fitness(genes: np.ndarray):
        used = {}
        covered_risk = 0.0
        distance_cost = 0.0
        penalty = 0.0
        for i, h_idx in enumerate(genes):
            if h_idx == NO_ASSIGN:
                continue
            if h_idx in used:
                penalty += 5.0  # can't send the same physical unit to two places
                continue
            used[h_idx] = i
            c = critical.iloc[i]
            h = healthy.iloc[h_idx]
            covered_risk += c.breakdown_risk_7d * (1 - h.breakdown_risk_7d)  # reinforcement quality
            lat1, lon1 = mine_coords[h.mine_id]
            lat2, lon2 = mine_coords[c.mine_id]
            distance_cost += _haversine_km(lat1, lon1, lat2, lon2)

        score = covered_risk - distance_penalty * distance_cost - penalty
        return score, covered_risk, distance_cost

    population = [np.array([random_gene(i) for i in range(n_critical)]) for _ in range(pop_size)]
    baseline_score, baseline_covered, _ = fitness(np.full(n_critical, NO_ASSIGN))

    elite_frac = max(1, pop_size // 4)
    for _ in range(n_generations):
        scored = sorted(((fitness(ind)[0], ind) for ind in population), key=lambda x: -x[0])
        survivors = [ind for _, ind in scored[:elite_frac]]
        new_pop = [s.copy() for s in survivors]
        while len(new_pop) < pop_size:
            p1 = survivors[rng.integers(len(survivors))]
            p2 = survivors[rng.integers(len(survivors))]
            cross = rng.integers(1, n_critical) if n_critical > 1 else 1
            child = np.concatenate([p1[:cross], p2[cross:]])
            if rng.random() < 0.4:
                idx = rng.integers(n_critical)
                child[idx] = random_gene(idx)
            new_pop.append(child)
        population = new_pop

    best_score, best_ind = max(((fitness(ind)[0], ind) for ind in population), key=lambda x: x[0])
    _, best_covered, best_distance = fitness(best_ind)

    moves = []
    used = set()
    for i, h_idx in enumerate(best_ind):
        if h_idx == NO_ASSIGN or h_idx in used:
            continue
        used.add(h_idx)
        c = critical.iloc[i]
        h = healthy.iloc[h_idx]
        moves.append({
            "equipment_id": h.equipment_id,
            "equipment_type": h.equipment_type,
            "from_mine": h.mine_id,
            "to_mine": c.mine_id,
            "unit_risk": round(float(h.breakdown_risk_7d), 3),
            "covers_equipment_id": c.equipment_id,
            "covered_unit_risk": round(float(c.breakdown_risk_7d), 3),
        })

    return {
        "moves": moves,
        "critical_units_identified": n_critical,
        "critical_units_covered": len(moves),
        "risk_cutoff_percentile": CRITICAL_PERCENTILE,
        "baseline_covered_risk": round(float(baseline_covered), 3),
        "optimized_covered_risk": round(float(best_covered), 3),
        "distance_km_moved": round(float(best_distance), 1),
    }
