import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import RiskPanel from "../components/RiskPanel";
import RecommendationsPanel from "../components/RecommendationsPanel";
import SimulatorPanel from "../components/SimulatorPanel";
import DgmsCompliancePanel from "../components/DgmsCompliancePanel";
import { getRisk, getRecommendations } from "../api/client";

export default function RiskPage() {
  const { selectedMine } = useOutletContext();
  const [risk, setRisk] = useState([]);
  const [recs, setRecs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const minesMeta = useOutletContext().mines || [];
  const mineName = minesMeta.find(m=>m.mine_id===selectedMine)?.mine_name || "Balaghat Mine (Bharweli)";

  useEffect(() => {
    setLoaded(false);
    Promise.all([getRisk(selectedMine), getRecommendations(selectedMine)]).then(([rk, rc]) => {
      setRisk(rk);
      setRecs(rc);
      setLoaded(true);
    });
  }, [selectedMine]);

  if (!loaded) return <div className="loading-state">Loading risk data…</div>;

  return (
    <>
      {/* DGMS — matches dump: Safety Index 74%, 4 checks, critical violation 5.6 mm/s */}
      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="panel-eyebrow">Mines Act 1952 / MMR 1961 — DGMS Tech Circ 7/1997</span>
            <h2>DGMS Statutory Compliance Check &amp; Violation Flags</h2>
          </div>
          <span className="panel-note">Last Sync: live • Ground Vibration, HEMM Fire AFDSS, Shaft Winder</span>
        </div>
        <DgmsCompliancePanel mineId={selectedMine} mineName={mineName} />
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="panel-eyebrow">Next operating day — AI Risk Engine</span>
              <h2>Shortfall Risk</h2>
            </div>
            <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>HIGH — Month-end 32,900 MT • Shortfall -4,900 MT (13.1%)</span>
          </div>
          <RiskPanel riskList={risk} selectedMine={selectedMine} />
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--line-soft)", display: "grid", gap: 6 }}>
            <div className="panel-note"><strong style={{ color: "var(--ink)" }}>Critical Constraints:</strong> Monsoon Runoff &amp; Haul Slush — 38mm 24h rain increased haul cycle 18→28 min • HEMM Fleet 76% — Shovel under repair, stope loading degraded</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="panel-eyebrow">Decision Support — Algorithmic + Gemini AI playbooks</span>
              <h2>Recommended Corrective Actions</h2>
            </div>
          </div>
          <RecommendationsPanel recommendations={recs} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="panel-eyebrow">What-if planning — single interactive simulator</span>
            <h2>Scenario Simulator</h2>
          </div>
          <span className="panel-note">Adjust operating conditions to stress-test tomorrow's plan • log is downloadable as CSV/Report</span>
        </div>
        <SimulatorPanel mineId={selectedMine} />
      </div>
    </>
  );
}
