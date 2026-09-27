import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { getMines, getKpis, getTelemetry, getRisk, getEquipmentHealth, getDgmsCompliance, getReserveSummary, getProductionTrend, getLifeOfMine } from "../api/client";
import { fmtTonnes } from "../theme";
import ProductionTrendPanel from "../components/ProductionTrendPanel";
import RiskPanel from "../components/RiskPanel";
import EquipmentHealthPanel from "../components/EquipmentHealthPanel";
import DgmsCompliancePanel from "../components/DgmsCompliancePanel";

function dl(content, filename, mime){ const b=new Blob([content],{type:mime}); const u=URL.createObjectURL(b); const a=document.createElement("a"); a.href=u; a.download=filename; a.click(); URL.revokeObjectURL(u); }

export default function MineDetailPage(){
  const { mineId } = useParams();
  const [mine,setMine]=useState(null);
  const [kpis,setKpis]=useState(null);
  const [tel,setTel]=useState(null);
  const [risk,setRisk]=useState([]);
  const [equip,setEquip]=useState([]);
  const [summary,setSummary]=useState(null);
  const [trend,setTrend]=useState([]);
  const [life,setLife]=useState(null);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    Promise.all([
      getMines(),
      getKpis(mineId),
      getTelemetry(mineId),
      getRisk(mineId),
      getEquipmentHealth(mineId),
      getReserveSummary(),
      getProductionTrend(mineId, 90),
      getLifeOfMine(mineId, "current").catch(()=>null),
    ]).then(([mines,k,t,rk,eq,rs,tr,lm])=>{
      setMine(mines.find(m=>m.mine_id===mineId) || { mine_id: mineId, mine_name: mineId, state: "" });
      setKpis(k); setTel(t); setRisk(rk); setEquip(eq);
      setSummary(rs.find(r=>r.mine_id===mineId) || null);
      setTrend(tr); setLife(lm);
      setLoaded(true);
    });
  },[mineId]);

  if(!loaded) return <div className="loading-state">Loading {mineId}…</div>;
  if(!mine) return <div className="error-state">Mine not found</div>;

  const exportReport = ()=>{
    const report = { generated_at: new Date().toISOString(), mine, kpis, telemetry: tel, risk: risk[0]||null, equipment_count: equip.length, reserve_summary: summary, life_of_mine: life, trend_sample: trend.slice(-10) };
    dl(JSON.stringify(report,null,2), `mine-${mineId}-360-${new Date().toISOString().slice(0,10)}.json`, "application/json");
  };

  return (
    <>
      <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
        <Link to="/" className="mono" style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:12, color:"var(--muted)", border:"1px solid var(--line)", padding:"6px 10px", borderRadius:999, background:"rgba(255,255,255,0.04)" }}><ArrowLeft size={14}/> Back to Overview</Link>
        <span className="mono" style={{ fontSize:11, color:"var(--faint)", letterSpacing:"0.08em", textTransform:"uppercase" }}>Drill-down • {mineId}</span>
        <button onClick={exportReport} style={{ marginLeft:"auto", display:"inline-flex", alignItems:"center", gap:6, background:"var(--ink)", color:"var(--obsidian)", border:"1px solid var(--ink)", padding:"7px 12px", borderRadius:999, fontSize:12, cursor:"pointer" }}><Download size={14}/> Download Mine Report</button>
      </div>

      <div className="panel" style={{ background: "linear-gradient(135deg, rgba(255,122,24,0.08), rgba(0,229,204,0.06))" }}>
        <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"space-between", gap:16, alignItems:"flex-start" }}>
          <div>
            <div className="mono" style={{ fontSize:10, letterSpacing:"0.11em", textTransform:"uppercase", color:"var(--faint)" }}>{mine.state || "MOIL"} • {mine.district || ""} • Deep Underground</div>
            <h2 style={{ fontSize:22, marginTop:4 }}>{mine.mine_name}</h2>
            <div className="mono" style={{ fontSize:11, color:"var(--muted)", marginTop:4 }}>{mineId} • {mine.latitude?.toFixed(4) ?? "21.8049"}°N, {mine.longitude?.toFixed(4) ?? "80.1852"}°E • Cartosat-3 / Sentinel-1 sync</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div className="kpi-label">Reserve</div><div className="kpi-value mono" style={{ fontSize:18 }}>{summary? fmtTonnes(summary.total_predicted_reserve_tonnes):"—"}</div>
            <div className="kpi-sub">Confidence {summary? Math.round(summary.avg_confidence*100)+"%":"—"} • {summary?.grid_points||0} grid points</div>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-label">Predicted Reserves</div><div className="kpi-value mono kpi-accent">{summary? fmtTonnes(summary.total_predicted_reserve_tonnes):"—"}</div><div className="kpi-sub">This mine</div></div>
        <div className="kpi-card"><div className="kpi-label">Avg Daily Production</div><div className="kpi-value mono kpi-accent-teal">{kpis? fmtTonnes(kpis.avg_daily_production_tonnes):"—"}</div><div className="kpi-sub">Trailing 30d</div></div>
        <div className="kpi-card"><div className="kpi-label">Shortfall Rate</div><div className="kpi-value mono kpi-accent-red">{kpis? kpis.shortfall_rate_pct+"%":"—"}</div><div className="kpi-sub">Days &lt;90% plan</div></div>
        <div className="kpi-card"><div className="kpi-label">Fleet at risk</div><div className="kpi-value mono">{equip.filter(e=>e.risk_level==="High").length} / {equip.length}</div><div className="kpi-sub">High-risk units</div></div>
      </div>

      {life && (
        <div className="panel">
          <div className="panel-head"><div><span className="panel-eyebrow">Life-of-Mine</span><h2>Exhaustion Horizon</h2></div><span className="mono" style={{ fontSize:11, color:"var(--muted)" }}>{life.life_of_mine_years} yrs • {life.exhaustion_year_total}</span></div>
          <div className="kpi-grid" style={{ gridTemplateColumns:"repeat(3,1fr)" }}>
            <div><div className="kpi-label">Identified</div><div className="kpi-value mono" style={{ fontSize:16 }}>{fmtTonnes(life.total_reserves_tonnes)}</div></div>
            <div><div className="kpi-label">Rate</div><div className="kpi-value mono" style={{ fontSize:16 }}>{fmtTonnes(life.effective_annual_rate_tonnes)}/yr</div></div>
            <div><div className="kpi-label">Proved horizon</div><div className="kpi-value mono" style={{ fontSize:16 }}>{life.exhaustion_year_proved}</div></div>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head"><div><span className="panel-eyebrow">90 days</span><h2>Production Trend</h2></div></div>
          <ProductionTrendPanel data={trend} />
        </div>
        <div className="panel">
          <div className="panel-head"><div><span className="panel-eyebrow">Next operating day</span><h2>Risk</h2></div></div>
          <RiskPanel riskList={risk} selectedMine={mineId} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><div><span className="panel-eyebrow">DGMS MMR 1961</span><h2>Statutory Compliance</h2></div></div>
        <DgmsCompliancePanel mineId={mineId} mineName={mine.mine_name} />
      </div>

      <div className="panel">
        <div className="panel-head"><div><span className="panel-eyebrow">LSTM health scores</span><h2>Equipment — {equip.length} units</h2></div></div>
        <EquipmentHealthPanel equipment={equip} />
      </div>

      {tel && (
        <div className="panel">
          <div className="panel-head"><div><span className="panel-eyebrow">Space &amp; pit telemetry</span><h2>Telemetry Snapshot</h2></div></div>
          <div className="kpi-grid" style={{ gridTemplateColumns:"repeat(3,1fr)" }}>
            <div><div className="kpi-label">Yield prediction</div><div className="kpi-value mono">{tel.predicted_yield_tonnes}t</div><div className="kpi-sub">Target {tel.target_tonnes}t ({tel.yield_pct_of_target}%)</div></div>
            <div><div className="kpi-label">Shortfall risk</div><div className="kpi-value mono" style={{ color: tel.risk_level==="High"?"var(--danger)": tel.risk_level==="Medium"?"var(--warning)":"var(--success)" }}>{tel.shortfall_risk_pct}% • {tel.risk_level}</div></div>
            <div><div className="kpi-label">Pit water</div><div className="kpi-value mono">{tel.pit_water_level_mm} mm</div><div className="kpi-sub">Fleet {tel.fleet?.utilization_pct}% util</div></div>
          </div>
        </div>
      )}
    </>
  );
}
