import { NavLink } from "react-router-dom";
import { LayoutGrid, Mountain, TrendingUp, ShieldAlert, Truck, History, Radio } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/reserves", label: "Reserves", icon: Mountain },
  { to: "/production", label: "Production", icon: TrendingUp },
  { to: "/historic", label: "Historic", icon: History },
  { to: "/risk", label: "Risk", icon: ShieldAlert },
  { to: "/command", label: "Command", icon: Radio },
  { to: "/equipment", label: "Fleet", icon: Truck },
];

export default function Sidebar() {
  const { canAccess, user } = useAuth();
  const visible = NAV_ITEMS.filter(it => canAccess(it.to));
  return (
    <aside className="rail" aria-label="Primary navigation">
      <div className="rail-brand" title={`OreNexa — MOIL • ${user?.roleLabel || ""}`}>Mn</div>
      <div className="rail-rule" />
      <nav className="rail-nav">
        {visible.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `rail-item ${isActive ? "active" : ""}`}
            title={`${label} • ${user?.roleLabel}`}
          >
            <Icon />
            <span className="label">{label}</span>
          </NavLink>
        ))}
        {visible.length === 0 && <div className="panel-note" style={{ padding: "8px 6px", textAlign: "center" }}>No tabs for this role</div>}
      </nav>
      <div className="rail-footer">
        <span className="rail-dot" title="Live inference" />
        <small>{user?.roleLabel?.split(" ")[0] || "SIH ’26"}</small>
        <small style={{ opacity: 0.7 }}>{user ? user.username : "v1.2"}</small>
      </div>
    </aside>
  );
}
