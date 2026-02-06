import { useState } from 'react';
import type { Asset, AssetCategory, TimeRange } from '../types';
import { ASSETS, CATEGORY_LABELS } from '../config/assets';
import AssetCard from './AssetCard';
import PriceChart from './PriceChart';

const CATEGORIES: AssetCategory[] = ['stock', 'crypto', 'commodity', 'index'];

export default function Dashboard() {
  const [selectedAsset, setSelectedAsset] = useState<Asset>(ASSETS[0]);
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [activeCategory, setActiveCategory] = useState<AssetCategory | 'all'>('all');

  const filteredAssets =
    activeCategory === 'all'
      ? ASSETS
      : ASSETS.filter((a) => a.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
            activeCategory === 'all'
              ? 'bg-zinc-700 text-zinc-100'
              : 'text-muted hover:bg-surface-hover hover:text-zinc-300'
          }`}
        >
          All Assets
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeCategory === cat
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-muted hover:bg-surface-hover hover:text-zinc-300'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filteredAssets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            selected={selectedAsset.id === asset.id}
            onClick={() => setSelectedAsset(asset)}
          />
        ))}
      </div>

      {/* Main Chart */}
      <PriceChart
        asset={selectedAsset}
        timeRange={selectedAsset.category === 'crypto' && timeRange === '5Y' ? '1Y' : timeRange}
        onTimeRangeChange={setTimeRange}
      />

      {/* Footer info */}
      <p className="text-center text-xs text-muted pb-4">
        Data from Yahoo Finance &amp; CoinGecko · Auto-refreshes every 30–60s · Not financial advice
      </p>
    </div>
  );
}
