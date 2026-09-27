"""
Corrective Action Recommendation Engine
-----------------------------------------
Rule-based expert system layered on top of ML predictions. Rather than a black
box, this keeps the recommendation logic transparent and auditable for mine
planners -- each rule fires on interpretable thresholds derived from the same
features the ML models use, and returns a priority + explanation + suggested
action + the literal trigger condition (for the "Why?" audit trail in the UI).

Each rule also carries a stable `rule_key` (e.g. "equipment_downtime_critical")
that does NOT depend on the day's exact numeric readings - this is what lets
the API give a persistent identity to "this class of issue at this mine" so
an Authorize/Dismiss action from a supervisor survives across days even
though the underlying numbers (and the human-readable trigger_rule text)
change daily.
"""
from typing import List, Dict


def generate_recommendations(latest: Dict, shortfall_prob: float, predicted_shortfall_tonnes: float) -> List[Dict]:
    """
    latest: dict with the most recent day's operating conditions for a mine
        (equipment_downtime_hours, equipment_breakdowns, blasting_delay_hours,
         rainfall_mm, labour_availability_pct, planned_tonnes)
    """
    recs = []

    downtime = latest.get("equipment_downtime_hours", 0)
    breakdowns = latest.get("equipment_breakdowns", 0)
    blasting_delay = latest.get("blasting_delay_hours", 0)
    rainfall = latest.get("rainfall_mm", 0)
    labour = latest.get("labour_availability_pct", 100)

    if downtime > 15 or breakdowns >= 2:
        recs.append({
            "priority": "High",
            "category": "Equipment",
            "rule_key": "equipment_downtime_critical",
            "issue": f"Equipment downtime is elevated ({downtime:.1f} hrs, {breakdowns} breakdown(s)).",
            "action": "Re-deploy standby excavator/dumper units from the nearest low-utilization mine and "
                      "prioritize preventive maintenance on units flagged as overdue.",
            "trigger_rule": f"equipment_downtime_hours ({downtime:.1f}) > 15 OR equipment_breakdowns ({breakdowns}) >= 2",
        })
    elif downtime > 6:
        recs.append({
            "priority": "Medium",
            "category": "Equipment",
            "rule_key": "equipment_downtime_moderate",
            "issue": f"Moderate equipment downtime detected ({downtime:.1f} hrs).",
            "action": "Schedule condition-based maintenance in the next shift window before it escalates.",
            "trigger_rule": f"equipment_downtime_hours ({downtime:.1f}) > 6",
        })

    if blasting_delay > 5:
        recs.append({
            "priority": "High",
            "category": "Blasting",
            "rule_key": "blasting_delay_critical",
            "issue": f"Blasting delays of {blasting_delay:.1f} hrs are cutting into face-availability time.",
            "action": "Shift blasting window to early shift and pre-clear approvals/explosive logistics a day ahead "
                       "to optimize the drill-blast-load cycle.",
            "trigger_rule": f"blasting_delay_hours ({blasting_delay:.1f}) > 5",
        })
    elif blasting_delay > 2.5:
        recs.append({
            "priority": "Medium",
            "category": "Blasting",
            "rule_key": "blasting_delay_moderate",
            "issue": f"Blasting delay of {blasting_delay:.1f} hrs is above baseline.",
            "action": "Review blast pattern and explosive charge sequencing with the blasting supervisor.",
            "trigger_rule": f"blasting_delay_hours ({blasting_delay:.1f}) > 2.5",
        })

    if rainfall > 40:
        recs.append({
            "priority": "High",
            "category": "Weather",
            "rule_key": "rainfall_critical",
            "issue": f"Heavy rainfall ({rainfall:.0f} mm) is likely to disrupt haul roads and open-pit faces.",
            "action": "Adjust the mine schedule to prioritize underground/covered faces and defer opencast "
                       "benching until drainage clears.",
            "trigger_rule": f"rainfall_mm ({rainfall:.0f}) > 40",
        })
    elif rainfall > 20:
        recs.append({
            "priority": "Medium",
            "category": "Weather",
            "rule_key": "rainfall_moderate",
            "issue": f"Rainfall of {rainfall:.0f} mm may slow haul-road cycle times.",
            "action": "Pre-position water pumps at low-lying haul roads and monitor road conditions hourly.",
            "trigger_rule": f"rainfall_mm ({rainfall:.0f}) > 20",
        })

    if labour < 80:
        recs.append({
            "priority": "Medium",
            "category": "Workforce",
            "rule_key": "labour_availability_low",
            "issue": f"Labour availability is at {labour:.0f}%.",
            "action": "Pull contract labour from the nearest mine's reserve pool for the next 2 shifts.",
            "trigger_rule": f"labour_availability_pct ({labour:.0f}) < 80",
        })

    if shortfall_prob > 0.6:
        recs.append({
            "priority": "High",
            "category": "Production Planning",
            "rule_key": "shortfall_probability_critical",
            "issue": f"Model estimates a {shortfall_prob*100:.0f}% chance of a shortfall event "
                      f"(~{predicted_shortfall_tonnes:.0f} t below plan).",
            "action": "Revise tomorrow's planned tonnage downward to a realistic target and pull forward "
                       "production from a lower-risk mine to cover the group-level target.",
            "trigger_rule": f"shortfall_classifier_probability ({shortfall_prob*100:.0f}%) > 60%",
        })
    elif shortfall_prob > 0.3:
        recs.append({
            "priority": "Medium",
            "category": "Production Planning",
            "rule_key": "shortfall_probability_elevated",
            "issue": f"Elevated shortfall risk ({shortfall_prob*100:.0f}%) for the next operating day.",
            "action": "Flag for shift supervisor review; keep a contingency buffer of ~5-8% on the daily plan.",
            "trigger_rule": f"shortfall_classifier_probability ({shortfall_prob*100:.0f}%) > 30%",
        })

    if not recs:
        recs.append({
            "priority": "Low",
            "category": "Status",
            "rule_key": "status_nominal",
            "issue": "No significant risk factors detected.",
            "action": "Continue standard operations; no corrective action required.",
            "trigger_rule": "All monitored thresholds (downtime, blasting delay, rainfall, labour, shortfall "
                            "probability) are within normal operating range.",
        })

    order = {"High": 0, "Medium": 1, "Low": 2}
    recs.sort(key=lambda r: order[r["priority"]])
    return recs
