import type { AssetQuote, OHLC, PricePoint } from '../types';
import { TIME_RANGES } from '../config/assets';
import type { TimeRange } from '../types';
import { unixToDate } from '../utils/format';

interface YahooChartResult {
  timestamp: number[];
  indicators: {
    quote: Array<{
      open: number[];
      high: number[];
      low: number[];
      close: number[];
      volume: number[];
    }>;
  };
  meta: {
    regularMarketPrice: number;
    previousClose: number;
    chartPreviousClose: number;
  };
}

/**
 * Fetch chart data from Yahoo Finance via Vite proxy.
 */
export async function fetchYahooChart(
  symbol: string,
  timeRange: TimeRange = '1M'
): Promise<{ quote: AssetQuote; history: PricePoint[]; ohlc: OHLC[] }> {
  const config = TIME_RANGES[timeRange];
  const url = `/api/yahoo/v8/finance/chart/${encodeURIComponent(symbol)}?range=${config.range}&interval=${config.interval}&includePrePost=false`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Yahoo Finance error: ${res.status}`);

  const json = await res.json();
  const result: YahooChartResult = json.chart.result[0];
  const { timestamp, indicators, meta } = result;
  const q = indicators.quote[0];

  const history: PricePoint[] = [];
  const ohlc: OHLC[] = [];

  for (let i = 0; i < timestamp.length; i++) {
    const close = q.close[i];
    if (close == null) continue;

    const time = unixToDate(timestamp[i]);
    history.push({ time, value: close });
    ohlc.push({
      time,
      open: q.open[i] ?? close,
      high: q.high[i] ?? close,
      low: q.low[i] ?? close,
      close,
    });
  }

  // Deduplicate by date (intraday intervals can map to same date)
  const seenDates = new Set<string>();
  const dedupHistory: PricePoint[] = [];
  const dedupOhlc: OHLC[] = [];
  for (let i = history.length - 1; i >= 0; i--) {
    if (!seenDates.has(history[i].time)) {
      seenDates.add(history[i].time);
      dedupHistory.unshift(history[i]);
      dedupOhlc.unshift(ohlc[i]);
    }
  }

  const currentPrice = meta.regularMarketPrice;
  const previousClose = meta.previousClose || meta.chartPreviousClose;
  const change = currentPrice - previousClose;
  const changePercent = previousClose ? (change / previousClose) * 100 : 0;

  // Compute 24h high/low from recent data
  const recentPrices = q.close.filter((v) => v != null);
  const recentHighs = q.high.filter((v) => v != null);
  const recentLows = q.low.filter((v) => v != null);

  const quote: AssetQuote = {
    price: currentPrice,
    change,
    changePercent,
    high24h: recentHighs.length ? Math.max(...recentHighs.slice(-50)) : currentPrice,
    low24h: recentLows.length ? Math.min(...recentLows.slice(-50)) : currentPrice,
    volume: q.volume.reduce((a, b) => a + (b || 0), 0),
    previousClose,
  };

  return { quote, history: dedupHistory, ohlc: dedupOhlc };
}
