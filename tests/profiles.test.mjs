// Profilok és mentés (Node): node --test tests/profiles.test.mjs
// A tároló itt egy memóriában élő ál-localStorage; a nevek kitalált tesztnevek.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openProfiles, MARKS } from '../js/progress.js';

class FakeStorage {
  constructor(init = {}) { this.m = new Map(Object.entries(init)); }
  get length() { return this.m.size; }
  key(i) { return [...this.m.keys()][i] ?? null; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
  dump() { return JSON.stringify([...this.m.entries()].sort()); }
}
const OLD = 'csillagkert_v1', DRESS = 'csillagkert_dress_v1';
const oldSave = JSON.stringify({ total: 37, meter: 4, done: { szamol: 12, allat: 5 }, seen: { 'count|7': 1700000000000, 'feed-bunny-répa': 1700000001000 }, gifts: ['head:crown'], friends: ['panda'], rewardsDone: 2, name: 'Teszt Elek', nameAsked: true, introDone: true, rewardMinutes: 6, perReward: 7, voiceURI: 'hang-1', speechVol: 2, feedGap: 3, sinceFeed: 1, v2: true });
const oldDress = JSON.stringify({ body: 'c3', mane: 'rainbow', stickers: ['star'] });

test('régi mentés: az 1. profil lesz belőle, semmi nem vész el, a régi kulcs érintetlen marad', () => {
  const st = new FakeStorage({ [OLD]: oldSave, [DRESS]: oldDress });
  const p = openProfiles(st);
  assert.equal(p.ready(), true); assert.equal(p.id(), 'p1'); assert.equal(p.list().length, 1);
  const s = p.get(), o = JSON.parse(oldSave);
  for (const k of ['total', 'meter', 'rewardsDone', 'name', 'nameAsked', 'introDone', 'rewardMinutes', 'perReward', 'feedGap', 'sinceFeed']) assert.deepEqual(s[k], o[k], k);
  assert.deepEqual(s.done, o.done); assert.deepEqual(s.seen, o.seen); assert.deepEqual(s.gifts, o.gifts); assert.deepEqual(s.friends, o.friends);
  assert.deepEqual(s.dress, JSON.parse(oldDress));                                  // a ruhatár a profilba költözött
  assert.deepEqual(p.device.get(), { voiceURI: 'hang-1', speechVol: 2 });           // a hang az eszköz beállítása lett
  assert.equal(s.voiceURI, undefined);
  assert.equal(st.getItem(OLD), oldSave); assert.equal(st.getItem(DRESS), oldDress);  // biztonsági másolat, bájtra azonos
  // másodszorra sem lesz belőle két profil, és az időközben szerzett csillag megmarad
  p.addStar('szamol', 'count|9');
  const again = openProfiles(st);
  assert.equal(again.list().length, 1); assert.equal(again.get().total, 38); assert.equal(st.getItem(OLD), oldSave);
});

test('nagyon régi mentés ("seen" és v2 nélkül): üres látott-lista, 10 csillagos jutalom, a csillagok megmaradnak', () => {
  const raw = JSON.stringify({ total: 5, meter: 2, index: 7, sp: { a: 1 }, perReward: 3, name: 'Minta' });
  const st = new FakeStorage({ [OLD]: raw }), s = openProfiles(st).get();
  assert.equal(s.total, 5); assert.equal(s.meter, 2); assert.deepEqual(s.seen, {}); assert.equal(s.perReward, 10);
  assert.equal(s.index, undefined); assert.equal(s.sp, undefined); assert.deepEqual(s.friends, []); assert.equal(s.name, 'Minta');
  assert.equal(st.getItem(OLD), raw);
});

test('sérült vagy hiányzó régi mentés: tiszta lappal indul, a sérült adatot nem írja felül', () => {
  const st = new FakeStorage({ [OLD]: '{"total": 12, "met' });
  const p = openProfiles(st);
  assert.equal(p.ready(), true); assert.equal(p.get().total, 0); assert.equal(st.getItem(OLD), '{"total": 12, "met');
  const empty = openProfiles(new FakeStorage());
  assert.equal(empty.ready(), true); assert.equal(empty.list().length, 1); assert.equal(empty.get().total, 0); assert.equal(empty.get().mark, MARKS[0]);
});

test('sérült profil-lista: a tárolt profilokból újraépül, soha nem indul üresen', () => {
  const st = new FakeStorage({ [OLD]: oldSave });
  const p = openProfiles(st), second = p.create({ name: 'Minta Kata', age: 6 });
  p.use(second); p.addStar('rajz', 'x'); p.addStar('rajz', 'y');
  for (const broken of ['nem json', JSON.stringify({ v: 1, ids: ['p9'], active: 'p9' }), JSON.stringify({ v: 1, ids: ['p1'], active: 'p1' }), '[]']) {
    st.setItem('csillagkert:profiles', broken);
    const q = openProfiles(st), list = q.list();
    assert.deepEqual(list.map(x => x.id), ['p1', 'p2'], broken);
    assert.deepEqual(list.map(x => x.total), [37, 2], broken);
  }
  st.setItem('csillagkert:p:p2', '{"total": 9, "fri');                               // egy profil adata sérült: a többi rendben marad
  const q = openProfiles(st);
  assert.equal(q.list().find(x => x.id === 'p1').total, 37);
  q.use('p2'); assert.equal(q.get().total, 0);
  assert.equal(st.getItem('csillagkert:p:p2:serult'), '{"total": 9, "fri');          // a sérült adat félretéve megmarad
});

test('két gyerek: külön csillagok, kert, látott feladatok és ruhatár; újratöltés után is', () => {
  const st = new FakeStorage({ [OLD]: oldSave, [DRESS]: oldDress });
  const a = openProfiles(st), id2 = a.create({ name: 'Minta Kata', age: 6 });
  const firstBefore = st.getItem('csillagkert:p:p1');
  assert.equal(a.list().find(x => x.id === id2).mark !== a.get().mark, true);         // más jelet kap
  const b = openProfiles(st);                                                        // újratöltés: két gyereknél választani kell
  assert.equal(b.ready(), false); assert.equal(b.get().total, 0);
  b.set({ total: 99 }); assert.equal(st.getItem('csillagkert:p:p1'), firstBefore);   // választás előtt semmi nem íródik
  assert.equal(b.use(id2), true);
  b.addStar('allat', 'feed-cat-hal'); b.addFriend('fox'); b.set({ dress: { body: 'c5' } }); b.addGift('wing:fairy');
  assert.equal(st.getItem('csillagkert:p:p1'), firstBefore);                         // az első gyerek adata bájtra változatlan
  const c = openProfiles(st);
  c.use('p1'); assert.equal(c.get().total, 37); assert.deepEqual(c.get().friends, ['panda']); assert.deepEqual(c.get().dress, JSON.parse(oldDress));
  c.use(id2); assert.equal(c.get().total, 1); assert.deepEqual(c.get().friends, ['fox']); assert.deepEqual(c.get().dress, { body: 'c5' });
  assert.deepEqual(Object.keys(c.get().seen), ['feed-cat-hal']); assert.equal(c.get().age, 6); assert.equal(c.get().name, 'Minta Kata');
  assert.equal(c.use('p77'), false);
});

test('két megnyitott lap: mindegyik a saját gyerekébe ment, akkor is, ha a másik lap közben váltott', () => {
  const st = new FakeStorage({ [OLD]: oldSave });
  const tabA = openProfiles(st), id2 = tabA.create({ name: 'Minta Kata' });
  const tabB = openProfiles(st); tabB.use(id2);                                     // a másik lap a második gyerekre vált
  tabA.addStar('szamol', 'a'); tabB.addStar('rajz', 'b'); tabA.addStar('szamol', 'c');
  const check = openProfiles(st);
  check.use('p1'); assert.equal(check.get().total, 39);
  check.use(id2); assert.equal(check.get().total, 1);
});

test('törlés: az utolsó gyerek nem törölhető; a törölt gyerek eltűnik, a másik megmarad', () => {
  const st = new FakeStorage({ [OLD]: oldSave });
  const p = openProfiles(st);
  assert.equal(p.remove('p1'), false);
  const id2 = p.create({ name: 'Minta Kata' });
  assert.equal(p.remove(id2), true); assert.equal(st.getItem('csillagkert:p:' + id2), null);
  assert.deepEqual(p.list().map(x => x.id), ['p1']); assert.equal(p.get().total, 37);
  assert.equal(openProfiles(st).ready(), true);
  assert.equal(p.remove('p5'), false);
});

test('újrakezdés: a csillagok és a kert törlődnek, a név, a jel és az életkor megmarad', () => {
  const p = openProfiles(new FakeStorage({ [OLD]: oldSave }));
  p.set({ age: 6, mark: MARKS[3] }); p.reset();
  const s = p.get();
  assert.equal(s.total, 0); assert.deepEqual(s.friends, []); assert.deepEqual(s.seen, {}); assert.equal(s.dress, null);
  assert.equal(s.name, 'Teszt Elek'); assert.equal(s.age, 6); assert.equal(s.mark, MARKS[3]); assert.equal(s.perReward, 7);
});

test('mentés fájlba és visszatöltés: másik eszközön ugyanaz az állás jön vissza, mindig új gyerekként', () => {
  const src = openProfiles(new FakeStorage({ [OLD]: oldSave, [DRESS]: oldDress }));
  const file = JSON.parse(JSON.stringify(src.exportData()));                         // ahogy a fájlból visszaolvasnánk
  assert.equal(file.app, 'csillagkert'); assert.equal(file.kind, 'profil');
  const st = new FakeStorage(), dst = openProfiles(st), before = st.getItem('csillagkert:p:p1');
  const id = dst.importData(file);
  assert.equal(id, 'p2'); assert.equal(st.getItem('csillagkert:p:p1'), before);      // a meglévő gyereket nem írja felül
  dst.use(id);
  const a = src.get(), b = dst.get();
  for (const k of ['total', 'meter', 'rewardsDone', 'name', 'rewardMinutes', 'perReward', 'age', 'introDone']) assert.deepEqual(b[k], a[k], k);
  assert.deepEqual(b.done, a.done); assert.deepEqual(b.seen, a.seen); assert.deepEqual(b.gifts, a.gifts); assert.deepEqual(b.friends, a.friends); assert.deepEqual(b.dress, a.dress);
  assert.notEqual(b.mark, openProfiles(st).list()[0].mark);                          // nem kap azonos jelet a meglévővel
  assert.equal(dst.importData(file), 'p3');                                          // kétszer betöltve két külön gyerek
});

test('visszatöltés: a hibás vagy idegen fájlt elutasítja, és közben semmihez nem nyúl', () => {
  const st = new FakeStorage({ [OLD]: oldSave }), p = openProfiles(st), snap = st.dump();
  for (const bad of [null, 42, 'szöveg', [], {}, { app: 'más', kind: 'profil', profile: {} }, { app: 'csillagkert', kind: 'profil' }, { app: 'csillagkert', kind: 'profil', profile: [] }, { app: 'csillagkert', kind: 'profil', profile: 'x' }]) {
    assert.throws(() => p.importData(bad), /nem Csillagkert-mentés/);
    assert.equal(st.dump(), snap);
  }
});

test('visszatöltés: csak ismert mezők kerülnek be, típus és méret szerint ellenőrizve', () => {
  const st = new FakeStorage(), p = openProfiles(st);
  const id = p.importData({ app: 'csillagkert', kind: 'profil', profile: {
    total: '12', meter: -5, rewardsDone: 1e99, perReward: 3, rewardMinutes: 999, age: 40, mark: '<b>', name: '  <img src=x onerror=alert(1)>Minta Kata\u0007  ' + 'x'.repeat(80),
    done: { szamol: 4, '<script>': 9, 'x y': 2 }, seen: { ok: 5, bad: 'nem szám' }, gifts: ['head:crown', '<svg>', 7, 'head:crown'], friends: ['fox', { a: 1 }, 'a b'],
    dress: { body: 'c2', evil: '<b>', mane: 5, stickers: ['star', '<x>'] }, __proto__: { hack: 1 }, extra: 'ismeretlen', introDone: 'igen', heardBell: 'talán' } });
  p.use(id);
  const s = p.get();
  assert.equal(s.total, 12); assert.equal(s.meter, 0); assert.equal(s.rewardsDone, 100000); assert.equal(s.perReward, 10); assert.equal(s.rewardMinutes, 4); assert.equal(s.age, 5);
  assert.ok(MARKS.includes(s.mark));
  assert.ok(!/[<>\u0000-\u001f]/.test(s.name) && s.name.length <= 30 && s.name.startsWith('img src=x'), s.name);
  assert.deepEqual(s.done, { szamol: 4 }); assert.deepEqual(s.seen, { ok: 5 }); assert.deepEqual(s.gifts, ['head:crown']); assert.deepEqual(s.friends, ['fox']);
  assert.deepEqual(s.dress, { body: 'c2', stickers: ['star'] });
  assert.equal(s.extra, undefined); assert.equal(s.hack, undefined); assert.equal(s.introDone, undefined); assert.equal(s.heardBell, undefined);
});

test('ha a tároló nem írható (privát mód): a játék megy, csak nem ment', () => {
  const st = new FakeStorage(); st.setItem = () => { throw new Error('QuotaExceeded'); };
  const p = openProfiles(st);
  assert.equal(p.ready(), true);
  p.addStar('szamol', 'a'); p.addFriend('bunny'); p.device.set({ speechVol: 0 });
  assert.equal(p.get().total, 1); assert.deepEqual(p.get().friends, ['bunny']); assert.equal(p.device.get().speechVol, 0);
  const none = openProfiles(null); none.addStar('szamol', 'a'); assert.equal(none.get().total, 1);
});

test('az eszköz beállításai (hang, beszéd hangereje) minden gyereknél közösek', () => {
  const st = new FakeStorage({ [OLD]: oldSave }), p = openProfiles(st), id2 = p.create({ name: 'Minta Kata' });
  p.device.set({ speechVol: 0 }); p.use(id2);
  assert.deepEqual(p.device.get(), { voiceURI: 'hang-1', speechVol: 0 });
  assert.equal(p.get().speechVol, undefined);
});
