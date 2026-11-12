// A jutalomjáték szelíd vége (a játékot nem vágja el a gyerek keze alól):
//  • a vége előtt (alapból egy perccel) egyszer jelez: "még egy kicsit, aztán hazamegyünk";
//  • ha az idő lejár, de a játék épp egy kör közepén tart (pl. verseny futás közben), megvárja a kör végét –
//    de legfeljebb `grace` ideig, mert az időt a szülő állította be;
//  • utána jön a búcsú (onEnd), amit a hívó egy kedves kártyával és a hazatéréssel old meg.
// Az óra és az időzítő beadható, így Node-ban, valódi várakozás nélkül tesztelhető.
export function createRewardTimer({
  minutes, isBusy = () => false, onWarn = () => {}, onEnd = () => {},
  warnBefore = 60000, grace = 45000, poll = 1000,
  now = () => Date.now(), schedule = (fn, ms) => setTimeout(fn, ms), cancel = id => clearTimeout(id),
}) {
  const total = Math.max(0, minutes) * 60000, start = now(), warnAt = Math.max(0, total - Math.min(warnBefore, total / 2));
  let timer = null, warned = false, ended = false, stopped = false;
  function next() {
    const t = now() - start;
    if (!warned) return Math.max(0, warnAt - t);
    if (t < total) return total - t;
    return poll;
  }
  function tick() {
    timer = null;
    if (stopped || ended) return;
    const t = now() - start;
    if (!warned && t >= warnAt) { warned = true; try { onWarn(); } catch (e) {} }
    if (t >= total) {
      let busy = false; try { busy = !!isBusy(); } catch (e) {}
      if (!busy || t >= total + grace) { ended = true; try { onEnd(busy ? 'grace' : 'idle'); } catch (e) {} return; }
    }
    timer = schedule(tick, next());
  }
  timer = schedule(tick, next());
  return {
    stop() { stopped = true; if (timer != null) cancel(timer); timer = null; },
    get warned() { return warned; },
    get ended() { return ended; },
  };
}
