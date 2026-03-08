"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Truck, 
  Factory, 
  Globe, 
  Zap,
  PlusCircle,
  Database,
  Cpu,
  BarChart3,
  History,
  LayoutDashboard,
  TreePine,
  Car,
  Home,
  Plane,
  Brain,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Coins,
  ArrowUpRight,
  Wifi
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedLineChart } from './AnimatedLineChart';
import { PieChart } from './PieChart';
import { EmissionMap } from './EmissionMap';
import { MapPin } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/tracking';

// ─── Memoized Sub-components ───────────────────────────

const SummaryCard = React.memo(({ summary }: { summary: any }) => (
  <Card className="bg-emerald-500/10 border-emerald-500/20">
    <CardContent className="pt-6">
      <div className="text-xs text-emerald-500 font-bold uppercase mb-1">Total Period Emissions</div>
      <div className="text-3xl font-black text-white">{summary?.total_emissions?.toFixed(2) || "0.00"}</div>
      <div className="text-[10px] text-emerald-500/70 font-mono italic">Tonnes CO₂e</div>
    </CardContent>
  </Card>
));

const SectorAllocation = React.memo(({ summary }: { summary: any }) => (
  <Card className="bg-slate-900/40 border-white/5 border-2">
    <CardHeader>
      <CardTitle className="text-sm flex items-center gap-2">
        <LayoutDashboard className="w-4 h-4 text-emerald-400" /> Sector Allocation
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {summary && Object.entries(summary.by_sector).map(([sector, val]: any) => (
        <div key={sector} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">{sector}</span>
            <span className="text-white font-bold">{val.toFixed(2)} t</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(val / summary.total_emissions) * 100}%` }}
              className={`h-full ${sector === 'Energy' ? 'bg-yellow-500' : sector === 'Transportation' ? 'bg-blue-500' : 'bg-purple-500'}`}
            />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
));

const DataFeed = React.memo(({ iotData, publicData }: { iotData: any, publicData: any }) => (
  <div className="space-y-4">
    <Card className="bg-slate-900/60 border-white/5 border-2">
      <CardHeader className="py-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" /> IoT Pulse
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {iotData ? (
          <div className="flex justify-between items-end">
            <div>
              <div className="text-lg font-bold text-white">{iotData.quantity} {iotData.unit}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-tight">{iotData.activity_type}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-emerald-500">+{iotData.co2_emission} t</div>
            </div>
          </div>
        ) : <p className="text-xs text-slate-500">Syncing...</p>}
      </CardContent>
    </Card>
    
    <Card className="bg-slate-900/60 border-white/5 border-2">
      <CardHeader className="py-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" /> Public API Link
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {publicData ? (
          <div className="flex justify-between items-end">
            <div>
              <div className="text-lg font-bold text-white">{publicData.quantity} L</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-tight">CO2 Signal API Match</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-blue-500">+{publicData.co2_emission} t</div>
            </div>
          </div>
        ) : <p className="text-xs text-slate-500">Fetching...</p>}
      </CardContent>
    </Card>
  </div>
));

const RecordsTable = React.memo(({ records }: { records: any[] }) => (
  <Card className="bg-slate-900/40 border-white/5 border-2">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-white">
        <History className="w-5 h-5 text-slate-400" /> Activity History (Last 10)
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="p-4 text-slate-400 font-medium">Timestamp</th>
              <th className="p-4 text-slate-400 font-medium">Sector</th>
              <th className="p-4 text-slate-400 font-medium">Source</th>
              <th className="p-4 text-slate-400 font-medium">Activity</th>
              <th className="p-4 text-slate-400 font-medium text-right">CO₂ Emission</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 text-slate-500 font-mono italic">{new Date(r.timestamp).toLocaleString()}</td>
                <td className="p-4 text-zinc-100">{r.sector}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    r.source === 'iot' ? 'bg-emerald-500/10 text-emerald-500' :
                    r.source === 'public' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                  }`}>{r.source}</span>
                </td>
                <td className="p-4 text-slate-400">{r.activity_type} ({r.quantity} {r.unit})</td>
                <td className="p-4 text-right font-bold text-white">{r.co2_emission} t</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
));

// ─── Carbon Footprint Impact Panel ──────────────────────

const CarbonImpactPanel = React.memo(({ equivalents, totalEmissions }: { equivalents: any, totalEmissions: number }) => (
  <Card className="bg-gradient-to-br from-emerald-950/50 to-slate-900/50 border-emerald-500/20 border-2 overflow-hidden relative">
    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
    <CardHeader>
      <CardTitle className="text-white flex items-center gap-2">
        <Globe className="w-5 h-5 text-emerald-400" /> Carbon Footprint Impact
      </CardTitle>
      <CardDescription>Real-world equivalents of your total emissions</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-center mb-6">
        <div className="text-4xl font-black text-emerald-400">{totalEmissions?.toFixed(2)}</div>
        <div className="text-xs text-emerald-500/70 uppercase tracking-widest mt-1">Tonnes CO₂e Total</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/5 rounded-xl p-4 text-center border border-white/5"
        >
          <Car className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <div className="text-xl font-black text-white">{equivalents?.km_driven?.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 uppercase">km driven by car</div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white/5 rounded-xl p-4 text-center border border-white/5"
        >
          <TreePine className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <div className="text-xl font-black text-white">{equivalents?.trees_needed?.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 uppercase">Trees to offset</div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white/5 rounded-xl p-4 text-center border border-white/5"
        >
          <Home className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <div className="text-xl font-black text-white">{equivalents?.homes_powered_days}</div>
          <div className="text-[10px] text-slate-500 uppercase">Homes powered (days)</div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white/5 rounded-xl p-4 text-center border border-white/5"
        >
          <Plane className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <div className="text-xl font-black text-white">{equivalents?.flights_nyc_london}</div>
          <div className="text-[10px] text-slate-500 uppercase">NYC→London flights</div>
        </motion.div>
      </div>
    </CardContent>
  </Card>
));

// ─── AI Recommendations Panel ───────────────────────────

const AIRecommendations = React.memo(({ recommendations }: { recommendations: any[] }) => (
  <Card className="bg-gradient-to-br from-indigo-950/50 to-slate-900/50 border-indigo-500/20 border-2">
    <CardHeader>
      <CardTitle className="text-white flex items-center gap-2">
        <Brain className="w-5 h-5 text-indigo-400 animate-pulse" /> AI Carbon Insights
      </CardTitle>
      <CardDescription>Intelligent recommendations based on emission patterns</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {recommendations && recommendations.length > 0 ? recommendations.map((rec, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15 }}
          className={`rounded-xl p-4 border ${
            rec.severity === 'high' ? 'bg-red-500/5 border-red-500/20' :
            rec.severity === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
            rec.severity === 'positive' ? 'bg-emerald-500/5 border-emerald-500/20' :
            'bg-blue-500/5 border-blue-500/20'
          }`}
        >
          <div className="flex items-start gap-3">
            {rec.severity === 'high' ? <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" /> :
             rec.severity === 'warning' ? <TrendingUp className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" /> :
             rec.severity === 'positive' ? <TrendingDown className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" /> :
             <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />}
            <div className="flex-1">
              <div className="text-xs font-black text-white mb-1">{rec.title}</div>
              <div className="text-[11px] text-slate-400 mb-2">{rec.message}</div>
              <div className="space-y-1">
                {rec.actions?.map((action: string, j: number) => (
                  <div key={j} className="text-[10px] text-slate-500 flex items-center gap-1.5">
                    <ArrowUpRight className="w-3 h-3 text-indigo-400" />
                    {action}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )) : (
        <div className="text-center text-slate-600 text-xs py-4">Analyzing emission patterns...</div>
      )}
    </CardContent>
  </Card>
));

// ─── Source Breakdown Bar Chart ──────────────────────────

const SourceBreakdown = React.memo(({ sourceData }: { sourceData: any[] }) => (
  <Card className="bg-slate-900/40 border-white/5 border-2">
    <CardHeader>
      <CardTitle className="text-sm flex items-center gap-2">
        <Wifi className="w-4 h-4 text-emerald-400" /> Emission Source Breakdown
      </CardTitle>
      <CardDescription>Data pipeline contribution by source type</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {sourceData && sourceData.map((s, i) => (
        <motion.div 
          key={s.key} 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: i * 0.1 }}
          className="space-y-2"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-300 font-medium">{s.source}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white font-black">{s.percentage}%</span>
              <span className="text-[10px] text-slate-500">({s.value} t)</span>
            </div>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${s.percentage}%` }}
              transition={{ duration: 0.8, delay: i * 0.15 }}
              className="h-full rounded-full"
              style={{ backgroundColor: s.color }}
            />
          </div>
        </motion.div>
      ))}
    </CardContent>
  </Card>
));

// ─── Carbon Credit Potential ────────────────────────────

const CarbonCreditPanel = React.memo(({ credits }: { credits: any }) => (
  <Card className="bg-gradient-to-br from-amber-950/40 to-slate-900/50 border-amber-500/20 border-2 overflow-hidden relative">
    <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />
    <CardHeader>
      <CardTitle className="text-white flex items-center gap-2">
        <Coins className="w-5 h-5 text-amber-400" /> Carbon Credit Potential
      </CardTitle>
      <CardDescription>Connect monitoring → carbon trading</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-center mb-4">
        <div className="text-5xl font-black text-amber-400">{credits?.total_credits || 0}</div>
        <div className="text-xs text-amber-500/70 uppercase tracking-widest mt-1">Carbon Credits Available</div>
        <div className="text-[10px] text-slate-500 mt-1">1 Credit = 1 Tonne CO₂</div>
      </div>
      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
        <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Estimated Market Value</div>
        <div className="text-lg font-black text-white">
          ${credits?.value_range_low} — ${credits?.value_range_high}
        </div>
        <div className="text-[10px] text-slate-500 mt-1">Based on $15–$50/tonne voluntary market rate</div>
      </div>
    </CardContent>
  </Card>
));

// ─── Real-Time Live Pulse Widget ────────────────────────

const LivePulseWidget = React.memo(({ iotData, lastUpdated }: { iotData: any, lastUpdated: number }) => {
  const [elapsed, setElapsed] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);
  
  return (
    <Card className="bg-slate-900/60 border-emerald-500/10 border-2 overflow-hidden relative">
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">LIVE</span>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" /> Real-Time Emission Pulse
        </CardTitle>
      </CardHeader>
      <CardContent>
        {iotData ? (
          <div className="space-y-3">
            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] text-slate-500 uppercase font-bold">Energy Sensor</span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-2xl font-black text-white">{iotData.quantity} <span className="text-xs text-slate-400">{iotData.unit}</span></div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">CO₂ Impact</div>
                  <div className="text-sm font-black text-emerald-400">{(iotData.co2_emission * 1000).toFixed(1)} kg</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-slate-600">
                Last updated: <span className="text-slate-400 font-bold">{elapsed}s ago</span>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ height: [8, 16, 8] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                    className="w-1 bg-emerald-500/40 rounded-full"
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 animate-pulse">Waiting for sensor data...</div>
        )}
      </CardContent>
    </Card>
  );
});

// ─── Main Component ─────────────────────────────────────

export default function EmissionTracker() {
  const [realtimeData, setRealtimeData] = useState<any[]>([]);
  const [iotData, setIotData] = useState<any>(null);
  const [publicData, setPublicData] = useState<any>(null);
  const [selectedSector, setSelectedSector] = useState("Energy");
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  
  const [report, setReport] = useState({ category: 'energy', source: 'electricity', quantity: 0, unit: 'kWh', sector: 'Manufacturing' });
  const [reportingStatus, setReportingStatus] = useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      const [realtimeRes, summaryRes, recordsRes, pieRes, sourceRes, insightsRes] = await Promise.all([
        fetch(`${API_BASE}/realtime`),
        fetch(`${API_BASE}/summary`),
        fetch(`${API_BASE}/records?limit=10`),
        fetch(`${API_BASE}/pie-data`),
        fetch(`${API_BASE}/source-breakdown`),
        fetch(`${API_BASE}/insights`)
      ]);

      const [realtime, summaryData, records, pie, source, insightsData] = await Promise.all([
        realtimeRes.json(),
        summaryRes.json(),
        recordsRes.json(),
        pieRes.json(),
        sourceRes.json(),
        insightsRes.json()
      ]);

      if (realtime.success) {
        setRealtimeData(realtime.sectors);
        if (realtime.iot_update) { setIotData(realtime.iot_update); setLastUpdated(Date.now()); }
        if (realtime.public_update) setPublicData(realtime.public_update);
      }
      
      if (summaryData.success) setSummary(summaryData.summary);
      if (records.success) setRecentRecords(records.records);
      if (pie.success) setPieData(pie.pie_data);
      if (source.success) setSourceData(source.source_data);
      if (insightsData.success) setInsights(insightsData);

    } catch (error) {
      console.warn("Backend not reachable");
    }
  }, []);

  const fetchHistory = React.useCallback(async (sector: string) => {
    try {
      const res = await fetch(`${API_BASE}/history/${sector}`);
      const result = await res.json();
      if (result.success) {
        const formatted = result.history.map((h: any) => ({
          time: h.date,
          value: h.value
        }));
        setHistoryData(formatted);
      }
    } catch (error) {
      console.warn("History fetch failed");
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    fetchHistory(selectedSector);
  }, [selectedSector, fetchHistory]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportingStatus("Submitting...");
    try {
      const res = await fetch(`${API_BASE}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      const result = await res.json();
      if (result.success) {
        setReportingStatus(`Success! Recorded ${result.record.co2_emission} tCO₂e`);
        fetchData();
        setTimeout(() => setReportingStatus(null), 3000);
      } else {
        setReportingStatus("Error: " + result.detail);
      }
    } catch (error) {
      setReportingStatus("Failed to submit.");
    }
  };

  const getSectorIcon = (sector: string) => {
    switch (sector) {
      case "Energy": return <Zap className="w-6 h-6 text-yellow-500" />;
      case "Transportation": return <Truck className="w-6 h-6 text-blue-500" />;
      case "Manufacturing": return <Factory className="w-6 h-6 text-purple-500" />;
      default: return <Activity className="w-6 h-6 text-green-500" />;
    }
  };

  const chartColors = React.useMemo(() => ({ 
    lineColor: '#818cf8', 
    areaTopColor: 'rgba(129, 140, 248, 0.4)',
    areaBottomColor: 'rgba(129, 140, 248, 0)'
  }), []);

  return (
    <div className="space-y-8 p-6 bg-transparent">
      {/* Header & Total Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Globe className="text-emerald-500 animate-pulse" />
            Carbon Emission Monitor
          </h2>
          <p className="text-slate-400 mt-2">
            Real-time multi-source ingestion & AI-powered carbon intelligence platform.
          </p>
        </div>
        <SummaryCard summary={summary} />
      </div>

      {/* ⭐ Row 1: Impact Panel + AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CarbonImpactPanel equivalents={insights?.equivalents} totalEmissions={insights?.total_emissions_tonnes} />
        <AIRecommendations recommendations={insights?.recommendations} />
      </div>

      {/* ⭐ Row 2: Live Pulse + Source Breakdown + Carbon Credits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LivePulseWidget iotData={iotData} lastUpdated={lastUpdated} />
        <SourceBreakdown sourceData={sourceData} />
        <CarbonCreditPanel credits={insights?.credits} />
      </div>

      {/* Row 3: Sector Allocation + Data Feed + Manual Report */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectorAllocation summary={summary} />
        <DataFeed iotData={iotData} publicData={publicData} />
        
        <Card className="bg-slate-900/40 border-emerald-500/10 border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-400" /> Manual Activity Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <select 
                  className="bg-slate-950 border border-white/10 rounded-lg p-2 text-[10px] text-white"
                  value={report.category}
                  onChange={e => setReport({...report, category: e.target.value})}
                >
                  <option value="energy">Energy</option>
                  <option value="transport">Transport</option>
                </select>
                <select 
                  className="bg-slate-950 border border-white/10 rounded-lg p-2 text-[10px] text-white"
                  value={report.sector}
                  onChange={e => setReport({...report, sector: e.target.value})}
                >
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Energy">Utilities</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input 
                  type="number"
                  className="flex-1 bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                  placeholder="Quantity"
                  onChange={e => setReport({...report, quantity: parseFloat(e.target.value) || 0})}
                />
                <button type="submit" className="bg-emerald-500 text-slate-950 px-4 rounded-lg font-bold text-[10px]">
                  Submit
                </button>
              </div>
              {reportingStatus && <div className="text-[9px] text-emerald-400 animate-pulse">{reportingStatus}</div>}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart - Emissions by Sector */}
      <Card className="bg-slate-900/40 border-white/5 border-2">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" /> Emissions by Sector
          </CardTitle>
          <CardDescription>Percentage distribution of CO₂ emissions across all sectors.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <PieChart data={pieData} size={220} />
        </CardContent>
      </Card>

      {/* ⭐ Emission Hotspot Map */}
      <Card className="bg-slate-900/40 border-white/5 border-2">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" /> Emission Hotspot Map
          </CardTitle>
          <CardDescription>Geospatial visualization of emission sources with real-time monitoring status.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmissionMap />
        </CardContent>
      </Card>

      {/* Historical Trend Chart */}
      <Card className="bg-slate-900/40 border-white/5 border-2 overflow-hidden">
        <CardHeader className="border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${selectedSector === 'Energy' ? 'bg-yellow-500/10 text-yellow-500' : selectedSector === 'Transportation' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                {getSectorIcon(selectedSector)}
              </div>
              <div>
                <CardTitle className="text-white text-lg">
                  {selectedSector} Emission Trend
                </CardTitle>
                <CardDescription className="text-xs">30-Day time-series baseline from persistent storage.</CardDescription>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5">
              <div className="text-[10px] text-slate-500 uppercase font-bold">AVG Daily</div>
              <div className="text-sm font-black text-white">
                {historyData.length > 0 ? (historyData.reduce((acc, curr) => acc + curr.value, 0) / historyData.length).toFixed(2) : "0.00"} t
              </div>
            </div>
            <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5">
              {["Energy", "Transportation", "Manufacturing"].map(s => (
                <button 
                  key={s} 
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${selectedSector === s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                  onClick={() => setSelectedSector(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 h-[320px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedSector}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full"
            >
              <div className="absolute top-4 right-8 z-10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Live Baseline</span>
              </div>
              {historyData.length > 0 ? (
                <AnimatedLineChart data={historyData} colors={chartColors} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-3">
                  <Database className="w-8 h-8 opacity-20" />
                  <div className="text-xs animate-pulse">Initializing Data Stream...</div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      <RecordsTable records={recentRecords} />
    </div>
  );
}
