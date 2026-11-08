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
              style={[
                styles.item,
                wide ? styles.pill : [styles.circle, { backgroundColor: el.accent }],
                { borderColor: selected ? el.accent : 'transparent' },
              ]}
            >
              <Text style={styles.emoji}>{el.emoji}</Text>
              {wide && <Text style={[styles.label, selected && { color: el.accent }]}>{el.label}</Text>}
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
  circle: { width: 40, height: 40, borderRadius: 20 },
  emoji: { fontSize: 16 },
  label: { color: colors.text, fontFamily: 'Inter_500Medium', fontSize: 13 },
});
