import React from "react";
import { BoreholeRecord, MoilMine } from "../types/mining";
import { X, Layers, Database, Compass, CheckCircle2, Split } from "lucide-react";

interface BoreholeDetailModalProps {
  borehole: BoreholeRecord | null;
  mine: MoilMine;
  onClose: () => void;
  onOpenCrossSection?: (borehole: BoreholeRecord) => void;
}

export const BoreholeDetailModal: React.FC<BoreholeDetailModalProps> = ({
  borehole,
  mine,
  onClose,
  onOpenCrossSection,
}) => {
  if (!borehole) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-display">
                  {borehole.name}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {borehole.unfcStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {mine.name} • Depth: {borehole.depthMeters} meters
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Chemical Assay Cards */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Manganese (Mn)</span>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
                {borehole.mnGradePct}%
              </div>
              <span className="text-[10px] text-slate-500">High Grade</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Iron (Fe)</span>
              <div className="text-xl font-bold font-mono text-slate-300 mt-0.5">
                {borehole.feGradePct}%
              </div>
              <span className="text-[10px] text-slate-500">Low Impurity</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Phosphorus (P)</span>
              <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                {borehole.phosphorusPct}%
              </div>
              <span className="text-[10px] text-slate-500">Steel Compliant</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Silica (SiO2)</span>
              <div className="text-xl font-bold font-mono text-slate-300 mt-0.5">
                {borehole.silicaPct}%
              </div>
              <span className="text-[10px] text-slate-500">Gondite Gangue</span>
            </div>
          </div>

          {/* Stratigraphic Drill Core Profile */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              Sub-Surface Stratigraphy & Lithology (0 - {borehole.depthMeters}m)
            </h3>

            {/* Visual Core Bar */}
            <div className="w-full flex rounded-lg overflow-hidden h-6 mb-3 border border-slate-700">
              {borehole.strata.map((stratum, idx) => {
                const span = stratum.depthTo - stratum.depthFrom;
                const pct = (span / borehole.depthMeters) * 100;
                return (
                  <div
                    key={idx}
                    style={{ width: `${pct}%`, backgroundColor: stratum.color }}
                    className="h-full flex items-center justify-center text-[10px] font-bold text-slate-950 truncate px-1"
                    title={`${stratum.lithology}: ${stratum.depthFrom}-${stratum.depthTo}m (${stratum.gradeMn}% Mn)`}
                  >
                    {span > 25 ? `${stratum.gradeMn}% Mn` : ""}
                  </div>
                );
              })}
            </div>

            {/* Stratum Breakdown Table */}
            <div className="space-y-2 text-xs">
              {borehole.strata.map((stratum, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: stratum.color }}
                    ></span>
                    <div>
                      <div className="font-semibold text-white">{stratum.lithology}</div>
                      <div className="text-[10px] text-slate-400">
                        Depth: {stratum.depthFrom}m to {stratum.depthTo}m (Interval: {stratum.depthTo - stratum.depthFrom}m)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-cyan-400 text-sm">
                      {stratum.gradeMn}% Mn
                    </div>
                    <div className="text-[10px] text-slate-500">Core Assay</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          {onOpenCrossSection && (
            <div className="pt-2 flex justify-end">
              <button
                id="btn-open-cross-section-from-borehole"
                onClick={() => {
                  onClose();
                  onOpenCrossSection(borehole);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
              >
                <Split className="w-4 h-4" />
                <span>Open 2D Ore Body Cross-Section Profile</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
