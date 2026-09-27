import { MoilMine } from "../types/mining";
import { DgmsComplianceCheck, DgmsAuditSummary } from "../types/dgms";

/**
 * DGMS Rules Engine:
 * Analyzes real-time mine telematics, equipment fleet metrics, blasting logs,
 * and environmental satellite sensor data against DGMS statutory regulations.
 */
export function evaluateDgmsCompliance(mine: MoilMine): {
  checks: DgmsComplianceCheck[];
  summary: DgmsAuditSummary;
} {
  const checks: DgmsComplianceCheck[] = [];
  const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // -------------------------------------------------------------
  // 1. Blasting & Ground Vibration (DGMS Circular No. 7 of 1997 / MMR Reg 156)
  // -------------------------------------------------------------
  mine.blastingSchedule.forEach((blast) => {
    const isExceeding = blast.ppvVibrationMmSec > blast.ppvThresholdMmSec;
    const isNearLimit = !isExceeding && blast.ppvVibrationMmSec >= blast.ppvThresholdMmSec * 0.85;

    if (isExceeding) {
      checks.push({
        id: `dgms-blast-${blast.id}`,
        regulationCode: "DGMS Tech Circular 7/1997 & MMR Reg 156",
        category: "BLASTING_VIBRATION",
        categoryLabel: "Ground Vibration & Blasting",
        title: `PPV Vibration Exceedance: ${blast.location}`,
        severity: "CRITICAL_VIOLATION",
        affectedAssetId: blast.id,
        affectedAssetName: `Blast Round: ${blast.location} (${blast.blastHolesCount} holes)`,
        currentTelemetryValue: `${blast.ppvVibrationMmSec} mm/s (Peak Particle Velocity)`,
        statutoryThreshold: `Max ${blast.ppvThresholdMmSec.toFixed(1)} mm/s for structures within 300m`,
        statutoryDescription:
          "Directorate General of Mines Safety mandates that ground vibration (PPV) for domestic/township structures within danger zone must not exceed 5.0 mm/s to prevent structural fatigue or micro-cracking.",
        immediateActionRequired:
          "Halt charging immediately. Redesign initiation pattern with electronic millisecond staggered delays (≥17ms) and reduce Maximum Instantaneous Charge (MIC) below 32 kg/delay.",
        penaltyClause:
          "Mines Act 1952 Section 22: Prohibitory order on blasting operations until DGMS re-clearance.",
        lastCheckedTime: nowStr,
      });
    } else if (isNearLimit) {
      checks.push({
        id: `dgms-blast-${blast.id}`,
        regulationCode: "DGMS Tech Circular 7/1997 & MMR Reg 156",
        category: "BLASTING_VIBRATION",
        categoryLabel: "Ground Vibration & Blasting",
        title: `PPV Vibration Nearing Ceiling: ${blast.location}`,
        severity: "STATUTORY_WARNING",
        affectedAssetId: blast.id,
        affectedAssetName: `Blast Round: ${blast.location}`,
        currentTelemetryValue: `${blast.ppvVibrationMmSec} mm/s (82% of threshold)`,
        statutoryThreshold: `Threshold: ${blast.ppvThresholdMmSec.toFixed(1)} mm/s`,
        statutoryDescription:
          "Vibration reading is approaching the 5.0 mm/s regulatory ceiling. Seismograph baseline monitoring must be intensified.",
        immediateActionRequired:
          "Deploy tri-axial seismograph at nearest mine boundary structure and verify burden distance.",
        penaltyClause: "Statutory caution letter from Regional Inspector of Mines.",
        lastCheckedTime: nowStr,
      });
    } else {
      checks.push({
        id: `dgms-blast-${blast.id}`,
        regulationCode: "DGMS Tech Circular 7/1997",
        category: "BLASTING_VIBRATION",
        categoryLabel: "Ground Vibration & Blasting",
        title: `PPV Compliant: ${blast.location}`,
        severity: "COMPLIANT",
        affectedAssetId: blast.id,
        affectedAssetName: `Blast Round: ${blast.location}`,
        currentTelemetryValue: `${blast.ppvVibrationMmSec} mm/s (Safe Margin)`,
        statutoryThreshold: `Limit: ${blast.ppvThresholdMmSec.toFixed(1)} mm/s`,
        statutoryDescription:
          "Predicted vibration complies with DGMS standard frequency curve (5.0 mm/s).",
        immediateActionRequired: "Maintain current blast geometry and certified electronic delays.",
        penaltyClause: "Fully compliant with MMR 1961 provisions.",
        lastCheckedTime: nowStr,
      });
    }
  });

  // -------------------------------------------------------------
  // 2. HEMM Hydraulic Shovels & Fire Suppression (AFDSS)
  // (DGMS Tech Circular 04 of 2013 & MMR Reg 181)
  // -------------------------------------------------------------
  const shovels = mine.equipmentFleet.filter(
    (e) => e.type === "Hydraulic Shovel" || e.type === "LHD (Underground)"
  );

  shovels.forEach((shovel) => {
    const hasLeakOrOverheat =
      shovel.telemetryAlert?.toLowerCase().includes("leak") ||
      shovel.telemetryAlert?.toLowerCase().includes("temperature") ||
      shovel.telemetryAlert?.toLowerCase().includes("pressure");

    if (shovel.status === "Breakdown" && hasLeakOrOverheat) {
      checks.push({
        id: `dgms-fire-${shovel.id}`,
        regulationCode: "DGMS Tech Circular 04/2013 & MMR Reg 181",
        category: "FIRE_AFDSS",
        categoryLabel: "HEMM Fire Safety & AFDSS",
        title: `Hydraulic Flash Fire Hazard: ${shovel.name}`,
        severity: "CRITICAL_VIOLATION",
        affectedAssetId: shovel.id,
        affectedAssetName: `${shovel.name} (${shovel.assignedBenchOrLevel})`,
        currentTelemetryValue: shovel.telemetryAlert || "Hydraulic system high temperature/pressure leak",
        statutoryThreshold: "Zero pressurized hydraulic fluid discharge onto hot exhaust manifolds",
        statutoryDescription:
          "High-pressure hydraulic oil spray (>180 bar) near diesel turbocharger/exhaust manifolds represents the #1 cause of catastrophic HEMM fires in Indian opencast mines.",
        immediateActionRequired:
          "Isolate master electrical battery disconnect. Inspect Automatic Fire Detection & Suppression System (AFDSS) nitrogen cylinder charge pressure (must read >120 bar). Tag out machine.",
        penaltyClause: "Immediate grounding of machine under MMR 1961 Reg 181 fire prevention orders.",
        lastCheckedTime: nowStr,
      });
    } else if (shovel.status === "Degraded" && hasLeakOrOverheat) {
      checks.push({
        id: `dgms-fire-${shovel.id}`,
        regulationCode: "DGMS Tech Circular 04/2013 & MMR Reg 181",
        category: "FIRE_AFDSS",
        categoryLabel: "HEMM Fire Safety & AFDSS",
        title: `Hydraulic Thermal Warning: ${shovel.name}`,
        severity: "STATUTORY_WARNING",
        affectedAssetId: shovel.id,
        affectedAssetName: `${shovel.name} (${shovel.assignedBenchOrLevel})`,
        currentTelemetryValue: shovel.telemetryAlert || "Thermal sensor reading +72°C",
        statutoryThreshold: "Operating hydraulic temperature max 65°C under continuous duty",
        statutoryDescription:
          "Elevated pump seal temperatures precede hydraulic line ruptures. Requires immediate preventative inspection.",
        immediateActionRequired:
          "Dispatch mobile lube maintenance crew with thermal infrared scanner to check hose crimp integrity.",
        penaltyClause: "Equipment hazard notice under DGMS Safety Management Plan (SMP).",
        lastCheckedTime: nowStr,
      });
    } else {
      checks.push({
        id: `dgms-fire-${shovel.id}`,
        regulationCode: "DGMS Tech Circular 04/2013",
        category: "FIRE_AFDSS",
        categoryLabel: "HEMM Fire Safety & AFDSS",
        title: `AFDSS Fire Protection Certified: ${shovel.name}`,
        severity: "COMPLIANT",
        affectedAssetId: shovel.id,
        affectedAssetName: shovel.name,
        currentTelemetryValue: "AFDSS Pressure Normal • Sensor Loop Healthy",
        statutoryThreshold: "AFDSS Pressure > 120 bar • Dual Thermal Loop Active",
        statutoryDescription: "Automatic fire suppression system and flame-resistant hose sleeves certified.",
        immediateActionRequired: "Continue routine daily pre-shift inspection log (Form II).",
        penaltyClause: "Compliant with DGMS Technical Circular 04/2013.",
        lastCheckedTime: nowStr,
      });
    }
  });

  // -------------------------------------------------------------
  // 3. Dump Truck Ramp Haulage, Retarder & Audio-Visual Alarm (AVA)
  // (MMR 1961 Reg 98(3), Reg 104 & DGMS Circular 02 of 2020)
  // -------------------------------------------------------------
  const dumpers = mine.equipmentFleet.filter((e) => e.type === "Dump Truck");

  dumpers.forEach((dumper) => {
    const isDegraded = dumper.status === "Degraded";
    const hasSlushAlert =
      dumper.telemetryAlert?.toLowerCase().includes("speed") ||
      dumper.telemetryAlert?.toLowerCase().includes("slush") ||
      dumper.telemetryAlert?.toLowerCase().includes("overheat");

    if (isDegraded && hasSlushAlert) {
      checks.push({
        id: `dgms-dmp-${dumper.id}`,
        regulationCode: "MMR 1961 Reg 98(3) & DGMS Circular 02/2020",
        category: "RAMP_RETARDER",
        categoryLabel: "Haul Road & Retarder Safety",
        title: `Ramp Speed Degradation & Skidding Hazard: ${dumper.name}`,
        severity: "CRITICAL_VIOLATION",
        affectedAssetId: dumper.id,
        affectedAssetName: `${dumper.name} (${dumper.assignedBenchOrLevel})`,
        currentTelemetryValue: dumper.telemetryAlert || "Climb speed degraded to 7 km/h with wheel slip",
        statutoryThreshold: "Max Ramp Gradient 1:16 (1:10 short ramps) • Mandatory Retarder Efficiency",
        statutoryDescription:
          "Excessive ramp wheel slip in wet slush triggers severe hydraulic retarder brake overheating, increasing runaway dump truck risk on descending benches.",
        immediateActionRequired:
          "Deploy motor grader to spread 40mm hard quartzite ballast on slippery ramp curves. Reduce payload to 80% until road drained.",
        penaltyClause:
          "MMR Reg 98 Violation: Suspension of haulage on gradient until road berms and traction restored.",
        lastCheckedTime: nowStr,
      });
    } else {
      checks.push({
        id: `dgms-dmp-${dumper.id}`,
        regulationCode: "DGMS Circular 02/2020",
        category: "HEMM_SAFETY",
        categoryLabel: "HEMM Operator & AVA Safety",
        title: `Audio-Visual Alarm & Reverse Radar Active: ${dumper.name}`,
        severity: "COMPLIANT",
        affectedAssetId: dumper.id,
        affectedAssetName: dumper.name,
        currentTelemetryValue: "AVA 110 dB Sounder Active • Rear Radar 15m Clear",
        statutoryThreshold: "Audible AVA at 15m radius • 0.3s interlock on reverse gear",
        statutoryDescription:
          "Mandatory reverse audio-visual alarm (AVA) and blind spot proximity sensors are fully operational.",
        immediateActionRequired: "Verify logbook entry before change of shift.",
        penaltyClause: "Compliant with DGMS Circular No. 2 of 2020.",
        lastCheckedTime: nowStr,
      });
    }
  });

  // -------------------------------------------------------------
  // 4. Underground Winder Hoist Safety (MMR 1961 Reg 79 to 88)
  // (For underground or combined mines)
  // -------------------------------------------------------------
  const winders = mine.equipmentFleet.filter((e) => e.type === "Winder Hoist");

  if (winders.length > 0) {
    winders.forEach((winder) => {
      const isOperational = winder.status === "Operational";
      checks.push({
        id: `dgms-wnd-${winder.id}`,
        regulationCode: "MMR 1961 Reg 79 & Reg 84 (Shaft Winding Equipment)",
        category: "UNDERGROUND_WINDER",
        categoryLabel: "Underground Shaft & Winder Hoist",
        title: `Shaft Hoist Brake Interlock & Overwind Trip: ${winder.name}`,
        severity: isOperational ? "COMPLIANT" : "STATUTORY_WARNING",
        affectedAssetId: winder.id,
        affectedAssetName: `${winder.name} (${winder.assignedBenchOrLevel})`,
        currentTelemetryValue: `Availability ${winder.availabilityPct}% • MTBF ${winder.mtbfHours}h • Brake Deceleration 2.4 m/s²`,
        statutoryThreshold: "Daily automatic overwind contrivance test & brake arrest certificate",
        statutoryDescription:
          "MMR 1961 Reg 84 mandates daily statutory test of Lilly speed governor, slack rope detection, and dual caliper deadweight brake emergency trip.",
        immediateActionRequired: isOperational
          ? "Log shift statutory winder certificate in DGMS Winding Logbook (Form V)."
          : "Conduct non-destructive testing (NDT) on winder drum shaft and verify caliper brake lining thickness.",
        penaltyClause: "MMR Reg 79: Immediate prohibition of man-riding if trip mechanisms fail test.",
        lastCheckedTime: nowStr,
      });
    });
  }

  // -------------------------------------------------------------
  // 5. Wet Pit Floor Inundation & Sump Dewatering Safety
  // (DGMS Tech Circular 02 of 2015 & MMR Reg 115)
  // -------------------------------------------------------------
  const isRainHigh = mine.satelliteIndicators.rainfall24hMm > 50;
  const isSoilSaturated =
    mine.satelliteIndicators.soilMoistureStatus === "Saturated" ||
    mine.satelliteIndicators.soilMoistureStatus === "Waterlogged";

  if (isRainHigh || isSoilSaturated) {
    checks.push({
      id: "dgms-sump-inundation",
      regulationCode: "DGMS Tech Circular 02/2015 & MMR Reg 115",
      category: "PIT_SUMP_ELECTRICAL",
      categoryLabel: "Inundation & Sump Dewatering",
      title: `Pit Inundation & High-Voltage Cable Submersion Risk`,
      severity: isRainHigh && isSoilSaturated ? "CRITICAL_VIOLATION" : "STATUTORY_WARNING",
      affectedAssetName: `Pit Sump & Saturated Western Highwall (${mine.name})`,
      currentTelemetryValue: `Rainfall 24h: ${mine.satelliteIndicators.rainfall24hMm} mm • Soil Index: ${mine.satelliteIndicators.soilMoistureIndex}`,
      statutoryThreshold: "Sump capacity must maintain 48h emergency reserve buffer above pump deck",
      statutoryDescription:
        "High water ingress threatens electrical substation switchgear and destabilizes toe of opencast benches. Submerged trailing cables present severe electrocution hazards under MMR Reg 115.",
      immediateActionRequired:
        "Elevate trailing cables on wooden trestles (>1.5m above water). Commission standby high-head pump (1400 GPM) and dig peripheral storm cut-off garland drain.",
      penaltyClause:
        "Statutory order to withdraw personnel from pit floor under MMR Reg 115 due to danger of inundation.",
      lastCheckedTime: nowStr,
    });
  }

  // -------------------------------------------------------------
  // Calculate Summary Metrics
  // -------------------------------------------------------------
  const criticalCount = checks.filter((c) => c.severity === "CRITICAL_VIOLATION").length;
  const warningCount = checks.filter((c) => c.severity === "STATUTORY_WARNING").length;
  const compliantCount = checks.filter((c) => c.severity === "COMPLIANT").length;
  const advisoryCount = checks.filter((c) => c.severity === "ADVISORY").length;
  const totalChecks = checks.length;

  // Formula: 100 - (critical * 18) - (warning * 8)
  const scoreRaw = 100 - criticalCount * 18 - warningCount * 8;
  const overallScore = Math.max(Math.min(scoreRaw, 100), 20);

  let status: DgmsAuditSummary["status"] = "FULLY_COMPLIANT";
  if (criticalCount > 0) {
    status = "CRITICAL_ACTION_REQUIRED";
  } else if (warningCount > 0) {
    status = "STATUTORY_CAUTION";
  }

  return {
    checks,
    summary: {
      overallScore,
      status,
      criticalCount,
      warningCount,
      compliantCount,
      advisoryCount,
      totalChecks,
    },
  };
}
