import { useEffect, useRef } from 'react';
import { createChart, type IChartApi, type ISeriesApi, LineSeries } from 'lightweight-charts';
import type { PricePoint } from '../types';

interface SparklineProps {
  data: PricePoint[];
  color: string;
  width?: number;
  height?: number;
}

export default function Sparkline({ data, color, width = 120, height = 40 }: SparklineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width,
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: 'transparent',
        attributionLogo: false,
      },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      crosshair: { mode: 0 },
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addSeries(LineSeries, {
      color,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update data when it changes
  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      seriesRef.current.setData(data.map((d) => ({ time: d.time, value: d.value })));
      chartRef.current?.timeScale().fitContent();
    }
  }, [data]);

  // Update color
  useEffect(() => {
    if (seriesRef.current) {
      seriesRef.current.applyOptions({ color });
    }
  }, [color]);

  return <div ref={containerRef} className="flex-shrink-0" />;
}
