import { captureFileName, isIOS, saveCapture } from '../save';

const file = {} as File;

describe('saveCapture', () => {
  it('shares on iOS', async () => {
    const share = jest.fn().mockResolvedValue(undefined);
    const download = jest.fn();
    expect(await saveCapture(file, { ios: true, share, canShare: () => true, download })).toBe('shared');
    expect(download).not.toHaveBeenCalled();
  });
  it('downloads when not iOS', async () => {
    const share = jest.fn();
    const download = jest.fn();
    expect(await saveCapture(file, { ios: false, share, canShare: () => true, download })).toBe('downloaded');
    expect(share).not.toHaveBeenCalled();
    expect(download).toHaveBeenCalledWith(file);
  });
  it('downloads on iOS when canShare is missing or false', async () => {
    const d1 = jest.fn();
    const d2 = jest.fn();
    expect(await saveCapture(file, { ios: true, share: jest.fn(), download: d1 })).toBe('downloaded');
    expect(await saveCapture(file, { ios: true, share: jest.fn(), canShare: () => false, download: d2 })).toBe('downloaded');
    expect(d1).toHaveBeenCalled();
    expect(d2).toHaveBeenCalled();
  });
  it('cancelled on AbortError', async () => {
    const download = jest.fn();
    const share = jest.fn().mockRejectedValue({ name: 'AbortError' });
    expect(await saveCapture(file, { ios: true, share, canShare: () => true, download })).toBe('cancelled');
    expect(download).not.toHaveBeenCalled();
  });
  it('downloads on other share errors', async () => {
    const download = jest.fn();
    const share = jest.fn().mockRejectedValue(new Error('boom'));
    expect(await saveCapture(file, { ios: true, share, canShare: () => true, download })).toBe('downloaded');
    expect(download).toHaveBeenCalledWith(file);
  });
  it('calls share synchronously', () => {
    const share = jest.fn().mockResolvedValue(undefined);
    void saveCapture(file, { ios: true, share, canShare: () => true, download: jest.fn() });
    expect(share).toHaveBeenCalled();
  });
});

describe('captureFileName', () => {
  it('formats local time', () => {
    expect(captureFileName('fire', 'png', new Date(2026, 10, 8, 14, 30, 5))).toBe('iara-fire-20261108-143005.png');
    expect(captureFileName(null, 'mp4', new Date(2026, 10, 8, 14, 30, 5))).toBe('iara-camera-20261108-143005.mp4');
  });
});

describe('isIOS', () => {
  it('detects iPhone and iPadOS desktop UA', () => {
    expect(isIOS({ userAgent: 'iPhone', platform: 'iPhone', maxTouchPoints: 5 })).toBe(true);
    expect(isIOS({ userAgent: 'Mac', platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true);
    expect(isIOS({ userAgent: 'Mac', platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false);
    expect(isIOS({ userAgent: 'Win', platform: 'Win32', maxTouchPoints: 0 })).toBe(false);
  });
});
