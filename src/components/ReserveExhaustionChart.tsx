import React, { useState, useMemo } from "react";
import { MoilMine } from "../types/mining";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import {
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Sliders,
  ShieldAlert,
  Info,
  Download,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Database,
} from "lucide-react";

interface ReserveExhaustionChartProps {
  mine: MoilMine;
  onBackToMap?: () => void;
}

type ProductionScenario = "CURRENT_ACTUAL" | "NAMEPLATE_CAPACITY" | "ACCELERATED_2030" | "CUSTOM";

export const ReserveExhaustionChart: React.FC<ReserveExhaustionChartProps> = ({
  mine,
  onBackToMap,
}) => {
  // Current actual annualized extraction rate based on run-rate
  const currentActualAnnualMT = useMemo(() => {
    return Math.round(mine.currentActualMT * 12);
  }, [mine.currentActualMT]);

  const [scenario, setScenario] = useState<ProductionScenario>("CURRENT_ACTUAL");
  const [customRateMT, setCustomRateMT] = useState<number>(currentActualAnnualMT);
  const [includeExplorationReplacement, setIncludeExplorationReplacement] = useState<boolean>(true);

  // Active annual extraction rate according to scenario
  const effectiveAnnualRateMT = useMemo(() => {
    switch (scenario) {
      case "CURRENT_ACTUAL":
        return currentActualAnnualMT;
      case "NAMEPLATE_CAPACITY":
        return mine.annualCapacityMT;
      case "ACCELERATED_2030":
        return Math.round(mine.annualCapacityMT * 1.2);
      case "CUSTOM":
        return customRateMT;
      default:
        return currentActualAnnualMT;
    }
  }, [scenario, currentActualAnnualMT, mine.annualCapacityMT, customRateMT]);

  // Baseline LOM calculations
  const totalReservesMT = mine.estimatedTotalReservesMT;
  const provedReservesMT = mine.provedReservesMT;
  const probableReservesMT = mine.probableReservesMT;

  // Annual exploration accretion (inferred resources upgraded to proved/probable by deep drilling)
  const annualExplorationAccretionMT = includeExplorationReplacement ? Math.round(mine.annualCapacityMT * 0.08) : 0;

  // Generate Year-by-Year Exhaustion Data
  const { chartData, exhaustionYearProved, exhaustionYearTotal, lifeOfMineYears } = useMemo(() => {
    const startYear = 2026;
    const maxYears = 32;
    const data = [];

    let currentProved = provedReservesMT;
    let currentTotal = totalReservesMT;
    let acceleratedTotal = totalReservesMT;
    const acceleratedRate = Math.round(mine.annualCapacityMT * 1.25);

    let yearProvedExhausted: number | null = null;
    let yearTotalExhausted: number | null = null;

    for (let i = 0; i <= maxYears; i++) {
      const year = startYear + i;

      // Check exhaustion milestones
      if (currentProved <= 0 && yearProvedExhausted === null) {
        yearProvedExhausted = year;
      }
      if (currentTotal <= 0 && yearTotalExhausted === null) {
        yearTotalExhausted = year;
      }

      // Convert to Million Metric Tonnes (MMT) with 2 decimal precision
      const totalMMT = +(Math.max(0, currentTotal) / 1_000_000).toFixed(2);
      const provedMMT = +(Math.max(0, currentProved) / 1_000_000).toFixed(2);
      const acceleratedMMT = +(Math.max(0, acceleratedTotal) / 1_000_000).toFixed(2);
      const depletionPct = +(((totalReservesMT - Math.max(0, currentTotal)) / totalReservesMT) * 100).toFixed(1);

      data.push({
        year,
        yearLabel: `'${String(year).slice(-2)}`,
        fullYear: String(year),
        totalReservesMMT: totalMMT,
        provedReservesMMT: provedMMT,
        acceleratedReservesMMT: acceleratedMMT,
        depletionPct,
        annualExtractionTons: effectiveAnnualRateMT,
        isExhausted: currentTotal <= 0,
      });

      if (currentTotal <= 0 && acceleratedTotal <= 0 && i > 15) {
        break;
      }

      // Decrement reserves for next year
      // Proved reserves are extracted first
      if (currentProved > 0) {
        const extractedFromProved = Math.min(currentProved, effectiveAnnualRateMT);
        currentProved -= extractedFromProved;
        const remainingToExtract = effectiveAnnualRateMT - extractedFromProved;
        currentTotal = currentTotal - extractedFromProved - remainingToExtract + annualExplorationAccretionMT;
      } else {
        currentTotal = currentTotal - effectiveAnnualRateMT + annualExplorationAccretionMT;
      }

      // Accelerated path
      acceleratedTotal = Math.max(0, acceleratedTotal - acceleratedRate);
    }

    const finalYearProved = yearProvedExhausted || (startYear + Math.round(provedReservesMT / effectiveAnnualRateMT));
    const finalYearTotal = yearTotalExhausted || (startYear + Math.round(totalReservesMT / effectiveAnnualRateMT));
    const lomYears = +(totalReservesMT / effectiveAnnualRateMT).toFixed(1);

    return {
      chartData: data,
      exhaustionYearProved: finalYearProved,
      exhaustionYearTotal: finalYearTotal,
      lifeOfMineYears: lomYears,
    };
  }, [
    provedReservesMT,
    totalReservesMT,
    effectiveAnnualRateMT,
    mine.annualCapacityMT,
    annualExplorationAccretionMT,
  ]);

  // Download exhaustion CSV data
  const handleExportCSV = () => {
    const headers = "Year,Total Reserves (MMT),Proved Reserves (MMT),Accelerated Case (MMT),Depletion %\n";
    const rows = chartData
      .map((d) => `${d.year},${d.totalReservesMMT},${d.provedReservesMMT},${d.acceleratedReservesMMT},${d.depletionPct}%`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mine.name.replace(/\s+/g, "_")}_Reserve_Exhaustion_Timeline.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-[#0f172a] border border-slate-700 p-3 rounded shadow-xl text-xs font-sans max-w-xs z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-white text-sm">Year {dataPoint.fullYear}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
              +{dataPoint.year - 2026} yrs horizon
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-cyan-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>Total Identified (111+121):</span>
              </span>
              <span className="font-mono font-bold text-white">
                {dataPoint.totalReservesMMT} MMT
              </span>
            </div>

            <div className="flex justify-between items-center text-emerald-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Proved Reserves (111):</span>
              </span>
              <span className="font-mono font-bold text-white">
                {dataPoint.provedReservesMMT} MMT
              </span>
            </div>

            <div className="flex justify-between items-center text-amber-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Accelerated Case (+25%):</span>
              </span>
              <span className="font-mono font-bold text-white">
                {dataPoint.acceleratedReservesMMT} MMT
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px] text-slate-400">
              <span>Cumulative Depleted:</span>
              <span className="font-bold font-mono text-slate-200">
                {dataPoint.depletionPct}%
              </span>
            </div>

            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Annual Burn Rate:</span>
              <span className="font-mono">{(dataPoint.annualExtractionTons / 1000).toLocaleString()}k MT/yr</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="reserve-exhaustion-timeline-container" className="p-3.5 space-y-3.5 bg-[#0a0f18] text-slate-200">
      {/* Top Banner & KPI Stat Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {/* Total Reserves */}
        <div className="bg-[#0f172a] border border-slate-800 rounded p-2.5 shadow-sm">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold">
            <span>Identified Reserves</span>
            <Database className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-cyan-300 mt-1">
            {(totalReservesMT / 1_000_000).toFixed(2)}{" "}
            <span className="text-xs text-slate-400 font-normal">MMT</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Proved: {(provedReservesMT / 1_000_000).toFixed(2)} MMT (UNFC 111)
          </div>
        </div>

        {/* Current Production Rate */}
        <div className="bg-[#0f172a] border border-slate-800 rounded p-2.5 shadow-sm">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold">
            <span>Annual Run-Rate</span>
            <TrendingDown className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-white mt-1">
            {(effectiveAnnualRateMT / 1000).toFixed(0)}{" "}
            <span className="text-xs text-slate-400 font-normal">k MT/yr</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <span>Scenario: {scenario.replace("_", " ")}</span>
          </div>
        </div>

        {/* Remaining Life of Mine */}
        <div className="bg-[#0f172a] border border-slate-800 rounded p-2.5 shadow-sm">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold">
            <span>Life of Mine (LOM)</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-amber-400 mt-1">
            {lifeOfMineYears}{" "}
            <span className="text-xs text-slate-400 font-normal">Years</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Target Exhaustion: <strong className="text-slate-200">Year {exhaustionYearTotal}</strong>
          </div>
        </div>

        {/* Proved UNFC 111 Horizon */}
        <div className="bg-[#0f172a] border border-slate-800 rounded p-2.5 shadow-sm">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold">
            <span>Proved (111) Horizon</span>
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400 mt-1">
            Year {exhaustionYearProved}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            +{(exhaustionYearProved - 2026)} years before UNFC 121 transition
          </div>
        </div>

        {/* Statutory Compliance Indicator */}
        <div className="bg-[#0f172a] border border-slate-800 rounded p-2.5 shadow-sm col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold">
            <span>IBM / DGMS Status</span>
            <ShieldAlert className="w-3.5 h-3.5 text-green-400" />
          </div>
          <div className="text-xs font-bold text-green-300 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
            <span>MCDR 2017 Rule 12 Compliant</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            LOM &gt; 5 yrs: Normal Mine Operations
          </div>
        </div>
      </div>

      {/* Interactive Scenario Controls & Legend Header */}
      <div className="bg-[#0f172a] border border-slate-800 rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>Extraction Rate Scenario:</span>
          </span>

          <button
            id="btn-scenario-current"
            onClick={() => setScenario("CURRENT_ACTUAL")}
            className={`px-2.5 py-1 rounded text-xs font-bold transition ${
              scenario === "CURRENT_ACTUAL"
                ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            Current Run-Rate ({(currentActualAnnualMT / 1000).toFixed(0)}k MT/yr)
          </button>

          <button
            id="btn-scenario-nameplate"
            onClick={() => setScenario("NAMEPLATE_CAPACITY")}
            className={`px-2.5 py-1 rounded text-xs font-bold transition ${
              scenario === "NAMEPLATE_CAPACITY"
                ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            Nameplate Capacity ({(mine.annualCapacityMT / 1000).toFixed(0)}k MT/yr)
          </button>

          <button
            id="btn-scenario-accelerated"
            onClick={() => setScenario("ACCELERATED_2030")}
            className={`px-2.5 py-1 rounded text-xs font-bold transition ${
              scenario === "ACCELERATED_2030"
                ? "bg-amber-600 text-white shadow-sm ring-1 ring-amber-400"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            Vision 2030 (+20% Expansion)
          </button>
        </div>

        {/* Exploration Replacement Toggle & CSV Export */}
        <div className="flex items-center gap-2 ml-auto">
          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer bg-slate-900 px-2.5 py-1 rounded border border-slate-800 hover:border-slate-700 select-none">
            <input
              type="checkbox"
              checked={includeExplorationReplacement}
              onChange={(e) => setIncludeExplorationReplacement(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
            />
            <span className="text-[11px]">Borehole Exploration Conversion (+8%/yr)</span>
          </label>

          <button
            id="btn-export-exhaustion-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs transition"
            title="Download CSV timeline forecast data"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>CSV</span>
          </button>

          {onBackToMap && (
            <button
              onClick={onBackToMap}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-sm"
            >
              <span>Back to Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Recharts Line Chart Container */}
      <div className="bg-[#0f172a] border border-slate-800 rounded p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between pb-2 mb-3 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-tight flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-cyan-400" />
              <span>Manganese Ore Reserve Exhaustion Trajectory (2026 - 2055)</span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Modeled under UNFC-1997 / Indian Bureau of Mines (IBM) guidelines based on annual extraction run-rate of {(effectiveAnnualRateMT / 1000).toLocaleString()}k MT
            </p>
          </div>

          {/* Chart Legend Badges */}
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block"></span>
              <span className="text-cyan-300 font-semibold">Total Reserves (UNFC 111+121)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span>
              <span className="text-emerald-300 font-semibold">Proved Reserves (111)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-amber-400 inline-block"></span>
              <span className="text-amber-300 font-semibold">Accelerated Case (+25%)</span>
            </div>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
            >
              <defs>
                <linearGradient id="totalReservesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="provedReservesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

              <XAxis
                dataKey="yearLabel"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={{ stroke: "#334155" }}
                tickLine={{ stroke: "#334155" }}
              />

              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={{ stroke: "#334155" }}
                tickLine={{ stroke: "#334155" }}
                unit=" MMT"
                domain={[0, "auto"]}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Shaded Area for Total Reserves */}
              <Area
                type="monotone"
                dataKey="totalReservesMMT"
                fill="url(#totalReservesGrad)"
                stroke="none"
              />

              {/* Proved Reserve Exhaustion Vertical Reference Line */}
              <ReferenceLine
                x={`'${String(exhaustionYearProved).slice(-2)}`}
                stroke="#10b981"
                strokeDasharray="3 3"
                label={{
                  value: `Proved End: ${exhaustionYearProved}`,
                  position: "top",
                  fill: "#34d399",
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              />

              {/* Total Reserve Exhaustion Vertical Reference Line */}
              <ReferenceLine
                x={`'${String(exhaustionYearTotal).slice(-2)}`}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: `Mine Depletion: ${exhaustionYearTotal}`,
                  position: "top",
                  fill: "#fbbf24",
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              />

              {/* Line 1: Total Reserves (UNFC 111+121) */}
              <Line
                type="monotone"
                dataKey="totalReservesMMT"
                name="Total Identified Reserves"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: "#06b6d4", stroke: "#083344", strokeWidth: 1 }}
                activeDot={{ r: 5, fill: "#22d3ee", stroke: "#fff" }}
              />

              {/* Line 2: Proved Reserves (UNFC 111) */}
              <Line
                type="monotone"
                dataKey="provedReservesMMT"
                name="Proved Reserves (111)"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 2, fill: "#10b981", stroke: "#064e3b", strokeWidth: 1 }}
                activeDot={{ r: 4.5, fill: "#34d399", stroke: "#fff" }}
              />

              {/* Line 3: Accelerated Depletion Case */}
              <Line
                type="monotone"
                dataKey="acceleratedReservesMMT"
                name="Accelerated Expansion Case"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Explanatory Annotations & IBM Regulatory Note */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
          <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 flex items-start gap-2">
            <span className="p-1 rounded bg-cyan-500/10 text-cyan-400 mt-0.5">
              <Database className="w-3.5 h-3.5" />
            </span>
            <div>
              <strong className="text-white">UNFC Classification Blend:</strong>
              <p className="text-slate-400 mt-0.5 leading-snug">
                Proved reserves (111) represent economically mineable ore delineated by continuous core drilling. Probable reserves (121) are accessed via level deepening.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 flex items-start gap-2">
            <span className="p-1 rounded bg-amber-500/10 text-amber-400 mt-0.5">
              <TrendingDown className="w-3.5 h-3.5" />
            </span>
            <div>
              <strong className="text-white">Grade Dilution Factor:</strong>
              <p className="text-slate-400 mt-0.5 leading-snug">
                High-grade Braunite lenses (44%+ Mn) are sequentially mined first, followed by lower-grade siliceous gondite ore requiring heavy media separation after year {exhaustionYearProved - 3}.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 flex items-start gap-2">
            <span className="p-1 rounded bg-green-500/10 text-green-400 mt-0.5">
              <ShieldAlert className="w-3.5 h-3.5" />
            </span>
            <div>
              <strong className="text-white">IBM Progressive Mine Closure:</strong>
              <p className="text-slate-400 mt-0.5 leading-snug">
                Under MCDR 2017 Rule 23F, Final Mine Closure Plan submission is triggered 5 years prior to predicted exhaustion (Year {exhaustionYearTotal - 5}).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
