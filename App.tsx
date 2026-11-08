import { useState } from 'react';
import { Text, View } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { TopBar } from './src/ui/TopBar';
import { ArStage } from './src/ar/ArStage.web';
import type { ArStatus } from './src/ar/cameraError';
import { colors } from './src/theme';

export default function App() {
  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium });
  const [status, setStatus] = useState<ArStatus>('loading');
  if (!loaded) return null;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ArStage element="fire" onStatus={setStatus} onFaceVisible={() => {}} retryKey={0} />
      <TopBar recording={false} />
      <Text style={{ position: 'absolute', bottom: 16, left: 16, color: colors.text }}>{status}</Text>
    </View>
  );
}
