import { RISK_COLORS } from "../theme";

export default function EquipmentHealthPanel({ equipment }) {
  if (!equipment || equipment.length === 0) {
    return <div className="loading-state">No equipment data available.</div>;
  }

  const sorted = [...equipment].sort((a, b) => b.breakdown_risk_7d - a.breakdown_risk_7d);

  return (
    <div className="rec-list" style={{ maxHeight: 480, overflowY: "auto", paddingRight: 4 }}>
      {sorted.map((e) => (
        <div className="rec-item" key={e.equipment_id} style={{ gridTemplateColumns: "1fr auto" }}>
          <div className="rec-body">
            <div className="rec-category">{e.equipment_type} &middot; {e.mine_id} &middot; {e.age_years}y old</div>
            <div className="rec-issue mono">{e.equipment_id}</div>
            <div className="rec-action">
              {Math.round(e.breakdown_risk_7d * 100)}% breakdown risk (7d)
              {e.overdue_days > 0 ? ` · ${e.overdue_days}d overdue for maintenance` : ""}
            </div>
          </div>
          <span className={`rec-tag p-${e.risk_level}`} style={{ color: RISK_COLORS[e.risk_level] }}>
            {e.risk_level}
          </span>
        </div>
      ))}
    </div>
  );
}
