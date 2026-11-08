export type ArStatus = 'loading' | 'ready' | 'denied' | 'no-camera' | 'error';

export function cameraErrorToStatus(err: unknown): ArStatus {
  const name = (err as { name?: string } | null)?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'no-camera';
  return 'error';
}
