import type { OutfitId } from '../theme';

export type TopCut = 'crop' | 'tee' | 'oversize' | 'tank' | 'jacket' | 'hoodie' | 'shirt';
export type Sleeve = 'none' | 'short' | 'long';
export type BottomCut = 'flare' | 'lowrise' | 'baggy' | 'shorts' | 'miniskirt' | 'cargo' | 'track';
export type Pattern = 'none' | 'flames' | 'stripes' | 'butterfly' | 'number' | 'mesh' | 'zip';
export type Accessory =
  | 'tintedGlasses' | 'shieldGlasses' | 'bandana' | 'truckerCap' | 'headband'
  | 'butterflyClips' | 'choker' | 'hoops' | 'chain' | 'studBelt';

export type OutfitStyle = {
  top: { cut: TopCut; sleeve: Sleeve; color: string; pattern: Pattern; patternColor: string };
  bottom: { cut: BottomCut; color: string; pattern: Pattern; patternColor: string };
  accessories: { kind: Accessory; color: string }[];
};

const DENIM = '#3b6ea8';
const plain = (cut: BottomCut, color: string) => ({ cut, color, pattern: 'none' as const, patternColor: '#000' });

export const OUTFIT_STYLES: Record<OutfitId, OutfitStyle> = {
  velour: {
    top: { cut: 'hoodie', sleeve: 'long', color: '#f472b6', pattern: 'zip', patternColor: '#fce7f3' },
    bottom: plain('flare', '#f472b6'),
    accessories: [{ kind: 'tintedGlasses', color: '#f9a8d4' }],
  },
  butterfly: {
    top: { cut: 'crop', sleeve: 'short', color: '#ffffff', pattern: 'butterfly', patternColor: '#c084fc' },
    bottom: plain('lowrise', DENIM),
    accessories: [{ kind: 'butterflyClips', color: '#c084fc' }, { kind: 'studBelt', color: '#d4d4d8' }],
  },
  satin: {
    top: { cut: 'tank', sleeve: 'none', color: '#e9d5b7', pattern: 'none', patternColor: '#000' },
    bottom: plain('miniskirt', DENIM),
    accessories: [{ kind: 'choker', color: '#111111' }],
  },
  rock: {
    top: { cut: 'jacket', sleeve: 'long', color: '#1f1f24', pattern: 'zip', patternColor: '#d4d4d8' },
    bottom: plain('cargo', '#6b7d4a'),
    accessories: [{ kind: 'hoops', color: '#facc15' }],
  },
  mesh: {
    top: { cut: 'tank', sleeve: 'none', color: '#1f1f24', pattern: 'mesh', patternColor: '#a3a3a3' },
    bottom: plain('lowrise', DENIM),
    accessories: [{ kind: 'bandana', color: '#dc2626' }, { kind: 'shieldGlasses', color: '#c0c0c0' }],
  },
  flames: {
    top: { cut: 'oversize', sleeve: 'short', color: '#111111', pattern: 'flames', patternColor: '#f97316' },
    bottom: plain('baggy', DENIM),
    accessories: [{ kind: 'chain', color: '#d4d4d8' }],
  },
  tracksuit: {
    top: { cut: 'hoodie', sleeve: 'long', color: '#1e3a8a', pattern: 'stripes', patternColor: '#ffffff' },
    bottom: { cut: 'track', color: '#1e3a8a', pattern: 'stripes', patternColor: '#ffffff' },
    accessories: [{ kind: 'truckerCap', color: '#ef4444' }],
  },
  hoodie: {
    top: { cut: 'hoodie', sleeve: 'long', color: '#6b7280', pattern: 'zip', patternColor: '#111111' },
    bottom: plain('baggy', DENIM),
    accessories: [{ kind: 'bandana', color: '#111111' }, { kind: 'shieldGlasses', color: '#c0c0c0' }],
  },
  bball: {
    top: { cut: 'tank', sleeve: 'none', color: '#7c3aed', pattern: 'number', patternColor: '#facc15' },
    bottom: { cut: 'shorts', color: '#7c3aed', pattern: 'stripes', patternColor: '#facc15' },
    accessories: [{ kind: 'headband', color: '#ffffff' }],
  },
  bowling: {
    top: { cut: 'shirt', sleeve: 'short', color: '#0f766e', pattern: 'flames', patternColor: '#facc15' },
    bottom: plain('cargo', '#a8a29e'),
    accessories: [{ kind: 'tintedGlasses', color: '#fde047' }],
  },
};
