"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface PieSlice {
  sector: string;
  value: number;
  percentage: number;
  color: string;
}

interface PieChartProps {
  data: PieSlice[];
  size?: number;
}

export const PieChart: React.FC<PieChartProps> = ({ data, size = 200 }) => {
  const radius = size / 2 - 10;
  const center = size / 2;
  const strokeWidth = 40;
  const innerRadius = radius - strokeWidth;
  
  // Calculate arc segments
  let cumulativePercentage = 0;
  
  const getArcPath = (startPercent: number, endPercent: number) => {
    const startAngle = (startPercent / 100) * 360 - 90;
    const endAngle = (endPercent / 100) * 360 - 90;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    
    const ix1 = center + innerRadius * Math.cos(startRad);
    const iy1 = center + innerRadius * Math.sin(startRad);
    const ix2 = center + innerRadius * Math.cos(endRad);
    const iy2 = center + innerRadius * Math.sin(endRad);
    
    const largeArc = endPercent - startPercent > 50 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-600 text-xs">
        No data available
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Glow effect */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {data.map((slice, i) => {
          const startPercent = cumulativePercentage;
          cumulativePercentage += slice.percentage;
          const endPercent = cumulativePercentage;
          
          // Handle edge case where slice is 100%
          if (slice.percentage >= 99.9) {
            return (
              <motion.circle
                key={slice.sector}
                cx={center}
                cy={center}
                r={(radius + innerRadius) / 2}
                fill="none"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: i * 0.2 }}
              />
            );
          }
          
          return (
            <motion.path
              key={slice.sector}
              d={getArcPath(startPercent, endPercent)}
              fill={slice.color}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={1}
              filter="url(#glow)"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="cursor-pointer hover:brightness-125 transition-all"
            />
          );
        })}
        
        {/* Center text */}
        <text x={center} y={center - 8} textAnchor="middle" fill="white" fontSize="16" fontWeight="900" fontFamily="Inter, sans-serif">
          {data.reduce((acc, s) => acc + s.value, 0).toFixed(1)}
        </text>
        <text x={center} y={center + 10} textAnchor="middle" fill="rgb(148,163,184)" fontSize="9" fontWeight="600" fontFamily="Inter, sans-serif">
          tCO₂e TOTAL
        </text>
      </svg>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4">
        {data.map((slice) => (
          <div key={slice.sector} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-[11px] text-slate-400">
              {slice.sector}: <span className="text-white font-bold">{slice.percentage}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
