import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Download } from "lucide-react";
import ProductionTrendPanel from "../components/ProductionTrendPanel";
import { getProductionTrend, getMines } from "../api/client";

function toCSV(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
}
function download(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function HistoricPage() {
  const { selectedMine } = useOutletContext();
  const [days, setDays] = useState(365);
  const [trend, setTrend] = useState([]);
  const [mines, setMines] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { getMines().then(setMines); }, []);
  useEffect(() => {
    setLoaded(false);
    getProductionTrend(selectedMine, days).then(d => { setTrend(d); setLoaded(true); });
  }, [selectedMine, days]);

  const mineLabel = selectedMine ? (mines.find(m=>m.mine_id===selectedMine)?.mine_name || selectedMine) : "All Mines (group)";

  const exportCSV = () => download(toCSV(trend), `historic-${selectedMine||"all"}-${days}d-${new Date().toISOString().slice(0,10)}.csv`, "text/csv");
  const exportReport = () => {
    const report = { generated_at: new Date().toISOString(), mine: mineLabel, days, rows: trend.length, data: trend };
    download(JSON.stringify(report, null, 2), `historic-report-${selectedMine||"all"}-${days}d.json`, "application/json");
  };

  if (!loaded) return <div className="loading-state">Loading historic trends…</div>;

  const avgActual = trend.length ? (trend.reduce((s,r)=>s+r.actual_tonnes,0)/trend.length).toFixed(1) : 0;
  const avgPlanned = trend.length ? (trend.reduce((s,r)=>s+r.planned_tonnes,0)/trend.length).toFixed(1) : 0;
  const minActual = trend.length ? Math.min(...trend.map(r=>r.actual_tonnes)) : 0;
  const maxActual = trend.length ? Math.max(...trend.map(r=>r.actual_tonnes)) : 0;

  return (
    <>
      <div className="panel" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="kpi-label">Historic window</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {[90,180,365,730].map(d=>(
              <button key={d} className={`tab-btn ${days===d?"active":""}`} onClick={()=>setDays(d)}>{d}d</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={exportCSV} style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.04)", color:"var(--ink)", border:"1px solid var(--line)", padding:"8px 12px", borderRadius:999, fontSize:12, cursor:"pointer" }}><Download size={14}/> CSV</button>
          <button onClick={exportReport} style={{ display:"inline-flex", alignItems:"center", gap:6, background:"var(--ink)", color:"var(--obsidian)", border:"1px solid var(--ink)", padding:"8px 12px", borderRadius:999, fontSize:12, cursor:"pointer" }}><Download size={14}/> Report JSON</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-label">Window</div><div className="kpi-value mono">{days}d</div><div className="kpi-sub">{mineLabel}</div></div>
        <div className="kpi-card"><div className="kpi-label">Avg actual</div><div className="kpi-value mono kpi-accent-teal">{avgActual} t</div><div className="kpi-sub">Avg planned {avgPlanned} t</div></div>
        <div className="kpi-card"><div className="kpi-label">Range</div><div className="kpi-value mono">{minActual} — {maxActual} t</div><div className="kpi-sub">Min → max actual in window</div></div>
        <div className="kpi-card"><div className="kpi-label">Samples</div><div className="kpi-value mono">{trend.length}</div><div className="kpi-sub">Daily records</div></div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div><span className="panel-eyebrow">Long-range — planned vs actual vs target</span><h2>Historic Trends</h2></div>
          <span className="panel-note">{trend.length} days • teal = actual, amber dashed = planned, grey = target</span>
        </div>
        <ProductionTrendPanel data={trend} />
        <div className="panel-note" style={{ marginTop: 10 }}>
          Manual entries appear as filled teal dots. Reference lines flag top 4 disruption events (rain &gt;40mm, downtime &gt;15h, blasting delay &gt;5h).
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><div><span className="panel-eyebrow">Raw ledger</span><h2>Historic Ledger (last 20)</h2></div></div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr><th className="mono">Date</th><th className="mono">Actual</th><th className="mono">Planned</th><th className="mono">Shortfall</th><th className="mono">Rain</th><th className="mono">Downtime</th></tr></thead>
            <tbody>
              {trend.slice(-20).reverse().map(r=>(
                <tr key={r.date}>
                  <td className="mono">{r.date}</td>
                  <td className="mono">{r.actual_tonnes}t {r.is_manual?"•":""}</td>
                  <td className="mono">{r.planned_tonnes}t</td>
                  <td className="mono" style={{ color: r.shortfall_tonnes>0?"var(--danger)":"var(--success)" }}>{r.shortfall_tonnes}t</td>
                  <td className="mono">{r.rainfall_mm}mm</td>
                  <td className="mono">{r.equipment_downtime_hours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
