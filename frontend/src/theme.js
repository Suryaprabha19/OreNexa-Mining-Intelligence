export const ROCK_COLORS = {
  Gondite: "#9a3412",
  Kodurite: "#92400e",
  Psilomelane: "#57534e",
  Laterite: "#115e59",
  "Laterite Capping": "#115e59",
};

export const RISK_COLORS = {
  High: "#991b1b",
  Medium: "#9a3412",
  Low: "#115e59",
};

export const fmtTonnes = (n) => {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M t`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k t`;
  return `${Math.round(n)} t`;
};

// GIS layer definitions — Atelier paper tones (warm stone → oxide)
export const MAP_LAYERS = {
  reserve: { label: "Predicted Reserve", field: "predicted_reserve_tonnes", low: "#fdf6e8", high: "#9a3412", unit: "t" },
  ndvi: { label: "Vegetation Index (NDVI)", field: "ndvi", low: "#fdf6e8", high: "#115e59", unit: "" },
  soil_moisture: { label: "Soil Moisture", field: "soil_moisture_pct", low: "#fdf6e8", high: "#115e59", unit: "%" },
  land_surface_temp: { label: "Land Surface Temp", field: "land_surface_temp_c", low: "#115e59", high: "#991b1b", unit: "°C" },
  drilling_confidence: { label: "Drilling Confidence", field: "drilling_confidence", low: "#fdf6e8", high: "#c9975a", unit: "" },
};

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function interpolateColor(hexLow, hexHigh, t) {
  const [r1, g1, b1] = hexToRgb(hexLow);
  const [r2, g2, b2] = hexToRgb(hexHigh);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}
