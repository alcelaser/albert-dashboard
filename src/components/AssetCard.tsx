import type { Asset } from '../types';
import { useQuoteData } from '../hooks/useMarketData';
import { formatPrice, formatPercent, changeColor } from '../utils/format';
import Sparkline from './Sparkline';

interface AssetCardProps {
  asset: Asset;
  selected: boolean;
  onClick: () => void;
}

export default function AssetCard({ asset, selected, onClick }: AssetCardProps) {
  const { data, isLoading } = useQuoteData(asset);
  const quote = data?.quote;
  const history = data?.history ?? [];

  const sparklineColor = quote
    ? quote.changePercent >= 0
      ? '#22c55e'
      : '#ef4444'
    : asset.color;

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left rounded-xl p-4 transition-all duration-200
        border bg-surface hover:bg-surface-hover cursor-pointer
        ${selected ? 'border-zinc-500 ring-1 ring-zinc-500/30' : 'border-border'}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: asset.color }}
            />
            <span className="font-semibold text-sm text-zinc-100 truncate">
              {asset.symbol}
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5 truncate">{asset.name}</p>
        </div>
        <Sparkline data={history.slice(-30)} color={sparklineColor} width={80} height={32} />
      </div>

      {isLoading && !quote ? (
        <div className="h-8 flex items-center">
          <div className="w-20 h-4 bg-zinc-800 rounded animate-pulse" />
        </div>
      ) : quote ? (
        <div className="flex items-end justify-between gap-2">
          <span className="text-lg font-bold text-zinc-50 tabular-nums">
            ${formatPrice(quote.price)}
          </span>
          <span className={`text-xs font-medium tabular-nums ${changeColor(quote.changePercent)}`}>
            {formatPercent(quote.changePercent)}
          </span>
        </div>
      ) : (
        <span className="text-xs text-red-400">Error loading data</span>
      )}
    </button>
  );
}
