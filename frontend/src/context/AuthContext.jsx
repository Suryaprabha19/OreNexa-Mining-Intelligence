import { createContext, useContext, useEffect, useState } from "react";

const ROLES = {
  admin: { id: "admin", label: "Admin", desc: "Full access — users, mines, models", color: "#0f172a", routes: ["*", "historic", "command", "mine"] },
  planner: { id: "planner", label: "Mine Planner / Supervisor", desc: "Reserves, production planning, risk & DGMS", color: "#7c3aed", routes: ["/", "/reserves", "/production", "/historic", "/risk", "/command", "/mine"] },
  field: { id: "field", label: "Field Team", desc: "Daily ledger, pit checks, map view", color: "#0e9b8e", routes: ["/", "/reserves", "/production", "/historic", "/mine"] },
  equip: { id: "equip", label: "Equipment Ops", desc: "Fleet health, telemetry & reallocation", color: "#ea580c", routes: ["/", "/equipment", "/command", "/production", "/historic", "/mine"] },
};

// Mock credentials — SIH prototype (replace with real auth later)
export const USERS = [
  { username: "admin", password: "admin123", role: "admin", name: "MOIL Admin" },
  { username: "planner", password: "planner123", role: "planner", name: "A. Verma — Mine Planner" },
  { username: "field", password: "field123", role: "field", name: "Field Crew Balaghat" },
  { username: "equip", password: "equip123", role: "equip", name: "Equipment Ops" },
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { const raw = localStorage.getItem("orenexa_auth"); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });

  useEffect(() => {
    if (user) localStorage.setItem("orenexa_auth", JSON.stringify(user));
    else localStorage.removeItem("orenexa_auth");
  }, [user]);

  const login = (username, password) => {
    const u = USERS.find(x => x.username === username && x.password === password);
    if (!u) return { ok: false, error: "Invalid username or password" };
    const roleMeta = ROLES[u.role];
    const session = { username: u.username, name: u.name, role: u.role, roleLabel: roleMeta.label, routes: roleMeta.routes, loginAt: new Date().toISOString() };
    setUser(session);
    return { ok: true, user: session };
  };

  const loginAsRole = (roleId) => {
    const u = USERS.find(x => x.role === roleId);
    if (!u) return;
    const roleMeta = ROLES[u.role];
    const session = { username: u.username, name: u.name, role: u.role, roleLabel: roleMeta.label, routes: roleMeta.routes, loginAt: new Date().toISOString() };
    setUser(session);
  };

  const logout = () => setUser(null);

  const canAccess = (path) => {
    if (!user) return false;
    if (user.routes.includes("*")) return true;
    // normalize: "/" and "/reserves" etc; allow prefix match for /mine/:id as "/mine"
    if (path.startsWith("/mine")) return user.routes.includes("/mine") || user.routes.includes("*");
    return user.routes.includes(path);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginAsRole, logout, canAccess, ROLES, USERS }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth must be within AuthProvider");
  return v;
};

export { ROLES };
