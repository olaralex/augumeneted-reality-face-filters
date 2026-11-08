import { createGovernor } from '../governor';

test('governor steps down and back up', () => {
  const g = createGovernor();
  const run = (n: number, ms: number) => Array.from({ length: n }, () => g.tick(ms));
  let r = run(30, 20);
  expect(r.every((x) => x.detectHandsThisFrame && x.pixelRatio === 1 && x.detail === 2)).toBe(true);
  run(30, 50);
  r = run(4, 50);
  const h = r.map((x) => x.detectHandsThisFrame);
  expect(h[0]).not.toBe(h[1]);
  expect(h[0]).toBe(h[2]);
  expect(h[1]).toBe(h[3]);
  expect(r[0].pixelRatio).toBe(1);
  expect(run(30, 50).pop()!.pixelRatio).toBe(0.75);
  expect(run(30, 50).pop()!.detail).toBe(1);
  let l = run(120, 20).pop()!;
  expect(l.detail).toBe(2);
  expect(l.pixelRatio).toBe(0.75);
  expect(run(120, 20).pop()!.pixelRatio).toBe(1);
  run(120, 20);
  r = run(10, 20);
  expect(r.every((x) => x.detectHandsThisFrame)).toBe(true);
});
