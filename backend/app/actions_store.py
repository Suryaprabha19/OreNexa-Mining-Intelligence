"""
Lightweight shared persistence for recommendation actions (Authorize/Dismiss).
Uses SQLite (stdlib, no new dependency) so the state survives page refreshes
and is visible to anyone else hitting the same backend instance - a proper
multi-user deployment would swap this for Postgres/etc, but the interface
(get/set/clear by rec_id) would stay the same.
"""
import sqlite3
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Dict

DB_PATH = Path(__file__).parent / "state" / "actions.db"
DB_PATH.parent.mkdir(exist_ok=True, parents=True)

VALID_STATUSES = {"authorized", "dismissed"}


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS recommendation_actions (
            rec_id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    return conn


def get_all() -> Dict[str, dict]:
    conn = _get_conn()
    rows = conn.execute("SELECT rec_id, status, updated_at FROM recommendation_actions").fetchall()
    conn.close()
    return {rec_id: {"status": status, "updated_at": updated_at} for rec_id, status, updated_at in rows}


def get_one(rec_id: str) -> Optional[dict]:
    conn = _get_conn()
    row = conn.execute(
        "SELECT status, updated_at FROM recommendation_actions WHERE rec_id = ?", (rec_id,)
    ).fetchone()
    conn.close()
    if row is None:
        return None
    return {"status": row[0], "updated_at": row[1]}


def set_status(rec_id: str, status: str) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    conn = _get_conn()
    conn.execute(
        "INSERT INTO recommendation_actions (rec_id, status, updated_at) VALUES (?, ?, ?) "
        "ON CONFLICT(rec_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at",
        (rec_id, status, now),
    )
    conn.commit()
    conn.close()
    return {"status": status, "updated_at": now}


def clear_status(rec_id: str):
    conn = _get_conn()
    conn.execute("DELETE FROM recommendation_actions WHERE rec_id = ?", (rec_id,))
    conn.commit()
    conn.close()
