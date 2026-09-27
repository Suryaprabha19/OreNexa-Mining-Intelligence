import React, { useState } from "react";
import { MoilMine } from "../types/mining";
import {
  X,
  PlayCircle,
  Sparkles,
  Sliders,
  CloudRain,
  Truck,
  Flame,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

interface ScenarioSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mine: MoilMine;
}

export const ScenarioSimulatorModal: React.FC<ScenarioSimulatorModalProps> = ({
  isOpen,
  onClose,
  mine,
}) => {
  if (!isOpen) return null;

  // Simulator state parameters
  const [rainfallMm, setRainfallMm] = useState<number>(mine.satelliteIndicators.rainfall24hMm || 45);
  const [equipmentAvailabilityPct, setEquipmentAvailabilityPct] = useState<number>(75);
  const [blastingRestrictionPct, setBlastingRestrictionPct] = useState<number>(30);
  const [stockpileBufferMT, setStockpileBufferMT] = useState<number>(6000);
  const [isSimulatingAi, setIsSimulatingAi] = useState<boolean>(false);
  const [aiSimulationOutput, setAiSimulationOutput] = useState<any>(null);

  // Dynamic reactive simulation calculations
  const baseMonthlyPlan = mine.monthlyTargetMT;
  const weatherPenalty = rainfallMm > 60 ? (rainfallMm - 60) * 80 : 0;
  const equipmentPenalty = ((100 - equipmentAvailabilityPct) / 100) * (baseMonthlyPlan * 0.4);
  const blastingPenalty = (blastingRestrictionPct / 100) * (baseMonthlyPlan * 0.25);
  const rawSimulatedShortfall = Math.round(weatherPenalty + equipmentPenalty + blastingPenalty);
  const mitigatedShortfall = Math.max(0, rawSimulatedShortfall - Math.round(stockpileBufferMT * 0.8));
  const simulatedOutput = Math.max(0, baseMonthlyPlan - mitigatedShortfall);
  const shortfallDelta = simulatedOutput - baseMonthlyPlan;
  const haulCycleTime = +(18 + (rainfallMm / 10) * 1.5).toFixed(1);

  const handleRunAiSimulation = async () => {
    setIsSimulatingAi(true);
    try {
      const res = await fetch("/api/gemini/simulate-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mineName: mine.name,
          scenarioName: "Dynamic What-If Operational Stress Test",
          weatherSeverity: rainfallMm > 70 ? "Extreme" : rainfallMm > 40 ? "High" : "Moderate",
          equipmentAvailabilityPct,
          blastingRestrictionPct,
          blendingStockpileAvailableMT: stockpileBufferMT,
        }),
      });
      const data = await res.json();
      if (data && data.data) {
        setAiSimulationOutput(data.data);
      }
    } catch (err) {
      console.error("AI simulation failed:", err);
    } finally {
      setIsSimulatingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">
                WHAT-IF DIGITAL TWIN OPERATIONAL SCENARIO SIMULATOR
              </h2>
              <p className="text-xs text-slate-400">
                Stress-testing production constraints and testing contingency responses for {mine.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Rainfall Slider */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <CloudRain className="w-4 h-4 text-sky-400" />
                  Space Radar Rainfall Severity
                </span>
                <span className="font-mono font-bold text-cyan-400 text-sm">
                  {rainfallMm} mm / 24h
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                value={rainfallMm}
                onChange={(e) => setRainfallMm(+e.target.value)}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0mm (Dry)</span>
                <span>50mm (Monsoon)</span>
                <span>150mm (Severe Flooding)</span>
              </div>
            </div>

            {/* 2. HEMM Availability Slider */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-amber-400" />
                  HEMM Fleet Availability
                </span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {equipmentAvailabilityPct}%
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={equipmentAvailabilityPct}
                onChange={(e) => setEquipmentAvailabilityPct(+e.target.value)}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>40% (Multiple Breakdown)</span>
                <span>75% (Nominal)</span>
                <span>100% (Full Availability)</span>
              </div>
            </div>

            {/* 3. Blasting Delay Slider */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-400" />
                  Blasting Restriction / Delay Factor
                </span>
                <span className="font-mono font-bold text-rose-400 text-sm">
                  {blastingRestrictionPct}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="70"
                value={blastingRestrictionPct}
                onChange={(e) => setBlastingRestrictionPct(+e.target.value)}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0% (On Schedule)</span>
                <span>35% (Vibration Delay)</span>
                <span>70% (Severe Delay)</span>
              </div>
            </div>

            {/* 4. Surge Stockpile Buffer Slider */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Covered High-Grade Surge Stockpile
                </span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {stockpileBufferMT.toLocaleString()} MT
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="15000"
                step="500"
                value={stockpileBufferMT}
                onChange={(e) => setStockpileBufferMT(+e.target.value)}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0 MT (Depleted)</span>
                <span>6,000 MT (Standard Buffer)</span>
                <span>15,000 MT (Max Silo)</span>
              </div>
            </div>
          </div>

          {/* Instant Simulation Outcome Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400">Simulated Monthly Output</span>
              <div className="text-2xl font-bold font-display text-white mt-1">
                {simulatedOutput.toLocaleString()} MT
              </div>
              <span className="text-[11px] text-slate-500">
                Target: {baseMonthlyPlan.toLocaleString()} MT
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400">Projected Shortfall Delta</span>
              <div
                className={`text-2xl font-bold font-display mt-1 ${
                  shortfallDelta < 0 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {shortfallDelta < 0 ? `${shortfallDelta.toLocaleString()} MT` : "+0 MT (On Target)"}
              </div>
              <span className="text-[11px] text-slate-500">
                Buffer Mitigated: -{Math.round(stockpileBufferMT * 0.8).toLocaleString()} MT
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400">Dumper Haul Cycle Time</span>
              <div className="text-2xl font-bold font-display text-amber-400 mt-1">
                {haulCycleTime} mins
              </div>
              <span className="text-[11px] text-slate-500">
                Nominal: 18 mins (+{(haulCycleTime - 18).toFixed(1)} mins rain lag)
              </span>
            </div>
          </div>

          {/* AI Simulation Button */}
          <div className="flex justify-center">
            <button
              onClick={handleRunAiSimulation}
              disabled={isSimulatingAi}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-600 via-indigo-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-950/50 flex items-center gap-2 transition"
            >
              <Sparkles className={`w-4 h-4 ${isSimulatingAi ? "animate-spin" : ""}`} />
              <span>
                {isSimulatingAi
                  ? "Gemini AI Running Digital Twin Model..."
                  : "Generate AI Digital Twin Mitigation Playbook"}
              </span>
            </button>
          </div>

          {/* AI Simulation Output Display */}
          {aiSimulationOutput && (
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/80 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-900/60 mb-3">
                <div className="flex items-center gap-2 text-indigo-300 font-bold">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>GEMINI DIGITAL TWIN SIMULATION INSIGHT:</span>
                </div>
                <span className="font-mono text-cyan-400 font-bold">
                  Impact Severity: {aiSimulationOutput.scenarioImpactScore}/100
                </span>
              </div>
              <p className="text-slate-200 leading-relaxed mb-3">
                {aiSimulationOutput.simulationKeyInsight}
              </p>

              <div className="text-[11px] font-bold text-slate-300 mb-2">
                RECOMMENDED OPERATIONAL PLAYBOOK:
              </div>
              <div className="space-y-2">
                {aiSimulationOutput.optimalCorrectivePlaybook?.map((step: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-slate-900 border border-indigo-900/40 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {step.stepNumber || idx + 1}
                      </span>
                      <span>{step.action}</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 text-[11px] shrink-0 ml-2">
                      +{step.impactRecoveredMT} MT
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
