import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allow }) {
  const { user, canAccess } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  // allow = explicit path or array of paths; fallback to current location pathname
  const path = allow || location.pathname;
  const paths = Array.isArray(path) ? path : [path];
  const ok = paths.some(p => canAccess(p));
  if (!ok) {
    return (
      <div className="panel" style={{ margin: 24 }}>
        <div className="panel-head"><div><span className="panel-eyebrow">Restricted</span><h2>Access denied for {user.roleLabel}</h2></div></div>
        <div className="panel-note">Your role <strong style={{ color:"var(--ink)" }}>{user.roleLabel} ({user.role})</strong> cannot access <span className="mono" style={{ background:"var(--surface-2)", padding:"1px 6px", borderRadius:6, border:"1px solid var(--line-soft)" }}>{location.pathname}</span>. Switch role or contact Admin.</div>
        <div style={{ marginTop: 12 }}><a href="/" className="btn-primary">Back to allowed workspace</a></div>
      </div>
    );
  }
  return children;
}
