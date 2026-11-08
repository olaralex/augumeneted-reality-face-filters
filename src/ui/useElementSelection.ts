import type { ElementId } from '../theme';

export const INITIAL_ELEMENT: ElementId = 'fire';

export const toggleElement = (current: ElementId | null, tapped: ElementId): ElementId | null =>
  current === tapped ? null : tapped;
