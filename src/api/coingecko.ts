import type { AssetQuote, PricePoint, OHLC } from '../types';

interface CoinGeckoMarketChart {
  prices: [number, number][];
}

interface CoinGeckoSimplePrice {
  [id: string]: {
    usd: number;
    usd_24h_change: number;
    usd_24h_vol: number;
    usd_market_cap: number;
  };
}

function daysForRange(range: string): number {
  switch (range) {
    case '1D': return 1;
    case '5D': return 5;
    case '1M': return 30;
    case '3M': return 90;
    case '6M': return 180;
    case '1Y': return 365;
    case '5Y': return 1825;
    default: return 30;
  }
}

/**
 * Fetch price history from CoinGecko (free, no key).
 */
export async function fetchCoinGeckoChart(
  coinId: string,
  range: string = '1M'
): Promise<{ quote: AssetQuote; history: PricePoint[]; ohlc: OHLC[] }> {
  const days = daysForRange(range);

  // Fetch both endpoints in parallel
  const [chartRes, priceRes] = await Promise.all([
    fetch(
      `/api/coingecko/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
    ),
    fetch(
      `/api/coingecko/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
    ),
  ]);

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

  // Build history (deduplicate by date)
  const dateMap = new Map<string, number>();
  for (const [ts, val] of chartData.prices) {
    const date = new Date(ts).toISOString().slice(0, 10);
    dateMap.set(date, val); // last value for each date wins
  }

  const history: PricePoint[] = [];
  const ohlc: OHLC[] = [];
  for (const [date, val] of dateMap) {
    history.push({ time: date, value: val });
    ohlc.push({ time: date, open: val, high: val, low: val, close: val });
  }

  const quote: AssetQuote = {
    price,
    change,
    changePercent,
    high24h: Math.max(...history.map((p) => p.value)),
    low24h: Math.min(...history.map((p) => p.value)),
    volume: coinPrice?.usd_24h_vol ?? 0,
    marketCap: coinPrice?.usd_market_cap,
    previousClose,
  };

  return { quote, history, ohlc };
}
