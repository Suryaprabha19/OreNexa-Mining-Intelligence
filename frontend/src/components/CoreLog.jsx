import { ROCK_COLORS } from "../theme";

// Signature element: a stylized drill-core cross-section strip. The dashboard
// is about turning drilling/geophysical data into decisions, so the visual
// language throughout borrows from a core sample log rather than generic UI chrome.
export default function CoreLog({ height = 6 }) {
  const sequence = [
    "Psilomelane", "Gondite", "Gondite", "Kodurite", "Laterite Capping",
    "Gondite", "Psilomelane", "Kodurite", "Gondite", "Laterite Capping",
    "Psilomelane", "Gondite",
  ];
  return (
    <div className="core-log" style={{ height }}>
      {sequence.map((rock, i) => (
        <span key={i} style={{ background: ROCK_COLORS[rock] }} />
      ))}
    </div>
  );
}
