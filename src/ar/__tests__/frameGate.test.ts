import { createFrameGate } from '../frameGate';

test('detects once per camera frame, first frame included', () => {
  const g = createFrameGate();
  expect(g.next(0, true)).toEqual({ detect: true, hands: true });
  expect(g.next(0, true)).toEqual({ detect: false, hands: false });
  expect(g.next(0.033, true)).toEqual({ detect: true, hands: true });
});

test('hand alternation never starves when it lines up with repeated frames', () => {
  const g = createFrameGate();
  // 60 Hz rAF, 30 fps camera: new frames always land on the governor's "no hands" ticks.
  const handsOn: boolean[] = [];
  for (let i = 0; i < 8; i++) {
    const r = g.next(Math.floor((i + 1) / 2), i % 2 === 0);
    if (r.detect) handsOn.push(r.hands);
  }
  expect(handsOn).toEqual([true, false, true, false, true]);
});
