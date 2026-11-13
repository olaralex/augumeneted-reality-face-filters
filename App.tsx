import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { TopBar } from './src/ui/TopBar';
import { Dock } from './src/ui/Dock';
import { StatusOverlay } from './src/ui/StatusOverlay';
import { CaptureButton } from './src/ui/CaptureButton';
import { PreviewSheet } from './src/ui/PreviewSheet';
import { INITIAL_ELEMENT, toggleElement } from './src/ui/useElementSelection';
import { ArStage, type ArStageHandle } from './src/ar/ArStage.web';
import type { ArStatus } from './src/ar/cameraError';
import { captureFileName } from './src/capture/save';
import { colors, isOutfit, type OptionId } from './src/theme';
import { hasMultipleCameras, type Facing } from './src/ar/cameras';

type Preview = { file: File; kind: 'photo' | 'video' };

export default function App() {
  const [loaded, fontErr] = useFonts({ Inter_400Regular, Inter_500Medium });
  const [status, setStatus] = useState<ArStatus>('loading');
  const [subjectVisible, setSubjectVisible] = useState(false);
  const [bodyLoading, setBodyLoading] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [option, setOption] = useState<OptionId | null>(INITIAL_ELEMENT);
  const [facing, setFacing] = useState<Facing>('user');
  const [canFlip, setCanFlip] = useState(false);
  const [recording, setRecording] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const stage = useRef<ArStageHandle>(null);
  // The camera count is only reliable after permission, i.e. once the stage is ready.
  useEffect(() => {
    if (status !== 'ready') return;
    navigator.mediaDevices.enumerateDevices().then((d) => setCanFlip(hasMultipleCameras(d)), () => setCanFlip(false));
  }, [status]);
  // Font failure falls back to the system font rather than a blank page.
  if (!loaded && !fontErr) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  // File is built before the sheet opens so "Salvează" can share with no await first.
  const open = (blob: Blob, kind: Preview['kind']) => {
    const ext = kind === 'photo' ? 'png' : blob.type.startsWith('video/mp4') ? 'mp4' : 'webm';
    setPreview({ kind, file: new File([blob], captureFileName(option, ext, new Date()), { type: blob.type.split(';')[0] }) });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ArStage
        ref={stage}
        option={option}
        facing={facing}
        onStatus={setStatus}
        onSubjectVisible={setSubjectVisible}
        onBodyLoading={setBodyLoading}
        retryKey={retryKey}
        onRecordingStopped={(blob) => {
          setRecording(false);
          if (blob) open(blob, 'video');
        }}
      />
      <TopBar
        recording={recording}
        canFlip={canFlip}
        onFlip={() => !recording && setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
      />
      <StatusOverlay
        status={status}
        subjectVisible={subjectVisible}
        subject={isOutfit(option) ? 'body' : 'face'}
        bodyLoading={bodyLoading}
        onRetry={() => {
          setFacing('user'); // a failed rear camera must not fail again on every retry
          setRetryKey((k) => k + 1);
        }}
      />
      <Dock active={option} onSelect={(id) => !recording && setOption((cur) => toggleElement(cur, id))}>
        {status === 'ready' && (
          <CaptureButton
            recording={recording}
            onPhoto={() => { stage.current?.takePhoto().then((b) => open(b, 'photo'), () => {}); }}
            onRecordStart={() => { try { stage.current?.startRecording(); setRecording(true); } catch { /* not ready or unsupported */ } }}
            onRecordStop={() => { void stage.current?.stopRecording(); }}
          />
        )}
      </Dock>
      {preview && <PreviewSheet {...preview} onSave={() => setPreview(null)} onDiscard={() => setPreview(null)} />}
    </View>
  );
}
