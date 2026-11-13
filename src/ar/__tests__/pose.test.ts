import { createBustGate, pickClosestPose, type PoseFrame } from '../pose';

const visLower = (v: number) => Array.from({ length: 33 }, (_, i) => (i >= 23 && i <= 26 ? v : 0.9));

function person(l: [number, number], r: [number, number]): PoseFrame {
  const pts = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
  pts[11] = { x: l[0], y: l[1], z: 0 };
  pts[12] = { x: r[0], y: r[1], z: 0 };
  return { pts, vis: visLower(0.9) };
}

describe('pickClosestPose', () => {
  it('picks the widest shoulder span', () => {
    const near = person([0.3, 0.4], [0.6, 0.4]);
    const far = person([0.7, 0.4], [0.8, 0.4]);
    expect(pickClosestPose([far, near], 1)).toBe(near);
  });
  it('returns null when nobody is detected', () => {
    expect(pickClosestPose([], 1)).toBeNull();
  });
  it('corrects vertical span by the video aspect', () => {
    const tilted = person([0.5, 0.3], [0.5, 0.7]); // dy 0.4 -> 0.225 at 16:9
    const level = person([0.35, 0.4], [0.65, 0.4]); // dx 0.3
    expect(pickClosestPose([tilted, level], 0.5625)).toBe(level);
  });
});

describe('createBustGate', () => {
  it('switches with hysteresis and resets on null', () => {
    const g = createBustGate();
    expect(g.next(visLower(0.5))).toBe(false);
    expect(g.next(visLower(0.7))).toBe(true);
    expect(g.next(visLower(0.5))).toBe(true);
    expect(g.next(visLower(0.3))).toBe(false);
    expect(g.next(visLower(0.5))).toBe(false);
    g.next(visLower(0.7));
    expect(g.next(null)).toBe(false);
    expect(g.next(visLower(0.5))).toBe(false);
  });
});
