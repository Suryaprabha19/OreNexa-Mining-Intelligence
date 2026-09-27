import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import EquipmentHealthPanel from "../components/EquipmentHealthPanel";
import ReallocationPanel from "../components/ReallocationPanel";
import { getEquipmentHealth } from "../api/client";

export default function EquipmentPage() {
  const { selectedMine } = useOutletContext();
  const [equipment, setEquipment] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    getEquipmentHealth(selectedMine).then((eq) => {
      setEquipment(eq);
      setLoaded(true);
    });
  }, [selectedMine]);

  if (!loaded) return <div className="loading-state">Loading equipment data…</div>;

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="panel-eyebrow">LSTM time-series forecast · maintenance logs</span>
            <h2>Equipment Health</h2>
          </div>
          <span className="panel-note">{equipment.length} units{selectedMine ? "" : " across all mines"}</span>
        </div>
        <EquipmentHealthPanel equipment={equipment} />
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="panel-eyebrow">Genetic algorithm · cross-mine matching</span>
            <h2>Equipment Reallocation Optimizer</h2>
          </div>
        </div>
        <ReallocationPanel />
      </div>
    </>
  );
}
