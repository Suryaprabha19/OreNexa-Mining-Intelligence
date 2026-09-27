export type DgmsSeverity = "CRITICAL_VIOLATION" | "STATUTORY_WARNING" | "ADVISORY" | "COMPLIANT";

export type DgmsCategory =
  | "BLASTING_VIBRATION"
  | "HEMM_SAFETY"
  | "FIRE_AFDSS"
  | "RAMP_RETARDER"
  | "UNDERGROUND_WINDER"
  | "PIT_SUMP_ELECTRICAL";

export interface DgmsComplianceCheck {
  id: string;
  regulationCode: string; // e.g., "MMR 1961 Reg 156 / Circ 7/1997"
  category: DgmsCategory;
  categoryLabel: string;
  title: string;
  severity: DgmsSeverity;
  affectedAssetId?: string;
  affectedAssetName: string;
  currentTelemetryValue: string;
  statutoryThreshold: string;
  statutoryDescription: string;
  immediateActionRequired: string;
  penaltyClause: string;
  isResolved?: boolean;
  resolvedAt?: string;
  resolvedNote?: string;
  lastCheckedTime: string;
}

export interface DgmsAuditSummary {
  overallScore: number; // 0 - 100%
  status: "CRITICAL_ACTION_REQUIRED" | "STATUTORY_CAUTION" | "FULLY_COMPLIANT";
  criticalCount: number;
  warningCount: number;
  compliantCount: number;
  advisoryCount: number;
  totalChecks: number;
}
