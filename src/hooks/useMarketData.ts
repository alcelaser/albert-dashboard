import { useQuery } from '@tanstack/react-query';
import type { Asset, TimeRange, AssetQuote, PricePoint, OHLC, VolumeBar } from '../types';
import { REFETCH_INTERVALS } from '../config/assets';
import { fetchYahooChart } from '../api/yahoo';
import { fetchCoinGeckoChart } from '../api/coingecko';

export interface MarketData {
  quote: AssetQuote | null;
  history: PricePoint[];
  ohlc: OHLC[];
  volume: VolumeBar[];
}

async function fetchAssetData(asset: Asset, timeRange: TimeRange): Promise<MarketData> {
  if (asset.coingeckoId) {
    return await fetchCoinGeckoChart(asset.coingeckoId, timeRange);
  }
  if (asset.yahooSymbol) {
    return await fetchYahooChart(asset.yahooSymbol, timeRange);
  }
  throw new Error(`No data source for ${asset.symbol}`);
}

/**
 * React Query hook for a single asset's market data.
 */
export function useMarketData(asset: Asset, timeRange: TimeRange) {
  const isCrypto = asset.category === 'crypto';
  return useQuery<MarketData>({
    queryKey: ['market', asset.id, timeRange],
    queryFn: () => fetchAssetData(asset, timeRange),
    refetchInterval: REFETCH_INTERVALS[asset.category],
    staleTime: isCrypto ? 30_000 : 15_000, // longer for crypto to ease rate limits
    retry: isCrypto ? 1 : 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    placeholderData: (prev) => prev,
  });
}

/**
 * Hook that returns quote-only data (for the cards on the dashboard).
 * Uses 1M range for the sparkline but fetches like normal.
 */
export function useQuoteData(asset: Asset) {
  const isCrypto = asset.category === 'crypto';
  return useQuery<MarketData>({
    queryKey: ['market', asset.id, '1M'],
    queryFn: () => fetchAssetData(asset, '1M'),
    refetchInterval: REFETCH_INTERVALS[asset.category],
    staleTime: isCrypto ? 30_000 : 15_000,
    retry: isCrypto ? 1 : 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    placeholderData: (prev) => prev,
  });
}
