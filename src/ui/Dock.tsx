import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ELEMENTS, colors, type ElementId } from '../theme';

type Props = { active: ElementId | null; onSelect: (id: ElementId) => void; children?: ReactNode };

export function Dock({ active, onSelect, children }: Props) {
  const wide = useWindowDimensions().width >= 640;
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {children}
      <View style={styles.dock}>
        {ELEMENTS.map((el) => {
          const selected = active === el.id;
          return (
            <Pressable
              key={el.id}
              onPress={() => onSelect(el.id)}
              accessibilityRole="button"
              accessibilityLabel={el.label}
              accessibilityState={{ selected }}
              style={
                wide
                  ? [styles.item, styles.pill, { borderColor: selected ? el.accent : 'transparent' }]
                  : [styles.ring, { borderColor: selected ? colors.text : 'transparent', opacity: selected ? 1 : 0.55 }]
              }
            >
              {wide ? (
                <>
                  <Text style={styles.emoji}>{el.emoji}</Text>
                  <Text style={[styles.label, selected && { color: el.accent }]}>{el.label}</Text>
                </>
              ) : (
                <View style={[styles.circle, { backgroundColor: el.accent }]}>
                  <Text style={styles.emoji}>{el.emoji}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 24 px fixed bottom offset: react-native-safe-area-context is not installed.
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center', gap: 16 },
  dock: {
    flexDirection: 'row',
    gap: 4,
    padding: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(15,15,18,0.8)',
  },
  item: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: 999 },
  ring: { padding: 2, borderWidth: 2, borderRadius: 999 },
  circle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 16 },
  label: { color: colors.text, fontFamily: 'Inter_500Medium', fontSize: 13 },
});
