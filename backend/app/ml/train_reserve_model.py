"""
Reserve Estimation Model
-------------------------
Predicts confirmed-equivalent manganese reserve tonnage for a grid cell using
geological (grade, depth, rock type, geophysical anomaly, drilling confidence)
and satellite/space-tech surface indicators (soil moisture, NDVI, land surface
temperature, rainfall).

This lets MOIL extrapolate reserve estimates into areas that are only lightly
drilled (low drilling_confidence) by leaning on cells with similar geology +
surface signatures that ARE well explored -- i.e. it densifies the reserve map
without needing new physical drilling everywhere.
"""
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

DATA_DIR = Path(__file__).parent.parent / "data"
MODEL_DIR = Path(__file__).parent / "artifacts"
MODEL_DIR.mkdir(exist_ok=True, parents=True)

NUMERIC_FEATURES = [
    "depth_m", "ore_grade_pct", "drilling_confidence", "magnetic_anomaly_index",
    "soil_moisture_pct", "ndvi", "land_surface_temp_c", "rainfall_mm_monthly",
]
CATEGORICAL_FEATURES = ["rock_type"]
TARGET = "confirmed_reserve_tonnes"


def build_pipeline():
    preprocessor = ColumnTransformer([
        ("num", "passthrough", NUMERIC_FEATURES),
        ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
    ])
    model = RandomForestRegressor(
        n_estimators=300, max_depth=12, min_samples_leaf=3, random_state=42, n_jobs=-1
    )
    return Pipeline([("prep", preprocessor), ("model", model)])


def train():
    df = pd.read_csv(DATA_DIR / "geological_survey.csv")
    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    pipe = build_pipeline()
    pipe.fit(X_train, y_train)

    preds = pipe.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    mape = float(np.mean(np.abs((y_test - preds) / y_test)) * 100)

    print(f"Reserve model -> MAE: {mae:,.0f} t | R2: {r2:.3f} | MAPE: {mape:.1f}%")

    joblib.dump(pipe, MODEL_DIR / "reserve_model.joblib")

    metrics = {"mae_tonnes": round(mae, 1), "r2": round(r2, 3), "mape_pct": round(mape, 1)}
    return metrics


if __name__ == "__main__":
    train()
