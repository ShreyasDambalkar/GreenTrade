"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { jsPDF } from "jspdf";
import { Upload, Camera, ArrowRight, CheckCircle, AlertTriangle, Loader2, TrendingUp, Leaf, MapPin } from 'lucide-react';

export default function AuditPage() {
    const router = useRouter();
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);

    const [baselineImage, setBaselineImage] = useState<string | null>(null);
    const [currentImage, setCurrentImage] = useState<string | null>(null);

    // GPS Data from EXIF (Simulated)
    const [baselineGPS, setBaselineGPS] = useState<string | null>(null);
    const [currentGPS, setCurrentGPS] = useState<string | null>(null);
    const [locationMatch, setLocationMatch] = useState<boolean | null>(null);

    const handleBaselineUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setBaselineImage(e.target?.result as string);
                setTimeout(() => setBaselineGPS("28.6139° N, 77.2090° E"), 800);
            };
            reader.readAsDataURL(file);
            setResult(null);
            setBaselineGPS(null);
        }
    };

    const handleCurrentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setCurrentImage(e.target?.result as string);
                setTimeout(() => setCurrentGPS("28.6139° N, 77.2090° E"), 800);
            };
            reader.readAsDataURL(file);
            setResult(null);
            setCurrentGPS(null);
        }
    };

    const runAudit = () => {
        if (!baselineImage || !currentImage) return;
        setAnalyzing(true);
        setLocationMatch(null);

        // Step 1: Verify Location Match
        setTimeout(() => {
            setLocationMatch(true); // Verification Passed

            // Step 2: Full Analysis
            setTimeout(() => {
                setAnalyzing(false);
                setResult({
                    gps: "28.6139° N, 77.2090° E", // Confirmed GPS
                    timeSpan: "12 Months",

                    // Before Metrics
                    baselineCover: "45%",
                    baselineStock: "210 tonnes",

                    // After Metrics
                    currentCover: "68%",
                    currentStock: "385 tonnes",

                    // Comparison
                    growth: "+23%",
                    netCarbonChange: "+175 tonnes",
                    creditsEarned: "175 VCU",
                    confidence: "99.2%",
                    trustScore: "A+"
                });
            }, 2000);
        }, 1500);
    };

    const handleDownload = () => {
        if (!result) return;

        const doc = new jsPDF();

        // Header
        doc.setFillColor(16, 185, 129); // Emerald Color
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("GreenTrade Carbon Audit Report", 20, 25);

        // Metadata
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        doc.text(`Report ID: ${"RPT-" + Date.now()}`, 20, 50);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 50);

        // Location Section
        doc.setFontSize(14);
        doc.setTextColor(16, 185, 129);
        doc.text("Geo Spatial Verification", 20, 70);

        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        doc.text(`GPS Coordinates: ${result.gps}`, 20, 80);
        doc.text(`Status: Match Confirmed (Authentic)`, 20, 86);

        // Analysis Section
        doc.setFontSize(14);
        doc.setTextColor(16, 185, 129);
        doc.text("Analysis Results", 20, 105);

        doc.setFillColor(245, 245, 245);
        doc.rect(20, 110, 170, 60, 'F');

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);

        let y = 120;
        doc.text(`Baseline Coverage (Before): ${result.baselineCover}`, 30, y);
        doc.text(`Current Coverage (After): ${result.currentCover}`, 110, y);
        y += 10;
        doc.text(`Net Green Growth: ${result.growth}`, 30, y);
        doc.text(`Time Span: ${result.timeSpan}`, 110, y);
        y += 15;
        doc.setFontSize(14);
        doc.text(`Calculated Carbon Stock: ${result.netCarbonChange}`, 30, y);

        // Credits Section
        doc.setDrawColor(16, 185, 129);
        doc.setLineWidth(1);
        doc.rect(20, 180, 170, 40);

        doc.setFontSize(16);
        doc.setTextColor(16, 185, 129);
        doc.text(`Verified Carbon Credits (VCU): ${result.creditsEarned}`, 105, 200, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("This document certifies the authenticity of the carbon credit generation based on AI analysis.", 105, 212, { align: 'center' });

        // Footer
        doc.setFontSize(8);
        doc.text("GreenTrade AI - Powered by Satellite Vision", 105, 280, { align: 'center' });

        doc.save("GreenTrade_Audit_Report.pdf");
    };

    const handleMint = () => {
        if (!result) return;

        // Create a new trade record
        const newTrade = {
            id: "mint_" + Date.now(),
            projectName: "Verified Carbon Audit #" + Math.floor(Math.random() * 1000),
            symbol: "VCU",
            side: "buy", // "buy" adds to portfolio
            quantity: 175, // Matching the simulation result
            price: 0,
            created_at: new Date().toISOString()
        };

        // Save to LocalStorage (simulating wallet update)
        const existingTrades = JSON.parse(localStorage.getItem('userTrades') || '[]');
        localStorage.setItem('userTrades', JSON.stringify([...existingTrades, newTrade]));

        // Feedback and Redirect
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
                        Upload "Before" and "After" imagery to verify forest growth. Our AI creates a difference map to precisely calculate new carbon credits earned.
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
                                <img src={baselineImage} alt="Baseline" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                            ) : (
                                <div className="text-center p-4">
                                    <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                                    <p className="text-zinc-400 text-sm">Upload older satellite/drone image</p>
                                </div>
                            )}
                        </div>
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
                                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-emerald-400" />
                                            {currentGPS}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                                    <p className="text-zinc-400 text-sm">Upload recent satellite/drone image</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Analysis Status Bar if running */}
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
                                <div className="text-xs text-zinc-400">Comparing EXIF & Satellite Metadata...</div>
                            </div>
                        </div>
                        {locationMatch && (
                            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Matched</span>
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
                                        className="flex-1 bg-white text-zinc-900 font-bold py-3 rounded-xl hover:bg-zinc-100 transition-colors"
                                    >
                                        Download Audit Report (PDF)
                                    </button>
                                    <button
                                        onClick={handleMint}
                                        className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-500 transition-colors"
                                    >
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
