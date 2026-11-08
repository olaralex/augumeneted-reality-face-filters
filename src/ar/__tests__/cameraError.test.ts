import { cameraErrorToStatus } from '../cameraError';

describe('cameraErrorToStatus', () => {
  it.each([
    ['NotAllowedError', 'denied'],
    ['SecurityError', 'denied'],
    ['NotFoundError', 'no-camera'],
    ['OverconstrainedError', 'no-camera'],
  ])('%s -> %s', (name, status) => {
    expect(cameraErrorToStatus({ name })).toBe(status);
  });
  it('other -> error', () => {
    expect(cameraErrorToStatus(new Error('x'))).toBe('error');
  });
});
