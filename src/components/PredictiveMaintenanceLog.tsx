import React, { useState, useMemo } from "react";
import { MoilMine, PredictiveMaintenanceRecord } from "../types/mining";
import { generatePredictiveMaintenanceLog } from "../utils/predictiveMaintenance";
import {
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Calendar,
  Gauge,
  Package,
  ShieldCheck,
  Truck,
  Plus,
  ArrowUpRight,
  Filter,
  Check,
} from "lucide-react";

interface PredictiveMaintenanceLogProps {
  mine: MoilMine;
}

export const PredictiveMaintenanceLog: React.FC<PredictiveMaintenanceLogProps> = ({
  mine,
}) => {
  const initialLog = useMemo(() => generatePredictiveMaintenanceLog(mine), [mine]);
  const [logItems, setLogItems] = useState<PredictiveMaintenanceRecord[]>(initialLog);
  const [filterUrgency, setFilterUrgency] = useState<"ALL" | "OVERDUE" | "CRITICAL_SOON" | "SCHEDULED" | "HEALTHY">("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [servicedEquipmentIds, setServicedEquipmentIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync with mine change
  React.useEffect(() => {
    setLogItems(generatePredictiveMaintenanceLog(mine));
    setServicedEquipmentIds(new Set());
  }, [mine]);

  // Handle Mark Service Complete
  const handleCompleteService = (eqId: string) => {
    setServicedEquipmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(eqId)) {
        next.delete(eqId);
        setToastMessage(`Service status reset for ${eqId}`);
      } else {
        next.add(eqId);
        setToastMessage(`PM Service Completed & Logged for ${eqId}! Engine counter reset to cycle baseline.`);
      }
      return next;
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Simulate Engine Hours +15h
  const handleAdvanceEngineHours = () => {
    setLogItems((prev) =>
      prev.map((item) => {
        const newHours = item.currentEngineHours + 15;
        const newRemaining = item.nextServiceHours - newHours;
        let newUrgency: PredictiveMaintenanceRecord["urgency"] = item.urgency;
        if (newRemaining <= 0) newUrgency = "OVERDUE";
        else if (newRemaining <= 25) newUrgency = "CRITICAL_SOON";
        else if (newRemaining <= 75) newUrgency = "SCHEDULED";
        else newUrgency = "HEALTHY";

        return {
          ...item,
          currentEngineHours: newHours,
          hoursRemaining: newRemaining,
          urgency: newUrgency,
          wearPercentage: Math.min(100, item.wearPercentage + 3),
        };
      })
    );
    setToastMessage("Shift hours incremented (+15 hrs added to telemetry CAN-bus). Service schedules updated.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Summary Metrics
  const { overdueCount, criticalCount, scheduledCount, healthyCount, avgWear } = useMemo(() => {
    let overdue = 0;
    let critical = 0;
    let scheduled = 0;
    let healthy = 0;
    let totalWear = 0;

    logItems.forEach((item) => {
      const isServiced = servicedEquipmentIds.has(item.equipmentId);
      if (isServiced) {
        healthy++;
      } else if (item.urgency === "OVERDUE") {
        overdue++;
      } else if (item.urgency === "CRITICAL_SOON") {
        critical++;
      } else if (item.urgency === "SCHEDULED") {
        scheduled++;
      } else {
        healthy++;
      }
      totalWear += item.wearPercentage;
    });

    return {
      overdueCount: overdue,
      criticalCount: critical,
      scheduledCount: scheduled,
      healthyCount: healthy,
      avgWear: logItems.length > 0 ? Math.round(totalWear / logItems.length) : 0,
    };
  }, [logItems, servicedEquipmentIds]);

  // Filtered List
  const filteredList = useMemo(() => {
    return logItems.filter((item) => {
      const isServiced = servicedEquipmentIds.has(item.equipmentId);
      const effectiveUrgency = isServiced ? "HEALTHY" : item.urgency;

      if (filterUrgency !== "ALL" && effectiveUrgency !== filterUrgency) {
        return false;
      }
      if (filterType !== "ALL" && item.equipmentType !== filterType) {
        return false;
      }
      return true;
    });
  }, [logItems, filterUrgency, filterType, servicedEquipmentIds]);

  // Unique equipment types for dropdown
  const uniqueTypes = useMemo(() => {
    const set = new Set(logItems.map((i) => i.equipmentType));
    return Array.from(set);
  }, [logItems]);

  return (
    <div id="predictive-maintenance-log-panel" className="space-y-3.5 font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-blue-950/80 border border-blue-600/80 text-blue-200 px-3 py-2 rounded text-xs flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span>{toastMessage}</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">TELEMETRY SYNCED</span>
        </div>
      )}

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div className="bg-[#0f172a] border border-slate-800 rounded p-2.5 flex items-center gap-2.5">
          <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Overdue (0h)</div>
            <div className="text-base font-bold font-mono text-red-400 leading-tight">
              {overdueCount} Units
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded p-2.5 flex items-center gap-2.5">
          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Due &lt;25h</div>
            <div className="text-base font-bold font-mono text-amber-400 leading-tight">
              {criticalCount} Units
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded p-2.5 flex items-center gap-2.5">
          <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Scheduled (25-75h)</div>
            <div className="text-base font-bold font-mono text-blue-400 leading-tight">
              {scheduledCount} Units
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded p-2.5 flex items-center gap-2.5">
          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Healthy (&gt;75h)</div>
            <div className="text-base font-bold font-mono text-emerald-400 leading-tight">
              {healthyCount} Units
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded p-2.5 flex items-center gap-2.5 col-span-2 sm:col-span-1">
          <div className="p-2 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Fleet Mean Wear</div>
            <div className="text-base font-bold font-mono text-purple-300 leading-tight">
              {avgWear}% Cycle
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Actions */}
      <div className="bg-[#0f172a] border border-slate-800 rounded p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Severity Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterUrgency("ALL")}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition border ${
              filterUrgency === "ALL"
                ? "bg-slate-800 text-white border-slate-600"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            All Critical Fleet ({logItems.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterUrgency("OVERDUE")}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 border ${
              filterUrgency === "OVERDUE"
                ? "bg-red-950 text-red-300 border-red-600"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-red-300"
            }`}
          >
            <AlertOctagon className="w-3 h-3 text-red-400" />
            <span>Overdue ({overdueCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterUrgency("CRITICAL_SOON")}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 border ${
              filterUrgency === "CRITICAL_SOON"
                ? "bg-amber-950 text-amber-300 border-amber-600"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-amber-300"
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>&lt;25h Critical ({criticalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterUrgency("SCHEDULED")}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition border ${
              filterUrgency === "SCHEDULED"
                ? "bg-blue-950 text-blue-300 border-blue-600"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-blue-300"
            }`}
          >
            Scheduled ({scheduledCount})
          </button>
        </div>

        {/* Machine Type Filter & Telemetry Advancement */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded text-[11px]">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              aria-label="Filter equipment by type"
              className="bg-transparent text-slate-300 focus:outline-none border-none pr-1"
            >
              <option value="ALL" className="bg-slate-900">All Equipment Types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t} className="bg-slate-900">
                  {t}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleAdvanceEngineHours}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Simulate 15 operational hours across fleet to test predictive thresholds"
          >
            <Plus className="w-3 h-3 text-cyan-400" />
            <span>+15h Shift Simulation</span>
          </button>
        </div>
      </div>

      {/* Main Service Intervals Grid */}
      <div className="space-y-2.5">
        {filteredList.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded p-6 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <span>No equipment services matching the selected filters.</span>
          </div>
        ) : (
          filteredList.map((item) => {
            const isServiced = servicedEquipmentIds.has(item.equipmentId);
            const effectiveUrgency = isServiced ? "HEALTHY" : item.urgency;
            const isOverdue = effectiveUrgency === "OVERDUE";
            const isCritical = effectiveUrgency === "CRITICAL_SOON";

            return (
              <div
                key={item.equipmentId}
                className={`rounded border transition-all duration-200 p-3 sm:p-3.5 ${
                  isOverdue
                    ? "bg-red-950/20 border-red-800/80 hover:border-red-600"
                    : isCritical
                    ? "bg-amber-950/20 border-amber-800/80 hover:border-amber-600"
                    : "bg-[#0f172a] border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left Column: Machine Details, Engine Hours & Service Tier */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-xs sm:text-sm">
                        {item.equipmentName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                        {item.equipmentId}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        {item.serviceTier}
                      </span>

                      <span
                        className={`px-2 py-0.2 rounded text-[9px] font-bold font-mono border ${
                          isServiced
                            ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                            : isOverdue
                            ? "bg-red-950 text-red-300 border-red-700 animate-pulse"
                            : isCritical
                            ? "bg-amber-950 text-amber-300 border-amber-700"
                            : "bg-slate-900 text-slate-300 border-slate-700"
                        }`}
                      >
                        {isServiced
                          ? "SERVICE COMPLETED & VERIFIED"
                          : isOverdue
                          ? "SERVICE OVERDUE - HALT UNIT"
                          : isCritical
                          ? `DUE IN ${item.hoursRemaining} ENGINE HOURS`
                          : `SCHEDULED: ${item.hoursRemaining}H REMAINING`}
                      </span>
                    </div>

                    {/* Engine Hours Progress Bar */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>
                          Current Engine Telematics:{" "}
                          <strong className="text-slate-200">
                            {item.currentEngineHours.toLocaleString()} hrs
                          </strong>
                        </span>
                        <span>
                          Target Interval:{" "}
                          <strong className="text-cyan-400">
                            {item.nextServiceHours.toLocaleString()} hrs
                          </strong>{" "}
                          ({item.hoursRemaining > 0 ? `${item.hoursRemaining}h to go` : `${Math.abs(item.hoursRemaining)}h overdue`})
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isOverdue
                              ? "bg-red-500"
                              : isCritical
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${Math.min(item.wearPercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Service Description Scope */}
                    <div className="mt-2 text-xs text-slate-300 leading-relaxed">
                      <strong className="text-slate-400">Service Scope:</strong> {item.serviceDescription}
                    </div>

                    {/* Mandatory DGMS Check & Spares Kit */}
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80 text-slate-300 flex items-start gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-amber-400 uppercase text-[9px] block">
                            Mandatory DGMS Safety Inspection:
                          </span>
                          <span className="text-[10px]">{item.mandatoryDgmsCheck}</span>
                        </div>
                      </div>

                      <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80 text-slate-300 flex items-start gap-1.5">
                        <Package className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-cyan-400 uppercase text-[9px] block">
                            Required Parts / Consumables Kit:
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {item.recommendedParts.join(" • ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Downtime Estimation & Log Completion */}
                  <div className="lg:w-48 flex flex-row lg:flex-col justify-between items-center lg:items-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    <div className="text-left lg:text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        Planned Downtime
                      </div>
                      <div className="text-sm font-bold font-mono text-slate-200">
                        ~{item.estimatedDowntimeHours} Hours
                      </div>
                      <div className="text-[9px] text-slate-500">{item.assignedTeam}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCompleteService(item.equipmentId)}
                      className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition shadow-sm w-full lg:w-auto justify-center ${
                        isServiced
                          ? "bg-emerald-900/40 text-emerald-300 border border-emerald-600 hover:bg-emerald-900/60"
                          : isOverdue
                          ? "bg-red-600 hover:bg-red-500 text-white"
                          : isCritical
                          ? "bg-amber-600 hover:bg-amber-500 text-white"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      }`}
                    >
                      {isServiced ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Service Done</span>
                        </>
                      ) : (
                        <>
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Log PM Service</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
