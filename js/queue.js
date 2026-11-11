// Feladatválasztás minimális ismétléssel: előbb a még nem látott feladatok jönnek (a sorrendet követve),
// ha minden megvolt, a legrégebben látott. A "Tovább" és az állomások ugyanazt a memóriát használják.
// Minden 2., majd 3. (váltakozva) "Tovább" feladat állatetetés: "hami az állatoknak".
import { itemsOf, idOf, BASE_ITEMS, FEED_ITEMS } from './curriculum.js';
import { progress } from './progress.js';

function pickFrom(list) {
  const seen = progress.get().seen;
  let best = null, bestTime = Infinity;
  for (const it of list) {
    const t = seen[idOf(it)];
    if (t === undefined) return it;
    if (t < bestTime) { best = it; bestTime = t; }
  }
  return best;
}
export function nextItem() {
  const p = progress.get();
  if ((p.sinceFeed || 0) >= (p.feedGap || 2)) return pickFrom(FEED_ITEMS);
  return pickFrom(BASE_ITEMS);
}
// A "Tovább"-gombos feladat után hívjuk: számolja, mikor jön az etetés
export function noteRound(item) {
  const p = progress.get();
  if (item.type === 'feed') progress.set({ sinceFeed: 0, feedGap: (p.feedGap || 2) === 2 ? 3 : 2 });
  else progress.set({ sinceFeed: (p.sinceFeed || 0) + 1 });
}
export const stationItem = id => pickFrom(itemsOf(id));
