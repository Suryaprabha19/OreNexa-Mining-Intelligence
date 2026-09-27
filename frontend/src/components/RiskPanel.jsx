import { RISK_COLORS } from "../theme";

function GaugeDetail({ r }) {
  const pct = Math.round(r.shortfall_probability * 100);
  return (
    <div className="risk-gauge">
      <span className={`risk-badge risk-${r.risk_level}`}>
        {r.risk_level} RISK &middot; {pct}% shortfall probability
      </span>
      <div className="gauge-track">
        <div
          className="gauge-fill"
          style={{ width: `${pct}%`, background: RISK_COLORS[r.risk_level] }}
        />
      </div>
      <div className="panel-note">
        Modelled for {r.mine_name} · next operating day ({r.date}) · est.{" "}
        <span className="mono">{r.predicted_shortfall_tonnes} t</span> below plan
      </div>
      <div>
        {Object.entries(r.contributing_factors).map(([k, v]) => (
          <div className="factor-row" key={k}>
            <span>{k.replaceAll("_", " ")}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupList({ riskList }) {
  const sorted = [...riskList].sort((a, b) => b.shortfall_probability - a.shortfall_probability);
  return (
    <div className="rec-list">
      {sorted.map((r) => (
        <div className="rec-item" key={r.mine_id} style={{ gridTemplateColumns: "1fr auto" }}>
          <div className="rec-body">
            <div className="rec-category">{r.mine_name}</div>
            <div className="rec-issue">
              {Math.round(r.shortfall_probability * 100)}% shortfall probability &middot; est.{" "}
              {r.predicted_shortfall_tonnes} t short
            </div>
          </div>
          <span className={`rec-tag p-${r.risk_level}`}>{r.risk_level}</span>
        </div>
      ))}
    </div>
  );
}

export default function RiskPanel({ riskList, selectedMine }) {
  if (!riskList || riskList.length === 0) {
    return <div className="loading-state">No risk data available.</div>;
  }
  if (selectedMine) {
    return <GaugeDetail r={riskList[0]} />;
  }
  return <GroupList riskList={riskList} />;
}
