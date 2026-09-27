import React, { useState } from "react";
import { BoreholeRecord, MoilMine } from "../types/mining";
import {
  X,
  Layers,
  Download,
  Info,
  ChevronRight,
  TrendingDown,
  Eye,
  Activity,
  Compass,
  Maximize2,
  FileSpreadsheet,
  Split,
  AlertTriangle,
} from "lucide-react";

interface OreBodyCrossSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mine: MoilMine;
  borehole: BoreholeRecord | null;
  onSelectBorehole?: (bh: BoreholeRecord) => void;
}

export const OreBodyCrossSectionModal: React.FC<OreBodyCrossSectionModalProps> = ({
  isOpen,
  onClose,
  mine,
  borehole,
  onSelectBorehole,
}) => {
  if (!isOpen) return null;

  // Fallback to first borehole if none selected
  const activeBorehole = borehole || mine.boreholes[0];
  const [viewMode, setViewMode] = useState<"lithology" | "grade_heatmap" | "unfc_blocks">("grade_heatmap");
  const [showRuler, setShowRuler] = useState(true);
  const [showFaults, setShowFaults] = useState(true);
  const [showWaterTable, setShowWaterTable] = useState(true);
  const [hoveredStratum, setHoveredStratum] = useState<any | null>(null);

  if (!activeBorehole) return null;

  // Calculate orebody metrics
  const oreStrata = activeBorehole.strata.filter(
    (s) => s.gradeMn >= 25 || s.lithology.toLowerCase().includes("manganese") || s.lithology.toLowerCase().includes("braunite")
  );
  const oreThickness = oreStrata.reduce((acc, s) => acc + (s.depthTo - s.depthFrom), 0);
  const maxDepth = Math.max(activeBorehole.depthMeters, 200);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0f172a] border border-slate-700 rounded-xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col font-sans text-xs">
        {/* Header Bar */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-[#0a0f18] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Split className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-tight font-sans">
                  2D Geological Cross-Section • {activeBorehole.name}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                  {mine.name}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {activeBorehole.unfcStatus}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Sausar Group Stratigraphic Profile • Dip 65° SSW • Collar Elevation: +395m RL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Borehole Switcher */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
              <span className="text-[10px] text-slate-400 font-semibold">Drill Hole:</span>
              <select
                aria-label="Select drill hole cross section"
                value={activeBorehole.id}
                onChange={(e) => {
                  const found = mine.boreholes.find((b) => b.id === e.target.value);
                  if (found && onSelectBorehole) {
                    onSelectBorehole(found);
                  }
                }}
                className="bg-transparent text-white font-mono font-bold text-[11px] focus:outline-none"
              >
                {mine.boreholes.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900">
                    {b.id} ({b.mnGradePct}% Mn)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Close Cross-Section"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & View Settings */}
        <div className="bg-[#090d16] px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Color Model:</span>
            <button
              onClick={() => setViewMode("grade_heatmap")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                viewMode === "grade_heatmap"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              <Activity className="w-3 h-3 text-cyan-200" />
              <span>Mn% Grade Heatmap</span>
            </button>

            <button
              onClick={() => setViewMode("lithology")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                viewMode === "lithology"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3 h-3 text-blue-200" />
              <span>Lithology Strata</span>
            </button>

            <button
              onClick={() => setViewMode("unfc_blocks")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                viewMode === "unfc_blocks"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              <Eye className="w-3 h-3 text-indigo-200" />
              <span>UNFC Reserve Blocks (111/121)</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
              <input
                type="checkbox"
                checked={showRuler}
                onChange={(e) => setShowRuler(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 w-3 h-3"
              />
              <span>RL Depth Grid</span>
            </label>

            <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
              <input
                type="checkbox"
                checked={showFaults}
                onChange={(e) => setShowFaults(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-red-500 focus:ring-0 w-3 h-3"
              />
              <span>Shear Faults</span>
            </label>

            <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
              <input
                type="checkbox"
                checked={showWaterTable}
                onChange={(e) => setShowWaterTable(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-sky-400 focus:ring-0 w-3 h-3"
              />
              <span>Piezometric Level</span>
            </label>
          </div>
        </div>

        {/* Main 2D Cross-Section Canvas & Information Panels */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5">
          {/* 2D Cross Section SVG Container */}
          <div className="bg-[#050811] border border-slate-800 rounded-lg p-2 relative overflow-hidden">
            {/* Legend Overlay Header */}
            <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md p-2 rounded border border-slate-700 text-[10px]">
              <div className="font-bold text-white flex items-center gap-1">
                <Compass className="w-3 h-3 text-cyan-400" />
                <span>Section Line A - A' (Dip Axis SSW 65°)</span>
              </div>
              <div className="text-slate-400 text-[9px] mt-0.5">
                True Thickness: <strong className="text-cyan-400">{oreThickness}m</strong> • Intersect Grade:{" "}
                <strong className="text-amber-400">{activeBorehole.mnGradePct}% Mn</strong>
              </div>
            </div>

            {/* Scale Bar */}
            <div className="absolute bottom-4 right-4 z-10 bg-slate-900/90 border border-slate-800 rounded p-1.5 text-[9px] font-mono text-slate-400">
              <span>H:V Scale 1:1 • Grid 25m</span>
            </div>

            {/* 2D Cross-Section SVG */}
            <svg
              className="w-full h-[360px] sm:h-[420px]"
              viewBox="0 0 900 480"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Ore Body High Grade Gradient */}
                <linearGradient id="oreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#0284c7" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#4338ca" stopOpacity="0.8" />
                </linearGradient>

                {/* Overburden Pattern */}
                <pattern id="overburdenPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 0,10 L 10,0 M 10,20 L 20,10" stroke="#475569" strokeWidth="0.8" opacity="0.4" />
                </pattern>

                {/* Schist Pattern */}
                <pattern id="schistPattern" width="30" height="15" patternUnits="userSpaceOnUse">
                  <path d="M 0,7 L 30,7" stroke="#64748b" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
                </pattern>

                {/* Gondite Footwall Pattern */}
                <pattern id="footwallPattern" width="16" height="16" patternUnits="userSpaceOnUse">
                  <circle cx="8" cy="8" r="1.5" fill="#94a3b8" opacity="0.3" />
                </pattern>
              </defs>

              {/* Background Grid & Elevation RL Lines */}
              {showRuler && (
                <g stroke="#1e293b" strokeWidth="1" strokeDasharray="2 4">
                  {[60, 120, 180, 240, 300, 360, 420].map((y, i) => {
                    const rl = 400 - i * 50;
                    return (
                      <g key={y}>
                        <line x1="60" y1={y} x2="880" y2={y} />
                        <text
                          x="10"
                          y={y + 4}
                          fill="#64748b"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          +{rl}m RL
                        </text>
                      </g>
                    );
                  })}
                  {[120, 240, 360, 480, 600, 720, 840].map((x) => (
                    <line key={x} x1={x} y1="40" x2={x} y2="440" />
                  ))}
                </g>
              )}

              {/* Geological Country Rock Strata Layers (Dipping at ~65 degrees) */}
              {/* Layer 1: Footwall Quartzite & Gondite Silicates (North / Footwall side) */}
              <polygon
                points="60,440 60,70 380,50 180,440"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1"
              />
              <polygon
                points="60,440 60,70 380,50 180,440"
                fill="url(#footwallPattern)"
              />
              <text x="120" y="240" fill="#94a3b8" fontSize="11" transform="rotate(-62 120 240)">
                Footwall Quartzite & Calc-Gneiss
              </text>

              {/* Layer 2: Main Manganese Ore Body (Massive Braunite Lens) */}
              <polygon
                points="380,50 490,45 280,440 180,440"
                fill={
                  viewMode === "grade_heatmap"
                    ? "url(#oreGradient)"
                    : viewMode === "unfc_blocks"
                    ? "#4f46e5"
                    : activeBorehole.strata.find((s) => s.gradeMn > 35)?.color || "#0ea5e9"
                }
                stroke="#38bdf8"
                strokeWidth="2"
                opacity={viewMode === "grade_heatmap" ? 0.95 : 0.85}
              />

              {/* Ore Body Labels & Grade Annotations */}
              <g transform="rotate(-62 310 210)">
                <text x="240" y="210" fill="#ffffff" fontSize="13" fontWeight="bold">
                  ★ MANGANESE ORE BODY (BRAUNITE-GONDITE LENS)
                </text>
                <text x="240" y="228" fill="#a5f3fc" fontSize="11" fontFamily="monospace">
                  Avg Grade: {activeBorehole.mnGradePct}% Mn • True Width: ~{oreThickness}m
                </text>
              </g>

              {/* Layer 3: Hanging Wall Phyllite & Mica Schist (South side) */}
              <polygon
                points="490,45 880,40 880,440 280,440"
                fill="#0f172a"
                stroke="#334155"
                strokeWidth="1"
              />
              <polygon
                points="490,45 880,40 880,440 280,440"
                fill="url(#schistPattern)"
              />
              <text x="560" y="260" fill="#64748b" fontSize="11" transform="rotate(-62 560 260)">
                Hanging Wall Mica Schist & Phyllite
              </text>

              {/* Surface Weathering Overburden Layer (0 to ~25m) */}
              <path
                d="M 60,70 Q 250,55 450,48 T 880,40 L 880,85 Q 650,92 450,95 T 60,110 Z"
                fill="#1e293b"
                opacity="0.8"
              />
              <path
                d="M 60,70 Q 250,55 450,48 T 880,40 L 880,85 Q 650,92 450,95 T 60,110 Z"
                fill="url(#overburdenPattern)"
              />

              {/* Surface Topography Elevation Line with Grass/Vegetation indicator */}
              <path
                d="M 60,70 Q 250,55 450,48 T 880,40"
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
              />

              {/* Water Table / Piezometric Line */}
              {showWaterTable && (
                <g stroke="#0284c7" strokeWidth="1.5" strokeDasharray="4 3">
                  <path d="M 60,165 Q 450,150 880,140" />
                  <text x="710" y="135" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                    Piezometric Water Table (+290m RL)
                  </text>
                </g>
              )}

              {/* Geological Shear Fault Line (Offsetting Ore Body) */}
              {showFaults && (
                <g stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3">
                  <line x1="580" y1="40" x2="430" y2="440" />
                  <text x="590" y="60" fill="#f87171" fontSize="10" fontWeight="bold">
                    Bharweli Shear Fault (Throw: 12m)
                  </text>
                  {/* Movement displacement arrows */}
                  <path d="M 520,180 L 515,165 L 530,175 Z" fill="#ef4444" />
                  <path d="M 480,260 L 485,275 L 470,265 Z" fill="#ef4444" />
                </g>
              )}

              {/* Drill Hole Collar Point & Derrick Symbol on Surface */}
              <g transform="translate(420, 50)">
                {/* Surface Drill Rig Marker */}
                <rect x="-14" y="-24" width="28" height="24" rx="2" fill="#0284c7" />
                <path d="M -8,-2 L 0,-18 L 8,-2 Z" fill="#ffffff" />
                <circle cx="0" cy="-28" r="4" fill="#38bdf8" />
                <text
                  x="0"
                  y="-34"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {activeBorehole.id}
                </text>
                <text
                  x="0"
                  y="-46"
                  fill="#38bdf8"
                  fontSize="9"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  Collar: +395m RL
                </text>
              </g>

              {/* Borehole Drill Path Line (Vertical or slightly inclined to depth) */}
              {/* Total Depth scaled: 0m is at y=50, maxDepth is at y=400 */}
              <g>
                {/* Drill Trace Line */}
                <line
                  x1="420"
                  y1="50"
                  x2="420"
                  y2={50 + (activeBorehole.depthMeters / maxDepth) * 350}
                  stroke="#ffffff"
                  strokeWidth="3"
                />

                {/* Strata Segments mapped along borehole trace */}
                {activeBorehole.strata.map((s, idx) => {
                  const yStart = 50 + (s.depthFrom / maxDepth) * 350;
                  const yEnd = 50 + (s.depthTo / maxDepth) * 350;
                  const height = yEnd - yStart;

                  const isHighGrade = s.gradeMn >= 30;

                  return (
                    <g
                      key={idx}
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredStratum(s)}
                      onMouseLeave={() => setHoveredStratum(null)}
                    >
                      {/* Stratum Core Bar Interval */}
                      <rect
                        x="414"
                        y={yStart}
                        width="12"
                        height={height}
                        rx="1"
                        fill={s.color}
                        stroke="#ffffff"
                        strokeWidth="1"
                        className="transition group-hover:stroke-cyan-300 group-hover:stroke-2"
                      />

                      {/* Depth Marker Tick & Callout Label */}
                      <line x1="426" y1={yEnd} x2="445" y2={yEnd} stroke="#94a3b8" strokeWidth="1" />
                      <text
                        x="450"
                        y={yEnd + 3}
                        fill="#cbd5e1"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {s.depthTo}m
                      </text>

                      {/* Interval Description Label */}
                      <text
                        x="450"
                        y={yStart + height / 2 + 3}
                        fill={isHighGrade ? "#38bdf8" : "#94a3b8"}
                        fontSize="10"
                        fontWeight={isHighGrade ? "bold" : "normal"}
                      >
                        {s.lithology} ({s.gradeMn}% Mn)
                      </text>
                    </g>
                  );
                })}

                {/* Bottom of Hole (EOH) marker */}
                <g transform={`translate(420, ${50 + (activeBorehole.depthMeters / maxDepth) * 350})`}>
                  <path d="M -8,0 L 8,0 M 0,0 L 0,8" stroke="#ef4444" strokeWidth="2" />
                  <text x="14" y="8" fill="#ef4444" fontSize="10" fontWeight="bold" fontFamily="monospace">
                    EOH: {activeBorehole.depthMeters}m (Open at depth)
                  </text>
                </g>
              </g>

              {/* UNFC Resource Block Outlines Overlay */}
              {viewMode === "unfc_blocks" && (
                <g stroke="#818cf8" strokeWidth="2" strokeDasharray="5 5" fill="none">
                  <rect x="220" y="110" width="220" height="200" />
                  <text x="230" y="130" fill="#a5b4fc" fontSize="11" fontWeight="bold">
                    UNFC Block 111 (Proved Mineral Reserve)
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* Core Assay Intervals Breakdown Table */}
          <div className="bg-[#0a0f18] border border-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
              <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Drill Core Stratigraphic Intervals & Chemical Assay Log</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                Core Recovery: <strong className="text-cyan-400">96.4%</strong> • RQD:{" "}
                <strong className="text-emerald-400">88%</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-900/80 text-slate-400 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="py-1.5 px-2">Stratum Interval</th>
                    <th className="py-1.5 px-2">Lithological Unit</th>
                    <th className="py-1.5 px-2 text-right">Mn %</th>
                    <th className="py-1.5 px-2 text-right">Fe %</th>
                    <th className="py-1.5 px-2 text-right">P %</th>
                    <th className="py-1.5 px-2 text-right">SiO2 %</th>
                    <th className="py-1.5 px-2">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {activeBorehole.strata.map((s, idx) => {
                    const isOre = s.gradeMn >= 25;
                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-800/50 transition ${
                          isOre ? "bg-cyan-950/20 font-semibold" : ""
                        }`}
                      >
                        <td className="py-2 px-2 text-slate-300">
                          {s.depthFrom}.0m - {s.depthTo}.0m ({s.depthTo - s.depthFrom}m)
                        </td>
                        <td className="py-2 px-2 text-white font-sans flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: s.color }}
                          ></span>
                          <span>{s.lithology}</span>
                        </td>
                        <td className={`py-2 px-2 text-right font-bold ${isOre ? "text-cyan-400" : "text-slate-400"}`}>
                          {s.gradeMn}%
                        </td>
                        <td className="py-2 px-2 text-right text-slate-300">
                          {activeBorehole.feGradePct}%
                        </td>
                        <td className="py-2 px-2 text-right text-amber-400">
                          {activeBorehole.phosphorusPct}%
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400">
                          {activeBorehole.silicaPct}%
                        </td>
                        <td className="py-2 px-2 font-sans">
                          {isOre ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              High Grade Braunite
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] text-slate-400 bg-slate-900 border border-slate-800">
                              Host / Waste Country Rock
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Geological & Mining Recommendations Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div className="bg-[#0a0f18] p-2.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                Optimal Stoping Method
              </span>
              <div className="text-white font-bold">Sub-Level Open Stoping (SLOS)</div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Competent host schist walls allow 25m sub-level vertical intervals with dry mill-tailings paste backfill.
              </p>
            </div>

            <div className="bg-[#0a0f18] p-2.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                DGMS Pit Bench Stability
              </span>
              <div className="text-emerald-400 font-bold">Safety Factor: 1.48 (FOS Safe)</div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Maximum overall pit slope angle 45° complies with MMR 1961 Regulation 106.
              </p>
            </div>

            <div className="bg-[#0a0f18] p-2.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                Metallurgical Suitability
              </span>
              <div className="text-cyan-400 font-bold">Silico-Manganese Grade Compliant</div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Low Phosphorus ({activeBorehole.phosphorusPct}%) directly qualifies for ferro-alloy blast furnace smelting.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-2.5 border-t border-slate-800 bg-[#0a0f18] flex items-center justify-between shrink-0">
          <div className="text-[10px] text-slate-500 font-mono">
            Projection: WGS84 UTM 44N • UNFC Code 111 / 121 • MOIL Geology Department
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            Close Cross-Section
          </button>
        </div>
      </div>
    </div>
  );
};
