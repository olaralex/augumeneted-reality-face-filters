import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function TopBar({ recording }: { recording: boolean }) {
  return (
    <View style={styles.bar}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: '#5e6ad2' }]} />
        <Text style={styles.text}>IARA</Text>
      </View>
      {recording && (
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.text}>REC</Text>
        </View>
      )}
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
});
