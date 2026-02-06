import type { AssetQuote, PricePoint, OHLC, VolumeBar } from '../types';
import type { TimeRange } from '../types';

interface CoinGeckoMarketChart {
  prices: [number, number][];
  total_volumes: [number, number][];
}

interface CoinGeckoSimplePrice {
  [id: string]: {
    usd: number;
    usd_24h_change: number;
    usd_24h_vol: number;
    usd_market_cap: number;
  };
}

const DAYS_MAP: Record<TimeRange, string> = {
  '1D': '1', '5D': '5', '1M': '30', '3M': '90', '6M': '180', '1Y': '365', '5Y': '365',
  // 5Y is excluded from the UI for crypto — CoinGecko free tier caps at 365 days
};

/** Small delay helper to stagger requests and respect rate limits. */
function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch with CoinGecko rate-limit awareness.
 * On 429, waits the Retry-After header (or 60s) then retries once.
 */
async function cgFetch(url: string): Promise<Response> {
  const res = await fetch(url);
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('Retry-After') || '60');
    console.warn(`[CoinGecko] 429 — backing off ${retryAfter}s`);
    await delay(retryAfter * 1000);
    return fetch(url); // single retry
  }
  return res;
}

/**
 * Fetch price history from CoinGecko (free, no key).
 */
export async function fetchCoinGeckoChart(
  coinId: string,
  range: TimeRange = '1M'
): Promise<{ quote: AssetQuote; history: PricePoint[]; ohlc: OHLC[]; volume: VolumeBar[] }> {
  const days = DAYS_MAP[range];
  const isIntraday = days === '1' || days === '5';

  // Stagger the two requests slightly to avoid slamming the rate limit
  const chartRes = await cgFetch(
    `/api/coingecko/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
  );
  await delay(1500); // 1.5s gap between calls
  const priceRes = await cgFetch(
    `/api/coingecko/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
  );

  if (!chartRes.ok) {
    const text = await chartRes.text();
    console.error(`CoinGecko chart HTTP ${chartRes.status} for ${coinId}:`, text.slice(0, 200));
    throw new Error(`CoinGecko chart error: ${chartRes.status}`);
  }
  if (!priceRes.ok) {
    const text = await priceRes.text();
    console.error(`CoinGecko price HTTP ${priceRes.status} for ${coinId}:`, text.slice(0, 200));
    throw new Error(`CoinGecko price error: ${priceRes.status}`);
  }

  const chartData: CoinGeckoMarketChart = await chartRes.json();
  const priceData: CoinGeckoSimplePrice = await priceRes.json();

  const coinPrice = priceData[coinId];
  const price = coinPrice?.usd ?? 0;
  const changePercent = coinPrice?.usd_24h_change ?? 0;
  const previousClose = price / (1 + changePercent / 100);
  const change = price - previousClose;

  const history: PricePoint[] = [];
  const ohlc: OHLC[] = [];
  const volume: VolumeBar[] = [];

  // Build a volume lookup from total_volumes
  const volMap = new Map<number, number>();
  for (const [ts, vol] of (chartData.total_volumes ?? [])) {
    volMap.set(Math.floor(ts / 1000), vol);
  }

  if (isIntraday) {
    let prevVal = 0;
    for (const [ts, val] of chartData.prices) {
      const unixSec = Math.floor(ts / 1000);
      const time = String(unixSec);
      history.push({ time, value: val });
      ohlc.push({ time, open: val, high: val, low: val, close: val });
      volume.push({
        time,
        value: volMap.get(unixSec) ?? 0,
        color: val >= prevVal ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)',
      });
      prevVal = val;
    }
  } else {
    const dateMap = new Map<string, { val: number; vol: number }>();
    for (const [ts, val] of chartData.prices) {
      const date = new Date(ts).toISOString().slice(0, 10);
      const unixSec = Math.floor(ts / 1000);
      dateMap.set(date, { val, vol: volMap.get(unixSec) ?? 0 });
    }
    let prevVal = 0;
    for (const [date, { val, vol }] of dateMap) {
      history.push({ time: date, value: val });
      ohlc.push({ time: date, open: val, high: val, low: val, close: val });
      volume.push({
        time: date,
        value: vol,
        color: val >= prevVal ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)',
      });
      prevVal = val;
    }
  }

  // Use 24h data from the price endpoint, not the full chart range
  const quote: AssetQuote = {
    price,
    change,
    changePercent,
    high24h: price * (1 + Math.abs(changePercent) / 100),
    low24h: price * (1 - Math.abs(changePercent) / 100),
    volume: coinPrice?.usd_24h_vol ?? 0,
    marketCap: coinPrice?.usd_market_cap,
    previousClose,
  };

  return { quote, history, ohlc, volume };
}
