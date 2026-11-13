// A Sparkhorn Sprint beágyazva (ugyanarról a github.io címről), betöltés- és hibajelzéssel:
// amíg tölt, egy kedves "Töltődik…" kártya látszik; ha nem jön be (nincs net), szól, és van "Újra" gomb.
// A régi és az új Sparkhorn-változattal is működik: a kártya a betöltéskor (vagy időtúllépéskor) tűnik el.
import { say } from '../voice.js';
export const SPARKHORN_URL = 'https://bladeszasza.github.io/sparkhorn-sprint/';
const WAIT_MS = 15000;

export function run(container, { src = SPARKHORN_URL, wait = WAIT_MS, gift } = {}) {
  let timer = 0, alive = true, watch = 0, wasBusy = false;
  function load() {
    clearTimeout(timer);
    container.innerHTML = `<div class="spark-wrap">
      <div class="spark-load"><div class="spark-icon">🦄</div><div class="spark-msg">Töltődik…</div><button class="giant spark-retry" hidden>🔄 Újra</button></div></div>`;
    const card = container.querySelector('.spark-load'), msg = container.querySelector('.spark-msg'), retry = container.querySelector('.spark-retry');
    const frame = document.createElement('iframe'); frame.allow = 'autoplay'; frame.title = 'Unikornis-futás';
    let done = false;
    const ok = () => { if (done || !alive) return; done = true; clearTimeout(timer); card.hidden = true; };
    const fail = () => {
      if (done || !alive) return; done = true;
      msg.textContent = 'Most nem jön be a játék. Van internet?'; retry.hidden = false; card.classList.add('bad');
      say('Most nem jön be a játék. Próbáljuk újra!', { remember: false });
    };
    frame.addEventListener('load', ok);
    frame.addEventListener('error', fail);
    retry.addEventListener('click', load);
    // offline állapotban a böngésző hibaoldalt tölthet be (az is "load"), ezért előbb azt nézzük, van-e hálózat
    if (navigator.onLine === false) { fail(); return; }
    frame.src = src; card.before(frame);              // a figyelők már élnek, mire a keret betölt (a gyors betöltést sem hagyjuk ki)
    timer = setTimeout(fail, wait);
  }
  load();
  // a jutalomidő vége kivárja a futó kört (a Sparkhorn ugyanarról a címről jön, ezért belelátunk)
  container.__busy = () => { try { return !!container.querySelector('iframe')?.contentWindow?.__sparkhorn?.busy?.(); } catch (e) { return false; } };
  // ajándék: az első befejezett kör után (a Sparkhorn jelzi, mikor fut egy kör: busy igazról hamisra vált)
  watch = setInterval(() => { const b = container.__busy(); if (wasBusy && !b) gift?.(); wasBusy = b; }, 400);
  container.__spark = { state: () => { const c = container.querySelector('.spark-load'); return !c ? 'none' : c.hidden ? 'loaded' : c.classList.contains('bad') ? 'error' : 'loading'; }, reload: load };
  return () => { alive = false; clearTimeout(timer); clearInterval(watch); container.innerHTML = ''; };
}
