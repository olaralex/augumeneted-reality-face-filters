import { FaceLandmarker, HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { P3 } from './smoothing';

const url = (p: string) => new URL(p, document.baseURI).href;

async function create<T>(make: (delegate: 'GPU' | 'CPU') => Promise<T>): Promise<T> {
  try {
    return await make('GPU');
  } catch {
    return make('CPU');
  }
}

export async function createTracker() {
  const fileset = await FilesetResolver.forVisionTasks(url('wasm'));
  const face = await create((delegate) =>
    FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: url('models/face_landmarker.task'), delegate },
      runningMode: 'VIDEO',
      numFaces: 1,
    }),
  );
  let handLm: HandLandmarker;
  try {
    handLm = await create((delegate) =>
      HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: url('models/hand_landmarker.task'), delegate },
        runningMode: 'VIDEO',
        numHands: 2,
      }),
    );
  } catch (e) {
    face.close();
    throw e;
  }
  let lastT = 0;
  let lastHands: P3[][] = [];
  let lastHandedness: (string | undefined)[] = []; // 'Left' | 'Right' per hand, parallel to lastHands
  return {
    close() {
      face.close();
      handLm.close();
    },
    detect(video: HTMLVideoElement, tMs: number, hands: boolean): { face: P3[] | null; hands: P3[][]; handedness: (string | undefined)[] } {
      if (video.readyState < 2) return { face: null, hands: lastHands, handedness: lastHandedness };
      const t = Math.max(Math.floor(tMs), lastT + 1); // MediaPipe needs strictly increasing timestamps
      lastT = t;
      const f = face.detectForVideo(video, t).faceLandmarks[0];
      if (hands) {
        const r = handLm.detectForVideo(video, t);
        lastHands = r.landmarks;
        lastHandedness = r.landmarks.map((_, i) => r.handedness?.[i]?.[0]?.categoryName);
      }
      return { face: f ?? null, hands: lastHands, handedness: lastHandedness };
    },
  };
}
