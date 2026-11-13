// Haladás és beállítások helyben (localStorage), GYEREKENKÉNT külön profilban. Minden adat az eszközön marad.
//   csillagkert:profiles      – a profilok listája { v, ids, active }
//   csillagkert:p:<azonosító> – egy gyerek teljes állása (csillagok, kert, látott feladatok, ruhatár, beállítások)
//   csillagkert:device        – az eszköz beállításai (felolvasó hang, beszéd hangereje): minden gyereknél ugyanaz
// A régi, egyetlen mentés (csillagkert_v1) az első profil lesz; a régi kulcs érintetlenül megmarad biztonsági másolatnak.
// Minden tároló-hívás védett: privát módban is működik, csak nem ment.
import { migrateEconomy, payStarGift, sessionGift, sessionHeart } from './economy.js';
import { normalizeDress } from './avatar.js';

const INDEX = 'csillagkert:profiles', DEVICE = 'csillagkert:device', PREFIX = 'csillagkert:p:';
const OLD = 'csillagkert_v1', OLD_DRESS = 'csillagkert_dress_v1';
const SCHEMA = 4;                                       // 4: ajándékok név szerint (owned), szívek, csillag-ajándékok
export const MARKS = ['⭐', '💖', '🌸', '🦋', '🌈', '🍓', '🐞', '🚀'];     // a gyerek jele a „Ki játszik?" kártyán
export const AGES = [4, 5, 6, 7];

const fresh = () => ({
  schema: SCHEMA,
  total: 0,          // az összes valaha gyűjtött csillag (a kertben virágként nőnek)
  meter: 0,          // csillagok a legutóbbi jutalom óta
  done: {},          // kész feladatok állomásonként (szülői áttekintéshez)
  seen: {},          // megoldott feladatok {azonosító: időbélyeg} – ebből kerüljük az ismétlést
  sk: {}, rv: {}, hist: [], lastSt: [], stAt: {},   // az ütemező állása (js/scheduler-core.js): készségszintek, ismétlési napló, állomás-váltás
  owned: [],         // megszerzett ajándékok azonosítói (js/gifts.js): öltöztető elemei és kerti díszek
  starGifts: 0,      // hány 20-csillagos ajándék jár már kifizetve
  hearts: 0,         // szívek a jó tettekért (a Barátság fája ebből nő)
  gold: 0,           // aranyvirágok (amikor a létra minden foka megvan)
  newDress: [], newDecor: [],   // még meg nem nézett új ruhák (az öltöztetőnél jelzés) és még meg nem mutatott kerti díszek
  friends: [],       // akit már megetettek: a csillagoktól függetlenül is a kertben lakik
  rewardsDone: 0,    // hány jutalomjátékot játszott már: minden kör után több csillag kell
  dress: null,       // az öltöztető állása
  name: '', nameAsked: false, mark: MARKS[0], age: 5,
  rewardMinutes: 4, perReward: 10, feedGap: 2, sinceFeed: 0, v2: true,
});
const cleanName = v => String(v ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 30);

// Saját (megbízható) mentés rendbetétele: hiányzó mezők pótlása, régi mezők elhagyása
function normalize(raw) {
  const had = !!raw && typeof raw === 'object';
  const s = { ...fresh(), ...(had ? raw : {}) };
  if (!s.done || typeof s.done !== 'object') s.done = {};
  if (!s.seen || typeof s.seen !== 'object') s.seen = {};      // nagyon régi mentésben nem volt: üresről indul
  if (!Array.isArray(s.friends)) s.friends = [];
  for (const k of ['sk', 'rv', 'stAt']) if (!s[k] || typeof s[k] !== 'object' || Array.isArray(s[k])) s[k] = {};
  for (const k of ['hist', 'lastSt']) if (!Array.isArray(s[k])) s[k] = [];
  for (const k of ['total', 'meter', 'rewardsDone']) s[k] = Math.max(0, Math.floor(+s[k] || 0));
  if (!MARKS.includes(s.mark)) s.mark = MARKS[0];
  if (had && !raw.v2) s.perReward = 10;                         // korábbi mentés: 3 helyett 10 csillag
  delete s.index; delete s.sp; delete s.voiceURI; delete s.speechVol;   // az utóbbi kettő az eszköz beállítása lett
  migrateEconomy(s, had ? raw : undefined);
  s.v2 = true; s.schema = SCHEMA;
  return s;
}

// Fájlból visszatöltött (NEM megbízható) mentés: csak ismert mezők, típus és méret szerint ellenőrizve
const DRESS_KEYS = ['body', 'pattern', 'mane', 'manestyle', 'horn', 'hornstyle', 'wing', 'head', 'eyes', 'neck', 'bg'];
function sanitize(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Ez a fájl nem Csillagkert-mentés.');
  const s = fresh(), int = (v, lo, hi, d) => (Number.isFinite(+v) ? Math.max(lo, Math.min(hi, Math.floor(+v))) : d);
  const word = v => typeof v === 'string' && /^[\p{L}0-9:_-]{1,24}$/u.test(v);
  s.total = int(raw.total, 0, 100000, 0); s.meter = int(raw.meter, 0, 1000, 0); s.rewardsDone = int(raw.rewardsDone, 0, 100000, 0);
  s.rewardMinutes = [2, 4, 6, 10].includes(+raw.rewardMinutes) ? +raw.rewardMinutes : 4;
  s.perReward = [5, 7, 10, 15].includes(+raw.perReward) ? +raw.perReward : 10;
  s.feedGap = int(raw.feedGap, 2, 3, 2); s.sinceFeed = int(raw.sinceFeed, 0, 10, 0);
  s.age = AGES.includes(+raw.age) ? +raw.age : 5;
  s.name = typeof raw.name === 'string' ? cleanName(raw.name) : '';
  s.mark = MARKS.includes(raw.mark) ? raw.mark : MARKS[0];
  for (const k of ['nameAsked', 'introDone', 'clapShown']) if (raw[k] === true) s[k] = true;
  if (raw.heardBell === true || raw.heardBell === false) s.heardBell = raw.heardBell;
  if (raw.done && typeof raw.done === 'object') for (const [k, v] of Object.entries(raw.done).slice(0, 60)) if (word(k)) s.done[k] = int(v, 0, 100000, 0);
  if (raw.seen && typeof raw.seen === 'object') for (const [k, v] of Object.entries(raw.seen).slice(0, 20000)) if (k.length <= 300 && Number.isFinite(+v)) s.seen[k] = +v;
  // az ütemező állása: csak ismert mezők, korlátos méretben
  const obj = v => v && typeof v === 'object' && !Array.isArray(v);
  if (obj(raw.sk)) for (const [k, v] of Object.entries(raw.sk).slice(0, 300)) if (/^[a-z0-9._-]{1,60}$/.test(k) && obj(v)) s.sk[k] = { lv: int(v.lv, 1, 5, 1), ok: int(v.ok, 0, 10, 0), bad: int(v.bad, 0, 10, 0), n: int(v.n, 0, 1000000, 0), at: Number.isFinite(+v.at) ? +v.at : 0 };
  if (obj(raw.rv)) for (const [k, v] of Object.entries(raw.rv).slice(0, 20000)) if (k.length <= 300 && obj(v) && Number.isFinite(+v.due)) s.rv[k] = { b: int(v.b, 0, 4, 0), due: +v.due };
  if (Array.isArray(raw.hist)) s.hist = raw.hist.slice(-20).map(x => x === true);
  if (Array.isArray(raw.lastSt)) s.lastSt = raw.lastSt.filter(word).slice(-2);
  if (obj(raw.stAt)) for (const [k, v] of Object.entries(raw.stAt).slice(0, 60)) if (word(k) && Number.isFinite(+v)) s.stAt[k] = +v;
  if (Array.isArray(raw.friends)) s.friends = [...new Set(raw.friends.filter(word))].slice(0, 60);
  if (raw.dress && typeof raw.dress === 'object' && !Array.isArray(raw.dress)) {
    s.dress = {};
    for (const k of DRESS_KEYS) if (word(raw.dress[k])) s.dress[k] = raw.dress[k];
    if (Array.isArray(raw.dress.stickers)) s.dress.stickers = raw.dress.stickers.filter(word).slice(0, 20);
  }
  migrateEconomy(s, raw);                             // ajándékok és szívek: csak ismert azonosítók, korlátos számok (régi mentésfájlból is)
  return s;
}

// Tároló-burok: ha a böngésző tárolója nem érhető el (privát mód, Node-teszt), a memóriában él tovább
function wrap(storage) {
  const mem = new Map();                              // csak az kerül ide, amit a tárolóba nem sikerült beírni
  return {
    get(k) { if (mem.has(k)) return mem.get(k); try { const v = storage ? storage.getItem(k) : null; return v === undefined ? null : v; } catch (e) { return null; } },
    set(k, v) { try { if (storage) { storage.setItem(k, v); mem.delete(k); return; } } catch (e) {} mem.set(k, v); },
    del(k) { mem.delete(k); try { storage?.removeItem(k); } catch (e) {} },
    keys() { const out = new Set(mem.keys()); try { for (let i = 0; i < (storage?.length || 0); i++) out.add(storage.key(i)); } catch (e) {} return [...out]; },
  };
}

export function openProfiles(storage) {
  const st = wrap(storage);
  const read = k => { const raw = st.get(k); if (raw === null) return undefined; try { return JSON.parse(raw); } catch (e) { return null; } };   // undefined: nincs, null: sérült
  const isId = v => typeof v === 'string' && /^p[0-9]{1,6}$/.test(v);
  const stored = () => st.keys().filter(k => k.startsWith(PREFIX) && isId(k.slice(PREFIX.length))).map(k => k.slice(PREFIX.length)).sort((a, b) => +a.slice(1) - +b.slice(1));

  // A profil-lista mindig a ténylegesen tárolt profilokból áll össze: sérült vagy elavult lista sosem vezet üres induláshoz
  function loadIndex() {
    const idx = read(INDEX), have = stored();
    let ids = (idx && Array.isArray(idx.ids) ? idx.ids.filter(isId) : []).filter(i => have.includes(i));
    for (const i of have) if (!ids.includes(i)) ids.push(i);                       // a listából kimaradt, de létező profil
    if (!ids.length) {                                                             // első indulás: a régi mentésből lesz az 1. profil
      const old = read(OLD), s = normalize(old || undefined);
      const dress = read(OLD_DRESS); if (dress && typeof dress === 'object' && !s.dress) s.dress = dress;
      if (old && typeof old === 'object' && read(DEVICE) === undefined) {
        const d = {};
        if (typeof old.voiceURI === 'string' && old.voiceURI) d.voiceURI = old.voiceURI;
        if (typeof old.speechVol === 'number') d.speechVol = old.speechVol;
        if (Object.keys(d).length) st.set(DEVICE, JSON.stringify(d));
      }
      st.set(PREFIX + 'p1', JSON.stringify(s)); ids = ['p1'];                       // a régi kulcsokhoz NEM nyúlunk: biztonsági másolat
    }
    const active = idx && ids.includes(idx.active) ? idx.active : ids[0];
    const out = { v: 1, ids, active };
    if (JSON.stringify(idx) !== JSON.stringify(out)) st.set(INDEX, JSON.stringify(out));
    return out;
  }
  const first = loadIndex();
  let id = null, state = fresh();                     // a memóriában tartott profil: mindig IDE mentünk, nem a "listában aktívhoz"

  function load(pid) {
    const raw = read(PREFIX + pid);
    if (raw === null) st.set(PREFIX + pid + ':serult', st.get(PREFIX + pid));       // sérült adat: félretesszük, nem írjuk felül nyomtalanul
    return normalize(raw || undefined);
  }
  function save() { if (id) st.set(PREFIX + id, JSON.stringify(state)); }
  const setActive = pid => st.set(INDEX, JSON.stringify({ ...loadIndex(), active: pid }));
  const nextId = () => 'p' + (Math.max(0, ...stored().map(i => +i.slice(1))) + 1);
  const usedMarks = () => stored().map(i => (i === id ? state : load(i)).mark);
  const freeMark = () => { const used = usedMarks(); return MARKS.find(m => !used.includes(m)) || MARKS[used.length % MARKS.length]; };

  const api = {
    // --- profilok ---
    ready: () => id !== null,
    id: () => id,
    list: () => loadIndex().ids.map(pid => { const s = pid === id ? state : load(pid); return { id: pid, name: s.name, mark: s.mark, age: s.age, total: s.total, friends: s.friends.slice() }; }),
    use(pid) {
      if (!loadIndex().ids.includes(pid)) return false;
      id = pid; state = load(pid); setActive(pid);
      return true;
    },
    create({ name = '', age = 5, mark } = {}) {
      const pid = nextId(), s = fresh();
      s.name = cleanName(name); s.nameAsked = true;                                  // a nevet a szülő adta meg (lehet üres)
      s.age = AGES.includes(+age) ? +age : 5; s.mark = MARKS.includes(mark) ? mark : freeMark();
      st.set(PREFIX + pid, JSON.stringify(s)); loadIndex();
      return pid;
    },
    remove(pid) {
      const ids = loadIndex().ids;
      if (!ids.includes(pid) || ids.length < 2) return false;                        // az utolsó profil nem törölhető
      st.del(PREFIX + pid);
      if (pid === id) { id = null; state = fresh(); }
      loadIndex();
      return true;
    },
    exportData(pid = id) {
      if (!pid || !loadIndex().ids.includes(pid)) return null;
      return { app: 'csillagkert', kind: 'profil', v: 1, exported: new Date().toISOString(), profile: JSON.parse(JSON.stringify(pid === id ? state : load(pid))) };
    },
    // Fájlból: mindig ÚJ profilként kerül be, meglévőt soha nem ír felül. Hibás fájlra kivételt dob, és semmit nem változtat.
    importData(obj) {
      if (!obj || typeof obj !== 'object' || obj.app !== 'csillagkert' || obj.kind !== 'profil') throw new Error('Ez a fájl nem Csillagkert-mentés.');
      const s = sanitize(obj.profile);
      if (usedMarks().includes(s.mark)) s.mark = freeMark();
      s.nameAsked = true;
      const pid = nextId();
      st.set(PREFIX + pid, JSON.stringify(s)); loadIndex();
      return pid;
    },
    // --- az eszköz beállításai (minden gyereknél közös) ---
    device: {
      get: () => { const d = read(DEVICE); return d && typeof d === 'object' ? d : {}; },
      set(patch) { st.set(DEVICE, JSON.stringify({ ...api.device.get(), ...patch })); },
    },
    // --- a játszó gyerek állása ---
    get: () => state,
    // Egy kész feladat = 1 csillag. Visszaadja a mérő új állását.
    addStar(station, sid) {
      state.total++; state.meter++;
      state.done[station] = (state.done[station] || 0) + 1;
      if (sid) state.seen[sid] = Date.now();
      save(); return state.meter;
    },
    // Megszakított (X) feladat: csillag nem jár érte, de "látott"-nak számít, hogy a Tovább ne ugyanazt adja újra
    skip(sid) { if (sid) { state.seen[sid] = Date.now(); save(); } },
    completeReward() { state.rewardsDone = (state.rewardsDone || 0) + 1; save(); },
    // --- ajándékok és szívek (a szabályok: js/economy.js) ---
    starGift() { const g = payStarGift(state); if (g) save(); return g; },               // 20-as csillaghatárnál
    rewardGift(sess, source) { const g = sessionGift(state, sess, source); if (g) save(); return g; },
    rewardHeart(sess, source) { const ok = sessionHeart(state, sess, source); if (ok) save(); return ok; },
    taskHeart() { state.hearts++; save(); },                                             // etetés: gondoskodás
    seenDress() { if (state.newDress.length) { state.newDress = []; save(); } },
    // a saját unikornis mostani ruhája (js/avatar.js): ismeretlen vagy még meg nem nyert darab nem marad rajta
    avatar: () => normalizeDress(state.dress, id => state.owned.includes(id)),
    takeNewDecor() { const d = state.newDecor.slice(); if (d.length) { state.newDecor = []; save(); } return d; },
    addFriend(f) { if (f && !state.friends.includes(f)) { state.friends.push(f); save(); } },
    resetMeter() { state.meter = 0; save(); },
    set(patch) { Object.assign(state, patch); save(); },
    // Újrakezdés: a csillagok, a kert és a ruhatár törlődik; a gyerek neve, jele, életkora és a beállítások megmaradnak
    reset() {
      const keep = { name: state.name, nameAsked: state.nameAsked, introDone: state.introDone, mark: state.mark, age: state.age, rewardMinutes: state.rewardMinutes, perReward: state.perReward };
      state = { ...fresh(), ...keep }; save();
    },
  };
  if (first.ids.length === 1) api.use(first.ids[0]);      // egyetlen gyerek: nem kell választani
  return api;
}

let browserStorage = null;                              // egyes böngészők (tiltott sütik) már a localStorage elérésére is hibát dobnak
try { browserStorage = typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) {}
export const progress = openProfiles(browserStorage);
