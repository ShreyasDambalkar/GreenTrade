import random
import math
from datetime import datetime, timedelta
from .emission_calculator import calculate_emissions, convert_to_tonnes
from .db_manager import add_emission, get_all_emissions, has_historical_data, get_daily_sector_data

def seed_database_if_empty():
    """Seeds the database with 30 days of realistic data if history is missing."""
    if has_historical_data():
        return

    print("[SEED] Generating 30-day emission baseline...")
    start_date = datetime.now() - timedelta(days=30)
    sectors = ["Energy", "Transportation", "Manufacturing"]
    sources = ["iot", "public", "manual"]
    
    for i in range(31):
        day = start_date + timedelta(days=i)
        for sector in sectors:
            # Create natural-looking trends with seasonality and noise
            base_usage = 500
            seasonality = 200 * math.sin(i / 3)
            noise = random.uniform(-50, 50)
            usage = max(100, base_usage + seasonality + noise)
            
            if sector == "Energy":
                em_kg = calculate_emissions("energy", "electricity", usage)
                add_emission(sector, random.choice(sources), "Electricity Usage", round(usage, 2), "kWh", em_kg/1000, day.isoformat())
            elif sector == "Transportation":
                usage_fleet = usage * 10
                em_kg = calculate_emissions("transport", "diesel", usage_fleet)
                add_emission(sector, random.choice(sources), "Fleet Fuel", round(usage_fleet, 2), "Liters", em_kg/1000, day.isoformat())
            else:
                usage_man = usage * 5
                em_kg = calculate_emissions("energy", "electricity", usage_man)
                add_emission(sector, random.choice(sources), "Plant Power", round(usage_man, 2), "kWh", em_kg/1000, day.isoformat())
    
    print(f"[SEED] Baseline seeded with {31 * 3} records across 3 sectors.")

def simulate_iot_sensor_data():
    """Simulates real-time IoT sensor data and saves to DB."""
    usage = random.uniform(50, 150)
    emissions_kg = calculate_emissions("energy", "electricity", usage)
    tCO2e = convert_to_tonnes(emissions_kg)
    
    record = add_emission(
        sector="Energy",
        source="iot",
        activity_type="Real-time Sensor Reading",
        quantity=round(usage, 2),
        unit="kWh",
        co2_emission=tCO2e
    )
    
    return record

def fetch_public_transport_data():
    """Simulates fetching from public API (CO2 Signal / World Bank style) and saves to DB."""
    fuel_usage = random.uniform(2000, 5000)
    emissions_kg = calculate_emissions("transport", "diesel", fuel_usage)
    tCO2e = convert_to_tonnes(emissions_kg)
    
    record = add_emission(
        sector="Transportation",
        source="public",
        activity_type="Public Fleet Logs",
        quantity=round(fuel_usage, 2),
        unit="Liters",
        co2_emission=tCO2e
    )
    
    return record

def generate_monthly_baseline(sector="Energy"):
    """Returns daily aggregated historical records from the SQLite database for a sector."""
    return get_daily_sector_data(sector)
