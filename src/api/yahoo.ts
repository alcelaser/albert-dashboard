import type { AssetQuote, OHLC, PricePoint, VolumeBar } from '../types';
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
    regularMarketDayHigh: number;
    regularMarketDayLow: number;
    regularMarketVolume: number;
  };
}

/** Intraday ranges use Unix timestamps; daily+ use YYYY-MM-DD */
const INTRADAY_RANGES: TimeRange[] = ['1D', '5D'];

export async function fetchYahooChart(
  symbol: string,
  timeRange: TimeRange = '1M'
): Promise<{ quote: AssetQuote; history: PricePoint[]; ohlc: OHLC[]; volume: VolumeBar[] }> {
  const config = TIME_RANGES[timeRange];
  const url = `/api/yahoo/v8/finance/chart/${encodeURIComponent(symbol)}?range=${config.range}&interval=${config.interval}&includePrePost=false`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error(`Yahoo Finance HTTP ${res.status} for ${symbol}:`, text.slice(0, 200));
    throw new Error(`Yahoo Finance error: ${res.status}`);
  }

  const json = await res.json();
  if (!json.chart?.result?.[0]) {
    console.error(`Yahoo Finance no result for ${symbol}:`, JSON.stringify(json).slice(0, 300));
    throw new Error(`Yahoo Finance: no data returned for ${symbol}`);
  }

  const result: YahooChartResult = json.chart.result[0];
  const { timestamp, indicators, meta } = result;
  const q = indicators.quote[0];
  const isIntraday = INTRADAY_RANGES.includes(timeRange);

  const history: PricePoint[] = [];
  const ohlc: OHLC[] = [];
  const volume: VolumeBar[] = [];

  if (isIntraday) {
    // Use Unix timestamps — preserves every intraday bar
    for (let i = 0; i < timestamp.length; i++) {
      const close = q.close[i];
      if (close == null) continue;
      const time = String(timestamp[i]);
      const open = q.open[i] ?? close;
      history.push({ time, value: close });
      ohlc.push({ time, open, high: q.high[i] ?? close, low: q.low[i] ?? close, close });
      volume.push({
        time,
        value: q.volume[i] ?? 0,
        color: close >= open ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)',
      });
    }
  } else {
    // Daily+ — use YYYY-MM-DD, deduplicate forward (O(n))
    const seen = new Set<string>();
    for (let i = 0; i < timestamp.length; i++) {
      const close = q.close[i];
      if (close == null) continue;
      const time = unixToDate(timestamp[i]);
      if (seen.has(time)) continue;
      seen.add(time);
      const open = q.open[i] ?? close;
      history.push({ time, value: close });
      ohlc.push({ time, open, high: q.high[i] ?? close, low: q.low[i] ?? close, close });
      volume.push({
        time,
        value: q.volume[i] ?? 0,
        color: close >= open ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)',
      });
    }
  }

  const currentPrice = meta.regularMarketPrice;
  const previousClose = meta.previousClose || meta.chartPreviousClose;
  const change = currentPrice - previousClose;
  const changePercent = previousClose ? (change / previousClose) * 100 : 0;

  const quote: AssetQuote = {
    price: currentPrice,
    change,
    changePercent,
    high24h: meta.regularMarketDayHigh || currentPrice,
    low24h: meta.regularMarketDayLow || currentPrice,
    volume: meta.regularMarketVolume || q.volume.reduce((a, b) => a + (b || 0), 0),
    previousClose,
  };

  return { quote, history, ohlc, volume };
}
