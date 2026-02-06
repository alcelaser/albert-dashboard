import type { PricePoint } from '../types';

interface SparklineProps {
  data: PricePoint[];
  color: string;
  width?: number;
  height?: number;
}

/**
 * Lightweight SVG sparkline — no external chart library, ~0 overhead.
 */
export default function Sparkline({ data, color, width = 80, height = 32 }: SparklineProps) {
  if (data.length < 2) {
    return <svg width={width} height={height} />;
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const padding = 2;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const points = values
    .map((v, i) => {
      const x = padding + (i / (values.length - 1)) * chartW;
      const y = padding + chartH - ((v - min) / range) * chartH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="flex-shrink-0"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
