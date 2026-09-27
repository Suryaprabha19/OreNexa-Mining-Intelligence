import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import ProductionTrendPanel from "../components/ProductionTrendPanel";
import DataEntryPanel from "../components/DataEntryPanel";
import { fmtTonnes } from "../theme";
import { getProductionTrend } from "../api/client";

export default function ProductionPage() {
  const { selectedMine, mines } = useOutletContext();
  const [trend, setTrend] = useState([]);
  const [days, setDays] = useState(120);
  const [loaded, setLoaded] = useState(false);

  const mineName = mines?.find((m) => m.mine_id === selectedMine)?.mine_name || "";

  const refresh = useCallback(() => {
    getProductionTrend(selectedMine, days).then((d) => {
      setTrend(d);
      setLoaded(true);
    });
  }, [selectedMine, days]);

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

      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="panel-eyebrow">Manual data entry</span>
            <h2>Log Today's Data &amp; Set Targets</h2>
          </div>
          <span className="panel-note">Saved actuals and targets show up in the chart above and feed the risk model immediately</span>
        </div>
        <DataEntryPanel mineId={selectedMine} mineName={mineName} mines={mines} onSaved={refresh} />
      </div>
    </>
  );
}
