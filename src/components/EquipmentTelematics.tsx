import React, { useState } from "react";
import { MoilMine } from "../types/mining";
import { DgmsComplianceAlerts } from "./DgmsComplianceAlerts";
import { PredictiveMaintenanceLog } from "./PredictiveMaintenanceLog";
import {
  Truck,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gauge,
  Activity,
  HardHat,
  CloudRain,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Gavel,
  Wrench,
  Calendar,
} from "lucide-react";

interface EquipmentTelematicsProps {
  mine: MoilMine;
}

export const EquipmentTelematics: React.FC<EquipmentTelematicsProps> = ({ mine }) => {
  const [activeTab, setActiveTab] = useState<"operations" | "maintenance">("operations");

  return (
    <div id="section-equipment-and-blasting-constraints" className="mb-4 space-y-3.5">
      {/* 1. DGMS Statutory Compliance Alerts & Violation Flags Module */}
      <DgmsComplianceAlerts mine={mine} />

      {/* Telematics Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <button
            id="tab-equipment-operations"
            onClick={() => setActiveTab("operations")}
            className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "operations"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>HEMM Fleet & Blasting Telematics</span>
          </button>
          <button
            id="tab-predictive-maintenance-log"
            onClick={() => setActiveTab("maintenance")}
            className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "maintenance"
                ? "bg-amber-600 text-white shadow-sm ring-1 ring-amber-400"
                : "bg-slate-900 text-amber-400 hover:text-amber-200 border border-slate-800"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Predictive Maintenance Log</span>
            <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 font-mono font-bold">
              Engine Hours
            </span>
          </button>
        </div>
        <div className="text-[10px] text-slate-500 hidden sm:flex items-center gap-1.5 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Statutory Intervals: DGMS Circ 02/2020</span>
        </div>
      </div>

      {activeTab === "maintenance" ? (
        /* Predictive Maintenance Log Tab View */
        <PredictiveMaintenanceLog mine={mine} />
      ) : (
        /* 2. Real-Time Telematics Grids: HEMM Fleet (7 Cols) & Blasting Schedule (5 Cols) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* HEMM Equipment Fleet Telematics (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0f172a] border border-slate-800 rounded p-3.5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-blue-400" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-tight font-sans">
                    HEMM Fleet Telematics & Availability
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Real-time operational status of shovels, dumpers, drills, and winders
                  </p>
                </div>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                IOT TELEMETRY
              </span>
            </div>

            {/* Equipment Cards List */}
            <div className="mt-3 space-y-2">
              {mine.equipmentFleet.map((eq) => {
                const isOk = eq.status === "Operational";
                const isDegraded = eq.status === "Degraded";
                const isBreakdown = eq.status === "Breakdown";

                // Determine DGMS status badge per equipment
                let dgmsBadgeText = "DGMS Circ 02/20: AVA & Radar OK";
                let dgmsBadgeSeverity: "ok" | "warn" | "crit" = "ok";

                if (eq.type === "Hydraulic Shovel") {
                  if (isBreakdown) {
                    dgmsBadgeText = "DGMS MMR Reg 181: Hydraulic Fire Hazard - Grounded";
                    dgmsBadgeSeverity = "crit";
                  } else {
                    dgmsBadgeText = "DGMS Tech Circ 04/13: AFDSS 140 Bar Charged";
                    dgmsBadgeSeverity = "ok";
                  }
                } else if (eq.type === "LHD (Underground)") {
                  if (eq.telemetryAlert) {
                    dgmsBadgeText = "DGMS Tech Circ 04/13: Hydraulic Temp +72°C Warning";
                    dgmsBadgeSeverity = "warn";
                  } else {
                    dgmsBadgeText = "DGMS CMR Reg 172: Stope Mucking Certified";
                    dgmsBadgeSeverity = "ok";
                  }
                } else if (eq.type === "Dump Truck") {
                  if (isDegraded && eq.telemetryAlert) {
                    dgmsBadgeText = "DGMS MMR Reg 98(3): Ramp Slip & Retarder Overheat";
                    dgmsBadgeSeverity = "crit";
                  } else {
                    dgmsBadgeText = "DGMS Circ 02/20: AVA 110dB & Rear Radar Active";
                    dgmsBadgeSeverity = "ok";
                  }
                } else if (eq.type === "Winder Hoist") {
                  dgmsBadgeText = "DGMS MMR Reg 84: Daily Overwind Trip & Brake Interlock OK";
                  dgmsBadgeSeverity = "ok";
                } else if (eq.type === "Blast Hole Drill") {
                  dgmsBadgeText = "DGMS Tech Circ 01/10: Wet Drilling Dust Suppression Active";
                  dgmsBadgeSeverity = "ok";
                }

                return (
                  <div
                    key={eq.id}
                    className="bg-slate-900/50 p-2.5 rounded border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-slate-700 transition"
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div
                        className={`p-1.5 rounded shrink-0 ${
                          isOk
                            ? "bg-green-500/10 text-green-400 border border-green-500/30"
                            : isDegraded
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : "bg-red-500/10 text-red-400 border border-red-500/30"
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-[11px]">{eq.name}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                              isOk
                                ? "bg-green-950/60 text-green-400 border-green-800"
                                : isDegraded
                                ? "bg-amber-950/60 text-amber-400 border-amber-800"
                                : "bg-red-950/60 text-red-400 border-red-800"
                            }`}
                          >
                            {eq.status}
                          </span>

                          {/* DGMS Statutory Compliance Badge */}
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold flex items-center gap-1 border ${
                              dgmsBadgeSeverity === "crit"
                                ? "bg-red-950/80 text-red-300 border-red-700 animate-pulse"
                                : dgmsBadgeSeverity === "warn"
                                ? "bg-amber-950/80 text-amber-300 border-amber-700"
                                : "bg-emerald-950/60 text-emerald-300 border-emerald-800/80"
                            }`}
                          >
                            <Gavel className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate max-w-[210px]">{dgmsBadgeText}</span>
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {eq.assignedBenchOrLevel} • {eq.fuelOrPowerStatus}
                        </div>
                        {eq.telemetryAlert && (
                          <div className="mt-1 text-[10px] text-red-400 flex items-center gap-1 font-medium bg-red-950/20 px-1.5 py-0.5 rounded border border-red-900/40">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>{eq.telemetryAlert}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Availability Gauge & MTBF */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-800 shrink-0">
                      <div className="font-mono text-xs font-bold text-slate-200">
                        {eq.availabilityPct}% Avail
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        MTBF: {eq.mtbfHours}h • MTTR: {eq.mttrHours}h
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Blasting Schedule & PPV Vibration Safety (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0f172a] border border-slate-800 rounded p-3.5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-tight font-sans">
                    Blasting Schedule & PPV Vibration
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    DGMS 5.0 mm/s ground vibration limits & delays
                  </p>
                </div>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
                SAFETY REGULATION
              </span>
            </div>

            {/* Blasting Records */}
            <div className="mt-3 space-y-2">
              {mine.blastingSchedule.map((blast) => {
                const isExceeding = blast.ppvVibrationMmSec > blast.ppvThresholdMmSec;
                return (
                  <div
                    key={blast.id}
                    className={`p-2.5 rounded border text-xs transition ${
                      isExceeding
                        ? "bg-red-950/20 border-red-800/80"
                        : "bg-slate-900/50 border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-[11px]">{blast.location}</span>
                        {isExceeding ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-red-950 text-red-300 border border-red-700 flex items-center gap-1">
                            <ShieldAlert className="w-2.5 h-2.5" />
                            <span>DGMS VIOLATION</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>DGMS COMPLIANT</span>
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                          blast.status === "Cleared"
                            ? "bg-green-950/60 text-green-400 border-green-800"
                            : "bg-red-950/60 text-red-400 border-red-800"
                        }`}
                      >
                        {blast.status}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 mb-1.5">
                      {blast.plannedDate} • {blast.blastHolesCount} Holes ({blast.explosiveType})
                    </div>

                    {/* PPV Vibration vs DGMS Limit */}
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 mb-1.5">
                      <div className="flex justify-between text-[10px] mb-1 font-mono">
                        <span className="text-slate-400">Peak Particle Velocity (PPV):</span>
                        <span
                          className={`font-bold ${
                            isExceeding ? "text-red-400" : "text-green-400"
                          }`}
                        >
                          {blast.ppvVibrationMmSec} mm/s (DGMS Limit: {blast.ppvThresholdMmSec} mm/s)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded h-1 overflow-hidden">
                        <div
                          className={`h-full ${
                            isExceeding ? "bg-red-500" : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min((blast.ppvVibrationMmSec / 8) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {blast.delayReason && (
                      <div className="text-[10px] text-amber-400 flex items-start gap-1.5 bg-amber-950/20 p-1.5 rounded border border-amber-900/40">
                        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                        <span>{blast.delayReason}</span>
                      </div>
                    )}

                    <div className="mt-1.5 text-[9px] text-slate-400 flex justify-between font-mono">
                      <span>Target: {blast.targetMuckpileTons.toLocaleString()} MT</span>
                      <span>Powder Factor: {blast.powderFactorKgPerTon} kg/t</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Space Weather Advisory */}
          <div className="mt-3 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-0.5 text-[11px]">
              <CloudRain className="w-3.5 h-3.5" />
              <span>Space Radar Weather & Inundation Safety:</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-snug">
              {mine.satelliteIndicators.precipitationForecast72h}
            </p>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
