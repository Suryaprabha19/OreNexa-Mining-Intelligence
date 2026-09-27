/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { MOIL_MINES } from "./data/moilMinesData";
import { MoilMine, BoreholeRecord, ShortfallPredictionResult, CorrectiveActionItem, SimulatedScenarioOption } from "./types/mining";
import { Header } from "./components/Header";
import { OverviewMetrics } from "./components/OverviewMetrics";
import { SatelliteReserveMap } from "./components/SatelliteReserveMap";
import { ProductionTrendsChart } from "./components/ProductionTrendsChart";
import { EquipmentTelematics } from "./components/EquipmentTelematics";
import { CorrectiveActionsPanel } from "./components/CorrectiveActionsPanel";
import { ScenarioSimulatorModal } from "./components/ScenarioSimulatorModal";
import { BoreholeDetailModal } from "./components/BoreholeDetailModal";
import { OreBodyCrossSectionModal } from "./components/OreBodyCrossSectionModal";
import { ExecutiveReportModal } from "./components/ExecutiveReportModal";
import { VeoVideoAnimator } from "./components/VeoVideoAnimator";
import { GeminiMiningChatbot } from "./components/GeminiMiningChatbot";
import { SatelliteRiskDetailsModal } from "./components/SatelliteRiskDetailsModal";
import { evaluateSatelliteRisk, SatelliteRiskAlert, SatelliteRiskAssessment } from "./utils/satelliteRiskMonitor";
import { CheckCircle2, Sparkles, Video, MessageSquare } from "lucide-react";

export default function App() {
  const [mines, setMines] = useState<MoilMine[]>(MOIL_MINES);
  const [selectedMine, setSelectedMine] = useState<MoilMine>(MOIL_MINES[0]);

  // Modals state
  const [selectedBorehole, setSelectedBorehole] = useState<BoreholeRecord | null>(null);
  const [isCrossSectionOpen, setIsCrossSectionOpen] = useState<boolean>(false);
  const [crossSectionBorehole, setCrossSectionBorehole] = useState<BoreholeRecord | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isVeoOpen, setIsVeoOpen] = useState<boolean>(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [isSatelliteAlertModalOpen, setIsSatelliteAlertModalOpen] = useState<boolean>(false);

  // Satellite Risk Assessment & Real-Time Notification State
  const [satelliteAssessment, setSatelliteAssessment] = useState<SatelliteRiskAssessment>(() =>
    evaluateSatelliteRisk(MOIL_MINES[0].satelliteIndicators, "Moderate")
  );
  const [satelliteAlert, setSatelliteAlert] = useState<SatelliteRiskAlert | null>(null);

  // AI & Analytics states
  const [isAiDiagnosing, setIsAiDiagnosing] = useState<boolean>(false);
  const [isAnalyzingReserves, setIsAnalyzingReserves] = useState<boolean>(false);
  const [isAiRefreshingActions, setIsAiRefreshingActions] = useState<boolean>(false);
  const [aiReserveAnalysis, setAiReserveAnalysis] = useState<any>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Default initial prediction result for the selected mine
  const [predictionResult, setPredictionResult] = useState<ShortfallPredictionResult>({
    predictedMonthEndMT: 32600,
    projectedShortfallMT: 4900,
    shortfallPercentage: 13.1,
    riskLevel: "HIGH",
    rootCauseBreakdown: [
      { factor: "Weather & Pit Rain Slush", impactMT: 2200, percentage: 44.9 },
      { factor: "LHD-04 Breakdown (Level -180m)", impactMT: 1500, percentage: 30.6 },
      { factor: "Blasting PPV Delay (Fan Foundation)", impactMT: 800, percentage: 16.3 },
      { factor: "Winder Shaft Skip Wait Cycle", impactMT: 400, percentage: 8.2 },
    ],
    correctiveActions: [
      {
        id: "ACT-BG-01",
        category: "GRADE_BLENDING",
        actionTitle: "Draw High-Grade 46% Mn Surge Silo Ore",
        priority: "P1-IMMEDIATE",
        description: "Deploy 2,200 MT from covered silo B to balance production deficit.",
        implementationSteps: [
          "Activate automated vibratory feeders on Silo #2.",
          "Blend 60:40 with run-of-mine ore to satisfy Bhilai Steel Plant delivery quota.",
        ],
        recoverableMT: 2200,
        timelineHours: 6,
        costImpactINR: "₹18,50,000",
        status: "Proposed",
      },
      {
        id: "ACT-BG-02",
        category: "EQUIPMENT_REDEPLOYMENT",
        actionTitle: "Deploy Sandvik LH208 Standby Loader to Stope 12",
        priority: "P1-IMMEDIATE",
        description: "Replace degraded LHD-04 with surface standby unit.",
        implementationSteps: [
          "Lower LH208 via Shaft #1 cage during shift changeover window.",
          "Route directly to south stope to restore muck clearing to 140 tons/hr.",
        ],
        recoverableMT: 1600,
        timelineHours: 8,
        costImpactINR: "₹8,20,000",
        status: "Proposed",
      },
      {
        id: "ACT-BG-03",
        category: "BLASTING_OPTIMIZATION",
        actionTitle: "Digital Electronic Detonator Sequence for Crosscut Face",
        priority: "P2-SHORT-TERM",
        description: "Reduce charge per delay to suppress vibration below 5.0 mm/s.",
        implementationSteps: [
          "Reprogram electronic delay intervals to 25ms.",
          "Clear DGMS safety review and fire round during scheduled 20:00 blast window.",
        ],
        recoverableMT: 1100,
        timelineHours: 12,
        costImpactINR: "₹3,40,000",
        status: "Proposed",
      },
    ],
    executiveSummary:
      "Balaghat mine faces a 4,900 MT shortfall driven by rain runoff and LHD equipment downtime. Implementing the recommended surge silo blending and loader redeployment will restore 3,800 MT within 14 hours.",
    source: "algorithmic_model",
  });

  // When selected mine changes, recalculate baseline
  useEffect(() => {
    setAiReserveAnalysis(null);
    const lastShortfall =
      selectedMine.monthlyProductionTrend[selectedMine.monthlyProductionTrend.length - 1].shortfallMT ||
      4500;

    setPredictionResult((prev) => ({
      ...prev,
      predictedMonthEndMT: selectedMine.currentActualMT + 4500,
      projectedShortfallMT: lastShortfall,
      shortfallPercentage: +((lastShortfall / selectedMine.monthlyTargetMT) * 100).toFixed(1),
      riskLevel: lastShortfall > 5000 ? "CRITICAL" : lastShortfall > 3000 ? "HIGH" : "MODERATE",
      executiveSummary: `Production analysis for ${selectedMine.name}: Projected gap of ${lastShortfall.toLocaleString()} MT identified against monthly target of ${selectedMine.monthlyTargetMT.toLocaleString()} MT. Corrective operational mitigations available.`,
    }));
  }, [selectedMine]);

  // Run AI Shortfall Diagnosis via Server Endpoint
  const handleTriggerAiDiagnosis = async () => {
    setIsAiDiagnosing(true);
    try {
      const res = await fetch("/api/gemini/predict-shortfall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mineName: selectedMine.name,
          monthlyTargetMT: selectedMine.monthlyTargetMT,
          currentProgressMT: selectedMine.currentActualMT,
          equipmentStatus: {
            fleet: selectedMine.equipmentFleet.map((e) => ({ name: e.name, status: e.status, availability: e.availabilityPct })),
          },
          weatherConditions: {
            rainfall24h: `${selectedMine.satelliteIndicators.rainfall24hMm}mm`,
            soilMoisture: selectedMine.satelliteIndicators.soilMoistureStatus,
            forecast: selectedMine.satelliteIndicators.precipitationForecast72h,
          },
          blastingStatus: {
            blasts: selectedMine.blastingSchedule.map((b) => ({ location: b.location, ppv: b.ppvVibrationMmSec, status: b.status })),
          },
        }),
      });

      const data = await res.json();
      if (data && data.data) {
        setPredictionResult(data.data);
        showToast("Gemini AI Shortfall & Operational Diagnosis Complete!");
      }
    } catch (err) {
      console.error("Diagnosis error:", err);
      showToast("Operational diagnosis updated via baseline engine.");
    } finally {
      setIsAiDiagnosing(false);
    }
  };

  // Run Deep AI Geological Reserve Analysis
  const handleAnalyzeReserves = async () => {
    setIsAnalyzingReserves(true);
    try {
      const res = await fetch("/api/gemini/analyze-reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mineName: selectedMine.name,
          location: `${selectedMine.district}, ${selectedMine.state}`,
          satelliteIndicators: {
            ndvi: selectedMine.satelliteIndicators.ndvi,
            lst: `${selectedMine.satelliteIndicators.lstCelsius}°C`,
            smi: selectedMine.satelliteIndicators.soilMoistureIndex,
            swirRatio: selectedMine.satelliteIndicators.swirBandRatio,
          },
          geophysicalData: {
            resistivity: "Low apparent resistivity zone in gondite core",
            chargeability: "18.2 mV/V high chargeability braunite signature",
            gravity: "+1.6 mGal residual Bouguer anomaly",
          },
          drillHoleSummary: `${selectedMine.boreholes.length} boreholes drilled with average grade ${selectedMine.avgGradeMnPct}% Mn`,
        }),
      });

      const data = await res.json();
      if (data && data.data) {
        setAiReserveAnalysis(data.data);
        showToast("AI Space-Tech Geological Reserve Assessment Ready!");
      }
    } catch (err) {
      console.error("Reserve analysis error:", err);
      showToast("Geological model evaluated.");
    } finally {
      setIsAnalyzingReserves(false);
    }
  };

  // Apply Corrective Action
  const handleApplyAction = (actionId: string) => {
    setPredictionResult((prev) => {
      let recovered = 0;
      const updatedActions = prev.correctiveActions.map((act) => {
        if (act.id === actionId && act.status !== "Completed") {
          recovered = act.recoverableMT;
          return { ...act, status: "Completed" as const };
        }
        return act;
      });

      const newShortfall = Math.max(0, prev.projectedShortfallMT - recovered);
      const newPredicted = prev.predictedMonthEndMT + recovered;

      // Also update selected mine actual progress
      setSelectedMine((current) => ({
        ...current,
        currentActualMT: current.currentActualMT + recovered,
      }));

      showToast(`Corrective Action Executed! +${recovered.toLocaleString()} MT Recovered.`);

      return {
        ...prev,
        projectedShortfallMT: newShortfall,
        predictedMonthEndMT: newPredicted,
        shortfallPercentage: +((newShortfall / selectedMine.monthlyTargetMT) * 100).toFixed(1),
        riskLevel: newShortfall > 4000 ? "HIGH" : newShortfall > 1500 ? "MODERATE" : "LOW",
        correctiveActions: updatedActions,
      };
    });
  };

  // Adopt Simulated Scenario
  const handleAdoptScenario = (scenario: SimulatedScenarioOption) => {
    const recovered = scenario.projectedRecoveryMT;
    setPredictionResult((prev) => {
      const newShortfall = Math.max(0, prev.projectedShortfallMT - recovered);
      const newPredicted = prev.predictedMonthEndMT + recovered;

      setSelectedMine((current) => ({
        ...current,
        currentActualMT: current.currentActualMT + recovered,
      }));

      showToast(`Scenario Adopted: ${scenario.shortName} (+${recovered.toLocaleString()} MT recovered, ₹${(scenario.totalCostINR / 100000).toFixed(1)}L OPEX)`);

      return {
        ...prev,
        projectedShortfallMT: newShortfall,
        predictedMonthEndMT: newPredicted,
        shortfallPercentage: +((newShortfall / selectedMine.monthlyTargetMT) * 100).toFixed(1),
        riskLevel: newShortfall > 4000 ? "HIGH" : newShortfall > 1500 ? "MODERATE" : "LOW",
      };
    });
  };

  // Synchronize satellite risk assessment when mine changes
  useEffect(() => {
    const assessment = evaluateSatelliteRisk(selectedMine.satelliteIndicators, "Moderate");
    setSatelliteAssessment(assessment);
  }, [selectedMine.id]);

  // Periodic real-time check of satellite-based risk assessment (checks every 20s)
  useEffect(() => {
    const timer = setInterval(() => {
      setSatelliteAssessment((prevAssessment) => {
        const currentAssessment = evaluateSatelliteRisk(
          selectedMine.satelliteIndicators,
          prevAssessment.currentLevel
        );

        // Check if risk unexpectedly shifted from Moderate to High (or Critical)
        if (prevAssessment.currentLevel === "Moderate" && currentAssessment.currentLevel === "High") {
          const newAlert: SatelliteRiskAlert = {
            id: `ALERT-${Date.now()}`,
            mineId: selectedMine.id,
            mineName: selectedMine.name,
            fromLevel: "Moderate",
            toLevel: "High",
            timestamp: currentAssessment.timestamp,
            reason: currentAssessment.summary,
            score: currentAssessment.score,
            indicators: {
              rainfallMm: selectedMine.satelliteIndicators.rainfall24hMm,
              soilMoistureIndex: selectedMine.satelliteIndicators.soilMoistureIndex,
              soilMoistureStatus: selectedMine.satelliteIndicators.soilMoistureStatus,
              lstDelta: selectedMine.satelliteIndicators.lstDelta,
              precipitationForecast: selectedMine.satelliteIndicators.precipitationForecast72h,
            },
            acknowledged: false,
          };

          setSatelliteAlert(newAlert);
          showToast(`⚠️ Satellite Risk Alert: Risk level shifted from Moderate to HIGH for ${selectedMine.name}`);
        }

        return currentAssessment;
      });
    }, 20000);

    return () => clearInterval(timer);
  }, [selectedMine]);

  // Trigger test simulation of unexpected satellite risk shift from Moderate to High
  const handleSimulateRiskShift = () => {
    const updatedIndicators = {
      ...selectedMine.satelliteIndicators,
      rainfall24hMm: 72,
      soilMoistureIndex: 0.84,
      soilMoistureStatus: "Waterlogged" as const,
      precipitationForecast72h: "Severe convective monsoon cloudburst (65-90mm) active over pit catchment",
    };

    setSelectedMine((prev) => ({
      ...prev,
      satelliteIndicators: updatedIndicators,
    }));

    const elevatedAssessment = evaluateSatelliteRisk(updatedIndicators, "Moderate");
    setSatelliteAssessment(elevatedAssessment);

    const newAlert: SatelliteRiskAlert = {
      id: `ALERT-${Date.now()}`,
      mineId: selectedMine.id,
      mineName: selectedMine.name,
      fromLevel: "Moderate",
      toLevel: "High",
      timestamp: elevatedAssessment.timestamp,
      reason: `Precipitation surged to ${updatedIndicators.rainfall24hMm}mm & SAR soil moisture saturated at ${(updatedIndicators.soilMoistureIndex * 100).toFixed(0)}% (Waterlogged).`,
      score: elevatedAssessment.score,
      indicators: {
        rainfallMm: updatedIndicators.rainfall24hMm,
        soilMoistureIndex: updatedIndicators.soilMoistureIndex,
        soilMoistureStatus: updatedIndicators.soilMoistureStatus,
        lstDelta: updatedIndicators.lstDelta,
        precipitationForecast: updatedIndicators.precipitationForecast72h,
      },
      acknowledged: false,
    };

    setSatelliteAlert(newAlert);
    showToast(`⚠️ Real-Time Satellite Alert: Risk shifted from Moderate to HIGH for ${selectedMine.name}`);
  };

  const handleAcknowledgeSatelliteAlert = () => {
    if (satelliteAlert) {
      setSatelliteAlert((prev) => (prev ? { ...prev, acknowledged: true } : null));
      showToast("Satellite Risk Alert acknowledged by operations.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f18] text-slate-200 flex flex-col font-sans text-xs">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#0f172a] border border-blue-500/80 text-blue-300 px-3 py-2 rounded shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        mines={mines}
        selectedMine={selectedMine}
        onSelectMine={(mine) => setSelectedMine(mine)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onTriggerAiDiagnosis={handleTriggerAiDiagnosis}
        isAiDiagnosing={isAiDiagnosing}
        onOpenVeoAnimator={() => setIsVeoOpen(true)}
        onToggleChatbot={() => setIsChatbotOpen((prev) => !prev)}
        isChatbotOpen={isChatbotOpen}
        satelliteAlert={satelliteAlert}
        satelliteAssessment={satelliteAssessment}
        onOpenSatelliteAlertDetails={() => setIsSatelliteAlertModalOpen(true)}
        onAcknowledgeSatelliteAlert={handleAcknowledgeSatelliteAlert}
        onSimulateRiskShift={handleSimulateRiskShift}
      />

      {/* Main Dashboard Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-3">
        {/* KPI Metric Cards */}
        <OverviewMetrics
          mine={selectedMine}
          projectedShortfallMT={predictionResult.projectedShortfallMT}
          riskLevel={predictionResult.riskLevel}
          isAiDiagnosed={predictionResult.source === "gemini"}
        />

        {/* Space Technology & Reserve Explorer Map */}
        <SatelliteReserveMap
          mine={selectedMine}
          onSelectBorehole={(bh) => setSelectedBorehole(bh)}
          onOpenCrossSection={(bh) => {
            setCrossSectionBorehole(bh);
            setIsCrossSectionOpen(true);
          }}
          onAnalyzeReserves={handleAnalyzeReserves}
          isAnalyzingReserves={isAnalyzingReserves}
          aiReserveAnalysis={aiReserveAnalysis}
        />

        {/* Production Trends & Shortfall Constraints */}
        <ProductionTrendsChart
          mine={selectedMine}
          predictionResult={predictionResult}
        />

        {/* Equipment Telematics & Blasting PPV Safety */}
        <EquipmentTelematics mine={selectedMine} />

        {/* Recommended Corrective Actions Engine */}
        <CorrectiveActionsPanel
          mine={selectedMine}
          actions={predictionResult.correctiveActions}
          onApplyAction={handleApplyAction}
          onRefreshAiActions={handleTriggerAiDiagnosis}
          isAiRefreshing={isAiDiagnosing}
          predictionResult={predictionResult}
          onAdoptScenario={handleAdoptScenario}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#070b12] py-2 px-4 text-[10px] text-slate-500 text-center flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          <span>MOIL Ltd. Operations Digital Twin • Ministry of Steel, India</span>
        </div>
        <div className="font-mono text-[10px] text-slate-500">
          ISRO Cartosat-3 / Sentinel-2 Remote Sensing • Gemini Space-AI Engine
        </div>
      </footer>

      {/* Modals */}
      <BoreholeDetailModal
        borehole={selectedBorehole}
        mine={selectedMine}
        onClose={() => setSelectedBorehole(null)}
        onOpenCrossSection={(bh) => {
          setSelectedBorehole(null);
          setCrossSectionBorehole(bh);
          setIsCrossSectionOpen(true);
        }}
      />

      <OreBodyCrossSectionModal
        isOpen={isCrossSectionOpen}
        onClose={() => setIsCrossSectionOpen(false)}
        mine={selectedMine}
        borehole={crossSectionBorehole || selectedMine.boreholes[0]}
        onSelectBorehole={(bh) => setCrossSectionBorehole(bh)}
      />

      <ScenarioSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        mine={selectedMine}
      />

      <ExecutiveReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        mine={selectedMine}
        predictionResult={predictionResult}
      />

      {/* Veo 3.1 Space & Pit Video Animator */}
      <VeoVideoAnimator
        isOpen={isVeoOpen}
        onClose={() => setIsVeoOpen(false)}
        mineName={selectedMine.name}
      />

      {/* Multi-turn Gemini Copilot with Google Search Grounding */}
      <GeminiMiningChatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        mine={selectedMine}
      />

      {/* Satellite Risk Assessment Details Modal */}
      <SatelliteRiskDetailsModal
        isOpen={isSatelliteAlertModalOpen}
        onClose={() => setIsSatelliteAlertModalOpen(false)}
        alert={satelliteAlert}
        assessment={satelliteAssessment}
        mine={selectedMine}
        onAcknowledge={handleAcknowledgeSatelliteAlert}
        onNavigateToMap={() => {
          const el = document.getElementById("section-satellite-reserve-map");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* Quick Floating Copilot Launcher when Chatbot is closed */}
      {!isChatbotOpen && (
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-full shadow-xl border border-cyan-400/40 transition hover:scale-105"
          title="Open Gemini Mining AI Copilot with Google Search Grounding"
        >
          <Sparkles className="w-4 h-4 text-cyan-200 animate-spin" />
          <span>Gemini Copilot</span>
        </button>
      )}
    </div>
  );
}
