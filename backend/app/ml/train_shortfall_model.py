"""
Production Shortfall Prediction Model
--------------------------------------
Two models trained on daily mine-level production records:
  1. shortfall_regressor  -> predicts expected shortfall_tonnes for the next day given
     planned production and operating conditions (downtime, blasting delay, weather, labour).
  2. shortfall_classifier -> predicts probability of a "shortfall event" (actual < 90% of planned),
     used to drive the risk gauge / alerts on the dashboard.
"""
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score, roc_auc_score, accuracy_score

DATA_DIR = Path(__file__).parent.parent / "data"
MODEL_DIR = Path(__file__).parent / "artifacts"
MODEL_DIR.mkdir(exist_ok=True, parents=True)

FEATURES = [
    "planned_tonnes", "equipment_downtime_hours", "equipment_breakdowns",
    "blasting_delay_hours", "rainfall_mm", "temperature_c", "humidity_pct",
    "labour_availability_pct",
]


def _add_calendar_features(df):
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.month
    df["day_of_year"] = df["date"].dt.dayofyear
    df["is_monsoon"] = df["month"].isin([6, 7, 8, 9]).astype(int)
    return df


def train():
    df = pd.read_csv(DATA_DIR / "production_records.csv")
    df = _add_calendar_features(df)

    feats = FEATURES + ["month", "is_monsoon"]
    X = df[feats]
    y_reg = df["shortfall_tonnes"]
    y_clf = df["shortfall_flag"]

    X_train, X_test, yr_train, yr_test, yc_train, yc_test = train_test_split(
        X, y_reg, y_clf, test_size=0.2, random_state=42
    )

    reg = GradientBoostingRegressor(n_estimators=250, max_depth=3, learning_rate=0.06, random_state=42)
    reg.fit(X_train, yr_train)
    reg_preds = reg.predict(X_test)
    mae = mean_absolute_error(yr_test, reg_preds)
    r2 = r2_score(yr_test, reg_preds)

    clf = RandomForestClassifier(n_estimators=300, max_depth=8, min_samples_leaf=4, random_state=42, n_jobs=-1)
    clf.fit(X_train, yc_train)
    clf_proba = clf.predict_proba(X_test)[:, 1]
    clf_preds = clf.predict(X_test)
    auc = roc_auc_score(yc_test, clf_proba)
    acc = accuracy_score(yc_test, clf_preds)

    print(f"Shortfall regressor -> MAE: {mae:.1f} t | R2: {r2:.3f}")
    print(f"Shortfall classifier -> AUC: {auc:.3f} | Acc: {acc:.3f}")

    joblib.dump({"model": reg, "features": feats}, MODEL_DIR / "shortfall_regressor.joblib")
    joblib.dump({"model": clf, "features": feats}, MODEL_DIR / "shortfall_classifier.joblib")

    metrics = {
        "regressor": {"mae_tonnes": round(mae, 1), "r2": round(r2, 3)},
        "classifier": {"auc": round(auc, 3), "accuracy": round(acc, 3)},
    }
    return metrics


if __name__ == "__main__":
    train()
