"""
Shared persistence for manually-entered operational data:

  1. Daily actuals  - what a mine supervisor logs at shift-end for "today"
     (actual tonnes produced, downtime, delays, weather actually observed).
     This is the piece the synthetic CSV pipeline had no place for: the CSVs
     in app/data/ are a frozen historical snapshot generated once at setup
     time, so there was previously no way to record what actually happened
     today and have it show up in the dashboard.

  2. Monthly targets - the tonnage a planner *wants* to hit next month, set
     deliberately through the UI rather than the synthetic "planned_tonnes"
     formula in data_gen.py (which is just a fixed baseline + seasonal wiggle
     and was never meant to represent a real management target).

Uses SQLite (stdlib, no new dependency) so both survive backend restarts and
are shared across anyone hitting the same backend instance - same pattern as
actions_store.py. A real multi-instance deployment would swap this for
Postgres/etc behind the same functions.
"""
import sqlite3
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional, Dict

DB_PATH = Path(__file__).parent / "state" / "manual_data.db"
DB_PATH.parent.mkdir(exist_ok=True, parents=True)


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS daily_actuals (
            mine_id TEXT NOT NULL,
            date TEXT NOT NULL,
            actual_tonnes REAL NOT NULL,
            equipment_downtime_hours REAL NOT NULL DEFAULT 0,
            equipment_breakdowns INTEGER NOT NULL DEFAULT 0,
            blasting_delay_hours REAL NOT NULL DEFAULT 0,
            rainfall_mm REAL NOT NULL DEFAULT 0,
            temperature_c REAL,
            humidity_pct REAL,
            labour_availability_pct REAL,
            notes TEXT,
            entered_at TEXT NOT NULL,
            PRIMARY KEY (mine_id, date)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS monthly_targets (
            mine_id TEXT NOT NULL,
            month TEXT NOT NULL,
            target_tonnes REAL NOT NULL,
            notes TEXT,
            entered_at TEXT NOT NULL,
            PRIMARY KEY (mine_id, month)
        )
    """)
    return conn


# ---------------------------------------------------------------------------
# Daily actuals
# ---------------------------------------------------------------------------

def upsert_daily_actual(
    mine_id: str,
    date: str,
    actual_tonnes: float,
    equipment_downtime_hours: float = 0.0,
    equipment_breakdowns: int = 0,
    blasting_delay_hours: float = 0.0,
    rainfall_mm: float = 0.0,
    temperature_c: Optional[float] = None,
    humidity_pct: Optional[float] = None,
    labour_availability_pct: Optional[float] = None,
    notes: Optional[str] = None,
) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    conn = _get_conn()
    conn.execute(
        """
        INSERT INTO daily_actuals (
            mine_id, date, actual_tonnes, equipment_downtime_hours, equipment_breakdowns,
            blasting_delay_hours, rainfall_mm, temperature_c, humidity_pct,
            labour_availability_pct, notes, entered_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(mine_id, date) DO UPDATE SET
            actual_tonnes = excluded.actual_tonnes,
            equipment_downtime_hours = excluded.equipment_downtime_hours,
            equipment_breakdowns = excluded.equipment_breakdowns,
            blasting_delay_hours = excluded.blasting_delay_hours,
            rainfall_mm = excluded.rainfall_mm,
            temperature_c = excluded.temperature_c,
            humidity_pct = excluded.humidity_pct,
            labour_availability_pct = excluded.labour_availability_pct,
            notes = excluded.notes,
            entered_at = excluded.entered_at
        """,
        (
            mine_id, date, actual_tonnes, equipment_downtime_hours, equipment_breakdowns,
            blasting_delay_hours, rainfall_mm, temperature_c, humidity_pct,
            labour_availability_pct, notes, now,
        ),
    )
    conn.commit()
    conn.close()
    return get_daily_actual(mine_id, date)


def get_daily_actual(mine_id: str, date: str) -> Optional[dict]:
    conn = _get_conn()
    row = conn.execute(
        "SELECT * FROM daily_actuals WHERE mine_id = ? AND date = ?", (mine_id, date)
    ).fetchone()
    cols = [d[0] for d in conn.execute("SELECT * FROM daily_actuals LIMIT 0").description] if row else None
    conn.close()
    if row is None:
        return None
    return dict(zip(cols, row))


def get_all_daily_actuals(mine_id: Optional[str] = None) -> List[dict]:
    conn = _get_conn()
    if mine_id:
        rows = conn.execute(
            "SELECT * FROM daily_actuals WHERE mine_id = ? ORDER BY date", (mine_id,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM daily_actuals ORDER BY mine_id, date").fetchall()
    cols = [d[0] for d in conn.execute("SELECT * FROM daily_actuals LIMIT 0").description]
    conn.close()
    return [dict(zip(cols, r)) for r in rows]


def delete_daily_actual(mine_id: str, date: str):
    conn = _get_conn()
    conn.execute("DELETE FROM daily_actuals WHERE mine_id = ? AND date = ?", (mine_id, date))
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Monthly targets
# ---------------------------------------------------------------------------

def upsert_monthly_target(mine_id: str, month: str, target_tonnes: float, notes: Optional[str] = None) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    conn = _get_conn()
    conn.execute(
        """
        INSERT INTO monthly_targets (mine_id, month, target_tonnes, notes, entered_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(mine_id, month) DO UPDATE SET
            target_tonnes = excluded.target_tonnes,
            notes = excluded.notes,
            entered_at = excluded.entered_at
        """,
        (mine_id, month, target_tonnes, notes, now),
    )
    conn.commit()
    conn.close()
    return get_monthly_target(mine_id, month)


def get_monthly_target(mine_id: str, month: str) -> Optional[dict]:
    conn = _get_conn()
    row = conn.execute(
        "SELECT * FROM monthly_targets WHERE mine_id = ? AND month = ?", (mine_id, month)
    ).fetchone()
    cols = [d[0] for d in conn.execute("SELECT * FROM monthly_targets LIMIT 0").description] if row else None
    conn.close()
    if row is None:
        return None
    return dict(zip(cols, row))


def get_all_monthly_targets(mine_id: Optional[str] = None) -> List[dict]:
    conn = _get_conn()
    if mine_id:
        rows = conn.execute(
            "SELECT * FROM monthly_targets WHERE mine_id = ? ORDER BY month", (mine_id,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM monthly_targets ORDER BY mine_id, month").fetchall()
    cols = [d[0] for d in conn.execute("SELECT * FROM monthly_targets LIMIT 0").description]
    conn.close()
    return [dict(zip(cols, r)) for r in rows]


def delete_monthly_target(mine_id: str, month: str):
    conn = _get_conn()
    conn.execute("DELETE FROM monthly_targets WHERE mine_id = ? AND month = ?", (mine_id, month))
    conn.commit()
    conn.close()
