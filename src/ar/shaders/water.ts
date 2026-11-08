import { rgb } from './common';

// Translucent blue skin, ripples flowing down the face, glossy specular streaks.
export const WATER = /* glsl */ `
void main() {
  vec2 q = vec2(vUv.x * 7.0, (vUv.y + uTime * 0.15) * 5.0);
  float h = fbm(q);
  vec2 g = vec2(fbm(q + vec2(0.05, 0.0)) - h, fbm(q + vec2(0.0, 0.05)) - h) / 0.05;
  vec3 nrm = normalize(vec3(-1.5 * g, 1.0));
  float spec = pow(max(dot(nrm, normalize(vec3(0.4, -0.6, 0.7))), 0.0), 12.0);
  vec3 col = mix(${rgb('#1e5bd8')}, uAccent, 0.3) * (0.65 + 0.7 * h);
  col = mix(col, ${rgb('#e8f4ff')}, spec);
  gl_FragColor = vec4(col, (0.75 + 0.25 * spec) * edgeFade());
}
`;
