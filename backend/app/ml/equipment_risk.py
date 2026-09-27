"""
Inference-time wrapper around the trained equipment LSTM.
Blends the learned sequence model with the known-strong overdue-maintenance
signal (verified empirically: units chronically overdue break down far more
often than well-serviced ones) so the exposed risk score is stable and
sensible even though the raw sequence model's AUC on this inherently noisy
process is modest (~0.57 - equipment failure prediction on real-world-like
data rarely gets much cleaner than this without richer sensor telemetry).

Uses each unit's FULL available history (not just a recent window) for the
chronic-condition signal, since individual breakdown/maintenance events are
rare per unit - a short recent window is too noisy to reliably separate a
chronically under-serviced mine from a temporarily fine one.
"""
import numpy as np
import pandas as pd
import torch
from pathlib import Path
from app.ml.train_equipment_lstm import EquipmentLSTM, SEQ_FEATURES, WINDOW

ARTIFACT_DIR = Path(__file__).parent / "artifacts"


class EquipmentRiskModel:
    def __init__(self):
        ckpt = torch.load(ARTIFACT_DIR / "equipment_lstm.pt", map_location="cpu", weights_only=False)
        self.window = ckpt["window"]
        self.model = EquipmentLSTM(hidden_size=32)
        self.model.load_state_dict(ckpt["state_dict"])
        self.model.eval()

    def _rule_overdue_score(self, overdue_days: float) -> float:
        # Monotonic, saturating overdue risk score in [0, 1].
        return float(np.clip(overdue_days / 25.0, 0, 1))

    def predict_latest(self, equipment_df: pd.DataFrame) -> pd.DataFrame:
        """
        equipment_df: full equipment_logs for ALL equipment.
        Returns one row per equipment_id with its current breakdown risk (next 7 days).
        """
        df = equipment_df.copy()
        df["date"] = pd.to_datetime(df["date"])
        results = []

        for eid, g in df.groupby("equipment_id"):
            g = g.sort_values("date").reset_index(drop=True)
            if len(g) < self.window:
                continue
            window = g.tail(self.window).copy()
            seq = window[SEQ_FEATURES].values.astype(np.float32)
            seq[:, 0] /= 16.0
            seq[:, 1] /= 16.0
            seq[:, 2] = np.clip(seq[:, 2], -60, 90) / 90.0
            age = g["age_years"].iloc[-1] / 15.0

            with torch.no_grad():
                logit = self.model(
                    torch.tensor(seq).unsqueeze(0),
                    torch.tensor([[age]], dtype=torch.float32),
                )
                lstm_proba = float(torch.sigmoid(logit).item())

            overdue_days = max(0, -int(g["maintenance_due_in_days"].iloc[-1]))
            # Chronic condition matters more than a single noisy snapshot day.
            # Individual breakdown/maintenance events are rare per unit, so even
            # a 30-day window is too short to reliably separate a chronically
            # under-serviced mine from a temporarily fine one - use the unit's
            # full available history instead.
            trailing = g["maintenance_due_in_days"].apply(lambda x: max(0, -x)).mean()
            rule_score = 0.4 * self._rule_overdue_score(overdue_days) + 0.6 * self._rule_overdue_score(trailing * 4)
            blended = 0.4 * lstm_proba + 0.6 * rule_score

            results.append({
                "equipment_id": eid,
                "mine_id": g["mine_id"].iloc[-1],
                "equipment_type": g["equipment_type"].iloc[-1],
                "age_years": float(g["age_years"].iloc[-1]),
                "overdue_days": overdue_days,
                "breakdown_risk_7d": round(blended, 3),
            })

        return pd.DataFrame(results)
