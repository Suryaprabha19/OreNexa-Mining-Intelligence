export interface SatelliteIndicators {
  ndvi: number; // Normalized Difference Vegetation Index (0 - 1)
  ndviAnomaly: string; // Description of vegetative stress/chlorosis
  lstCelsius: number; // Land Surface Temperature
  lstDelta: number; // Temperature anomaly vs background (+/- °C)
  soilMoistureIndex: number; // 0 - 1
  soilMoistureStatus: "Dry" | "Optimum" | "Saturated" | "Waterlogged";
  swirBandRatio: number; // SWIR absorption ratio for Mn-oxide identification
  spectralSignature: "Braunite Dominant" | "Pyrolusite Enriched" | "Psilomelane/Cryptomelane" | "Host Gondite Quartzite";
  rainfall24hMm: number;
  precipitationForecast72h: string;
}

export interface BoreholeRecord {
  id: string;
  name: string;
  gridX: number; // percentage in map
  gridY: number; // percentage in map
  depthMeters: number;
  mnGradePct: number; // % Mn
  feGradePct: number; // % Fe
  phosphorusPct: number; // % P
  silicaPct: number; // % SiO2
  strata: {
    depthFrom: number;
    depthTo: number;
    lithology: string;
    gradeMn: number;
    color: string;
  }[];
  unfcStatus: "Proved (111)" | "Probable (121)" | "Exploration Target";
}

export interface MiningEquipment {
  id: string;
  name: string;
  type: "Hydraulic Shovel" | "Dump Truck" | "Blast Hole Drill" | "Winder Hoist" | "Dewatering Pump" | "LHD (Underground)";
  status: "Operational" | "Degraded" | "Maintenance" | "Breakdown";
  availabilityPct: number;
  utilizationPct: number;
  mtbfHours: number;
  mttrHours: number;
  assignedBenchOrLevel: string;
  currentPayloadTons?: number;
  fuelOrPowerStatus: string;
  telemetryAlert?: string;
  engineHours?: number;
  lastServiceHours?: number;
  nextServiceHours?: number;
  serviceTier?: "PM-250" | "PM-500" | "PM-1000" | "PM-2000" | "PM-5000";
}

export interface PredictiveMaintenanceRecord {
  equipmentId: string;
  equipmentName: string;
  equipmentType: string;
  currentEngineHours: number;
  nextServiceHours: number;
  hoursRemaining: number;
  serviceTier: "PM-250" | "PM-500" | "PM-1000" | "PM-2000" | "PM-5000";
  serviceDescription: string;
  urgency: "OVERDUE" | "CRITICAL_SOON" | "SCHEDULED" | "HEALTHY";
  wearPercentage: number;
  recommendedParts: string[];
  mandatoryDgmsCheck: string;
  assignedTeam: string;
  estimatedDowntimeHours: number;
}

export interface BlastingLog {
  id: string;
  location: string;
  plannedDate: string;
  status: "Cleared" | "Executed" | "Delayed" | "Under Review";
  blastHolesCount: number;
  explosiveType: "SME Emulsion" | "ANFO" | "Electronic Detonator";
  powderFactorKgPerTon: number;
  targetMuckpileTons: number;
  rockMassRating: number; // RMR 0-100
  ppvVibrationMmSec: number;
  ppvThresholdMmSec: number;
  delayReason?: string;
}

export interface MoilMine {
  id: string;
  name: string;
  district: string;
  state: "Madhya Pradesh" | "Maharashtra";
  type: "Deep Underground" | "Opencast" | "Combined Underground/Opencast";
  coordinates: { lat: number; lng: number };
  geologicalFormation: string;
  annualCapacityMT: number; // in Metric Tonnes
  monthlyTargetMT: number;
  currentActualMT: number;
  estimatedTotalReservesMT: number;
  provedReservesMT: number;
  probableReservesMT: number;
  avgGradeMnPct: number;
  satelliteIndicators: SatelliteIndicators;
  boreholes: BoreholeRecord[];
  equipmentFleet: MiningEquipment[];
  blastingSchedule: BlastingLog[];
  monthlyProductionTrend: {
    month: string;
    plannedMT: number;
    actualMT: number;
    predictedMT?: number;
    shortfallMT: number;
    primaryConstraint: string;
  }[];
  activeAlertsCount: number;
}

export interface CorrectiveActionItem {
  id: string;
  category: "MINE_SCHEDULE" | "BLASTING_OPTIMIZATION" | "EQUIPMENT_REDEPLOYMENT" | "GRADE_BLENDING";
  actionTitle: string;
  priority: "P1-IMMEDIATE" | "P2-SHORT-TERM" | "P3-MEDIUM-TERM";
  description: string;
  implementationSteps: string[];
  recoverableMT: number;
  timelineHours: number;
  costImpactINR: string;
  status: "Proposed" | "In-Progress" | "Completed" | "Simulated";
}

export interface ShortfallPredictionResult {
  predictedMonthEndMT: number;
  projectedShortfallMT: number;
  shortfallPercentage: number;
  riskLevel: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  rootCauseBreakdown: {
    factor: string;
    impactMT: number;
    percentage: number;
  }[];
  correctiveActions: CorrectiveActionItem[];
  executiveSummary: string;
  source: "gemini" | "algorithmic_model";
}

export interface SimulatedScenarioOption {
  id: string;
  code: string;
  name: string;
  shortName: string;
  badge: string;
  category: "GRADE_BLENDING" | "FLEET_OPTIMIZATION" | "BLAST_ENGINEERING" | "STOPE_ACCELERATION" | "BENEFICIATION" | "CONSERVATIVE";
  description: string;
  strategyFocus: string;
  // Manganese Recovery metrics
  projectedRecoveryMT: number;
  recoveredGradePct: number;
  deficitMitigationPct: number;
  timelineHours: number;
  // Operational Cost (OPEX) metrics in INR
  totalCostINR: number;
  costPerTonINR: number;
  costBreakdown: {
    fuelAndPowerINR: number;
    labourAndOvertimeINR: number;
    sparesAndMaintenanceINR: number;
    consumablesAndReagentsINR: number;
  };
  // Economic returns
  grossRevenueINR: number;
  netEconomicMarginINR: number;
  roiMultiple: number;
  // Operational Feasibility & Statutory Compliance
  dgmsComplianceRisk: "LOW" | "MODERATE" | "ELEVATED";
  dgmsRiskNote: string;
  weatherSensitivity: "LOW" | "MODERATE" | "HIGH";
  keyMachineryInvolved: string[];
  actionSteps: string[];
}
