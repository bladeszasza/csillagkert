// A jutalomidő szelíd vége: figyelmeztetés, a kör megvárása (felső korláttal), leállítás.
// Hamis órával fut, valódi várakozás nélkül.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRewardTimer } from '../js/reward-timer.js';

// hamis óra: a beütemezett hívásokat időrendben futtatja, amíg el nem érjük a kért időpontot
function fakeClock() {
  let t = 0, seq = 0; const q = new Map();
  return {
    now: () => t,
    schedule: (fn, ms) => { const id = ++seq; q.set(id, { at: t + Math.max(0, ms), fn }); return id; },
    cancel: id => q.delete(id),
    advance(ms) {
      const end = t + ms;
      for (;;) {
        let best = null; for (const [id, e] of q) if (e.at <= end && (!best || e.at < best[1].at)) best = [id, e];
        if (!best) break; q.delete(best[0]); t = best[1].at; best[1].fn();
      }
      t = end;
    },
    pending: () => q.size,
  };
}

test('egy perccel a vége előtt figyelmeztet, a végén búcsúzik', () => {
  const c = fakeClock(), log = [];
  createRewardTimer({ minutes: 4, now: c.now, schedule: c.schedule, cancel: c.cancel, onWarn: () => log.push(['warn', c.now()]), onEnd: why => log.push(['end', c.now(), why]) });
  c.advance(2 * 60000); assert.deepEqual(log, []);
  c.advance(60000); assert.deepEqual(log, [['warn', 180000]]);
  c.advance(60000); assert.deepEqual(log, [['warn', 180000], ['end', 240000, 'idle']]);
  assert.equal(c.pending(), 0, 'a vége után nem marad időzítő');
});

test('a kör közepén nem vág bele: megvárja, amíg a játék szabad', () => {
  const c = fakeClock(), log = []; let busy = true;
  createRewardTimer({ minutes: 2, now: c.now, schedule: c.schedule, cancel: c.cancel, isBusy: () => busy, onEnd: why => log.push([c.now(), why]) });
  c.advance(120000 + 10000); assert.deepEqual(log, [], 'futás közben még vár');
  busy = false; c.advance(1000);
  assert.equal(log.length, 1); assert.equal(log[0][1], 'idle'); assert.ok(log[0][0] <= 131000);
});

test('legfeljebb a türelmi ideig vár (a szülő beállítása számít)', () => {
  const c = fakeClock(), log = [];
  createRewardTimer({ minutes: 2, grace: 45000, now: c.now, schedule: c.schedule, cancel: c.cancel, isBusy: () => true, onEnd: why => log.push([c.now(), why]) });
  c.advance(120000 + 44000); assert.deepEqual(log, []);
  c.advance(2000); assert.equal(log.length, 1); assert.equal(log[0][1], 'grace'); assert.ok(log[0][0] <= 166000);
});

test('kilépéskor (vissza gomb) leáll: nincs figyelmeztetés, nincs búcsú', () => {
  const c = fakeClock(), log = [];
  const timer = createRewardTimer({ minutes: 4, now: c.now, schedule: c.schedule, cancel: c.cancel, onWarn: () => log.push('warn'), onEnd: () => log.push('end') });
  c.advance(30000); timer.stop(); c.advance(10 * 60000);
  assert.deepEqual(log, []); assert.equal(c.pending(), 0);
});

test('rövid időnél is van figyelmeztetés (az idő felénél), és pontosan egyszer', () => {
  const c = fakeClock(), log = [];
  createRewardTimer({ minutes: 1, now: c.now, schedule: c.schedule, cancel: c.cancel, onWarn: () => log.push(['warn', c.now()]), onEnd: () => log.push(['end', c.now()]) });
  c.advance(5 * 60000);
  assert.deepEqual(log, [['warn', 30000], ['end', 60000]]);
});

test('ha a játék "foglalt" jelzése hibát dob, a búcsú akkor is eljön', () => {
  const c = fakeClock(), log = [];
  createRewardTimer({ minutes: 2, now: c.now, schedule: c.schedule, cancel: c.cancel, isBusy: () => { throw new Error('x'); }, onEnd: why => log.push(why) });
  c.advance(121000); assert.deepEqual(log, ['idle']);
});
