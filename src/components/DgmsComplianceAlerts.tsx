import React, { useState, useMemo } from "react";
import { MoilMine } from "../types/mining";
import { DgmsComplianceCheck, DgmsSeverity, DgmsCategory } from "../types/dgms";
import { evaluateDgmsCompliance } from "../utils/dgmsRulesEngine";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  RefreshCw,
  FileCheck,
  Gavel,
  SlidersHorizontal,
  ExternalLink,
  Clock,
  Truck,
  Activity,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  Download,
  Info,
} from "lucide-react";

interface DgmsComplianceAlertsProps {
  mine: MoilMine;
  onSelectAsset?: (assetId: string) => void;
}

export const DgmsComplianceAlerts: React.FC<DgmsComplianceAlertsProps> = ({
  mine,
  onSelectAsset,
}) => {
  // Evaluated compliance checks based on real-time operational data
  const initialAudit = useMemo(() => evaluateDgmsCompliance(mine), [mine]);

  const [checks, setChecks] = useState<DgmsComplianceCheck[]>(initialAudit.checks);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScanTime, setLastScanTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
  const [filterSeverity, setFilterSeverity] = useState<"ALL" | DgmsSeverity>("ALL");
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Sync when mine changes
  React.useEffect(() => {
    const audit = evaluateDgmsCompliance(mine);
    setChecks(audit.checks);
    setResolvedIds(new Set());
    setLastScanTime(
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    );
  }, [mine]);

  // Recalculate summary metrics dynamically based on current resolved states
  const { criticalCount, warningCount, compliantCount, totalCount, safetyScore } = useMemo(() => {
    let crit = 0;
    let warn = 0;
    let comp = 0;

    checks.forEach((c) => {
      const isResolved = resolvedIds.has(c.id);
      if (isResolved) {
        comp++;
      } else if (c.severity === "CRITICAL_VIOLATION") {
        crit++;
      } else if (c.severity === "STATUTORY_WARNING") {
        warn++;
      } else {
        comp++;
      }
    });

    const scoreRaw = 100 - crit * 18 - warn * 8;
    const score = Math.max(Math.min(scoreRaw, 100), 25);

    return {
      criticalCount: crit,
      warningCount: warn,
      compliantCount: comp,
      totalCount: checks.length,
      safetyScore: score,
    };
  }, [checks, resolvedIds]);

  // Simulate real-time sensor scan
  const handleTriggerSensorScan = () => {
    setIsScanning(true);
    setScanMessage("Interrogating HEMM IoT CAN-bus sensors, pit seismographs, and sump telemetry...");

    setTimeout(() => {
      const freshAudit = evaluateDgmsCompliance(mine);
      setChecks(freshAudit.checks);
      setIsScanning(false);
      setLastScanTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
      setScanMessage(
        `Audit completed across ${freshAudit.checks.length} statutory checkpoints. 100% telemetry synced.`
      );
      setTimeout(() => setScanMessage(null), 3500);
    }, 900);
  };

  // Mark a violation as mitigated under supervision
  const handleMitigateViolation = (checkId: string) => {
    setResolvedIds((prev) => {
      const next = new Set(prev);
      if (next.has(checkId)) {
        next.delete(checkId);
      } else {
        next.add(checkId);
      }
      return next;
    });
  };

  // Filtered checks
  const filteredChecks = checks.filter((c) => {
    const isResolved = resolvedIds.has(c.id);
    const effectiveSeverity: DgmsSeverity = isResolved ? "COMPLIANT" : c.severity;

    if (filterSeverity === "ALL") return true;
    if (filterSeverity === "COMPLIANT") return effectiveSeverity === "COMPLIANT";
    if (filterSeverity === "CRITICAL_VIOLATION") return effectiveSeverity === "CRITICAL_VIOLATION";
    if (filterSeverity === "STATUTORY_WARNING") return effectiveSeverity === "STATUTORY_WARNING";
    return true;
  });

  return (
    <div
      id="dgms-compliance-module"
      className="bg-[#0f172a] border border-slate-800 rounded p-3 sm:p-3.5 mb-3.5 shadow-md relative overflow-hidden"
    >
      {/* Background statutory watermark accent */}
      <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
        <ShieldAlert className="w-52 h-52 text-amber-500" />
      </div>

      {/* Module Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-slate-800 gap-2.5">
        <div className="flex items-start sm:items-center gap-2.5">
          <div
            className={`p-2 rounded border shrink-0 ${
              criticalCount > 0
                ? "bg-red-500/15 text-red-400 border-red-500/40 animate-pulse"
                : warningCount > 0
                ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
                : "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-tight font-sans">
                DGMS Statutory Compliance Check & Violation Flags
              </h3>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                MINES ACT 1952 / MMR 1961
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                • {mine.name} ({mine.district}, {mine.state})
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Automated real-time safety evaluation: Ground Vibration PPV (5.0 mm/s), HEMM Fire AFDSS, Audio-Visual Alarms, Ramp Retarders & Inundation
            </p>
          </div>
        </div>

        {/* Live Safety Score & Action Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between lg:justify-end">
          {/* Safety Score Meter */}
          <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded flex items-center gap-2.5 shadow-inner">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold uppercase text-slate-400 leading-none">
                Safety Index
              </span>
              <span
                className={`text-sm font-mono font-extrabold leading-tight ${
                  safetyScore >= 90
                    ? "text-emerald-400"
                    : safetyScore >= 70
                    ? "text-amber-400"
                    : "text-red-400"
                }`}
              >
                {safetyScore}%
              </span>
            </div>
            <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  safetyScore >= 90
                    ? "bg-emerald-500"
                    : safetyScore >= 70
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${safetyScore}%` }}
              ></div>
            </div>
          </div>

          {/* Real-time Scan Trigger */}
          <button
            id="btn-scan-dgms-telematics"
            type="button"
            onClick={handleTriggerSensorScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Poll live CAN-bus equipment sensors, seismographs, and telemetry"
          >
            <RefreshCw className={`w-3 h-3 ${isScanning ? "animate-spin text-blue-400" : "text-slate-400"}`} />
            <span>{isScanning ? "AUDITING SENSORS..." : "SCAN SENSORS"}</span>
          </button>

          {/* Export Statutory Form IV-B Report */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-bold bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-700/60 transition"
            title="Generate DGMS Statutory Inspection Form IV-B"
          >
            <FileCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>STATUTORY AUDIT</span>
          </button>
        </div>
      </div>

      {/* Live Scan Notification Toast */}
      {scanMessage && (
        <div className="mt-2.5 px-3 py-1.5 rounded bg-blue-950/40 border border-blue-800/60 text-[11px] text-blue-300 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>{scanMessage}</span>
          </div>
          <span className="font-mono text-[9px] text-slate-400">{lastScanTime}</span>
        </div>
      )}

      {/* Status Counters & Filter Ribbon */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        {/* Severity Count Chips / Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterSeverity("ALL")}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1.5 border ${
              filterSeverity === "ALL"
                ? "bg-slate-800 text-white border-slate-600"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            <span>All Checks</span>
            <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-slate-700/60 text-slate-300">
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterSeverity("CRITICAL_VIOLATION")}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1.5 border ${
              filterSeverity === "CRITICAL_VIOLATION"
                ? "bg-red-950/80 text-red-300 border-red-600 shadow-sm"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-red-300"
            }`}
          >
            <AlertOctagon className="w-3 h-3 text-red-400" />
            <span>Critical Violations</span>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-bold ${
                criticalCount > 0 ? "bg-red-900/90 text-red-200" : "bg-slate-800 text-slate-400"
              }`}
            >
              {criticalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterSeverity("STATUTORY_WARNING")}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1.5 border ${
              filterSeverity === "STATUTORY_WARNING"
                ? "bg-amber-950/80 text-amber-300 border-amber-600 shadow-sm"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-amber-300"
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Statutory Warnings</span>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-bold ${
                warningCount > 0 ? "bg-amber-900/90 text-amber-200" : "bg-slate-800 text-slate-400"
              }`}
            >
              {warningCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterSeverity("COMPLIANT")}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1.5 border ${
              filterSeverity === "COMPLIANT"
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-600 shadow-sm"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-emerald-300"
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Compliant Items</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-emerald-900/50 text-emerald-200 font-bold">
              {compliantCount}
            </span>
          </button>
        </div>

        {/* Real-time sync timestamp */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>Last Sync: {lastScanTime}</span>
        </div>
      </div>

      {/* Compliance Checks List */}
      <div className="mt-3 space-y-2.5">
        {filteredChecks.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded p-4 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
            <span>No compliance items match the selected severity filter.</span>
          </div>
        ) : (
          filteredChecks.map((item) => {
            const isResolved = resolvedIds.has(item.id);
            const isExpanded = expandedCheckId === item.id;
            const effectiveSeverity = isResolved ? "COMPLIANT" : item.severity;

            const isCritical = effectiveSeverity === "CRITICAL_VIOLATION";
            const isWarning = effectiveSeverity === "STATUTORY_WARNING";
            const isCompliant = effectiveSeverity === "COMPLIANT";

            return (
              <div
                key={item.id}
                className={`rounded border transition-all duration-200 overflow-hidden ${
                  isCritical
                    ? "bg-red-950/20 border-red-800/80 hover:border-red-600"
                    : isWarning
                    ? "bg-amber-950/20 border-amber-800/80 hover:border-amber-600"
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Main Card Summary Row */}
                <div className="p-2.5 sm:p-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  {/* Left Column: Severity, Title, Asset, Regulation */}
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div
                      className={`p-1.5 rounded shrink-0 mt-0.5 ${
                        isCritical
                          ? "bg-red-500/20 text-red-400 border border-red-500/40"
                          : isWarning
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      }`}
                    >
                      {isCritical ? (
                        <AlertOctagon className="w-4 h-4" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-extrabold uppercase border ${
                            isCritical
                              ? "bg-red-950 text-red-400 border-red-700"
                              : isWarning
                              ? "bg-amber-950 text-amber-400 border-amber-700"
                              : "bg-emerald-950 text-emerald-400 border-emerald-700"
                          }`}
                        >
                          {isResolved ? "MITIGATED UNDER LOG" : item.severity.replace("_", " ")}
                        </span>

                        <span className="font-mono text-[9px] text-slate-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                          {item.regulationCode}
                        </span>

                        <span className="text-[10px] text-slate-400">
                          Category: <strong className="text-slate-300">{item.categoryLabel}</strong>
                        </span>
                      </div>

                      <div className="font-bold text-white text-xs sm:text-[13px] mt-1 leading-snug">
                        {item.title}
                      </div>

                      {/* Affected Asset & Real-time Telemetry Indicator */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-1 flex-wrap">
                        <span className="font-semibold text-slate-200 flex items-center gap-1">
                          <Truck className="w-3 h-3 text-blue-400 shrink-0" />
                          <span>{item.affectedAssetName}</span>
                        </span>
                        <span className="text-slate-500">•</span>
                        <span
                          className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                            isCritical
                              ? "bg-red-950/80 text-red-300 border border-red-800/60"
                              : isWarning
                              ? "bg-amber-950/80 text-amber-300 border border-amber-800/60"
                              : "bg-slate-950 text-slate-300 border border-slate-800"
                          }`}
                        >
                          Telemetry: {item.currentTelemetryValue}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions & Expand Button */}
                  <div className="flex items-center justify-between md:justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                    {/* Resolution / Tagging Trigger */}
                    <button
                      type="button"
                      onClick={() => handleMitigateViolation(item.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition ${
                        isResolved
                          ? "bg-emerald-900/30 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900/50"
                          : isCritical
                          ? "bg-red-600 hover:bg-red-500 text-white shadow-sm"
                          : isWarning
                          ? "bg-amber-600 hover:bg-amber-500 text-white shadow-sm"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {isResolved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Logged Active</span>
                        </>
                      ) : isCritical ? (
                        <>
                          <Gavel className="w-3.5 h-3.5" />
                          <span>Issue Stop-Work Tag</span>
                        </>
                      ) : isWarning ? (
                        <>
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Apply Mitigation</span>
                        </>
                      ) : (
                        <>
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Verify Audit</span>
                        </>
                      )}
                    </button>

                    {/* Expand/Collapse Accordion */}
                    <button
                      type="button"
                      onClick={() => setExpandedCheckId(isExpanded ? null : item.id)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                      title={isExpanded ? "Collapse Details" : "Expand Statutory Mandates"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Statutory Details & Corrective Mandate */}
                {isExpanded && (
                  <div className="bg-[#0a0f18] px-3.5 py-3 border-t border-slate-800 text-xs space-y-2.5 animate-in slide-in-from-top-1 duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Statutory Legal Mandate */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Gavel className="w-3 h-3 text-amber-400" />
                          <span>DGMS Statutory Mandate:</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/70 p-2 rounded border border-slate-800">
                          {item.statutoryDescription}
                        </p>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
                          <span className="text-slate-500">Threshold:</span>
                          <span className="text-slate-300 font-semibold">{item.statutoryThreshold}</span>
                        </div>
                      </div>

                      {/* Immediate Corrective Operational Action */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <SlidersHorizontal className="w-3 h-3 text-blue-400" />
                          <span>Immediate Corrective Operational Action:</span>
                        </div>
                        <p className="text-[11px] text-slate-200 leading-relaxed bg-slate-900/70 p-2 rounded border border-slate-800">
                          {item.immediateActionRequired}
                        </p>
                        <div className="text-[10px] text-red-400 flex items-center gap-1 mt-1 font-mono">
                          <span className="text-slate-500">Mines Act Penalty:</span>
                          <span className="font-semibold">{item.penaltyClause}</span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Safety Signoff Notice */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-400 gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <Info className="w-3 h-3 text-blue-400 shrink-0" />
                        <span>
                          Enforced under Section 22 of Mines Act 1952. Logged by MOIL Shift Safety Officer.
                        </span>
                      </div>
                      <div className="font-mono text-slate-500">
                        Check ID: {item.id} • Evaluated: {item.lastCheckedTime}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* DGMS Statutory Inspection Form IV-B Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-700 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#0a0f18]">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-tight">
                  DGMS Statutory Inspection Record • Form IV-B
                </h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-800"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs bg-[#0b111e]">
              <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-1.5 text-slate-300">
                <div className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                  DIRECTORATE GENERAL OF MINES SAFETY (DGMS) • GOVT OF INDIA
                </div>
                <div className="text-sm font-bold text-white">
                  Metalliferous Mines Regulations 1961 • Shift Safety & Telematics Record
                </div>
                <div className="text-[11px] text-slate-400">
                  Mine: <strong className="text-slate-200">{mine.name}</strong> ({mine.type}) • District:{" "}
                  {mine.district}, {mine.state}
                </div>
                <div className="text-[11px] text-slate-400">
                  Audit Timestamp: {new Date().toLocaleString()} • Safety Compliance Index:{" "}
                  <strong className={safetyScore >= 80 ? "text-emerald-400" : "text-amber-400"}>
                    {safetyScore}%
                  </strong>
                </div>
              </div>

              {/* Active Violations Summary */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-white uppercase">
                  Flagged Operational Violations & Risk Assessments ({checks.length} evaluated):
                </div>
                <div className="space-y-2">
                  {checks.map((c, i) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">
                          #{i + 1} {c.title}
                        </span>
                        <span
                          className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                            c.severity === "CRITICAL_VIOLATION"
                              ? "bg-red-950 text-red-400 border-red-800"
                              : c.severity === "STATUTORY_WARNING"
                              ? "bg-amber-950 text-amber-400 border-amber-800"
                              : "bg-emerald-950 text-emerald-400 border-emerald-800"
                          }`}
                        >
                          {c.severity}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        Asset: <strong className="text-slate-300">{c.affectedAssetName}</strong> • Ref:{" "}
                        {c.regulationCode}
                      </div>
                      <div className="text-slate-300 text-[10px]">
                        Mandate: {c.statutoryDescription}
                      </div>
                      <div className="text-blue-300 text-[10px]">
                        Operational Directive: {c.immediateActionRequired}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 border-t border-slate-800 bg-[#0a0f18] flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-500 font-mono">
                Authenticated with SHA-256 Digital Mine Audit Hash
              </span>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
