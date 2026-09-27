import React from "react";
import { MoilMine } from "../types/mining";
import {
  Layers,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CloudRain,
  CheckCircle2,
  Activity,
  Satellite,
} from "lucide-react";

interface OverviewMetricsProps {
  mine: MoilMine;
  projectedShortfallMT: number;
  riskLevel: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  isAiDiagnosed?: boolean;
}

export const OverviewMetrics: React.FC<OverviewMetricsProps> = ({
  mine,
  projectedShortfallMT,
  riskLevel,
  isAiDiagnosed,
}) => {
  const mtdCompletionPct = Math.round(
    (mine.currentActualMT / mine.monthlyTargetMT) * 100
  );
  const activeEquipmentCount = mine.equipmentFleet.filter(
    (e) => e.status === "Operational"
  ).length;
  const totalEquipmentCount = mine.equipmentFleet.length;
  const fleetAvailabilityAvg = Math.round(
    mine.equipmentFleet.reduce((acc, curr) => acc + curr.availabilityPct, 0) /
      (totalEquipmentCount || 1)
  );

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {/* 1. TOTAL IDENTIFIED RESERVES */}
      <div
        id="card-identified-reserves"
        className="bg-slate-900/50 border border-slate-800 p-3 rounded"
      >
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
            Total Identified Reserves
          </h3>
          <span className="text-[9px] font-mono text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-800/40">
            {mine.avgGradeMnPct}% Mn Grade
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-mono font-bold text-blue-400">
            {mine.estimatedTotalReservesMT.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">MT (UNFC)</span>
        </div>
        <div className="mt-2 h-1 bg-slate-800 rounded overflow-hidden">
          <div
            className="h-full bg-blue-500"
            style={{ width: `${Math.min((mine.provedReservesMT / mine.estimatedTotalReservesMT) * 100, 100)}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between text-[9px] mt-2">
          <span className="text-green-400 font-medium">+4.2% Space Analysis</span>
          <span className="text-slate-500 font-mono">Proved: {mine.provedReservesMT} MT</span>
        </div>
      </div>

      {/* 2. PRODUCTION HEALTH / TARGET */}
      <div
        id="card-production-progress"
        className="bg-slate-900/50 border border-slate-800 p-3 rounded"
      >
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
            Production Health
          </h3>
          <span className="text-[10px] font-mono text-amber-400">
            {mtdCompletionPct}% MTD
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 mb-1.5">
          <span className="text-2xl font-mono font-bold text-slate-200">
            {(mine.currentActualMT / 1000).toFixed(1)}k
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            / {(mine.monthlyTargetMT / 1000).toFixed(1)}k MT Target
          </span>
        </div>
        {/* Segmented health blocks */}
        <div className="flex items-center gap-1 h-3">
          {[1, 2, 3, 4, 5, 6].map((idx) => {
            const stepPct = idx * 16.6;
            const filled = mtdCompletionPct >= stepPct;
            const isNearTarget = filled && idx >= 4;
            return (
              <div
                key={idx}
                className={`flex-1 rounded-xs h-full ${
                  filled
                    ? isNearTarget
                      ? "bg-green-500/80"
                      : "bg-blue-500/80"
                    : "bg-slate-800"
                }`}
              ></div>
            );
          })}
        </div>
        <p className="text-[9px] mt-2 text-slate-500">
          Target Status:{" "}
          <span className={mtdCompletionPct >= 75 ? "text-green-400 font-bold" : "text-amber-400 font-bold"}>
            {mtdCompletionPct >= 75 ? "ON TRACK" : "DEFICIT MITIGATION REQUIRED"}
          </span>
        </p>
      </div>

      {/* 3. SHORTFALL RISK FORECASTER */}
      <div
        id="card-shortfall-risk"
        className="bg-slate-900/50 border border-slate-800 p-3 rounded"
      >
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
            Shortfall Risk Monitor
          </h3>
          <span
            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
              riskLevel === "CRITICAL"
                ? "bg-red-950/80 text-red-400 border-red-800"
                : riskLevel === "HIGH"
                ? "bg-amber-950/80 text-amber-400 border-amber-800"
                : "bg-green-950/80 text-green-400 border-green-800"
            }`}
          >
            {riskLevel}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-mono font-bold text-red-400">
            -{projectedShortfallMT.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">MT Projected Gap</span>
        </div>
        <div className="mt-2 h-1 bg-slate-800 rounded overflow-hidden">
          <div
            className="h-full bg-red-500"
            style={{
              width: `${Math.min((projectedShortfallMT / mine.monthlyTargetMT) * 100 * 2.5, 100)}%`,
            }}
          ></div>
        </div>
        <div className="flex items-center justify-between text-[9px] mt-2">
          <span className="text-slate-400">
            {isAiDiagnosed ? "AI Model Grounded" : "Operational Engine"}
          </span>
          <span className="text-amber-400 font-bold">3 Actions Active</span>
        </div>
      </div>

      {/* 4. SPACE & FLEET TELEMATICS */}
      <div
        id="card-space-telematics"
        className="bg-slate-900/50 border border-slate-800 p-3 rounded"
      >
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
            Space & Fleet Inputs
          </h3>
          <span className="text-[9px] font-mono text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-800/40 flex items-center gap-1">
            <CloudRain className="w-2.5 h-2.5" />
            {mine.satelliteIndicators.rainfall24hMm}mm
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[9px] text-slate-500 uppercase">HEMM Avail</div>
            <div className="text-lg font-mono font-bold text-slate-200">
              {fleetAvailabilityAvg}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-slate-500 uppercase">SWIR Ratio</div>
            <div className="text-lg font-mono font-bold text-blue-400">
              {mine.satelliteIndicators.swirBandRatio}
            </div>
          </div>
        </div>
        <div className="mt-1 text-[9px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-1.5">
          <span>Soil: {mine.satelliteIndicators.soilMoistureStatus}</span>
          <span className="font-mono text-green-400">NDVI {mine.satelliteIndicators.ndvi}</span>
        </div>
      </div>
    </section>
  );
};

