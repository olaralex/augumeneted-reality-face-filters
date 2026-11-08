import * as THREE from 'three';
import type { ElementId } from '../theme';
import { FACE_UVS, FACE_INDICES, FACE_EDGE } from './faceMeshData';
import { buildHandGeometry } from './handMesh';
import type { P3 } from './smoothing';

const N = 468;
const common = { side: THREE.DoubleSide, transparent: true, depthTest: false } as const;

export function createScene(canvas: HTMLCanvasElement, video: HTMLVideoElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, preserveDrawingBuffer: true, antialias: true });
  // left=1/right=0 mirrors x; top=0/bottom=1 matches MediaPipe's y-down.
  const camera = new THREE.OrthographicCamera(1, 0, 0, 1, -10, 10);
  const scene = new THREE.Scene();

  const videoTex = new THREE.VideoTexture(video);
  videoTex.colorSpace = THREE.SRGBColorSpace;
  videoTex.flipY = false; // plane v=1 sits at world y=1 (screen bottom); image top must map to y=0
  const bg = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: videoTex, side: THREE.DoubleSide, depthTest: false }),
  );
  bg.position.set(0.5, 0.5, -1);
  scene.add(bg);

  const faceGeo = new THREE.BufferGeometry();
  const facePos = new THREE.BufferAttribute(new Float32Array(N * 3), 3);
  faceGeo.setAttribute('position', facePos);
  faceGeo.setAttribute('uv', new THREE.BufferAttribute(FACE_UVS, 2));
  faceGeo.setAttribute('aEdge', new THREE.BufferAttribute(FACE_EDGE, 1));
  faceGeo.setIndex(new THREE.BufferAttribute(FACE_INDICES, 1));
  const faceMesh = new THREE.Mesh(faceGeo, new THREE.MeshBasicMaterial({ ...common, color: 0xff00ff, wireframe: true }));
  faceMesh.frustumCulled = false;
  faceMesh.visible = false;
  scene.add(faceMesh);

  const handMesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ ...common, color: 0x00ffff, wireframe: true }));
  handMesh.frustumCulled = false;
  handMesh.visible = false;
  scene.add(handMesh);

  let element: ElementId | null = null; // Task 5 turns this into materials
  let pixelRatio = 1;
  let size = '';

  function fit() {
    const w = video.videoWidth, h = video.videoHeight;
    if (!w || !h) return;
    const key = `${w}x${h}@${pixelRatio}`;
    if (key === size) return;
    size = key;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(w, h, false);
  }

  return {
    update(face: P3[] | null, hands: P3[][], _tSec: number) {
      fit();
      faceMesh.visible = !!face;
      if (face) {
        for (let i = 0; i < N; i++) facePos.setXYZ(i, face[i].x, face[i].y, face[i].z);
        facePos.needsUpdate = true;
      }
      handMesh.visible = hands.length > 0;
      if (hands.length) {
        const g = buildHandGeometry(hands);
        handMesh.geometry.dispose();
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(g.positions, 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(g.uvs, 2));
        geo.setIndex(new THREE.BufferAttribute(g.indices, 1));
        handMesh.geometry = geo;
      }
    },
    setElement(id: ElementId | null) { element = id; void element; },
    setPixelRatio(r: number) { pixelRatio = r; },
    setDetail(_d: 0 | 1 | 2) {},
    render() { renderer.render(scene, camera); },
    dispose() {
      faceGeo.dispose();
      handMesh.geometry.dispose();
      videoTex.dispose();
      renderer.dispose();
    },
  };
}
