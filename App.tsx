import { useRef, useState } from 'react';
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
import { colors, type ElementId } from './src/theme';

type Preview = { file: File; kind: 'photo' | 'video' };

export default function App() {
  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium });
  const [status, setStatus] = useState<ArStatus>('loading');
  const [faceVisible, setFaceVisible] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [element, setElement] = useState<ElementId | null>(INITIAL_ELEMENT);
  const [recording, setRecording] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const stage = useRef<ArStageHandle>(null);
  if (!loaded) return null;

  // File is built before the sheet opens so "Salvează" can share with no await first.
  const open = (blob: Blob, kind: Preview['kind']) => {
    const ext = kind === 'photo' ? 'png' : blob.type.startsWith('video/mp4') ? 'mp4' : 'webm';
    setPreview({ kind, file: new File([blob], captureFileName(element, ext, new Date()), { type: blob.type.split(';')[0] }) });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ArStage
        ref={stage}
        element={element}
        onStatus={setStatus}
        onFaceVisible={setFaceVisible}
        retryKey={retryKey}
        onRecordingStopped={(blob) => {
          setRecording(false);
          if (blob) open(blob, 'video');
        }}
      />
      <TopBar recording={recording} />
      <StatusOverlay status={status} faceVisible={faceVisible} onRetry={() => setRetryKey((k) => k + 1)} />
      <Dock active={element} onSelect={(id) => !recording && setElement((cur) => toggleElement(cur, id))}>
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
