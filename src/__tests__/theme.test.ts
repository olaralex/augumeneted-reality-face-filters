import { ELEMENTS, OUTFITS, colors, isOutfit } from '../theme';

test('elements are ordered with accents and labels', () => {
  expect(ELEMENTS.map(e => e.id)).toEqual(['fire', 'ice', 'earth', 'water']);
  expect(ELEMENTS.map(e => e.accent)).toEqual(['#ff6a2b', '#7dd3fc', '#a3794a', '#2563eb']);
  expect(ELEMENTS.map(e => e.label)).toEqual(['Foc', 'Gheață', 'Pământ', 'Apă']);
  expect(colors).toEqual({ bg: '#0a0a0b', line: '#232326', text: '#ededef', muted: '#8a8a93', panel: '#111113' });
});

test('outfits: 5 women then 5 men, unique ids', () => {
  expect(OUTFITS.map(o => o.group)).toEqual([...Array(5).fill('women'), ...Array(5).fill('men')]);
  expect(new Set([...ELEMENTS, ...OUTFITS].map(o => o.id)).size).toBe(14);
  expect(isOutfit('velour')).toBe(true);
  expect(isOutfit('fire')).toBe(false);
  expect(isOutfit(null)).toBe(false);
});
