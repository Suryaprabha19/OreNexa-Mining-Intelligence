import React, { useState } from "react";
import { CorrectiveActionItem, MoilMine, ShortfallPredictionResult, SimulatedScenarioOption } from "../types/mining";
import { ScenarioSideBySideComparator } from "./ScenarioSideBySideComparator";
import {
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
  Calendar,
  Flame,
  Truck,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Scale,
  LayoutGrid,
  ArrowLeftRight,
} from "lucide-react";

interface CorrectiveActionsPanelProps {
  mine: MoilMine;
  actions: CorrectiveActionItem[];
  onApplyAction: (actionId: string) => void;
  onRefreshAiActions: () => void;
  isAiRefreshing: boolean;
  predictionResult?: ShortfallPredictionResult;
  onAdoptScenario?: (scenario: SimulatedScenarioOption) => void;
}

export const CorrectiveActionsPanel: React.FC<CorrectiveActionsPanelProps> = ({
  mine,
  actions,
  onApplyAction,
  onRefreshAiActions,
  isAiRefreshing,
  predictionResult,
  onAdoptScenario,
}) => {
  const [activeTab, setActiveTab] = useState<"actions_grid" | "scenario_comparator">("scenario_comparator");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const categoryIcons = {
    MINE_SCHEDULE: <Calendar className="w-4 h-4 text-cyan-400" />,
    BLASTING_OPTIMIZATION: <Flame className="w-4 h-4 text-orange-400" />,
    EQUIPMENT_REDEPLOYMENT: <Truck className="w-4 h-4 text-amber-400" />,
    GRADE_BLENDING: <Layers className="w-4 h-4 text-emerald-400" />,
  };

  const categoryLabels = {
    MINE_SCHEDULE: "Mine Scheduling",
    BLASTING_OPTIMIZATION: "Blasting Optimization",
    EQUIPMENT_REDEPLOYMENT: "Equipment Re-deployment",
    GRADE_BLENDING: "Grade Blending & Stockpile",
  };

  const filteredActions =
    activeFilter === "ALL"
      ? actions
      : actions.filter((a) => a.category === activeFilter);

  const totalRecoverableMT = actions.reduce(
    (acc, curr) => (curr.status !== "Completed" ? acc + curr.recoverableMT : acc),
    0
  );

  const appliedCount = actions.filter((a) => a.status === "Completed").length;

  return (
    <div
      id="section-corrective-actions-engine"
      className="bg-[#0f172a] border border-slate-800 rounded p-3.5 shadow-sm mb-4"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-tight font-sans">
              Recommended Corrective Actions & Shortfall Mitigation
            </h2>
            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/30 rounded">
              DECISION SUPPORT
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            Algorithmic and Gemini AI dynamic operational playbooks to overcome production constraints
          </p>
        </div>

        {/* View Switcher: Actions Playbook vs Side-by-Side Scenario Comparator */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800">
            <button
              id="btn-tab-scenario-comparator"
              onClick={() => setActiveTab("scenario_comparator")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold transition ${
                activeTab === "scenario_comparator"
                  ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-cyan-300" />
              <span>Compare Scenarios Side-by-Side</span>
              <span className="px-1 py-0.2 rounded text-[9px] bg-cyan-400/20 text-cyan-300 font-mono font-bold">
                2-WAY
              </span>
            </button>

            <button
              id="btn-tab-actions-grid"
              onClick={() => setActiveTab("actions_grid")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold transition ${
                activeTab === "actions_grid"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Action Playbooks</span>
              <span className="px-1 py-0.2 rounded text-[9px] bg-slate-800 text-slate-300 font-mono">
                {actions.length}
              </span>
            </button>
          </div>

          <button
            id="btn-refresh-ai-corrective-actions"
            onClick={onRefreshAiActions}
            disabled={isAiRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition"
          >
            <Sparkles className={`w-3 h-3 text-blue-400 ${isAiRefreshing ? "animate-spin" : ""}`} />
            <span>{isAiRefreshing ? "GENERATING..." : "RE-OPTIMIZE PLAN"}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "scenario_comparator" ? (
        <div className="mt-3">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded p-2.5 mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white text-[11px]">
                  Side-by-Side Operational Scenario Simulator:
                </span>{" "}
                <span className="text-slate-400 text-[11px]">
                  Select two mitigation strategies below to compare projected manganese recovery (tonnage, % Mn grade) against operational expenditure (₹ Lakhs, ₹/MT, fuel, overtime).
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400">Current Mine Deficit: </span>
              <span className="text-xs font-bold text-red-400 font-mono">
                {predictionResult?.projectedShortfallMT.toLocaleString() || "4,900"} MT
              </span>
            </div>
          </div>

          <ScenarioSideBySideComparator
            mine={mine}
            predictionResult={predictionResult}
            onAdoptScenario={onAdoptScenario || (() => {})}
          />
        </div>
      ) : (
        <>
          {/* Quick banner to switch to comparator */}
          <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-purple-950/40 border border-blue-900/40 rounded p-2 mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[11px]">
              <Scale className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300">
                Want to evaluate trade-offs between two strategies before executing?
              </span>
            </div>
            <button
              onClick={() => setActiveTab("scenario_comparator")}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600/30 hover:bg-blue-600/50 text-cyan-300 border border-blue-500/40 transition"
            >
              <span>Compare Scenarios Side-by-Side</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-1 py-2 border-b border-slate-800 text-xs">
            <span className="text-slate-500 text-[10px] font-bold uppercase mr-1">
              Filter:
            </span>
            {["ALL", "MINE_SCHEDULE", "BLASTING_OPTIMIZATION", "EQUIPMENT_REDEPLOYMENT", "GRADE_BLENDING"].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                    activeFilter === cat
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {cat === "ALL"
                    ? `All Actions (${actions.length})`
                    : categoryLabels[cat as keyof typeof categoryLabels] || cat}
                </button>
              )
            )}
          </div>

          {/* Action Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            {filteredActions.map((action) => {
              const isCompleted = action.status === "Completed";
              return (
                <div
                  key={action.id}
                  className={`rounded p-3 border transition-all flex flex-col justify-between ${
                    isCompleted
                      ? "bg-green-950/20 border-green-800/60 opacity-90"
                      : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    {/* Category & Priority Badge */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                        {categoryIcons[action.category]}
                        <span>{categoryLabels[action.category]}</span>
                      </div>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                          action.priority === "P1-IMMEDIATE"
                            ? "bg-red-950/80 text-red-400 border-red-800"
                            : action.priority === "P2-SHORT-TERM"
                            ? "bg-amber-950/80 text-amber-400 border-amber-800"
                            : "bg-blue-950/80 text-blue-400 border-blue-800"
                        }`}
                      >
                        {action.priority}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xs font-bold text-white mb-1.5 leading-snug">
                      {action.actionTitle}
                    </h3>

                    {/* Implementation Steps */}
                    <div className="space-y-1 mb-2.5">
                      {action.implementationSteps.map((step, idx) => (
                        <div
                          key={idx}
                          className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-tight"
                        >
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-800 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5 text-blue-400">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                        <Clock className="w-3 h-3" />
                        <span>ETA: {action.timelineHours} hrs</span>
                      </div>
                      <div className="font-mono font-bold text-green-400 text-[11px] flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>+{action.recoverableMT.toLocaleString()} MT Ore</span>
                      </div>
                    </div>

                    {/* Implement Button */}
                    <button
                      id={`btn-apply-action-${action.id}`}
                      onClick={() => onApplyAction(action.id)}
                      className={`w-full py-1.5 px-2.5 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${
                        isCompleted
                          ? "bg-green-900/40 text-green-300 border border-green-700/60 cursor-default"
                          : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm border border-blue-500"
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                          <span>DISPATCHED TO LOG</span>
                        </>
                      ) : (
                        <>
                          <span>EXECUTE ACTION</span>
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
