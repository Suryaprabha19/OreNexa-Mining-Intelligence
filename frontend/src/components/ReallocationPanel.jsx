import { useState } from "react";
import { getReallocation } from "../api/client";

export default function ReallocationPanel() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const data = await getReallocation();
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <p className="panel-note" style={{ margin: 0, maxWidth: 520 }}>
          Runs a genetic algorithm across all mines: matches equipment predicted to be at
          elevated breakdown risk with the nearest healthy, same-type unit elsewhere that
          can be temporarily re-routed in.
        </p>
        <button className="btn-primary" onClick={run} disabled={loading}>
          {loading ? "Optimizing…" : "Run reallocation optimizer"}
        </button>
      </div>

      {result && (
        <div className="sim-result">
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 16 }}>
            <div>
              <div className="kpi-label">At-risk units</div>
              <div className="kpi-value mono">{result.critical_units_identified}</div>
            </div>
            <div>
              <div className="kpi-label">Covered by reallocation</div>
              <div className="kpi-value mono kpi-accent-teal">{result.critical_units_covered}</div>
            </div>
            <div>
              <div className="kpi-label">Total haul distance</div>
              <div className="kpi-value mono">{result.distance_km_moved} km</div>
            </div>
          </div>

          {result.moves.length === 0 ? (
            <div className="panel-note">{result.summary}</div>
          ) : (
            <div className="rec-list">
              {result.moves.map((m, i) => (
                <div className="rec-item p-Medium" key={i}>
                  <span className="rec-tag p-Medium">Move</span>
                  <div className="rec-body">
                    <div className="rec-category">{m.equipment_type}</div>
                    <div className="rec-issue">
                      Re-route <span className="mono">{m.equipment_id}</span> from{" "}
                      <strong>{m.from_mine_name}</strong> to <strong>{m.to_mine_name}</strong>
                    </div>
                    <div className="rec-action">
                      → covers <span className="mono">{m.covers_equipment_id}</span>{" "}
                      ({Math.round(m.covered_unit_risk * 100)}% breakdown risk) &middot; incoming unit risk{" "}
                      {Math.round(m.unit_risk * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
