import { rgb } from './common';

// Dark lava rock with glowing, pulsing orange cracks.
export const FIRE = /* glsl */ `
void main() {
  vec2 p = vUv * 7.0;
  float n = fbm(p * 0.8);
  vec2 v = voronoi(p + n * 0.6);
  float crack = 1.0 - smoothstep(0.0, 0.15, v.x);
  float core = 1.0 - smoothstep(0.0, 0.06, v.x);
  float halo = 1.0 - smoothstep(0.0, 0.4, v.x);
  vec3 rock = ${rgb('#2b1410')} * (0.6 + 0.8 * n) * (0.85 + 0.3 * v.y);
  float pulse = 0.75 + 0.25 * sin(uTime * 3.0 + n);
  vec3 glow = mix(uAccent, ${rgb('#ffd36b')}, core) * pulse;
  vec3 col = mix(rock, glow, crack) + uAccent * 0.3 * halo * pulse;
  gl_FragColor = vec4(min(col, vec3(1.0)), edgeFade());
}
`;
