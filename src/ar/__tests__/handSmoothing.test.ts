import { createHandSmoothers } from '../handSmoothing';
import type { P3 } from '../smoothing';

const hand = (x: number): P3[] => [{ x, y: 0.5, z: 0 }];
const xs = (hs: P3[][]) => hs.map((h) => h[0].x);

test('smooths each hand by handedness even when MediaPipe swaps order', () => {
  const s = createHandSmoothers();
  s.next([hand(0.2), hand(0.8)], ['Left', 'Right']);
  const out = xs(s.next([hand(0.82), hand(0.22)], ['Right', 'Left']));
  expect(out[0]).toBeCloseTo(0.6 * 0.82 + 0.4 * 0.8);
  expect(out[1]).toBeCloseTo(0.6 * 0.22 + 0.4 * 0.2);
});

test('an absent hand resets its smoother', () => {
  const s = createHandSmoothers();
  s.next([hand(0.2)], ['Left']);
  s.next([], []);
  expect(xs(s.next([hand(0.25)], ['Left']))).toEqual([0.25]);
});

test('duplicate label: second hand falls back to its slot, not the same smoother', () => {
  const s = createHandSmoothers();
  s.next([hand(0.2), hand(0.8)], ['Left', 'Left']);
  const out = xs(s.next([hand(0.2), hand(0.8)], ['Left', 'Left']));
  expect(out[0]).toBeCloseTo(0.2);
  expect(out[1]).toBeCloseTo(0.8);
});

test('no handedness: slot smoother resets when the wrist jumps', () => {
  const s = createHandSmoothers();
  s.next([hand(0.2), hand(0.8)], []);
  const near = xs(s.next([hand(0.25), hand(0.2)], []));
  expect(near[0]).toBeCloseTo(0.6 * 0.25 + 0.4 * 0.2); // small move: smoothed
  expect(near[1]).toBeCloseTo(0.2); // jumped 0.6: reset, not blended
});
