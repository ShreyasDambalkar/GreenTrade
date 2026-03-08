import random
import time
from datetime import datetime, timedelta

def get_realtime_emissions():
    """
    Simulates real-time emission tracking for 3 sectors: 
    Energy, Transportation, and Manufacturing.
    """
    sectors = ["Energy", "Transportation", "Manufacturing"]
    data = []
    
    for sector in sectors:
        # Base emission values in tCO2e
        base_values = {
            "Energy": 120,
            "Transportation": 85,
            "Manufacturing": 150
        }
        
        # Add some random variance to simulate real-time changes
        variance = random.uniform(-5.0, 5.0)
        current_value = round(base_values[sector] + variance, 2)
        
        data.append({
            "sector": sector,
            "value": current_value,
            "unit": "tCO2e",
            "timestamp": datetime.now().isoformat(),
            "status": "Stable" if abs(variance) < 2 else ("Increasing" if variance > 0 else "Decreasing")
        })
        
    return data

def get_historical_data(sector, days=7):
    """
    Generates mock historical data for prediction modeling.
    """
    historical = []
    base_value = {
        "Energy": 120,
        "Transportation": 85,
        "Manufacturing": 150
    }.get(sector, 100)
    
    for i in range(days, 0, -1):
        date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        # Simulate a slight upward trend for testing
        trend = (days - i) * 0.5 
        value = base_value + trend + random.uniform(-2, 2)
        historical.append({"date": date, "value": round(value, 2)})
        
    return historical
