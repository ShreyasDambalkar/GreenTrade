import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Leaf, FileText, MapPin, CheckCircle, Maximize2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { API_CONFIG } from "@/lib/config";

interface ResultCardProps {
    result: any;
    prevImage: File | null;
    currImage: File | null;
}

export function ResultCard({ result, prevImage, currImage }: ResultCardProps) {
    const trustScore = result.trust_score;
    const isHighTrust = trustScore > 70;

    // Calculate circumference for circular progress
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (trustScore / 100) * circumference;

    // Create cleanup for object URLs
    const [prevUrl, setPrevUrl] = useState<string>("");
    const [currUrl, setCurrUrl] = useState<string>("");

    useEffect(() => {
        if (prevImage) {
            const url = URL.createObjectURL(prevImage);
            setPrevUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [prevImage]);

    useEffect(() => {
        if (currImage) {
            const url = URL.createObjectURL(currImage);
            setCurrUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [currImage]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
        >
            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
                <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Audit Verification Complete
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Top Stats Row with Circular Indicator */}
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between p-4 bg-zinc-950/40 rounded-xl border border-zinc-800/50">
                        <div className="flex items-center gap-6">
                            {/* Circular Trust Score */}
                            <div className="relative w-20 h-20 flex items-center justify-center">
                                <svg className="transform -rotate-90 w-20 h-20">
                                    <circle
                                        cx="40"
                                        cy="40"
                                        r={radius}
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="transparent"
                                        className="text-zinc-800"
                                    />
                                    <motion.circle
                                        initial={{ strokeDashoffset: circumference }}
                                        animate={{ strokeDashoffset }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        cx="40"
                                        cy="40"
                                        r={radius}
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="transparent"
                                        strokeDasharray={circumference}
                                        strokeLinecap="round"
                                        className={isHighTrust ? "text-green-500" : "text-yellow-500"}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className={`text-xl font-bold ${isHighTrust ? "text-green-400" : "text-yellow-400"}`}>
                                        {trustScore.toFixed(0)}
                                    </span>
                                    <span className="text-[9px] uppercase text-zinc-500 font-semibold tracking-wider">Score</span>
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <span className="text-sm text-zinc-400">Verification Status</span>
                                <span className={`text-lg font-semibold ${isHighTrust ? "text-green-400" : "text-yellow-400"}`}>
                                    {isHighTrust ? "Verified & Trusted" : "Review Needed"}
                                </span>
                                <span className="text-xs text-zinc-500 mt-1">Based on satellite & visual analysis</span>
                            </div>
                        </div>

                        <div className="h-12 w-[1px] bg-zinc-800 hidden md:block" />

                        <div className="flex items-center gap-4 min-w-[140px]">
                            <div className="p-3 rounded-full bg-green-500/10 text-green-500">
                                <Leaf className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-sm text-zinc-400">Credits Minted</div>
                                <div className="text-2xl font-bold text-white">{result.credits.toFixed(4)} <span className="text-sm font-normal text-zinc-500">tCO2</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm text-zinc-400">Vegetation Growth</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${result.growth_percentage > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                    {result.growth_percentage > 0 ? 'Positive' : 'Negative'}
                                </span>
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {result.growth_percentage > 0 ? '+' : ''}
                                {result.growth_percentage.toFixed(1)}%
                            </div>
                        </div>

                        <div className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm text-zinc-400">Health / Disease</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${result.disease_percentage < 5 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                    {result.disease_percentage < 5 ? 'Healthy' : 'Risk Detected'}
                                </span>
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {result.disease_percentage.toFixed(1)}% <span className="text-sm font-normal text-zinc-500">affected</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-blue-400" />
                            <div>
                                <div className="text-sm text-zinc-200">GPS Location Detected</div>
                                <div className="text-xs text-zinc-500">Coordinates verified against project registry</div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className={`text-sm font-medium ${result.location ? "text-blue-400" : "text-zinc-500"}`}>
                                {result.location ? "Matched" : "Missing Data"}
                            </span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full h-12 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600 transition-all"
                        onClick={() => {
                            const link = document.createElement('a');
                            const filename = result.report_path.split('/').pop();
                            link.href = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REPORT}/${filename}`;
                            link.download = 'Audit_Report.pdf';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                    >
                        <FileText className="w-4 h-4 mr-2" /> Download Official Certification Report (PDF)
                    </Button>
                </CardContent>
            </Card>

            {/* Visual Evidence Preview */}
            <h3 className="text-lg font-semibold text-zinc-200 pl-1 mt-8 mb-4">Visual Evidence Chain</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Baseline */}
                <motion.div whileHover={{ y: -5 }} className="group">
                    <div className="rounded-xl overflow-hidden border border-zinc-800 relative shadow-lg bg-zinc-900 aspect-video">
                        {prevUrl && <img src={prevUrl} alt="Baseline" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" />}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                            <p className="text-white text-sm font-medium">Baseline Image</p>
                            <p className="text-zinc-400 text-xs text-nowrap truncate">{prevImage?.name}</p>
                        </div>
                        <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                            <Maximize2 className="w-4 h-4 text-white" />
                        </div>
                    </div>
                </motion.div>

                {/* Current */}
                <motion.div whileHover={{ y: -5 }} className="group">
                    <div className="rounded-xl overflow-hidden border border-zinc-800 relative shadow-lg bg-zinc-900 aspect-video">
                        {currUrl && <img src={currUrl} alt="Evidence" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" />}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                            <p className="text-white text-sm font-medium">New Evidence</p>
                            <p className="text-zinc-400 text-xs text-nowrap truncate">{currImage?.name}</p>
                        </div>
                        <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                            <Maximize2 className="w-4 h-4 text-white" />
                        </div>
                    </div>
                </motion.div>

                {/* Satellite */}
                {result.satellite_path && (
                    <motion.div whileHover={{ y: -5 }} className="group">
                        <div className="rounded-xl overflow-hidden border border-zinc-800 relative shadow-lg bg-zinc-900 aspect-video">
                            <img
                                src={`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REPORT}/${result.satellite_path.split('/').pop()}`}
                                alt="Satellite"
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                                <p className="text-blue-200 text-sm font-medium">Satellite Verification</p>
                                <p className="text-zinc-400 text-xs">Sentinel-2 / Landsat Data</p>
                            </div>
                            <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                <Maximize2 className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
