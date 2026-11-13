import { hasMultipleCameras } from '../cameras';

test('hasMultipleCameras counts only video inputs', () => {
  expect(hasMultipleCameras([{ kind: 'videoinput' }, { kind: 'audioinput' }])).toBe(false);
  expect(hasMultipleCameras([{ kind: 'videoinput' }, { kind: 'videoinput' }])).toBe(true);
  expect(hasMultipleCameras([])).toBe(false);
});
