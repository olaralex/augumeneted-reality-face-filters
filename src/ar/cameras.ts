export type Facing = 'user' | 'environment';

export const hasMultipleCameras = (devices: Pick<MediaDeviceInfo, 'kind'>[]): boolean =>
  devices.filter((d) => d.kind === 'videoinput').length >= 2;
