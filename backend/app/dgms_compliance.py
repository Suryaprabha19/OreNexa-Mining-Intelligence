"""
DGMS (Directorate General of Mines Safety) Statutory Compliance Engine
------------------------------------------------------------------------
Evaluates a mine's current operating snapshot against real DGMS/Mines Act
1952 & Metalliferous Mines Regulations (MMR) 1961 safety thresholds:
ground vibration (PPV), HEMM fire/AFDSS, haul-ramp retarder safety,
underground winder-hoist certification, and pit-sump inundation risk.

This was ported over (and adapted to our data model) from a parallel
Gemini/AI-Studio exploration of the same problem statement found in the
project's Sample/ folder -- the regulation codes, thresholds, and penalty
clauses cited are real DGMS circulars and Mines Act / MMR 1961 provisions,
not invented.

HONESTY NOTE: MOIL's real seismograph, AFDSS pressure-sensor, and
winder-hoist telemetry feeds were not available for this build. Two of the
five categories below (Blasting/PPV and Underground Winder) use a
deterministic, mine+date-seeded synthetic proxy value in place of live
sensor data -- clearly labelled as such in each check's telemetry string,
so it's stable within a day (won't flicker on refresh) but isn't a real
sensor reading. The other three categories (HEMM Fire/AFDSS, Ramp/Retarder,
Pit Inundation) are derived from real fields already in the synthetic
dataset (equipment breakdown/age/downtime, and production rainfall +
geological soil-moisture), so they respond to genuinely changing data.
"""
import hashlib
from datetime import datetime, date as date_cls

from app.store import store


def _stable_pseudo(*parts, lo: float, hi: float) -> float:
    """Deterministic pseudo-random float in [lo, hi], seeded by the given parts."""
    h = hashlib.sha256("|".join(str(p) for p in parts).encode()).hexdigest()
    frac = int(h[:8], 16) / 0xFFFFFFFF
    return lo + frac * (hi - lo)


def _now_str() -> str:
    return datetime.now().strftime("%H:%M")


def _mk_check(id_, regulation_code, category, category_label, title, severity,
              affected_asset_name, current_telemetry_value, statutory_threshold,
              statutory_description, immediate_action_required, penalty_clause) -> dict:
    return {
        "id": id_, "regulation_code": regulation_code, "category": category,
        "category_label": category_label, "title": title, "severity": severity,
        "affected_asset_name": affected_asset_name,
        "current_telemetry_value": current_telemetry_value,
        "statutory_threshold": statutory_threshold,
        "statutory_description": statutory_description,
        "immediate_action_required": immediate_action_required,
        "penalty_clause": penalty_clause,
        "last_checked_time": _now_str(),
    }


def evaluate_dgms_compliance(mine_id: str) -> dict:
    mine = store.mine_row(mine_id)
    if mine is None:
        return {"checks": [], "summary": _summary([])}

    today = date_cls.today().isoformat()
    checks = []
    eq = store.equipment[store.equipment.mine_id == mine_id]

    # ---- 1. Blasting / Ground Vibration (PPV) ------------------------------
    ppv = round(_stable_pseudo(mine_id, today, "ppv", lo=2.2, hi=6.4), 2)
    threshold = 5.0
    if ppv > threshold:
        severity = "CRITICAL_VIOLATION"
    elif ppv >= threshold * 0.85:
        severity = "STATUTORY_WARNING"
    else:
        severity = "COMPLIANT"
    checks.append(_mk_check(
        f"dgms-blast-{mine_id}", "DGMS Tech Circular 7/1997 & MMR Reg 156",
        "BLASTING_VIBRATION", "Ground Vibration & Blasting",
        f"Peak Particle Velocity {'Exceedance' if severity == 'CRITICAL_VIOLATION' else 'Check'}: {mine.mine_name}",
        severity, f"Active blast round, {mine.mine_name}",
        f"{ppv} mm/s (simulated seismograph proxy -- no live sensor feed in this dataset)",
        f"Max {threshold:.1f} mm/s for structures within 300m",
        "DGMS mandates ground vibration (PPV) for structures within the danger zone must not exceed "
        "5.0 mm/s to prevent structural fatigue or micro-cracking.",
        ("Halt charging immediately. Redesign initiation pattern with electronic millisecond delays "
         "(>=17ms) and reduce Maximum Instantaneous Charge below 32 kg/delay.")
        if severity == "CRITICAL_VIOLATION" else
        ("Deploy tri-axial seismograph at the nearest mine-boundary structure and re-verify burden distance.")
        if severity == "STATUTORY_WARNING" else
        "Maintain current blast geometry and certified electronic delays.",
        "Mines Act 1952 Section 22: prohibitory order on blasting until DGMS re-clearance."
        if severity == "CRITICAL_VIOLATION" else
        "Statutory caution letter from Regional Inspector of Mines." if severity == "STATUTORY_WARNING" else
        "Fully compliant with MMR 1961 provisions.",
    ))

    # ---- 2. HEMM Fire Safety / AFDSS (excavators = this dataset's shovels) --
    shovels = eq[eq.equipment_type == "Excavator"].sort_values("date").groupby("equipment_id").tail(1)
    for _, s in shovels.iterrows():
        high_risk = bool(s.breakdown_flag) and s.age_years > 8
        moderate_risk = (bool(s.breakdown_flag) and s.age_years <= 8) or (not s.breakdown_flag and s.downtime_hours > 6)
        severity = "CRITICAL_VIOLATION" if high_risk else "STATUTORY_WARNING" if moderate_risk else "COMPLIANT"
        checks.append(_mk_check(
            f"dgms-fire-{s.equipment_id}", "DGMS Tech Circular 04/2013 & MMR Reg 181",
            "FIRE_AFDSS", "HEMM Fire Safety & AFDSS",
            f"{'Hydraulic Flash Fire Hazard' if severity == 'CRITICAL_VIOLATION' else 'AFDSS Status'}: {s.equipment_id}",
            severity, f"{s.equipment_id} (Excavator, {s.age_years:.1f}y old)",
            f"breakdown={'yes' if s.breakdown_flag else 'no'}, downtime={s.downtime_hours:.1f}h, age={s.age_years:.1f}y",
            "Zero pressurized hydraulic fluid discharge onto hot exhaust manifolds",
            "High-pressure hydraulic oil spray near diesel exhaust manifolds is the leading cause of "
            "catastrophic HEMM fires in Indian opencast mines.",
            ("Isolate master electrical disconnect. Inspect AFDSS nitrogen cylinder charge pressure "
             "(must read >120 bar). Tag out machine.") if severity == "CRITICAL_VIOLATION" else
            "Dispatch mobile lube maintenance crew with a thermal infrared scanner to check hose crimp integrity."
            if severity == "STATUTORY_WARNING" else
            "Continue routine daily pre-shift inspection log (Form II).",
            "Immediate grounding of machine under MMR 1961 Reg 181 fire-prevention orders."
            if severity == "CRITICAL_VIOLATION" else
            "Equipment hazard notice under DGMS Safety Management Plan." if severity == "STATUTORY_WARNING" else
            "Compliant with DGMS Technical Circular 04/2013.",
        ))

    # ---- 3. Haul Ramp & Retarder Safety (Dumpers) --------------------------
    dumpers = eq[eq.equipment_type == "Dumper"].sort_values("date").groupby("equipment_id").tail(1)
    for _, d in dumpers.iterrows():
        degraded = bool(d.breakdown_flag) and d.downtime_hours > 8
        severity = "CRITICAL_VIOLATION" if degraded else "COMPLIANT"
        checks.append(_mk_check(
            f"dgms-dmp-{d.equipment_id}", "MMR 1961 Reg 98(3) & DGMS Circular 02/2020",
            "RAMP_RETARDER", "Haul Road & Retarder Safety",
            f"{'Ramp Speed Degradation & Skidding Hazard' if degraded else 'Audio-Visual Alarm & Retarder Active'}: {d.equipment_id}",
            severity, f"{d.equipment_id} (Dumper, {d.age_years:.1f}y old)",
            f"breakdown={'yes' if d.breakdown_flag else 'no'}, downtime={d.downtime_hours:.1f}h",
            "Max ramp gradient 1:16 (1:10 short ramps); mandatory retarder efficiency",
            "Retarder/brake system faults on haul ramps sharply increase runaway-dumper risk on "
            "descending benches, especially in wet conditions.",
            ("Reduce payload to 80% until the brake system is inspected. Deploy a grader to improve "
             "ramp traction on the affected route.") if degraded else
            "Verify AVA (audio-visual alarm) and reverse-radar logbook entry before change of shift.",
            "MMR Reg 98 violation: suspension of haulage on this gradient until retarder is restored."
            if degraded else "Compliant with DGMS Circular No. 2 of 2020.",
        ))

    # ---- 4. Underground Winder Hoist (underground mines only) --------------
    if mine.mine_type == "Underground":
        latest_per_unit = eq.sort_values("date").groupby("equipment_id").tail(1)
        availability_pct = round(100 * (1 - latest_per_unit.breakdown_flag.mean()), 1) if len(latest_per_unit) else 100.0
        severity = "COMPLIANT" if availability_pct >= 90 else "STATUTORY_WARNING"
        checks.append(_mk_check(
            f"dgms-wnd-{mine_id}", "MMR 1961 Reg 79 & Reg 84 (Shaft Winding Equipment)",
            "UNDERGROUND_WINDER", "Underground Shaft & Winder Hoist",
            f"Shaft Hoist Brake Interlock & Overwind Trip: {mine.mine_name}",
            severity, f"{mine.mine_name} winder plant (fleet-availability proxy)",
            f"Fleet availability {availability_pct}% (proxy -- no dedicated winder telemetry feed)",
            "Daily automatic overwind-contrivance test & brake-arrest certificate",
            "MMR 1961 Reg 84 mandates a daily statutory test of the Lilly speed governor, slack-rope "
            "detection, and dual-caliper deadweight brake emergency trip.",
            "Log the shift statutory winder certificate in the DGMS Winding Logbook (Form V)."
            if severity == "COMPLIANT" else
            "Conduct non-destructive testing on the winder drum shaft and verify caliper brake lining thickness.",
            "Compliant." if severity == "COMPLIANT" else
            "MMR Reg 79: immediate prohibition of man-riding if trip mechanisms fail test.",
        ))

    # ---- 5. Pit Inundation & Sump Dewatering --------------------------------
    prod = store.production[store.production.mine_id == mine_id].sort_values("date")
    latest_rainfall = float(prod.iloc[-1].rainfall_mm) if len(prod) else 0.0
    geo_mine = store.geo[store.geo.mine_id == mine_id]
    avg_soil_moisture = float(geo_mine.soil_moisture_pct.mean()) if len(geo_mine) else 0.0
    is_rain_high = latest_rainfall > 40
    is_soil_saturated = avg_soil_moisture > 32
    if is_rain_high and is_soil_saturated:
        severity = "CRITICAL_VIOLATION"
    elif is_rain_high or is_soil_saturated:
        severity = "STATUTORY_WARNING"
    else:
        severity = "COMPLIANT"
    checks.append(_mk_check(
        f"dgms-sump-{mine_id}", "DGMS Tech Circular 02/2015 & MMR Reg 115",
        "PIT_SUMP_ELECTRICAL", "Inundation & Sump Dewatering",
        "Pit Inundation & High-Voltage Cable Submersion Risk",
        severity, f"Pit sump, {mine.mine_name}",
        f"Rainfall (latest day): {latest_rainfall:.0f} mm - Avg soil moisture: {avg_soil_moisture:.1f}%",
        "Sump capacity must maintain a 48h emergency reserve buffer above the pump deck",
        "High water ingress threatens electrical substation switchgear and destabilizes the toe of "
        "opencast benches; submerged trailing cables present severe electrocution hazards under MMR Reg 115.",
        ("Elevate trailing cables on wooden trestles (>1.5m above water). Commission a standby "
         "high-head pump and dig a peripheral storm cut-off garland drain.") if severity != "COMPLIANT" else
        "Continue routine sump-level monitoring per shift.",
        "Statutory order to withdraw personnel from the pit floor under MMR Reg 115 due to danger of inundation."
        if severity == "CRITICAL_VIOLATION" else
        "Heightened monitoring advisory." if severity == "STATUTORY_WARNING" else "Compliant.",
    ))

    return {"checks": checks, "summary": _summary(checks)}


def _summary(checks) -> dict:
    critical = sum(1 for c in checks if c["severity"] == "CRITICAL_VIOLATION")
    warning = sum(1 for c in checks if c["severity"] == "STATUTORY_WARNING")
    compliant = sum(1 for c in checks if c["severity"] == "COMPLIANT")
    total = len(checks)
    score = max(20, min(100, 100 - critical * 18 - warning * 8))
    status = "CRITICAL_ACTION_REQUIRED" if critical > 0 else "STATUTORY_CAUTION" if warning > 0 else "FULLY_COMPLIANT"
    return {
        "overall_score": score, "status": status, "critical_count": critical,
        "warning_count": warning, "compliant_count": compliant, "total_checks": total,
    }
