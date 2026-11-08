import { buildHandGeometry } from '../handMesh';
import { HAND } from './fixtures/hand';

test('empty', () => {
  const g = buildHandGeometry([]);
  expect(g.positions.length + g.uvs.length + g.indices.length).toBe(0);
});

test('one and two hands', () => {
  const one = buildHandGeometry([HAND]);
  expect(one.indices.length).toBeGreaterThan(0);
  expect(one.indices.length % 3).toBe(0);
  const n = one.positions.length / 3;
  expect(one.uvs.length / 2).toBe(n);
  expect(Math.max(...one.indices)).toBeLessThan(n);
  const two = buildHandGeometry([HAND, HAND]);
  expect(two.positions.length).toBe(2 * one.positions.length);
});
