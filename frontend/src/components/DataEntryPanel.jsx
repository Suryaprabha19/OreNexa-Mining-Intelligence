import { useEffect, useState } from "react";
import { postDailyActual, postMonthlyTarget, getMonthlyTargets } from "../api/client";
import { fmtTonnes } from "../theme";

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthKey = (offsetMonths = 0) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offsetMonths);
  return d.toISOString().slice(0, 7); // YYYY-MM
};
const monthLabel = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
};

const ACTUAL_DEFAULTS = {
  date: todayISO(),
  actual_tonnes: "",
  equipment_downtime_hours: "",
  equipment_breakdowns: "",
  blasting_delay_hours: "",
  rainfall_mm: "",
};

// mineId / mineName: the globally-selected mine from the topbar dropdown, if any
// (it's null when "All Mines" is selected). mines: the full mine list, so this
// panel can pick its own mine independently of that dropdown - logging today's
// data or setting a target always needs one specific mine, so this component
// never just goes quiet waiting for the topbar to be changed.
export default function DataEntryPanel({ mineId, mineName, mines, onSaved }) {
  const [localMineId, setLocalMineId] = useState(mineId || mines?.[0]?.mine_id || "");

  // If the topbar selection changes to a specific mine, follow it. If it's
  // cleared back to "All Mines", keep whatever mine this panel already had
  // selected rather than losing it.
  useEffect(() => {
    if (mineId) setLocalMineId(mineId);
  }, [mineId]);
  useEffect(() => {
    if (!localMineId && mines?.length) setLocalMineId(mines[0].mine_id);
  }, [mines, localMineId]);

  const effectiveMineId = localMineId || mineId;
  const effectiveMineName = mines?.find((m) => m.mine_id === effectiveMineId)?.mine_name || mineName || "";

  const [actualForm, setActualForm] = useState(ACTUAL_DEFAULTS);
  const [savingActual, setSavingActual] = useState(false);
  const [actualMsg, setActualMsg] = useState(null);

  const [targets, setTargets] = useState(null); // null = loading, {} once loaded: { "2026-09": 12000, ... }
  const [targetMonth, setTargetMonth] = useState(monthKey(0));
  const [targetValue, setTargetValue] = useState("");
  const [savingTarget, setSavingTarget] = useState(false);
  const [targetMsg, setTargetMsg] = useState(null);

  const thisMonth = monthKey(0);
  const nextMonth = monthKey(1);

  useEffect(() => {
    if (!effectiveMineId) return;
    setTargets(null);
    getMonthlyTargets(effectiveMineId).then((rows) => {
      const map = {};
      rows.forEach((r) => (map[r.month] = r.target_tonnes));
      setTargets(map);
      // Default to whichever of this-month / next-month has no target yet,
      // preferring this month - that's the "ask again" behaviour: as soon as
      // a new month starts with nothing set for it, this is what greets you.
      const defaultMonth = map[thisMonth] == null ? thisMonth : nextMonth;
      setTargetMonth(defaultMonth);
      setTargetValue(map[defaultMonth] != null ? String(map[defaultMonth]) : "");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveMineId]);

  if (!mines || mines.length === 0) {
    return <div className="panel-note">Loading mine list…</div>;
  }

  const setActual = (key, val) => setActualForm((f) => ({ ...f, [key]: val }));

  const thisMonthTarget = targets ? targets[thisMonth] : undefined;
  const daysInMonth = new Date(Number(thisMonth.slice(0, 4)), Number(thisMonth.slice(5, 7)), 0).getDate();

  const submitActual = async (e) => {
    e.preventDefault();
    if (actualForm.actual_tonnes === "" || !effectiveMineId) return;
    setSavingActual(true);
    setActualMsg(null);
    try {
      await postDailyActual({
        mine_id: effectiveMineId,
        date: actualForm.date,
        actual_tonnes: Number(actualForm.actual_tonnes),
        equipment_downtime_hours: Number(actualForm.equipment_downtime_hours || 0),
        equipment_breakdowns: Number(actualForm.equipment_breakdowns || 0),
        blasting_delay_hours: Number(actualForm.blasting_delay_hours || 0),
        rainfall_mm: Number(actualForm.rainfall_mm || 0),
      });
      setActualMsg({ ok: true, text: `Logged ${fmtTonnes(Number(actualForm.actual_tonnes))} for ${actualForm.date}.` });
      setActualForm((f) => ({ ...ACTUAL_DEFAULTS, date: f.date }));
      onSaved?.();
    } catch (err) {
      setActualMsg({ ok: false, text: err?.response?.data?.detail || "Failed to save. Please try again." });
    } finally {
      setSavingActual(false);
    }
  };

  const submitTarget = async (e) => {
    e.preventDefault();
    if (targetValue === "" || !effectiveMineId) return;
    setSavingTarget(true);
    setTargetMsg(null);
    try {
      await postMonthlyTarget({
        mine_id: effectiveMineId,
        month: targetMonth,
        target_tonnes: Number(targetValue),
      });
      setTargets((t) => ({ ...t, [targetMonth]: Number(targetValue) }));
      setTargetMsg({ ok: true, text: `Target for ${monthLabel(targetMonth)} set to ${fmtTonnes(Number(targetValue))}.` });
      onSaved?.();
    } catch (err) {
      setTargetMsg({ ok: false, text: err?.response?.data?.detail || "Failed to save. Please try again." });
    } finally {
      setSavingTarget(false);
    }
  };

  const pickMonth = (ym) => {
    setTargetMonth(ym);
    setTargetValue(targets && targets[ym] != null ? String(targets[ym]) : "");
    setTargetMsg(null);
  };

  return (
    <div>
      {/* Panel-local mine picker - independent of the topbar's "All Mines"
          option, so this form always has a specific mine to save against. */}
      <div className="entry-mine-row">
        <label className="entry-field" style={{ maxWidth: 280 }}>
          <span>Entering data for</span>
          <select
            className="mine-select"
            value={effectiveMineId}
            onChange={(e) => setLocalMineId(e.target.value)}
          >
            {mines.map((m) => (
              <option key={m.mine_id} value={m.mine_id}>
                {m.mine_name} · {m.state}
              </option>
            ))}
          </select>
        </label>
        {!mineId && (
          <span className="panel-note">
            (Topbar is on "All Mines" — this form uses its own mine selector above.)
          </span>
        )}
      </div>

      {/* This-month target status - always visible, re-prompts automatically
          once a new month starts and nothing has been set for it yet. */}
      <div className={`target-status ${thisMonthTarget == null ? "target-status-missing" : "target-status-set"}`}>
        {targets === null ? (
          <span>Checking this month's target…</span>
        ) : thisMonthTarget == null ? (
          <span>
            <strong>No planned tonnage set for {monthLabel(thisMonth)} yet.</strong> Set it below so the
            production chart and shortfall model have a real target to compare against.
          </span>
        ) : (
          <span>
            <strong>{monthLabel(thisMonth)} target:</strong> {fmtTonnes(thisMonthTarget)} total
            (~{fmtTonnes(thisMonthTarget / daysInMonth)}/day)
          </span>
        )}
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <form className="entry-form" onSubmit={submitActual}>
          <div className="entry-form-title">Log today's actuals — {effectiveMineName}</div>
          <div className="entry-grid">
            <label className="entry-field">
              <span>Date</span>
              <input
                type="date"
                value={actualForm.date}
                max={todayISO()}
                onChange={(e) => setActual("date", e.target.value)}
                required
              />
            </label>
            <label className="entry-field">
              <span>Actual tonnes*</span>
              <input
                type="number" min="0" step="0.1" placeholder="e.g. 410"
                value={actualForm.actual_tonnes}
                onChange={(e) => setActual("actual_tonnes", e.target.value)}
                required
              />
            </label>
            <label className="entry-field">
              <span>Equipment downtime (hrs)</span>
              <input
                type="number" min="0" step="0.5" placeholder="0"
                value={actualForm.equipment_downtime_hours}
                onChange={(e) => setActual("equipment_downtime_hours", e.target.value)}
              />
            </label>
            <label className="entry-field">
              <span>Equipment breakdowns</span>
              <input
                type="number" min="0" step="1" placeholder="0"
                value={actualForm.equipment_breakdowns}
                onChange={(e) => setActual("equipment_breakdowns", e.target.value)}
              />
            </label>
            <label className="entry-field">
              <span>Blasting delay (hrs)</span>
              <input
                type="number" min="0" step="0.5" placeholder="0"
                value={actualForm.blasting_delay_hours}
                onChange={(e) => setActual("blasting_delay_hours", e.target.value)}
              />
            </label>
            <label className="entry-field">
              <span>Rainfall (mm)</span>
              <input
                type="number" min="0" step="1" placeholder="0"
                value={actualForm.rainfall_mm}
                onChange={(e) => setActual("rainfall_mm", e.target.value)}
              />
            </label>
          </div>
          <div className="entry-form-footer">
            <button className="btn-primary" type="submit" disabled={savingActual}>
              {savingActual ? "Saving…" : "Save today's actuals"}
            </button>
            {actualMsg && <span className={actualMsg.ok ? "entry-msg-ok" : "entry-msg-err"}>{actualMsg.text}</span>}
          </div>
        </form>

        <form className="entry-form" onSubmit={submitTarget}>
          <div className="entry-form-title">Set planned tonnage — {effectiveMineName}</div>

          <div className="tabs">
            <button
              type="button"
              className={`tab-btn ${targetMonth === thisMonth ? "active" : ""}`}
              onClick={() => pickMonth(thisMonth)}
            >
              This month{targets && targets[thisMonth] != null ? " ✓" : ""}
            </button>
            <button
              type="button"
              className={`tab-btn ${targetMonth === nextMonth ? "active" : ""}`}
              onClick={() => pickMonth(nextMonth)}
            >
              Next month{targets && targets[nextMonth] != null ? " ✓" : ""}
            </button>
          </div>

          <div className="entry-grid">
            <label className="entry-field">
              <span>Month</span>
              <input type="text" value={monthLabel(targetMonth)} disabled />
            </label>
            <label className="entry-field">
              <span>Planned tonnes (total for the month)*</span>
              <input
                type="number" min="0" step="10" placeholder="e.g. 12000"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                required
              />
            </label>
          </div>
          <div className="entry-form-footer">
            <button className="btn-primary" type="submit" disabled={savingTarget}>
              {savingTarget
                ? "Saving…"
                : targets && targets[targetMonth] != null
                ? "Update target"
                : "Set target"}
            </button>
            {targetMsg && <span className={targetMsg.ok ? "entry-msg-ok" : "entry-msg-err"}>{targetMsg.text}</span>}
          </div>
          <p className="panel-note" style={{ marginTop: 10 }}>
            Applies as this month's planned-tonnes baseline (split evenly per day) on the
            chart and in the shortfall model. Each month is separate — nothing carries over
            automatically, so a fresh target is needed once a new month starts.
          </p>
        </form>
      </div>
    </div>
  );
}
