import sqlite3
import os
from datetime import datetime
import uuid

DB_FILE = "emissions.db"

def get_connection():
    """Returns a connection to the SQLite database."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # Access columns by name
    return conn

def init_db():
    """Creates the emissions table if it doesn't exist."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS emissions (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            sector TEXT NOT NULL,
            source TEXT NOT NULL,
            activity_type TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit TEXT NOT NULL,
            co2_emission REAL NOT NULL
        )
    ''')
    # Create index for faster sector queries
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sector ON emissions(sector)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_timestamp ON emissions(timestamp)')
    conn.commit()
    conn.close()

# Initialize on module load
init_db()

def add_emission(sector, source, activity_type, quantity, unit, co2_emission, timestamp=None):
    """Adds a new emission record to the SQLite database."""
    conn = get_connection()
    cursor = conn.cursor()
    
    record = {
        "id": str(uuid.uuid4()),
        "timestamp": timestamp or datetime.now().isoformat(),
        "sector": sector,
        "source": source,
        "activity_type": activity_type,
        "quantity": quantity,
        "unit": unit,
        "co2_emission": round(co2_emission, 4)
    }
    
    cursor.execute('''
        INSERT INTO emissions (id, timestamp, sector, source, activity_type, quantity, unit, co2_emission)
        VALUES (:id, :timestamp, :sector, :source, :activity_type, :quantity, :unit, :co2_emission)
    ''', record)
    
    conn.commit()
    conn.close()
    return record

def get_all_emissions():
    """Returns all emission records from the database."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM emissions ORDER BY timestamp DESC')
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def get_emissions_by_sector(sector):
    """Returns emission records filtered by sector."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM emissions WHERE sector = ? ORDER BY timestamp DESC', (sector,))
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def get_summary():
    """Returns total emissions summary with sector breakdown using SQL aggregation."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Total emissions
    cursor.execute('SELECT COALESCE(SUM(co2_emission), 0) as total, COUNT(*) as count FROM emissions')
    total_row = cursor.fetchone()
    total = total_row['total']
    count = total_row['count']
    
    # Emissions by sector
    cursor.execute('SELECT sector, SUM(co2_emission) as sector_total FROM emissions GROUP BY sector')
    by_sector = {row['sector']: round(row['sector_total'], 4) for row in cursor.fetchall()}
    
    conn.close()
    
    return {
        "total_emissions": round(total, 4),
        "by_sector": by_sector,
        "count": count
    }

def get_daily_sector_data(sector):
    """Returns daily aggregated emission data for a sector (used for charts)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT SUBSTR(timestamp, 1, 10) as date, SUM(co2_emission) as daily_total 
        FROM emissions 
        WHERE sector = ?
        GROUP BY date 
        ORDER BY date ASC
    ''', (sector,))
    rows = [{"date": row['date'], "value": round(row['daily_total'], 4), "unit": "tCO2e"} for row in cursor.fetchall()]
    conn.close()
    return rows

def get_record_count():
    """Returns the total number of records in the database."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) as cnt FROM emissions')
    count = cursor.fetchone()['cnt']
    conn.close()
    return count

def has_historical_data():
    """Checks if there is historical data (records older than 2 hours)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT COUNT(*) as cnt FROM emissions 
        WHERE datetime(timestamp) < datetime('now', '-2 hours')
    ''')
    count = cursor.fetchone()['cnt']
    conn.close()
    return count > 0

def get_source_breakdown():
    """Returns total emissions grouped by source type (iot, public, manual)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT source, SUM(co2_emission) as total 
        FROM emissions 
        GROUP BY source
    ''')
    breakdown = {row['source']: round(row['total'], 4) for row in cursor.fetchall()}
    conn.close()
    return breakdown

def get_weekly_comparison():
    """Compares this week's emissions to last week's emissions."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # This week (last 7 days)
    cursor.execute('''
        SELECT COALESCE(SUM(co2_emission), 0) as total 
        FROM emissions 
        WHERE datetime(timestamp) >= datetime('now', '-7 days')
    ''')
    this_week = cursor.fetchone()['total']
    
    # Last week (7-14 days ago)
    cursor.execute('''
        SELECT COALESCE(SUM(co2_emission), 0) as total 
        FROM emissions 
        WHERE datetime(timestamp) >= datetime('now', '-14 days')
          AND datetime(timestamp) < datetime('now', '-7 days')
    ''')
    last_week = cursor.fetchone()['total']
    
    conn.close()
    
    change_pct = 0
    if last_week > 0:
        change_pct = ((this_week - last_week) / last_week) * 100
    
    return {
        "this_week": round(this_week, 4),
        "last_week": round(last_week, 4),
        "change_pct": round(change_pct, 1)
    }
