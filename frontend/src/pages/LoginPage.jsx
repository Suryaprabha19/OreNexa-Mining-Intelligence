import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Mountain, ClipboardList, Truck, LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLE_CARDS = [
  { id: "admin", icon: Shield, label: "Admin" },
  { id: "planner", icon: Mountain, label: "Mine Planner" },
  { id: "field", icon: ClipboardList, label: "Field Team" },
  { id: "equip", icon: Truck, label: "Equipment Ops" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");

  const onLogin = (e) => {
    e.preventDefault();
    setErr("");
    const res = login(username.trim(), password);
    if (!res.ok) setErr(res.error);
    else navigate("/", { replace: true });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 56, background: "rgba(255,255,255,0.82)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", padding: "0 20px", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #ff7a18, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>Mn</div>
        <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>OreNexa</div>
        <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--faint)", letterSpacing: "0.08em", textTransform: "uppercase" }}>MOIL · Ministry of Steel</div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
        <form onSubmit={onLogin} className="panel" style={{ width: "100%", maxWidth: 400, padding: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>Sign in</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6, lineHeight: 1.5 }}>Enter your MOIL credentials to continue.</p>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {ROLE_CARDS.map(({ id, icon: Icon, label }) => (
              <span key={id} title={label} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 6px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--line-soft)", fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>
                <Icon size={14} /> {label}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 6 }}>
              Username
              <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="admin" autoComplete="username" style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", fontSize: 13 }} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 6 }}>
              Password
              <div style={{ display: "flex", gap: 8 }}>
                <input type={show? "text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" style={{ flex:1, background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", fontSize: 13 }} />
                <button type="button" onClick={()=>setShow(s=>!s)} aria-label="Toggle password" style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid var(--line)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>{show? <EyeOff size={16}/>: <Eye size={16}/>}</button>
              </div>
            </label>

            {err && <div style={{ fontSize: 12, color: "var(--danger)", background: "var(--danger-soft)", border: "1px solid rgba(220,38,38,0.12)", padding: "8px 10px", borderRadius: 10 }}>{err}</div>}

            <button type="submit" className="btn-primary" style={{ justifyContent: "center", width: "100%", marginTop: 2 }}>
              <LogIn size={16} /> Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
