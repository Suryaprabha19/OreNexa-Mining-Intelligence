import { useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Rectangle, Popup } from "react-leaflet";
import { ROCK_COLORS, MAP_LAYERS, RISK_COLORS, interpolateColor, fmtTonnes } from "../theme";
import HeatmapLayer from "./HeatmapLayer";

function scaleRadius(value, min, max) {
  if (max === min) return 8;
  const t = (value - min) / (max - min);
  return 4 + t * 14;
}

// Deterministic pseudo-random jitter so each equipment unit gets a stable
// approximate position near its mine (we don't have per-unit GPS in this
// dataset - this is a visual approximation, not real asset tracking).
function jitterFor(id, spread = 0.018) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const a = ((hash % 1000) / 1000 - 0.5) * 2 * spread;
  const b = (((hash >> 8) % 1000) / 1000 - 0.5) * 2 * spread;
  return [a, b];
}

export default function ReserveMapPanel({ points, mines, selectedMine, equipment }) {
  const [layerKey, setLayerKey] = useState("reserve");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showAssets, setShowAssets] = useState(false);
  const layer = MAP_LAYERS[layerKey];

  const { min, max } = useMemo(() => {
    if (!points || points.length === 0) return { min: 0, max: 1 };
    const vals = points.map((p) => p[layer.field]);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [points, layer.field]);

  const heatPoints = useMemo(() => {
    if (!points || points.length === 0) return [];
    return points.map((p) => {
      const t = max === min ? 0.5 : (p[layer.field] - min) / (max - min);
      return [p.latitude, p.longitude, Math.max(0.08, t)];
    });
  }, [points, layer.field, min, max]);

  const assetPins = useMemo(() => {
    if (!showAssets || !equipment || equipment.length === 0) return [];
    const mineMap = Object.fromEntries((mines || []).map((m) => [m.mine_id, m]));
    return equipment
      .filter((e) => mineMap[e.mine_id])
      .map((e) => {
        const m = mineMap[e.mine_id];
        const [dx, dy] = jitterFor(e.equipment_id);
        return { ...e, latitude: m.latitude + dx, longitude: m.longitude + dy };
      });
  }, [showAssets, equipment, mines]);

  if (!points || points.length === 0) {
    return <div className="loading-state">No geological survey points for this selection.</div>;
  }

  const center = selectedMine
    ? (() => {
        const m = mines.find((x) => x.mine_id === selectedMine);
        return m ? [m.latitude, m.longitude] : [21.5, 79.7];
      })()
    : [21.5, 79.7];
  const zoom = selectedMine ? 12 : 9;

  const colorFor = (p) => {
    if (layerKey === "reserve") return ROCK_COLORS[p.rock_type] || "#888";
    const t = max === min ? 0.5 : (p[layer.field] - min) / (max - min);
    return interpolateColor(layer.low, layer.high, t);
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        <div className="tabs" style={{ flexWrap: "wrap" }}>
          {Object.entries(MAP_LAYERS).map(([key, l]) => (
            <button
              key={key}
              className={`tab-btn ${layerKey === key ? "active" : ""}`}
              onClick={() => setLayerKey(key)}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" checked={showHeatmap} onChange={(e) => setShowHeatmap(e.target.checked)} />
            Density heatmap
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" checked={showAssets} onChange={(e) => setShowAssets(e.target.checked)} />
            Asset locations
          </label>
        </div>
      </div>

      <div className="map-wrap">
        <MapContainer
          key={selectedMine || "all"}
          center={center}
          zoom={zoom}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors, &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {showHeatmap && <HeatmapLayer points={heatPoints} />}

          {!showHeatmap && points.map((p) => (
            <CircleMarker
              key={p.grid_id}
              center={[p.latitude, p.longitude]}
              radius={scaleRadius(p[layer.field], min, max)}
              pathOptions={{
                color: colorFor(p),
                fillColor: colorFor(p),
                fillOpacity: 0.35 + p.drilling_confidence * 0.5,
                weight: 1.2,
              }}
            >
              <Popup>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12 }}>
                  <strong>{p.grid_id}</strong> &middot; {p.rock_type}
                  <br />
                  Predicted reserve: {fmtTonnes(p.predicted_reserve_tonnes)}
                  <br />
                  Ore grade: {p.ore_grade_pct}% Mn
                  <br />
                  NDVI: {p.ndvi} &middot; Soil moisture: {p.soil_moisture_pct}%
                  <br />
                  LST: {p.land_surface_temp_c}&deg;C &middot; Rainfall: {p.rainfall_mm_monthly}mm/mo
                  <br />
                  Drilling confidence: {(p.drilling_confidence * 100).toFixed(0)}%
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {assetPins.map((a) => (
            <Rectangle
              key={a.equipment_id}
              bounds={[
                [a.latitude - 0.0025, a.longitude - 0.0025],
                [a.latitude + 0.0025, a.longitude + 0.0025],
              ]}
              pathOptions={{
                color: "#0e8f7c",
                fillColor: RISK_COLORS[a.risk_level] || "#0e8f7c",
                fillOpacity: 0.85,
                weight: 1.5,
              }}
            >
              <Popup>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, minWidth: 160 }}>
                  <strong>{a.equipment_id}</strong>
                  <br />
                  {a.equipment_type} &middot; {a.age_years}y old
                  <br />
                  Breakdown risk (7d): {Math.round(a.breakdown_risk_7d * 100)}%
                  <br />
                  {a.overdue_days > 0 ? `${a.overdue_days}d overdue for maintenance` : "Maintenance up to date"}
                </div>
              </Popup>
            </Rectangle>
          ))}
        </MapContainer>
      </div>

      <div className="map-legend">
        {layerKey === "reserve" && !showHeatmap ? (
          Object.entries(ROCK_COLORS).map(([rock, color]) => (
            <span className="legend-item" key={rock}>
              <span className="legend-swatch" style={{ background: color }} />
              {rock}
            </span>
          ))
        ) : (
          <span className="legend-item">
            <span
              style={{
                width: 60, height: 10, borderRadius: 3, display: "inline-block",
                background: showHeatmap
                  ? "linear-gradient(90deg, rgba(14,143,124,0.25), #0e8f7c, #c17a35, #b1541f)"
                  : `linear-gradient(90deg, ${layer.low}, ${layer.high})`,
              }}
            />
            &nbsp;low &rarr; high {layer.label}
          </span>
        )}
        {showAssets && (
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: "#0e8f7c" }} />
            Equipment (color = breakdown risk)
          </span>
        )}
      </div>
    </>
  );
}
