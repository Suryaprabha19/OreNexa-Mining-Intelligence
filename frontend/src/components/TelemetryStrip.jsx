import { RISK_COLORS } from "../theme";

function RiskGaugeCard({ pct, level }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">Shortfall Risk Indicator</div>
      <div className="kpi-value" style={{ color: RISK_COLORS[level] }}>
        {pct}% <span style={{ fontSize: 13, fontWeight: 500 }}>{level === "High" ? "— Critical" : level === "Medium" ? "— Elevated" : "— Stable"}</span>
      </div>
      <div className="gauge-track" style={{ marginTop: 10 }}>
        <div className="gauge-fill" style={{ width: `${pct}%`, background: RISK_COLORS[level] }} />
      </div>
    </div>
  );
}

function FleetCard({ fleet }) {
  if (!fleet) return null;
  const { active, idling, down, total } = fleet;
  const seg = (n) => (total ? (n / total) * 100 : 0);
  return (
    <div className="kpi-card">
      <div className="kpi-label">Fleet Utilization Efficiency</div>
      <div className="kpi-value kpi-accent">{fleet.utilization_pct}%</div>
      <div style={{ display: "flex", height: 7, borderRadius: 999, overflow: "hidden", marginTop: 10, background: "var(--panel-2)" }}>
        <div style={{ width: `${seg(active)}%`, background: "var(--cyan)" }} title={`${active} active`} />
        <div style={{ width: `${seg(idling)}%`, background: "var(--warning)" }} title={`${idling} idling`} />
        <div style={{ width: `${seg(down)}%`, background: "var(--danger)" }} title={`${down} down`} />
      </div>
      <div className="kpi-sub mono">
        {active} active · {idling} idling · {down} down / {total}
      </div>
    </div>
  );
}

export default function TelemetryStrip({ telemetry }) {
  if (!telemetry) return null;

  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-label">Manganese Yield Prediction</div>
        <div className="kpi-value kpi-accent-teal">{telemetry.predicted_yield_tonnes} t</div>
        <div className="kpi-sub">
          vs target <span className="mono">{telemetry.target_tonnes} t</span> ({telemetry.yield_pct_of_target}%)
        </div>
      </div>

      <RiskGaugeCard pct={telemetry.shortfall_risk_pct} level={telemetry.risk_level} />

      <FleetCard fleet={telemetry.fleet} />

      <div className="kpi-card">
        <div className="kpi-label">Pit Inundation Sensor</div>
        <div className="kpi-value" style={{ color: telemetry.pit_water_level_mm > 80 ? "var(--danger)" : "var(--cyan)" }}>
          {telemetry.pit_water_level_mm} mm
        </div>
        <div className="kpi-sub">Accumulated water level (rainfall-derived proxy)</div>
      </div>
    </div>
  );
}
