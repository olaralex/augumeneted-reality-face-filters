import { pickMimeType } from '../capture/mime';
import { MAX_RECORD_MS } from '../capture/pressGesture';

const pick = () => (typeof MediaRecorder === 'undefined' ? null : pickMimeType((t) => MediaRecorder.isTypeSupported(t)));

export function canRecord(): boolean {
  return !!pick() && typeof HTMLCanvasElement !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype;
}

// onStop fires exactly once per recording, whatever the cause (stop(), 30 s limit).
export function createRecorder(canvas: HTMLCanvasElement, onStop?: (blob: Blob | null) => void) {
  const picked = pick();
  let rec: MediaRecorder | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let done: Promise<Blob | null> | null = null;

  const api = {
    get ext() { return picked?.ext ?? null; },
    start() {
      if (!picked) throw new Error('recording unsupported');
      if (rec) return;
      const chunks: Blob[] = [];
      const r = new MediaRecorder(canvas.captureStream(30), { mimeType: picked.mimeType });
      r.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      done = new Promise((resolve) => {
        r.onstop = () => {
          if (timer) clearTimeout(timer);
          const blob = chunks.length ? new Blob(chunks, { type: picked.mimeType }) : null;
          resolve(blob);
          onStop?.(blob);
        };
      });
      r.start();
      rec = r;
      timer = setTimeout(() => void api.stop(), MAX_RECORD_MS);
    },
    stop(): Promise<Blob | null> {
      if (!rec || !done) return Promise.resolve(null);
      if (rec.state !== 'inactive') rec.stop();
      return done;
    },
  };
  return api;
}
