// Feladatválasztás (a js/queue.js utódja): a "Tovább" gomb és az állomások ezt használják.
// A döntéseket a js/scheduler-core.js tiszta függvényei hozzák; itt csak a játszó gyerek mentéséhez kötjük őket.
// Minden 2., majd 3. (váltakozva) "Tovább" feladat állatetetés, mint eddig.
import { POOL, FEED_POOL, materialize, entryOf, legacySolvedIn } from './content/index.js';
import { progress } from './progress.js';
import * as core from './scheduler-core.js';

const solved = st => legacySolvedIn(progress.get().seen, st);

export function nextItem() {
  const e = core.chooseNext(progress.get(), POOL, FEED_POOL, Math.random, Date.now(), solved);
  return materialize(e);
}
export function stationItem(station) {
  const list = station === 'allat' ? FEED_POOL : POOL.filter(e => e.station === station);
  const e = station === 'allat' ? core.freshestInOrder(list, core.ensure(progress.get())) : core.chooseInStation(progress.get(), list, Math.random, Date.now(), solved);
  return materialize(e);
}
// A "Tovább"-gombos feladat után: számolja, mikor jön az etetés
export function noteRound(item) {
  const p = progress.get();
  if (item.type === 'feed') progress.set({ sinceFeed: 0, feedGap: (p.feedGap || 2) === 2 ? 3 : 2 });
  else progress.set({ sinceFeed: (p.sinceFeed || 0) + 1 });
}
// Egy feladat eredménye (kész vagy megszakítva): ismétlési napló, készségszint, állomás-váltás
export function record(item, outcome) {
  const e = entryOf(item);
  core.record(progress.get(), e, outcome, Date.now(), solved(e.station));
  progress.set({});
}
