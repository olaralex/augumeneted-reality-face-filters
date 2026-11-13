import { FaceLandmarker, HandLandmarker, PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { P3 } from './smoothing';
import { pickClosestPose, type PoseFrame } from './pose';

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
  let pose: PoseLandmarker | null = null;
  let posePromise: Promise<void> | null = null;
  let closed = false;
  let lastT = 0;
  let lastHands: P3[][] = [];
  let lastHandedness: (string | undefined)[] = []; // 'Left' | 'Right' per hand, parallel to lastHands
  return {
    close() {
      closed = true;
      face.close();
      handLm.close();
      pose?.close();
    },
    // Body model loads on the first outfit pick, so app start stays as fast as before.
    loadPose(): Promise<void> {
      posePromise ??= create((delegate) =>
        PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: url('models/pose_landmarker.task'), delegate },
          runningMode: 'VIDEO',
          numPoses: 2,
        }),
      ).then(
        (p) => { if (closed) p.close(); else pose = p; },
        (e) => { posePromise = null; throw e; }, // allow a later retry
      );
      return posePromise;
    },
    detect(
      video: HTMLVideoElement,
      tMs: number,
      want: { face: boolean; hands: boolean; pose: boolean },
    ): { face: P3[] | null; hands: P3[][]; handedness: (string | undefined)[]; pose: PoseFrame | null } {
      if (video.readyState < 2) return { face: null, hands: lastHands, handedness: lastHandedness, pose: null };
      const t = Math.max(Math.floor(tMs), lastT + 1); // MediaPipe needs strictly increasing timestamps
      lastT = t;
      const f = want.face ? face.detectForVideo(video, t).faceLandmarks[0] : undefined;
      let body: PoseFrame | null = null;
      if (want.pose && pose) {
        const r = pose.detectForVideo(video, t);
        body = pickClosestPose(
          r.landmarks.map((lm) => ({ pts: lm.map(({ x, y, z }) => ({ x, y, z })), vis: lm.map((p) => p.visibility ?? 0) })),
          video.videoHeight / video.videoWidth,
        );
      }
      if (want.hands) {
        const r = handLm.detectForVideo(video, t);
        lastHands = r.landmarks;
        lastHandedness = r.landmarks.map((_, i) => r.handedness?.[i]?.[0]?.categoryName);
      }
      return { face: f ?? null, hands: lastHands, handedness: lastHandedness, pose: body };
    },
  };
}
