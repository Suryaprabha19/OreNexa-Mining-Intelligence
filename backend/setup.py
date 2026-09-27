"""
Run once after `pip install -r requirements.txt` to generate the synthetic
datasets and train all models:

    python setup.py

This creates:
    app/data/*.csv                       (mines, geological survey, production, equipment)
    app/ml/artifacts/*.joblib, *.pt       (trained reserve, shortfall, and equipment-LSTM models)
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app import data_gen  # noqa: E402


def main():
    print("== 1/4 Generating synthetic datasets ==")
    geo_df = data_gen.gen_geological_survey()
    geo_df.to_csv(data_gen.DATA_DIR / "geological_survey.csv", index=False)

    prod_df, eq_df = data_gen.gen_production_and_equipment()
    prod_df.to_csv(data_gen.DATA_DIR / "production_records.csv", index=False)
    eq_df.to_csv(data_gen.DATA_DIR / "equipment_logs.csv", index=False)
    print(f"   mines: {len(data_gen.mines_df)} | geo points: {len(geo_df)} | "
          f"production rows: {len(prod_df)} | equipment rows: {len(eq_df)}")

    print("\n== 2/4 Training reserve estimation model ==")
    from app.ml import train_reserve_model
    print("  ", train_reserve_model.train())

    print("\n== 3/4 Training production shortfall models ==")
    from app.ml import train_shortfall_model
    print("  ", train_shortfall_model.train())

    print("\n== 4/4 Training equipment failure LSTM ==")
    from app.ml import train_equipment_lstm
    print("  ", train_equipment_lstm.train())

    print("\nSetup complete. Start the API with:  uvicorn app.main:app --reload --port 8010")


if __name__ == "__main__":
    main()
