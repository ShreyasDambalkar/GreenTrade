"use client";

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, AreaSeries } from 'lightweight-charts';

interface ChartProps {
  data: { time: string; value: number }[];
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
  };
}

export const AnimatedLineChart: React.FC<ChartProps> = ({
  data,
  colors: {
    backgroundColor = 'transparent',
    lineColor = '#10b981',
    textColor = '#94a3b8',
    areaTopColor = 'rgba(16, 185, 129, 0.4)',
    areaBottomColor = 'rgba(16, 185, 129, 0)',
  } = {},
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      chartRef.current?.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
        fontSize: 10,
        fontFamily: 'Inter, sans-serif',
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.2, bottom: 0.2 },
      },
      timeScale: {
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      crosshair: {
        vertLine: {
          color: 'rgba(255, 255, 255, 0.2)',
          width: 0.5,
          style: 1,
          labelBackgroundColor: '#1e293b',
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.2)',
          width: 0.5,
          style: 1,
          labelBackgroundColor: '#1e293b',
        },
      },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
      lineWidth: 3,
      priceLineVisible: true,
      priceLineWidth: 1,
      priceLineColor: 'rgba(255, 255, 255, 0.2)',
      priceLineStyle: 2, // Dashed
      priceFormat: {
        type: 'volume',
        precision: 2,
      },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor]);

  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      // Sort data to ensure it's in chronological order for lightweight-charts
      const sortedData = [...data].sort((a, b) => a.time.localeCompare(b.time));
      seriesRef.current.setData(sortedData);
      chartRef.current?.timeScale().fitContent();
    }
  }, [data]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};
