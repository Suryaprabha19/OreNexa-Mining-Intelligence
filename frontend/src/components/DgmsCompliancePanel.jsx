import { useEffect, useMemo, useState } from "react";
import { getDgmsCompliance } from "../api/client";

// Maps our DGMS severities onto the same red/amber/green priority language
// used everywhere else in the app (recommendations, risk badges), so this
// panel reads as part of one system rather than a bolted-on module.
const SEVERITY_TO_PRIORITY = {
  CRITICAL_VIOLATION: "High",
  STATUTORY_WARNING: "Medium",
  COMPLIANT: "Low",
};

const STATUS_LABEL = {
  CRITICAL_ACTION_REQUIRED: "Critical action required",
  STATUTORY_CAUTION: "Statutory caution",
  FULLY_COMPLIANT: "Fully compliant",
};

export default function DgmsCompliancePanel({ mineId, mineName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!mineId) {
      setData(null);
      return;
    }
    setLoading(true);
    getDgmsCompliance(mineId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [mineId]);

  const filteredChecks = useMemo(() => {
    if (!data) return [];
    if (filter === "ALL") return data.checks;
    return data.checks.filter((c) => c.severity === filter);
  }, [data, filter]);

  if (!mineId) {
    return (
      <div className="panel-note">
        Select a specific mine above to run its DGMS statutory compliance audit.
      </div>
    );
  }
  if (loading || !data) {
    return <div className="loading-state">Running statutory compliance audit…</div>;
  }

  const { summary } = data;
  const scoreColor = summary.overall_score >= 90 ? "var(--success)" : summary.overall_score >= 70 ? "var(--warning)" : "var(--danger)";

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <span className={`risk-badge risk-${summary.status === "CRITICAL_ACTION_REQUIRED" ? "High" : summary.status === "STATUTORY_CAUTION" ? "Medium" : "Low"}`}>
            {STATUS_LABEL[summary.status]}
          </span>
          <div className="panel-note" style={{ marginTop: 8 }}>
            {mineName} · Mines Act 1952 / MMR 1961 statutory checks
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="kpi-label">Safety Index</div>
          <div className="kpi-value mono" style={{ color: scoreColor }}>{summary.overall_score}%</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 14, flexWrap: "wrap" }}>
        <button className={`tab-btn ${filter === "ALL" ? "active" : ""}`} onClick={() => setFilter("ALL")}>
          All checks ({summary.total_checks})
        </button>
        <button className={`tab-btn ${filter === "CRITICAL_VIOLATION" ? "active" : ""}`} onClick={() => setFilter("CRITICAL_VIOLATION")}>
          Critical ({summary.critical_count})
        </button>
        <button className={`tab-btn ${filter === "STATUTORY_WARNING" ? "active" : ""}`} onClick={() => setFilter("STATUTORY_WARNING")}>
          Warnings ({summary.warning_count})
        </button>
        <button className={`tab-btn ${filter === "COMPLIANT" ? "active" : ""}`} onClick={() => setFilter("COMPLIANT")}>
          Compliant ({summary.compliant_count})
        </button>
      </div>

      <div className="rec-list">
        {filteredChecks.length === 0 ? (
          <div className="panel-note">No checks match this filter.</div>
        ) : (
          filteredChecks.map((c) => {
            const priority = SEVERITY_TO_PRIORITY[c.severity];
            const isOpen = expandedId === c.id;
            return (
              <div className={`rec-item p-${priority}`} key={c.id} style={{ cursor: "pointer" }} onClick={() => setExpandedId(isOpen ? null : c.id)}>
                <span className={`rec-tag p-${priority}`}>{c.severity.replace("_", " ")}</span>
                <div className="rec-body">
                  <div className="rec-category">{c.category_label} · {c.regulation_code}</div>
                  <div className="rec-issue">{c.title}</div>
                  <div className="rec-action">{c.affected_asset_name} · {c.current_telemetry_value}</div>
                  {isOpen && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--border-soft)", display: "grid", gap: 8 }}>
                      <div className="factor-row" style={{ display: "block" }}>
                        <strong style={{ color: "var(--text)" }}>Statutory mandate: </strong>
                        <span>{c.statutory_description}</span>
                      </div>
                      <div className="factor-row" style={{ display: "block" }}>
                        <strong style={{ color: "var(--text)" }}>Threshold: </strong>
                        <span className="mono">{c.statutory_threshold}</span>
                      </div>
                      <div className="factor-row" style={{ display: "block" }}>
                        <strong style={{ color: "var(--text)" }}>Immediate action: </strong>
                        <span>{c.immediate_action_required}</span>
                      </div>
                      <div className="factor-row" style={{ display: "block", borderBottom: "none" }}>
                        <strong style={{ color: "var(--danger)" }}>Penalty clause: </strong>
                        <span>{c.penalty_clause}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      <p className="panel-note" style={{ marginTop: 14 }}>
        Regulation codes and thresholds are real DGMS/MMR 1961 provisions. Blasting-vibration and winder-hoist
        readings are simulated proxies pending live seismograph/winder telemetry integration — fire/AFDSS,
        ramp-retarder, and inundation checks use this project's real equipment and weather data.
      </p>
    </div>
  );
}
