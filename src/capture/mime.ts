const CANDIDATES = [
  { mimeType: 'video/mp4;codecs=avc1', ext: 'mp4' },
  { mimeType: 'video/mp4', ext: 'mp4' },
  { mimeType: 'video/webm;codecs=vp9', ext: 'webm' },
  { mimeType: 'video/webm', ext: 'webm' },
] as const;

export function pickMimeType(isSupported: (t: string) => boolean): { mimeType: string; ext: 'mp4' | 'webm' } | null {
  const hit = CANDIDATES.find((c) => isSupported(c.mimeType));
  return hit ? { mimeType: hit.mimeType, ext: hit.ext } : null;
}
