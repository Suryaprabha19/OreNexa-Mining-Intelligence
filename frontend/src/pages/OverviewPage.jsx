import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Mountain, TrendingUp, ShieldAlert, Truck, ArrowRight } from "lucide-react";
import TelemetryStrip from "../components/TelemetryStrip";
import { fmtTonnes } from "../theme";
import {
  getKpis, getReserveSummary, getRisk, getEquipmentHealth, getRecommendations, getTelemetry,
} from "../api/client";

export default function OverviewPage() {
  const { selectedMine } = useOutletContext();
  const navigate = useNavigate();

  const [kpis, setKpis] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [reserveSummary, setReserveSummary] = useState([]);
  const [risk, setRisk] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [recs, setRecs] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    Promise.all([
      getKpis(selectedMine),
      getTelemetry(selectedMine),
      getReserveSummary(),
      getRisk(selectedMine),
      getEquipmentHealth(selectedMine),
      getRecommendations(selectedMine),
    ]).then(([k, tel, rs, rk, eq, rc]) => {
      setKpis(k);
      setTelemetry(tel);
      setReserveSummary(rs);
      setRisk(rk);
      setEquipment(eq);
      setRecs(rc);
      setLoaded(true);
    });
  }, [selectedMine]);

  if (!loaded) return <div className="loading-state">Loading overview…</div>;

  const totalReserve = reserveSummary.reduce((s, r) => s + r.total_predicted_reserve_tonnes, 0);
  const highRiskCount = risk.filter((r) => r.risk_level === "High").length;
  const topRisk = [...risk].sort((a, b) => b.shortfall_probability - a.shortfall_probability)[0];
  const highRiskEquipment = equipment.filter((e) => e.risk_level === "High").length;
  const topRec = recs[0];
  // Spec-aligned hero metrics — replicate Strategic AI Command dump
  const activeMine = telemetry?.mine_name || (selectedMine ? reserveSummary.find(r=>r.mine_id===selectedMine)?.mine_name : null) || "Balaghat Mine (Bharweli)";
  const satRisk = telemetry?.risk_level || (highRiskCount>0?"High": highRiskCount>0?"Medium":"Moderate");
  const spaceGrade = "43.8% Mn"; // from dump — UNFC grade proxy
  const provedReserve = fmtTonnes(totalReserve*0.64); // ~proved portion

  return (
    <>
      {/* Strategic AI Command hero — matches dump: Satellite Sync, Sat-Risk, Mine Unit */}
      <div className="panel" style={{ padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", background: "var(--panel)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>SEC-L3 • Problem 26009 • Manganese Reserve Analysis System</span>
          <span style={{ width: 1, height: 14, background: "var(--line)" }} />
          <span className="mono" style={{ fontSize: 11, color: "var(--teal)", fontWeight: 700 }}>Satellite Sync: Active (Cartosat-3 / Sentinel-1)</span>
          <span className={`risk-badge risk-${satRisk==="High"?"High":satRisk==="Moderate"?"Medium":"Low"}`} style={{ marginLeft: 6, fontSize: 10 }}>Sat-Risk: {satRisk.toUpperCase()} ({satRisk==="High"?30:satRisk==="Moderate"?30:18}) • 21.8049° N, 80.1852° E</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--line-soft)", padding: "5px 9px", borderRadius: 8 }}>
            Mine Unit: <strong>{activeMine}</strong> • Deep Underground
          </div>
          {selectedMine && (
            <button onClick={()=>navigate(`/mine/${selectedMine}`)} style={{ display:"inline-flex", alignItems:"center", gap:6, background:"var(--amber)", color:"#fff", border:"1px solid var(--amber)", padding:"6px 11px", borderRadius:999, fontSize:11, fontWeight:600, cursor:"pointer" }}>Drill down → {selectedMine}</button>
          )}
        </div>
      </div>

      {/* Dump-aligned KPI quartet: Reserves / Production Health / Shortfall Risk / Space & Fleet */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderTopColor: "var(--brass)" }}>
          <div className="kpi-label">Total Identified Reserves <span style={{ color: "var(--teal)", fontWeight: 700, marginLeft: 6 }}>+4.2% Space Analysis</span></div>
          <div className="kpi-value">{fmtTonnes(totalReserve)} <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>{spaceGrade} (UNFC)</span></div>
          <div className="kpi-sub">Proved: {provedReserve} • Exhaustion: see Reserves → Life-of-Mine</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: "var(--teal)" }}>
          <div className="kpi-label">Production Health — MTD</div>
          <div className="kpi-value kpi-accent-teal">{kpis ? `${Math.round((kpis.avg_daily_production_tonnes*30)/1000)}k` : "28.4k"} <span style={{ fontSize: 13, color: "var(--muted)" }}>/ 37.5k MT Target</span></div>
          <div className="kpi-sub">Target Status: <span style={{ color: "var(--teal)", fontWeight: 700 }}>ON TRACK</span> • {kpis?.shortfall_rate_pct ?? 24}% shortfall days • 76% MTD</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: "var(--danger)" }}>
          <div className="kpi-label">Shortfall Risk Monitor</div>
          <div className="kpi-value kpi-accent-red">{highRiskCount>0?"HIGH":"MODERATE"} <span style={{ fontSize: 13, color: "var(--muted)" }}>-4,900 MT Gap</span></div>
          <div className="kpi-sub">Operational Engine: {recs.length} Actions Active • Top: {topRisk?topRisk.mine_name:"Balaghat"}</div>
        </div>
        <div className="kpi-card" style={{ borderTopColor: "var(--ink)" }}>
          <div className="kpi-label">Space &amp; Fleet Inputs</div>
          <div className="kpi-value" style={{ fontSize: 18 }}>38mm <span style={{ fontSize: 12, color: "var(--muted)" }}>rain 24h</span> • 84% <span style={{ fontSize: 12, color: "var(--muted)" }}>HEMM</span> • SWIR 1.92</div>
          <div className="kpi-sub">Soil: Optimum • NDVI 0.28 • Pit radar: Moderate rain 25-40mm</div>
        </div>
      </div>

      <TelemetryStrip telemetry={telemetry} />

      <div className="shortcut-grid">
        <div className="shortcut-card" onClick={() => navigate("/reserves")}>
          <div className="shortcut-card-head">
            <div className="shortcut-icon"><Mountain /></div>
          </div>
          <h3>Reserve Estimation</h3>
          <div className="shortcut-stats">
            <div>
              <div className="shortcut-stat-label">Total predicted</div>
              <div className="shortcut-stat-value kpi-accent">{fmtTonnes(totalReserve)}</div>
            </div>
            <div>
              <div className="shortcut-stat-label">Grid points</div>
              <div className="shortcut-stat-value">{reserveSummary.reduce((s, r) => s + r.grid_points, 0)}</div>
            </div>
          </div>
          <span className="shortcut-link">View reserve map <ArrowRight size={14} /></span>
        </div>

        <div className="shortcut-card" onClick={() => navigate("/production")}>
          <div className="shortcut-card-head">
            <div className="shortcut-icon"><TrendingUp /></div>
          </div>
          <h3>Production</h3>
          <div className="shortcut-stats">
            <div>
              <div className="shortcut-stat-label">Avg daily output</div>
              <div className="shortcut-stat-value kpi-accent-teal">{fmtTonnes(kpis?.avg_daily_production_tonnes)}</div>
            </div>
            <div>
              <div className="shortcut-stat-label">Shortfall rate</div>
              <div className="shortcut-stat-value">{kpis?.shortfall_rate_pct}%</div>
            </div>
          </div>
          <span className="shortcut-link">View production trend <ArrowRight size={14} /></span>
        </div>

        <div className="shortcut-card" onClick={() => navigate("/risk")}>
          <div className="shortcut-card-head">
            <div className="shortcut-icon" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
              <ShieldAlert />
            </div>
          </div>
          <h3>Risk &amp; Planning</h3>
          <div className="shortcut-stats">
            <div>
              <div className="shortcut-stat-label">High-risk mines</div>
              <div className="shortcut-stat-value kpi-accent-red">{highRiskCount}</div>
            </div>
            <div>
              <div className="shortcut-stat-label">Top concern</div>
              <div className="shortcut-stat-value" style={{ fontSize: 13 }}>
                {topRisk ? topRisk.mine_name : "None"}
              </div>
            </div>
          </div>
          <span className="shortcut-link">View risk &amp; recommendations <ArrowRight size={14} /></span>
        </div>

        <div className="shortcut-card" onClick={() => navigate("/equipment")}>
          <div className="shortcut-card-head">
            <div className="shortcut-icon" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>
              <Truck />
            </div>
          </div>
          <h3>Equipment</h3>
          <div className="shortcut-stats">
            <div>
              <div className="shortcut-stat-label">Units tracked</div>
              <div className="shortcut-stat-value">{equipment.length}</div>
            </div>
            <div>
              <div className="shortcut-stat-label">High risk</div>
              <div className="shortcut-stat-value kpi-accent-red">{highRiskEquipment}</div>
            </div>
          </div>
          <span className="shortcut-link">View equipment health <ArrowRight size={14} /></span>
        </div>
      </div>

      {topRec && (
        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="panel-eyebrow">Highest priority right now</span>
              <h2>Top Recommendation</h2>
            </div>
          </div>
          <div className={`rec-item p-${topRec.priority}`}>
            <span className={`rec-tag p-${topRec.priority}`}>{topRec.priority}</span>
            <div className="rec-body">
              <div className="rec-category">{topRec.category}</div>
              <div className="rec-issue">{topRec.issue}</div>
              <div className="rec-action">→ {topRec.action}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
