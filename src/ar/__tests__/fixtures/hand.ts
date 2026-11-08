import type { P3 } from '../../smoothing';

// Open palm, 21 MediaPipe joints (normalized image space, y down).
const f = (x: number, y: number): P3 => ({ x, y, z: 0 });
export const HAND: P3[] = [
  f(0.5, 0.8),
  f(0.42, 0.74), f(0.37, 0.68), f(0.33, 0.62), f(0.3, 0.57),
  f(0.44, 0.58), f(0.43, 0.48), f(0.42, 0.4), f(0.41, 0.33),
  f(0.5, 0.56), f(0.5, 0.45), f(0.5, 0.36), f(0.5, 0.28),
  f(0.56, 0.58), f(0.57, 0.48), f(0.58, 0.4), f(0.59, 0.34),
  f(0.62, 0.62), f(0.64, 0.54), f(0.66, 0.48), f(0.67, 0.43),
];
