// Szünet-javaslat (törődés): a beállított aktív játékidő után Rozi két feladat között szelíden pihenőt javasol.
// Csak a látható lapon töltött idő számít; ha a lap legalább öt percig a háttérben volt, az már pihenő, elölről indul.
// Nem zár le és nem fejez be semmit: egy mondat, egy nagy gomb, és megy tovább a játék. Tiszta modul (Node-teszt).
export const BREAK_CHOICES = [0, 15, 20, 30];        // perc; 0 = kikapcsolva
export const BREAK_DEFAULT = 20;
export const REST_MS = 5 * 60000;

export function createBreakTimer({ now = () => Date.now(), minutes = () => BREAK_DEFAULT } = {}) {
  let active = 0, since = null, hiddenAt = null, started = false;   // a kezdőképernyőn töltött idő nem számít
  const api = {
    start() { started = true; if (since == null && hiddenAt == null) since = now(); },
    visible(v) {
      if (!started) return;
      const t = now();
      if (!v) { if (since != null) active += t - since; since = null; if (hiddenAt == null) hiddenAt = t; return; }
      if (hiddenAt != null && t - hiddenAt >= REST_MS) active = 0;
      hiddenAt = null; if (since == null) since = t;
    },
    elapsed: () => active + (since != null ? now() - since : 0),
    due() { const m = +minutes() || 0; return m > 0 && api.elapsed() >= m * 60000; },
    rested() { active = 0; if (since != null) since = now(); },
  };
  return api;
}
