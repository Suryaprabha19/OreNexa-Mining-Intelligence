import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AlertTriangle, ShieldAlert, Wrench, Download, Filter } from "lucide-react";
import { getRisk, getRecommendations, getEquipmentHealth, getDgmsCompliance } from "../api/client";

function dl(content, filename, mime){ const b=new Blob([content],{type:mime}); const u=URL.createObjectURL(b); const a=document.createElement("a"); a.href=u; a.download=filename; a.click(); URL.revokeObjectURL(u); }

export default function CommandCenterPage(){
  const { selectedMine } = useOutletContext();
  const [risk,setRisk]=useState([]); const [recs,setRecs]=useState([]); const [equip,setEquip]=useState([]); const [dgms,setDgms]=useState(null);
  const [filter,setFilter]=useState("ALL");
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    setLoaded(false);
    Promise.all([
      getRisk(selectedMine),
      getRecommendations(selectedMine),
      getEquipmentHealth(selectedMine),
      selectedMine? getDgmsCompliance(selectedMine).catch(()=>null): Promise.resolve(null)
    ]).then(([rk,rc,eq,dg])=>{ setRisk(rk); setRecs(rc); setEquip(eq); setDgms(dg); setLoaded(true); });
  },[selectedMine]);

  if(!loaded) return <div className="loading-state">Loading command center…</div>;

  const alerts = [
    ...risk.filter(r=>r.risk_level==="High").map(r=>({ id:`risk-${r.mine_id}`, type:"Risk", severity:"High", title:`${r.mine_name} — High shortfall risk ${Math.round(r.shortfall_probability*100)}%`, detail:`Predicted shortfall ${r.predicted_shortfall_tonnes}t • ${r.date}`, color:"var(--danger)" })),
    ...recs.filter(r=>r.priority==="High").map(r=>({ id:r.rec_id, type:"Action", severity:"High", title:r.issue, detail:`${r.category} • ${r.action}`, color:"var(--danger)" })),
    ...equip.filter(e=>e.risk_level==="High").map(e=>({ id:e.equipment_id, type:"Fleet", severity:"High", title:`${e.equipment_id} — ${e.equipment_type} high breakdown risk ${Math.round(e.breakdown_risk_7d*100)}%`, detail:`${e.mine_id} • ${e.overdue_days>0? e.overdue_days+"d overdue":"maintenance due"}`, color:"var(--danger)" })),
    ...(dgms?.checks?.filter(c=>c.severity==="CRITICAL_VIOLATION")||[]).map(c=>({ id:c.id, type:"DGMS", severity:"High", title:c.title, detail:`${c.regulation_code} • ${c.current_telemetry_value}`, color:"var(--danger)" })),
    ...risk.filter(r=>r.risk_level==="Medium").slice(0,2).map(r=>({ id:`risk-m-${r.mine_id}`, type:"Risk", severity:"Medium", title:`${r.mine_name} — Medium risk ${Math.round(r.shortfall_probability*100)}%`, detail:`Predicted ${r.predicted_shortfall_tonnes}t short`, color:"var(--warning)" })),
    ...equip.filter(e=>e.risk_level==="Medium").slice(0,2).map(e=>({ id:`eq-m-${e.equipment_id}`, type:"Fleet", severity:"Medium", title:`${e.equipment_id} — Medium risk`, detail:e.equipment_type, color:"var(--warning)" })),
  ];

  const filtered = filter==="ALL"? alerts: alerts.filter(a=>a.severity===filter || a.type===filter);
  const counts = { High: alerts.filter(a=>a.severity==="High").length, Medium: alerts.filter(a=>a.severity==="Medium").length, Total: alerts.length, DGMS: dgms? dgms.summary?.critical_count||0 : 0 };

  const exportReport = ()=>{
    const report = { generated_at: new Date().toISOString(), mine: selectedMine||"all", counts, alerts, dgms_summary: dgms?.summary||null };
    dl(JSON.stringify(report,null,2), `command-center-${selectedMine||"all"}-${new Date().toISOString().slice(0,10)}.json`, "application/json");
  };

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderLeft:"3px solid var(--danger)" }}><div className="kpi-label">Critical alerts</div><div className="kpi-value mono kpi-accent-red">{counts.High}</div><div className="kpi-sub"><AlertTriangle size={12} style={{ display:"inline", verticalAlign:"middle" }}/> High severity</div></div>
        <div className="kpi-card" style={{ borderLeft:"3px solid var(--warning)" }}><div className="kpi-label">Warnings</div><div className="kpi-value mono kpi-accent-amber">{counts.Medium}</div><div className="kpi-sub">Medium severity</div></div>
        <div className="kpi-card"><div className="kpi-label">Total signals</div><div className="kpi-value mono">{counts.Total}</div><div className="kpi-sub">Across risk • DGMS • fleet • actions</div></div>
        <div className="kpi-card" style={{ borderLeft:"3px solid var(--success)" }}><div className="kpi-label">DGMS critical</div><div className="kpi-value mono" style={{ color: counts.DGMS? "var(--danger)":"var(--success)" }}>{counts.DGMS}</div><div className="kpi-sub">Statutory violations</div></div>
      </div>

      <div className="panel" style={{ display:"flex", flexWrap:"wrap", gap:10, alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
          <span className="mono" style={{ fontSize:11, color:"var(--faint)", letterSpacing:"0.08em", textTransform:"uppercase", display:"inline-flex", alignItems:"center", gap:6 }}><Filter size={12}/> Filter</span>
          {["ALL","High","Medium","Risk","DGMS","Fleet","Action"].map(f=>(
            <button key={f} className={`tab-btn ${filter===f?"active":""}`} onClick={()=>setFilter(f)}>{f}</button>
          ))}
        </div>
        <button onClick={exportReport} style={{ display:"inline-flex", alignItems:"center", gap:6, background:"var(--ink)", color:"var(--obsidian)", border:"1px solid var(--ink)", padding:"7px 12px", borderRadius:999, fontSize:12, cursor:"pointer" }}><Download size={14}/> Download Report</button>
      </div>

      <div className="panel">
        <div className="panel-head"><div><span className="panel-eyebrow">Live feed — risk • DGMS • fleet • actions</span><h2>Alerts &amp; Command Center</h2></div><span className="panel-note">{filtered.length} items • most critical first</span></div>
        {filtered.length===0? <div className="panel-note">No alerts for this filter — all nominal.</div> : (
          <div className="rec-list">
            {filtered.map(a=>(
              <div key={a.id} className={`rec-item p-${a.severity==="High"?"High":a.severity==="Medium"?"Medium":"Low"}`} style={{ borderLeftColor: a.color }}>
                <span className={`rec-tag p-${a.severity==="High"?"High":a.severity==="Medium"?"Medium":"Low"}`}>{a.type}</span>
                <div className="rec-body">
                  <div className="rec-category" style={{ color: a.color, fontWeight:700 }}>{a.severity} • {a.type}</div>
                  <div className="rec-issue">{a.title}</div>
                  <div className="rec-action">{a.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="panel-note" style={{ marginTop:12, display:"flex", gap:12, flexWrap:"wrap" }}>
          <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}><ShieldAlert size={14}/> Risk = shortfall model</span>
          <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}><Wrench size={14}/> Fleet = LSTM breakdown risk</span>
          <span>DGMS = MMR 1961 statutory checks</span>
        </div>
      </div>
    </>
  );
}
