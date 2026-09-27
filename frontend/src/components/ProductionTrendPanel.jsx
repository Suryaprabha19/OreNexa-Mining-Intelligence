import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";

// Flags disruption events on the timeline based on the same thresholds the
// recommendation engine uses server-side (rainfall > 40mm, downtime > 15hrs,
// blasting delay > 5hrs). Only the top few (by severity) are labeled to avoid
// cluttering the chart.
function findConstraintEvents(data) {
  const events = data
    .map((d) => {
      if (d.rainfall_mm > 40) return { date: d.date, label: "Weather Delay", severity: d.rainfall_mm };
      if (d.equipment_downtime_hours > 15) return { date: d.date, label: "Maintenance Window", severity: d.equipment_downtime_hours };
      if (d.blasting_delay_hours > 5) return { date: d.date, label: "Blasting Delay", severity: d.blasting_delay_hours };
      return null;
    })
    .filter(Boolean);
  return events.sort((a, b) => b.severity - a.severity).slice(0, 4);
}

// Highlights manually-logged days (vs. the synthetic baseline) with a filled
// teal dot so it's clear which points came from real supervisor entries.
function ActualDot(props) {
  const { cx, cy, payload } = props;
  if (!payload.is_manual) return null;
  return <circle cx={cx} cy={cy} r={3.5} fill="#0e8f7c" stroke="#fff" strokeWidth={1} />;
}

export default function ProductionTrendPanel({ data }) {
  if (!data || data.length === 0) {
    return <div className="loading-state">No production history available.</div>;
  }

  const events = findConstraintEvents(data);
  const hasTarget = data.some((d) => d.target_tonnes != null);

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ComposedChart data={data} margin={{ top: 36, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0e8f7c" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#0e8f7c" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#e8eaed" strokeDasharray="3 5" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#5a6066", fontSize: 11, fontFamily: "JetBrains Mono" }}
          tickFormatter={(d) => d.slice(5)}
          interval="preserveStartEnd"
          axisLine={{ stroke: "#dde1e5" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#5a6066", fontSize: 11, fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
          width={54}
        />
        <Tooltip
          contentStyle={{
            background: "#ffffff",
            border: "1px solid #dde1e5",
            borderRadius: 8,
            fontFamily: "JetBrains Mono",
            fontSize: 12,
            boxShadow: "0 4px 16px rgba(16,24,32,0.10)",
          }}
          labelStyle={{ color: "#5a6066" }}
        />
        <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Inter" }} />

        {events.map((ev, i) => (
          <ReferenceLine
            key={i}
            x={ev.date}
            stroke="#b9790a"
            strokeDasharray="4 3"
            label={{
              value: ev.label,
              position: "insideTopLeft",
              dy: -30 + (i % 2) * 14,
              fill: "#b9790a",
              fontSize: 10,
              fontFamily: "JetBrains Mono",
            }}
          />
        ))}

        <Area
          type="monotone"
          dataKey="actual_tonnes"
          name="Actual"
          stroke="#0e8f7c"
          fill="url(#actualFill)"
          strokeWidth={2}
          dot={<ActualDot />}
        />
        <Line
          type="monotone"
          dataKey="planned_tonnes"
          name="Planned"
          stroke="#b1541f"
          strokeWidth={1.5}
          strokeDasharray="5 3"
          dot={false}
        />
        {hasTarget && (
          <Line
            type="monotone"
            dataKey="target_tonnes"
            name="Monthly Target"
            stroke="#5c6368"
            strokeWidth={1.5}
            strokeDasharray="2 2"
            dot={false}
            connectNulls
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
