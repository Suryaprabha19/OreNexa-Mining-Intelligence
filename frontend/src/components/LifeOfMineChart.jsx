import { useEffect, useState } from "react";
import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";
import { getLifeOfMine } from "../api/client";
import { fmtTonnes } from "../theme";

const SCENARIOS = [
  { key: "current", label: "Current Run-Rate" },
  { key: "nameplate", label: "Nameplate Capacity" },
  { key: "accelerated", label: "Accelerated (+20%)" },
];

export default function LifeOfMineChart({ mineId, mineName }) {
  const [scenario, setScenario] = useState("current");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mineId) {
      setData(null);
      return;
    }
    setLoading(true);
    getLifeOfMine(mineId, scenario)
      .then(setData)
      .finally(() => setLoading(false));
  }, [mineId, scenario]);

  if (!mineId) {
    return <div className="panel-note">Select a specific mine above to see its life-of-mine forecast.</div>;
  }
  if (loading || !data) {
    return <div className="loading-state">Projecting reserve depletion…</div>;
  }

  const chartData = data.timeline.map((p) => ({
    ...p,
    total_mmt: +(p.total_reserves_tonnes / 1_000_000).toFixed(3),
    proved_mmt: +(p.proved_reserves_tonnes / 1_000_000).toFixed(3),
    accelerated_mmt: +(p.accelerated_reserves_tonnes / 1_000_000).toFixed(3),
  }));

  return (
    <div>
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi-card">
          <div className="kpi-label">Total Identified Reserves</div>
          <div className="kpi-value kpi-accent-teal">{fmtTonnes(data.total_reserves_tonnes)}</div>
          <div className="kpi-sub">Proved: {fmtTonnes(data.proved_reserves_tonnes)} (drilling confidence &ge;70%)</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Effective Annual Rate</div>
          <div className="kpi-value">{fmtTonnes(data.effective_annual_rate_tonnes)}/yr</div>
          <div className="kpi-sub">Scenario: {SCENARIOS.find((s) => s.key === scenario)?.label}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Life of Mine</div>
          <div className="kpi-value kpi-accent-amber">{data.life_of_mine_years} yrs</div>
          <div className="kpi-sub">Projected exhaustion: {data.exhaustion_year_total}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Proved-Reserve Horizon</div>
          <div className="kpi-value">{data.exhaustion_year_proved}</div>
          <div className="kpi-sub">Year probable (121-equivalent) reserves take over</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 14 }}>
        {SCENARIOS.map((s) => (
          <button key={s.key} className={`tab-btn ${scenario === s.key ? "active" : ""}`} onClick={() => setScenario(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="totalReservesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--cyan)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border-soft)" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="year" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <YAxis
            tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
            axisLine={false} tickLine={false} width={60}
            label={{ value: "MMT", angle: -90, position: "insideLeft", fill: "var(--text-faint)", fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 12 }}
            labelStyle={{ color: "var(--text-muted)" }}
            formatter={(v) => `${v} MMT`}
          />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-body)" }} />
          <ReferenceLine x={data.exhaustion_year_proved} stroke="var(--success)" strokeDasharray="3 3" label={{ value: "Proved end", position: "top", fill: "var(--success)", fontSize: 10 }} />
          <ReferenceLine x={data.exhaustion_year_total} stroke="var(--warning)" strokeDasharray="4 4" label={{ value: "Depletion", position: "top", fill: "var(--warning)", fontSize: 10 }} />
          <Area type="monotone" dataKey="total_mmt" name="Total Identified" stroke="var(--cyan)" fill="url(#totalReservesFill)" strokeWidth={2} />
          <Line type="monotone" dataKey="proved_mmt" name="Proved (confidence ≥70%)" stroke="var(--success)" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="accelerated_mmt" name="Accelerated (+20%)" stroke="var(--warning)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="panel-note" style={{ marginTop: 10 }}>
        Proved/probable split uses this dataset's drilling_confidence field as a proxy for UNFC 111/121
        reserve classification. "Nameplate" and "Accelerated" rates are derived from historical planned
        tonnage, not a certified mine plan.
      </p>
    </div>
  );
}
