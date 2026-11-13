// „Az én unikornisom": a gyerek saját unikornisának leírása (szín, minta, sörény, szarv, szárny, fejdísz, szem, nyak,
// háttér, matricák). Ugyanez a leírás öltözteti a 3D unikornist mindenhol: a kertben, a szabad futásban, a versenyen,
// a Barátom játékban és (színekben) a Sparkhorn-futásban. Nincs benne böngésző-kód, így a Node-tesztek is beolvassák.
// Az öltöztető a profilban (progress.dress) tárolja; név nincs benne.
import { giftById } from './gifts.js';

export const RB = ['#ff5d5d', '#ffb020', '#ffe14d', '#4cc38a', '#4a7dff', '#8e5be8'];
export const INK = '#3b2a63';
const COLORS = ['#ffffff', '#ffd6ea', '#d6e6ff', '#e6d6ff', '#fff0b8', '#c8f2dd', '#ffc9a8', '#3b2a63'];
const MANES = ['#ff5d8f', '#8e5be8', '#4aa8ff', '#4cc38a', '#ffb020', '#ff7ac8', '#2fd0d0'];

// Csoportok fülenként. item: {id, color|icon}; a zárolt elemeket a gifts.js dönti el ("csoport:elem").
export const TABS = [
  { id: 'test', icon: '🐴', groups: [
    { key: 'body', items: COLORS.map((c, i) => ({ id: 'c' + i, color: c })) },
    { key: 'pattern', items: [['none', '∅'], ['spots', '⚫'], ['stripes', '🦓'], ['stars', '⭐'], ['hearts', '💗']].map(([id, icon]) => ({ id, icon })) },
  ] },
  { id: 'sor', icon: '🎀', groups: [
    { key: 'mane', items: [...MANES.map((c, i) => ({ id: 'c' + i, color: c })), { id: 'rainbow', icon: '🌈' }] },
    { key: 'manestyle', items: [['wave', '🌊'], ['braid', '🪢'], ['wild', '⚡'], ['curl', '🌀']].map(([id, icon]) => ({ id, icon })) },
  ] },
  { id: 'szarv', icon: '🦄', groups: [
    { key: 'horn', items: [['gold', '#ffd24d'], ['pink', '#ff8fc8'], ['ice', '#9be6ff'], ['rainbow', null]].map(([id, color]) => ({ id, color, icon: color ? undefined : '🌈' })) },
    { key: 'hornstyle', items: [['straight', '▲'], ['spiral', '🌀']].map(([id, icon]) => ({ id, icon })) },
  ] },
  { id: 'szarny', icon: '🦋', groups: [
    { key: 'wing', items: [['none', '∅'], ['feather', '🪶'], ['butterfly', '🦋'], ['fairy', '🧚'], ['rainbow', '🌈']].map(([id, icon]) => ({ id, icon })) },
  ] },
  { id: 'fej', icon: '👑', groups: [
    { key: 'head', items: [['none', '∅'], ['crown', '👑'], ['flowers', '🌸'], ['bow', '🎀'], ['wizard', '🧙']].map(([id, icon]) => ({ id, icon })) },
    { key: 'eyes', items: [['normal', '👁️'], ['glasses', '🕶️'], ['hearts', '😍']].map(([id, icon]) => ({ id, icon })) },
  ] },
  { id: 'nyak', icon: '🧣', groups: [
    { key: 'neck', items: [['none', '∅'], ['necklace', '📿'], ['scarf', '🧣'], ['cape', '🦸'], ['pearls', '🤍']].map(([id, icon]) => ({ id, icon })) },
  ] },
  { id: 'hatter', icon: '🖼️', groups: [
    { key: 'bg', items: [['garden', '🌷'], ['night', '🌙'], ['clouds', '☁️'], ['sea', '🌊'], ['castle', '🏰']].map(([id, icon]) => ({ id, icon })) },
  ] },
  { id: 'matrica', icon: '⭐', groups: [
    { key: 'stickers', multi: true, items: [['star', '⭐'], ['heart', '💖'], ['flower', '🌼'], ['moon', '🌙'], ['rain', '🌈']].map(([id, icon]) => ({ id, icon })) },
  ] },
];
export const GROUPS = TABS.flatMap(t => t.groups);
export const DEFAULT = { body: 'c0', pattern: 'none', mane: 'c0', manestyle: 'wave', horn: 'gold', hornstyle: 'straight', wing: 'none', head: 'none', eyes: 'normal', neck: 'none', bg: 'garden', stickers: [] };
export const MAX_STICKERS = 4;

export const colorOf = (key, id) => GROUPS.find(g => g.key === key)?.items.find(i => i.id === id)?.color;
const known = (key, id) => !!GROUPS.find(g => g.key === key)?.items.some(i => i.id === id);

// Ajándék-ruhadarab-e (a létra adja), és ha igen, megvan-e már
const isGift = id => giftById(id)?.kind === 'dress';

// A mentett leírás rendbetétele: ismeretlen érték helyett az alap; a meg nem nyert ajándék-darab nem marad rajta
// (régen egy újrakezdés után felvéve maradhatott; most minden játékban látszana). owns(id): megvan-e ez az ajándék.
export function normalizeDress(d, owns = () => true) {
  const src = d && typeof d === 'object' && !Array.isArray(d) ? d : {}, out = { ...DEFAULT, stickers: [] };
  for (const key of Object.keys(DEFAULT)) {
    if (key === 'stickers') continue;
    const v = src[key];
    if (typeof v === 'string' && known(key, v) && !(isGift(`${key}:${v}`) && !owns(`${key}:${v}`))) out[key] = v;
  }
  if (Array.isArray(src.stickers)) out.stickers = [...new Set(src.stickers.filter(v => typeof v === 'string' && known('stickers', v)))].slice(-MAX_STICKERS);
  return out;
}

// Színkeverés (#rrggbb): k = 0 → a, k = 1 → b
export function mix(a, b, k) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b);
  return '#' + A.map((x, i) => Math.round(x + (B[i] - x) * k).toString(16).padStart(2, '0')).join('');
}

// A 3D építő ezt kapja: kész színek és stílusok. A sörény két árnyalatú (vagy szivárvány), a szarv egy színű (vagy szivárvány).
export function resolveAvatar(cfg = {}) {
  const s = normalizeDress(cfg);
  const body = colorOf('body', s.body) || '#ffffff', dark = body === INK;
  const m = colorOf('mane', s.mane) || MANES[0];
  return {
    body, dark,
    mane: s.mane === 'rainbow' ? RB : [m, mix(m, '#ffffff', 0.35)],
    horn: s.horn === 'rainbow' ? RB : [colorOf('horn', s.horn) || '#ffd24d'],
    hoof: dark ? '#ffd6ea' : '#8e5be8',
    pattern: s.pattern, patternColor: dark ? '#ffffff' : '#c9b3f5',
    manestyle: s.manestyle, hornstyle: s.hornstyle, wing: s.wing, head: s.head, eyes: s.eyes, neck: s.neck,
  };
}

// A Sparkhorn-futás „az én unikornisom" színei (csak színek, név nélkül). A Csillagkert a futás indítása előtt
// a közös `csillagkert_avatar` kulcsba írja (ugyanaz a github.io cím, így a Sparkhorn beolvashatja).
export const SPARK_KEY = 'csillagkert_avatar';
export function sparkPalette(cfg = {}) {
  const a = resolveAvatar(cfg), mane = Array.from({ length: 5 }, (_, i) => a.mane[i % a.mane.length]);
  return { v: 1, body: a.body, legs: mix(a.body, INK, 0.12), horn: a.horn[0], tail: mane[0], mane, ears: a.dark ? '#bdb4e6' : '#ffc0e0', eyes: a.dark ? '#ffffff' : '#382c6e' };
}
