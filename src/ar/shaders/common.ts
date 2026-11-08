// GLSL1-style source; three compiles it as GLSL ES 3.00 on WebGL2 and injects position/uv/matrices.

/** '#rrggbb' → GLSL vec3 of raw sRGB components (shaders write sRGB straight to the canvas). */
export const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `vec3(${[n >> 16, (n >> 8) & 255, n & 255].map((c) => (c / 255).toFixed(4)).join(', ')})`;
};

export const VERTEX = /* glsl */ `
attribute float aEdge;
varying vec2 vUv;
varying float vEdge;
void main() {
  vUv = uv;
  vEdge = aEdge;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const FRAGMENT_HEAD = /* glsl */ `
uniform float uTime;
uniform float uDetail;
uniform vec3 uAccent;
varying vec2 vUv;
varying float vEdge;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// octaves = 2 + uDetail (uDetail 0..2); fixed max bound with break for strict compilers.
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  int n = 2 + int(uDetail + 0.5);
  for (int i = 0; i < 4; i++) {
    if (i >= n) break;
    v += a * vnoise(p);
    p = p * 2.03 + vec2(17.0, 9.0);
    a *= 0.5;
  }
  return v;
}

// x: distance to the nearest cell border (F2 - F1), y: random per-cell value.
vec2 voronoi(vec2 p) {
  vec2 n = floor(p);
  vec2 f = fract(p);
  float d1 = 8.0;
  float d2 = 8.0;
  float id = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = vec2(hash(n + g), hash(n + g + vec2(31.7, 11.3)));
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; id = hash(n + g + vec2(7.1, 3.9)); }
      else if (d < d2) { d2 = d; }
    }
  }
  return vec2(sqrt(d2) - sqrt(d1), id);
}

// Fades the mask into real skin at the face border (vEdge = 0 on border vertices).
float edgeFade() { return smoothstep(0.0, 0.35, vEdge); }
`;
