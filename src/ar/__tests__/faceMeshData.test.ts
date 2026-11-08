import { FACE_UVS, FACE_INDICES, FACE_EDGE } from '../faceMeshData';

const L = [33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246];
const R = [263,249,390,373,374,380,381,382,362,398,384,385,386,387,388,466];
const M = [78,95,88,178,87,14,317,402,318,324,308,191,80,81,82,13,312,311,310,415];

test('face mesh data', () => {
  expect(FACE_UVS.length).toBe(936);
  expect(FACE_EDGE.length).toBe(468);
  expect(FACE_UVS.every((v) => v >= 0 && v <= 1)).toBe(true);
  expect(FACE_INDICES.length % 3).toBe(0);
  expect(FACE_INDICES.length / 3).toBeGreaterThan(800);
  expect(Math.max(...FACE_INDICES)).toBeLessThan(468);
  expect(FACE_EDGE[10]).toBe(0);
  expect(FACE_EDGE[1]).toBe(1);
  for (const ring of [L, R, M]) {
    const s = new Set(ring);
    for (let i = 0; i < FACE_INDICES.length; i += 3) {
      const inside = [0, 1, 2].every((k) => s.has(FACE_INDICES[i + k]));
      expect(inside).toBe(false);
    }
  }
});
