import { eyeOpenness, glowOpacity } from '../eyeOpenness';
import type { P3 } from '../smoothing';

test('glowOpacity maps 0.1→0 and 0.25→1, clamped', () => {
  expect(glowOpacity(0.05)).toBe(0);
  expect(glowOpacity(0.1)).toBe(0);
  expect(glowOpacity(0.175)).toBeCloseTo(0.5);
  expect(glowOpacity(0.25)).toBe(1);
  expect(glowOpacity(0.4)).toBe(1);
});

test('eyeOpenness = |p159−p145| / |p33−p133|', () => {
  const face: P3[] = Array.from({ length: 478 }, () => ({ x: 0, y: 0, z: 0 }));
  face[159] = { x: 0.3, y: 0.40, z: 0 };
  face[145] = { x: 0.3, y: 0.42, z: 0 };
  face[33] = { x: 0.25, y: 0.41, z: 0 };
  face[133] = { x: 0.35, y: 0.41, z: 0 };
  expect(eyeOpenness(face, 'left')).toBeCloseTo(0.2);
  expect(eyeOpenness(face, 'left', 2)).toBeCloseTo(0.4); // y scaled by aspect
});
