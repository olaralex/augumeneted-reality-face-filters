import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { ElementId } from '../theme';
import { cameraErrorToStatus, type ArStatus } from './cameraError';
import { createTracker } from './tracker';
import { createScene } from './scene';
import { createSmoother, type P3 } from './smoothing';
import { createHandSmoothers } from './handSmoothing';
import { createFrameGate } from './frameGate';
import { createGovernor } from './governor';
import { createRecorder } from './recorder';

type Props = {
  element: ElementId | null;
  onStatus: (s: ArStatus) => void;
  onFaceVisible: (v: boolean) => void;
  retryKey: number;
  // Fires once per recording however it ended: stopRecording(), 30 s limit, or tab hidden.
  onRecordingStopped: (blob: Blob | null) => void;
};

export type ArStageHandle = {
  takePhoto(): Promise<Blob>;
  startRecording(): void;
  stopRecording(): Promise<Blob | null>;
};

export const ArStage = forwardRef<ArStageHandle, Props>(function ArStage(
  { element, onStatus, onFaceVisible, retryKey, onRecordingStopped },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<ReturnType<typeof createScene> | null>(null);
  const recRef = useRef<ReturnType<typeof createRecorder> | null>(null);
  const cb = useRef({ onStatus, onFaceVisible, element, onRecordingStopped });
  cb.current = { onStatus, onFaceVisible, element, onRecordingStopped };

  useImperativeHandle(ref, () => ({
    takePhoto() {
      const scene = sceneRef.current, canvas = canvasRef.current;
      if (!scene || !canvas) return Promise.reject(new Error('stage not ready'));
      scene.render(); // drawing buffer is preserved, so toBlob sees this frame
      return new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
    },
    startRecording() {
      if (!sceneRef.current) throw new Error('stage not ready');
      if (recRef.current) return;
      const rec = createRecorder(canvasRef.current!, (b) => {
        recRef.current = null;
        cb.current.onRecordingStopped(b);
      });
      rec.start(); // throws if unsupported; recRef stays unset
      recRef.current = rec;
    },
    stopRecording() {
      return recRef.current?.stop() ?? Promise.resolve(null);
    },
  }), []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) return void recRef.current?.stop();
      // Back from lock/background: resume the preview, or show Retry if the OS ended the camera.
      const video = videoRef.current, stream = video?.srcObject as MediaStream | null;
      if (!video || !stream) return;
      if (stream.getVideoTracks().some((t) => t.readyState === 'ended')) cb.current.onStatus('error');
      else video.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

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
        // Don't leave the camera light on behind the error card.
        stream.getTracks().forEach((t) => t.stop());
        video.srcObject = null;
        tracker?.close();
        tracker = null;
        if (!dead) cb.current.onStatus('error');
        return;
      }
      sceneRef.current = scene;
      scene.setElement(cb.current.element);
      const faceSmooth = createSmoother();
      const handSmooth = createHandSmoothers();
      const governor = createGovernor();
      let visible = false;
      let last = performance.now();
      cb.current.onStatus('ready');

      const frames = createFrameGate();
      let face: P3[] | null = null;
      let hands: P3[][] = [];
      const loop = () => {
        raf = requestAnimationFrame(loop);
        try {
          step();
        } catch {
          cancelAnimationFrame(raf);
          void recRef.current?.stop();
          cb.current.onStatus('error');
        }
      };
      const step = () => {
        const now = performance.now();
        const g = governor.tick(now - last);
        last = now;
        const f = frames.next(video.currentTime, g.detectHandsThisFrame);
        if (f.detect) { // on a repeated camera frame keep the last result and only animate
          const r = tracker!.detect(video, now, f.hands);
          face = faceSmooth.next(r.face);
          hands = handSmooth.next(r.hands, r.handedness);
          if (!!face !== visible) cb.current.onFaceVisible((visible = !!face));
        }
        // Resizing the captured canvas mid-recording can corrupt the video; applies once it stops.
        if (!recRef.current) scene!.setPixelRatio(g.pixelRatio);
        scene!.setDetail(g.detail);
        scene!.update(face, hands, now / 1000);
        scene!.render();
      };
      raf = requestAnimationFrame(loop);
    })();

    return () => {
      dead = true;
      void recRef.current?.stop();
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
      tracker?.close();
      scene?.dispose();
      sceneRef.current = null;
      cb.current.onFaceVisible(false);
    };
  }, [retryKey]);

  return (
    <>
      <video ref={videoRef} playsInline muted autoPlay style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
    </>
  );
});
