import React from "react";
import { MoilMine } from "../types/mining";
import { SatelliteRiskAlert, SatelliteRiskAssessment } from "../utils/satelliteRiskMonitor";
import {
  Sparkles,
  MapPin,
  PlayCircle,
  FileText,
  Video,
  MessageSquare,
  Globe,
  AlertTriangle,
  Radio,
  X,
  Activity,
} from "lucide-react";

interface HeaderProps {
  mines: MoilMine[];
  selectedMine: MoilMine;
  onSelectMine: (mine: MoilMine) => void;
  onOpenSimulator: () => void;
  onOpenReport: () => void;
  onTriggerAiDiagnosis: () => void;
  isAiDiagnosing: boolean;
  onOpenVeoAnimator: () => void;
  onToggleChatbot: () => void;
  isChatbotOpen: boolean;
  satelliteAlert: SatelliteRiskAlert | null;
  satelliteAssessment: SatelliteRiskAssessment;
  onOpenSatelliteAlertDetails: () => void;
  onAcknowledgeSatelliteAlert: () => void;
  onSimulateRiskShift: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mines,
  selectedMine,
  onSelectMine,
  onOpenSimulator,
  onOpenReport,
  onTriggerAiDiagnosis,
  isAiDiagnosing,
  onOpenVeoAnimator,
  onToggleChatbot,
  isChatbotOpen,
  satelliteAlert,
  satelliteAssessment,
  onOpenSatelliteAlertDetails,
  onAcknowledgeSatelliteAlert,
  onSimulateRiskShift,
}) => {
  const hasActiveAlert = Boolean(satelliteAlert && !satelliteAlert.acknowledged);

  return (
    <header className="flex flex-col border-b border-slate-800 bg-[#0f172a] sticky top-0 z-30 shadow-md">
      {/* High Density Command Header */}
      <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-2.5 gap-3 border-b border-slate-800/60">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-sm shadow-sm">
            M
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold tracking-tight uppercase text-white font-sans">
                MOIL Limited | Strategic AI Command
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold bg-blue-900/40 text-blue-300 border border-blue-700/50 rounded">
                SEC-L3
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Problem ID: 26009 • Manganese Reserve Analysis System
            </p>
          </div>
        </div>

        {/* Telemetry Status, Satellite Sync, Risk Indicator & Coordinates */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[11px] font-medium text-slate-400">
              Satellite Sync: <span className="text-slate-200">Active (Cartosat-3 / Sentinel-1)</span>
            </span>
          </div>

          {/* Real-Time Satellite Risk Pill in Header (Subtle Alert when Shifted) */}
          {hasActiveAlert ? (
            <button
              id="header-satellite-risk-alert-pill"
              onClick={onOpenSatelliteAlertDetails}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/60 text-[10px] text-amber-200 hover:bg-amber-500/25 cursor-pointer transition shadow-sm animate-pulse"
              title="Unexpected satellite risk elevation detected: Click to inspect telemetry"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-bold text-white uppercase tracking-tight">
                RISK SHIFT:
              </span>
              <span className="font-mono font-bold text-amber-300">Moderate → HIGH</span>
              <span className="text-[9px] px-1 py-0.2 bg-amber-400/20 text-amber-300 rounded font-semibold ml-0.5">
                ALERT
              </span>
            </button>
          ) : (
            <button
              id="header-satellite-risk-status-pill"
              onClick={onOpenSatelliteAlertDetails}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-700/70 text-[10px] text-slate-300 hover:border-slate-500 cursor-pointer transition"
              title="Click to view real-time satellite risk telemetry"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  satelliteAssessment.currentLevel === "Critical"
                    ? "bg-red-500 animate-ping"
                    : satelliteAssessment.currentLevel === "High"
                    ? "bg-amber-400 animate-pulse"
                    : "bg-emerald-400"
                }`}
              ></span>
              <span className="text-slate-400 font-semibold">Sat-Risk:</span>
              <span
                className={`font-mono font-bold ${
                  satelliteAssessment.currentLevel === "Critical"
                    ? "text-red-400"
                    : satelliteAssessment.currentLevel === "High"
                    ? "text-amber-300"
                    : "text-emerald-300"
                }`}
              >
                {satelliteAssessment.currentLevel.toUpperCase()} ({satelliteAssessment.score})
              </span>
            </button>
          )}

          {/* Coordinate Telemetry Badge */}
          <div className="hidden md:flex text-[11px] font-mono bg-blue-900/30 text-blue-400 px-2.5 py-1 rounded border border-blue-800/50">
            {selectedMine.coordinates.lat.toFixed(4)}° N, {selectedMine.coordinates.lng.toFixed(4)}° E
          </div>
        </div>
      </div>

      {/* High Density Sub-Bar: Mine Selector & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-2 bg-[#0a0f18] gap-3">
        {/* Mine Selector Dropdown */}
        <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 rounded px-2.5 py-1">
          <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Mine Unit:</span>
          <select
            id="mine-selector-dropdown"
            value={selectedMine.id}
            onChange={(e) => {
              const found = mines.find((m) => m.id === e.target.value);
              if (found) onSelectMine(found);
            }}
            className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer py-0.5"
          >
            {mines.map((mine) => (
              <option key={mine.id} value={mine.id} className="bg-slate-900 text-slate-200">
                {mine.name} ({mine.district}, {mine.state}) • {mine.type}
              </option>
            ))}
          </select>
        </div>

        {/* High Density Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Simulation Toggle to test Moderate -> High Risk Shift */}
          <button
            id="btn-simulate-risk-shift"
            onClick={onSimulateRiskShift}
            className="flex items-center gap-1 px-2 py-1.5 rounded text-[10px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 transition"
            title="Test real-time satellite risk shift (Moderate → High)"
          >
            <Radio className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">SIMULATE SHIFT</span>
          </button>

          {/* Veo 3.1 Fast Video Generation Button */}
          <button
            id="btn-open-veo-animator"
            onClick={onOpenVeoAnimator}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-bold bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 hover:text-white border border-indigo-700/60 transition-colors shadow-sm"
            title="Animate drone/satellite photos into video using Veo 3.1"
          >
            <Video className="w-3.5 h-3.5 text-indigo-400" />
            <span>VEO VIDEO</span>
            <span className="text-[9px] font-mono px-1 py-0.2 bg-indigo-800/80 text-indigo-200 rounded">
              3.1
            </span>
          </button>

          {/* Gemini Chatbot & Search Grounding Button */}
          <button
            id="btn-toggle-gemini-chatbot"
            onClick={onToggleChatbot}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-bold transition-colors border shadow-sm ${
              isChatbotOpen
                ? "bg-cyan-600 text-white border-cyan-400"
                : "bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 hover:text-white border-cyan-700/60"
            }`}
            title="Multi-turn Geological AI Copilot with Google Search Grounding"
          >
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>COPILOT CHAT</span>
            <Globe className="w-3 h-3 text-cyan-400/80" />
          </button>

          <button
            id="btn-ai-shortfall-diagnosis"
            onClick={onTriggerAiDiagnosis}
            disabled={isAiDiagnosing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold shadow-sm transition-colors border ${
              isAiDiagnosing
                ? "bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white border-blue-500"
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiDiagnosing ? "animate-spin text-blue-200" : ""}`} />
            <span>{isAiDiagnosing ? "DIAGNOSING..." : "AI DIAGNOSIS"}</span>
          </button>

          <button
            id="btn-open-scenario-simulator"
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>SIMULATOR</span>
          </button>

          <button
            id="btn-open-executive-report"
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Export MOIL Executive Shift Report"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>REPORT</span>
          </button>
        </div>
      </div>

      {/* Subtle Real-Time Alert Bar if Risk Shifted from Moderate to High */}
      {hasActiveAlert && (
        <div
          id="header-subtle-risk-alert-bar"
          className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-t border-b border-amber-500/40 px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in duration-300"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div className="text-[11px] text-slate-200">
              <span className="font-bold text-amber-300 uppercase text-[10px] tracking-wide mr-1">
                Real-Time Satellite Alert:
              </span>
              <span>
                Risk assessment shifted unexpectedly from <strong className="text-amber-300">Moderate</strong> to{" "}
                <strong className="text-red-400">High</strong> for {selectedMine.name}.
              </span>
              <span className="text-slate-400 text-[10px] hidden md:inline ml-1">
                ({satelliteAlert?.reason})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-inspect-satellite-alert"
              onClick={onOpenSatelliteAlertDetails}
              className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition"
            >
              Inspect Telemetry
            </button>
            <button
              id="btn-dismiss-satellite-alert"
              onClick={onAcknowledgeSatelliteAlert}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Acknowledge Alert"
            >
              <X className="w-3 h-3" />
              <span>Acknowledge</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};


