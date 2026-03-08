
# Emission Factors (IPCC/Standard sources)
# Values are in kg CO2e per unit

EMISSION_FACTORS = {
    "energy": {
        "electricity": 0.82,  # kg CO2e / kWh (requested factor)
        "natural_gas": 1.9,    # kg CO2e / m3
    },
    "transport": {
        "petrol": 2.31,        # kg CO2e / liter
        "diesel": 2.68,        # kg CO2e / liter
        "aviation_fuel": 2.5,   # kg CO2e / liter
    },
    "industry": {
        "steel": 1.85,         # kg CO2e / kg of steel
        "cement": 0.9,         # kg CO2e / kg of cement
    }
}

def calculate_emissions(category, source, quantity):
    """
    Calculates CO2 equivalent emissions.
    
    Args:
        category: 'energy', 'transport', 'industry'
        source: specific source (e.g., 'electricity', 'petrol')
        quantity: numeric value of usage
        
    Returns:
        float: total emissions in kg CO2e
    """
    try:
        factor = EMISSION_FACTORS.get(category, {}).get(source, 0)
        return round(quantity * factor, 4)
    except Exception:
        return 0.0

def convert_to_tonnes(kg_value):
    """Converts kg CO2e to Tonnes CO2e"""
    return round(kg_value / 1000, 4)
