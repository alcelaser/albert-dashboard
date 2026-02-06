export interface Asset {
  id: string;
  symbol: string;
  name: string;
  category: AssetCategory;
  color: string;
  /** Yahoo Finance ticker symbol */
  yahooSymbol?: string;
  /** CoinGecko id */
  coingeckoId?: string;
}

export type AssetCategory = 'stock' | 'crypto' | 'commodity' | 'index';

export interface PricePoint {
  time: string; // YYYY-MM-DD
  value: number;
}

export interface OHLC {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface AssetQuote {
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume: number;
  marketCap?: number;
  previousClose: number;
}

export interface AssetData {
  asset: Asset;
  quote: AssetQuote | null;
  history: PricePoint[];
  ohlc: OHLC[];
  loading: boolean;
  error: string | null;
}

export type TimeRange = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '5Y';

export interface TimeRangeConfig {
  label: string;
  range: string;
  interval: string;
}
