export const HOLD_MS = 300;
export const MAX_RECORD_MS = 30_000;

export function createPressGesture(
  cb: { onTap(): void; onHoldStart(): void; onHoldEnd(): void },
  setTimer: typeof setTimeout = setTimeout,
  clearTimer: typeof clearTimeout = clearTimeout,
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let holding = false;
  let down = false;
  return {
    pressIn() {
      if (down) return;
      down = true;
      holding = false;
      timer = setTimer(() => {
        timer = null;
        holding = true;
        cb.onHoldStart();
      }, HOLD_MS);
    },
    pressOut() {
      if (!down) return;
      down = false;
      if (timer !== null) {
        clearTimer(timer);
        timer = null;
      }
      if (holding) cb.onHoldEnd();
      else cb.onTap();
      holding = false;
    },
  };
}
