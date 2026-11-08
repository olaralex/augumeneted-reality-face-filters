export type P3 = { x: number; y: number; z: number };

export function createSmoother(alpha = 0.6) {
  let prev: P3[] | null = null;
  return {
    next(points: P3[] | null): P3[] | null {
      if (!points) return (prev = null);
      const p = prev;
      prev = points.map((q, i) => {
        const o = p?.[i];
        return o
          ? { x: alpha * q.x + (1 - alpha) * o.x, y: alpha * q.y + (1 - alpha) * o.y, z: alpha * q.z + (1 - alpha) * o.z }
          : { ...q };
      });
      return prev;
    },
  };
}
