"""
Loads datasets + trained models once at startup and exposes them to routers.
Also runs the reserve model's predictions across the geological grid once so
the map endpoint doesn't need to re-run inference on every request.
"""
import joblib
import pandas as pd
import calendar
from pathlib import Path

from app import manual_data_store

APP_DIR = Path(__file__).parent
DATA_DIR = APP_DIR / "data"
ARTIFACT_DIR = APP_DIR / "ml" / "artifacts"

REQUIRED_CSVS = ["mines_master.csv", "geological_survey.csv", "production_records.csv", "equipment_logs.csv"]
REQUIRED_MODELS = ["reserve_model.joblib", "shortfall_regressor.joblib", "shortfall_classifier.joblib", "equipment_lstm.pt"]


def _ensure_artifacts():
    """
    Self-healing bootstrap: if the synthetic datasets or trained models are
    missing (e.g. setup.py was never run, or only ran partway), generate/train
    them automatically on first API startup instead of crashing.
    """
    data_missing = not DATA_DIR.exists() or any(not (DATA_DIR / f).exists() for f in REQUIRED_CSVS)
    if data_missing:
        print("[bootstrap] Synthetic datasets missing -> generating now (first run)...")
        from app import data_gen
        geo_df = data_gen.gen_geological_survey()
        geo_df.to_csv(DATA_DIR / "geological_survey.csv", index=False)
        prod_df, eq_df = data_gen.gen_production_and_equipment()
        prod_df.to_csv(DATA_DIR / "production_records.csv", index=False)
        eq_df.to_csv(DATA_DIR / "equipment_logs.csv", index=False)
        print("[bootstrap] Datasets generated.")

    models_missing = not ARTIFACT_DIR.exists() or any(not (ARTIFACT_DIR / f).exists() for f in REQUIRED_MODELS)
    if models_missing:
        print("[bootstrap] Trained models missing -> training now (first run, ~1-2 min)...")
        from app.ml import train_reserve_model, train_shortfall_model, train_equipment_lstm
        train_reserve_model.train()
        train_shortfall_model.train()
        train_equipment_lstm.train()
        print("[bootstrap] Models trained.")


class Store:
    def __init__(self):
        _ensure_artifacts()
        self.mines = pd.read_csv(DATA_DIR / "mines_master.csv")
        self.geo = pd.read_csv(DATA_DIR / "geological_survey.csv")
        self.production = pd.read_csv(DATA_DIR / "production_records.csv")
        self.production["is_manual"] = False
        self.equipment = pd.read_csv(DATA_DIR / "equipment_logs.csv")

        # Manual, user-entered data (today's actuals + monthly targets) lives in
        # SQLite via manual_data_store.py, independent of the synthetic CSV
        # snapshot above. Merge it in now so every router sees a single combined
        # production frame, then keep it live-patched as new entries come in via
        # record_daily_actual()/set_monthly_target() without needing a restart.
        self._reload_targets()
        self._merge_manual_actuals()

        self.reserve_model = joblib.load(ARTIFACT_DIR / "reserve_model.joblib")
        sf_reg = joblib.load(ARTIFACT_DIR / "shortfall_regressor.joblib")
        sf_clf = joblib.load(ARTIFACT_DIR / "shortfall_classifier.joblib")
        self.shortfall_regressor = sf_reg["model"]
        self.shortfall_classifier = sf_clf["model"]
        self.shortfall_features = sf_reg["features"]

        from app.ml.equipment_risk import EquipmentRiskModel
        self.equipment_risk_model = EquipmentRiskModel()
        self._equipment_health = self.equipment_risk_model.predict_latest(self.equipment)

        self._predict_reserves()

    def _predict_reserves(self):
        feat_cols = [
            "depth_m", "ore_grade_pct", "drilling_confidence", "magnetic_anomaly_index",
            "soil_moisture_pct", "ndvi", "land_surface_temp_c", "rainfall_mm_monthly", "rock_type",
        ]
        preds = self.reserve_model.predict(self.geo[feat_cols])
        self.geo["predicted_reserve_tonnes"] = preds

    def mine_row(self, mine_id: str):
        row = self.mines[self.mines.mine_id == mine_id]
        if row.empty:
            return None
        return row.iloc[0]

    @property
    def equipment_health(self):
        return self._equipment_health

    # -----------------------------------------------------------------
    # Manual data: today's actuals + monthly targets
    # -----------------------------------------------------------------

    def _reload_targets(self):
        # Refresh the in-memory monthly-target lookup from SQLite.
        rows = manual_data_store.get_all_monthly_targets()
        self._targets = {(r["mine_id"], r["month"]): r["target_tonnes"] for r in rows}

    def target_for(self, mine_id: str, date_str: str):
        # Daily-equivalent planned tonnage derived from the monthly target that
        # covers this date, if one has been set (monthly total / days in that
        # month) - a monthly target should never be applied verbatim as a
        # single day's planned figure.
        year_str, month_str = date_str[:4], date_str[5:7]
        month_key = date_str[:7]
        monthly_total = self._targets.get((mine_id, month_key))
        if monthly_total is None:
            return None
        days_in_month = calendar.monthrange(int(year_str), int(month_str))[1]
        return monthly_total / days_in_month

    def monthly_target_total(self, mine_id: str, month: str):
        # The raw monthly total a planner entered for (mine_id, month), or None if unset.
        return self._targets.get((mine_id, month))

    def _merge_manual_actuals(self):
        # Overlay every manually-logged daily actual on top of self.production:
        # updates the row in place if that (mine_id, date) already exists in the
        # synthetic history, otherwise appends a new row (e.g. "today", which is
        # beyond the synthetic dataset's last generated day).
        for r in manual_data_store.get_all_daily_actuals():
            self._apply_manual_row(r)

    def _apply_manual_row(self, r: dict):
        mine_id, date = r["mine_id"], r["date"]
        planned = self.target_for(mine_id, date)
        if planned is None:
            existing = self.production[(self.production.mine_id == mine_id) & (self.production.date == date)]
            planned = float(existing.iloc[0].planned_tonnes) if not existing.empty else 0.0

        actual = float(r["actual_tonnes"])
        shortfall = max(0.0, planned - actual)
        new_row = {
            "date": date, "mine_id": mine_id,
            "planned_tonnes": round(planned, 1), "actual_tonnes": round(actual, 1),
            "shortfall_tonnes": round(shortfall, 1),
            "shortfall_flag": int(actual < 0.9 * planned) if planned else 0,
            "equipment_downtime_hours": r.get("equipment_downtime_hours") or 0.0,
            "equipment_breakdowns": r.get("equipment_breakdowns") or 0,
            "blasting_delay_hours": r.get("blasting_delay_hours") or 0.0,
            "rainfall_mm": r.get("rainfall_mm") or 0.0,
            "temperature_c": r.get("temperature_c") if r.get("temperature_c") is not None else 30.0,
            "humidity_pct": r.get("humidity_pct") if r.get("humidity_pct") is not None else 60.0,
            "labour_availability_pct": r.get("labour_availability_pct") if r.get("labour_availability_pct") is not None else 95.0,
            "is_manual": True,
        }

        mask = (self.production.mine_id == mine_id) & (self.production.date == date)
        if mask.any():
            for k, v in new_row.items():
                self.production.loc[mask, k] = v
        else:
            self.production = pd.concat([self.production, pd.DataFrame([new_row])], ignore_index=True)
        self.production = self.production.sort_values(["mine_id", "date"]).reset_index(drop=True)

    def record_daily_actual(self, payload: dict) -> dict:
        # Persist a supervisor's daily-actual entry to SQLite and patch it into
        # the live in-memory frame immediately (no restart needed).
        saved = manual_data_store.upsert_daily_actual(**payload)
        self._apply_manual_row(saved)
        return saved

    def set_monthly_target(self, mine_id: str, month: str, target_tonnes: float, notes: str = None) -> dict:
        # Persist a planner's monthly target to SQLite, refresh the lookup, and
        # re-apply it to any already-logged actuals that fall in that month.
        saved = manual_data_store.upsert_monthly_target(mine_id, month, target_tonnes, notes)
        self._reload_targets()
        for r in manual_data_store.get_all_daily_actuals(mine_id):
            if r["date"][:7] == month:
                self._apply_manual_row(r)
        return saved


store = Store()
