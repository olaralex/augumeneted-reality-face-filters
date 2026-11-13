import * as THREE from 'three';
import { ELEMENTS, isOutfit, type ElementId, type OptionId } from '../theme';
import { FACE_UVS, FACE_INDICES, FACE_EDGE } from './faceMeshData';
import { buildHandGeometry } from './handMesh';
import { createElementMaterial } from './materials';
import { eyeOpenness, glowOpacity } from './eyeOpenness';
import type { P3 } from './smoothing';
import type { Facing } from './cameras';
import type { PoseFrame } from './pose';
import { OUTFIT_STYLES, type OutfitStyle } from './outfits';
import { buildOutfitShapes, outfitUnit } from './outfitShapes';
import { paintShapes } from './outfitPainter';

const N = 468;
const GLOW_SIZE = 0.06; // sprite diameter as a fraction of face width
const IRIS = [[468, 'left'], [473, 'right']] as const;

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function createScene(canvas: HTMLCanvasElement, video: HTMLVideoElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
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

  // Outfits are drawn in 2D at video resolution and shown as one textured plane over the video,
  // so mirroring, photos and recordings pick them up like everything else.
  const outCanvas = document.createElement('canvas');
  const outCtx = outCanvas.getContext('2d')!;
  const makeOutTex = () => {
    const t = new THREE.CanvasTexture(outCanvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.flipY = false;
    return t;
  };
  let outTex = makeOutTex();
  const outMat = new THREE.MeshBasicMaterial({ map: outTex, transparent: true, depthTest: false, side: THREE.DoubleSide });
  const outMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), outMat);
  outMesh.position.set(0.5, 0.5, -0.5);
  outMesh.frustumCulled = false;
  outMesh.visible = false;
  scene.add(outMesh);
  let outfit: OutfitStyle | null = null;

  const faceGeo = new THREE.BufferGeometry();
  const facePos = new THREE.BufferAttribute(new Float32Array(N * 3), 3);
  faceGeo.setAttribute('position', facePos);
  faceGeo.setAttribute('uv', new THREE.BufferAttribute(FACE_UVS, 2));
  faceGeo.setAttribute('aEdge', new THREE.BufferAttribute(FACE_EDGE, 1));
  faceGeo.setIndex(new THREE.BufferAttribute(FACE_INDICES, 1));
  const faceMesh = new THREE.Mesh(faceGeo); // material set by setElement
  const handMesh = new THREE.Mesh(new THREE.BufferGeometry());

  const glowTex = glowTexture();
  const eyes = IRIS.map(() => new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, blending: THREE.AdditiveBlending, depthTest: false, transparent: true, side: THREE.DoubleSide,
  })));

  // Explicit order: transparent z-sorting is unreliable with iris z vs mesh origin.
  [faceMesh, handMesh, ...eyes].forEach((o, i) => {
    o.frustumCulled = false;
    o.visible = false;
    o.renderOrder = i < 2 ? i + 1 : 3;
    scene.add(o);
  });

  const mats: Partial<Record<ElementId, [THREE.ShaderMaterial, THREE.ShaderMaterial]>> = {};
  let current: [THREE.ShaderMaterial, THREE.ShaderMaterial] | null = null;
  let detail = 2;
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
    if (outCanvas.width !== w || outCanvas.height !== h) {
      outCanvas.width = w;
      outCanvas.height = h;
      // GPU texture storage is fixed-size; a resized canvas needs a fresh texture.
      outTex.dispose();
      outMat.map = outTex = makeOutTex();
      outMat.needsUpdate = true;
    }
  }

  return {
    update(face: P3[] | null, hands: P3[][], tSec: number) {
      fit();
      for (const m of current ?? []) {
        m.uniforms.uTime.value = tSec;
        m.uniforms.uDetail.value = detail;
      }
      const on = !!current;
      faceMesh.visible = on && !!face;
      eyes.forEach((e) => (e.visible = faceMesh.visible));
      if (face && on) {
        for (let i = 0; i < N; i++) facePos.setXYZ(i, face[i].x, face[i].y, face[i].z);
        facePos.needsUpdate = true;
        const aspect = (video.videoHeight || 1) / (video.videoWidth || 1);
        const fw = Math.hypot(face[454].x - face[234].x, (face[454].y - face[234].y) * aspect);
        IRIS.forEach(([k, side], j) => {
          eyes[j].position.set(face[k].x, face[k].y, 0);
          eyes[j].scale.set(GLOW_SIZE * fw, (GLOW_SIZE * fw) / aspect, 1); // y in image-height units
          eyes[j].material.opacity = glowOpacity(eyeOpenness(face, side, aspect));
        });
      }
      handMesh.visible = on && hands.length > 0;
      if (handMesh.visible) {
        const g = buildHandGeometry(hands);
        handMesh.geometry.dispose();
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(g.positions, 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(g.uvs, 2));
        geo.setAttribute('aEdge', new THREE.BufferAttribute(new Float32Array(g.positions.length / 3).fill(1), 1));
        geo.setIndex(new THREE.BufferAttribute(g.indices, 1));
        handMesh.geometry = geo;
      }
    },
    updateOutfit(pose: PoseFrame | null, fullBody: boolean) {
      outMesh.visible = !!outfit && !!pose && outCanvas.width > 0;
      if (!outMesh.visible) return;
      const shapes = buildOutfitShapes(pose, outfit!, fullBody, outCanvas.width, outCanvas.height);
      paintShapes(outCtx, shapes, outfitUnit(pose!, outCanvas.width, outCanvas.height));
      outTex.needsUpdate = true;
    },
    setOption(opt: OptionId | null) {
      outfit = isOutfit(opt) ? OUTFIT_STYLES[opt] : null;
      const id: ElementId | null = opt && !isOutfit(opt) ? opt : null;
      if (!outfit) outMesh.visible = false;
      if (!id) {
        current = null; // update() hides every effect object while null
        return;
      }
      current = mats[id] ??= [createElementMaterial(id), createElementMaterial(id)];
      [faceMesh.material, handMesh.material] = current;
      const accent = ELEMENTS.find((e) => e.id === id)!.accent;
      eyes.forEach((e) => e.material.color.set(accent));
    },
    setFacing(f: Facing) {
      // Front camera is mirrored (left=1, right=0); the rear camera is shown as-is.
      [camera.left, camera.right] = f === 'user' ? [1, 0] : [0, 1];
      camera.updateProjectionMatrix();
    },
    setPixelRatio(r: number) { pixelRatio = r; },
    setDetail(d: 0 | 1 | 2) { detail = d; },
    render() { renderer.render(scene, camera); },
    dispose() {
      faceGeo.dispose();
      handMesh.geometry.dispose();
      Object.values(mats).forEach((pair) => pair.forEach((m) => m.dispose()));
      eyes.forEach((e) => e.material.dispose());
      glowTex.dispose();
      outTex.dispose();
      outMat.dispose();
      outMesh.geometry.dispose();
      videoTex.dispose();
      renderer.dispose();
    },
  };
}
