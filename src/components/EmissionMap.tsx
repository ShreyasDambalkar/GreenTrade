"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle, HeatmapLayer } from '@react-google-maps/api';

// Emission source locations (simulated facilities across India)
const EMISSION_SOURCES = [
  {
    id: "plant-1",
    name: "Pune Energy Hub",
    type: "Energy",
    lat: 18.5204,
    lng: 73.8567,
    emissions: 0.42,
    unit: "tCO₂e/day",
    source: "iot",
    status: "active",
    description: "Smart grid monitoring station — electricity consumption tracking via IoT sensors.",
    icon: "⚡"
  },
  {
    id: "plant-2",
    name: "PCMC Industrial Zone",
    type: "Manufacturing",
    lat: 18.6298,
    lng: 73.7997,
    emissions: 1.85,
    unit: "tCO₂e/day",
    source: "manual",
    status: "active",
    description: "Heavy manufacturing facility — steel and cement production unit.",
    icon: "🏭"
  },
  {
    id: "plant-3",
    name: "Hinjewadi IT Fleet Depot",
    type: "Transportation",
    lat: 18.5912,
    lng: 73.7389,
    emissions: 3.21,
    unit: "tCO₂e/day",
    source: "public",
    status: "active",
    description: "Corporate fleet depot — diesel-powered logistics hub monitored via public API.",
    icon: "🚛"
  },
  {
    id: "plant-4",
    name: "Kothrud Solar Farm",
    type: "Energy",
    lat: 18.5074,
    lng: 73.8077,
    emissions: 0.08,
    unit: "tCO₂e/day",
    source: "iot",
    status: "active",
    description: "Renewable energy offset — solar panel array with carbon credit generation.",
    icon: "☀️"
  },
  {
    id: "plant-5",
    name: "Chakan Transport Hub",
    type: "Transportation",
    lat: 18.7606,
    lng: 73.8553,
    emissions: 4.67,
    unit: "tCO₂e/day",
    source: "public",
    status: "warning",
    description: "Heavy vehicle transit point — exceeding weekly emission threshold.",
    icon: "🚚"
  },
  {
    id: "plant-6",
    name: "Hadapsar Data Center",
    type: "Energy",
    lat: 18.5089,
    lng: 73.9260,
    emissions: 0.95,
    unit: "tCO₂e/day",
    source: "iot",
    status: "active",
    description: "Cloud infrastructure facility — 24/7 energy monitoring via IoT grid.",
    icon: "🖥️"
  },
  {
    id: "plant-7",
    name: "Wagholi Logistics Park",
    type: "Transportation",
    lat: 18.5800,
    lng: 73.9780,
    emissions: 2.34,
    unit: "tCO₂e/day",
    source: "public",
    status: "active",
    description: "Multi-modal logistics park — fuel consumption tracked via public datasets.",
    icon: "📦"
  },
  {
    id: "plant-8",
    name: "Bhosari Manufacturing Belt",
    type: "Manufacturing",
    lat: 18.6389,
    lng: 73.8498,
    emissions: 2.10,
    unit: "tCO₂e/day",
    source: "manual",
    status: "warning",
    description: "Chemical processing unit — manual emission reporting, high VOC output.",
    icon: "🏗️"
  }
];

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '12px'
};

const center = {
  lat: 18.5604,
  lng: 73.8400
};

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1e3a2b" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#4ade80" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#334155" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#475569" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c1929" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#334155" }] },
];

const getMarkerColor = (type: string) => {
  switch (type) {
    case "Energy": return "#eab308";
    case "Transportation": return "#3b82f6";
    case "Manufacturing": return "#a855f7";
    default: return "#10b981";
  }
};

const getCircleColor = (emissions: number) => {
  if (emissions > 3) return "#ef4444";
  if (emissions > 1) return "#f97316";
  return "#22c55e";
};

interface EmissionMapProps {
  className?: string;
}

export const EmissionMap: React.FC<EmissionMapProps> = ({ className }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const [selectedSource, setSelectedSource] = useState<typeof EMISSION_SOURCES[0] | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const filteredSources = filter === "all" 
    ? EMISSION_SOURCES 
    : EMISSION_SOURCES.filter(s => s.type === filter);

  const totalEmissions = filteredSources.reduce((acc, s) => acc + s.emissions, 0);

  if (loadError) {
    return (
      <div className={`bg-slate-900/40 border border-white/5 rounded-xl p-8 text-center ${className}`}>
        <div className="text-red-400 text-sm">Failed to load Google Maps</div>
        <div className="text-slate-500 text-xs mt-2">Check your API key configuration</div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`bg-slate-900/40 border border-white/5 rounded-xl p-8 flex items-center justify-center h-[500px] ${className}`}>
        <div className="text-slate-500 text-sm animate-pulse">Loading Emission Map...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Map Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800/60 p-1 rounded-xl border border-white/5">
            {["all", "Energy", "Transportation", "Manufacturing"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  filter === f 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f === "all" ? "All Sources" : f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-slate-400">&lt;1 tCO₂e</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-slate-400">1–3 tCO₂e</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-slate-400">&gt;3 tCO₂e</span>
          </div>
          <div className="px-2 py-0.5 bg-white/5 rounded-md border border-white/10">
            <span className="text-slate-400">Total: </span>
            <span className="text-white font-bold">{totalEmissions.toFixed(2)} tCO₂e/day</span>
          </div>
        </div>
      </div>

      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
        onLoad={onLoad}
        options={{
          styles: darkMapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        }}
      >
        {/* Emission Radius Circles */}
        {filteredSources.map(source => (
          <Circle
            key={`circle-${source.id}`}
            center={{ lat: source.lat, lng: source.lng }}
            radius={source.emissions * 400}
            options={{
              fillColor: getCircleColor(source.emissions),
              fillOpacity: 0.15,
              strokeColor: getCircleColor(source.emissions),
              strokeOpacity: 0.4,
              strokeWeight: 1,
            }}
          />
        ))}

        {/* Custom Markers */}
        {filteredSources.map(source => (
          <Marker
            key={source.id}
            position={{ lat: source.lat, lng: source.lng }}
            onClick={() => setSelectedSource(source)}
            label={{
              text: source.icon,
              fontSize: "18px",
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 15,
              fillColor: getMarkerColor(source.type),
              fillOpacity: 0.9,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            }}
          />
        ))}

        {/* Info Window */}
        {selectedSource && (
          <InfoWindow
            position={{ lat: selectedSource.lat, lng: selectedSource.lng }}
            onCloseClick={() => setSelectedSource(null)}
          >
            <div style={{ 
              backgroundColor: '#0f172a', 
              color: 'white', 
              padding: '12px', 
              borderRadius: '8px',
              minWidth: '240px',
              fontFamily: 'Inter, sans-serif'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>{selectedSource.icon}</span>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '13px' }}>{selectedSource.name}</div>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {selectedSource.type} • {selectedSource.source.toUpperCase()}
                  </div>
                </div>
              </div>
              
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '8px 0', lineHeight: 1.5 }}>
                {selectedSource.description}
              </p>
              
              <div style={{ 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: '8px', 
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Daily Emission</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: getCircleColor(selectedSource.emissions) }}>
                    {selectedSource.emissions} <span style={{ fontSize: '10px', color: '#94a3b8' }}>{selectedSource.unit}</span>
                  </div>
                </div>
                <div style={{
                  padding: '3px 8px',
                  borderRadius: '20px',
                  fontSize: '9px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  backgroundColor: selectedSource.status === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                  color: selectedSource.status === 'warning' ? '#f59e0b' : '#22c55e',
                }}>
                  {selectedSource.status === 'warning' ? '⚠ Warning' : '● Active'}
                </div>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Source List Below Map */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {filteredSources.map(source => (
          <button
            key={source.id}
            onClick={() => {
              setSelectedSource(source);
              map?.panTo({ lat: source.lat, lng: source.lng });
              map?.setZoom(14);
            }}
            className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] ${
              selectedSource?.id === source.id 
                ? 'bg-white/10 border-emerald-500/30' 
                : 'bg-white/5 border-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{source.icon}</span>
              <span className="text-[10px] font-bold text-white truncate">{source.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black" style={{ color: getCircleColor(source.emissions) }}>
                {source.emissions} t
              </span>
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                source.source === 'iot' ? 'bg-emerald-500/10 text-emerald-500' :
                source.source === 'public' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
              }`}>
                {source.source}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
