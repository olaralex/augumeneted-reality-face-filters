import { createSmoother, P3 } from '../smoothing';

const pt = (v: number): P3[] => [{ x: v, y: v, z: v }];

test('reset on null', () => {
  const s = createSmoother(0.6);
  expect(s.next(pt(1))).toEqual(pt(1));
  const b = s.next(pt(2))![0];
  expect(b.x).toBeCloseTo(0.6 * 2 + 0.4 * 1);
  expect(s.next(null)).toBeNull();
  expect(s.next(pt(5))).toEqual(pt(5));
});
