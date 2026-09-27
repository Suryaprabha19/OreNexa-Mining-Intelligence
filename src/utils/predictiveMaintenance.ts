import { MiningEquipment, MoilMine, PredictiveMaintenanceRecord } from "../types/mining";

/**
 * Calculates predictive maintenance intervals and wear indicators
 * for mine equipment based on real-time engine/operating hours.
 */
export function generatePredictiveMaintenanceLog(
  mine: MoilMine
): PredictiveMaintenanceRecord[] {
  // Service tiers and their standard hour cycles
  const intervalConfigs: Record<
    string,
    {
      baseInterval: number;
      tier: "PM-250" | "PM-500" | "PM-1000" | "PM-2000" | "PM-5000";
      description: string;
      downtime: number;
      dgmsMandate: string;
      parts: string[];
    }
  > = {
    "Hydraulic Shovel": {
      baseInterval: 500,
      tier: "PM-500",
      description: "Hydraulic Pump Flow Test, Main Relief Valve Check, Boom Cylinder Pin Lubrication",
      downtime: 8,
      dgmsMandate: "DGMS Tech Circ 04/2013: Automatic Fire Detection & Suppression (AFDSS) cylinder test",
      parts: ["Hydraulic Return Filter (P/N 589-20)", "High-Pressure O-Ring Kit", "Tellus S2 MX 68 Oil (120L)"],
    },
    "Dump Truck": {
      baseInterval: 250,
      tier: "PM-250",
      description: "Engine Oil & Fuel Filter Renewal, Differential Retarder Cooling Check, Steering Slack Test",
      downtime: 4.5,
      dgmsMandate: "DGMS MMR Reg 98: Secondary Steering Test & Audio-Visual Alarm (AVA) dB decibel verification",
      parts: ["Primary Fuel Water Separator", "Engine Oil Filter Cartridge", "Rimex Wheel Nut Torque Retainer"],
    },
    "Blast Hole Drill": {
      baseInterval: 250,
      tier: "PM-250",
      description: "Compressor Oil Filter, Rotary Head Oil Flush, Feed Chain Tensioning & Mast Bushings",
      downtime: 5,
      dgmsMandate: "DGMS Tech Circ 01/2010: Wet drill dust suppression misting nozzle pressure compliance",
      parts: ["Air Compressor Separator Filter", "Drill Rod Guide Inserts", "Grease EP2 Cartridges"],
    },
    "Winder Hoist": {
      baseInterval: 1000,
      tier: "PM-1000",
      description: "Deadweight Caliper Brake Lining NDT, Headgear Sheave Ultrasonic Test, Slack Rope Contrivance",
      downtime: 16,
      dgmsMandate: "MMR 1961 Reg 84: Statutory quarterly winder governor overwind trip & brake deceleration test",
      parts: ["Non-asbestos Caliper Brake Pads (Set of 4)", "Inductive Proximity Sensor Switch", "Shell Omala S2 G 320 Gear Oil"],
    },
    "Dewatering Pump": {
      baseInterval: 500,
      tier: "PM-500",
      description: "Impeller Wear Ring Clearance, Mechanical Gland Seal Packing, Motor Stator Insulation (Megger)",
      downtime: 6,
      dgmsMandate: "MMR Reg 115: High-voltage trailing cable insulation test & pit inundation emergency standby audit",
      parts: ["Bronze Wear Ring (Front/Rear)", "Graphite Packing Rings (9.5mm)", "SKF Heavy Roller Bearings"],
    },
    "LHD (Underground)": {
      baseInterval: 250,
      tier: "PM-250",
      description: "Exhaust Scrubber Water Level, Axle Planetary Hub Oil, Hydrostatic Drive Pilot Pressure",
      downtime: 6.5,
      dgmsMandate: "DGMS Tech Circ 03/2018: Diesel Particulate Filter (DPF) backpressure check & cabin FOPS/ROPS cert",
      parts: ["Hydraulic Return Filter", "Exhaust Scrubber Flame Trap Core", "Brake Line Bleeder Kit"],
    },
  };

  return mine.equipmentFleet.map((eq, index) => {
    const config = intervalConfigs[eq.type] || intervalConfigs["Hydraulic Shovel"];

    // Deterministic realistic engine hours based on equipment properties
    // e.g. degraded equipment is closer to service boundary
    const seed = (eq.id.charCodeAt(0) * 31 + eq.id.charCodeAt(eq.id.length - 1) * 7 + index * 13) % 400;
    
    // Determine realistic engine hours
    let currentEngineHours = eq.engineHours;
    if (!currentEngineHours) {
      if (eq.status === "Degraded") {
        currentEngineHours = config.baseInterval * 4 + (config.baseInterval - 12); // almost at next interval
      } else if (eq.status === "Breakdown") {
        currentEngineHours = config.baseInterval * 5 + 18; // overdue!
      } else {
        currentEngineHours = config.baseInterval * 3 + seed;
      }
    }

    // Determine cycle intervals
    const nextServiceCycle = Math.ceil(currentEngineHours / config.baseInterval) * config.baseInterval;
    const hoursRemaining = nextServiceCycle - currentEngineHours;

    let urgency: PredictiveMaintenanceRecord["urgency"] = "HEALTHY";
    if (hoursRemaining <= 0) {
      urgency = "OVERDUE";
    } else if (hoursRemaining <= 25) {
      urgency = "CRITICAL_SOON";
    } else if (hoursRemaining <= 75) {
      urgency = "SCHEDULED";
    }

    // Calculate wear percentage within current service cycle (0 - 100%)
    const cycleProgressHours = currentEngineHours % config.baseInterval;
    const wearPercentage = Math.min(100, Math.round((cycleProgressHours / config.baseInterval) * 100));

    // Determine dynamic service tier
    let serviceTier: PredictiveMaintenanceRecord["serviceTier"] = config.tier;
    if (nextServiceCycle % 2000 === 0) serviceTier = "PM-2000";
    else if (nextServiceCycle % 1000 === 0) serviceTier = "PM-1000";
    else if (nextServiceCycle % 500 === 0) serviceTier = "PM-500";
    else serviceTier = "PM-250";

    const assignedTeams = [
      "Heavy HEMM Mechanical Crew Alpha",
      "Shaft Electrical & Instrumentation Squad",
      "Hydraulic Specialist Mobile Rapid Response",
      "Underground Mobile Fleet Workshop",
      "Pit Dewatering & Electrical Maintenance",
    ];

    return {
      equipmentId: eq.id,
      equipmentName: eq.name,
      equipmentType: eq.type,
      currentEngineHours,
      nextServiceHours: nextServiceCycle,
      hoursRemaining,
      serviceTier,
      serviceDescription: config.description,
      urgency,
      wearPercentage,
      recommendedParts: config.parts,
      mandatoryDgmsCheck: config.dgmsMandate,
      assignedTeam: assignedTeams[index % assignedTeams.length],
      estimatedDowntimeHours: config.downtime,
    };
  });
}
