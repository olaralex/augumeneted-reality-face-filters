import { pickMimeType } from '../mime';

describe('pickMimeType', () => {
  it('falls back to webm', () => {
    expect(pickMimeType((t) => t === 'video/webm')).toEqual({ mimeType: 'video/webm', ext: 'webm' });
  });
  it('prefers mp4 avc1', () => {
    expect(pickMimeType(() => true)).toEqual({ mimeType: 'video/mp4;codecs=avc1', ext: 'mp4' });
  });
  it('returns null when unsupported', () => {
    expect(pickMimeType(() => false)).toBeNull();
  });
});
