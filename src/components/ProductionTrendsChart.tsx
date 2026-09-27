import React, { useState } from "react";
import { MoilMine, ShortfallPredictionResult } from "../types/mining";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  TrendingDown,
  AlertTriangle,
  Calendar,
  Layers,
  Wrench,
  CloudRain,
  ShieldAlert,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";

interface ProductionTrendsChartProps {
  mine: MoilMine;
  predictionResult?: ShortfallPredictionResult;
}

export const ProductionTrendsChart: React.FC<ProductionTrendsChartProps> = ({
  mine,
  predictionResult,
}) => {
  const [activeView, setActiveView] = useState<"monthly" | "constraints">("monthly");

  // Chart data for monthly trend
  const monthlyData = mine.monthlyProductionTrend.map((item) => ({
    month: item.month,
    Planned: item.plannedMT,
    Actual: item.actualMT,
    Forecast: item.predictedMT || item.actualMT,
    Shortfall: item.shortfallMT,
    Constraint: item.primaryConstraint,
  }));

  // Constraint impact data from prediction or default
  const constraintData = predictionResult?.rootCauseBreakdown || [
    { factor: "Weather & Pit Rain Slush", impactMT: 2800, percentage: 42 },
    { factor: "HEMM Fleet Breakdown", impactMT: 2100, percentage: 31 },
    { factor: "Blasting PPV & Nonel Delays", impactMT: 1200, percentage: 18 },
    { factor: "Shaft / Logistics Wait", impactMT: 600, percentage: 9 },
  ];

  const totalShortfallMT =
    predictionResult?.projectedShortfallMT ||
    mine.monthlyProductionTrend[mine.monthlyProductionTrend.length - 1].shortfallMT;

  const colors = ["#f43f5e", "#fb923c", "#facc15", "#818cf8"];

  return (
    <div
      id="section-production-trends-and-shortfalls"
      className="bg-[#0f172a] border border-slate-800 rounded p-3.5 shadow-sm mb-4"
    >
      {/* Module Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-tight font-sans">
              Production Shortfall Prediction & Constraint Analyzer
            </h2>
            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/30 rounded">
              AI RISK ENGINE
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            Analysing mismatch between mine plan targets and actual ore production for {mine.name}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-1 bg-[#0a0f18] p-0.5 rounded border border-slate-800 text-[10px]">
          <button
            id="btn-view-monthly-trends"
            onClick={() => setActiveView("monthly")}
            className={`px-2.5 py-0.5 rounded font-medium transition ${
              activeView === "monthly"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Monthly Trends vs Plan
          </button>
          <button
            id="btn-view-constraint-breakdown"
            onClick={() => setActiveView("constraints")}
            className={`px-2.5 py-0.5 rounded font-medium transition ${
              activeView === "constraints"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Constraint Root Cause
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 mt-3">
        {/* Chart Column (8 Cols) */}
        <div className="lg:col-span-8">
          {activeView === "monthly" ? (
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                <span>Metric Tonnes (MT) per Month</span>
                <span className="text-blue-400 font-semibold">
                  Target: {mine.monthlyTargetMT.toLocaleString()} MT/mo
                </span>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} domain={[0, "auto"]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "4px",
                        color: "#f8fafc",
                        fontSize: "11px",
                        padding: "6px 10px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                    <Bar dataKey="Planned" fill="#38bdf8" name="Planned Target" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Actual" fill="#10b981" name="Actual Production" radius={[2, 2, 0, 0]} />
                    <Line type="monotone" dataKey="Forecast" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" name="AI Projected" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                <span>Constraint Impact Volume (Loss in MT)</span>
                <span className="text-red-400 font-semibold">
                  Projected Shortfall: -{totalShortfallMT.toLocaleString()} MT
                </span>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={constraintData} layout="vertical" margin={{ top: 8, right: 20, left: 50, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#64748b" fontSize={10} />
                    <YAxis dataKey="factor" type="category" stroke="#94a3b8" fontSize={10} width={130} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "4px",
                        color: "#f8fafc",
                        fontSize: "11px",
                        padding: "6px 10px",
                      }}
                      formatter={(val: any) => [`${val} MT`, "Lost Ore"]}
                    />
                    <Bar dataKey="impactMT" radius={[0, 2, 2, 0]}>
                      {constraintData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Shortfall Risk Diagnostics Column (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900/50 p-3 rounded border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                Active Risk Diagnosis
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                {predictionResult?.riskLevel || "HIGH RISK"}
              </span>
            </div>

            {/* Gap Summary Card */}
            <div className="mt-2.5 p-2.5 rounded bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Month-End Projection</div>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-xl font-bold font-sans text-white">
                  {(
                    predictionResult?.predictedMonthEndMT ||
                    mine.monthlyProductionTrend[mine.monthlyProductionTrend.length - 1].predictedMT ||
                    mine.currentActualMT + 4500
                  ).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400">MT Expected</span>
              </div>
              <div className="mt-1.5 text-[11px] text-red-400 flex items-center gap-1 font-semibold">
                <ArrowDownRight className="w-3 h-3" />
                <span>
                  Shortfall: -{totalShortfallMT.toLocaleString()} MT (
                  {(
                    ((totalShortfallMT || 5000) / mine.monthlyTargetMT) *
                    100
                  ).toFixed(1)}
                  % of Plan)
                </span>
              </div>
            </div>

            {/* Top Operational Bottlenecks */}
            <div className="mt-2.5 space-y-1.5 text-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Critical Constraints:
              </div>
              <div className="p-2 rounded bg-slate-900/70 border border-slate-800/80 flex items-start gap-2">
                <CloudRain className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[11px] text-slate-200">
                    Monsoon Runoff & Haul Slush
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {mine.satelliteIndicators.rainfall24hMm}mm 24h rain increased haul cycle from 18 to 28 mins.
                  </div>
                </div>
              </div>

              <div className="p-2 rounded bg-slate-900/70 border border-slate-800/80 flex items-start gap-2">
                <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[11px] text-slate-200">
                    HEMM Fleet Availability
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Shovel under repair; stope loading currently operating at 76% target capacity.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Synthesis Note */}
          <div className="mt-2.5 pt-2 border-t border-slate-800">
            <div className="text-[10px] text-amber-400/90 italic flex items-center gap-1.5 leading-snug">
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
              <span>
                {predictionResult?.executiveSummary ||
                  "Target shortfall projected due to rain & equipment constraints. Corrective actions below can recover up to 88% of loss."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
