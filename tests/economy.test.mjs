// Ajándékok és szívek: a létra, a régi mentések átemelése, a jutalomkörönkénti szabályok (js/gifts.js, js/economy.js).

test('Rozi mondata az ajándékról: rövid, számjegy nélküli, és nem számolja a csillagokat', () => {
  for (const g of [...CATALOG, GOLD]) for (const [name, r] of [['', 0], ['Teszt Elek', 0], ['Minta Kata', 0.99]]) {
    const t = giftLine(g, name, () => r);
    assert.ok(t.includes(g.acc), `${g.id}: ${t}`);
    assert.ok(!/[0-9]/.test(t) && !/csillag/i.test(t), `${g.id}: ${t}`);
    for (const sent of t.split(/[.!?]/).map(x => x.trim()).filter(Boolean)) assert.ok(sent.split(/s+/).length <= 12, `túl hosszú mondat: ${sent}`);
    if (name && r === 0) assert.ok(t.includes(name), 'a név néha elhangzik');
    if (r > 0.5) assert.ok(!t.includes('Minta'), 'és néha nem');
  }
  assert.match(giftLine(giftById('neck:cape')), /öltöztető/);
  assert.match(giftLine(giftById('garden:kut')), /kertbe/);
});
import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG, LADDER, OLD_ORDER, GOLD, DECOR, giftById } from '../js/gifts.js';
import { giftLine, migrateEconomy, nextGift, grantGift, payStarGift, starGiftDue, newRewardSession, sessionGift, sessionHeart, GIFT_SOURCES, HEART_CAPS, STAR_STEP } from '../js/economy.js';
import { openProfiles } from '../js/progress.js';
import { FRIENDS, AREAS } from '../js/friends.js';

class FakeStorage {
  constructor(init = {}) { this.m = new Map(Object.entries(init)); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
  key(i) { return [...this.m.keys()][i] ?? null; }
  get length() { return this.m.size; }
}
const profile = (raw) => migrateEconomy({ total: raw.total || 0, friends: raw.friends || [] }, raw);

test('a létra: minden ajándék pontosan egyszer szerepel, ruhák és kerti díszek felváltva', () => {
  const ids = CATALOG.map(g => g.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual([...LADDER].sort(), [...ids].sort());
  assert.deepEqual(LADDER.filter(id => giftById(id).kind === 'dress'), OLD_ORDER);   // a régi sorrend a létrában is megmarad
  assert.ok(DECOR.length >= 10, `${DECOR.length} kerti dísz`);
  for (let i = 1; i < 20; i++) assert.ok(giftById(LADDER[i]).kind !== giftById(LADDER[i - 1]).kind || i >= 20, `váltakozás a ${i}. foknál`);
});

test('minden ajándéknak van neve, kézzel írt tárgyesete és saját rajza; a kimondott szöveg tiszta', () => {
  for (const g of [...CATALOG, GOLD]) {
    assert.ok(g.nom && g.acc && g.acc !== g.nom, g.id);
    assert.match(g.icon, /^<svg viewBox="0 0 64 64"[^>]*>[\s\S]+<\/svg>$/, g.id);
    assert.ok(!/<(script|foreignObject|image|use)\b|on\w+=|href/i.test(g.icon), `${g.id}: a rajzban csak alakzat van`);
    for (const t of [g.nom, g.acc]) assert.ok(/^[a-záéíóöőúüű -]+$/i.test(t), `${g.id}: „${t}" (nincs szám, jel vagy emoji)`);
  }
});

test('kerti díszek: a tópart és a tanya szabad zugaiban, barátoktól, egymástól és a tótól távol', () => {
  const homes = FRIENDS.filter(f => f.area).map(f => [f.id, f.home[0], f.home[1]]);
  for (const d of DECOR) {
    const [area, x, z] = d.spot, ax = AREAS.find(a => a.id === area)?.x;
    assert.ok(ax !== undefined, `${d.id}: ismert kertrész`);
    assert.ok(Math.abs(x - ax) <= 7 && z >= -7 && z <= 4.2, `${d.id}: a kertrészben látható helyen (${x}, ${z})`);
    for (const [id, hx, hz] of homes) assert.ok(Math.hypot(x - hx, z - hz) >= 1.4, `${d.id} túl közel: ${id}`);
    for (const o of DECOR) if (o !== d) assert.ok(Math.hypot(x - o.spot[1], z - o.spot[2]) >= 1.5, `${d.id} túl közel: ${o.id}`);
    assert.ok(Math.hypot((x + 17.6) / 1.75, (z + 1.8) / 1.3) > 1.6, `${d.id}: nem a tóban`);
  }
});

test('régi mentés átemelése: a régi szabály szerinti darabszám név szerint, semmi nem vész el és nem jön újra', () => {
  assert.deepEqual(profile({}).owned, []);
  const a = profile({ total: 45, gifts: ['race-1700000000000'] });                // 1 megnyert verseny + 45/20 = 3
  assert.deepEqual(a.owned, OLD_ORDER.slice(0, 3)); assert.equal(a.starGifts, 2);
  const b = profile({ total: 300, gifts: [] });                                     // 300 csillag: mind a 10 ruha megvan
  assert.deepEqual(b.owned, OLD_ORDER); assert.equal(b.starGifts, 15);
  assert.equal(starGiftDue(b), false);
  const again = migrateEconomy({ total: 300, friends: [] }, JSON.parse(JSON.stringify(b)));   // többször futtatva ugyanaz
  for (const k of ['owned', 'starGifts', 'hearts', 'gold', 'newDress', 'newDecor']) assert.deepEqual(again[k], b[k], k);
  assert.equal(profile({ total: 10, friends: ['bunny', 'fox'] }).hearts, 2);       // a szív a megetetett barátokkal indul
});

test('300 csillagos (minden ruhát birtokló) gyerek: minden játék valódi, új, látható ajándékot ad', () => {
  const s = profile({ total: 300 }), got = [];
  for (const src of GIFT_SOURCES) {
    const sess = newRewardSession(), g = sessionGift(s, sess, src);
    assert.ok(g && g.id !== GOLD.id && g.kind === 'garden', `${src}: ${g?.id}`);
    assert.ok(!got.includes(g.id)); got.push(g.id);
    assert.equal(sessionGift(s, sess, 'race'), null, 'egy jutalomkörben egy ajándék');
  }
  assert.deepEqual(s.newDecor, got);                                               // a kertben mind megjelenik
  assert.equal(sessionGift(s, newRewardSession(), 'dressup'), null);               // az öltöztető fogad, nem ad
});

test('elfogyott létra: aranyvirág (nincs üres ajándék); a csillag-ajándék 20 csillagonként egyszer jár', () => {
  const s = profile({ total: 0 });
  for (let i = 0; i < LADDER.length; i++) assert.equal(grantGift(s).id, LADDER[i]);
  assert.equal(nextGift(s).id, GOLD.id); assert.equal(grantGift(s).id, GOLD.id); assert.equal(s.gold, 1);
  assert.equal(s.owned.length, LADDER.length);
  const t = profile({ total: 319 }); assert.equal(payStarGift(t), null);
  t.total = 320; assert.ok(payStarGift(t)); assert.equal(payStarGift(t), null); assert.equal(t.starGifts, 320 / STAR_STEP);
});

test('szívek: csak jó tettért, játékonként korlátozva egy jutalomkörben', () => {
  const s = profile({}), sess = newRewardSession();
  for (const [src, cap] of Object.entries(HEART_CAPS)) {
    let n = 0; for (let i = 0; i < cap + 3; i++) if (sessionHeart(s, sess, src)) n++;
    assert.equal(n, cap, src);
  }
  for (const src of ['bubbles', 'sparkhorn', 'dressup', 'valami']) assert.equal(sessionHeart(s, sess, src), false, src);
  assert.equal(s.hearts, Object.values(HEART_CAPS).reduce((a, b) => a + b, 0));
});

test('a profilban: mentéskor megmarad, a csillag-ajándék a 20-as határnál jön; fájlból csak ismert ajándék kerül be', () => {
  const st = new FakeStorage({ csillagkert_v1: JSON.stringify({ total: 39, gifts: [], v2: true }) });
  const p = openProfiles(st);
  assert.equal(p.starGift(), null);
  p.addStar('szamol', 'x'); const g = p.starGift();
  assert.equal(g.id, LADDER[1]); assert.deepEqual(p.get().newDecor, [LADDER[1]]);   // a korona után a lámpás jön
  const q = openProfiles(st); assert.deepEqual(q.get().owned, LADDER.slice(0, 2)); assert.equal(q.get().starGifts, 2);
  assert.deepEqual(q.takeNewDecor(), [LADDER[1]]); assert.deepEqual(openProfiles(st).get().newDecor, []);
  // fájlból: ismeretlen ajándék kimarad, a kifizetett csillag-ajándék nem lehet több a jogosnál
  const id = q.importData({ app: 'csillagkert', kind: 'profil', profile: { total: 50, owned: ['garden:hinta', '<svg>', 'gold', 'head:crown', 'garden:hinta'], starGifts: 99, hearts: -4, gold: 'sok', newDecor: ['garden:hinta', 'garden:kut'] } });
  q.use(id); const s = q.get();
  assert.deepEqual(s.owned, ['garden:hinta', 'head:crown']); assert.equal(s.starGifts, 2); assert.equal(s.hearts, 0); assert.equal(s.gold, 0);
  assert.deepEqual(s.newDecor, ['garden:hinta']);
  // régi fájl (owned nélkül): ugyanaz, mint a régi mentés átemelése
  const id2 = q.importData({ app: 'csillagkert', kind: 'profil', profile: { total: 300, gifts: ['race-1', 'race-2'] } });
  q.use(id2); assert.deepEqual(q.get().owned, OLD_ORDER); assert.equal(q.get().starGifts, 15);
});
