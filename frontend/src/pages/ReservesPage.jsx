import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import ReserveMapPanel from "../components/ReserveMapPanel";
import LifeOfMineChart from "../components/LifeOfMineChart";
import { fmtTonnes } from "../theme";
import { getReserveMap, getReserveSummary, getEquipmentHealth } from "../api/client";

export default function ReservesPage() {
  const { mines, selectedMine } = useOutletContext();
  const [points, setPoints] = useState([]);
  const [summary, setSummary] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    Promise.all([
      getReserveMap(selectedMine),
      getReserveSummary(),
      getEquipmentHealth(selectedMine),
    ]).then(([p, s, eq]) => {
      setPoints(p);
      setSummary(s);
      setEquipment(eq);
      setLoaded(true);
    });
  }, [selectedMine]);

  if (!loaded) return <div className="loading-state">Loading reserve data…</div>;

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="panel-eyebrow">Sub-surface indicators + satellite proxies</span>
            <h2>Reserve Estimation Map</h2>
          </div>
          <span className="panel-note">{points.length} survey grid points</span>
        </div>
        <ReserveMapPanel points={points} mines={mines} selectedMine={selectedMine} equipment={equipment} />
      </div>

      {/* Boreholes + 2D Ore Body + Bands — from Strategic Command dump */}
      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="panel-eyebrow">Core &amp; 2D Section • Space anomaly apex</span>
            <h2>Exploration Drill Holes</h2>
          </div>
          <span className="panel-note">Boreholes (4) • Fault Lines • Dip Contours</span>
        </div>
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
          {[
            { id: "BG-101", label: "Footwall Deep", grade: "46.2%", note: "Shear-adjacent high-grade" },
            { id: "BG-108", label: "Central Hanging Wall", grade: "42.5%", note: "Braunite-gondite mix" },
            { id: "BG-204", label: "Eastern Extension Target", grade: "39.8%", note: "Infill target — 1.92 SWIR" },
            { id: "BG-SW9", label: "Space Anomaly Apex", grade: "47.1%", note: "Cartosat-3 / SWIR Mn-oxide peak" },
          ].map(b=>(
            <div key={b.id} className="kpi-card" style={{ padding: 14 }}>
              <div className="kpi-label">{b.id}</div>
              <div className="kpi-value" style={{ fontSize: 22 }}>{b.grade}</div>
              <div className="kpi-sub">{b.label} • {b.note}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {["PPV Blasting Heatmap","SWIR Mn-Oxide","NDVI Chlorosis","LST Thermal","SAR Moisture","Bouguer Gravity","Cartosat-3 Optical","Boreholes (4)","Fault Lines","Dip Contours"].map(tag=>(
            <span key={tag} className="mono" style={{ fontSize: 10, padding: "4px 8px", borderRadius: 999, background: tag.includes("PPV")?"var(--danger-soft)":tag.includes("SWIR")?"var(--oxide-soft)":"var(--panel-2)", border: "1px solid var(--line-soft)", color: tag.includes("PPV")?"var(--danger)":tag.includes("SWIR")?"var(--oxide)":"var(--muted)" }}>{tag}</span>
          ))}
        </div>
        <div className="panel-note" style={{ marginTop: 10 }}>
          <span className="mono" style={{ color: "var(--danger)", fontWeight: 700 }}>🚨 DGMS 5.0 mm/s • 4.0 mm/s Warning • 2.5 mm/s Compliant</span> — Blasts: Stope 9 (48 holes) 4.1 mm/s Compliant • Level -220m Crosscut (36 holes) 5.6 mm/s Violation → use Risk → DGMS audit. Shear Fault F-1 dip 65° SSW.
        </div>
      </div>

      {/* PPV / Sub-surface density strip — mirrors dump telemetry */}
      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="panel-eyebrow">DGMS Tech Circ 7/1997 — Tri-axial geophone telemetry</span>
            <h2>Real-Time Blasting Vibration (PPV) &amp; Isoseismals</h2>
          </div>
          <span className="panel-note">250m UTM 44N • WGS84 — Sub-surface density: Low → Anomalous</span>
        </div>
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
          {[
            { loc: "Western Highwall Crest", d: "68m", v: "4.8 mm/s", hz: "24 Hz", state: "68% of 5.0 — Near Limit", color: "var(--danger)" },
            { loc: "Bench 4 & Haul Ramp", d: "115m", v: "4.2 mm/s", hz: "19 Hz", state: "Warning zone", color: "var(--oxide)" },
            { loc: "Main Shaft & Winder", d: "240m", v: "2.1 mm/s", hz: "31 Hz", state: "Compliant", color: "var(--teal)" },
            { loc: "Township Buffer (300m)", d: "340m", v: "1.9 mm/s", hz: "14 Hz", state: "Compliant", color: "var(--teal)" },
            { loc: "Tailings Dam Toe", d: "380m", v: "1.6 mm/s", hz: "28 Hz", state: "Compliant", color: "var(--teal)" },
          ].map(t=>(
            <div key={t.loc} className="kpi-card" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="kpi-label">{t.loc}</div>
              <div className="kpi-value mono" style={{ fontSize: 16, color: t.color }}>{t.v} <span style={{ fontSize: 11, color: "var(--muted)" }}>{t.hz}</span></div>
              <div className="kpi-sub">{t.d} • {t.state}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="panel-eyebrow">Identified reserves @ current run-rate</span>
            <h2>Predicted Reserve Exhaustion Timeline</h2>
          </div>
          <span className="panel-note">0.00 MMT anomalous → Life-of-Mine forecast (select mine)</span>
        </div>
        <LifeOfMineChart mineId={selectedMine} mineName={mines.find(m=>m.mine_id===selectedMine)?.mine_name} />
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="panel-eyebrow">Per-mine rollup — click row to drill down</span>
            <h2>Reserve Summary</h2>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mine</th>
              <th className="mono">Predicted Reserve</th>
              <th className="mono">Avg Confidence</th>
              <th className="mono">Grid Points</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((s) => (
              <tr key={s.mine_id} onClick={()=>window.location.assign(`/mine/${s.mine_id}`)} style={{ cursor:"pointer" }}>
                <td style={{ color:"var(--amber)", fontWeight:600 }}>{s.mine_name} <span className="mono" style={{ fontSize:10, color:"var(--muted)" }}>{s.mine_id}</span></td>
                <td className="mono">{fmtTonnes(s.total_predicted_reserve_tonnes)}</td>
                <td className="mono">{Math.round(s.avg_confidence * 100)}%</td>
                <td className="mono">{s.grid_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
