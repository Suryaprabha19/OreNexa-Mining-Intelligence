import { fmtTonnes } from "../theme";

export default function KpiStrip({ kpis }) {
  if (!kpis) return null;
  const cards = [
    {
      label: "Predicted Reserves",
      value: fmtTonnes(kpis.total_predicted_reserve_tonnes),
      sub: kpis.mine_id ? "This mine" : `Across ${kpis.total_mines} mines`,
      accent: "kpi-accent",
    },
    {
      label: "Avg Daily Production",
      value: fmtTonnes(kpis.avg_daily_production_tonnes),
      sub: "Trailing 30-day average",
      accent: "kpi-accent-teal",
    },
    {
      label: "Shortfall Rate",
      value: `${kpis.shortfall_rate_pct}%`,
      sub: "Days below 90% of plan (30d)",
      accent: kpis.shortfall_rate_pct > 25 ? "kpi-accent-red" : "kpi-accent-amber",
    },
    {
      label: "High-Risk Mines",
      value: `${kpis.active_high_risk_mines} / ${kpis.total_mines}`,
      sub: "Flagged for tomorrow",
      accent: kpis.active_high_risk_mines > 0 ? "kpi-accent-red" : "kpi-accent-teal",
    },
  ];

  return (
    <div className="kpi-grid">
      {cards.map((c) => (
        <div className="kpi-card" key={c.label}>
          <div className="kpi-label">{c.label}</div>
          <div className={`kpi-value ${c.accent}`}>{c.value}</div>
          <div className="kpi-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
