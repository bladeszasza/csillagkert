// Ajándékok: az öltöztető zárolt elemei. A verseny megnyerése egy új elemet old fel;
// minden 20. csillag is hoz egyet. A sorrend rögzített, így mindig a következő "szép" elem jön.
import { progress } from './progress.js';

export const UNLOCK_ORDER = [
  { id: 'head:crown', name: 'ragyogó korona', icon: '👑' },
  { id: 'wing:rainbow', name: 'szivárványszárny', icon: '🌈' },
  { id: 'bg:castle', name: 'felhővár háttér', icon: '🏰' },
  { id: 'horn:rainbow', name: 'szivárványszarv', icon: '🌈' },
  { id: 'neck:cape', name: 'varázsköpeny', icon: '🧣' },
  { id: 'wing:fairy', name: 'tündérszárny', icon: '🧚' },
  { id: 'head:wizard', name: 'varázssüveg', icon: '🧙' },
  { id: 'mane:rainbow', name: 'szivárványsörény', icon: '🌈' },
  { id: 'bg:sea', name: 'tenger háttér', icon: '🌊' },
  { id: 'neck:pearls', name: 'gyöngysor', icon: '📿' },
];

export function unlockedCount() {
  const p = progress.get();
  return Math.min(UNLOCK_ORDER.length, (p.gifts?.length || 0) + Math.floor((p.total || 0) / 20));
}
export const isUnlocked = id => {
  const i = UNLOCK_ORDER.findIndex(x => x.id === id);
  return i < 0 || i < unlockedCount();            // nem zárolt elem mindig elérhető
};
// A következő még zárolt ajándék (null, ha már minden megvan)
export const nextGift = () => UNLOCK_ORDER[unlockedCount()] || null;
