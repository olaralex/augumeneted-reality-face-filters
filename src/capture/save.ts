import type { OptionId } from '../theme';

export function isIOS(nav: { userAgent: string; platform: string; maxTouchPoints: number }): boolean {
  return /iPhone|iPad|iPod/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
}

export function captureFileName(option: OptionId | null, ext: string, d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
  const time = `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  return `iara-${option ?? 'camera'}-${date}-${time}.${ext}`;
}

export type SaveEnv = {
  ios: boolean;
  share?: (d: { files: File[] }) => Promise<void>;
  canShare?: (d: { files: File[] }) => boolean;
  download: (f: File) => void;
};

// Not async-prefixed work before share: iOS needs share() inside the user gesture.
export async function saveCapture(file: File, env: SaveEnv): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const data = { files: [file] };
  if (env.ios && env.share && env.canShare?.(data)) {
    try {
      await env.share(data);
      return 'shared';
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return 'cancelled';
    }
  }
  env.download(file);
  return 'downloaded';
}
