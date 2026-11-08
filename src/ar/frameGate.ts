// rAF can outpace the camera, so detect only when the video shows a new frame.
// Hands also run when the previous detect skipped them, so the governor's rAF-based
// alternation can't phase-lock with camera frames and starve hand detection.
export function createFrameGate() {
  let lastTime = NaN;
  let skippedHands = false;
  return {
    next(videoTime: number, wantHands: boolean): { detect: boolean; hands: boolean } {
      if (videoTime === lastTime) return { detect: false, hands: false };
      lastTime = videoTime;
      const hands = wantHands || skippedHands;
      skippedHands = !hands;
      return { detect: true, hands };
    },
  };
}
