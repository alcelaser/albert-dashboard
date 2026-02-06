import type { TimeRange } from '../types';
import { TIME_RANGES } from '../config/assets';

interface TimeRangeSelectorProps {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
  excludeRanges?: TimeRange[];
}

export default function TimeRangeSelector({ selected, onChange, excludeRanges = [] }: TimeRangeSelectorProps) {
  const ranges = (Object.keys(TIME_RANGES) as TimeRange[]).filter(
    (r) => !excludeRanges.includes(r)
  );

  return (
    <div className="flex gap-1">
      {ranges.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={`
            px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer
            ${
              selected === range
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-muted hover:bg-surface-hover hover:text-zinc-300'
            }
          `}
        >
          {TIME_RANGES[range].label}
        </button>
      ))}
    </div>
  );
}
