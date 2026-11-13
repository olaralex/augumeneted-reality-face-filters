import type { P3 } from './smoothing';

export const POSE = {
  nose: 0, lEye: 2, rEye: 5, lEar: 7, rEar: 8,
  lShoulder: 11, rShoulder: 12, lElbow: 13, rElbow: 14, lWrist: 15, rWrist: 16,
  lHip: 23, rHip: 24, lKnee: 25, rKnee: 26, lAnkle: 27, rAnkle: 28,
} as const;

// 33 MediaPipe pose landmarks plus each one's visibility score.
export type PoseFrame = { pts: P3[]; vis: number[] };

const span = (p: PoseFrame, aspect: number) => {
  const a = p.pts[POSE.lShoulder], b = p.pts[POSE.rShoulder];
  return Math.hypot(a.x - b.x, (a.y - b.y) * aspect);
};

// Closest person = widest shoulders on screen.
export function pickClosestPose(poses: PoseFrame[], aspect: number): PoseFrame | null {
  let best: PoseFrame | null = null;
  for (const p of poses) if (!best || span(p, aspect) > span(best, aspect)) best = p;
  return best;
}

const LOWER = [POSE.lHip, POSE.rHip, POSE.lKnee, POSE.rKnee];
const ENTER_FULL = 0.65;
const EXIT_FULL = 0.4;

// true = full body in frame, false = bust only. Pose still places off-frame points, so use visibility, not position.
export function createBustGate() {
  let full = false;
  return {
    next(vis: number[] | null): boolean {
      if (!vis) return (full = false);
      const m = LOWER.reduce((s, i) => s + vis[i], 0) / LOWER.length;
      if (m > ENTER_FULL) full = true;
      else if (m < EXIT_FULL) full = false;
      return full;
    },
  };
}
