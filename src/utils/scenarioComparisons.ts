import { MoilMine, SimulatedScenarioOption, ShortfallPredictionResult } from "../types/mining";

/**
 * Generates tailored operational scenarios for side-by-side comparative simulation.
 * Calculates projected manganese recovery, grade, deficit reduction, and detailed OPEX costs.
 */
export function generateSimulatedScenarios(
  mine: MoilMine,
  predictionResult?: ShortfallPredictionResult
): SimulatedScenarioOption[] {
  const target = mine.monthlyTargetMT || 35000;
  const shortfall = predictionResult?.projectedShortfallMT || Math.round(target * 0.14);
  const benchmarkOrePricePerTonINR = 14200; // Benchmark domestic pricing for 42-46% Mn ore

  // 1. High-Grade Silo & Stockpile Surge
  const recoveryS1 = Math.min(shortfall, Math.round(shortfall * 0.65));
  const costPerTonS1 = 460;
  const totalCostS1 = Math.round(recoveryS1 * costPerTonS1);
  const grossRevS1 = Math.round(recoveryS1 * (benchmarkOrePricePerTonINR * 1.06)); // 46% Mn premium
  const s1: SimulatedScenarioOption = {
    id: "SCN-STOCKPILE-BLEND",
    code: "SCN-A",
    name: "High-Grade Silo & Stockpile Blending Surge",
    shortName: "Silo Stockpile Blend",
    badge: "RAPID RECOVERY",
    category: "GRADE_BLENDING",
    description: "Draw down 46% Mn reserves from covered surge silo B and blend with active pit run-of-mine ore using automated vibratory feeders.",
    strategyFocus: "Immediate deficit mitigation with minimal in-pit equipment stress and lowest incremental OPEX.",
    projectedRecoveryMT: recoveryS1,
    recoveredGradePct: 46.2,
    deficitMitigationPct: +((recoveryS1 / shortfall) * 100).toFixed(1),
    timelineHours: 18,
    totalCostINR: totalCostS1,
    costPerTonINR: costPerTonS1,
    costBreakdown: {
      fuelAndPowerINR: Math.round(totalCostS1 * 0.22),
      labourAndOvertimeINR: Math.round(totalCostS1 * 0.26),
      sparesAndMaintenanceINR: Math.round(totalCostS1 * 0.16),
      consumablesAndReagentsINR: Math.round(totalCostS1 * 0.36),
    },
    grossRevenueINR: grossRevS1,
    netEconomicMarginINR: grossRevS1 - totalCostS1,
    roiMultiple: +(grossRevS1 / totalCostS1).toFixed(1),
    dgmsComplianceRisk: "LOW",
    dgmsRiskNote: "Surface conveyor and covered silo dispatch; zero face or slope instability risk.",
    weatherSensitivity: "LOW",
    keyMachineryInvolved: ["Automated Vibratory Feeder #2", "Overland Conveyor CV-04", "Front-End Wheel Loader CAT 966"],
    actionSteps: [
      "Calibrate automated bin discharge gates to 60:40 blending ratio.",
      "Dispatch 46% Mn surge silo ore to primary screening plant.",
      "Verify moisture assay (<6.5%) to prevent chute clogging.",
    ],
  };

  // 2. 3-Shift Fleet Overdrive & Ramp Cycle Acceleration
  const recoveryS2 = Math.min(shortfall * 1.1, Math.round(shortfall * 0.92));
  const costPerTonS2 = 1240;
  const totalCostS2 = Math.round(recoveryS2 * costPerTonS2);
  const grossRevS2 = Math.round(recoveryS2 * (benchmarkOrePricePerTonINR * 0.98)); // 41% Mn bulk
  const s2: SimulatedScenarioOption = {
    id: "SCN-FLEET-3SHIFT",
    code: "SCN-B",
    name: "3-Shift Fleet Re-deployment & Haul Ramp Overdrive",
    shortName: "3-Shift Fleet Surge",
    badge: "MAX TONNAGE",
    category: "FLEET_OPTIMIZATION",
    description: "Re-deploy auxiliary shovels and initiate 24/7 continuous 3-shift dumper cycles with dedicated dewatering pumps on haulage ramps.",
    strategyFocus: "Maximum physical ore excavation to close the absolute tonnage deficit regardless of fuel burn.",
    projectedRecoveryMT: recoveryS2,
    recoveredGradePct: 41.5,
    deficitMitigationPct: +((recoveryS2 / shortfall) * 100).toFixed(1),
    timelineHours: 42,
    totalCostINR: totalCostS2,
    costPerTonINR: costPerTonS2,
    costBreakdown: {
      fuelAndPowerINR: Math.round(totalCostS2 * 0.48), // Heavy HSD diesel
      labourAndOvertimeINR: Math.round(totalCostS2 * 0.28), // Overtime crews
      sparesAndMaintenanceINR: Math.round(totalCostS2 * 0.18), // Tire & engine wear
      consumablesAndReagentsINR: Math.round(totalCostS2 * 0.06),
    },
    grossRevenueINR: grossRevS2,
    netEconomicMarginINR: grossRevS2 - totalCostS2,
    roiMultiple: +(grossRevS2 / totalCostS2).toFixed(1),
    dgmsComplianceRisk: "ELEVATED",
    dgmsRiskNote: "DGMS MMR Reg 98(3): Wet ramp slip hazard; mandatory retarder checks and AVA audio-visual alarms required on all night shifts.",
    weatherSensitivity: "HIGH",
    keyMachineryInvolved: ["Hydraulic Shovel 2.5m³ (EX-01)", "3x 35T Dump Trucks (DT-02, 05, 08)", "Heavy Skid Dewatering Pump 150HP"],
    actionSteps: [
      "Mobilize B and C shift relief operators for continuous shovel cycling.",
      "Grade haul road ramps with crushed quartzite ballast to minimize tire slippage.",
      "Enforce DGMS speed governors capped at 20 km/h on switchback descents.",
    ],
  };

  // 3. Electronic Blasting Redesign & Muckpile Swell Optimization
  const recoveryS3 = Math.round(shortfall * 0.74);
  const costPerTonS3 = 680;
  const totalCostS3 = Math.round(recoveryS3 * costPerTonS3);
  const grossRevS3 = Math.round(recoveryS3 * (benchmarkOrePricePerTonINR * 1.02));
  const s3: SimulatedScenarioOption = {
    id: "SCN-BLAST-ELECTRONIC",
    code: "SCN-C",
    name: "Electronic Delay Redesign & Blasting Vibration Optimization",
    shortName: "Electronic Blast Redesign",
    badge: "HIGH SAFETY / EFFICIENCY",
    category: "BLAST_ENGINEERING",
    description: "Replace standard shock-tube nonel caps with digital programmable detonators; stagger hole delays to 25ms to dampen PPV below 4.0 mm/s.",
    strategyFocus: "Release blocked blast blocks near the highwall while keeping ground vibration compliant with DGMS safe limits.",
    projectedRecoveryMT: recoveryS3,
    recoveredGradePct: 43.8,
    deficitMitigationPct: +((recoveryS3 / shortfall) * 100).toFixed(1),
    timelineHours: 28,
    totalCostINR: totalCostS3,
    costPerTonINR: costPerTonS3,
    costBreakdown: {
      fuelAndPowerINR: Math.round(totalCostS3 * 0.18),
      labourAndOvertimeINR: Math.round(totalCostS3 * 0.22),
      sparesAndMaintenanceINR: Math.round(totalCostS3 * 0.12),
      consumablesAndReagentsINR: Math.round(totalCostS3 * 0.48), // Electronic detonators & emulsion
    },
    grossRevenueINR: grossRevS3,
    netEconomicMarginINR: grossRevS3 - totalCostS3,
    roiMultiple: +(grossRevS3 / totalCostS3).toFixed(1),
    dgmsComplianceRisk: "LOW",
    dgmsRiskNote: "DGMS Tech Circular 07/1997: Reduces PPV from 4.8 mm/s to 3.2 mm/s, well under the 5.0 mm/s highwall threshold.",
    weatherSensitivity: "MODERATE",
    keyMachineryInvolved: ["Rotary Blast Hole Drill 150mm", "Bulk Emulsion Explosive Delivery Truck", "Minimate Plus Seismograph Station #3"],
    actionSteps: [
      "Reprogram electronic delay timing sequence from 17ms to 25ms inter-hole interval.",
      "Charge 60 blast holes in Bench 4 with waterproof site-sensitized emulsion.",
      "Verify zero vibration excursion on highwall crest geophones prior to mucking.",
    ],
  };

  // 4. Underground Deep Stope Accelerated Mucking (Sublevel Stoping)
  const recoveryS4 = Math.round(shortfall * 0.82);
  const costPerTonS4 = 960;
  const totalCostS4 = Math.round(recoveryS4 * costPerTonS4);
  const grossRevS4 = Math.round(recoveryS4 * (benchmarkOrePricePerTonINR * 1.1)); // 47% Mn high-grade underground braunite
  const s4: SimulatedScenarioOption = {
    id: "SCN-UNDERGROUND-STOPE",
    code: "SCN-D",
    name: "Deep Stope (-180m) Sublevel Extraction & Shaft Surge",
    shortName: "Deep Stope Surge",
    badge: "HIGHEST GRADE (47.2% Mn)",
    category: "STOPE_ACCELERATION",
    description: "Accelerate tele-remote LHD mucking in active sublevel stopes at Level -180m and allocate priority hoisting slots on the main winder shaft.",
    strategyFocus: "Recover ultra-high-grade metallurgical ore to command maximum steelmaker pricing and offset volume deficits via grade blending.",
    projectedRecoveryMT: recoveryS4,
    recoveredGradePct: 47.4,
    deficitMitigationPct: +((recoveryS4 / shortfall) * 100).toFixed(1),
    timelineHours: 54,
    totalCostINR: totalCostS4,
    costPerTonINR: costPerTonS4,
    costBreakdown: {
      fuelAndPowerINR: Math.round(totalCostS4 * 0.38), // Winder hoist & main fan power
      labourAndOvertimeINR: Math.round(totalCostS4 * 0.30), // Specialized underground mining crew
      sparesAndMaintenanceINR: Math.round(totalCostS4 * 0.22), // LHD hydraulic lines & bucket teeth
      consumablesAndReagentsINR: Math.round(totalCostS4 * 0.10),
    },
    grossRevenueINR: grossRevS4,
    netEconomicMarginINR: grossRevS4 - totalCostS4,
    roiMultiple: +(grossRevS4 / totalCostS4).toFixed(1),
    dgmsComplianceRisk: "MODERATE",
    dgmsRiskNote: "DGMS MMR 1961 Reg 84: Shaft winder overwind limit switches and stope ventilation volume (>3.0 m³/min/kW) must be re-certified.",
    weatherSensitivity: "LOW",
    keyMachineryInvolved: ["Underground LHD Sandvik LH307", "Main Shaft Double-Drum Winder 750kW", "Auxiliary Ventilation Fan 75kW"],
    actionSteps: [
      "Prioritize skip hoisting for Stope 4E ore skips over development waste skips.",
      "Deploy tele-remote control on LHD-02 to muck open stope without human entry.",
      "Monitor air velocity across sublevel crosscut to maintain statutory dust dilution.",
    ],
  };

  // 5. Dense Media Separation (DMS) Tailings & Reclaim Beneficiation
  const recoveryS5 = Math.round(shortfall * 0.52);
  const costPerTonS5 = 540;
  const totalCostS5 = Math.round(recoveryS5 * costPerTonS5);
  const grossRevS5 = Math.round(recoveryS5 * (benchmarkOrePricePerTonINR * 0.94));
  const s5: SimulatedScenarioOption = {
    id: "SCN-DMS-BENEFICIATION",
    code: "SCN-E",
    name: "Dense Media Separation (DMS) Gangue Beneficiation",
    shortName: "DMS Plant Beneficiation",
    badge: "RESOURCE CONSERVATION",
    category: "BENEFICIATION",
    description: "Re-process medium-grade siliceous gondite dumps through the heavy-media cyclone drum to upgrade 28% Mn rejects into 42.5% Mn marketable lump ore.",
    strategyFocus: "Eco-friendly reclaim from historical stockpiles with minimal in-pit carbon footprint.",
    projectedRecoveryMT: recoveryS5,
    recoveredGradePct: 42.6,
    deficitMitigationPct: +((recoveryS5 / shortfall) * 100).toFixed(1),
    timelineHours: 24,
    totalCostINR: totalCostS5,
    costPerTonINR: costPerTonS5,
    costBreakdown: {
      fuelAndPowerINR: Math.round(totalCostS5 * 0.35), // Cyclone pump electricity
      labourAndOvertimeINR: Math.round(totalCostS5 * 0.20),
      sparesAndMaintenanceINR: Math.round(totalCostS5 * 0.15),
      consumablesAndReagentsINR: Math.round(totalCostS5 * 0.30), // Ferrosilicon medium
    },
    grossRevenueINR: grossRevS5,
    netEconomicMarginINR: grossRevS5 - totalCostS5,
    roiMultiple: +(grossRevS5 / totalCostS5).toFixed(1),
    dgmsComplianceRisk: "LOW",
    dgmsRiskNote: "Surface beneficiation plant operation; zero highwall or stope hazards.",
    weatherSensitivity: "LOW",
    keyMachineryInvolved: ["DMS Heavy Media Cyclone Drum", "Ferrosilicon Magnetic Separator", "Slurry Sump Pump 90kW"],
    actionSteps: [
      "Adjust bath specific gravity to 3.20 g/cm³ for optimal Braunite/Gondite sink-float split.",
      "Feed 4,000 MT of +10mm to -50mm crushed dump material into the wash drum.",
      "Dewater sink product and stack clean lump manganese on dispatch platform.",
    ],
  };

  // 6. Conservative Baseline (Minimal Intervention)
  const recoveryS6 = Math.round(shortfall * 0.22);
  const costPerTonS6 = 220;
  const totalCostS6 = Math.round(recoveryS6 * costPerTonS6);
  const grossRevS6 = Math.round(recoveryS6 * (benchmarkOrePricePerTonINR * 0.92));
  const s6: SimulatedScenarioOption = {
    id: "SCN-CONSERVATIVE-STANDBY",
    code: "SCN-F",
    name: "Conservative Baseline (Natural Pit Progression)",
    shortName: "Conservative Baseline",
    badge: "LOWEST EXPENDITURE",
    category: "CONSERVATIVE",
    description: "Maintain current single-shift operations without emergency overtime or expedited stockpile draws, accepting the shortfall deficit.",
    strategyFocus: "Preserve OPEX budget at the expense of monthly delivery shortfalls and steel mill penalties.",
    projectedRecoveryMT: recoveryS6,
    recoveredGradePct: 39.5,
    deficitMitigationPct: +((recoveryS6 / shortfall) * 100).toFixed(1),
    timelineHours: 12,
    totalCostINR: totalCostS6,
    costPerTonINR: costPerTonS6,
    costBreakdown: {
      fuelAndPowerINR: Math.round(totalCostS6 * 0.32),
      labourAndOvertimeINR: Math.round(totalCostS6 * 0.38),
      sparesAndMaintenanceINR: Math.round(totalCostS6 * 0.20),
      consumablesAndReagentsINR: Math.round(totalCostS6 * 0.10),
    },
    grossRevenueINR: grossRevS6,
    netEconomicMarginINR: grossRevS6 - totalCostS6,
    roiMultiple: +(grossRevS6 / totalCostS6).toFixed(1),
    dgmsComplianceRisk: "LOW",
    dgmsRiskNote: "Standard operating conditions with routine statutory maintenance.",
    weatherSensitivity: "HIGH",
    keyMachineryInvolved: ["Routine Pit Shovels", "Standard Dump Fleet"],
    actionSteps: [
      "Maintain normal single-shift operation.",
      "Notify steel plant customers of anticipated month-end shortfall.",
      "Conserve operating cashflow by avoiding premium weekend shift rates.",
    ],
  };

  return [s1, s2, s3, s4, s5, s6];
}

/**
 * Calculates comparative differential deltas between two scenarios (Scenario A vs Scenario B)
 */
export function calculateScenarioDeltas(
  scenarioA: SimulatedScenarioOption,
  scenarioB: SimulatedScenarioOption
) {
  const recoveryDeltaMT = scenarioA.projectedRecoveryMT - scenarioB.projectedRecoveryMT;
  const recoveryPctDelta = +(
    ((scenarioA.projectedRecoveryMT - scenarioB.projectedRecoveryMT) / Math.max(1, scenarioB.projectedRecoveryMT)) *
    100
  ).toFixed(1);

  const gradeDeltaPct = +(scenarioA.recoveredGradePct - scenarioB.recoveredGradePct).toFixed(1);
  const costDeltaINR = scenarioA.totalCostINR - scenarioB.totalCostINR;
  const costPerTonDeltaINR = scenarioA.costPerTonINR - scenarioB.costPerTonINR;
  const netMarginDeltaINR = scenarioA.netEconomicMarginINR - scenarioB.netEconomicMarginINR;
  const roiDelta = +(scenarioA.roiMultiple - scenarioB.roiMultiple).toFixed(1);
  const timelineDeltaHours = scenarioA.timelineHours - scenarioB.timelineHours;

  return {
    recoveryDeltaMT,
    recoveryPctDelta,
    gradeDeltaPct,
    costDeltaINR,
    costPerTonDeltaINR,
    netMarginDeltaINR,
    roiDelta,
    timelineDeltaHours,
    moreTonnage: recoveryDeltaMT > 0 ? "A" : recoveryDeltaMT < 0 ? "B" : "EQUAL",
    cheaperPerTon: costPerTonDeltaINR < 0 ? "A" : costPerTonDeltaINR > 0 ? "B" : "EQUAL",
    higherNetProfit: netMarginDeltaINR > 0 ? "A" : netMarginDeltaINR < 0 ? "B" : "EQUAL",
  };
}
