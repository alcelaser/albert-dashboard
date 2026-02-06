import type { Asset, TimeRange, TimeRangeConfig } from '../types';

export const ASSETS: Asset[] = [
  // Stocks
  {
    id: 'googl',
    symbol: 'GOOGL',
    name: 'Alphabet',
    category: 'stock',
    color: '#4285f4',
    yahooSymbol: 'GOOGL',
  },
  {
    id: 'nvda',
    symbol: 'NVDA',
    name: 'Nvidia',
    category: 'stock',
    color: '#76b900',
    yahooSymbol: 'NVDA',
  },
  {
    id: 'tsla',
    symbol: 'TSLA',
    name: 'Tesla',
    category: 'stock',
    color: '#cc0000',
    yahooSymbol: 'TSLA',
  },
  {
    id: 'aapl',
    symbol: 'AAPL',
    name: 'Apple',
    category: 'stock',
    color: '#a2aaad',
    yahooSymbol: 'AAPL',
  },

  // Crypto
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    category: 'crypto',
    color: '#f7931a',
    coingeckoId: 'bitcoin',
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    category: 'crypto',
    color: '#627eea',
    coingeckoId: 'ethereum',
  },

  // Commodities
  {
    id: 'gold',
    symbol: 'XAU',
    name: 'Gold',
    category: 'commodity',
    color: '#ffd700',
    yahooSymbol: 'GC=F',
  },
  {
    id: 'silver',
    symbol: 'XAG',
    name: 'Silver',
    category: 'commodity',
    color: '#c0c0c0',
    yahooSymbol: 'SI=F',
  },

  // Index
  {
    id: 'spy',
    symbol: 'SPY',
    name: 'S&P 500',
    category: 'index',
    color: '#8b5cf6',
    yahooSymbol: 'SPY',
  },
];

export const TIME_RANGES: Record<TimeRange, TimeRangeConfig> = {
  '1D': { label: '1D', range: '1d', interval: '5m' },
  '5D': { label: '5D', range: '5d', interval: '15m' },
  '1M': { label: '1M', range: '1mo', interval: '1d' },
  '3M': { label: '3M', range: '3mo', interval: '1d' },
  '6M': { label: '6M', range: '6mo', interval: '1d' },
  '1Y': { label: '1Y', range: '1y', interval: '1wk' },
  '5Y': { label: '5Y', range: '5y', interval: '1mo' },
};

export const CATEGORY_LABELS: Record<string, string> = {
  stock: 'Stocks',
  crypto: 'Crypto',
  commodity: 'Commodities',
  index: 'Indices',
};

export const REFETCH_INTERVALS = {
  crypto: 30_000,   // 30s  — crypto never sleeps
  stock: 60_000,    // 60s
  commodity: 60_000,
  index: 60_000,
} as const;
