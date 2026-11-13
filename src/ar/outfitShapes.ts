import type { OutfitStyle, Pattern, TopCut } from './outfits';
import { POSE, type PoseFrame } from './pose';

type V = [number, number];
export type Part = 'top' | 'bottom' | 'acc';
// axis = centreline a→b and half-width r, so the painter can lay patterns and hatching along the piece.
export type Shape = {
  part: Part; pts: V[]; fill: string; pattern: Pattern; patternColor: string; z: number;
  axis?: { a: V; b: V; r: number };
};

const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]];
const mul = (a: V, k: number): V => [a[0] * k, a[1] * k];
const lerp = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const dist = (a: V, b: V) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const mid = (a: V, b: V) => lerp(a, b, 0.5);
const norm = (a: V, fallback: V): V => {
  const l = Math.hypot(a[0], a[1]);
  return l < 1e-6 ? fallback : [a[0] / l, a[1] / l];
};
// Perpendicular of d that points down the screen (y grows downward).
const perpDown = (d: V): V => (d[0] >= 0 ? [-d[1], d[0]] : [d[1], -d[0]]);

const px = (p: PoseFrame, i: number, w: number, h: number): V => [p.pts[i].x * w, p.pts[i].y * h];

/** Size unit: shoulder span in canvas pixels, floored so a side-on person still gets a body. */
export function outfitUnit(pose: PoseFrame, w: number, h: number): number {
  return Math.max(dist(px(pose, POSE.lShoulder, w, h), px(pose, POSE.rShoulder, w, h)), 0.06 * w);
}

function capsule(a: V, b: V, ra: number, rb: number, n = 8): V[] {
  const d = norm(sub(b, a), [0, 1]);
  const s: V = [-d[1], d[0]];
  const out: V[] = [add(a, mul(s, ra)), add(b, mul(s, rb))];
  for (let k = 1; k < n; k++) {
    const t = (k / n) * Math.PI;
    out.push(add(b, add(mul(s, rb * Math.cos(t)), mul(d, rb * Math.sin(t)))));
  }
  out.push(add(b, mul(s, -rb)), add(a, mul(s, -ra)));
  for (let k = 1; k < n; k++) {
    const t = (k / n) * Math.PI;
    out.push(add(a, add(mul(s, -ra * Math.cos(t)), mul(d, -ra * Math.sin(t)))));
  }
  return out;
}

// Local frame: x along `dir`, y along `up`.
const local = (c: V, dir: V, up: V) => (x: number, y: number): V => add(c, add(mul(dir, x), mul(up, y)));

function ellipse(c: V, dir: V, up: V, rx: number, ry: number, n = 14): V[] {
  const at = local(c, dir, up);
  return Array.from({ length: n }, (_, k) => at(rx * Math.cos((k / n) * 2 * Math.PI), ry * Math.sin((k / n) * 2 * Math.PI)));
}

function rect(c: V, dir: V, up: V, hw: number, hh: number): V[] {
  const at = local(c, dir, up);
  return [at(-hw, -hh), at(hw, -hh), at(hw, hh), at(-hw, hh)];
}

const HEM: Record<TopCut, number> = { crop: 0.6, tank: 1, tee: 1, shirt: 1, oversize: 1.1, hoodie: 1.1, jacket: 1.1 };

export function buildOutfitShapes(pose: PoseFrame | null, style: OutfitStyle, fullBody: boolean, w: number, h: number): Shape[] {
  if (!pose) return [];
  const P = (i: number) => px(pose, i, w, h);
  const u = outfitUnit(pose, w, h);
  const out: Shape[] = [];
  const push = (part: Part, z: number, pts: V[], fill: string, pattern: Pattern = 'none', patternColor = '#000', axis?: Shape['axis']) =>
    out.push({ part, z, pts, fill, pattern, patternColor, axis });
  const { top, bottom } = style;

  // Torso.
  const L = P(POSE.lShoulder), R = P(POSE.rShoulder), sm = mid(L, R);
  const d = norm(sub(R, L), [1, 0]);
  const down = perpDown(d);
  const widen = top.cut === 'tank' ? -0.05 * u : 0.15 * u;
  const sL = add(sm, mul(d, -(u / 2 + widen))), sR = add(sm, mul(d, u / 2 + widen));
  const HL = P(POSE.lHip), HR = P(POSE.rHip), hm = mid(HL, HR);
  const dh = norm(sub(HR, HL), d);
  const hipHalf = Math.max(dist(HL, HR) / 2, 0.35 * u);
  const hL = add(hm, mul(dh, -(hipHalf + 0.1 * u))), hR = add(hm, mul(dh, hipHalf + 0.1 * u));
  const hipsHidden = (pose.vis[POSE.lHip] + pose.vis[POSE.rHip]) / 2 < 0.4;
  const [hemL, hemR]: V[] = !fullBody && hipsHidden
    ? [[sL[0], h], [sR[0], h]]
    : [lerp(sL, hL, HEM[top.cut]), lerp(sR, hR, HEM[top.cut])];
  const dip = add(sm, mul(down, (top.cut === 'tank' || top.cut === 'shirt' ? 0.2 : 0.1) * u));
  push('top', 1, [sL, add(sm, mul(d, -0.2 * u)), dip, add(sm, mul(d, 0.2 * u)), sR, hemR, hemL],
    top.color, top.pattern, top.patternColor,
    { a: sm, b: mid(hemL, hemR), r: Math.max(dist(hemL, hemR), dist(sL, sR)) / 2 });

  // Sleeves: forearm first so the upper sleeve's outline reads as a cuff.
  if (top.sleeve !== 'none') {
    const r = 0.22 * u * (top.cut === 'oversize' ? 1.25 : 1);
    const sp: Pattern = top.pattern === 'stripes' ? 'stripes' : 'none';
    for (const [s, e, wr] of [[POSE.lShoulder, POSE.lElbow, POSE.lWrist], [POSE.rShoulder, POSE.rElbow, POSE.rWrist]]) {
      const S = P(s), E = P(e), Wr = P(wr);
      const end = top.sleeve === 'short' ? lerp(S, E, 0.5) : E;
      if (top.sleeve === 'long') push('top', 2, capsule(E, Wr, r * 0.9, r * 0.85), top.color, sp, top.patternColor, { a: E, b: Wr, r: r * 0.9 });
      push('top', 2.1, capsule(S, end, r, r * 0.95), top.color, sp, top.patternColor, { a: S, b: end, r });
    }
  }

  // Bottom pieces only when the legs are actually in frame.
  if (fullBody) {
    const KL = P(POSE.lKnee), KR = P(POSE.rKnee), AL = P(POSE.lAnkle), AR = P(POSE.rAnkle);
    const fill = bottom.color, pat = bottom.pattern, pc = bottom.patternColor;
    if (bottom.cut === 'miniskirt') {
      const bL = add(lerp(hL, KL, 0.35), mul(dh, -0.2 * u)), bR = add(lerp(hR, KR, 0.35), mul(dh, 0.2 * u));
      push('bottom', 0, [hL, hR, bR, bL], fill, pat, pc, { a: hm, b: mid(bL, bR), r: dist(bL, bR) / 2 });
    } else {
      const r = (bottom.cut === 'baggy' || bottom.cut === 'cargo' || bottom.cut === 'track' ? 0.32 : 0.25) * u;
      for (const [H, K, A] of [[HL, KL, AL], [HR, KR, AR]]) {
        if (bottom.cut === 'shorts') {
          const end = lerp(H, K, 0.6);
          push('bottom', 0.1, capsule(H, end, r, r), fill, pat, pc, { a: H, b: end, r });
          continue;
        }
        const rk = bottom.cut === 'flare' ? r * 1.08 : r * 0.95;
        const ra = bottom.cut === 'flare' ? 0.4 * u : r * 0.9;
        push('bottom', 0.1, capsule(K, A, rk, ra), fill, pat, pc, { a: K, b: A, r: rk });
        push('bottom', 0.2, capsule(H, K, r, rk), fill, pat, pc, { a: H, b: K, r });
      }
      const r2 = 0.25 * u;
      push('bottom', 0.3, [hL, hR, add(lerp(HR, KR, 0.3), mul(dh, r2)), add(lerp(HL, KL, 0.3), mul(dh, -r2))], fill);
    }
  }

  // Accessories, placed from the pose's eye/ear points.
  const EL = P(POSE.lEye), ER = P(POSE.rEye), em = mid(EL, ER);
  const e = Math.max(dist(P(POSE.lEar), P(POSE.rEar)), 0.3 * u);
  const ed = norm(sub(ER, EL), d);
  const up = mul(perpDown(ed), -1);
  for (const { kind, color } of style.accessories) {
    switch (kind) {
      case 'tintedGlasses':
        push('acc', 3, ellipse(EL, ed, up, 0.17 * e, 0.12 * e), color);
        push('acc', 3, ellipse(ER, ed, up, 0.17 * e, 0.12 * e), color);
        push('acc', 3, rect(em, ed, up, Math.max(dist(EL, ER) / 2 - 0.15 * e, 0.02 * e), 0.02 * e), '#111111');
        break;
      case 'shieldGlasses':
        push('acc', 3, ellipse(em, ed, up, 0.6 * e, 0.14 * e), color);
        break;
      case 'bandana': {
        const c = add(em, mul(up, 0.55 * e)), at = local(c, ed, up);
        push('acc', 3, rect(c, ed, up, 0.58 * e, 0.13 * e), color);
        push('acc', 3, [at(0.55 * e, 0.1 * e), at(0.8 * e, -0.05 * e), at(0.55 * e, -0.12 * e)], color);
        break;
      }
      case 'truckerCap': {
        const c = add(em, mul(up, 0.5 * e)), at = local(c, ed, up);
        push('acc', 3, Array.from({ length: 13 }, (_, k) => at(0.55 * e * Math.cos((k / 12) * Math.PI), 0.5 * e * Math.sin((k / 12) * Math.PI))), color);
        push('acc', 3, ellipse(c, ed, up, 0.65 * e, 0.08 * e), color);
        break;
      }
      case 'headband':
        push('acc', 3, rect(add(em, mul(up, 0.6 * e)), ed, up, 0.52 * e, 0.07 * e), color);
        break;
      case 'butterflyClips':
        for (const k of [-1, 0, 1]) {
          const at = local(add(em, add(mul(up, 0.7 * e), mul(ed, k * 0.3 * e))), ed, up), s = 0.07 * e;
          push('acc', 3, [at(-2 * s, -1.3 * s), at(0, 0), at(2 * s, -1.3 * s), at(2 * s, 1.3 * s), at(0, 0), at(-2 * s, 1.3 * s)], color);
        }
        break;
      case 'choker':
        push('acc', 3, rect(add(sm, mul(down, -0.15 * u)), d, mul(down, -1), 0.2 * u, 0.04 * u), color);
        break;
      case 'chain': {
        const a = add(sm, mul(d, -0.22 * u)), v = add(sm, mul(down, 0.35 * u)), b = add(sm, mul(d, 0.22 * u));
        for (let k = 0; k <= 8; k++) {
          const c = k <= 4 ? lerp(a, v, k / 4) : lerp(v, b, (k - 4) / 4);
          push('acc', 3, ellipse(c, d, mul(down, -1), 0.035 * u, 0.035 * u, 8), color);
        }
        break;
      }
      case 'hoops':
        for (const ear of [P(POSE.lEar), P(POSE.rEar)]) {
          const c = add(ear, mul(up, -0.18 * e));
          // Outer ring then inner ring reversed: the painter fills even-odd, so this is a hoop.
          push('acc', 3, [...ellipse(c, ed, up, 0.1 * e, 0.1 * e), ...ellipse(c, ed, up, 0.065 * e, 0.065 * e).reverse()], color);
        }
        break;
      case 'studBelt':
        if (!fullBody) break;
        push('acc', 3, rect(hm, dh, mul(perpDown(dh), -1), hipHalf + 0.15 * u, 0.06 * u), '#1f1f24');
        for (const k of [-0.75, -0.375, 0, 0.375, 0.75]) push('acc', 3, rect(add(hm, mul(dh, k * hipHalf)), dh, mul(perpDown(dh), -1), 0.03 * u, 0.03 * u), color);
        break;
    }
  }

  return out.sort((a, b) => a.z - b.z);
}
