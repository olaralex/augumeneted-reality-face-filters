export type ElementId = 'fire' | 'ice' | 'earth' | 'water';

export const ELEMENTS: readonly { id: ElementId; label: string; emoji: string; accent: string }[] = [
  { id: 'fire', label: 'Foc', emoji: '🔥', accent: '#ff6a2b' },
  { id: 'ice', label: 'Gheață', emoji: '❄️', accent: '#7dd3fc' },
  { id: 'earth', label: 'Pământ', emoji: '🌍', accent: '#a3794a' },
  { id: 'water', label: 'Apă', emoji: '💧', accent: '#2563eb' },
];

export type OutfitId = 'velour' | 'butterfly' | 'satin' | 'rock' | 'mesh' | 'flames' | 'tracksuit' | 'hoodie' | 'bball' | 'bowling';
export type OptionId = ElementId | OutfitId;
export type OutfitGroup = 'women' | 'men';

export const OUTFITS: readonly { id: OutfitId; label: string; emoji: string; accent: string; group: OutfitGroup }[] = [
  { id: 'velour', label: 'Trening de catifea', emoji: '👚', accent: '#f472b6', group: 'women' },
  { id: 'butterfly', label: 'Baby tee cu fluture', emoji: '🦋', accent: '#c084fc', group: 'women' },
  { id: 'satin', label: 'Satin și denim', emoji: '✨', accent: '#e9d5b7', group: 'women' },
  { id: 'rock', label: 'Rock', emoji: '🎸', accent: '#ef4444', group: 'women' },
  { id: 'mesh', label: 'Bandană și plasă', emoji: '🕸️', accent: '#a3a3a3', group: 'women' },
  { id: 'flames', label: 'Flăcări', emoji: '🔥', accent: '#f97316', group: 'men' },
  { id: 'tracksuit', label: 'Trening cu dungi', emoji: '🧢', accent: '#3b82f6', group: 'men' },
  { id: 'hoodie', label: 'Hanorac și bandană', emoji: '🧥', accent: '#9ca3af', group: 'men' },
  { id: 'bball', label: 'Baschet', emoji: '🏀', accent: '#8b5cf6', group: 'men' },
  { id: 'bowling', label: 'Bowling', emoji: '🎳', accent: '#14b8a6', group: 'men' },
];

export const isOutfit = (id: OptionId | null): id is OutfitId => OUTFITS.some((o) => o.id === id);

export const GROUP_LABELS: Record<'elements' | OutfitGroup, string> = { elements: 'Elemente', women: 'Femei', men: 'Bărbați' };

export const colors = {
  bg: '#0a0a0b',
  line: '#232326',
  text: '#ededef',
  muted: '#8a8a93',
  panel: '#111113',
};
