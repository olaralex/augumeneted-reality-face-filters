import { toggleElement, INITIAL_ELEMENT } from '../useElementSelection';

test('toggleElement', () => {
  expect(toggleElement('fire', 'fire')).toBeNull();
  expect(toggleElement('fire', 'ice')).toBe('ice');
  expect(toggleElement(null, 'water')).toBe('water');
  expect(INITIAL_ELEMENT).toBe('fire');
});
