const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// @mediapipe/tasks-vision contains `import(t.toString())`, which Metro rejects. That branch is only a
// module-worker fallback (the page loads its wasm loader via <script>), so stub it in a cached copy.
const src = path.join(__dirname, 'node_modules/@mediapipe/tasks-vision/vision_bundle.mjs');
const patched = path.join(__dirname, 'node_modules/.cache/mediapipe/vision_bundle.mjs');
fs.mkdirSync(path.dirname(patched), { recursive: true });
fs.writeFileSync(
  patched,
  fs.readFileSync(src, 'utf8').replace('import(t.toString())', 'Promise.reject(new Error("dynamic import unsupported"))'),
);

const resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (ctx, name, platform) =>
  name === '@mediapipe/tasks-vision'
    ? { type: 'sourceFile', filePath: patched }
    : (resolveRequest ?? ctx.resolveRequest)(ctx, name, platform);
module.exports = config;
