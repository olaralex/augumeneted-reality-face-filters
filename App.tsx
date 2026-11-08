import { View } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { TopBar } from './src/ui/TopBar';
import { colors } from './src/theme';

export default function App() {
  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium });
  if (!loaded) return null;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar recording={false} />
    </View>
  );
}
