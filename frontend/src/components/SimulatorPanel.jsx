import { useState, useEffect } from "react";
import { postSimulate } from "../api/client";
import { RISK_COLORS } from "../theme";
import RecommendationsPanel from "./RecommendationsPanel";
import { Download, FileSpreadsheet, Trash2 } from "lucide-react";

const DEFAULTS = {
  equipment_downtime_hours: 4,
  equipment_breakdowns: 0,
  blasting_delay_hours: 1.5,
  rainfall_mm: 10,
  temperature_c: 32,
  humidity_pct: 55,
  labour_availability_pct: 92,
  planned_tonnes: 400,
};

const FIELDS = [
  { key: "planned_tonnes", label: "Planned tonnage", min: 100, max: 700, step: 10, unit: "t" },
  { key: "equipment_downtime_hours", label: "Equipment downtime", min: 0, max: 30, step: 0.5, unit: "hrs" },
  { key: "equipment_breakdowns", label: "Equipment breakdowns", min: 0, max: 6, step: 1, unit: "" },
  { key: "blasting_delay_hours", label: "Blasting delay", min: 0, max: 12, step: 0.5, unit: "hrs" },
  { key: "rainfall_mm", label: "Rainfall", min: 0, max: 150, step: 5, unit: "mm" },
  { key: "labour_availability_pct", label: "Labour availability", min: 50, max: 100, step: 1, unit: "%" },
];

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function SimulatorPanel({ mineId }) {
  const [values, setValues] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ore-sim-log") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("ore-sim-log", JSON.stringify(log.slice(0, 50)));
  }, [log]);

  const set = (key, val) => setValues((v) => ({ ...v, [key]: Number(val) }));

  const run = async () => {
    if (!mineId) return;
    setLoading(true);
    try {
      const data = await postSimulate({ mine_id: mineId, ...values });
      setResult(data);
      const entry = {
        timestamp: new Date().toISOString(),
        mine_id: mineId,
        inputs: { ...values },
        output: {
          risk_level: data.risk_level,
          shortfall_probability: data.shortfall_probability,
          predicted_actual_tonnes: data.predicted_actual_tonnes,
          predicted_shortfall_tonnes: data.predicted_shortfall_tonnes,
          recommendations: data.recommendations?.length || 0,
        }
      };
      setLog(prev => [entry, ...prev].slice(0, 50));
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (log.length === 0) return;
    const headers = ["timestamp","mine_id","planned_tonnes","downtime_hrs","breakdowns","blasting_delay","rainfall_mm","labour_pct","risk_level","shortfall_prob","predicted_actual","predicted_shortfall","recs"];
    const rows = log.map(e => [
      e.timestamp, e.mine_id, e.inputs.planned_tonnes, e.inputs.equipment_downtime_hours, e.inputs.equipment_breakdowns, e.inputs.blasting_delay_hours, e.inputs.rainfall_mm, e.inputs.labour_availability_pct,
      e.output.risk_level, e.output.shortfall_probability, e.output.predicted_actual_tonnes, e.output.predicted_shortfall_tonnes, e.output.recommendations
    ].join(","));
    downloadFile([headers.join(","), ...rows].join("\n"), `orenexa-sim-log-${new Date().toISOString().slice(0,10)}.csv`, "text/csv");
  };

  const downloadReport = () => {
    if (log.length === 0) return;
    // JSON report + human-readable header for "download as report"
    const report = {
      generated_at: new Date().toISOString(),
      system: "OreNexa — What-if Simulator Report",
      mine_id: mineId,
      total_runs: log.length,
      latest_inputs: values,
      log,
    };
    // Pretty JSON for audit trail; user can print to PDF from browser if needed
    downloadFile(JSON.stringify(report, null, 2), `orenexa-sim-report-${new Date().toISOString().slice(0,10)}.json`, "application/json");
  };

  const clearLog = () => { setLog([]); localStorage.removeItem("ore-sim-log"); };

  if (!mineId) {
    return (
      <div className="panel-note">
        Select a specific mine above to run a what-if simulation against its shortfall model.
      </div>
    );
  }

  return (
    <div>
      <div className="sim-grid">
        {FIELDS.map((f) => (
          <div className="sim-field" key={f.key}>
            <label>
              <span>{f.label}</span>
              <span className="val">
                {values[f.key]}
                {f.unit}
              </span>
            </label>
            <input
              type="range"
              min={f.min}
              max={f.max}
              step={f.step}
              value={values[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn-primary" onClick={run} disabled={loading}>
          {loading ? "Running model…" : "Run simulation"}
        </button>
        <span className="panel-note" style={{ marginLeft: 4 }}>{log.length} run{log.length!==1?"s":""} in log</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={downloadCSV} disabled={log.length===0} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)", color: "var(--ink)", border: "1px solid var(--line)", padding: "7px 11px", borderRadius: 999, fontSize: 12, cursor: log.length===0?"not-allowed":"pointer", opacity: log.length===0?0.5:1 }}>
            <FileSpreadsheet size={14} /> Download CSV
          </button>
          <button onClick={downloadReport} disabled={log.length===0} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--ink)", color: "var(--obsidian)", border: "1px solid var(--ink)", padding: "7px 11px", borderRadius: 999, fontSize: 12, cursor: log.length===0?"not-allowed":"pointer", opacity: log.length===0?0.5:1 }}>
            <Download size={14} /> Download Log as Report (JSON)
          </button>
          {log.length>0 && (
            <button onClick={clearLog} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", color: "var(--muted)", border: "1px solid var(--line)", padding: "7px 11px", borderRadius: 999, fontSize: 12, cursor: "pointer" }}>
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {log.length > 0 && (
        <div style={{ marginTop: 14, border: "1px solid var(--line-soft)", borderRadius: 12, overflow: "hidden" }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--faint)", padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--line-soft)", display: "flex", justifyContent: "space-between" }}>
            <span>Simulation log — most recent first</span>
            <span>{log.length} entries</span>
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {log.slice(0, 8).map((e,i)=>(
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 12px", borderBottom: "1px solid var(--line-soft)", fontSize: 12, background: i===0?"rgba(255,122,24,0.06)":"transparent" }}>
                <span className="mono" style={{ color: "var(--muted)", fontSize: 11 }}>{new Date(e.timestamp).toLocaleString()} • {e.mine_id}</span>
                <span className="mono" style={{ color: RISK_COLORS[e.output.risk_level] || "var(--ink)", fontWeight: 600 }}>{e.output.risk_level} {Math.round(e.output.shortfall_probability*100)}% • {e.output.predicted_shortfall_tonnes}t short</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="sim-result">
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 16 }}>
            <div>
              <div className="kpi-label">Shortfall probability</div>
              <div className="kpi-value mono" style={{ color: RISK_COLORS[result.risk_level] }}>
                {Math.round(result.shortfall_probability * 100)}%
              </div>
            </div>
            <div>
              <div className="kpi-label">Predicted actual output</div>
              <div className="kpi-value mono">{result.predicted_actual_tonnes} t</div>
            </div>
            <div>
              <div className="kpi-label">Predicted shortfall</div>
              <div className="kpi-value mono">{result.predicted_shortfall_tonnes} t</div>
            </div>
          </div>
          <RecommendationsPanel recommendations={result.recommendations} />
        </div>
      )}
    </div>
  );
}
