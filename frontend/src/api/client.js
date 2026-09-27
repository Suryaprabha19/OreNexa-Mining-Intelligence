import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

export const getMines = () => api.get("/mines").then((r) => r.data);

export const getKpis = (mineId) =>
  api.get("/dashboard/kpis", { params: mineId ? { mine_id: mineId } : {} }).then((r) => r.data);

export const getTelemetry = (mineId) =>
  api.get("/telemetry", { params: mineId ? { mine_id: mineId } : {} }).then((r) => r.data);

export const getReserveMap = (mineId) =>
  api.get("/reserves/map", { params: mineId ? { mine_id: mineId } : {} }).then((r) => r.data);

export const getReserveSummary = () => api.get("/reserves/summary").then((r) => r.data);

export const getProductionTrend = (mineId, days = 120) =>
  api
    .get("/production/trend", { params: { ...(mineId ? { mine_id: mineId } : {}), days } })
    .then((r) => r.data);

export const getRisk = (mineId) =>
  api.get("/risk", { params: mineId ? { mine_id: mineId } : {} }).then((r) => r.data);

export const getRecommendations = (mineId) =>
  api.get("/recommendations", { params: mineId ? { mine_id: mineId } : {} }).then((r) => r.data);

export const getEquipmentHealth = (mineId) =>
  api.get("/equipment/health", { params: mineId ? { mine_id: mineId } : {} }).then((r) => r.data);

export const getReallocation = () => api.get("/optimize/reallocate").then((r) => r.data);

export const postRecommendationAction = (recId, status) =>
  api.post(`/recommendations/${recId}/action`, { status }).then((r) => r.data);

export const postSimulate = (payload) => api.post("/simulate", payload).then((r) => r.data);

export const postDailyActual = (payload) => api.post("/production/actuals", payload).then((r) => r.data);

export const getDailyActuals = (mineId) =>
  api.get("/production/actuals", { params: mineId ? { mine_id: mineId } : {} }).then((r) => r.data);

export const postMonthlyTarget = (payload) => api.post("/production/targets", payload).then((r) => r.data);

export const getMonthlyTargets = (mineId) =>
  api.get("/production/targets", { params: mineId ? { mine_id: mineId } : {} }).then((r) => r.data);

export const getDgmsCompliance = (mineId) =>
  api.get("/dgms/compliance", { params: { mine_id: mineId } }).then((r) => r.data);

export const getLifeOfMine = (mineId, scenario = "current") =>
  api.get("/reserves/life-of-mine", { params: { mine_id: mineId, scenario } }).then((r) => r.data);

export default api;
