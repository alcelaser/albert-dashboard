import type { PricePoint } from '../types';

export interface SMAPoint {
  time: string;
  value: number;
}

/**
 * Compute Simple Moving Average over `period` data points.
 * Returns an array aligned with the tail of the input (shorter by period - 1).
 */
export function computeSMA(data: PricePoint[], period: number): SMAPoint[] {
  if (data.length < period) return [];

  const result: SMAPoint[] = [];
  let sum = 0;

  // Seed the first window
  for (let i = 0; i < period; i++) {
    sum += data[i].value;
  }
  result.push({ time: data[period - 1].time, value: sum / period });

  // Slide the window
  for (let i = period; i < data.length; i++) {
    sum += data[i].value - data[i - period].value;
    result.push({ time: data[i].time, value: sum / period });
  }

  return result;
}

/**
 * Compute Exponential Moving Average over `period` data points.
 */
export function computeEMA(data: PricePoint[], period: number): SMAPoint[] {
  if (data.length < period) return [];

  const k = 2 / (period + 1);
  const result: SMAPoint[] = [];

  // Seed with SMA of first `period` points
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i].value;
  let ema = sum / period;
  result.push({ time: data[period - 1].time, value: ema });

  for (let i = period; i < data.length; i++) {
    ema = data[i].value * k + ema * (1 - k);
    result.push({ time: data[i].time, value: ema });
  }

  return result;
}

/**
 * Compute Bollinger Bands (SMA ± 2σ).
 */
export function computeBollingerBands(
  data: PricePoint[],
  period: number = 20,
  stdDevMult: number = 2
): { upper: SMAPoint[]; middle: SMAPoint[]; lower: SMAPoint[] } {
  if (data.length < period) return { upper: [], middle: [], lower: [] };

  const upper: SMAPoint[] = [];
  const middle: SMAPoint[] = [];
  const lower: SMAPoint[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const window = data.slice(i - period + 1, i + 1);
    const mean = window.reduce((s, p) => s + p.value, 0) / period;
    const variance = window.reduce((s, p) => s + (p.value - mean) ** 2, 0) / period;
    const stdDev = Math.sqrt(variance);
    const time = data[i].time;

    upper.push({ time, value: mean + stdDevMult * stdDev });
    middle.push({ time, value: mean });
    lower.push({ time, value: mean - stdDevMult * stdDev });
  }

  return { upper, middle, lower };
}
