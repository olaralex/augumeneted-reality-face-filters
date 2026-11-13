import type { ElementId, OptionId } from '../theme';

export const INITIAL_ELEMENT: ElementId = 'fire';

export const toggleElement = (current: OptionId | null, tapped: OptionId): OptionId | null =>
  current === tapped ? null : tapped;
