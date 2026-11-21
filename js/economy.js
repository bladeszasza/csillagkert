// Közös jutalom-gazdaság (a kiáltvány szerint két külön érték):
//   ⭐ csillag a tudásért (kész feladat) – a kertet virágoztatja, a jutalomkaput nyitja, minden 20. ajándékot hoz;
//   ❤ szív a jó tettért (etetés, gondoskodás, ajándék másnak, barátság) – a Barátság fáját növeszti.
// Ajándékot minden játék ad (jutalomkörönként egyet, az első igazi játék-pillanatnál), és minden 20. csillag.
// Itt csak tiszta függvények vannak egy profil-állapoton (a mentést a js/progress.js végzi), hogy Node-ban is tesztelhetők legyenek.
// Minden szám saját beállítás (README: „Ajándékok és szívek").
import { LADDER, OLD_ORDER, giftById, flowerGiftAt, treatAt, ITEM_KEYS, ITEM_MAX } from './gifts.js';
import { named } from './lines.js';

export const STAR_STEP = 20;                              // ennyi csillagonként jár egy ajándék (a régi szabály)
// Egy jutalomkör ennyi csillag: a szülő által választott kezdőszám (5, 7, 10 vagy 15), körönként kettővel több, legfeljebb 30.
// A szülő kérésére (2026-11-16) minden nap a kezdőszámról indul: csak az aznap lejátszott körök számítanak (roundsToday).
export const ROUND_MAX = 30;
export const roundStars = (base = 10, done = 0) => Math.min(ROUND_MAX, (base || 10) + 2 * (done || 0));
// a nap kulcsa a készülék helyi ideje szerint (éjfélkor vált), pl. "2026-11-16"
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// hány jutalomkört játszott ma (másik napon rögzített szám már nem számít)
export const roundsToday = (s, day = dayKey()) => (s && s.roundsDay === day ? Math.max(0, Math.floor(+s.roundsToday || 0)) : 0);
// Egy jutalomkörön belül játékonként legfeljebb ennyi szív jár (a szívet nem lehet "gyűjtögetni", a jó tett számít)
export const HEART_CAPS = { healthy: 3, pet: 3, race: 3, foodcatch: 2, openworld: 4 };
// Ezek a játékok adnak ajándékot; az öltöztető fogadja őket (ott a megnyert ruhák várnak), ezért ő maga nem ad.
export const GIFT_SOURCES = ['race', 'healthy', 'pet', 'foodcatch', 'bubbles', 'openworld', 'sparkhorn'];

const int = (v, lo, hi, d) => (v !== null && v !== '' && Number.isFinite(+v) ? Math.max(lo, Math.min(hi, Math.floor(+v))) : d);
const OLD_ENTRY = /^[\p{L}0-9:_-]{1,24}$/u;               // a régi mentés ajándék-bejegyzései (pl. "race-1700000000000")
const isGift = id => typeof id === 'string' && !!giftById(id) && giftById(id).kind !== 'flower';   // a virág nem tárgy: a kertben nyílik és elhervad
// a tarisznya: rekeszenként hány meglepetés van benne (0…ITEM_MAX); ismeretlen rekesz nem marad meg
export const cleanItems = v => Object.fromEntries(ITEM_KEYS.map(k => [k, int(v && typeof v === 'object' && !Array.isArray(v) ? v[k] : 0, 0, ITEM_MAX, 0)]));

// Átemelés és rendbetétel. s: a már ellenőrzött profil (total, friends rendben); raw: a beolvasott nyers adat
// (saját mentés vagy fájlból visszatöltött, NEM megbízható). Többször futtatva is ugyanazt adja.
// - régi mentés (nincs owned): a régi szabály szerinti darabszám (megnyert versenyek + csillag/20, legfeljebb 10) a régi
//   sorrend elejéből; a csillagokért járó ajándékok eddig kifizetettnek számítanak (nem jönnek újra, és egy sem marad ki)
// - a szív a már megetetett barátokkal indul: ők a korábbi etetések nyomai (minden etetés egy jó tett)
export function migrateEconomy(s, raw) {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const paidMax = Math.floor((s.total || 0) / STAR_STEP);
  if (Array.isArray(r.owned)) s.owned = [...new Set(r.owned.filter(isGift))].slice(0, 400);
  else {
    const won = Array.isArray(r.gifts) ? Math.min(200, new Set(r.gifts.filter(g => typeof g === 'string' && OLD_ENTRY.test(g))).size) : 0;
    s.owned = OLD_ORDER.slice(0, Math.min(OLD_ORDER.length, won + paidMax));
  }
  s.starGifts = 'starGifts' in r ? int(r.starGifts, 0, paidMax, paidMax) : paidMax;
  s.hearts = 'hearts' in r ? int(r.hearts, 0, 100000, 0) : Math.min(60, Array.isArray(s.friends) ? s.friends.length : 0);
  s.gold = int(r.gold, 0, 100000, 0);
  s.items = cleanItems(r.items);
  // a létra utáni meglepetések száma; a régi mentésben nincs: ott annyinak számít, ahány virágot kapott (így felváltva folytatódik)
  s.treats = 'treats' in r ? int(r.treats, 0, s.gold + 1, s.gold) : s.gold;
  const kindOf = id => giftById(id)?.kind;
  s.newDress = Array.isArray(r.newDress) ? [...new Set(r.newDress.filter(id => s.owned.includes(id) && kindOf(id) === 'dress'))] : [];
  s.newDecor = Array.isArray(r.newDecor) ? [...new Set(r.newDecor.filter(id => s.owned.includes(id) && kindOf(id) === 'garden'))] : [];
  delete s.gifts;                                          // a régi számláló szerepét az owned lista vette át
  return s;
}

// A következő ajándék: a létra első még meg nem szerzett foka; ha minden megvan, felváltva egy ajándékvirág a körforgásból
// (tulipán, harangvirág, margaréta, aranyvirág; s.gold = eddig kapott ajándékvirágok) és egy meglepetés a tarisznyába
// (falat, varázspor, tűzijáték; s.treats = eddig kapott). Ha az a rekesz tele van, virág jön (üres ajándék nincs).
export function nextGiftId(s) {
  const step = LADDER.find(id => !s.owned.includes(id));
  if (step) return step;
  const t = treatAt(s.treats || 0);
  if ((s.treats || 0) < (s.gold || 0) && ((s.items || {})[t.item] || 0) < ITEM_MAX) return t.id;
  return flowerGiftAt(s.gold || 0).id;
}
export const nextGift = s => giftById(nextGiftId(s));
export const owns = (s, id) => s.owned.includes(id);

// Egy ajándék kiosztása (mindig van mit adni). Visszaadja a tárgyat.
export function grantGift(s) {
  const g = nextGift(s);
  if (g.kind === 'flower') s.gold = (s.gold || 0) + 1;
  else if (g.kind === 'treat' && s.owned.includes(g.id)) { addItem(s, g.item); s.treats = (s.treats || 0) + 1; }   // a létra után
  else {
    if (g.kind === 'treat') addItem(s, g.item);            // a létrán: az első ilyen meglepetés
    s.owned.push(g.id);
    if (g.kind === 'dress') s.newDress.push(g.id);
    if (g.kind === 'garden') s.newDecor.push(g.id);
  }
  return g;
}

const addItem = (s, k) => { s.items = cleanItems(s.items); s.items[k] = Math.min(ITEM_MAX, s.items[k] + 1); };
// Egy meglepetés elhasználása (a játék gombja): igaz, ha volt a rekeszben
export function useItem(s, k) {
  s.items = cleanItems(s.items);
  if (!(s.items[k] > 0)) return false;
  s.items[k]--; return true;
}

// Csillag-ajándék: ha a gyűjtött csillagok átléptek egy újabb 20-as határt (feladatonként legfeljebb egy)
export const starGiftDue = s => Math.floor((s.total || 0) / STAR_STEP) > (s.starGifts || 0);
export function payStarGift(s) {
  if (!starGiftDue(s)) return null;
  s.starGifts++;
  return grantGift(s);
}

// Rozi mondata az ajándékról: mi az, és hol találja. A csillagokat nem számolja; a név csak néha (és csak helyben ismert).
export function giftLine(g, name = '', rand = Math.random) {
  if (g.where) return named(`Ajándékot kaptál{, N}: ${g.acc}! ${g.where}`, name, rand, 0.4);
  if (g.kind === 'dress') return named(`Ajándékot kaptál{, N}: ${g.acc}! Az öltöztetőben vár.`, name, rand, 0.4);
  if (g.kind === 'garden') return named(`Ajándékot kaptál a kertbe{, N}: ${g.acc}!`, name, rand, 0.4);
  return named(`Ajándékot kaptál{, N}: ${g.acc}! Kinyílt a kertben.`, name, rand, 0.4);
}

// Egy jutalomkör: legfeljebb egy ajándék (amelyik játék előbb adja), és játékonként korlátos számú szív
export const newRewardSession = () => ({ gift: null, hearts: {}, adventure: false });
// A Varázsvilág egy befejezett kalandja: saját ajándék (a kör ajándékán felül, mert több kör munkája), de körönként
// legfeljebb egy, hogy a létra ne fogyjon el túl gyorsan.
export function adventureReward(s, sess) {
  if (!sess || sess.adventure) return null;
  sess.adventure = true;
  return grantGift(s);
}
export function sessionGift(s, sess, source) {
  if (sess.gift || !GIFT_SOURCES.includes(source)) return null;
  sess.gift = source;
  return grantGift(s);
}
export function sessionHeart(s, sess, source) {
  const cap = HEART_CAPS[source], n = sess.hearts[source] || 0;
  if (!cap || n >= cap) return false;
  sess.hearts[source] = n + 1; s.hearts = (s.hearts || 0) + 1;
  return true;
}
