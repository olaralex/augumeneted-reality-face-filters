const BUDGET = 1000 / 24;
const DOWN_TICKS = 30;
const UP_TICKS = 120;
const MAX_LEVEL = 4;

// Level 0 full; 1 hands alternate; 2 +pixelRatio .75; 3 +detail 1; 4 +detail 0.
export function createGovernor() {
  let level = 0;
  let over = 0;
  let under = 0;
  let frame = 0;
  return {
    tick(frameMs: number): { detectHandsThisFrame: boolean; pixelRatio: number; detail: 0 | 1 | 2 } {
      over = frameMs > BUDGET ? over + 1 : 0;
      under = frameMs < 0.8 * BUDGET ? under + 1 : 0;
      if (over >= DOWN_TICKS && level < MAX_LEVEL) { level++; over = 0; }
      else if (under >= UP_TICKS && level > 0) { level--; under = 0; }
      frame++;
      return {
        detectHandsThisFrame: level < 1 || frame % 2 === 0,
        pixelRatio: level >= 2 ? 0.75 : 1,
        detail: level >= 4 ? 0 : level >= 3 ? 1 : 2,
      };
    },
  };
}
