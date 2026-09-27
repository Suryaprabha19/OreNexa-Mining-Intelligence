import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import ProductionTrendPanel from "../components/ProductionTrendPanel";
import DataEntryPanel from "../components/DataEntryPanel";
import { fmtTonnes } from "../theme";
import { getProductionTrend, getDailyActuals, getMonthlyTargets } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function ProductionPage() {
  const { selectedMine, mines } = useOutletContext();
  const { user } = useAuth();
  const role = user?.role || "admin";
  const [trend, setTrend] = useState([]);
  const [days, setDays] = useState(120);
  const [loaded, setLoaded] = useState(false);
  // For admin read-only review of field/planner submissions
  const [recentActuals, setRecentActuals] = useState(null);
  const [plannerTargets, setPlannerTargets] = useState(null);

  const mineName = mines?.find((m) => m.mine_id === selectedMine)?.mine_name || "";

  const refresh = useCallback(() => {
    getProductionTrend(selectedMine, days).then((d) => {
      setTrend(d);
      setLoaded(true);
    });
    // Load review data for admin/planner/equip read-only views
    if (role === "admin" || role === "planner" || role === "equip") {
      getDailyActuals(selectedMine || undefined).then(rows => setRecentActuals(rows.slice(-7).reverse())).catch(()=>setRecentActuals([]));
      if (selectedMine) {
        getMonthlyTargets(selectedMine).then(rows=>setPlannerTargets(rows)).catch(()=>setPlannerTargets([]));
      } else {
        setPlannerTargets([]);
      }
    }
  }, [selectedMine, days, role]);

  useEffect(() => {
    setLoaded(false);
    refresh();
  }, [refresh]);

  if (!loaded) return <div className="loading-state">Loading production data…</div>;

  const totalPlanned = trend.reduce((s, r) => s + r.planned_tonnes, 0);
  const totalActual = trend.reduce((s, r) => s + r.actual_tonnes, 0);
  const totalShortfall = trend.reduce((s, r) => s + r.shortfall_tonnes, 0);
  const shortfallDays = trend.filter((r) => r.actual_tonnes < 0.9 * r.planned_tonnes).length;

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Planned</div>
          <div className="kpi-value">{fmtTonnes(totalPlanned)}</div>
          <div className="kpi-sub">Over {days} days</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Actual</div>
          <div className="kpi-value kpi-accent-teal">{fmtTonnes(totalActual)}</div>
          <div className="kpi-sub">{((totalActual / totalPlanned) * 100).toFixed(1)}% of plan</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Shortfall</div>
          <div className="kpi-value kpi-accent-amber">{fmtTonnes(totalShortfall)}</div>
          <div className="kpi-sub">Cumulative gap</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Shortfall Days</div>
          <div className="kpi-value kpi-accent-red">{shortfallDays}</div>
          <div className="kpi-sub">Below 90% of plan</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="panel-eyebrow">Planned vs actual — AI Risk Engine • Constraint Analyzer</span>
            <h2>Production Trend &amp; Shortfall Prediction</h2>
          </div>
          <div className="tabs">
            {[30, 90, 120, 365].map((d) => (
              <button key={d} className={`tab-btn ${days === d ? "active" : ""}`} onClick={() => setDays(d)}>
                {d}d
              </button>
            ))}
          </div>
        </div>
        <ProductionTrendPanel data={trend} />
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="mono">
          <div style={{ background: "var(--panel-2)", border: "1px solid var(--line-soft)", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--oxide)", letterSpacing: "0.06em" }}>CONSTRAINT ROOT CAUSE — Metric Tonnes/mo • Target 37,500 MT/mo</div>
            <div style={{ fontSize: 12, color: "var(--ink)", marginTop: 6, lineHeight: 1.6 }}>
              Monsoon Runoff &amp; Haul Slush — 38mm 24h rain → cycle 18→28 min<br/>
              HEMM Fleet Availability — Shovel repair, stope 76% capacity<br/>
              <span style={{ color: "var(--muted)" }}>Active Risk: HIGH • Projected 32,900 MT • Shortfall -4,900 MT (13.1%)</span>
            </div>
          </div>
          <div style={{ background: "var(--oxide-soft)", border: "1px solid rgba(154,52,18,0.12)", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--danger)", letterSpacing: "0.06em" }}>PRODUCTION HEALTH — Space Radar Weather &amp; Inundation</div>
            <div style={{ fontSize: 12, color: "var(--ink)", marginTop: 6, lineHeight: 1.6 }}>
              Moderate rain 25-40mm expected — flash runoff risk on shaft #2 collar<br/>
              HEMM Avail 84% • SWIR 1.92 • Soil Optimum • NDVI 0.28
            </div>
          </div>
        </div>
      </div>

      {/* Role-segregated entry: field logs, planner sets targets, admin sees replicated review */}
      {role === "field" && (
        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="panel-eyebrow">Field Team — Daily ledger</span>
              <h2>Log Today's Data</h2>
            </div>
            <span className="panel-note">Your entries flow to the chart and risk model and are visible to Admin/Planner</span>
          </div>
          <DataEntryPanel mineId={selectedMine} mineName={mineName} mines={mines} onSaved={refresh} mode="field" />
        </div>
      )}

      {role === "planner" && (
        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="panel-eyebrow">Mine Planner — Targets only</span>
              <h2>Set Planned Tonnage</h2>
            </div>
            <span className="panel-note">Targets you set replicate to Admin and feed the trend/shortfall model</span>
          </div>
          <DataEntryPanel mineId={selectedMine} mineName={mineName} mines={mines} onSaved={refresh} mode="planner" />
        </div>
      )}

      {role === "admin" && (
        <>
          <div className="panel">
            <div className="panel-head">
              <div>
                <span className="panel-eyebrow">Admin — Read-only review • Field submissions (last 7 entries)</span>
                <h2>Field Team Updates — Replicated for Time Period</h2>
              </div>
              <span className="panel-note">Logged by Field Teams • Planner targets below</span>
            </div>
            {!recentActuals ? (
              <div className="panel-note">Loading field submissions…</div>
            ) : recentActuals.length === 0 ? (
              <div className="panel-note">No field submissions yet for this period/mine. Field teams log via their workspace.</div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Mine</th><th className="mono">Actual</th><th className="mono">Downtime</th><th className="mono">Rain</th></tr></thead>
                  <tbody>
                    {recentActuals.map((r,i)=>(
                      <tr key={i}><td className="mono">{r.date}</td><td>{mines.find(m=>m.mine_id===r.mine_id)?.mine_name || r.mine_id}</td><td className="mono">{fmtTonnes(r.actual_tonnes)}</td><td className="mono">{r.equipment_downtime_hours}h</td><td className="mono">{r.rainfall_mm}mm</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="panel">
            <div className="panel-head">
              <div>
                <span className="panel-eyebrow">Admin — Read-only review • Planner targets</span>
                <h2>Planned Targets Set by Planners</h2>
              </div>
            </div>
            {!selectedMine ? (
              <div className="panel-note">Select a mine in the topbar to see its targets as set by Planners.</div>
            ) : !plannerTargets ? (
              <div className="panel-note">Loading targets…</div>
            ) : plannerTargets.length===0 ? (
              <div className="panel-note">No targets set yet by planners for {mineName}.</div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table className="data-table">
                  <thead><tr><th>Month</th><th className="mono">Target</th></tr></thead>
                  <tbody>{plannerTargets.map(t=>(<tr key={t.month}><td className="mono">{t.month}</td><td className="mono">{fmtTonnes(t.target_tonnes)}</td></tr>))}</tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {role === "equip" && (
        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="panel-eyebrow">Equipment Ops — Read-only</span>
              <h2>Production View</h2>
            </div>
            <span className="panel-note">You see trends and targets but do not log field/planner data</span>
          </div>
          <div className="panel-note">Field teams log actuals and Planners set targets — shown above in the trend. Your workspace is <strong>Fleet</strong> for health &amp; reallocation.</div>
        </div>
      )}
    </>
  );
}
