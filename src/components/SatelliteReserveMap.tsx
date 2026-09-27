import React, { useState } from "react";
import { MoilMine, BoreholeRecord } from "../types/mining";
import { ReserveExhaustionChart } from "./ReserveExhaustionChart";
import {
  Satellite,
  Layers,
  Thermometer,
  Trees,
  Droplets,
  Sparkles,
  Compass,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Info,
  ChevronRight,
  Database,
  Radio,
  Split,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Volume2,
  TrendingDown,
  LineChart,
} from "lucide-react";

interface SatelliteReserveMapProps {
  mine: MoilMine;
  onSelectBorehole: (borehole: BoreholeRecord) => void;
  onOpenCrossSection?: (borehole: BoreholeRecord) => void;
  onAnalyzeReserves: () => void;
  isAnalyzingReserves: boolean;
  aiReserveAnalysis?: any;
}

export const SatelliteReserveMap: React.FC<SatelliteReserveMapProps> = ({
  mine,
  onSelectBorehole,
  onOpenCrossSection,
  onAnalyzeReserves,
  isAnalyzingReserves,
  aiReserveAnalysis,
}) => {
  type LayerType = "optical" | "ndvi" | "lst" | "moisture" | "swir" | "gravity" | "blasting_ppv";

  const [activeView, setActiveView] = useState<"gis_map" | "exhaustion_timeline">("gis_map");
  const [activeLayer, setActiveLayer] = useState<LayerType>("blasting_ppv");
  const [showBoreholes, setShowBoreholes] = useState(true);
  const [showFaults, setShowFaults] = useState(true);
  const [showContours, setShowContours] = useState(true);
  const [hoveredBorehole, setHoveredBorehole] = useState<BoreholeRecord | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>("Western Highwall Crest");
  const [isDelayOptimized, setIsDelayOptimized] = useState(false);

  // Layer descriptions & color gradients
  const layerMeta: Record<
    LayerType,
    { title: string; subtitle: string; legend: string[]; gradient: string; sensor: string }
  > = {
    blasting_ppv: {
      title: "Real-Time Blasting Vibration (PPV) Heatmap & DGMS Isoseismals",
      subtitle: "Ground vibration propagation mapped across mine segments, bench crests, and habitation zone against DGMS 5.0 mm/s limit.",
      legend: ["< 2.0 mm/s Safe", "2.0 - 4.0 mm/s Monitored", "4.0 - 5.0 mm/s Nearing DGMS Limit", "> 5.0 mm/s Statutory Violation"],
      gradient: "from-emerald-500 via-amber-500 to-rose-600",
      sensor: "Tri-Axial Geophone Telemetry • DGMS Tech Circ 7/1997",
    },
    optical: {
      title: "High-Res Space Optical (Cartosat-3 / Sentinel-2)",
      subtitle: "True color reflectance showing open quarry cut, pit benches, and waste dumps.",
      legend: ["Forest Canopy", "Pit Sump", "Exposed Ore", "Overburden Bench"],
      gradient: "from-emerald-900/60 via-amber-950/40 to-slate-900/80",
      sensor: "Cartosat-3 PAN (0.28m) + Sentinel-2 MSI",
    },
    ndvi: {
      title: "Vegetation Index & Stress Anomaly (NDVI)",
      subtitle: "Detects manganese-induced vegetative chlorosis and metal toxicity stress signatures.",
      legend: ["Vigorous Foliage (0.6+)", "Moderate (0.4)", "Stressed Canopy (0.25)", "Exposed Mineralized Soil (0.1)"],
      gradient: "from-emerald-600 via-amber-500 to-rose-600",
      sensor: "Sentinel-2 MSI Band 8 (NIR) & Band 4 (Red)",
    },
    lst: {
      title: "Land Surface Temperature Anomaly (LST)",
      subtitle: "Thermal inertia anomaly reveals dense, high-heat capacity manganese oxide outcrops.",
      legend: ["Ambient Background (34°C)", "+1.5°C Quartzite", "+3.2°C Gondite", "+4.8°C Massive Braunite"],
      gradient: "from-blue-600 via-yellow-500 to-red-600",
      sensor: "Landsat-9 TIRS (Thermal Infrared Sensor)",
    },
    moisture: {
      title: "Soil Moisture Index & Drainage Saturation (SMI)",
      subtitle: "Surface waterlogging, bench runoff routes, and silicified ridge permeability.",
      legend: ["High Drainage Ridge", "Optimum Porosity", "Heavy Moisture", "Waterlogged Floor"],
      gradient: "from-amber-200 via-sky-500 to-blue-900",
      sensor: "Sentinel-1 C-Band SAR + Sentinel-2 NDWI",
    },
    swir: {
      title: "Hyperspectral SWIR Manganese Oxide Anomaly (B2.2µm / B2.3µm)",
      subtitle: "Absorption band ratio specifically mapping Braunite, Pyrolusite, and Psilomelane lenses.",
      legend: ["Low Ratio (<1.2)", "Subtle Mineralization (1.4)", "High-Grade Mn Lense (1.8+)", "Orebody Apex (>2.1)"],
      gradient: "from-slate-900 via-indigo-600 to-cyan-400",
      sensor: "PRISMA Hyperspectral / Sentinel-2 SWIR B11/B12",
    },
    gravity: {
      title: "Bouguer Gravity (+mGal) & Apparent Resistivity",
      subtitle: "Sub-surface density contrast delineating deep downward dipping manganese ore bodies.",
      legend: ["-0.5 mGal Country Rock", "+0.5 mGal Gondite", "+1.2 mGal Ore Lense", "+1.8 mGal Dense Braunite Core"],
      gradient: "from-slate-800 via-violet-600 to-fuchsia-400",
      sensor: "Gravity & Ground IP/Resistivity Geophysical Integration",
    },
  };

  const currentMeta = layerMeta[activeLayer];

  return (
    <div
      id="section-satellite-reserve-mapping"
      className="bg-[#0f172a] border border-slate-800 rounded overflow-hidden shadow-sm mb-4"
    >
      {/* Module Title Header */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-[#0f172a]">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Satellite className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-tight font-sans">
                Space Technology & Geological Reserve Explorer
              </h2>
              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/30 rounded">
                LIVE GIS SYNC
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Multi-spectral space remote sensing & sub-surface drill stratigraphy • {mine.name}
            </p>
          </div>
        </div>

        {/* View Switcher, 2D Section, and AI Analysis Triggers */}
        <div className="flex items-center space-x-2">
          {/* View Mode Switcher: GIS Map vs Reserve Exhaustion Line Chart */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800">
            <button
              id="view-toggle-gis-map"
              onClick={() => setActiveView("gis_map")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition ${
                activeView === "gis_map"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Satellite className="w-3 h-3" />
              <span>GIS Map</span>
            </button>
            <button
              id="view-toggle-exhaustion-timeline"
              onClick={() => setActiveView("exhaustion_timeline")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold transition ${
                activeView === "exhaustion_timeline"
                  ? "bg-amber-600 text-white shadow-sm ring-1 ring-amber-400"
                  : "text-amber-400 hover:text-amber-200"
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              <span>Exhaustion Timeline</span>
              <span className="px-1 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 font-mono font-bold">
                {(mine.estimatedTotalReservesMT / Math.max(1, mine.currentActualMT * 12)).toFixed(1)}y
              </span>
            </button>
          </div>

          {onOpenCrossSection && (
            <button
              id="btn-open-2d-cross-section"
              onClick={() => onOpenCrossSection(mine.boreholes[0])}
              className="flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 transition-colors shadow-sm"
              title="Open 2D Geological Ore Body Cross-Section Profile"
            >
              <Split className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">2D ORE BODY</span>
            </button>
          )}

          <button
            id="btn-run-ai-geological-analysis"
            onClick={onAnalyzeReserves}
            disabled={isAnalyzingReserves}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 transition-colors shadow-sm"
          >
            <Sparkles className={`w-3 h-3 ${isAnalyzingReserves ? "animate-spin text-blue-200" : ""}`} />
            <span>{isAnalyzingReserves ? "EVALUATING..." : "AI SYNTHESIS"}</span>
          </button>
        </div>
      </div>

      {activeView === "exhaustion_timeline" ? (
        <ReserveExhaustionChart mine={mine} onBackToMap={() => setActiveView("gis_map")} />
      ) : (
        <>
          {/* Layer Switcher Tabs */}
          <div className="bg-[#0a0f18] px-4 py-1.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-500 text-[10px] font-bold uppercase mr-1">
            Bands:
          </span>

          <button
            id="layer-tab-blasting-ppv"
            onClick={() => setActiveLayer("blasting_ppv")}
            className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 ${
              activeLayer === "blasting_ppv"
                ? "bg-rose-600 text-white shadow-sm ring-1 ring-rose-400"
                : "bg-slate-900 text-rose-300 hover:text-white border border-rose-900/60"
            }`}
          >
            <Radio className="w-3 h-3 text-rose-300 animate-pulse" />
            <span>PPV Blasting Heatmap</span>
          </button>

          <button
            id="layer-tab-swir"
            onClick={() => setActiveLayer("swir")}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition flex items-center gap-1 ${
              activeLayer === "swir"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Sparkles className="w-2.5 h-2.5 text-blue-300" />
            <span>SWIR Mn-Oxide</span>
          </button>

          <button
            id="layer-tab-ndvi"
            onClick={() => setActiveLayer("ndvi")}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition flex items-center gap-1 ${
              activeLayer === "ndvi"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Trees className="w-2.5 h-2.5 text-green-400" />
            <span>NDVI Chlorosis</span>
          </button>

          <button
            id="layer-tab-lst"
            onClick={() => setActiveLayer("lst")}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition flex items-center gap-1 ${
              activeLayer === "lst"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Thermometer className="w-2.5 h-2.5 text-amber-400" />
            <span>LST Thermal</span>
          </button>

          <button
            id="layer-tab-moisture"
            onClick={() => setActiveLayer("moisture")}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition flex items-center gap-1 ${
              activeLayer === "moisture"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Droplets className="w-2.5 h-2.5 text-sky-400" />
            <span>SAR Moisture</span>
          </button>

          <button
            id="layer-tab-gravity"
            onClick={() => setActiveLayer("gravity")}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition flex items-center gap-1 ${
              activeLayer === "gravity"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Layers className="w-2.5 h-2.5 text-purple-400" />
            <span>Bouguer Gravity</span>
          </button>

          <button
            id="layer-tab-optical"
            onClick={() => setActiveLayer("optical")}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition flex items-center gap-1 ${
              activeLayer === "optical"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Satellite className="w-2.5 h-2.5 text-slate-300" />
            <span>Cartosat-3 Optical</span>
          </button>
        </div>

        {/* Layer Overlays Toggles */}
        <div className="flex items-center space-x-3 text-slate-400 text-[10px]">
          <label className="flex items-center space-x-1 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={showBoreholes}
              onChange={(e) => setShowBoreholes(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 w-3 h-3"
            />
            <span>Boreholes ({mine.boreholes.length})</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={showFaults}
              onChange={(e) => setShowFaults(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-red-500 focus:ring-0 w-3 h-3"
            />
            <span>Fault Lines</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={showContours}
              onChange={(e) => setShowContours(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-blue-400 focus:ring-0 w-3 h-3"
            />
            <span>Dip Contours</span>
          </label>
        </div>
      </div>

      {/* Main Interactive Map & Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 relative">
        {/* Map Canvas (8 Cols) */}
        <div className="lg:col-span-8 relative bg-slate-950 min-h-[420px] sm:min-h-[480px] overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* Spatial Grid Background with Synthetic Multi-spectral Heatmap */}
          <div className="absolute inset-0 bg-[#080d19]">
            {/* Fine GIS Grid */}
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage:
                  "linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            ></div>

            {/* Geological Strike & Dip Axis Simulation */}
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-slate-700/40 transform -rotate-12"></div>

            {/* Dynamic Multi-spectral Anomaly Surface Map Rendering based on activeLayer */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 800 500"
              preserveAspectRatio="none"
            >
              <defs>
                {/* SWIR Braunite Anomaly Gradient */}
                <radialGradient id="swirGradient" cx="52%" cy="48%" r="42%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.85" />
                  <stop offset="35%" stopColor="#0284c7" stopOpacity="0.65" />
                  <stop offset="70%" stopColor="#4f46e5" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                </radialGradient>

                {/* NDVI Gradient */}
                <radialGradient id="ndviGradient" cx="50%" cy="45%" r="45%">
                  <stop offset="0%" stopColor="#e11d48" stopOpacity="0.8" />
                  <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.6" />
                  <stop offset="75%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#064e3b" stopOpacity="0.1" />
                </radialGradient>

                {/* LST Thermal Gradient */}
                <radialGradient id="lstGradient" cx="54%" cy="46%" r="40%">
                  <stop offset="0%" stopColor="#dc2626" stopOpacity="0.85" />
                  <stop offset="38%" stopColor="#f97316" stopOpacity="0.6" />
                  <stop offset="70%" stopColor="#eab308" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
                </radialGradient>

                {/* Moisture Gradient */}
                <radialGradient id="moistureGradient" cx="45%" cy="55%" r="45%">
                  <stop offset="0%" stopColor="#1e40af" stopOpacity="0.85" />
                  <stop offset="45%" stopColor="#0284c7" stopOpacity="0.6" />
                  <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0" />
                </radialGradient>

                {/* Gravity Gradient */}
                <radialGradient id="gravityGradient" cx="50%" cy="50%" r="38%">
                  <stop offset="0%" stopColor="#d946ef" stopOpacity="0.85" />
                  <stop offset="35%" stopColor="#7c3aed" stopOpacity="0.65" />
                  <stop offset="75%" stopColor="#4338ca" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                </radialGradient>

                {/* Real-time Blasting PPV Vibration Heatmap Gradient 1 (Primary Round) */}
                <radialGradient id="ppvShockwaveGradient1" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={isDelayOptimized ? "0.65" : "0.92"} />
                  <stop offset="25%" stopColor="#f97316" stopOpacity={isDelayOptimized ? "0.45" : "0.75"} />
                  <stop offset="52%" stopColor="#eab308" stopOpacity={isDelayOptimized ? "0.30" : "0.55"} />
                  <stop offset="78%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                </radialGradient>

                {/* PPV Heatmap Gradient 2 (Secondary Sub-Level Delay) */}
                <radialGradient id="ppvShockwaveGradient2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                  <stop offset="40%" stopColor="#eab308" stopOpacity="0.5" />
                  <stop offset="75%" stopColor="#10b981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Base Mineralized Sausar Band (Ore Body Axis) */}
              <path
                d="M 100,340 C 240,290 380,260 520,210 C 620,180 720,140 760,110 L 730,80 C 650,110 500,160 360,200 C 220,240 120,280 80,310 Z"
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="1.5"
                opacity="0.8"
              />

              {/* Blasting PPV Vibration Heatmap Layer */}
              {activeLayer === "blasting_ppv" && (
                <g id="blasting-ppv-heatmap-layer">
                  {/* Primary Blast Isoseismal Radial Energy Field */}
                  <ellipse
                    cx="410"
                    cy="235"
                    rx={isDelayOptimized ? "230" : "270"}
                    ry={isDelayOptimized ? "140" : "175"}
                    fill="url(#ppvShockwaveGradient1)"
                  />

                  {/* Secondary Blast Isoseismal Field */}
                  <ellipse
                    cx="280"
                    cy="185"
                    rx="180"
                    ry="110"
                    fill="url(#ppvShockwaveGradient2)"
                    opacity="0.85"
                  />

                  {/* Concentric Isoseismal Contour Lines */}
                  {/* 1. DGMS Statutory PPV Limit (5.0 mm/s) Isoseismal Boundary */}
                  <ellipse
                    cx="410"
                    cy="235"
                    rx={isDelayOptimized ? "130" : "185"}
                    ry={isDelayOptimized ? "85" : "120"}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeDasharray="6 3"
                    className="animate-pulse"
                  />
                  <text
                    x="420"
                    y={isDelayOptimized ? "140" : "105"}
                    fill="#ef4444"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    🚨 DGMS STATUTORY PPV LIMIT (5.0 mm/s) - MMR REG 156
                  </text>

                  {/* 2. Amber Caution Isoseismal (4.0 mm/s - 80% Limit) */}
                  <ellipse
                    cx="410"
                    cy="235"
                    rx={isDelayOptimized ? "175" : "235"}
                    ry={isDelayOptimized ? "115" : "155"}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.8"
                    strokeDasharray="4 3"
                    opacity="0.85"
                  />
                  <text
                    x="420"
                    y={isDelayOptimized ? "112" : "72"}
                    fill="#f59e0b"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    ⚠️ 4.0 mm/s Near-Limit Warning Zone
                  </text>

                  {/* 3. Safe Threshold Isoseismal (2.5 mm/s) */}
                  <ellipse
                    cx="410"
                    cy="235"
                    rx="290"
                    ry="190"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    opacity="0.75"
                  />
                  <text x="420" y="38" fill="#10b981" fontSize="9" fontFamily="monospace">
                    ✓ 2.5 mm/s Compliant Habitation Threshold
                  </text>

                  {/* Ground Zero Blast Hypocenters */}
                  <g transform="translate(410, 235)">
                    <circle cx="0" cy="0" r="14" fill="#ef4444" fillOpacity="0.4" className="animate-ping" />
                    <circle cx="0" cy="0" r="7" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                    <text x="14" y="4" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                      💥 BLAST ROUND #1 (48 Holes - Stope 9)
                    </text>
                  </g>

                  <g transform="translate(280, 185)">
                    <circle cx="0" cy="0" r="6" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="12" y="4" fill="#fdba74" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                      💥 BLAST ROUND #2 (-220m Level)
                    </text>
                  </g>

                  {/* Tri-Axial Geophone Stations */}
                  {[
                    { id: "ST-01", x: 320, y: 165, ppv: isDelayOptimized ? 3.2 : 4.8, freq: "24 Hz", label: "Highwall Crest", warn: true },
                    { id: "ST-02", x: 470, y: 260, ppv: isDelayOptimized ? 2.8 : 4.2, freq: "19 Hz", label: "Bench 4 Ramp", warn: true },
                    { id: "ST-03", x: 210, y: 290, ppv: isDelayOptimized ? 1.5 : 2.1, freq: "31 Hz", label: "Shaft Collar", warn: false },
                    { id: "ST-04", x: 650, y: 370, ppv: isDelayOptimized ? 1.2 : 1.9, freq: "14 Hz", label: "Township Buffer", warn: false },
                    { id: "ST-05", x: 170, y: 120, ppv: isDelayOptimized ? 1.1 : 1.6, freq: "28 Hz", label: "Tailings Wall", warn: false },
                  ].map((st) => (
                    <g
                      key={st.id}
                      transform={`translate(${st.x}, ${st.y})`}
                      className="cursor-pointer group"
                      onClick={() => setSelectedSegment(st.label)}
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r={st.warn && !isDelayOptimized ? "12" : "9"}
                        fill={st.ppv >= 4.5 ? "#ef4444" : st.ppv >= 4.0 ? "#f59e0b" : "#10b981"}
                        fillOpacity="0.3"
                        className={st.warn && !isDelayOptimized ? "animate-pulse" : ""}
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r="4.5"
                        fill={st.ppv >= 4.5 ? "#ef4444" : st.ppv >= 4.0 ? "#f59e0b" : "#10b981"}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      <rect
                        x="7"
                        y="-14"
                        width="85"
                        height="24"
                        rx="3"
                        fill="#0a0f18"
                        fillOpacity="0.9"
                        stroke={st.ppv >= 4.5 ? "#ef4444" : st.ppv >= 4.0 ? "#f59e0b" : "#334155"}
                        strokeWidth="1"
                      />
                      <text x="11" y="-4" fill="#ffffff" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">
                        {st.label}
                      </text>
                      <text
                        x="11"
                        y="6"
                        fill={st.ppv >= 4.5 ? "#f87171" : st.ppv >= 4.0 ? "#fbbf24" : "#4ade80"}
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {st.ppv} mm/s • {st.freq}
                      </text>
                    </g>
                  ))}
                </g>
              )}

              {/* Active Spectral Anomaly Layer Polygons */}
              {activeLayer === "swir" && (
                <ellipse
                  cx="430"
                  cy="235"
                  rx="240"
                  ry="95"
                  transform="rotate(-22 430 235)"
                  fill="url(#swirGradient)"
                />
              )}

              {activeLayer === "ndvi" && (
                <ellipse
                  cx="410"
                  cy="240"
                  rx="250"
                  ry="105"
                  transform="rotate(-22 410 240)"
                  fill="url(#ndviGradient)"
                />
              )}

              {activeLayer === "lst" && (
                <ellipse
                  cx="435"
                  cy="230"
                  rx="230"
                  ry="90"
                  transform="rotate(-22 435 230)"
                  fill="url(#lstGradient)"
                />
              )}

              {activeLayer === "moisture" && (
                <ellipse
                  cx="390"
                  cy="260"
                  rx="270"
                  ry="115"
                  transform="rotate(-18 390 260)"
                  fill="url(#moistureGradient)"
                />
              )}

              {activeLayer === "gravity" && (
                <ellipse
                  cx="425"
                  cy="235"
                  rx="220"
                  ry="85"
                  transform="rotate(-22 425 235)"
                  fill="url(#gravityGradient)"
                />
              )}

              {/* Sub-surface Dip Contours */}
              {showContours && (
                <g stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" opacity="0.6">
                  <path d="M 180,320 Q 380,240 620,180" />
                  <path d="M 220,345 Q 410,265 650,205" />
                  <path d="M 260,370 Q 440,290 680,230" />
                  <text x="630" y="175" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                    -120m RL
                  </text>
                  <text x="660" y="200" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                    -180m RL
                  </text>
                  <text x="690" y="225" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                    -240m RL
                  </text>
                </g>
              )}

              {/* Geological Strike & Dip Fault Lineaments */}
              {showFaults && (
                <g stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="6 3">
                  <line x1="280" y1="90" x2="340" y2="420" />
                  <text x="350" y="415" fill="#f43f5e" fontSize="11" fontWeight="bold">
                    Bharweli Shear Fault F-1 (Dip 65° SSW)
                  </text>
                  <line x1="560" y1="60" x2="620" y2="380" opacity="0.7" />
                  <text x="630" y="375" fill="#f43f5e" fontSize="10" opacity="0.8">
                    Auxiliary Fault F-2
                  </text>
                </g>
              )}
            </svg>

            {/* Interactive Boreholes Markers */}
            {showBoreholes &&
              mine.boreholes.map((bh) => (
                <div
                  key={bh.id}
                  style={{ left: `${bh.gridX}%`, top: `${bh.gridY}%` }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                  onClick={() => onSelectBorehole(bh)}
                  onMouseEnter={() => setHoveredBorehole(bh)}
                  onMouseLeave={() => setHoveredBorehole(null)}
                >
                  {/* Ping Animation for High-Grade Targets */}
                  {bh.mnGradePct > 44 && (
                    <span className="absolute -inset-1 rounded-full bg-cyan-400 opacity-60 animate-ping"></span>
                  )}
                  {/* Borehole Core Pin */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border shadow-lg transition-transform transform group-hover:scale-125 ${
                      bh.unfcStatus === "Proved (111)"
                        ? "bg-cyan-500 text-slate-950 border-white"
                        : bh.unfcStatus === "Probable (121)"
                        ? "bg-amber-400 text-slate-950 border-white"
                        : "bg-fuchsia-500 text-white border-white animate-bounce"
                    }`}
                  >
                    BH
                  </div>

                  {/* Tooltip Card */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-30 w-48 bg-slate-900 border border-slate-700 rounded-lg p-2.5 shadow-2xl text-xs pointer-events-none">
                    <div className="font-bold text-white mb-0.5">{bh.name}</div>
                    <div className="text-[11px] text-cyan-400 font-mono font-semibold">
                      Grade: {bh.mnGradePct}% Mn
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Depth: {bh.depthMeters}m • {bh.unfcStatus}
                    </div>
                    <div className="mt-1 text-[10px] text-amber-400 font-medium flex items-center gap-1">
                      <span>Click to view drill core log</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))}

            {/* Active Exploration Layer Badge (High Density theme) */}
            <div className="absolute top-3 left-3 z-20 bg-slate-900/85 backdrop-blur-md p-2 rounded border border-slate-700">
              <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">
                Active Exploration Layer
              </div>
              <div className="text-xs font-bold text-white">
                {mine.name}: {currentMeta.title}
              </div>
            </div>

            {/* North Arrow & Scale Bar */}
            <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-800 rounded p-2 flex items-center gap-2.5 text-xs text-slate-300 shadow-md backdrop-blur-sm z-20">
              <div className="flex flex-col items-center">
                <Compass className="w-4 h-4 text-blue-400" />
                <span className="text-[9px] font-bold text-blue-400 font-mono">N</span>
              </div>
              <div className="border-l border-slate-700 pl-2">
                <div className="font-mono text-[10px]">WGS84 / UTM 44N</div>
                <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5">
                  <div className="w-10 h-0.5 bg-slate-400"></div>
                  <span>250m</span>
                </div>
              </div>
            </div>

            {/* Sub-Surface Density Matrix Indicator (High Density theme) */}
            <div className="absolute bottom-3 right-3 z-20 bg-slate-900/90 p-2.5 rounded border border-slate-700 w-44 hidden sm:block">
              <div className="text-[9px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">
                SUB-SURFACE DENSITY
              </div>
              <div className="flex gap-1 h-2.5">
                <div className="w-1/4 bg-blue-950 rounded-xs"></div>
                <div className="w-1/4 bg-blue-800 rounded-xs"></div>
                <div className="w-1/4 bg-blue-600 rounded-xs"></div>
                <div className="w-1/4 bg-blue-400 rounded-xs"></div>
              </div>
              <div className="flex justify-between text-[8px] text-slate-500 mt-1 font-mono">
                <span>Low</span>
                <span>Anomalous</span>
              </div>
            </div>

            {/* Bottom Floating Map HUD Information */}
            <div className="absolute bottom-3 left-3 sm:right-52 right-3 bg-slate-900/95 border border-slate-800/90 rounded p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xl backdrop-blur-md z-20">
              <div className="text-xs">
                <span className="font-bold text-white text-[11px] block">{currentMeta.title}</span>
                <p className="text-[10px] text-slate-400 line-clamp-1">{currentMeta.subtitle}</p>
              </div>

              {/* Dynamic Legend Colorbar */}
              <div className="flex items-center gap-1.5">
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-mono text-slate-400">
                    {currentMeta.sensor}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div
                      className={`h-2 w-24 rounded bg-gradient-to-r ${currentMeta.gradient}`}
                    ></div>
                    <span className="text-[9px] text-slate-300 font-mono">Intensity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Geological Synthesis & Reserve Computation Sidebar (4 Cols) */}
        <div className="lg:col-span-4 bg-[#0f172a] p-3.5 flex flex-col justify-between">
          <div>
            {activeLayer === "blasting_ppv" ? (
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    DGMS Blast Vibration Telemetry
                  </span>
                  <span className="text-[9px] font-mono text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    CIR 7/1997
                  </span>
                </div>

                {/* Statutory Limit Warning Banner */}
                <div className={`mt-2.5 p-2.5 rounded border text-xs ${
                  isDelayOptimized
                    ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-300"
                    : "bg-rose-950/40 border-rose-800/80 text-rose-200"
                }`}>
                  <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                    <span className="flex items-center gap-1">
                      {isDelayOptimized ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      <span>{isDelayOptimized ? "OPTIMIZED DELAY ACTIVE" : "HIGHWALL NEARING LIMIT"}</span>
                    </span>
                    <span className="font-mono text-[10px]">DGMS Max: 5.0 mm/s</span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-tight">
                    {isDelayOptimized
                      ? "Electronic staggered 25ms delay sequence applied. Peak vibration reduced by 33% across all mine segments."
                      : "Western Highwall Crest registered 4.8 mm/s (96% of DGMS limit). Blasting officer alert triggered."}
                  </p>
                </div>

                {/* Segment Telemetry Breakdown */}
                <div className="mt-2.5 space-y-1.5">
                  {[
                    { name: "Western Highwall Crest", ppv: isDelayOptimized ? 3.2 : 4.8, dist: "68m", pct: isDelayOptimized ? 64 : 96 },
                    { name: "Bench 4 & Haul Ramp", ppv: isDelayOptimized ? 2.8 : 4.2, dist: "115m", pct: isDelayOptimized ? 56 : 84 },
                    { name: "Main Shaft & Winder", ppv: isDelayOptimized ? 1.5 : 2.1, dist: "240m", pct: isDelayOptimized ? 30 : 42 },
                    { name: "Township Buffer (300m)", ppv: isDelayOptimized ? 1.2 : 1.9, dist: "340m", pct: isDelayOptimized ? 24 : 38 },
                    { name: "Tailings Dam Toe", ppv: isDelayOptimized ? 1.1 : 1.6, dist: "380m", pct: isDelayOptimized ? 22 : 32 },
                  ].map((seg) => (
                    <div
                      key={seg.name}
                      onClick={() => setSelectedSegment(seg.name)}
                      className={`p-2 rounded border cursor-pointer transition ${
                        selectedSegment === seg.name
                          ? "bg-slate-900 border-rose-500/60 shadow-sm"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-medium text-slate-200">{seg.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-400 font-mono">{seg.dist}</span>
                          <span className={`font-mono font-bold ${
                            seg.ppv >= 4.5 ? "text-rose-400" : seg.ppv >= 4.0 ? "text-amber-400" : "text-emerald-400"
                          }`}>
                            {seg.ppv} mm/s
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-500 ${
                            seg.pct >= 90 ? "bg-rose-500" : seg.pct >= 75 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${seg.pct}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Interactive Delay Optimization Control */}
                <div className="mt-3 pt-2.5 border-t border-slate-800">
                  <button
                    id="btn-toggle-electronic-delay-blast"
                    onClick={() => setIsDelayOptimized(!isDelayOptimized)}
                    className={`w-full py-1.5 px-2 rounded text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-sm ${
                      isDelayOptimized
                        ? "bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40"
                        : "bg-rose-700 hover:bg-rose-600 text-white border border-rose-500"
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>
                      {isDelayOptimized
                        ? "Reset to Standard Blasting Delay (17ms)"
                        : "Simulate Electronic Delay Redesign (25ms Delay)"}
                    </span>
                  </button>
                  <p className="text-[9px] text-slate-500 text-center mt-1 font-mono">
                    Reduces Maximum Instantaneous Charge (MIC) per delay deck.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-blue-400" />
                    Surface & Sub-surface Correlation
                  </span>
                  <span className="text-[10px] font-mono text-blue-400 font-semibold">
                    IBM / UNFC Model
                  </span>
                </div>

                {/* Indicators Meter Breakdown */}
                <div className="mt-3 space-y-2">
                  {/* 1. SWIR Band Ratio */}
                  <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">SWIR Ratio (2.2µm)</span>
                      <span className="font-mono font-bold text-blue-400">
                        {mine.satelliteIndicators.swirBandRatio} / 2.50
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded h-1 overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${(mine.satelliteIndicators.swirBandRatio / 2.5) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Signature:</span>
                      <span className="font-semibold text-slate-200">
                        {mine.satelliteIndicators.spectralSignature}
                      </span>
                    </div>
                  </div>

                  {/* 2. LST Thermal Anomaly */}
                  <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800">
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-slate-400">Thermal Inertia (LST)</span>
                      <span className="font-mono font-bold text-amber-400">
                        {mine.satelliteIndicators.lstDelta > 0 ? `+${mine.satelliteIndicators.lstDelta}` : mine.satelliteIndicators.lstDelta}°C Anomaly
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Dense braunite gondite conducts surface heat with distinctive contrast against host schists.
                    </p>
                  </div>

                  {/* 3. NDVI Vegetative Anomaly */}
                  <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800">
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-slate-400">Vegetation Stress (NDVI)</span>
                      <span className="font-mono font-bold text-green-400">
                        {mine.satelliteIndicators.ndvi}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {mine.satelliteIndicators.ndviAnomaly}
                    </p>
                  </div>
                </div>

                {/* AI Geological Synthesis Output Display */}
                {aiReserveAnalysis && (
                  <div className="mt-4 p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/80 text-xs">
                    <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                      <span>Gemini Geological Reserve Intelligence:</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed mb-2">
                      {aiReserveAnalysis.lithologicalSynthesis}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-900/60 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-500">Recoverable:</span>{" "}
                        <span className="font-bold text-cyan-400">
                          {aiReserveAnalysis.estimatedReserveTonnage}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Estimated Grade:</span>{" "}
                        <span className="font-bold text-amber-400">
                          {aiReserveAnalysis.averageGrade}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Borehole selection list with 2D Section Action */}
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-semibold">
              <span>EXPLORATION DRILL HOLES:</span>
              <span className="text-[10px] text-cyan-400">CORE & 2D SECTION</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {mine.boreholes.map((bh) => (
                <div key={bh.id} className="flex items-center gap-1 bg-slate-950 rounded border border-slate-800 overflow-hidden">
                  <button
                    onClick={() => onSelectBorehole(bh)}
                    className="flex-1 px-2 py-1.5 hover:bg-slate-900 text-left transition flex items-center justify-between"
                  >
                    <span className="font-medium text-slate-300 truncate text-[11px]">{bh.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold ml-1">
                      {bh.mnGradePct}%
                    </span>
                  </button>
                  {onOpenCrossSection && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCrossSection(bh);
                      }}
                      title="View 2D Geological Cross-Section"
                      className="px-1.5 py-1.5 bg-slate-900 hover:bg-cyan-950 text-cyan-400 border-l border-slate-800 hover:border-cyan-700 transition"
                    >
                      <Split className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reserve Exhaustion Quick Horizon Bar */}
      <div className="bg-[#0a0f18] px-4 py-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <TrendingDown className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-white text-[11px]">
              Predicted Reserve Exhaustion Timeline:
            </span>{" "}
            <span className="text-slate-400 text-[11px]">
              Identified Reserves {(mine.estimatedTotalReservesMT / 1_000_000).toFixed(2)} MMT @ current run-rate {(Math.round(mine.currentActualMT * 12) / 1000).toFixed(0)}k MT/yr &rarr; Life of Mine ~{(mine.estimatedTotalReservesMT / Math.max(1, mine.currentActualMT * 12)).toFixed(1)} Years (Depletion ~Year {2026 + Math.round(mine.estimatedTotalReservesMT / Math.max(1, mine.currentActualMT * 12))})
            </span>
          </div>
        </div>
        <button
          id="btn-open-exhaustion-chart-from-bar"
          onClick={() => setActiveView("exhaustion_timeline")}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition"
        >
          <span>View Full Exhaustion Line Chart</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </>
    )}
  </div>
  );
};
