import { buildOutfitShapes, type Shape } from '../outfitShapes';
import { OUTFIT_STYLES } from '../outfits';
import { OUTFITS } from '../../theme';
import type { PoseFrame } from '../pose';

const W = 640, H = 480;

function standing(over: Record<number, [number, number]> = {}): PoseFrame {
  const at: Record<number, [number, number]> = {
    0: [0.5, 0.15], 2: [0.47, 0.13], 5: [0.53, 0.13], 7: [0.44, 0.14], 8: [0.56, 0.14],
    11: [0.4, 0.3], 12: [0.6, 0.3], 13: [0.37, 0.42], 14: [0.63, 0.42], 15: [0.36, 0.52], 16: [0.64, 0.52],
    23: [0.42, 0.55], 24: [0.58, 0.55], 25: [0.43, 0.75], 26: [0.57, 0.75], 27: [0.43, 0.95], 28: [0.57, 0.95],
    ...over,
  };
  const pts = Array.from({ length: 33 }, (_, i) => ({ x: at[i]?.[0] ?? 0.5, y: at[i]?.[1] ?? 0.5, z: 0 }));
  return { pts, vis: Array(33).fill(0.9) };
}

const parts = (s: Shape[], p: Shape['part']) => s.filter((x) => x.part === p);

test('no person -> no shapes', () => {
  expect(buildOutfitShapes(null, OUTFIT_STYLES.velour, true, W, H)).toEqual([]);
});

test('bust only draws no bottom pieces', () => {
  const s = buildOutfitShapes(standing(), OUTFIT_STYLES.velour, false, W, H);
  expect(parts(s, 'bottom')).toHaveLength(0);
  expect(parts(s, 'top').length).toBeGreaterThan(0);
});

test('full body draws bottom pieces', () => {
  expect(parts(buildOutfitShapes(standing(), OUTFIT_STYLES.velour, true, W, H), 'bottom').length).toBeGreaterThan(0);
});

test('sleeveless top is just the torso', () => {
  const s = buildOutfitShapes(standing(), OUTFIT_STYLES.satin, true, W, H);
  expect(parts(s, 'top')).toHaveLength(1);
  expect(parts(s, 'acc').length).toBeGreaterThan(0);
});

test('side-on person (coincident shoulders) stays finite with a minimum torso width', () => {
  const s = buildOutfitShapes(standing({ 11: [0.5, 0.3], 12: [0.5, 0.3] }), OUTFIT_STYLES.flames, true, W, H);
  for (const sh of s) for (const [x, y] of sh.pts) expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
  const torso = parts(s, 'top')[0].pts.map(([x]) => x);
  expect(Math.max(...torso) - Math.min(...torso)).toBeGreaterThanOrEqual(0.06 * W);
});

test('shapes come sorted bottom-up by z', () => {
  const z = buildOutfitShapes(standing(), OUTFIT_STYLES.tracksuit, true, W, H).map((s) => s.z);
  expect(z).toEqual([...z].sort((a, b) => a - b));
});

test('every outfit has a style', () => {
  for (const o of OUTFITS) expect(OUTFIT_STYLES[o.id]).toBeDefined();
});
