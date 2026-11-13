// Az adaptív ütemező (js/scheduler-core.js) szimulált játékokkal: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../js/scheduler-core.js';
import { POOL, FEED_POOL, legacySolvedIn } from '../js/content/index.js';
import { rng } from '../js/content/rng.js';

const MIN = 60000;
// Egy szimulált gyerek: a "képesség" alatti szintű feladatot elsőre megoldja, fölötte többször téved
function play(state, n, { ability = 3, seed = 7, step = 2 * MIN } = {}) {
  const r = rng(seed), log = [];
  let now = 1.7e12;
  for (let i = 0; i < n; i++) {
    const e = core.chooseNext(state, POOL, FEED_POOL, r, now, () => 0);
    assert.ok(e, `nincs feladat a(z) ${i}. körben`);
    const isFeed = e.item?.type === 'feed';
    const wrong = isFeed || e.graded === false ? 0 : (e.level || 0) <= ability ? (r() < 0.1 ? 1 : 0) : (r() < 0.7 ? 2 : 1);
    const help = e.graded === false && (e.level || 0) > ability ? 2 : 0;
    core.record(state, e, { wrong, help }, now);
    if (isFeed) { state.sinceFeed = 0; state.feedGap = state.feedGap === 2 ? 3 : 2; } else state.sinceFeed = (state.sinceFeed || 0) + 1;
    log.push({ ...e, wrong, isFeed });
    now += step;
  }
  return log;
}

test('300 feladat: a generált feladatok nem ismétlődnek, az állomások váltakoznak, az etetés 2–3 feladatonként jön', () => {
  const state = { age: 5, seen: {}, feedGap: 2, sinceFeed: 0 };
  const log = play(state, 300);
  const gen = log.filter(e => !e.item).map(e => e.id);
  assert.equal(new Set(gen).size, gen.length, 'ismétlődő generált feladat 300 körön belül');
  const tasks = log.filter(e => !e.isFeed);
  for (let i = 2; i < tasks.length; i++) {
    // két etetés közötti feladatok: ugyanaz az állomás nem jön az előző kettő után (az etetés nem számít)
    assert.ok(tasks[i].station !== tasks[i - 1].station, `ugyanaz az állomás kétszer egymás után: ${tasks[i].station} (${i})`);
  }
  let gap = 0;
  for (const e of log) { if (e.isFeed) { assert.ok(gap >= 2 && gap <= 3, `etetés ${gap} feladat után`); gap = 0; } else gap++; }
  const stations = new Set(tasks.map(e => e.station));
  assert.ok(stations.size >= 12, `csak ${stations.size} állomás került sorra`);
});

test('sok szimulált gyerek (5–7 év, gyenge–erős, 10 mag): 300 körön belül nincs ismétlés, egy állomás a bevezető készséggel kezd', () => {
  const low = {};
  for (const e of POOL) if (!e.item) low[e.station] = Math.min(low[e.station] ?? 9, e.level);
  const minOf = {}; for (const e of POOL) if (!e.item) minOf[e.skill] = Math.min(minOf[e.skill] ?? 9, e.level);
  for (const age of [5, 6, 7]) for (const ability of [0, 3, 9]) for (let seed = 1; seed <= 10; seed++) {
    const log = play({ age, seen: {}, feedGap: 2, sinceFeed: 0 }, 300, { ability, seed: seed * 101 + age * 7 + ability });
    const gen = log.filter(e => !e.item).map(e => e.id), where = `${age} év, képesség ${ability}, mag ${seed}`;
    assert.equal(new Set(gen).size, gen.length, `ismétlődő generált feladat (${where})`);
    const first = {};
    for (const e of log) if (!e.item) (first[e.station] ??= []).length < 2 && first[e.station].push(e);
    for (const [st, es] of Object.entries(first)) for (const e of es) assert.equal(minOf[e.skill], low[st], `${st}: nem bevezető készséggel kezd (${e.id}, ${where})`);
  }
});

test('szintlépés: aki elsőre megoldja, feljebb lép; aki sokat téved, visszalép', () => {
  const strong = { age: 5, seen: {} }; play(strong, 300, { ability: 9, seed: 3 });
  const weak = { age: 7, seen: {} }; play(weak, 300, { ability: 0, seed: 4 });
  const ladders = st => Object.entries(st.sk).filter(([k]) => k.startsWith('st.'));
  assert.ok(ladders(strong).length >= 1, 'nincs generált terület');
  assert.ok(ladders(strong).every(([, s]) => s.lv >= 4), `az erős játékos nem lépett feljebb: ${JSON.stringify(ladders(strong))}`);
  assert.ok(ladders(weak).every(([, s]) => s.lv === 1), `a sokat tévedő játékos nem lépett vissza: ${JSON.stringify(ladders(weak))}`);
  // a területen belül a készségek váltakoznak: a számolás minden készsége sorra került
  const skills = new Set(Object.keys(strong.sk).filter(k => k.startsWith('szamol.')));
  assert.ok(skills.size >= 8, `csak ${skills.size} számolós készség került sorra`);
});

test('kezdő gyerek: csak a szintjéhez illő készségek jönnek (bontás és sorszám még nem)', () => {
  const s = { age: 5, seen: {} }, list = POOL.filter(e => e.station === 'szamol'), r = rng(9);
  for (let i = 0; i < 60; i++) {
    const e = core.chooseInStation(s, list, r, i * MIN);
    assert.ok(e.level <= 2 && !['szamol.bontas', 'szamol.sorszam'].includes(e.skill), `túl nehéz feladat kezdőnek: ${e.id}`);
    core.record(s, e, { wrong: 1 }, i * MIN);
  }
});

test('a kezdőszint az életkorból jön, és aki a régi feladatokból sokat megoldott, egy szinttel feljebb indul', () => {
  assert.equal(core.levelOf({ age: 4 }, 'x').lv, 1);
  assert.equal(core.levelOf({ age: 5 }, 'x').lv, 1);
  assert.equal(core.levelOf({ age: 6 }, 'x').lv, 2);
  assert.equal(core.levelOf({ age: 7 }, 'x').lv, 3);
  assert.equal(core.levelOf({ age: 5 }, 'x', 8).lv, 2);
  const seen = {}; for (let n = 1; n <= 9; n++) seen[`count|${n}`] = 1; seen['math|3|2|+'] = 1; seen['feed-cat-hal'] = 1;
  assert.equal(legacySolvedIn(seen, 'szamol'), 10);
  assert.equal(legacySolvedIn(seen, 'forma'), 0);
});

test('ismétlés: az elsőre megoldott feladat 1, 3, 7, 14 nap múlva esedékes; tévedés után másnap', () => {
  const s = { age: 5, seen: {} }, e = { id: 'szamol.utana:n3', station: 'szamol', skill: 'szamol.szamsor', level: 2 };
  let now = 0;
  for (const days of core.INTERVALS) { core.record(s, e, { wrong: 0 }, now); assert.equal(s.rv[e.id].due - now, days * core.DAY); now += days * core.DAY; }
  core.record(s, e, { wrong: 0 }, now); assert.equal(s.rv[e.id].due - now, 14 * core.DAY);
  core.record(s, e, { wrong: 2 }, now); assert.equal(s.rv[e.id].b, 0); assert.equal(s.rv[e.id].due - now, core.DAY);
  core.record(s, e, { aborted: true }, now + 5); assert.equal(s.seen[e.id], now + 5); assert.equal(s.rv[e.id].b, 0);
});

test('kimerült szint: ha egy készség minden feladata megvolt, akkor is ad feladatot (a legrégebbit)', () => {
  const list = [1, 2, 3].map(i => ({ id: 'k.t:' + i, station: 'k', skill: 'k.s', level: 1 }));
  const s = { age: 5, seen: { 'k.t:1': 30, 'k.t:2': 10, 'k.t:3': 20 } };
  const e = core.chooseInStation(s, list, rng(1), 100);
  assert.equal(e.id, 'k.t:2');
  // a gyerek szintjén nincs feladat: a legközelebbi alacsonyabb szint jön
  s.sk = { 'st.k': { lv: 5, ok: 0, bad: 0, n: 0, at: 0 } };
  assert.equal(core.chooseInStation(s, list, rng(2), 100).level, 1);
});

test('gyakorló feladat (vonal, rajz): nincs hibaszám, három befejezés után feljebb lép; tévedéstől nem lép vissza, elakadástól igen', () => {
  const s = { age: 5, seen: {} }, e = { id: 'c.t:1', station: 'ceruza', skill: 'c.s', level: 1, graded: false };
  for (let i = 0; i < 3; i++) core.record(s, e, { wrong: 0 }, i);
  assert.equal(s.sk['st.ceruza'].lv, 2);
  for (let i = 0; i < 6; i++) core.record(s, e, { wrong: 5 }, 10 + i);
  assert.equal(s.sk['st.ceruza'].lv, 2);
  assert.deepEqual(s.hist, []);
  // elakadás: egy segítség semleges, két segítséggel befejezett feladat után egy szinttel könnyebb jön
  core.record(s, e, { help: 1 }, 20); assert.equal(s.sk['st.ceruza'].lv, 2);
  core.record(s, e, { help: 2 }, 21); core.record(s, e, { help: 3 }, 22); assert.equal(s.sk['st.ceruza'].lv, 1);
  assert.equal(s.rv[e.id].b, 0, 'elakadás után másnap visszajön');
});
