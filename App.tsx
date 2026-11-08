import { useState } from 'react';
import { View } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { TopBar } from './src/ui/TopBar';
import { Dock } from './src/ui/Dock';
import { StatusOverlay } from './src/ui/StatusOverlay';
import { INITIAL_ELEMENT, toggleElement } from './src/ui/useElementSelection';
import { ArStage } from './src/ar/ArStage.web';
import type { ArStatus } from './src/ar/cameraError';
import { colors, type ElementId } from './src/theme';

export default function App() {
  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium });
  const [status, setStatus] = useState<ArStatus>('loading');
  const [faceVisible, setFaceVisible] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [element, setElement] = useState<ElementId | null>(INITIAL_ELEMENT);
  if (!loaded) return null;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ArStage element={element} onStatus={setStatus} onFaceVisible={setFaceVisible} retryKey={retryKey} />
      <TopBar recording={false} />
      <StatusOverlay status={status} faceVisible={faceVisible} onRetry={() => setRetryKey((k) => k + 1)} />
      <Dock active={element} onSelect={(id) => setElement((cur) => toggleElement(cur, id))} />
    </View>
  );
}
