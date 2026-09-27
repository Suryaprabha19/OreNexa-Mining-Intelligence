import React, { useState, useMemo } from "react";
import { MoilMine, SimulatedScenarioOption, ShortfallPredictionResult } from "../types/mining";
import {
  generateSimulatedScenarios,
  calculateScenarioDeltas,
} from "../utils/scenarioComparisons";
import {
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Truck,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  ChevronDown,
  Scale,
  Percent,
  BarChart3,
  HelpCircle,
} from "lucide-react";

interface ScenarioSideBySideComparatorProps {
  mine: MoilMine;
  predictionResult?: ShortfallPredictionResult;
  onAdoptScenario: (scenario: SimulatedScenarioOption) => void;
}

export const ScenarioSideBySideComparator: React.FC<ScenarioSideBySideComparatorProps> = ({
  mine,
  predictionResult,
  onAdoptScenario,
}) => {
  const scenarios = useMemo(
    () => generateSimulatedScenarios(mine, predictionResult),
    [mine, predictionResult]
  );

  const [selectedAId, setSelectedAId] = useState<string>(scenarios[0]?.id || "");
  const [selectedBId, setSelectedBId] = useState<string>(scenarios[1]?.id || "");
  const [adoptedScenarioId, setAdoptedScenarioId] = useState<string | null>(null);

  const scenarioA = scenarios.find((s) => s.id === selectedAId) || scenarios[0];
  const scenarioB = scenarios.find((s) => s.id === selectedBId) || scenarios[1];

  const deltas = useMemo(
    () => calculateScenarioDeltas(scenarioA, scenarioB),
    [scenarioA, scenarioB]
  );

  const handleSwap = () => {
    setSelectedAId(scenarioB.id);
    setSelectedBId(scenarioA.id);
  };

  const handleAdopt = (scenario: SimulatedScenarioOption) => {
    setAdoptedScenarioId(scenario.id);
    onAdoptScenario(scenario);
  };

  const formatLakhs = (amountINR: number) => {
    return (amountINR / 100000).toFixed(2);
  };

  const getCategoryIcon = (category: SimulatedScenarioOption["category"]) => {
    switch (category) {
      case "GRADE_BLENDING":
        return <Layers className="w-3.5 h-3.5 text-emerald-400" />;
      case "FLEET_OPTIMIZATION":
        return <Truck className="w-3.5 h-3.5 text-amber-400" />;
      case "BLAST_ENGINEERING":
        return <Flame className="w-3.5 h-3.5 text-orange-400" />;
      case "STOPE_ACCELERATION":
        return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
      case "BENEFICIATION":
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <BarChart3 className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Quick preset pairings
  const presets = [
    { label: "Silo Blend vs 3-Shift Fleet", a: "SCN-STOCKPILE-BLEND", b: "SCN-FLEET-3SHIFT" },
    { label: "Electronic Blast vs Deep Stope", a: "SCN-BLAST-ELECTRONIC", b: "SCN-UNDERGROUND-STOPE" },
    { label: "High Grade vs DMS Reclaim", a: "SCN-STOCKPILE-BLEND", b: "SCN-DMS-BENEFICIATION" },
    { label: "Max Recovery vs Baseline", a: "SCN-FLEET-3SHIFT", b: "SCN-CONSERVATIVE-STANDBY" },
  ];

  return (
    <div id="scenario-side-by-side-comparator" className="space-y-4">
      {/* Control Bar: Quick Presets & Swap */}
      <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
            <Scale className="w-3 h-3 text-blue-400" />
            Comparison Presets:
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedAId(p.a);
                setSelectedBId(p.b);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-medium border transition ${
                selectedAId === p.a && selectedBId === p.b
                  ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                  : "bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-750"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          id="btn-swap-scenarios"
          onClick={handleSwap}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          title="Swap Scenario A and B positions"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
          <span>SWAP (A &harr; B)</span>
        </button>
      </div>

      {/* Selectors Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scenario A Selector Card */}
        <div className="bg-[#0b1329] border border-blue-800/60 rounded-lg p-3 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-600 text-white">
                SCENARIO A
              </span>
              <span className="text-[10px] font-bold text-cyan-400 font-mono">
                {scenarioA.code}
              </span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700">
              {scenarioA.badge}
            </span>
          </div>

          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
            Select Strategy to Test:
          </label>
          <div className="relative">
            <select
              id="select-scenario-a"
              value={selectedAId}
              onChange={(e) => setSelectedAId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded px-2.5 py-1.5 pr-8 appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id} disabled={s.id === selectedBId}>
                  {s.name} ({s.badge})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>

          <p className="text-[11px] text-slate-300 mt-2 line-clamp-2 italic">
            "{scenarioA.description}"
          </p>
        </div>

        {/* Scenario B Selector Card */}
        <div className="bg-[#140e26] border border-purple-800/60 rounded-lg p-3 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-400"></div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-600 text-white">
                SCENARIO B
              </span>
              <span className="text-[10px] font-bold text-purple-300 font-mono">
                {scenarioB.code}
              </span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-900/60 text-purple-300 border border-purple-700">
              {scenarioB.badge}
            </span>
          </div>

          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
            Select Strategy to Test:
          </label>
          <div className="relative">
            <select
              id="select-scenario-b"
              value={selectedBId}
              onChange={(e) => setSelectedBId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded px-2.5 py-1.5 pr-8 appearance-none focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id} disabled={s.id === selectedAId}>
                  {s.name} ({s.badge})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>

          <p className="text-[11px] text-slate-300 mt-2 line-clamp-2 italic">
            "{scenarioB.description}"
          </p>
        </div>
      </div>

      {/* Head-to-Head Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ===================== COLUMN A ===================== */}
        <div className="bg-[#0f172a] border border-blue-900/40 rounded-lg p-3.5 space-y-3.5">
          {/* Section: Manganese Recovery */}
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase text-blue-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Manganese Recovery Impact
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                ETA: {scenarioA.timelineHours} hrs
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2 rounded border border-slate-800/80 mb-2">
              <div>
                <div className="text-[10px] text-slate-400">Projected Ore Recovery</div>
                <div className="text-base font-extrabold text-green-400 font-mono">
                  +{scenarioA.projectedRecoveryMT.toLocaleString()} MT
                </div>
                <div className="text-[10px] text-slate-400">
                  {scenarioA.deficitMitigationPct}% of shortfall
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400">Recovered Ore Grade</div>
                <div className="text-base font-extrabold text-amber-400 font-mono">
                  {scenarioA.recoveredGradePct}% Mn
                </div>
                <div className="text-[10px] text-slate-400">
                  {scenarioA.recoveredGradePct >= 45 ? "High-Grade Metallurgical" : "Medium-Grade ROM"}
                </div>
              </div>
            </div>

            {/* Recovery bar against shortfall */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Shortfall Mitigation Coverage</span>
                <span className="font-bold text-green-400">{scenarioA.deficitMitigationPct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                  style={{ width: `${Math.min(100, scenarioA.deficitMitigationPct)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Section: Operational Cost & Economics */}
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase text-amber-400 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Operational Cost (OPEX)
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                ROI: {scenarioA.roiMultiple}x
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2 rounded border border-slate-800/80 mb-2">
              <div>
                <div className="text-[10px] text-slate-400">Total Scenario OPEX</div>
                <div className="text-base font-extrabold text-white font-mono">
                  ₹{formatLakhs(scenarioA.totalCostINR)} L
                </div>
                <div className="text-[10px] text-slate-400">
                  (₹{scenarioA.costPerTonINR.toLocaleString()}/MT)
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400">Net Economic Margin</div>
                <div className="text-base font-extrabold text-emerald-400 font-mono">
                  +₹{formatLakhs(scenarioA.netEconomicMarginINR)} L
                </div>
                <div className="text-[10px] text-slate-400">
                  Gross: ₹{formatLakhs(scenarioA.grossRevenueINR)} L
                </div>
              </div>
            </div>

            {/* OPEX Breakdown items */}
            <div className="space-y-1 text-[10px] bg-slate-950/60 p-2 rounded border border-slate-800/60">
              <div className="font-bold text-slate-400 mb-0.5">OPEX Itemization:</div>
              <div className="flex justify-between text-slate-300">
                <span>Fuel & Power (HSD/Grid):</span>
                <span className="font-mono text-white">₹{formatLakhs(scenarioA.costBreakdown.fuelAndPowerINR)} L</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Crew Labour & Overtime:</span>
                <span className="font-mono text-white">₹{formatLakhs(scenarioA.costBreakdown.labourAndOvertimeINR)} L</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Equipment Spares & Maintenance:</span>
                <span className="font-mono text-white">₹{formatLakhs(scenarioA.costBreakdown.sparesAndMaintenanceINR)} L</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Consumables & Explosives/Media:</span>
                <span className="font-mono text-white">₹{formatLakhs(scenarioA.costBreakdown.consumablesAndReagentsINR)} L</span>
              </div>
            </div>
          </div>

          {/* Section: Operational Feasibility & DGMS Compliance */}
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">DGMS Statutory Risk:</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                  scenarioA.dgmsComplianceRisk === "LOW"
                    ? "bg-green-950/80 text-green-400 border-green-800"
                    : scenarioA.dgmsComplianceRisk === "MODERATE"
                    ? "bg-amber-950/80 text-amber-400 border-amber-800"
                    : "bg-red-950/80 text-red-400 border-red-800"
                }`}
              >
                {scenarioA.dgmsComplianceRisk} RISK
              </span>
            </div>
            <p className="text-[10px] text-slate-400 italic leading-snug">
              {scenarioA.dgmsRiskNote}
            </p>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">Weather Sensitivity:</span>
              <span className="text-slate-200 font-semibold">{scenarioA.weatherSensitivity}</span>
            </div>

            <div className="pt-1">
              <div className="text-[10px] text-slate-400 font-bold mb-1">Key Machinery:</div>
              <div className="flex flex-wrap gap-1">
                {scenarioA.keyMachineryInvolved.map((m, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Adopt Scenario A Button */}
          <button
            id="btn-adopt-scenario-a"
            onClick={() => handleAdopt(scenarioA)}
            className={`w-full py-2 px-3 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              adoptedScenarioId === scenarioA.id
                ? "bg-green-900/60 text-green-300 border border-green-700/80 cursor-default"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-md border border-blue-500"
            }`}
          >
            {adoptedScenarioId === scenarioA.id ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>ADOPTED & ACTIVE IN FORECAST</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ADOPT SCENARIO A</span>
              </>
            )}
          </button>
        </div>

        {/* ===================== COLUMN B ===================== */}
        <div className="bg-[#0f172a] border border-purple-900/40 rounded-lg p-3.5 space-y-3.5">
          {/* Section: Manganese Recovery */}
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase text-purple-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Manganese Recovery Impact
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                ETA: {scenarioB.timelineHours} hrs
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2 rounded border border-slate-800/80 mb-2">
              <div>
                <div className="text-[10px] text-slate-400">Projected Ore Recovery</div>
                <div className="text-base font-extrabold text-green-400 font-mono">
                  +{scenarioB.projectedRecoveryMT.toLocaleString()} MT
                </div>
                <div className="text-[10px] text-slate-400">
                  {scenarioB.deficitMitigationPct}% of shortfall
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400">Recovered Ore Grade</div>
                <div className="text-base font-extrabold text-amber-400 font-mono">
                  {scenarioB.recoveredGradePct}% Mn
                </div>
                <div className="text-[10px] text-slate-400">
                  {scenarioB.recoveredGradePct >= 45 ? "High-Grade Metallurgical" : "Medium-Grade ROM"}
                </div>
              </div>
            </div>

            {/* Recovery bar against shortfall */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Shortfall Mitigation Coverage</span>
                <span className="font-bold text-green-400">{scenarioB.deficitMitigationPct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full"
                  style={{ width: `${Math.min(100, scenarioB.deficitMitigationPct)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Section: Operational Cost & Economics */}
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase text-amber-400 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Operational Cost (OPEX)
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                ROI: {scenarioB.roiMultiple}x
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2 rounded border border-slate-800/80 mb-2">
              <div>
                <div className="text-[10px] text-slate-400">Total Scenario OPEX</div>
                <div className="text-base font-extrabold text-white font-mono">
                  ₹{formatLakhs(scenarioB.totalCostINR)} L
                </div>
                <div className="text-[10px] text-slate-400">
                  (₹{scenarioB.costPerTonINR.toLocaleString()}/MT)
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400">Net Economic Margin</div>
                <div className="text-base font-extrabold text-emerald-400 font-mono">
                  +₹{formatLakhs(scenarioB.netEconomicMarginINR)} L
                </div>
                <div className="text-[10px] text-slate-400">
                  Gross: ₹{formatLakhs(scenarioB.grossRevenueINR)} L
                </div>
              </div>
            </div>

            {/* OPEX Breakdown items */}
            <div className="space-y-1 text-[10px] bg-slate-950/60 p-2 rounded border border-slate-800/60">
              <div className="font-bold text-slate-400 mb-0.5">OPEX Itemization:</div>
              <div className="flex justify-between text-slate-300">
                <span>Fuel & Power (HSD/Grid):</span>
                <span className="font-mono text-white">₹{formatLakhs(scenarioB.costBreakdown.fuelAndPowerINR)} L</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Crew Labour & Overtime:</span>
                <span className="font-mono text-white">₹{formatLakhs(scenarioB.costBreakdown.labourAndOvertimeINR)} L</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Equipment Spares & Maintenance:</span>
                <span className="font-mono text-white">₹{formatLakhs(scenarioB.costBreakdown.sparesAndMaintenanceINR)} L</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Consumables & Explosives/Media:</span>
                <span className="font-mono text-white">₹{formatLakhs(scenarioB.costBreakdown.consumablesAndReagentsINR)} L</span>
              </div>
            </div>
          </div>

          {/* Section: Operational Feasibility & DGMS Compliance */}
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">DGMS Statutory Risk:</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                  scenarioB.dgmsComplianceRisk === "LOW"
                    ? "bg-green-950/80 text-green-400 border-green-800"
                    : scenarioB.dgmsComplianceRisk === "MODERATE"
                    ? "bg-amber-950/80 text-amber-400 border-amber-800"
                    : "bg-red-950/80 text-red-400 border-red-800"
                }`}
              >
                {scenarioB.dgmsComplianceRisk} RISK
              </span>
            </div>
            <p className="text-[10px] text-slate-400 italic leading-snug">
              {scenarioB.dgmsRiskNote}
            </p>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">Weather Sensitivity:</span>
              <span className="text-slate-200 font-semibold">{scenarioB.weatherSensitivity}</span>
            </div>

            <div className="pt-1">
              <div className="text-[10px] text-slate-400 font-bold mb-1">Key Machinery:</div>
              <div className="flex flex-wrap gap-1">
                {scenarioB.keyMachineryInvolved.map((m, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Adopt Scenario B Button */}
          <button
            id="btn-adopt-scenario-b"
            onClick={() => handleAdopt(scenarioB)}
            className={`w-full py-2 px-3 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              adoptedScenarioId === scenarioB.id
                ? "bg-green-900/60 text-green-300 border border-green-700/80 cursor-default"
                : "bg-purple-600 hover:bg-purple-500 text-white shadow-md border border-purple-500"
            }`}
          >
            {adoptedScenarioId === scenarioB.id ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>ADOPTED & ACTIVE IN FORECAST</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ADOPT SCENARIO B</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Differential Head-to-Head Delta Summary Card */}
      <div className="bg-[#0a1120] border border-slate-800 rounded-lg p-3.5">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-tight">
              Head-to-Head Differential Delta (Scenario A vs Scenario B)
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            {scenarioA.code} vs {scenarioB.code}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Delta 1: Manganese Recovery */}
          <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>Recovery Advantage:</span>
              <span
                className={`font-bold px-1 rounded text-[9px] ${
                  deltas.recoveryDeltaMT >= 0
                    ? "bg-blue-500/20 text-blue-300"
                    : "bg-purple-500/20 text-purple-300"
                }`}
              >
                {deltas.recoveryDeltaMT >= 0 ? "Scenario A Wins" : "Scenario B Wins"}
              </span>
            </div>
            <div className="text-sm font-extrabold mt-1 font-mono text-white flex items-center gap-1">
              {deltas.recoveryDeltaMT >= 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400">+{Math.abs(deltas.recoveryDeltaMT).toLocaleString()} MT</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-purple-300">-{Math.abs(deltas.recoveryDeltaMT).toLocaleString()} MT</span>
                </>
              )}
              <span className="text-[10px] text-slate-400 font-normal">
                ({deltas.recoveryPctDelta > 0 ? `+${deltas.recoveryPctDelta}%` : `${deltas.recoveryPctDelta}%`})
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Grade delta: {deltas.gradeDeltaPct > 0 ? `+${deltas.gradeDeltaPct}%` : `${deltas.gradeDeltaPct}%`} Mn
            </div>
          </div>

          {/* Delta 2: Operational Cost Difference */}
          <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>OPEX Cost Difference:</span>
              <span
                className={`font-bold px-1 rounded text-[9px] ${
                  deltas.costDeltaINR <= 0
                    ? "bg-green-500/20 text-green-300"
                    : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {deltas.costDeltaINR <= 0 ? "Scenario A Cheaper" : "Scenario B Cheaper"}
              </span>
            </div>
            <div className="text-sm font-extrabold mt-1 font-mono text-white flex items-center gap-1">
              <span className={deltas.costDeltaINR <= 0 ? "text-green-400" : "text-amber-400"}>
                {deltas.costDeltaINR <= 0 ? "-" : "+"}₹{formatLakhs(Math.abs(deltas.costDeltaINR))} L
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                ({deltas.costPerTonDeltaINR <= 0 ? "-" : "+"}₹{Math.abs(deltas.costPerTonDeltaINR)}/MT)
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Per ton cost: ₹{scenarioA.costPerTonINR} vs ₹{scenarioB.costPerTonINR} /MT
            </div>
          </div>

          {/* Delta 3: Net Economic Margin */}
          <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>Net Margin Benefit:</span>
              <span
                className={`font-bold px-1 rounded text-[9px] ${
                  deltas.netMarginDeltaINR >= 0
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-purple-500/20 text-purple-300"
                }`}
              >
                {deltas.netMarginDeltaINR >= 0 ? "Scenario A Higher Margin" : "Scenario B Higher Margin"}
              </span>
            </div>
            <div className="text-sm font-extrabold mt-1 font-mono text-white flex items-center gap-1">
              <span className="text-emerald-400">
                {deltas.netMarginDeltaINR >= 0 ? "+" : "-"}₹{formatLakhs(Math.abs(deltas.netMarginDeltaINR))} L
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                (ROI {scenarioA.roiMultiple}x vs {scenarioB.roiMultiple}x)
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              ETA difference: {deltas.timelineDeltaHours <= 0 ? `${Math.abs(deltas.timelineDeltaHours)} hrs faster (A)` : `${deltas.timelineDeltaHours} hrs slower (A)`}
            </div>
          </div>
        </div>

        {/* AI Operational Guidance Verdict */}
        <div className="mt-2.5 p-2 bg-blue-950/40 border border-blue-800/40 rounded flex items-start gap-2 text-xs">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-300 leading-tight">
            <span className="font-bold text-blue-300">Decision Analysis: </span>
            {deltas.recoveryDeltaMT >= 0 && deltas.costDeltaINR <= 0 ? (
              <span>
                <strong>Scenario A ({scenarioA.shortName})</strong> dominates Scenario B on both dimensions—recovering +{Math.abs(deltas.recoveryDeltaMT).toLocaleString()} MT more manganese ore while saving ₹{formatLakhs(Math.abs(deltas.costDeltaINR))} Lakhs in operational expenditure.
              </span>
            ) : deltas.recoveryDeltaMT < 0 && deltas.costDeltaINR <= 0 ? (
              <span>
                <strong>Trade-Off Identified:</strong> Scenario A costs ₹{formatLakhs(Math.abs(deltas.costDeltaINR))} Lakhs less to execute (₹{scenarioA.costPerTonINR}/MT vs ₹{scenarioB.costPerTonINR}/MT), but Scenario B delivers +{Math.abs(deltas.recoveryDeltaMT).toLocaleString()} MT higher gross volume to close the monthly shortfall faster.
              </span>
            ) : deltas.recoveryDeltaMT >= 0 && deltas.costDeltaINR > 0 ? (
              <span>
                <strong>Trade-Off Identified:</strong> Scenario A recovers +{Math.abs(deltas.recoveryDeltaMT).toLocaleString()} MT more manganese (+{deltas.recoveryPctDelta}%), but requires ₹{formatLakhs(Math.abs(deltas.costDeltaINR))} Lakhs additional OPEX. Choose Scenario A if monthly target compliance is the statutory priority.
              </span>
            ) : (
              <span>
                <strong>Scenario B ({scenarioB.shortName})</strong> delivers superior economics, yielding higher recovery and lower unit operational costs compared to Scenario A.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
