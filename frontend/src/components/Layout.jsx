import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import Sidebar from "./Sidebar";
import { getMines } from "../api/client";
import { useAuth } from "../context/AuthContext";

const PAGE_META = {
  "/": { eyebrow: "Field Dossier — Group View", title: "Overview", subtitle: "Reserve & production intelligence across the MOIL estate" },
  "/reserves": { eyebrow: "Core Log — Satellite Proxies", title: "Reserves", subtitle: "Gondite · Kodurite · Laterite — grade & confidence" },
  "/production": { eyebrow: "Daily Ledger", title: "Production", subtitle: "Plan vs actual · targets · field entries" },
  "/historic": { eyebrow: "Ledger Archive", title: "Historic Trends", subtitle: "Long-range 90–730d • audit & export" },
  "/risk": { eyebrow: "Shortfall Desk", title: "Risk & Planning", subtitle: "Next-day forecast, actions & what-if lab" },
  "/command": { eyebrow: "Alerts Desk", title: "Command Center", subtitle: "Risk • DGMS • Fleet — unified feed" },
  "/equipment": { eyebrow: "Fleet Ledger", title: "Equipment", subtitle: "LSTM health scores & GA reallocation" },
};

export default function Layout() {
  const [mines, setMines] = useState([]);
  const [selectedMine, setSelectedMine] = useState(null);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const getMeta = () => {
    if (PAGE_META[location.pathname]) return PAGE_META[location.pathname];
    if (location.pathname.startsWith("/mine")) return { eyebrow: "Drill-down", title: "Mine 360°", subtitle: "Per-mine dossier • reserves + production + risk + DGMS + fleet" };
    return { eyebrow: "OreNexa", title: "Dashboard", subtitle: "" };
  };
  const meta = getMeta();

  useEffect(() => {
    getMines()
      .then(setMines)
      .catch(() => setError("Could not reach the API. Is the backend running on :8010?"));
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-col">
        <header className="atelier-header">
          <div className="header-wordmark">
            <h1>Ore<em>Nexa</em></h1>
            <p>MOIL · Ministry of Steel</p>
          </div>
          <div className="header-divider" />
          <div className="page-meta">
            <span className="eyebrow">{meta.eyebrow}</span>
            <h2>{meta.title}</h2>
            <span className="subtitle">{meta.subtitle}</span>
          </div>
          <div className="header-actions">
            <span className="live-pill" title="XGBoost · LSTM · GA — live">
              <span className="live-dot" />
              Live
            </span>
            <select
              className="mine-select"
              value={selectedMine || ""}
              onChange={(e) => setSelectedMine(e.target.value || null)}
              aria-label="Select mine"
            >
              <option value="">All Mines — Group</option>
              {mines.map((m) => (
                <option key={m.mine_id} value={m.mine_id}>
                  {m.mine_name} · {m.state}
                </option>
              ))}
            </select>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:6, paddingLeft:10, borderLeft:"1px solid var(--line)" }}>
              <span className="mono" style={{ fontSize:11, fontWeight:700, color:"var(--ink)", background:"var(--surface-2)", border:"1px solid var(--line-soft)", padding:"4px 8px", borderRadius:999 }}>{user?.name}</span>
              <span className="mono" style={{ fontSize:10, letterSpacing:"0.06em", textTransform:"uppercase", color:"var(--faint)", background:"var(--amber-soft)", border:"1px solid rgba(255,122,24,0.16)", padding:"3px 7px", borderRadius:999 }}>{user?.roleLabel}</span>
              <button onClick={()=>{ logout(); navigate("/login"); }} title="Sign out" style={{ width:30, height:30, borderRadius:999, border:"1px solid var(--line)", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--muted)" }}><LogOut size={14}/></button>
            </div>
          </div>
        </header>

        <div className="content-body">
          {error ? (
            <div className="error-state">{error}</div>
          ) : (
            <Outlet context={{ mines, selectedMine }} />
          )}
          <div className="footnote">
            MOIL Ltd. · Ministry of Steel, Govt. of India — Geological Field Book System · Cartosat-3 · Sentinel-2 · DGMS · SIH 2026 Synthetic Preview
          </div>
        </div>
      </div>
    </div>
  );
}
