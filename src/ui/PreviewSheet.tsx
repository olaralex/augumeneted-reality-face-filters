import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { isIOS, saveCapture } from '../capture/save';
import { colors } from '../theme';
import { copy } from '../copy';

type Props = { file: File; kind: 'photo' | 'video'; onSave(): void; onDiscard(): void };

function download(f: File) {
  const url = URL.createObjectURL(f);
  const a = document.createElement('a');
  a.href = url;
  a.download = f.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function PreviewSheet({ file, kind, onSave, onDiscard }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  // Must call saveCapture synchronously: iOS share() needs the user gesture.
  const save = () => {
    saveCapture(file, {
      ios: isIOS(navigator),
      share: navigator.share?.bind(navigator),
      canShare: navigator.canShare?.bind(navigator),
      download,
    }).then((r) => {
      if (r === 'cancelled') return;
      setSaved(true);
      setTimeout(onSave, 1200);
    });
  };

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        {url && (kind === 'photo'
          ? <img src={url} style={media} />
          : <video src={url} style={media} controls playsInline autoPlay loop muted />)}
      </View>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" onPress={onDiscard} disabled={saved} style={[styles.btn, styles.ghost]}>
          <Text style={styles.ghostText}>{copy.discard}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={save} disabled={saved} style={[styles.btn, styles.filled]}>
          <Text style={styles.filledText}>{saved ? copy.saved : copy.save}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const media = { maxWidth: '100%', maxHeight: '100%', display: 'block', objectFit: 'contain' } as const;

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 100, backgroundColor: '#0a0a0bcc', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 16 },
  card: { flexShrink: 1, maxWidth: '100%', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel },
  row: { flexDirection: 'row', gap: 12 },
  btn: { height: 44, minWidth: 120, paddingHorizontal: 20, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  ghost: { borderWidth: 1, borderColor: colors.line },
  ghostText: { color: colors.text, fontFamily: 'Inter_500Medium', fontSize: 14 },
  filled: { backgroundColor: colors.text },
  filledText: { color: colors.bg, fontFamily: 'Inter_500Medium', fontSize: 14 },
});
