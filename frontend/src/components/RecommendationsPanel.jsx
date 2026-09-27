import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { postRecommendationAction } from "../api/client";
import { useAuth } from "../context/AuthContext";

function timeAgo(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function RecommendationsPanel({ recommendations }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [expanded, setExpanded] = useState({});
  // Optimistic overrides keyed by rec_id, applied on top of server data until refetch.
  const [overrides, setOverrides] = useState({});
  const [busy, setBusy] = useState({});

  if (!recommendations || recommendations.length === 0) {
    return <div className="loading-state">No recommendations right now.</div>;
  }

  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const act = async (recId, status) => {
    setBusy((b) => ({ ...b, [recId]: true }));
    setOverrides((o) => ({ ...o, [recId]: { status, status_updated_at: new Date().toISOString() } }));
    try {
      await postRecommendationAction(recId, status);
    } catch {
      setOverrides((o) => {
        const next = { ...o };
        delete next[recId];
        return next;
      });
    } finally {
      setBusy((b) => ({ ...b, [recId]: false }));
    }
  };

  return (
    <div className="rec-list">
      {recommendations.map((r) => {
        const id = r.rec_id;
        const effective = overrides[id] || r;
        const status = effective.status;
        const isDismissed = status === "dismissed";
        const isAuthorized = status === "authorized";

        return (
          <div className={`rec-item p-${r.priority}`} key={id} style={{ opacity: isDismissed ? 0.5 : 1 }}>
            <span className={`rec-tag p-${r.priority}`}>{r.priority}</span>
            <div className="rec-body">
              <div className="rec-category">{r.category}</div>
              <div className="rec-issue">{r.issue}</div>
              <div className="rec-action">→ {r.action}</div>

              {r.trigger_rule && (
                <div style={{ marginTop: 8 }}>
                  <span
                    onClick={() => toggle(id)}
                    style={{ fontSize: 11.5, color: "var(--cyan)", cursor: "pointer", fontFamily: "var(--font-mono)" }}
                  >
                    {expanded[id] ? "▾ Hide rule" : "▸ Why?"}
                  </span>
                  {expanded[id] && (
                    <div
                      className="mono"
                      style={{
                        marginTop: 6, padding: "8px 10px", background: "var(--panel-2)",
                        borderRadius: 6, fontSize: 11.5, color: "var(--text-muted)",
                        border: "1px solid var(--border-soft)",
                      }}
                    >
                      Triggered because: {r.trigger_rule}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {isAuthorized || isDismissed ? (
                  <>
                    <span
                      className="mono"
                      style={{
                        fontSize: 11, color: isAuthorized ? "var(--success)" : "var(--text-faint)",
                        textTransform: "uppercase", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: 4,
                      }}
                    >
                      {isAuthorized ? <><ShieldCheck size={12}/> Authorized by Admin · Deployed</> : "Dismissed by Admin"}
                      {effective.status_updated_at && ` · ${timeAgo(effective.status_updated_at)}`}
                    </span>
                    {isAdmin ? (
                      <button
                        onClick={() => act(id, "pending")}
                        disabled={busy[id]}
                        style={{
                          background: "transparent", color: "var(--text-faint)", border: "none",
                          fontSize: 11, cursor: "pointer", textDecoration: "underline",
                        }}
                      >
                        Undo (Admin only)
                      </button>
                    ) : (
                      <span className="mono" style={{ fontSize: 10, color: "var(--faint)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Replicated to all roles</span>
                    )}
                  </>
                ) : isAdmin ? (
                  <>
                    <button
                      onClick={() => act(id, "authorized")}
                      disabled={busy[id]}
                      style={{
                        background: "var(--ink)", color: "#fff", border: "1px solid var(--ink)",
                        borderRadius: 999, padding: "5px 12px", fontSize: 11.5, cursor: "pointer", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4,
                      }}
                    >
                      <ShieldCheck size={12}/> Authorize
                    </button>
                    <button
                      onClick={() => act(id, "dismissed")}
                      disabled={busy[id]}
                      style={{
                        background: "transparent", color: "var(--text-faint)", border: "1px solid var(--border)",
                        borderRadius: 999, padding: "5px 12px", fontSize: 11.5, cursor: "pointer",
                      }}
                    >
                      Dismiss
                    </button>
                    <span className="mono" style={{ fontSize: 10, color: "var(--faint)" }}>Admin decision replicates to Planner/Field/Equipment</span>
                  </>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)", background: "var(--amber-soft)", border: "1px solid rgba(255,122,24,0.14)", padding: "5px 9px", borderRadius: 999 }}>
                    <ShieldCheck size={12} style={{ color: "var(--amber)" }}/> Awaiting Admin authorization — read-only
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
