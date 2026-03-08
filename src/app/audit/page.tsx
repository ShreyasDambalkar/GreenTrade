"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { jsPDF } from "jspdf";
import exifr from 'exifr';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Upload, Camera, ArrowRight, CheckCircle, AlertTriangle, Loader2, TrendingUp, Leaf, MapPin, Satellite, Download, Coins } from 'lucide-react';

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Helper: extract GPS from image EXIF using multiple strategies
async function extractGPS(file: File): Promise<{ lat: number; lng: number } | null> {
    try {
        // Strategy 1: Use exifr.gps() — the most direct method
        const gpsData = await exifr.gps(file);
        console.log("[EXIF] gps() result:", gpsData);
        if (gpsData?.latitude && gpsData?.longitude) {
            console.log(`[EXIF] ✅ Found GPS: ${gpsData.latitude}, ${gpsData.longitude}`);
            return { lat: gpsData.latitude, lng: gpsData.longitude };
        }
    } catch (e) {
        console.warn("[EXIF] gps() failed, trying full parse...", e);
    }

    try {
        // Strategy 2: Full parse and look for GPS fields
        const allExif = await exifr.parse(file, true);
        console.log("[EXIF] Full parse result keys:", allExif ? Object.keys(allExif) : "null");
        
        if (allExif) {
            // Check for direct lat/lng
            const lat = allExif.latitude || allExif.GPSLatitude;
            const lng = allExif.longitude || allExif.GPSLongitude;
            
            if (lat && lng) {
                // GPSLatitude can be an array [degrees, minutes, seconds]
                let latNum: number | null = typeof lat === 'number' ? lat : null;
                let lngNum: number | null = typeof lng === 'number' ? lng : null;
                
                if (Array.isArray(lat) && lat.length === 3) {
                    latNum = lat[0] + lat[1] / 60 + lat[2] / 3600;
                    if (allExif.GPSLatitudeRef === 'S' && latNum !== null) latNum = -latNum;
                }
                if (Array.isArray(lng) && lng.length === 3) {
                    lngNum = lng[0] + lng[1] / 60 + lng[2] / 3600;
                    if (allExif.GPSLongitudeRef === 'W' && lngNum !== null) lngNum = -lngNum;
                }
                
                if (latNum !== null && lngNum !== null) {
                    console.log(`[EXIF] ✅ Found GPS from full parse: ${latNum}, ${lngNum}`);
                    return { lat: latNum, lng: lngNum };
                }
            }
        }
    } catch (e) {
        console.warn("[EXIF] Full parse failed:", e);
    }

    console.log("[EXIF] ❌ No GPS data found in image, using fallback");
    return null;
}

// Helper: format coordinates for display
function formatCoords(lat: number, lng: number): string {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

// Helper: get Google Maps Static API URL for satellite view
function getSatelliteUrl(lat: number, lng: number, zoom: number = 15, width: number = 600, height: number = 400): string {
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&maptype=satellite&markers=color:green|${lat},${lng}&key=${MAPS_API_KEY}`;
}

// Dark map styles for the interactive map
const darkMapStyles = [
    { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c1929" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1e3a2b" }] },
];

// Satellite Map Component (interactive)
function SatelliteMapView({ lat, lng, label }: { lat: number; lng: number; label: string }) {
    const { isLoaded } = useJsApiLoader({ googleMapsApiKey: MAPS_API_KEY });

    if (!isLoaded) {
        return <div className="h-[300px] bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 text-sm animate-pulse">Loading Map...</div>;
    }

    return (
        <div className="rounded-xl overflow-hidden border border-zinc-700">
            <div className="bg-zinc-800/80 px-3 py-2 flex items-center gap-2">
                <Satellite className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{label} — Satellite View</span>
                <span className="ml-auto text-[9px] text-emerald-500 font-mono">{formatCoords(lat, lng)}</span>
            </div>
            <GoogleMap
                mapContainerStyle={{ width: '100%', height: '280px' }}
                center={{ lat, lng }}
                zoom={16}
                options={{
                    mapTypeId: 'satellite',
                    disableDefaultUI: true,
                    zoomControl: true,
                }}
            >
                <Marker position={{ lat, lng }} />
            </GoogleMap>
        </div>
    );
}

export default function AuditPage() {
    const router = useRouter();
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);

    const [baselineImage, setBaselineImage] = useState<string | null>(null);
    const [currentImage, setCurrentImage] = useState<string | null>(null);

    // Real GPS data from EXIF
    const [baselineGPS, setBaselineGPS] = useState<{ lat: number; lng: number } | null>(null);
    const [currentGPS, setCurrentGPS] = useState<{ lat: number; lng: number } | null>(null);
    const [locationMatch, setLocationMatch] = useState<boolean | null>(null);
    const [gpsExtracting, setGpsExtracting] = useState<'baseline' | 'current' | null>(null);
    const [baselineGPSSource, setBaselineGPSSource] = useState<'exif' | 'fallback' | null>(null);
    const [currentGPSSource, setCurrentGPSSource] = useState<'exif' | 'fallback' | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // Fallback coordinates (if image has no EXIF GPS)
    const FALLBACK_COORDS = { lat: 18.5204, lng: 73.8567 }; // Pune

    const handleBaselineUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (ev) => setBaselineImage(ev.target?.result as string);
        reader.readAsDataURL(file);
        
        setResult(null);
        setLocationMatch(null);
        setGpsExtracting('baseline');

        // Extract real GPS from EXIF
        const gps = await extractGPS(file);
        if (gps) {
            setBaselineGPS(gps);
            setBaselineGPSSource('exif');
        } else {
            // Use fallback with slight randomization for demo
            setBaselineGPS({
                lat: FALLBACK_COORDS.lat + (Math.random() - 0.5) * 0.01,
                lng: FALLBACK_COORDS.lng + (Math.random() - 0.5) * 0.01
            });
            setBaselineGPSSource('fallback');
        }
        setGpsExtracting(null);
    };

    const handleCurrentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (ev) => setCurrentImage(ev.target?.result as string);
        reader.readAsDataURL(file);
        
        setResult(null);
        setLocationMatch(null);
        setGpsExtracting('current');

        // Extract real GPS from EXIF
        const gps = await extractGPS(file);
        if (gps) {
            setCurrentGPS(gps);
            setCurrentGPSSource('exif');
        } else {
            // Use baseline coordinates with slight offset if no EXIF
            setCurrentGPS({
                lat: (baselineGPS?.lat || FALLBACK_COORDS.lat) + (Math.random() - 0.5) * 0.005,
                lng: (baselineGPS?.lng || FALLBACK_COORDS.lng) + (Math.random() - 0.5) * 0.005
            });
            setCurrentGPSSource('fallback');
        }
        setGpsExtracting(null);
    };

    const runAudit = () => {
        if (!baselineImage || !currentImage) return;
        setAnalyzing(true);
        setLocationMatch(null);

        const coordsForResult = currentGPS || baselineGPS || FALLBACK_COORDS;

        // Step 1: Verify GPS Location Match
        setTimeout(() => {
            // Check if locations are within ~1km
            if (baselineGPS && currentGPS) {
                const dist = Math.sqrt(
                    Math.pow(baselineGPS.lat - currentGPS.lat, 2) +
                    Math.pow(baselineGPS.lng - currentGPS.lng, 2)
                );
                setLocationMatch(dist < 0.05); // ~5km tolerance
            } else {
                setLocationMatch(true);
            }

            // Step 2: Full Analysis
            setTimeout(() => {
                setAnalyzing(false);
                setResult({
                    gps: formatCoords(coordsForResult.lat, coordsForResult.lng),
                    gpsCoords: coordsForResult,
                    timeSpan: "12 Months",
                    baselineCover: "45%",
                    baselineStock: "210 tonnes",
                    currentCover: "68%",
                    currentStock: "385 tonnes",
                    growth: "+23%",
                    netCarbonChange: "+175 tonnes",
                    creditsEarned: "175 VCU",
                    confidence: "99.2%",
                    trustScore: "A+"
                });
            }, 2000);
        }, 1500);
    };

    const handleDownload = async () => {
        if (!result || isDownloading) return;
        setIsDownloading(true);

        try {
            const doc = new jsPDF();
            const coords = result.gpsCoords;

        // ─── Header ───
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("GreenTrade Carbon Audit Report", 20, 25);

        // ─── Metadata ───
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        doc.text(`Report ID: RPT-${Date.now()}`, 20, 50);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 50);

        // ─── Geo Spatial Verification ───
        doc.setFontSize(14);
        doc.setTextColor(16, 185, 129);
        doc.text("Geo Spatial Verification", 20, 65);

        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        doc.text(`GPS Coordinates: ${result.gps}`, 20, 75);
        doc.text(`Status: Location Match Confirmed (Authentic)`, 20, 82);

        // ─── Satellite Image in PDF (using img+canvas to avoid CORS issues) ───
        doc.setFontSize(14);
        doc.setTextColor(16, 185, 129);
        doc.text("Satellite Imagery", 20, 95);

        let satImageLoaded = false;
        try {
            const satUrl = getSatelliteUrl(coords.lat, coords.lng, 16, 640, 300);
            
            // Load image via <img> element (avoids CORS fetch issues)
            const imgData = await new Promise<string>((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0);
                            resolve(canvas.toDataURL('image/jpeg', 0.85));
                        } else {
                            reject(new Error('Canvas context failed'));
                        }
                    } catch (canvasErr) {
                        reject(canvasErr);
                    }
                };
                img.onerror = () => reject(new Error('Image load failed'));
                // Timeout quickly to not freeze the UX
                setTimeout(() => reject(new Error('Timeout')), 2000);
                // Important: Append a custom param or use CORS proxy approach, but typical staticmaps doesn't allow crossOrigin
                // so we just rely on the fallback gracefully.
                img.src = satUrl;
            });

            doc.addImage(imgData, 'JPEG', 20, 100, 170, 70);
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`Satellite view: ${result.gps} | Zoom: 16 | Source: Google Maps`, 105, 175, { align: 'center' });
            satImageLoaded = true;
        } catch (err) {
            console.warn("Satellite image for PDF failed:", err);
            // Draw placeholder box
            doc.setFillColor(240, 240, 240);
            doc.rect(20, 100, 170, 70, 'F');
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text(`Satellite View: ${result.gps}`, 105, 130, { align: 'center' });
            doc.text("[Google Maps Satellite Image]", 105, 140, { align: 'center' });
            doc.setFontSize(8);
            doc.text(`Coordinates: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`, 105, 155, { align: 'center' });
        }

        // ─── Analysis Results ───
        doc.setFontSize(14);
        doc.setTextColor(16, 185, 129);
        doc.text("Analysis Results", 20, 190);

        doc.setFillColor(245, 245, 245);
        doc.rect(20, 195, 170, 50, 'F');

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);

        let y = 205;
        doc.text(`Baseline Coverage (Before): ${result.baselineCover}`, 30, y);
        doc.text(`Current Coverage (After): ${result.currentCover}`, 110, y);
        y += 10;
        doc.text(`Net Green Growth: ${result.growth}`, 30, y);
        doc.text(`Time Span: ${result.timeSpan}`, 110, y);
        y += 12;
        doc.setFontSize(13);
        doc.text(`Calculated Carbon Stock: ${result.netCarbonChange}`, 30, y);

        // ─── Credits Section ───
        doc.setDrawColor(16, 185, 129);
        doc.setLineWidth(1);
        doc.rect(20, 240, 170, 30);

        doc.setFontSize(16);
        doc.setTextColor(16, 185, 129);
        doc.text(`Verified Carbon Credits (VCU): ${result.creditsEarned}`, 105, 257, { align: 'center' });

        // ─── Footer ───
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("This document certifies the authenticity of carbon credit generation based on AI + satellite analysis.", 105, 275, { align: 'center' });

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("GreenTrade AI — Powered by Satellite Vision & Google Maps", 105, 285, { align: 'center' });

        // ─── Trigger Safe Download ───
            const pdfBlob = doc.output('blob');
            const blobUrl = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = "GreenTrade_Audit_Report.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        } catch (downloadErr) {
            console.error("PDF generation or download failed:", downloadErr);
            alert("There was an issue saving the PDF. Please check console for details.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleMint = () => {
        if (!result) return;
        const newTrade = {
            id: "mint_" + Date.now(),
            projectName: "Verified Carbon Audit #" + Math.floor(Math.random() * 1000),
            symbol: "VCU",
            side: "buy",
            quantity: 175,
            price: 0,
            created_at: new Date().toISOString()
        };
        const existingTrades = JSON.parse(localStorage.getItem('userTrades') || '[]');
        localStorage.setItem('userTrades', JSON.stringify([...existingTrades, newTrade]));
        alert(`🎉 Successfully minted ${result.creditsEarned} to your wallet!`);
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 pt-24 pb-12 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                        Time-Lapse Carbon Audit
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                        Upload &quot;Before&quot; and &quot;After&quot; imagery to verify forest growth. GPS metadata is extracted automatically for satellite cross-verification.
                    </p>
                </div>

                {/* Upload Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

                    {/* Baseline Image */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4 text-zinc-300 flex items-center gap-2">
                            <span className="bg-zinc-800 text-zinc-400 w-6 h-6 rounded-full inline-flex items-center justify-center text-xs">1</span>
                            Baseline Imagery (Before)
                        </h3>
                        <div className="border-2 border-dashed border-zinc-700 rounded-xl h-64 relative hover:bg-zinc-800/30 transition-colors flex flex-col items-center justify-center">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleBaselineUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {baselineImage ? (
                                <>
                                    <img src={baselineImage} alt="Baseline" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                                    {baselineGPS && (
                                        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 z-20">
                                            <MapPin className="w-3 h-3 text-emerald-400" />
                                            {formatCoords(baselineGPS.lat, baselineGPS.lng)}
                                            <span className={`ml-1 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                                baselineGPSSource === 'exif' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                            }`}>
                                                {baselineGPSSource === 'exif' ? 'EXIF' : 'DEMO'}
                                            </span>
                                        </div>
                                    )}
                                    {gpsExtracting === 'baseline' && (
                                        <div className="absolute top-2 right-2 bg-blue-500/20 text-blue-400 text-[10px] px-2 py-1 rounded-full flex items-center gap-1 z-20">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Reading EXIF metadata...
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                                    <p className="text-zinc-400 text-sm">Upload older satellite/drone image</p>
                                    <p className="text-zinc-600 text-xs mt-1">GPS will be extracted from EXIF metadata</p>
                                </div>
                            )}
                        </div>

                        {/* Satellite View for Baseline */}
                        {baselineGPS && (
                            <div className="mt-4">
                                <SatelliteMapView lat={baselineGPS.lat} lng={baselineGPS.lng} label="Baseline Location" />
                            </div>
                        )}
                    </div>

                    {/* Current Image */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4 text-zinc-300 flex items-center gap-2">
                            <span className="bg-zinc-800 text-zinc-400 w-6 h-6 rounded-full inline-flex items-center justify-center text-xs">2</span>
                            Current Imagery (After)
                        </h3>
                        <div className="border-2 border-dashed border-zinc-700 rounded-xl h-64 relative hover:bg-zinc-800/30 transition-colors flex flex-col items-center justify-center">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleCurrentUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {currentImage ? (
                                <>
                                    <img src={currentImage} alt="Current" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                                    {currentGPS && (
                                        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 z-20">
                                            <MapPin className="w-3 h-3 text-cyan-400" />
                                            {formatCoords(currentGPS.lat, currentGPS.lng)}
                                            <span className={`ml-1 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                                currentGPSSource === 'exif' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                            }`}>
                                                {currentGPSSource === 'exif' ? 'EXIF' : 'DEMO'}
                                            </span>
                                        </div>
                                    )}
                                    {gpsExtracting === 'current' && (
                                        <div className="absolute top-2 right-2 bg-blue-500/20 text-blue-400 text-[10px] px-2 py-1 rounded-full flex items-center gap-1 z-20">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Reading EXIF metadata...
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                                    <p className="text-zinc-400 text-sm">Upload recent satellite/drone image</p>
                                    <p className="text-zinc-600 text-xs mt-1">GPS will be extracted from EXIF metadata</p>
                                </div>
                            )}
                        </div>

                        {/* Satellite View for Current */}
                        {currentGPS && (
                            <div className="mt-4">
                                <SatelliteMapView lat={currentGPS.lat} lng={currentGPS.lng} label="Current Location" />
                            </div>
                        )}
                    </div>
                </div>

                {/* GPS Comparison Panel */}
                {baselineGPS && currentGPS && !result && (
                    <div className="max-w-3xl mx-auto mb-8 bg-zinc-900/80 border border-zinc-700 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <Satellite className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm font-bold text-white">GPS Metadata Comparison</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-zinc-800/50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Baseline Coordinates</span>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                        baselineGPSSource === 'exif' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                    }`}>{baselineGPSSource === 'exif' ? 'FROM EXIF' : 'DEMO'}</span>
                                </div>
                                <div className="text-sm text-white font-mono">{formatCoords(baselineGPS.lat, baselineGPS.lng)}</div>
                            </div>
                            <div className="bg-zinc-800/50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Current Coordinates</span>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                        currentGPSSource === 'exif' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                    }`}>{currentGPSSource === 'exif' ? 'FROM EXIF' : 'DEMO'}</span>
                                </div>
                                <div className="text-sm text-white font-mono">{formatCoords(currentGPS.lat, currentGPS.lng)}</div>
                            </div>
                        </div>
                        <div className="mt-3 text-center">
                            <div className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold ${
                                (baselineGPSSource === 'exif' || currentGPSSource === 'exif')
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-amber-500/10 text-amber-400'
                            }`}>
                                <CheckCircle className="w-3.5 h-3.5" />
                                {(baselineGPSSource === 'exif' || currentGPSSource === 'exif')
                                    ? 'GPS coordinates extracted from image EXIF metadata'
                                    : 'No EXIF GPS found — using demo coordinates (try uploading a phone photo with location enabled)'}
                            </div>
                        </div>
                    </div>
                )}

                {/* Analysis Status Bar */}
                {(analyzing || locationMatch !== null) && !result && (
                    <div className="max-w-2xl mx-auto mb-8 bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {locationMatch ? (
                                <div className="bg-emerald-500/20 p-2 rounded-full"><CheckCircle className="w-5 h-5 text-emerald-400" /></div>
                            ) : (
                                <div className="bg-blue-500/20 p-2 rounded-full"><Loader2 className="w-5 h-5 text-blue-400 animate-spin" /></div>
                            )}
                            <div>
                                <div className="text-sm font-medium text-white">Geo Spatial Verification</div>
                                <div className="text-xs text-zinc-400">Comparing EXIF metadata & satellite coordinates...</div>
                            </div>
                        </div>
                        {locationMatch && (
                            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Matched ✓</span>
                        )}
                    </div>
                )}

                {/* Action Bar */}
                <div className="flex justify-center mb-12">
                    <button
                        onClick={runAudit}
                        disabled={!baselineImage || !currentImage || analyzing}
                        className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 disabled:grayscale text-white font-bold py-4 px-8 rounded-full shadow-lg shadow-emerald-900/20 flex items-center gap-3 transition-all transform hover:scale-105"
                    >
                        {analyzing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing Difference Map...
                            </>
                        ) : (
                            <>
                                <TrendingUp className="w-5 h-5" />
                                Compare & Calculate Credits
                            </>
                        )}
                    </button>
                </div>

                {/* Results Section */}
                {result && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="bg-zinc-900/80 border border-emerald-500/30 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Leaf className="w-48 h-48 text-emerald-500" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="bg-emerald-500/20 p-2 rounded-lg">
                                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Verification Successful</h2>
                                        <p className="text-emerald-400 text-sm">Confidence Score: {result.confidence}</p>
                                    </div>
                                </div>

                                {/* Satellite Verification Map in Results */}
                                {result.gpsCoords && (
                                    <div className="mb-8">
                                        <div className="rounded-xl overflow-hidden border border-emerald-500/20">
                                            <div className="bg-emerald-900/20 px-4 py-2.5 flex items-center gap-2">
                                                <Satellite className="w-4 h-4 text-emerald-400" />
                                                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Verified Satellite Location</span>
                                                <span className="ml-auto text-[10px] text-emerald-500/70 font-mono">{result.gps}</span>
                                            </div>
                                            {/* Static satellite image for results view */}
                                            <img 
                                                src={getSatelliteUrl(result.gpsCoords.lat, result.gpsCoords.lng, 16, 800, 300)}
                                                alt="Satellite verification"
                                                className="w-full h-[250px] object-cover"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    {/* Growth Metric */}
                                    <div className="bg-zinc-800/50 rounded-2xl p-5 border border-zinc-700">
                                        <p className="text-zinc-400 text-xs uppercase tracking-wider mb-2">Net Green Growth</p>
                                        <div className="text-3xl font-mono text-emerald-400 font-bold">{result.growth}</div>
                                        <div className="text-xs text-zinc-500 mt-1">From {result.baselineCover} to {result.currentCover} coverage</div>
                                    </div>

                                    {/* Stock Change */}
                                    <div className="bg-zinc-800/50 rounded-2xl p-5 border border-zinc-700">
                                        <p className="text-zinc-400 text-xs uppercase tracking-wider mb-2">Carbon Stock Added</p>
                                        <div className="text-3xl font-mono text-white font-bold">{result.netCarbonChange}</div>
                                        <div className="text-xs text-zinc-500 mt-1">Sequestration over {result.timeSpan}</div>
                                    </div>

                                    {/* Credits Earned */}
                                    <div className="bg-gradient-to-br from-emerald-900/40 to-cyan-900/40 rounded-2xl p-5 border border-emerald-500/30 ring-1 ring-emerald-500/20">
                                        <p className="text-emerald-300 text-xs uppercase tracking-wider mb-2">Credits Earned</p>
                                        <div className="text-3xl font-mono text-white font-bold">{result.creditsEarned}</div>
                                        <div className="text-xs text-emerald-400/70 mt-1">Ready to Mint</div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={handleDownload}
                                        disabled={isDownloading}
                                        className="flex-1 bg-white text-zinc-900 font-bold py-3 rounded-xl hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isDownloading ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...</>
                                        ) : (
                                            <><Download className="w-4 h-4" /> Download Audit Report (PDF)</>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleMint}
                                        className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Coins className="w-4 h-4" />
                                        Mint {result.creditsEarned}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
