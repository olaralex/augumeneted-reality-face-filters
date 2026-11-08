export type ElementId = 'fire' | 'ice' | 'earth' | 'water';

export const ELEMENTS: readonly { id: ElementId; label: string; emoji: string; accent: string }[] = [
  { id: 'fire', label: 'Foc', emoji: '🔥', accent: '#ff6a2b' },
  { id: 'ice', label: 'Gheață', emoji: '❄️', accent: '#7dd3fc' },
  { id: 'earth', label: 'Pământ', emoji: '🌍', accent: '#a3794a' },
  { id: 'water', label: 'Apă', emoji: '💧', accent: '#2563eb' },
];

export const colors = {
  bg: '#08090a',
  line: '#23252a',
  text: '#f7f8f8',
  muted: '#8a8f98',
  panel: '#111113',
};
