import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ArStatus } from '../ar/cameraError';
import { copy } from '../copy';
import { colors } from '../theme';

type Props = { status: ArStatus; faceVisible: boolean; onRetry: () => void };

export function StatusOverlay({ status, faceVisible, onRetry }: Props) {
  if (status === 'loading') {
    return (
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.muted}>{copy.loading}</Text>
      </View>
    );
  }
  if (status === 'ready') {
    return faceVisible ? null : (
      <View style={styles.hintWrap} pointerEvents="none">
        <Text style={[styles.muted, styles.hint]}>{copy.noFace}</Text>
      </View>
    );
  }
  const title = status === 'denied' ? copy.deniedTitle : status === 'no-camera' ? copy.noCamera : copy.error;
  return (
    <View style={styles.center}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        {status === 'denied' && <Text style={styles.muted}>{copy.deniedBody}</Text>}
        <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel={copy.retry} style={styles.btn}>
          <Text style={styles.btnText}>{copy.retry}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: {
    maxWidth: 360,
    padding: 20,
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
  },
  title: { color: colors.text, fontFamily: 'Inter_500Medium', fontSize: 15 },
  muted: { color: colors.muted, fontFamily: 'Inter_400Regular', fontSize: 13 },
  btn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  btnText: { color: colors.text, fontFamily: 'Inter_500Medium', fontSize: 13 },
  hintWrap: { position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center' },
  hint: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(15,15,18,0.8)',
    overflow: 'hidden',
  },
});
