import { useEffect, useRef } from 'react';
import type { ElementId } from '../theme';
import { cameraErrorToStatus, type ArStatus } from './cameraError';
import { createTracker } from './tracker';
import { createScene } from './scene';
import { createSmoother } from './smoothing';
import { createGovernor } from './governor';

type Props = {
  element: ElementId | null;
  onStatus: (s: ArStatus) => void;
  onFaceVisible: (v: boolean) => void;
  retryKey: number;
};

export function ArStage({ element, onStatus, onFaceVisible, retryKey }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<ReturnType<typeof createScene> | null>(null);
  const cb = useRef({ onStatus, onFaceVisible, element });
  cb.current = { onStatus, onFaceVisible, element };

  useEffect(() => { sceneRef.current?.setElement(element); }, [element]);

  useEffect(() => {
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    let dead = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    let scene: ReturnType<typeof createScene> | null = null;
    let tracker: Awaited<ReturnType<typeof createTracker>> | null = null;

    (async () => {
      cb.current.onStatus('loading');
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (e) {
        if (!dead) cb.current.onStatus(cameraErrorToStatus(e));
        return;
      }
      if (dead) return stream.getTracks().forEach((t) => t.stop());
      video.srcObject = stream;
      try {
        await video.play();
        tracker = await createTracker();
        if (dead) return tracker.close();
        scene = createScene(canvas, video);
      } catch {
        if (!dead) cb.current.onStatus('error');
        return;
      }
      sceneRef.current = scene;
      scene.setElement(cb.current.element);
      const faceSmooth = createSmoother();
      const handSmooth = [createSmoother(), createSmoother()];
      const governor = createGovernor();
      let visible = false;
      let last = performance.now();
      cb.current.onStatus('ready');

      const loop = () => {
        raf = requestAnimationFrame(loop);
        const now = performance.now();
        const g = governor.tick(now - last);
        last = now;
        const r = tracker!.detect(video, now, g.detectHandsThisFrame);
        const face = faceSmooth.next(r.face);
        const hands = [0, 1].flatMap((i) => (r.hands[i] ? [handSmooth[i].next(r.hands[i])!] : (handSmooth[i].next(null), [])));
        if (!!face !== visible) cb.current.onFaceVisible((visible = !!face));
        scene!.setPixelRatio(g.pixelRatio);
        scene!.setDetail(g.detail);
        scene!.update(face, hands, now / 1000);
        scene!.render();
      };
      raf = requestAnimationFrame(loop);
    })();

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
      tracker?.close();
      scene?.dispose();
      sceneRef.current = null;
    };
  }, [retryKey]);

  return (
    <>
      <video ref={videoRef} playsInline muted autoPlay style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
    </>
  );
}
