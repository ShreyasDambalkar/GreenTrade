import React from "react";
import { Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface UploadSectionProps {
    projectId: string;
    setProjectId: (id: string) => void;
    onPrevImageChange: (file: File | null) => void;
    onCurrImageChange: (file: File | null) => void;
    onAnalyze: () => void;
    loading: boolean;
    prevImage: File | null;
    currImage: File | null;
}

export function UploadSection({
    projectId,
    setProjectId,
    onPrevImageChange,
    onCurrImageChange,
    onAnalyze,
    loading,
    prevImage,
    currImage,
}: UploadSectionProps) {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (f: File | null) => void) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    return (
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader>
                <CardTitle className="text-green-400 flex items-center gap-2">
                    <Upload className="w-5 h-5" /> Evidence Upload
                </CardTitle>
                <CardDescription className="text-zinc-400">
                    Upload baseline and current imagery for verification.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
                <div className="space-y-2">
                    <Label htmlFor="project-id" className="text-zinc-300">
                        Project ID
                    </Label>
                    <Input
                        id="project-id"
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        className="bg-zinc-950 border-zinc-800 text-white focus:ring-green-500/50 transition-all duration-300 focus:border-green-500/50"
                        placeholder="Enter Project ID..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Previous Image Input */}
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Previous Image</Label>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`border-2 border-dashed rounded-lg p-4 transition-all duration-300 cursor-pointer ${prevImage ? "border-green-500/50 bg-green-500/5" : "border-zinc-800 hover:border-green-500/30 hover:bg-zinc-900/80"
                                }`}
                        >
                            <div className="relative flex flex-col items-center justify-center h-32 gap-2 text-center">
                                {prevImage ? (
                                    <div className="relative w-full h-full">
                                        <img
                                            src={URL.createObjectURL(prevImage)}
                                            alt="Preview"
                                            className="w-full h-full object-cover rounded-md opacity-80"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md">
                                            <span className="text-xs text-green-400 font-medium truncate max-w-[90%]">{prevImage.name}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-zinc-600" />
                                        <span className="text-xs text-zinc-500">Click to upload baseline</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, onPrevImageChange)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Current Image Input */}
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Current Image</Label>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`border-2 border-dashed rounded-lg p-4 transition-all duration-300 cursor-pointer ${currImage ? "border-green-500/50 bg-green-500/5" : "border-zinc-800 hover:border-green-500/30 hover:bg-zinc-900/80"
                                }`}
                        >
                            <div className="relative flex flex-col items-center justify-center h-32 gap-2 text-center">
                                {currImage ? (
                                    <div className="relative w-full h-full">
                                        <img
                                            src={URL.createObjectURL(currImage)}
                                            alt="Preview"
                                            className="w-full h-full object-cover rounded-md opacity-80"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md">
                                            <span className="text-xs text-green-400 font-medium truncate max-w-[90%]">{currImage.name}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-zinc-600" />
                                        <span className="text-xs text-zinc-500">Click to upload evidence</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, onCurrImageChange)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>

                <Button
                    onClick={onAnalyze}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-6 text-lg shadow-lg shadow-green-900/20 border-0 transition-all duration-300 group-hover:shadow-green-900/40"
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Analyzing Satellite Data...</span>
                        </div>
                    ) : (
                        <span className="flex items-center gap-2">
                            Run Comprehensive Audit
                        </span>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
