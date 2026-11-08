import { ELEMENTS, colors } from '../theme';

test('elements are ordered with accents and labels', () => {
  expect(ELEMENTS.map(e => e.id)).toEqual(['fire', 'ice', 'earth', 'water']);
  expect(ELEMENTS.map(e => e.accent)).toEqual(['#ff6a2b', '#7dd3fc', '#a3794a', '#2563eb']);
  expect(ELEMENTS.map(e => e.label)).toEqual(['Foc', 'Gheață', 'Pământ', 'Apă']);
  expect(colors).toEqual({ bg: '#0a0a0b', line: '#232326', text: '#ededef', muted: '#8a8a93', panel: '#111113' });
});
