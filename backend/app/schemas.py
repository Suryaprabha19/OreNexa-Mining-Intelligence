from pydantic import BaseModel
from typing import List, Optional, Dict


class Mine(BaseModel):
    mine_id: str
    mine_name: str
    state: str
    latitude: float
    longitude: float
    mine_type: str
    active_since: int


class ReserveGridPoint(BaseModel):
    grid_id: str
    mine_id: str
    latitude: float
    longitude: float
    predicted_reserve_tonnes: float
    drilling_confidence: float
    ore_grade_pct: float
    rock_type: str
    soil_moisture_pct: float
    ndvi: float
    land_surface_temp_c: float
    rainfall_mm_monthly: float
    magnetic_anomaly_index: float


class ReserveSummary(BaseModel):
    mine_id: str
    mine_name: str
    total_predicted_reserve_tonnes: float
    avg_confidence: float
    grid_points: int


class ProductionTrendPoint(BaseModel):
    date: str
    planned_tonnes: float
    actual_tonnes: float
    shortfall_tonnes: float
    equipment_downtime_hours: float
    blasting_delay_hours: float
    rainfall_mm: float
    target_tonnes: Optional[float] = None
    is_manual: Optional[bool] = False


class DailyActualIn(BaseModel):
    mine_id: str
    date: str  # YYYY-MM-DD
    actual_tonnes: float
    equipment_downtime_hours: float = 0.0
    equipment_breakdowns: int = 0
    blasting_delay_hours: float = 0.0
    rainfall_mm: float = 0.0
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    labour_availability_pct: Optional[float] = None
    notes: Optional[str] = None


class DailyActualOut(BaseModel):
    mine_id: str
    date: str
    actual_tonnes: float
    equipment_downtime_hours: float
    equipment_breakdowns: int
    blasting_delay_hours: float
    rainfall_mm: float
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    labour_availability_pct: Optional[float] = None
    notes: Optional[str] = None
    entered_at: str


class MonthlyTargetIn(BaseModel):
    mine_id: str
    month: str  # YYYY-MM
    target_tonnes: float
    notes: Optional[str] = None


class MonthlyTargetOut(BaseModel):
    mine_id: str
    month: str
    target_tonnes: float
    notes: Optional[str] = None
    entered_at: str


class ShortfallRisk(BaseModel):
    mine_id: str
    mine_name: str
    date: str
    shortfall_probability: float
    predicted_shortfall_tonnes: float
    risk_level: str
    contributing_factors: Dict[str, float]


class EquipmentHealth(BaseModel):
    equipment_id: str
    mine_id: str
    equipment_type: str
    age_years: float
    overdue_days: int
    breakdown_risk_7d: float
    risk_level: str


class ReallocationMove(BaseModel):
    equipment_id: str
    equipment_type: str
    from_mine: str
    from_mine_name: str
    to_mine: str
    to_mine_name: str
    unit_risk: float
    covers_equipment_id: str
    covered_unit_risk: float


class ReallocationResult(BaseModel):
    moves: List[ReallocationMove]
    critical_units_identified: int
    critical_units_covered: int
    distance_km_moved: float
    summary: str


class Recommendation(BaseModel):
    priority: str
    category: str
    issue: str
    action: str
    trigger_rule: Optional[str] = None
    rule_key: Optional[str] = None
    rec_id: Optional[str] = None
    status: Optional[str] = "pending"
    status_updated_at: Optional[str] = None


class RecommendationActionRequest(BaseModel):
    status: str  # "authorized" | "dismissed" | "pending"


class RecommendationActionResponse(BaseModel):
    rec_id: str
    status: str
    updated_at: Optional[str] = None


class DashboardKPIs(BaseModel):
    mine_id: Optional[str]
    total_predicted_reserve_tonnes: float
    avg_daily_production_tonnes: float
    shortfall_rate_pct: float
    active_high_risk_mines: int
    total_mines: int


class SimulationRequest(BaseModel):
    mine_id: str
    equipment_downtime_hours: float
    equipment_breakdowns: int
    blasting_delay_hours: float
    rainfall_mm: float
    temperature_c: float = 30.0
    humidity_pct: float = 60.0
    labour_availability_pct: float = 90.0
    planned_tonnes: float = 400.0


class SimulationResult(BaseModel):
    shortfall_probability: float
    predicted_shortfall_tonnes: float
    predicted_actual_tonnes: float
    risk_level: str
    recommendations: List[Recommendation]


class DgmsCheck(BaseModel):
    id: str
    regulation_code: str
    category: str
    category_label: str
    title: str
    severity: str
    affected_asset_name: str
    current_telemetry_value: str
    statutory_threshold: str
    statutory_description: str
    immediate_action_required: str
    penalty_clause: str
    last_checked_time: str


class DgmsSummary(BaseModel):
    overall_score: int
    status: str
    critical_count: int
    warning_count: int
    compliant_count: int
    total_checks: int


class DgmsAuditResponse(BaseModel):
    mine_id: str
    mine_name: str
    checks: List[DgmsCheck]
    summary: DgmsSummary


class LifeOfMinePoint(BaseModel):
    year: int
    total_reserves_tonnes: float
    proved_reserves_tonnes: float
    accelerated_reserves_tonnes: float
    depletion_pct: float


class LifeOfMineResult(BaseModel):
    mine_id: str
    mine_name: str
    total_reserves_tonnes: float
    proved_reserves_tonnes: float
    probable_reserves_tonnes: float
    current_annual_rate_tonnes: float
    nameplate_annual_rate_tonnes: float
    effective_annual_rate_tonnes: float
    life_of_mine_years: float
    exhaustion_year_proved: int
    exhaustion_year_total: int
    scenario: str
    timeline: List[LifeOfMinePoint]
