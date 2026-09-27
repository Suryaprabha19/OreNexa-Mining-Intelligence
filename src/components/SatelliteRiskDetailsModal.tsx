import React from "react";
import { SatelliteRiskAlert, SatelliteRiskAssessment } from "../utils/satelliteRiskMonitor";
import { MoilMine } from "../types/mining";
import {
  AlertTriangle,
  X,
  Satellite,
  ShieldAlert,
  Droplets,
  CloudRain,
  Thermometer,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Activity,
} from "lucide-react";

interface SatelliteRiskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: SatelliteRiskAlert | null;
  assessment: SatelliteRiskAssessment;
  mine: MoilMine;
  onAcknowledge: () => void;
  onNavigateToMap?: () => void;
}

export const SatelliteRiskDetailsModal: React.FC<SatelliteRiskDetailsModalProps> = ({
  isOpen,
  onClose,
  alert,
  assessment,
  mine,
  onAcknowledge,
  onNavigateToMap,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        id="modal-satellite-risk-details"
        className="bg-[#0f172a] border border-amber-500/50 rounded-lg max-w-2xl w-full shadow-2xl overflow-hidden font-sans text-xs"
      >
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 px-4 py-3 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                  Satellite Risk Elevation Telemetry
                </h3>
                <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
                  DGMS MMR REG 106 ALERT
                </span>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>{mine.name}</span>
                <span>•</span>
                <span className="font-mono text-slate-300">{assessment.source}</span>
                <span>•</span>
                <Clock className="w-3 h-3 text-slate-500" />
                <span className="font-mono">{alert?.timestamp || assessment.timestamp}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shift Summary Banner */}
        <div className="bg-amber-950/30 border-b border-amber-500/20 p-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Prior State:</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                MODERATE
              </span>
            </div>
            <span className="text-slate-500 font-bold">➔</span>
            <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1 rounded border border-red-500/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase">New State:</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                HIGH RISK
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Calculated Risk Index:</span>
            <span className="text-sm font-mono font-bold text-red-400">
              {assessment.score} / 100
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5 max-h-[68vh] overflow-y-auto">
          {/* Executive Summary */}
          <div className="bg-slate-900/80 border border-slate-800 rounded p-3">
            <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Assessment Summary & Ground Cause</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {alert?.reason || assessment.summary}
            </p>
          </div>

          {/* Factor Breakdown Grid */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span>Telemetry Factors Contributing to Risk Shift</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {assessment.factors.map((factor, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded border flex flex-col justify-between ${
                    factor.status === "Severe"
                      ? "bg-red-950/20 border-red-800/60"
                      : factor.status === "Elevated"
                      ? "bg-amber-950/20 border-amber-800/60"
                      : "bg-slate-900 border-slate-800"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-400 font-semibold truncate">
                        {factor.name}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1 py-0.2 rounded border ${
                          factor.status === "Severe"
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : factor.status === "Elevated"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : "bg-green-500/20 text-green-400 border-green-500/30"
                        }`}
                      >
                        {factor.status}
                      </span>
                    </div>
                    <div className="text-base font-mono font-bold text-white mb-1.5">
                      {factor.value}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {factor.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Sensor Readings */}
          <div className="bg-slate-900/50 border border-slate-800 rounded p-2.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">
              Raw Multi-Spectral Satellite Indicators
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[9px] text-slate-500 flex items-center justify-center gap-1">
                  <CloudRain className="w-2.5 h-2.5 text-sky-400" />
                  <span>24h Rainfall</span>
                </div>
                <div className="text-xs font-mono font-bold text-sky-300 mt-0.5">
                  {alert?.indicators.rainfallMm ?? mine.satelliteIndicators.rainfall24hMm} mm
                </div>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[9px] text-slate-500 flex items-center justify-center gap-1">
                  <Droplets className="w-2.5 h-2.5 text-blue-400" />
                  <span>Soil Moisture</span>
                </div>
                <div className="text-xs font-mono font-bold text-blue-300 mt-0.5">
                  {alert
                    ? `${(alert.indicators.soilMoistureIndex * 100).toFixed(0)}% (${alert.indicators.soilMoistureStatus})`
                    : `${(mine.satelliteIndicators.soilMoistureIndex * 100).toFixed(0)}% (${mine.satelliteIndicators.soilMoistureStatus})`}
                </div>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[9px] text-slate-500 flex items-center justify-center gap-1">
                  <Thermometer className="w-2.5 h-2.5 text-amber-400" />
                  <span>Thermal Delta</span>
                </div>
                <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">
                  {alert?.indicators.lstDelta ?? mine.satelliteIndicators.lstDelta > 0 ? "+" : ""}
                  {alert?.indicators.lstDelta ?? mine.satelliteIndicators.lstDelta}°C
                </div>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[9px] text-slate-500 flex items-center justify-center gap-1">
                  <Satellite className="w-2.5 h-2.5 text-purple-400" />
                  <span>SWIR Ratio</span>
                </div>
                <div className="text-xs font-mono font-bold text-purple-300 mt-0.5">
                  {mine.satelliteIndicators.swirBandRatio}
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Operational Mitigation */}
          <div className="bg-blue-950/30 border border-blue-800/40 rounded p-2.5 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white text-[11px]">
                Recommended Safety Mitigation:
              </span>
              <p className="text-[10px] text-cyan-200 mt-0.5">
                {assessment.recommendedAction}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-900/90 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-[10px] text-slate-400 font-mono">
              Live Satellite Polling Interval: 20s
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToMap && (
              <button
                onClick={() => {
                  onNavigateToMap();
                  onClose();
                }}
                className="px-3 py-1.5 rounded text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1"
              >
                <span>View Satellite Map</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            )}

            <button
              id="btn-acknowledge-satellite-alert"
              onClick={() => {
                onAcknowledge();
                onClose();
              }}
              className="px-3 py-1.5 rounded text-[11px] font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Acknowledge Alert</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
