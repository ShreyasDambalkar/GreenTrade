from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import time
from services.tracking_service import get_realtime_emissions
from services.prediction_service import predict_emissions
from services.ingestion_service import simulate_iot_sensor_data, fetch_public_transport_data, generate_monthly_baseline, seed_database_if_empty
from services.emission_calculator import calculate_emissions, convert_to_tonnes
from services.db_manager import add_emission, get_all_emissions, get_summary, get_record_count, get_source_breakdown, get_weekly_comparison

router = APIRouter()

# Initialize DB on startup
seed_database_if_empty()

class ManualReport(BaseModel):
    category: str  # energy, transport, industry
    source: str    # electricity, petrol, diesel, etc.
    quantity: float
    unit: str
    sector: str = "Manufacturing"

LAST_SIMULATION = 0
SIMULATION_INTERVAL = 60

@router.get("/realtime")
async def realtime_tracking():
    """Returns real-time emission data from IoT sensors and public APIs."""
    global LAST_SIMULATION
    
    iot_update = None
    public_update = None
    
    if time.time() - LAST_SIMULATION > SIMULATION_INTERVAL:
        iot_update = simulate_iot_sensor_data()
        public_update = fetch_public_transport_data()
        LAST_SIMULATION = time.time()
        
    return {
        "success": True,
        "sectors": get_realtime_emissions(),
        "iot_update": iot_update,
        "public_update": public_update
    }

@router.get("/history/{sector}")
async def get_sector_history(sector: str):
    """Returns 1 month of daily-aggregated time-series data for a sector."""
    return {
        "success": True,
        "sector": sector,
        "history": generate_monthly_baseline(sector)
    }

@router.get("/summary")
async def get_emission_summary():
    """Returns total emissions summary and sector breakdown."""
    return {
        "success": True,
        "summary": get_summary(),
        "records_count": get_record_count()
    }

@router.get("/records")
async def get_recent_records(limit: int = 50):
    """Returns last N emission records from SQLite."""
    records = get_all_emissions()
    return {
        "success": True,
        "records": records[:limit]
    }

@router.get("/pie-data")
async def get_pie_chart_data():
    """Returns emission data formatted for pie chart visualization (by sector %)."""
    summary = get_summary()
    total = summary["total_emissions"]
    
    if total == 0:
        return {"success": True, "pie_data": []}
    
    pie_data = []
    colors = {"Energy": "#eab308", "Transportation": "#3b82f6", "Manufacturing": "#a855f7"}
    
    for sector, value in summary["by_sector"].items():
        pct = round((value / total) * 100, 1)
        pie_data.append({
            "sector": sector,
            "value": round(value, 2),
            "percentage": pct,
            "color": colors.get(sector, "#10b981")
        })
    
    return {
        "success": True,
        "total_emissions": round(total, 2),
        "pie_data": pie_data
    }

@router.get("/source-breakdown")
async def get_source_breakdown_data():
    """Returns emission breakdown by source type (IoT, Public, Manual)."""
    breakdown = get_source_breakdown()
    total = sum(breakdown.values()) if breakdown else 1
    
    colors = {"iot": "#10b981", "public": "#3b82f6", "manual": "#a855f7"}
    labels = {"iot": "IoT Sensors", "public": "Public Data", "manual": "Manual Reports"}
    
    source_data = []
    for source, value in breakdown.items():
        pct = round((value / total) * 100, 1) if total > 0 else 0
        source_data.append({
            "source": labels.get(source, source),
            "key": source,
            "value": round(value, 2),
            "percentage": pct,
            "color": colors.get(source, "#64748b")
        })
    
    return {
        "success": True,
        "source_data": source_data
    }

@router.get("/insights")
async def get_carbon_insights():
    """Returns carbon footprint equivalents and AI-style recommendations."""
    summary = get_summary()
    total_tonnes = summary["total_emissions"]
    total_kg = total_tonnes * 1000
    by_sector = summary["by_sector"]
    
    # --- Carbon Footprint Equivalents ---
    # 1 tree absorbs ~21 kg CO2/year
    trees_needed = round(total_kg / 21)
    # Average car emits ~0.21 kg CO2/km
    km_driven = round(total_kg / 0.21)
    # Average US home uses ~30 kWh/day → 30 * 0.82 = 24.6 kg CO2/day
    homes_powered = round(total_kg / 24.6, 1)
    # 1 flight NYC→London ≈ 986 kg CO2 per passenger
    flights = round(total_kg / 986, 1)
    
    equivalents = {
        "trees_needed": trees_needed,
        "km_driven": km_driven,
        "homes_powered_days": homes_powered,
        "flights_nyc_london": flights
    }
    
    # --- Carbon Credit Potential ---
    # 1 Carbon Credit = 1 tonne CO2
    carbon_credits = round(total_tonnes, 2)
    # Average voluntary credit price ≈ $15-50/tonne
    credit_value_low = round(carbon_credits * 15, 2)
    credit_value_high = round(carbon_credits * 50, 2)
    
    credits = {
        "total_credits": carbon_credits,
        "value_range_low": credit_value_low,
        "value_range_high": credit_value_high
    }
    
    # --- AI Recommendations ---
    recommendations = []
    total = summary["total_emissions"] or 1
    
    # Analyze sector proportions
    for sector, value in by_sector.items():
        pct = (value / total) * 100
        if sector == "Transportation" and pct > 40:
            recommendations.append({
                "severity": "high",
                "sector": "Transportation",
                "title": f"Transport emissions are {pct:.0f}% of total",
                "message": f"Switching 20% of fleet to EV could reduce {value * 0.2:.2f} tCO₂e/month.",
                "actions": [
                    "Transition to electric vehicles",
                    "Optimize logistics routes",
                    "Implement fuel efficiency programs"
                ]
            })
        elif sector == "Energy" and pct > 10:
            recommendations.append({
                "severity": "medium",
                "sector": "Energy",
                "title": f"Energy sector contributes {pct:.0f}%",
                "message": f"Solar panels could offset {value * 0.35:.2f} tCO₂e/month.",
                "actions": [
                    "Install renewable energy sources",
                    "Upgrade to energy-efficient equipment",
                    "Implement smart energy management"
                ]
            })
        elif sector == "Manufacturing":
            recommendations.append({
                "severity": "medium",
                "sector": "Manufacturing",
                "title": f"Manufacturing at {pct:.0f}% of total",
                "message": f"Process optimization could save {value * 0.15:.2f} tCO₂e/month.",
                "actions": [
                    "Adopt circular economy practices",
                    "Reduce waste in production",
                    "Switch to low-carbon raw materials"
                ]
            })
    
    # Weekly trend comparison
    weekly = get_weekly_comparison()
    if weekly["change_pct"] > 0:
        recommendations.append({
            "severity": "warning",
            "sector": "Overall",
            "title": f"Emissions increased {weekly['change_pct']:.1f}% vs last week",
            "message": f"This week: {weekly['this_week']:.2f}t vs Last week: {weekly['last_week']:.2f}t",
            "actions": [
                "Review recent operational changes",
                "Identify new emission sources",
                "Set weekly reduction targets"
            ]
        })
    elif weekly["change_pct"] < -5:
        recommendations.append({
            "severity": "positive",
            "sector": "Overall",
            "title": f"Emissions decreased {abs(weekly['change_pct']):.1f}% vs last week! 🎉",
            "message": f"This week: {weekly['this_week']:.2f}t vs Last week: {weekly['last_week']:.2f}t",
            "actions": [
                "Document what worked for future reference",
                "Set new ambitious targets",
                "Share success with stakeholders"
            ]
        })
    
    return {
        "success": True,
        "total_emissions_tonnes": round(total_tonnes, 2),
        "equivalents": equivalents,
        "credits": credits,
        "recommendations": recommendations
    }

@router.post("/report")
async def manual_report(report: ManualReport):
    """Manual reporting interface for emissions. Stores in SQLite database."""
    emissions_kg = calculate_emissions(report.category, report.source, report.quantity)
    if emissions_kg == 0 and report.quantity > 0:
        raise HTTPException(status_code=400, detail="Invalid category or source")
    
    tCO2e = convert_to_tonnes(emissions_kg)
    
    record = add_emission(
        sector=report.sector,
        source="manual",
        activity_type=f"{report.category.capitalize()} - {report.source}",
        quantity=report.quantity,
        unit=report.unit,
        co2_emission=tCO2e
    )
    
    return {
        "success": True,
        "record": record,
        "message": f"Successfully reported {tCO2e} tCO2e"
    }
