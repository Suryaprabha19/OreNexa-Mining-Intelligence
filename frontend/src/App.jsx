import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import OverviewPage from "./pages/OverviewPage";
import ReservesPage from "./pages/ReservesPage";
import ProductionPage from "./pages/ProductionPage";
import HistoricPage from "./pages/HistoricPage";
import RiskPage from "./pages/RiskPage";
import CommandCenterPage from "./pages/CommandCenterPage";
import EquipmentPage from "./pages/EquipmentPage";
import MineDetailPage from "./pages/MineDetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<ProtectedRoute allow="/"><OverviewPage /></ProtectedRoute>} />
        <Route path="reserves" element={<ProtectedRoute allow="/reserves"><ReservesPage /></ProtectedRoute>} />
        <Route path="production" element={<ProtectedRoute allow="/production"><ProductionPage /></ProtectedRoute>} />
        <Route path="historic" element={<ProtectedRoute allow="/historic"><HistoricPage /></ProtectedRoute>} />
        <Route path="risk" element={<ProtectedRoute allow="/risk"><RiskPage /></ProtectedRoute>} />
        <Route path="command" element={<ProtectedRoute allow="/command"><CommandCenterPage /></ProtectedRoute>} />
        <Route path="equipment" element={<ProtectedRoute allow="/equipment"><EquipmentPage /></ProtectedRoute>} />
        <Route path="mine/:mineId" element={<ProtectedRoute allow="/mine"><MineDetailPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
