import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
} from 'lightweight-charts';
import type { Asset, TimeRange } from '../types';
import { useMarketData } from '../hooks/useMarketData';
import { formatPrice, formatPercent, formatLargeNumber, changeColor } from '../utils/format';
import { computeSMA, computeEMA, computeBollingerBands } from '../utils/indicators';
import TimeRangeSelector from './TimeRangeSelector';

// ─── Chart‑type helpers ─────────────────────────────────────────────────────

type ChartStyle = 'candle' | 'line' | 'area';

interface Indicator {
  id: string;
  label: string;
  color: string;
  enabled: boolean;
}

const DEFAULT_INDICATORS: Indicator[] = [
  { id: 'sma20', label: 'SMA 20', color: '#f59e0b', enabled: false },
  { id: 'sma50', label: 'SMA 50', color: '#8b5cf6', enabled: false },
  { id: 'ema12', label: 'EMA 12', color: '#06b6d4', enabled: false },
  { id: 'bb', label: 'Bollinger', color: '#64748b', enabled: false },
];

// ─── Legend data ─────────────────────────────────────────────────────────────

interface LegendData {
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  time?: string;
}

// ─── Helper ─────────────────────────────────────────────────────────────────

/** Convert our time strings to Lightweight Charts format */
function toLWCTime(t: string): string | number {
  return /^\d+$/.test(t) ? Number(t) : t;
}

function isDaily(range: TimeRange): boolean {
  return !['1D', '5D'].includes(range);
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface PriceChartProps {
  asset: Asset;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PriceChart({ asset, timeRange, onTimeRangeChange }: PriceChartProps) {
  const { data, isLoading, error } = useMarketData(asset, timeRange);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Series refs
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const areaRef = useRef<ISeriesApi<'Area'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const indicatorRefs = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());

  // State
  const [chartStyle, setChartStyle] = useState<ChartStyle>(() =>
    isDaily(timeRange) ? 'candle' : 'area'
  );
  const [showVolume, setShowVolume] = useState(true);
  const [indicators, setIndicators] = useState<Indicator[]>(DEFAULT_INDICATORS);
  const [legend, setLegend] = useState<LegendData>({});
  const [showToolbar, setShowToolbar] = useState(false);

  const quote = data?.quote;
  const ohlc = data?.ohlc ?? [];
  const history = data?.history ?? [];
  const volume = data?.volume ?? [];

  // Auto-switch chart style when time range changes
  useEffect(() => {
    if (isDaily(timeRange)) {
      if (chartStyle === 'area') setChartStyle('candle');
    } else {
      if (chartStyle === 'candle') setChartStyle('area');
    }
  }, [timeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Indicator computation (memoized) ────────────────────────────────────
  const indicatorData = useMemo(() => {
    if (history.length < 5) return {};
    const map: Record<string, { time: string | number; value: number }[]> = {};

    const sma20 = computeSMA(history, 20);
    if (sma20.length) map['sma20'] = sma20.map((p) => ({ time: toLWCTime(p.time), value: p.value }));

    const sma50 = computeSMA(history, 50);
    if (sma50.length) map['sma50'] = sma50.map((p) => ({ time: toLWCTime(p.time), value: p.value }));

    const ema12 = computeEMA(history, 12);
    if (ema12.length) map['ema12'] = ema12.map((p) => ({ time: toLWCTime(p.time), value: p.value }));

    const bb = computeBollingerBands(history, 20, 2);
    if (bb.upper.length) {
      map['bb_upper'] = bb.upper.map((p) => ({ time: toLWCTime(p.time), value: p.value }));
      map['bb_lower'] = bb.lower.map((p) => ({ time: toLWCTime(p.time), value: p.value }));
    }

    return map;
  }, [history]);

  // ── Create chart on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#09090b' },
        textColor: '#71717a',
        attributionLogo: false,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(63,63,70,0.3)' },
        horzLines: { color: 'rgba(63,63,70,0.3)' },
      },
      crosshair: {
        mode: 0, // Normal crosshair
        horzLine: {
          labelBackgroundColor: '#3f3f46',
          style: 3,
          width: 1,
          color: 'rgba(113,113,122,0.3)',
        },
        vertLine: {
          labelBackgroundColor: '#3f3f46',
          style: 3,
          width: 1,
          color: 'rgba(113,113,122,0.3)',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(63,63,70,0.5)',
        scaleMargins: { top: 0.08, bottom: 0.25 }, // Leave room for volume
      },
      timeScale: {
        borderColor: 'rgba(63,63,70,0.5)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        minBarSpacing: 2,
      },
      handleScroll: { vertTouchDrag: false },
    });

    chart.timeScale().fitContent();

    // Responsive resize
    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    observer.observe(containerRef.current);

    chartRef.current = chart;

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      lineRef.current = null;
      areaRef.current = null;
      volumeRef.current = null;
      indicatorRefs.current.clear();
    };
  }, []);

  // ── Crosshair move → update legend ──────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const handler = (param: MouseEventParams) => {
      if (!param.time) {
        setLegend({});
        return;
      }

      const ld: LegendData = { time: String(param.time) };

      // Get candle data
      if (candleRef.current) {
        const d = param.seriesData.get(candleRef.current) as
          | { open: number; high: number; low: number; close: number }
          | undefined;
        if (d) {
          ld.open = d.open;
          ld.high = d.high;
          ld.low = d.low;
          ld.close = d.close;
        }
      }

      // Or line/area data
      if (!ld.close && lineRef.current) {
        const d = param.seriesData.get(lineRef.current) as { value: number } | undefined;
        if (d) ld.close = d.value;
      }
      if (!ld.close && areaRef.current) {
        const d = param.seriesData.get(areaRef.current) as { value: number } | undefined;
        if (d) ld.close = d.value;
      }

      // Volume
      if (volumeRef.current) {
        const d = param.seriesData.get(volumeRef.current) as { value: number } | undefined;
        if (d) ld.volume = d.value;
      }

      setLegend(ld);
    };

    chart.subscribeCrosshairMove(handler);
    return () => chart.unsubscribeCrosshairMove(handler);
  }, []);

  // ── Clear + redraw all series when data changes ─────────────────────────
  const rebuildSeries = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // ── Remove everything ──
    try {
      if (candleRef.current) chart.removeSeries(candleRef.current);
    } catch { /* already gone */ }
    try {
      if (lineRef.current) chart.removeSeries(lineRef.current);
    } catch { /* already gone */ }
    try {
      if (areaRef.current) chart.removeSeries(areaRef.current);
    } catch { /* already gone */ }
    try {
      if (volumeRef.current) chart.removeSeries(volumeRef.current);
    } catch { /* already gone */ }
    candleRef.current = null;
    lineRef.current = null;
    areaRef.current = null;
    volumeRef.current = null;
    for (const [, s] of indicatorRefs.current) {
      try { chart.removeSeries(s); } catch { /* */ }
    }
    indicatorRefs.current.clear();

    if (history.length === 0 && ohlc.length === 0) return;

    // ── Volume histogram (render first so it's behind price) ──
    if (showVolume && volume.length > 0) {
      const vs = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      vs.priceScale().applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });
      vs.setData(
        volume.map((v) => ({
          time: toLWCTime(v.time) as string & number,
          value: v.value,
          color: v.color,
        }))
      );
      volumeRef.current = vs;
    }

    // ── Main price series ──
    if (chartStyle === 'candle' && ohlc.length > 0) {
      const s = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#4ade80',
        wickDownColor: '#f87171',
      });
      s.setData(
        ohlc.map((d) => ({
          time: toLWCTime(d.time) as string & number,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }))
      );
      candleRef.current = s;
    } else if (chartStyle === 'area' && history.length > 0) {
      const s = chart.addSeries(AreaSeries, {
        lineColor: asset.color,
        lineWidth: 2,
        topColor: asset.color + '40',      // 25% opacity fill
        bottomColor: asset.color + '05',   // nearly transparent
        priceLineVisible: true,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: asset.color,
        crosshairMarkerBackgroundColor: '#09090b',
      });
      s.setData(
        history.map((d) => ({
          time: toLWCTime(d.time) as string & number,
          value: d.value,
        }))
      );
      areaRef.current = s;
    } else if (history.length > 0) {
      const s = chart.addSeries(LineSeries, {
        color: asset.color,
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });
      s.setData(
        history.map((d) => ({
          time: toLWCTime(d.time) as string & number,
          value: d.value,
        }))
      );
      lineRef.current = s;
    }

    // ── Indicator overlays ──
    for (const ind of indicators) {
      if (!ind.enabled) continue;

      if (ind.id === 'bb') {
        // Bollinger bands: upper + lower as separate lines
        const upperData = indicatorData['bb_upper'];
        const lowerData = indicatorData['bb_lower'];
        if (upperData?.length) {
          const upper = chart.addSeries(LineSeries, {
            color: ind.color,
            lineWidth: 1,
            lineStyle: 2, // dashed
            priceLineVisible: false,
            lastValueVisible: false,
          });
          upper.setData(upperData as { time: string & number; value: number }[]);
          indicatorRefs.current.set('bb_upper', upper);

          const lower = chart.addSeries(LineSeries, {
            color: ind.color,
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          lower.setData(lowerData as { time: string & number; value: number }[]);
          indicatorRefs.current.set('bb_lower', lower);
        }
      } else {
        const points = indicatorData[ind.id];
        if (points?.length) {
          const s = chart.addSeries(LineSeries, {
            color: ind.color,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          s.setData(points as { time: string & number; value: number }[]);
          indicatorRefs.current.set(ind.id, s);
        }
      }
    }

    chart.timeScale().fitContent();
  }, [ohlc, history, volume, chartStyle, showVolume, indicators, indicatorData, asset.color]);

  useEffect(() => {
    rebuildSeries();
  }, [rebuildSeries]);

  // ── Indicator toggle ────────────────────────────────────────────────────
  const toggleIndicator = (id: string) => {
    setIndicators((prev) =>
      prev.map((ind) => (ind.id === id ? { ...ind, enabled: !ind.enabled } : ind))
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: asset.color }}
              />
              <h2 className="text-xl font-bold text-zinc-50 truncate">
                {asset.name}
                <span className="ml-2 text-sm font-normal text-muted">{asset.symbol}</span>
              </h2>
            </div>
            {quote && (
              <div className="flex items-baseline gap-3 mt-1.5 ml-6 flex-wrap">
                <span className="text-2xl font-bold text-zinc-50 tabular-nums">
                  ${formatPrice(quote.price)}
                </span>
                <span
                  className={`text-sm font-semibold tabular-nums ${changeColor(quote.changePercent)}`}
                >
                  {quote.change >= 0 ? '+' : ''}
                  {formatPrice(Math.abs(quote.change))} ({formatPercent(quote.changePercent)})
                </span>
                <span className="text-xs text-muted">
                  Vol {formatLargeNumber(quote.volume)}
                </span>
              </div>
            )}
          </div>
          <TimeRangeSelector selected={timeRange} onChange={onTimeRangeChange} />
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-1 mt-3 flex-wrap">
          {/* Chart style buttons */}
          {(['candle', 'line', 'area'] as ChartStyle[]).map((s) => (
            <button
              key={s}
              onClick={() => setChartStyle(s)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                chartStyle === s
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
            >
              {s === 'candle' ? '🕯️ Candle' : s === 'line' ? '📈 Line' : '📊 Area'}
            </button>
          ))}

          <div className="w-px h-4 bg-zinc-800 mx-1" />

          {/* Volume toggle */}
          <button
            onClick={() => setShowVolume((v) => !v)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
              showVolume
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            Vol
          </button>

          <div className="w-px h-4 bg-zinc-800 mx-1" />

          {/* Indicators toggle/expand */}
          <button
            onClick={() => setShowToolbar((v) => !v)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
              showToolbar || indicators.some((i) => i.enabled)
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            Indicators {showToolbar ? '▾' : '▸'}
          </button>

          {showToolbar &&
            indicators.map((ind) => (
              <button
                key={ind.id}
                onClick={() => toggleIndicator(ind.id)}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                  ind.enabled
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ind.color, opacity: ind.enabled ? 1 : 0.4 }}
                />
                {ind.label}
              </button>
            ))}
        </div>
      </div>

      {/* ── Chart container ── */}
      <div className="relative" style={{ height: 480 }}>
        {/* Loading overlay */}
        {isLoading && !data && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface z-10">
            <div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface text-red-400 text-sm z-10">
            Failed to load chart data
          </div>
        )}

        {/* OHLCV Legend overlay */}
        <ChartLegend legend={legend} asset={asset} chartStyle={chartStyle} />

        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}

// ─── Crosshair Legend Component ─────────────────────────────────────────────

function ChartLegend({
  legend,
  asset,
  chartStyle,
}: {
  legend: LegendData;
  asset: Asset;
  chartStyle: ChartStyle;
}) {
  if (!legend.close && !legend.open) return null;

  return (
    <div className="absolute top-2 left-3 z-20 pointer-events-none">
      <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums">
        {chartStyle === 'candle' && legend.open != null ? (
          <>
            <span className="text-zinc-400">
              O <span className="text-zinc-200">{formatPrice(legend.open)}</span>
            </span>
            <span className="text-zinc-400">
              H <span className="text-zinc-200">{formatPrice(legend.high!)}</span>
            </span>
            <span className="text-zinc-400">
              L <span className="text-zinc-200">{formatPrice(legend.low!)}</span>
            </span>
            <span className="text-zinc-400">
              C{' '}
              <span
                className={
                  legend.close! >= legend.open ? 'text-up' : 'text-down'
                }
              >
                {formatPrice(legend.close!)}
              </span>
            </span>
          </>
        ) : legend.close != null ? (
          <span className="text-zinc-300">
            <span
              className="inline-block w-2 h-2 rounded-full mr-1.5"
              style={{ backgroundColor: asset.color }}
            />
            {formatPrice(legend.close)}
          </span>
        ) : null}

        {legend.volume != null && legend.volume > 0 && (
          <span className="text-zinc-500">
            Vol <span className="text-zinc-400">{formatLargeNumber(legend.volume)}</span>
          </span>
        )}
      </div>
    </div>
  );
}
