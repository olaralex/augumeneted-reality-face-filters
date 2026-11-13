import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { copy } from '../copy';

type Props = { recording: boolean; canFlip: boolean; onFlip: () => void };

export function TopBar({ recording, canFlip, onFlip }: Props) {
  return (
    <View style={styles.bar}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: '#5e6ad2' }]} />
        <Text style={styles.text}>IARA</Text>
      </View>
      <View style={styles.row}>
        {canFlip && (
          <Pressable
            onPress={onFlip}
            disabled={recording}
            accessibilityRole="button"
            accessibilityLabel={copy.flipCamera}
            accessibilityState={{ disabled: recording }}
            hitSlop={8}
            style={[styles.flip, recording && { opacity: 0.4 }]}
          >
            <Text style={styles.flipText}>↻</Text>
          </Pressable>
        )}
        {recording && (
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.text}>REC</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 44,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10,10,11,0.7)',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { color: colors.text, fontFamily: 'Inter_500Medium', fontSize: 13 },
  flip: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  flipText: { color: colors.text, fontSize: 20, lineHeight: 22 },
});
