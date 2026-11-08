import type { P3 } from './smoothing';

// MediaPipe HAND_CONNECTIONS (literal: this module must not import mediapipe).
const BONES = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
const PALM = [0, 1, 5, 9, 13, 17];
const SEG = 12;
const UV_SCALE = 8;

export function buildHandGeometry(hands: P3[][]) {
  const pos: number[] = [];
  const idx: number[] = [];
  const vert = (x: number, y: number) => (pos.push(x, y, 0), pos.length / 3 - 1);

  for (const h of hands) {
    const w = 0.18 * Math.hypot(h[0].x - h[9].x, h[0].y - h[9].y);
    for (const [a, b] of BONES) {
      const dx = h[b].x - h[a].x, dy = h[b].y - h[a].y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = (-dy / len) * w, ny = (dx / len) * w;
      const i = vert(h[a].x + nx, h[a].y + ny);
      vert(h[a].x - nx, h[a].y - ny);
      vert(h[b].x - nx, h[b].y - ny);
      vert(h[b].x + nx, h[b].y + ny);
      idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
    }
    for (const p of h) {
      const c = vert(p.x, p.y);
      for (let s = 0; s < SEG; s++) {
        const t = (s / SEG) * Math.PI * 2;
        vert(p.x + Math.cos(t) * w, p.y + Math.sin(t) * w);
      }
      for (let s = 0; s < SEG; s++) idx.push(c, c + 1 + s, c + 1 + ((s + 1) % SEG));
    }
    const f = PALM.map((j) => vert(h[j].x, h[j].y));
    for (let k = 1; k + 1 < f.length; k++) idx.push(f[0], f[k], f[k + 1]);
  }

  const uvs = new Float32Array(pos.length / 3 * 2);
  for (let i = 0; i < pos.length / 3; i++) {
    uvs[2 * i] = pos[3 * i] * UV_SCALE;
    uvs[2 * i + 1] = pos[3 * i + 1] * UV_SCALE;
  }
  return { positions: new Float32Array(pos), uvs, indices: new Uint32Array(idx) };
}
