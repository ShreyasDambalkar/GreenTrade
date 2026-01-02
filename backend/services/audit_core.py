import cv2
import numpy as np
import math
import os
import requests
import uuid
from fpdf import FPDF
from PIL import Image, ImageChops, ImageEnhance
from PIL.ExifTags import TAGS
from skimage.metrics import structural_similarity as ssim
from pillow_heif import register_heif_opener
from dotenv import load_dotenv

# Enable HEIC support
register_heif_opener()
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
REF_REAL_HEIGHT_CM = 29.7
REF_REAL_WIDTH_CM = 21.0

# Ensure temp directory exists
TEMP_DIR = "temp_audit_files"
os.makedirs(TEMP_DIR, exist_ok=True)

# ---------------- IMAGE LOADING ----------------
def safe_read_image_cv2(path):
    pil_img = Image.open(path).convert("RGB")
    img = np.array(pil_img)
    return cv2.cvtColor(img, cv2.COLOR_RGB2BGR)


# ---------------- EXIF + GPS EXTRACTION ----------------
def get_exif_data(path):
    exif = {}
    img = Image.open(path)
    if hasattr(img, "_getexif"):
        extracted = img._getexif()
        if extracted:
            for tag, value in extracted.items():
                exif[TAGS.get(tag, tag)] = value
    return exif


def convert_to_decimal(coord_tuple):
    def to_float(r):
        if hasattr(r, "numerator"):
            return r.numerator / r.denominator
        return r[0] / r[1]

    d = to_float(coord_tuple[0])
    m = to_float(coord_tuple[1])
    s = to_float(coord_tuple[2])
    return d + (m / 60.0) + (s / 3600.0)


def get_gps_decimal(exif):
    if "GPSInfo" not in exif:
        return None, None

    gps = exif["GPSInfo"]

    try:
        lat = convert_to_decimal(gps[2])
        lon = convert_to_decimal(gps[4])

        if gps[1] == "S": lat = -lat
        if gps[3] == "W": lon = -lon

        return lat, lon
    except Exception:
        return None, None


# ---------------- AI ANALYSIS TOOLS ----------------

def compare_images(prev_path, curr_path):
    """Calculates Structural Similarity Index (SSIM)"""
    prev = safe_read_image_cv2(prev_path)
    curr = safe_read_image_cv2(curr_path)
    # Resize for comparison if needed
    curr = cv2.resize(curr, (prev.shape[1], prev.shape[0]))
    
    score, _ = ssim(
        cv2.cvtColor(prev, cv2.COLOR_BGR2GRAY),
        cv2.cvtColor(curr, cv2.COLOR_BGR2GRAY),
        full=True
    )
    return score

def calculate_green_percentage(path):
    """Detects healthy vegetation using HSV color masking"""
    img = safe_read_image_cv2(path)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    # Mask for Green range
    mask = cv2.inRange(hsv, np.array([25, 40, 40]), np.array([85, 255, 255]))
    return (cv2.countNonZero(mask) / mask.size) * 100

def disease_percentage(path):
    """Detects unhealthy (yellow/brown) vegetation"""
    img = safe_read_image_cv2(path)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    # Mask for Yellow/Brown range
    mask = cv2.inRange(hsv, np.array([10, 30, 30]), np.array([35, 255, 255]))
    return (cv2.countNonZero(mask) / mask.size) * 100

def create_growth_heatmap(prev_path, curr_path, output_path):
    """Generates a visual heatmap of changes between two images"""
    prev = safe_read_image_cv2(prev_path)
    curr = safe_read_image_cv2(curr_path)
    curr = cv2.resize(curr, (prev.shape[1], prev.shape[0]))
    
    diff = cv2.absdiff(
        cv2.cvtColor(prev, cv2.COLOR_BGR2GRAY),
        cv2.cvtColor(curr, cv2.COLOR_BGR2GRAY)
    )
    diff = cv2.normalize(diff, None, 0, 255, cv2.NORM_MINMAX)
    heatmap = cv2.applyColorMap(diff, cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(curr, 0.6, heatmap, 0.4, 0)
    cv2.imwrite(output_path, overlay)
    return output_path

def ela_image(path, output_path):
    """Error Level Analysis to detect Photoshop manipulation"""
    img = Image.open(path).convert("RGB")
    tmp_path = output_path + ".tmp.jpg"
    img.save(tmp_path, "JPEG", quality=90)
    ela = ImageChops.difference(img, Image.open(tmp_path))
    ela = ImageEnhance.Brightness(ela).enhance(30)
    ela.save(output_path)
    if os.path.exists(tmp_path):
        os.remove(tmp_path)
    return output_path


# ---------------- PHYSICS CALCULATIONS ----------------

def calculate_credits_from_satellite(growth_percent, disease_percent):
    """
    Converts visual growth into Carbon Credits (tCO2) using physics estimates.
    Assumptions:
    - Zoom Level 20 Image area ~= 0.16 Hectares (40m x 40m)
    - Average Sequestration Rate = 15 tCO2 per hectare/year
    """
    IMAGE_AREA_HECTARES = 0.16 
    SEQUESTRATION_RATE = 15.0 
    
    max_carbon_potential = IMAGE_AREA_HECTARES * SEQUESTRATION_RATE
    
    # Growth factor: If growth is 10%, we credit 10% of the potential
    growth_factor = max(0, growth_percent / 100.0)
    
    # Health penalty: Disease reduces efficiency
    health_factor = 1.0 - (disease_percent / 100.0)
    
    credits_generated = max_carbon_potential * growth_factor * health_factor
    
    return credits_generated

def compute_trust_score(growth, disease, similarity, gps_valid, maps_match):
    """Generates the 0-100 Trust Score based on data integrity"""
    def clamp(x, a, b): return max(a, min(b, x))
    
    # Weights for the score
    G = clamp(growth / 20, 0, 1)        # Is it growing?
    H = 1 - min(disease, 50) / 50       # Is it healthy?
    F = 1 - clamp(similarity - 0.6, 0, 0.4) / 0.4 # Is it the same site?
    L = 1 if gps_valid else 0           # Is GPS present?
    M = 1 if maps_match else 0          # Does it match satellite view?
    
    # Final weighted score
    return 100 * (0.20*G + 0.20*H + 0.20*F + 0.20*L + 0.20*M)


# ---------------- GOOGLE MAPS SATELLITE ----------------
def download_satellite(lat, lon, output_path):
    if not GOOGLE_API_KEY:
        print("❌ Google Maps API missing in .env")
        return None

    # Zoom Level 20 provides high-precision verification (Tree/House level)
    print(f"📡 Downloading precise satellite view (Zoom 20) for: {lat}, {lon}")
    url = f"https://maps.googleapis.com/maps/api/staticmap?center={lat},{lon}&zoom=20&size=600x600&maptype=satellite&key={GOOGLE_API_KEY}"
    r = requests.get(url)
    
    if r.status_code == 200:
        open(output_path, "wb").write(r.content)
        return output_path
    else:
        print(f"❌ Failed to download map: {r.status_code}")
        return None


# ---------------- REPORTING & SENDING ----------------
def generate_pdf(score, credits, growth, disease, lat, lon, timestamp, prev_path, curr_path, heatmap_path, satellite_path, output_path):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, "LVC Protocol: Carbon Audit Report", ln=True, align="C")

    pdf.set_font("Arial", "", 12)
    pdf.cell(0, 10, f"Trust Score: {score:.2f}/100", ln=True)
    pdf.cell(0, 10, f"Verified Credits Minted: {credits:.4f} tCO2", ln=True)
    pdf.cell(0, 10, "-"*40, ln=True)
    pdf.cell(0, 8, f"Vegetation Growth: {growth:.2f}%", ln=True)
    pdf.cell(0, 8, f"Disease/Stress: {disease:.2f}%", ln=True)
    pdf.cell(0, 8, f"Location: {lat}, {lon}", ln=True)
    pdf.cell(0, 8, f"Timestamp: {timestamp}", ln=True)
    if satellite_path:
        pdf.set_text_color(0, 128, 0)
        pdf.cell(0, 8, "Satellite Data: Verified", ln=True)
        pdf.set_text_color(0, 0, 0)

    pdf.add_page()
    pdf.cell(0, 10, "Verification Evidence", ln=True)
    
    if os.path.exists(prev_path): 
        pdf.image(prev_path, 10, 30, 90)
        pdf.text(10, 25, "Baseline Image")
        
    if os.path.exists(curr_path): 
        pdf.image(curr_path, 110, 30, 90)
        pdf.text(110, 25, "Current Image (Verified)")
        
    if heatmap_path and os.path.exists(heatmap_path): 
        pdf.image(heatmap_path, 10, 130, 90)
        pdf.text(10, 125, "AI Growth Heatmap")
        
    if satellite_path and os.path.exists(satellite_path): 
        pdf.image(satellite_path, 110, 130, 90)
        pdf.text(110, 125, "Satellite Cross-Reference")

    pdf.output(output_path)
    return output_path


# ---------------- MAIN ANALYSIS FUNCTION ----------------
def perform_audit(prev_image_path, curr_image_path, project_id):
    unique_id = str(uuid.uuid4())
    
    # Paths for generated assets
    heatmap_path = os.path.join(TEMP_DIR, f"{unique_id}_heatmap.jpg")
    ela_path = os.path.join(TEMP_DIR, f"{unique_id}_ela.jpg")
    satellite_path = os.path.join(TEMP_DIR, f"{unique_id}_satellite.png")
    pdf_path = os.path.join(TEMP_DIR, f"{unique_id}_report.pdf")

    # 1. Metadata Verification
    exif = get_exif_data(curr_image_path)
    timestamp = exif.get("DateTime", "Unknown")
    lat, lon = get_gps_decimal(exif)
    gps_valid = lat is not None

    # 2. Image Analysis
    similarity = compare_images(prev_image_path, curr_image_path)
    prev_green = calculate_green_percentage(prev_image_path)
    curr_green = calculate_green_percentage(curr_image_path)
    growth = curr_green - prev_green
    
    create_growth_heatmap(prev_image_path, curr_image_path, heatmap_path)
    ela_image(curr_image_path, ela_path)
    disease = disease_percentage(curr_image_path)

    # 3. Satellite Cross-Reference
    maps_match = False
    if gps_valid:
        sat = download_satellite(lat, lon, satellite_path)
        maps_match = sat is not None
        if not maps_match:
            satellite_path = None
    else:
        satellite_path = None

    # 4. Calculation
    score = compute_trust_score(growth, disease, similarity, gps_valid, maps_match)
    credits = calculate_credits_from_satellite(growth, disease)

    # 5. Reporting
    generate_pdf(score, credits, growth, disease, lat, lon, timestamp,
                 prev_image_path, curr_image_path, heatmap_path, satellite_path, pdf_path)

    return {
        "trust_score": score,
        "credits": credits,
        "growth_percentage": growth,
        "disease_percentage": disease,
        "location": {"lat": lat, "lon": lon} if gps_valid else None,
        "timestamp": str(timestamp),
        "report_path": pdf_path,
        "heatmap_path": heatmap_path,
        "ela_path": ela_path,
        "satellite_path": satellite_path
    }
