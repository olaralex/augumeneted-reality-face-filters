import { rgb } from './common';

// Bluish crystal skin, white frost cracks, fresnel-like rim, slow shimmer.
export const ICE = /* glsl */ `
void main() {
  vec2 p = vUv * 6.0;
  float n = fbm(p * 1.3 + vec2(uTime * 0.05, 0.0));
  vec2 v = voronoi(p + n * 0.4);
  float frost = 1.0 - smoothstep(0.0, 0.035, v.x);
  float rim = 1.0 - smoothstep(0.2, 0.9, vEdge);
  float shimmer = 0.5 + 0.5 * sin(uTime * 1.5 + (n + v.y) * 6.2832);
  vec3 col = ${rgb('#bfe6ff')} * (0.85 + 0.15 * n);
  col = mix(col, uAccent, 0.3 * v.y);
  col += rim * 0.35 + shimmer * 0.08;
  col = mix(col, vec3(1.0), frost);
  gl_FragColor = vec4(min(col, vec3(1.0)), max(0.85, frost) * edgeFade());
}
`;
