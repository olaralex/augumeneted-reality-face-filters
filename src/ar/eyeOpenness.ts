import type { P3 } from './smoothing';

// [top lid, bottom lid, outer corner, inner corner]
const EYE = { left: [159, 145, 33, 133], right: [386, 374, 263, 362] } as const;

/** Lid gap over eye width. `aspect` = videoHeight/videoWidth makes normalized x and y comparable. */
export function eyeOpenness(face: P3[], side: 'left' | 'right', aspect = 1): number {
  const [t, b, o, i] = EYE[side].map((k) => face[k]);
  const d = (p: P3, q: P3) => Math.hypot(p.x - q.x, (p.y - q.y) * aspect);
  return d(t, b) / (d(o, i) || 1);
}

export function glowOpacity(ratio: number): number {
  return Math.min(1, Math.max(0, (ratio - 0.1) / 0.15));
}
