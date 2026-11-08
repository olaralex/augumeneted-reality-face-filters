import { rgb } from './common';

// Cracked stone/clay, green moss in wide cracks, subtle dust shimmer.
export const EARTH = /* glsl */ `
void main() {
  vec2 p = vUv * 5.0;
  float n = fbm(p * 1.7);
  vec2 v = voronoi(p + n * 0.5);
  vec3 col = ${rgb('#6b4f36')} * (0.7 + 0.6 * n) * (0.9 + 0.2 * v.y);
  float crack = 1.0 - smoothstep(0.06, 0.2, v.x);
  float moss = (1.0 - smoothstep(0.0, 0.1, v.x)) * (0.6 + 0.4 * n);
  col = mix(col, col * 0.25, crack);
  col = mix(col, ${rgb('#4f7a3a')} * (0.7 + 0.6 * n), moss);
  col += uAccent * 0.15 * smoothstep(0.85, 1.0, vnoise(vUv * 120.0 + uTime * 0.5));
  gl_FragColor = vec4(col, edgeFade());
}
`;
