export type ElementId = 'fire' | 'ice' | 'earth' | 'water';

export const ELEMENTS: readonly { id: ElementId; label: string; emoji: string; accent: string }[] = [
  { id: 'fire', label: 'Foc', emoji: '🔥', accent: '#ff6a2b' },
  { id: 'ice', label: 'Gheață', emoji: '❄️', accent: '#7dd3fc' },
  { id: 'earth', label: 'Pământ', emoji: '🌍', accent: '#a3794a' },
  { id: 'water', label: 'Apă', emoji: '💧', accent: '#2563eb' },
];

export const colors = {
  bg: '#0a0a0b',
  line: '#232326',
  text: '#ededef',
  muted: '#8a8a93',
  panel: '#111113',
};
