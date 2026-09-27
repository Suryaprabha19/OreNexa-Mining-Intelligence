"""
Synthetic data generator for MOIL Reserve & Production Intelligence Dashboard.

Generates 4 datasets that stand in for real MOIL data sources:
  1. mines_master.csv        -> mine registry
  2. geological_survey.csv   -> drilling/geophysical grid points + satellite indices (features for reserve model)
  3. production_records.csv  -> daily/shift production history (features + target for shortfall model)
  4. equipment_logs.csv      -> equipment health/downtime history

The generation formulas are designed to encode realistic, learnable relationships
(grade/depth/geophysics drive reserves; downtime/weather/blasting delays drive shortfalls)
so the downstream ML models have real signal to learn, not pure noise.
"""
import numpy as np
import pandas as pd
from pathlib import Path

RNG = np.random.default_rng(42)

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True, parents=True)

# ---------------------------------------------------------------------------
# 1. Mines master (real MOIL operating belt: Balaghat MP + Nagpur-Bhandara MH)
# ---------------------------------------------------------------------------
MINES = [
    dict(mine_id="MN01", mine_name="Balaghat Mine",  state="Madhya Pradesh", latitude=21.805, longitude=80.184, mine_type="Underground", active_since=1908),
    dict(mine_id="MN02", mine_name="Ukwa Mine",      state="Madhya Pradesh", latitude=21.752, longitude=80.151, mine_type="Underground", active_since=1965),
    dict(mine_id="MN03", mine_name="Munsar Mine",    state="Madhya Pradesh", latitude=21.699, longitude=80.252, mine_type="Opencast",    active_since=1974),
    dict(mine_id="MN04", mine_name="Gumgaon Mine",   state="Maharashtra",    latitude=21.048, longitude=79.152, mine_type="Underground", active_since=1912),
    dict(mine_id="MN05", mine_name="Kandri Mine",    state="Maharashtra",    latitude=21.252, longitude=79.096, mine_type="Opencast",    active_since=1958),
    dict(mine_id="MN06", mine_name="Chikla Mine",    state="Maharashtra",    latitude=21.347, longitude=79.301, mine_type="Underground", active_since=1930),
]
mines_df = pd.DataFrame(MINES)
mines_df.to_csv(DATA_DIR / "mines_master.csv", index=False)

ROCK_TYPES = ["Gondite", "Kodurite", "Psilomelane", "Laterite Capping"]


def gen_geological_survey(n_points_per_mine=120):
    rows = []
    grid_id = 1
    for m in MINES:
        for _ in range(n_points_per_mine):
            lat = m["latitude"] + RNG.normal(0, 0.02)
            lon = m["longitude"] + RNG.normal(0, 0.02)
            depth_m = np.clip(RNG.normal(180, 70), 20, 500)
            ore_grade_pct = np.clip(RNG.normal(38, 8), 10, 54)  # Mn %
            rock_type = RNG.choice(ROCK_TYPES, p=[0.45, 0.25, 0.2, 0.1])
            drilling_confidence = np.clip(RNG.beta(2, 2), 0.05, 0.99)  # how well-explored this cell is
            magnetic_anomaly_index = np.clip(RNG.normal(50, 20), 0, 100)  # geophysical proxy

            # Satellite / space-tech derived surface indicators
            soil_moisture_pct = np.clip(RNG.normal(22, 6) + 0.05 * ore_grade_pct, 2, 55)
            ndvi = np.clip(RNG.normal(0.42, 0.12) - 0.002 * ore_grade_pct, 0.02, 0.9)  # sparser veg over exposed ore/capping
            land_surface_temp_c = np.clip(RNG.normal(32, 4) + 0.03 * ore_grade_pct, 15, 48)
            rainfall_mm_monthly = np.clip(RNG.normal(110, 40), 0, 400)

            # Ground-truth reserve (what confirmed drilling would eventually show) -
            # primarily geology/geophysics driven, secondarily corroborated by satellite proxies.
            base = 8000
            reserve = (
                base
                * (ore_grade_pct / 38) ** 1.4
                * (depth_m / 180) ** 0.6
                * (0.6 + 0.4 * drilling_confidence)
                * (0.7 + 0.006 * magnetic_anomaly_index)
                * (0.85 + 0.15 * (soil_moisture_pct / 22))
                * (0.9 + 0.002 * (48 - land_surface_temp_c))
            )
            reserve *= RNG.lognormal(mean=0, sigma=0.18)  # noise
            reserve = max(500, reserve)

            rows.append(dict(
                grid_id=f"G{grid_id:04d}", mine_id=m["mine_id"], latitude=round(lat, 5), longitude=round(lon, 5),
                depth_m=round(depth_m, 1), ore_grade_pct=round(ore_grade_pct, 2), rock_type=rock_type,
                drilling_confidence=round(drilling_confidence, 3), magnetic_anomaly_index=round(magnetic_anomaly_index, 1),
                soil_moisture_pct=round(soil_moisture_pct, 2), ndvi=round(ndvi, 3),
                land_surface_temp_c=round(land_surface_temp_c, 2), rainfall_mm_monthly=round(rainfall_mm_monthly, 1),
                confirmed_reserve_tonnes=round(reserve, 0),
            ))
            grid_id += 1
    return pd.DataFrame(rows)


def gen_production_and_equipment(n_days=730):
    prod_rows, eq_rows = [], []
    dates = pd.date_range(end=pd.Timestamp.today().normalize(), periods=n_days, freq="D")
    equip_types = ["Excavator", "Dumper", "Drill Rig", "Loader", "Conveyor"]

    for m in MINES:
        base_planned = RNG.uniform(280, 520)  # tonnes/day baseline capacity
        equip_ids = [f"{m['mine_id']}-EQ{i:02d}" for i in range(1, 9)]
        equip_type_map = {eid: equip_types[i % len(equip_types)] for i, eid in enumerate(equip_ids)}
        equip_age = {eid: RNG.uniform(0.5, 15) for eid in equip_ids}
        # Temporal wear-and-tear state: builds up with heavy use, resets after a
        # breakdown (repair) or scheduled maintenance. This is what gives the
        # equipment-failure LSTM real sequential signal to learn, rather than a
        # memoryless per-day coin-flip that only depends on static age.
        equip_wear = {eid: RNG.uniform(0, 15) for eid in equip_ids}
        equip_maint_due = {eid: int(RNG.uniform(3, 18)) for eid in equip_ids}
        # Different mines have different on-site maintenance capacity (older/remote
        # opencast sites service equipment less promptly than well-staffed underground
        # operations) - this gives the equipment-reallocation GA a genuinely uneven
        # problem to solve instead of a perfectly symmetric one. Munsar (opencast,
        # smaller crew) runs a consistently tighter maintenance bay than the rest.
        if m["mine_id"] == "MN03":
            mine_service_prob = 0.06
        else:
            mine_service_prob = float(np.clip(RNG.normal(0.22, 0.05), 0.14, 0.32))

        for d in dates:
            month = d.month
            monsoon = 1.0 if month in (6, 7, 8, 9) else 0.0
            rainfall_mm = np.clip(RNG.normal(18 if monsoon else 2, 10 if monsoon else 3), 0, 150)
            temperature_c = np.clip(RNG.normal(34 if month in (4, 5) else 27, 4), 15, 46)
            humidity_pct = np.clip(RNG.normal(75 if monsoon else 45, 10), 20, 98)
            labour_availability_pct = np.clip(RNG.normal(93, 6), 55, 100)

            day_downtime = 0.0
            day_breakdown = 0
            for eid in equip_ids:
                overdue_days = max(0, -equip_maint_due[eid])
                fail_prob = np.clip(
                    0.004
                    + equip_age[eid] * 0.001           # older units fail more often
                    + equip_wear[eid] * 0.0015          # accumulated recent stress
                    + overdue_days * 0.009,             # skipped maintenance compounds risk sharply
                    0.002, 0.7,
                )
                breakdown = RNG.random() < fail_prob
                hours_operated = np.clip(RNG.normal(9, 2), 0, 16) if not breakdown else np.clip(RNG.normal(3, 2), 0, 8)
                downtime_hours = 0.0 if not breakdown else np.clip(RNG.normal(5, 2), 0.5, 16)
                maintenance_due_in_days = equip_maint_due[eid]

                eq_rows.append(dict(
                    date=d.date().isoformat(), mine_id=m["mine_id"], equipment_id=eid,
                    equipment_type=equip_type_map[eid], age_years=round(equip_age[eid], 1),
                    hours_operated=round(hours_operated, 1), breakdown_flag=int(breakdown),
                    downtime_hours=round(downtime_hours, 1), maintenance_due_in_days=maintenance_due_in_days,
                ))
                day_downtime += downtime_hours
                day_breakdown += int(breakdown)

                # Advance wear/maintenance state for tomorrow.
                equip_wear[eid] = equip_wear[eid] * 0.9 + hours_operated * 0.35
                equip_maint_due[eid] -= 1
                if breakdown:
                    equip_wear[eid] *= 0.25              # a breakdown forces a repair -> wear resets down
                    equip_maint_due[eid] = int(RNG.uniform(8, 20))
                elif equip_maint_due[eid] <= 0 and RNG.random() < mine_service_prob:
                    # Overdue for scheduled maintenance; each day it's overdue there's a
                    # chance the crew actually gets to it. Until then it keeps accumulating
                    # overdue days (equip_maint_due goes further negative), raising risk -
                    # this is the clean, directly-observable temporal signal the LSTM learns.
                    equip_wear[eid] *= 0.4
                    equip_maint_due[eid] = int(RNG.uniform(8, 20))

            blasting_delay_hours = np.clip(RNG.exponential(1.2) + (2.5 if rainfall_mm > 40 else 0), 0, 14)
            planned_tonnes = base_planned * (1 + 0.05 * np.sin(d.dayofyear / 58))

            loss_frac = (
                0.012 * day_downtime
                + 0.02 * blasting_delay_hours
                + 0.006 * max(0, rainfall_mm - 20)
                + 0.004 * max(0, temperature_c - 38)
                + 0.01 * max(0, 90 - labour_availability_pct)
            )
            loss_frac = np.clip(loss_frac, 0, 0.85)
            actual_tonnes = planned_tonnes * (1 - loss_frac) * RNG.normal(1, 0.03)
            actual_tonnes = max(0, actual_tonnes)
            shortfall_tonnes = max(0, planned_tonnes - actual_tonnes)
            shortfall_flag = int(actual_tonnes < 0.9 * planned_tonnes)

            prod_rows.append(dict(
                date=d.date().isoformat(), mine_id=m["mine_id"],
                planned_tonnes=round(planned_tonnes, 1), actual_tonnes=round(actual_tonnes, 1),
                shortfall_tonnes=round(shortfall_tonnes, 1), shortfall_flag=shortfall_flag,
                equipment_downtime_hours=round(day_downtime, 1), equipment_breakdowns=day_breakdown,
                blasting_delay_hours=round(blasting_delay_hours, 2), rainfall_mm=round(rainfall_mm, 1),
                temperature_c=round(temperature_c, 1), humidity_pct=round(humidity_pct, 1),
                labour_availability_pct=round(labour_availability_pct, 1),
            ))
    return pd.DataFrame(prod_rows), pd.DataFrame(eq_rows)


if __name__ == "__main__":
    geo_df = gen_geological_survey()
    geo_df.to_csv(DATA_DIR / "geological_survey.csv", index=False)

    prod_df, eq_df = gen_production_and_equipment()
    prod_df.to_csv(DATA_DIR / "production_records.csv", index=False)
    eq_df.to_csv(DATA_DIR / "equipment_logs.csv", index=False)

    print("mines_master:", mines_df.shape)
    print("geological_survey:", geo_df.shape)
    print("production_records:", prod_df.shape)
    print("equipment_logs:", eq_df.shape)
