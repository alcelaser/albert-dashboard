import { useEffect, useRef } from 'react';
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  CandlestickSeries,
  LineSeries,
} from 'lightweight-charts';
import type { Asset, TimeRange } from '../types';
import { useMarketData } from '../hooks/useMarketData';
import { formatPrice, formatPercent, formatLargeNumber, changeColor } from '../utils/format';
import TimeRangeSelector from './TimeRangeSelector';

interface PriceChartProps {
  asset: Asset;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

export default function PriceChart({ asset, timeRange, onTimeRangeChange }: PriceChartProps) {
  const { data, isLoading, error } = useMarketData(asset, timeRange);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const quote = data?.quote;
  const ohlc = data?.ohlc ?? [];
  const history = data?.history ?? [];

  // Use candles for daily+ intervals, line for intraday
  const useCandles = ['1M', '3M', '6M', '1Y', '5Y'].includes(timeRange);

  // Create chart on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#18181b' },
        textColor: '#a1a1aa',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: '#27272a' },
        horzLines: { color: '#27272a' },
      },
      crosshair: {
        horzLine: { labelBackgroundColor: '#3f3f46' },
        vertLine: { labelBackgroundColor: '#3f3f46' },
      },
      rightPriceScale: {
        borderColor: '#3f3f46',
      },
      timeScale: {
        borderColor: '#3f3f46',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);

    chartRef.current = chart;

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      lineSeriesRef.current = null;
    };
  }, []);

  // Update series when data or chart type changes
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // Remove old series
    if (candleSeriesRef.current) {
      chart.removeSeries(candleSeriesRef.current);
      candleSeriesRef.current = null;
    }
    if (lineSeriesRef.current) {
      chart.removeSeries(lineSeriesRef.current);
      lineSeriesRef.current = null;
    }

    if (useCandles && ohlc.length > 0) {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });
      series.setData(ohlc);
      candleSeriesRef.current = series;
    } else if (history.length > 0) {
      const series = chart.addSeries(LineSeries, {
        color: asset.color,
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
      });
      series.setData(history.map((d) => ({ time: d.time, value: d.value })));
      lineSeriesRef.current = series;
    }

    chart.timeScale().fitContent();
  }, [ohlc, history, useCandles, asset.color]);

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: asset.color }}
              />
              <h2 className="text-xl font-bold text-zinc-50">
                {asset.name}
                <span className="ml-2 text-sm font-normal text-muted">{asset.symbol}</span>
              </h2>
            </div>
            {quote && (
              <div className="flex items-baseline gap-3 mt-1.5 ml-6">
                <span className="text-2xl font-bold text-zinc-50 tabular-nums">
                  ${formatPrice(quote.price)}
                </span>
                <span className={`text-sm font-semibold tabular-nums ${changeColor(quote.changePercent)}`}>
                  {formatPercent(quote.changePercent)}
                </span>
                <span className="text-xs text-muted">
                  Vol {formatLargeNumber(quote.volume)}
                </span>
              </div>
            )}
          </div>
          <TimeRangeSelector selected={timeRange} onChange={onTimeRangeChange} />
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: 400 }}>
        {isLoading && !data && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface">
            <div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface text-red-400 text-sm">
            Failed to load chart data
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
