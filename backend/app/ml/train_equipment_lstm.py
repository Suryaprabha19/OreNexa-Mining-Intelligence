"""
Equipment Failure Forecasting (LSTM)
--------------------------------------
Per the brief: "treat dumpers, shovels, and drill rigs as data points... use
time-series forecasting (LSTM) on past maintenance logs to predict when a
piece of critical machinery is likely to fail."

For every piece of equipment we build a rolling window of its last WINDOW days
of operating history (hours operated, downtime hours, days until scheduled
maintenance, whether it broke down that day) and train an LSTM to predict
whether it will suffer a breakdown in the following HORIZON days. Equipment
age is folded in as a static feature concatenated onto the LSTM's final
hidden state before the classification head.

This is a genuinely trained sequence model (not a lookup table) but kept
small/CPU-friendly: 1-layer LSTM, hidden size 24-32, ~20 epochs is enough to
learn clear signal because the synthetic failure process is itself a function
of age + accumulated wear + skipped maintenance (see data_gen.py).
"""
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score

DATA_DIR = Path(__file__).parent.parent / "data"
MODEL_DIR = Path(__file__).parent / "artifacts"
MODEL_DIR.mkdir(exist_ok=True, parents=True)

WINDOW = 14     # days of history fed into the LSTM
HORIZON = 7     # predict breakdown within the next N days
SEQ_FEATURES = ["hours_operated", "downtime_hours", "maintenance_due_in_days", "breakdown_flag"]


class EquipmentLSTM(nn.Module):
    def __init__(self, n_seq_features=4, hidden_size=24, n_static=1):
        super().__init__()
        self.lstm = nn.LSTM(input_size=n_seq_features, hidden_size=hidden_size, batch_first=True)
        self.head = nn.Sequential(
            nn.Linear(hidden_size + n_static, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
        )

    def forward(self, seq, static):
        _, (h_n, _) = self.lstm(seq)
        h = h_n[-1]  # (batch, hidden)
        x = torch.cat([h, static], dim=1)
        return self.head(x).squeeze(-1)


def _build_sequences(df: pd.DataFrame):
    """Turns the raw equipment log into (sequence, static, label) training examples."""
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])

    # Normalize sequence features to comparable scales up front.
    norm = df.copy()
    norm["hours_operated"] = norm["hours_operated"] / 16.0
    norm["downtime_hours"] = norm["downtime_hours"] / 16.0
    norm["maintenance_due_in_days"] = norm["maintenance_due_in_days"].clip(-60, 90) / 90.0

    seqs, statics, labels, meta = [], [], [], []
    for eid, g in norm.groupby("equipment_id"):
        g = g.sort_values("date").reset_index(drop=True)
        raw = df[df.equipment_id == eid].sort_values("date").reset_index(drop=True)
        age = g["age_years"].iloc[0] / 15.0
        n = len(g)
        for i in range(WINDOW, n - HORIZON):
            window = g.loc[i - WINDOW:i - 1, SEQ_FEATURES].values.astype(np.float32)
            future_breakdown = raw.loc[i:i + HORIZON - 1, "breakdown_flag"].max()
            seqs.append(window)
            statics.append([age])
            labels.append(float(future_breakdown))
            meta.append((eid, raw.loc[i - 1, "date"]))
    return (
        np.array(seqs, dtype=np.float32),
        np.array(statics, dtype=np.float32),
        np.array(labels, dtype=np.float32),
        meta,
    )


def train(epochs=20, batch_size=1024, lr=2e-3):
    df = pd.read_csv(DATA_DIR / "equipment_logs.csv")
    X_seq, X_static, y, meta = _build_sequences(df)

    idx = np.arange(len(y))
    idx_train, idx_test = train_test_split(idx, test_size=0.15, random_state=42, stratify=y)

    device = "cpu"
    model = EquipmentLSTM(hidden_size=32).to(device)
    opt = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-5)
    scheduler = torch.optim.lr_scheduler.StepLR(opt, step_size=8, gamma=0.5)
    # Class imbalance: breakdowns are rare, so weight the positive class up.
    pos_weight = torch.tensor([(y == 0).sum() / max(1, (y == 1).sum())], dtype=torch.float32)
    loss_fn = nn.BCEWithLogitsLoss(pos_weight=pos_weight)

    Xs_train = torch.tensor(X_seq[idx_train])
    Xt_train = torch.tensor(X_static[idx_train])
    y_train = torch.tensor(y[idx_train])

    n = len(idx_train)
    for epoch in range(epochs):
        model.train()
        perm = torch.randperm(n)
        total_loss = 0.0
        for start in range(0, n, batch_size):
            batch_idx = perm[start:start + batch_size]
            opt.zero_grad()
            logits = model(Xs_train[batch_idx], Xt_train[batch_idx])
            loss = loss_fn(logits, y_train[batch_idx])
            loss.backward()
            opt.step()
            total_loss += loss.item() * len(batch_idx)
        scheduler.step()
        print(f"  epoch {epoch+1}/{epochs} - loss {total_loss/n:.4f}")

    model.eval()
    with torch.no_grad():
        logits = model(torch.tensor(X_seq[idx_test]), torch.tensor(X_static[idx_test]))
        proba = torch.sigmoid(logits).numpy()
    auc = roc_auc_score(y[idx_test], proba)
    acc = accuracy_score(y[idx_test], (proba > 0.5).astype(int))
    print(f"Equipment LSTM -> AUC: {auc:.3f} | Acc: {acc:.3f} | positive rate: {y.mean():.3f}")

    torch.save({
        "state_dict": model.state_dict(),
        "window": WINDOW,
        "horizon": HORIZON,
        "seq_features": SEQ_FEATURES,
    }, MODEL_DIR / "equipment_lstm.pt")

    return {"auc": round(float(auc), 3), "accuracy": round(float(acc), 3), "positive_rate": round(float(y.mean()), 4)}


if __name__ == "__main__":
    train()
