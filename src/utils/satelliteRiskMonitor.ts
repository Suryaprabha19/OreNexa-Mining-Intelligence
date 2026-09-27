import { SatelliteIndicators } from "../types/mining";

export type SatelliteRiskLevel = "Low" | "Moderate" | "High" | "Critical";

export interface SatelliteRiskFactor {
  name: string;
  value: string;
  status: "Normal" | "Elevated" | "Severe";
  description: string;
}

export interface SatelliteRiskAssessment {
  currentLevel: SatelliteRiskLevel;
  previousLevel: SatelliteRiskLevel;
  score: number; // 0 - 100
  factors: SatelliteRiskFactor[];
  timestamp: string;
  source: string;
  summary: string;
  recommendedAction: string;
}

export interface SatelliteRiskAlert {
  id: string;
  mineId: string;
  mineName: string;
  fromLevel: SatelliteRiskLevel;
  toLevel: SatelliteRiskLevel;
  timestamp: string;
  reason: string;
  score: number;
  indicators: {
    rainfallMm: number;
    soilMoistureIndex: number;
    soilMoistureStatus: string;
    lstDelta: number;
    precipitationForecast: string;
  };
  acknowledged: boolean;
}

/**
 * Calculates quantitative satellite risk score and classification
 */
export function evaluateSatelliteRisk(
  indicators: SatelliteIndicators,
  previousLevel: SatelliteRiskLevel = "Moderate"
): SatelliteRiskAssessment {
  let score = 0;
  const factors: SatelliteRiskFactor[] = [];

  // 1. Rainfall evaluation (0 - 40 pts)
  if (indicators.rainfall24hMm >= 80) {
    score += 40;
    factors.push({
      name: "24h Cumulative Precipitation",
      value: `${indicators.rainfall24hMm} mm`,
      status: "Severe",
      description: "Extreme monsoon downpour; severe pit flooding and haul road degradation risk.",
    });
  } else if (indicators.rainfall24hMm >= 50) {
    score += 30;
    factors.push({
      name: "24h Cumulative Precipitation",
      value: `${indicators.rainfall24hMm} mm`,
      status: "Elevated",
      description: "Heavy rainfall exceeding pit dewatering capacity; ramp mud slicking hazard.",
    });
  } else if (indicators.rainfall24hMm >= 25) {
    score += 15;
    factors.push({
      name: "24h Cumulative Precipitation",
      value: `${indicators.rainfall24hMm} mm`,
      status: "Normal",
      description: "Moderate precipitation within standard ditch clearance parameters.",
    });
  } else {
    score += 5;
    factors.push({
      name: "24h Cumulative Precipitation",
      value: `${indicators.rainfall24hMm} mm`,
      status: "Normal",
      description: "Dry or light precipitation conditions.",
    });
  }

  // 2. Soil Moisture Index (0 - 35 pts)
  if (indicators.soilMoistureIndex >= 0.75 || indicators.soilMoistureStatus === "Waterlogged") {
    score += 35;
    factors.push({
      name: "SAR Soil Moisture Saturation",
      value: `${(indicators.soilMoistureIndex * 100).toFixed(0)}% (${indicators.soilMoistureStatus})`,
      status: "Severe",
      description: "High pore-water pressure along bench toe; elevated highwall slope failure risk.",
    });
  } else if (indicators.soilMoistureIndex >= 0.55 || indicators.soilMoistureStatus === "Saturated") {
    score += 25;
    factors.push({
      name: "SAR Soil Moisture Saturation",
      value: `${(indicators.soilMoistureIndex * 100).toFixed(0)}% (${indicators.soilMoistureStatus})`,
      status: "Elevated",
      description: "High saturation; dumper traction loss and switchback braking hazards.",
    });
  } else {
    score += 10;
    factors.push({
      name: "SAR Soil Moisture Saturation",
      value: `${(indicators.soilMoistureIndex * 100).toFixed(0)}% (${indicators.soilMoistureStatus})`,
      status: "Normal",
      description: "Subsurface pore pressure within stable DGMS shear strength safety limits.",
    });
  }

  // 3. Thermal & Structural Anomalies (0 - 25 pts)
  if (Math.abs(indicators.lstDelta) >= 4.5) {
    score += 20;
    factors.push({
      name: "LST Thermal Anomaly Delta",
      value: `${indicators.lstDelta > 0 ? "+" : ""}${indicators.lstDelta}°C`,
      status: "Elevated",
      description: "Elevated surface thermal gradient indicating friction or localized strata dilation.",
    });
  } else {
    score += 5;
    factors.push({
      name: "LST Thermal Anomaly Delta",
      value: `${indicators.lstDelta > 0 ? "+" : ""}${indicators.lstDelta}°C`,
      status: "Normal",
      description: "Thermal profile consistent with ambient seasonal baseline.",
    });
  }

  let currentLevel: SatelliteRiskLevel = "Low";
  if (score >= 80) currentLevel = "Critical";
  else if (score >= 55) currentLevel = "High";
  else if (score >= 30) currentLevel = "Moderate";
  else currentLevel = "Low";

  const now = new Date();
  const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")} IST`;

  return {
    currentLevel,
    previousLevel,
    score,
    factors,
    timestamp,
    source: "Cartosat-3 / Sentinel-1 SAR & INSAT-3D Telemetry Feed",
    summary:
      currentLevel === "High" || currentLevel === "Critical"
        ? `Unexpected risk elevation: Rainfall (${indicators.rainfall24hMm}mm) and soil moisture (${(indicators.soilMoistureIndex * 100).toFixed(0)}%) have crossed the stability threshold.`
        : "Satellite risk metrics are within normal operational margins.",
    recommendedAction:
      currentLevel === "High" || currentLevel === "Critical"
        ? "Deploy standby diesel dewatering pumps to Sump Bench 4 and enforce 15 km/h dumper speed limit on wet haul roads."
        : "Maintain standard telemetry surveillance schedule.",
  };
}
