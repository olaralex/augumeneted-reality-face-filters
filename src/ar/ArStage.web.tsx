import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { isOutfit, type OptionId } from '../theme';
import { cameraErrorToStatus, type ArStatus } from './cameraError';
import { createTracker } from './tracker';
import { createScene } from './scene';
import { createSmoother, type P3 } from './smoothing';
import { createHandSmoothers } from './handSmoothing';
import { createFrameGate } from './frameGate';
import { createGovernor } from './governor';
import { createRecorder } from './recorder';
import { createBustGate, type PoseFrame } from './pose';
import type { Facing } from './cameras';

type Props = {
  option: OptionId | null;
  facing: Facing;
  onStatus: (s: ArStatus) => void;
  // Face in element mode, body in outfit mode.
  onSubjectVisible: (v: boolean) => void;
  onBodyLoading: (loading: boolean) => void;
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
  { option, facing, onStatus, onSubjectVisible, onBodyLoading, retryKey, onRecordingStopped },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<ReturnType<typeof createScene> | null>(null);
  const recRef = useRef<ReturnType<typeof createRecorder> | null>(null);
  const cb = useRef({ onStatus, onSubjectVisible, onBodyLoading, option, facing, onRecordingStopped });
  cb.current = { onStatus, onSubjectVisible, onBodyLoading, option, facing, onRecordingStopped };
  // Set by the camera effect once the stage is ready; null while starting or torn down.
  const applyOptionRef = useRef<(() => void) | null>(null);
  const switchRef = useRef<((f: Facing) => Promise<void>) | null>(null);
  const firstFacing = useRef(true);

  useImperativeHandle(ref, () => ({
    takePhoto() {
      const scene = sceneRef.current, canvas = canvasRef.current;
      if (!scene || !canvas) return Promise.reject(new Error('stage not ready'));
      // No preserveDrawingBuffer: render and toBlob must stay in the same task (the executor runs synchronously).
      scene.render();
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

  useEffect(() => { applyOptionRef.current?.(); }, [option]);

  useEffect(() => {
    if (firstFacing.current) return void (firstFacing.current = false); // the camera effect opens the initial facing
    void switchRef.current?.(facing);
  }, [facing]);

  useEffect(() => {
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    let dead = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    let scene: ReturnType<typeof createScene> | null = null;
    let tracker: Awaited<ReturnType<typeof createTracker>> | null = null;
    const openStream = (f: Facing) => navigator.mediaDevices.getUserMedia({
      video: { facingMode: f, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });

    (async () => {
      cb.current.onStatus('loading');
      try {
        stream = await openStream(cb.current.facing);
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
      scene.setFacing(cb.current.facing);
      let faceSmooth = createSmoother();
      let handSmooth = createHandSmoothers();
      let bodySmooth = createSmoother();
      let bust = createBustGate();
      const governor = createGovernor();
      let visible = false;
      let last = performance.now();
      let poseReady = false;
      cb.current.onStatus('ready');

      const frames = createFrameGate();
      let face: P3[] | null = null;
      let hands: P3[][] = [];
      const fail = () => {
        cancelAnimationFrame(raf);
        void recRef.current?.stop();
        cb.current.onStatus('error');
      };

      // Runs on every option change and once here, so a retried stage reloads Pose if an outfit is active.
      applyOptionRef.current = () => {
        const opt = cb.current.option;
        scene!.setOption(opt);
        if (!isOutfit(opt) || poseReady) return cb.current.onBodyLoading(false);
        cb.current.onBodyLoading(true);
        tracker!.loadPose().then(
          () => { poseReady = true; if (!dead) cb.current.onBodyLoading(false); },
          () => { if (dead) return; cb.current.onBodyLoading(false); fail(); },
        );
      };
      applyOptionRef.current();

      // Swap only the video stream; the models stay loaded.
      switchRef.current = async (f: Facing) => {
        stream?.getTracks().forEach((t) => t.stop()); // iOS refuses a second camera while the first is open
        try {
          const next = await openStream(f);
          if (dead) return next.getTracks().forEach((t) => t.stop());
          stream = next;
          video.srcObject = next;
          await video.play();
        } catch (e) {
          if (dead) return;
          cancelAnimationFrame(raf);
          void recRef.current?.stop();
          cb.current.onStatus(cameraErrorToStatus(e));
          return;
        }
        scene!.setFacing(f);
        // Old-camera positions must not blend into the new view.
        faceSmooth = createSmoother();
        handSmooth = createHandSmoothers();
        bodySmooth = createSmoother();
        bust = createBustGate();
      };

      const loop = () => {
        raf = requestAnimationFrame(loop);
        try {
          step();
        } catch {
          fail();
        }
      };
      const step = () => {
        const now = performance.now();
        const g = governor.tick(now - last);
        last = now;
        const f = frames.next(video.currentTime, g.detectHandsThisFrame);
        if (f.detect) { // on a repeated camera frame keep the last result and only animate
          const outfitMode = isOutfit(cb.current.option);
          // One mode at a time: Pose for outfits, face + hands otherwise.
          const r = tracker!.detect(video, now, outfitMode
            ? { face: false, hands: false, pose: true }
            : { face: true, hands: f.hands, pose: false });
          face = faceSmooth.next(r.face);
          hands = outfitMode ? handSmooth.next([], []) : handSmooth.next(r.hands, r.handedness);
          const pts = bodySmooth.next(r.pose?.pts ?? null);
          const body: PoseFrame | null = r.pose && pts ? { pts, vis: r.pose.vis } : null; // smoothed positions, raw visibility
          scene!.updateOutfit(body, bust.next(r.pose?.vis ?? null));
          const seen = outfitMode ? !!body : !!face;
          if (seen !== visible) cb.current.onSubjectVisible((visible = seen));
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
      applyOptionRef.current = null;
      switchRef.current = null;
      void recRef.current?.stop();
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
      tracker?.close();
      scene?.dispose();
      sceneRef.current = null;
      cb.current.onSubjectVisible(false);
      cb.current.onBodyLoading(false);
    };
  }, [retryKey]);

  return (
    <>
      <video ref={videoRef} playsInline muted autoPlay style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
    </>
  );
});
