import { createSmoother, type P3 } from './smoothing';

const JUMP = 0.1; // wrist move (normalized image units) that means "a different hand"

// MediaPipe's hand order isn't stable, so smoothers are keyed by handedness ('Left'/'Right').
// Without a usable unique label the array slot is the key. A wrist jump resets the smoother,
// and a key with no hand this frame is reset, so two hands are never blended.
export function createHandSmoothers() {
  const byKey = new Map<string, { s: ReturnType<typeof createSmoother>; wrist: P3 | null }>();
  return {
    next(hands: P3[][], sides: (string | undefined)[]): P3[][] {
      const used = new Set<string>();
      const out = hands.map((h, i) => {
        const side = sides[i];
        const key = (side === 'Left' || side === 'Right') && !used.has(side) ? side : `slot${i}`;
        used.add(key);
        let e = byKey.get(key);
        if (!e) byKey.set(key, (e = { s: createSmoother(), wrist: null }));
        if (e.wrist && Math.hypot(h[0].x - e.wrist.x, h[0].y - e.wrist.y) > JUMP) e.s.next(null);
        e.wrist = h[0];
        return e.s.next(h)!;
      });
      for (const [k, e] of byKey) if (!used.has(k)) { e.s.next(null); e.wrist = null; }
      return out;
    },
  };
}
