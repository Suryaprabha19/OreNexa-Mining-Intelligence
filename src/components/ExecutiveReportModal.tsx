import React from "react";
import { MoilMine, ShortfallPredictionResult } from "../types/mining";
import { X, Printer, Download, FileText, CheckCircle2, ShieldAlert } from "lucide-react";

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mine: MoilMine;
  predictionResult?: ShortfallPredictionResult;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  mine,
  predictionResult,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-slate-200">
        {/* Modal Toolbar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white font-display">
              EXECUTIVE COMPLIANCE REPORT • MINISTRY OF STEEL
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document */}
        <div className="p-8 space-y-6 bg-slate-950 text-xs font-sans">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-700 pb-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-amber-400 font-bold">
                MINISTRY OF STEEL • GOVERNMENT OF INDIA
              </div>
              <div className="text-lg font-bold font-display text-white mt-0.5">
                MOIL LIMITED — MANGANESE ORE PLANNING DIVISION
              </div>
              <div className="text-[11px] text-slate-400">
                Problem Statement ID 26009: AI/ML & Space Technology Reserve & Shortfall Forecaster
              </div>
            </div>
            <div className="text-right text-[11px] font-mono text-slate-400">
              <div>Date: {new Date().toLocaleDateString("en-IN")}</div>
              <div>Classification: CONFIDENTIAL / INTERNAL</div>
            </div>
          </div>

          {/* Mine Profile */}
          <div className="grid grid-cols-3 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px]">MINING UNIT</span>
              <span className="font-bold text-white text-sm">{mine.name}</span>
              <span className="text-slate-400 block text-[10px]">{mine.district}, {mine.state} ({mine.type})</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ESTIMATED TOTAL RESERVES</span>
              <span className="font-bold text-cyan-400 text-sm">{mine.estimatedTotalReservesMT} Million Tonnes</span>
              <span className="text-slate-400 block text-[10px]">Proved: {mine.provedReservesMT} MT • {mine.avgGradeMnPct}% Mn Grade</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">MONTHLY TARGET</span>
              <span className="font-bold text-white text-sm">{mine.monthlyTargetMT.toLocaleString()} MT</span>
              <span className="text-slate-400 block text-[10px]">Current MTD: {mine.currentActualMT.toLocaleString()} MT</span>
            </div>
          </div>

          {/* Space Remote Sensing & Reserve Summary */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">
              1. Space Technology & Satellite Geophysics Synthesis
            </h3>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Multi-spectral imagery (Cartosat-3 / Sentinel-2 MSI) confirms distinct SWIR absorption band ratios ({mine.satelliteIndicators.swirBandRatio}) correlating with high-grade {mine.satelliteIndicators.spectralSignature} mineralization. Land Surface Temperature (LST) anomaly exhibits +{mine.satelliteIndicators.lstDelta}°C thermal inertia across the Sausar strike. Sub-surface Bouguer residual gravity anomalies delineate {mine.estimatedTotalReservesMT} MT of recoverable manganese ore reserves compliant with UNFC-111 standards.
            </p>
          </div>

          {/* Production Shortfall Risk Analysis */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">
              2. Production Shortfall Risk & Bottleneck Analysis
            </h3>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 mb-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Projected Month-End Gap:</span>
                <span className="font-mono font-bold text-rose-400 text-sm">
                  -{predictionResult?.projectedShortfallMT.toLocaleString() || "5,800"} Metric Tonnes ({predictionResult?.riskLevel || "HIGH RISK"})
                </span>
              </div>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {predictionResult?.executiveSummary ||
                "Production constraints triggered by 24h precipitation causing pit floor haul road slush, compounded by HEMM excavator repairs and DGMS ground vibration limits on secondary quarry blasting."}
            </p>
          </div>

          {/* Corrective Actions Matrix */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">
              3. Approved Corrective Action Playbook
            </h3>
            <div className="space-y-2">
              {(predictionResult?.correctiveActions || []).map((action, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded bg-slate-900 border border-slate-800 flex items-start justify-between text-[11px]"
                >
                  <div>
                    <span className="font-bold text-white block">
                      {idx + 1}. {action.actionTitle} ({action.priority})
                    </span>
                    <span className="text-slate-400">{action.implementationSteps.join(" ")}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 shrink-0 ml-4">
                    +{action.recoverableMT.toLocaleString()} MT
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-6 border-t border-slate-800 grid grid-cols-2 text-center text-[10px] text-slate-400">
            <div>
              <div className="font-semibold text-slate-300 mb-6">CHIEF GENERAL MANAGER (MINING / PLANNING)</div>
              <div>MOIL Limited Corporate Office, Nagpur</div>
            </div>
            <div>
              <div className="font-semibold text-slate-300 mb-6">DIRECTOR (PRODUCTION & PLANNING)</div>
              <div>Ministry of Steel, Govt. of India</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
