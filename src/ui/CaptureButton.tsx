import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { createPressGesture, MAX_RECORD_MS } from '../capture/pressGesture';
import { canRecord } from '../ar/recorder';
import { colors } from '../theme';
import { copy } from '../copy';

type Props = { onPhoto(): void; onRecordStart(): void; onRecordStop(): void; recording: boolean };

export function CaptureButton(props: Props) {
  const latest = useRef(props);
  latest.current = props;
  const recordable = useMemo(canRecord, []);
  const gesture = useMemo(
    () => createPressGesture({
      onTap: () => latest.current.onPhoto(),
      onHoldStart: () => latest.current.onRecordStart(),
      onHoldEnd: () => latest.current.onRecordStop(),
    }),
    [],
  );
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    progress.setValue(0);
    if (!props.recording) return;
    const a = Animated.timing(progress, { toValue: 1, duration: MAX_RECORD_MS, easing: Easing.linear, useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [props.recording, progress]);

  return (
    <View style={styles.col}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.capture}
        // Unsupported recording: a press is always a photo, no hold timer.
        onPressIn={recordable ? gesture.pressIn : undefined}
        onPressOut={recordable ? gesture.pressOut : () => props.onPhoto()}
        style={styles.ring}
      >
        <View style={props.recording ? styles.stop : styles.dot} />
      </Pressable>
      {recordable && (
        <View style={[styles.track, !props.recording && { opacity: 0 }]}>
          <Animated.View style={[styles.fill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  col: { alignItems: 'center', gap: 8 },
  ring: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff' },
  stop: { width: 26, height: 26, borderRadius: 6, backgroundColor: '#ef4444' },
  track: { width: 64, height: 3, borderRadius: 2, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: 3, backgroundColor: '#ef4444' },
});
