import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

// Renders a leaflet.heat heatmap layer on the current map instance.
// points: array of [lat, lng, intensity(0-1)]
export default function HeatmapLayer({ points, gradient }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return undefined;

    const layer = L.heatLayer(points, {
      radius: 28,
      blur: 22,
      maxZoom: 14,
      max: 1,
      gradient: gradient || { 0.2: "rgba(14,143,124,0.25)", 0.4: "#0e8f7c", 0.7: "#c17a35", 1.0: "#b1541f" },
    }).addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, points, gradient]);

  return null;
}
