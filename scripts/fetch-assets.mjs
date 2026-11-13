import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('public/models', { recursive: true });
cpSync('node_modules/@mediapipe/tasks-vision/wasm', 'public/wasm', { recursive: true });

const base = 'https://storage.googleapis.com/mediapipe-models';
const models = {
  face_landmarker: `${base}/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
  hand_landmarker: `${base}/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
  pose_landmarker: `${base}/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
};
for (const [name, url] of Object.entries(models)) {
  const out = `public/models/${name}.task`;
  if (existsSync(out)) continue;
  const res = await fetch(url);
  if (res.status !== 200) {
    console.error(`fetch ${url} -> ${res.status}`);
    process.exit(1);
  }
  writeFileSync(out, Buffer.from(await res.arrayBuffer()));
}
