// Közös segédek a sablonokhoz: számnevek, számkártyák, eltérítők.
import { withArt } from '../hu.js';

export const NUMS = ['nulla', 'egy', 'kettő', 'három', 'négy', 'öt', 'hat', 'hét', 'nyolc', 'kilenc', 'tíz', 'tizenegy', 'tizenkettő', 'tizenhárom', 'tizennégy', 'tizenöt', 'tizenhat', 'tizenhét', 'tizennyolc', 'tizenkilenc', 'húsz'];
// tárgyeset: "elveszünk hármat"
export const ACC = ['nullát', 'egyet', 'kettőt', 'hármat', 'négyet', 'ötöt', 'hatot', 'hetet', 'nyolcat', 'kilencet', 'tizet', 'tizenegyet', 'tizenkettőt', 'tizenhármat', 'tizennégyet', 'tizenötöt', 'tizenhatot', 'tizenhetet', 'tizennyolcat', 'tizenkilencet', 'húszat'];
// főnév előtt: "két alma", "tizenkét alma"
export const attr = n => NUMS[n].replace(/kettő$/, 'két');
// sorszámnév: "a harmadik"
export const ORD = ['', 'első', 'második', 'harmadik', 'negyedik', 'ötödik', 'hatodik', 'hetedik', 'nyolcadik', 'kilencedik', 'tizedik'];
export const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;

// számkártya válasznak: számjegy + pöttyök a gombon, kimondva szóval
export const numCard = (n, ok = false) => ({ n, name: NUMS[n], ok, said: `Ez ${withArt(NUMS[n])}.` });

// közeli, de biztosan rossz számok (±1..±3), a megadott tartományban
export function nearNums(n, r, lo = 0, hi = 20, k = 2, avoid = []) {
  const pool = r.shuffle([1, -1, 2, -2, 3, -3].map(d => n + d).filter(v => v >= lo && v <= hi && v !== n && !avoid.includes(v)));
  return pool.slice(0, k);
}

// egy csoport kép-tárgyból (pl. 🍎🍎🍎): sorban, ötösével tagolva, hogy 20-ig is megszámolható legyen
export const group = (emoji, n, cls = '') => `<span class="grp-items ${cls}">${Array.from({ length: n }, (_, i) => `<i>${emoji}</i>${(i + 1) % 5 === 0 && i + 1 < n ? '<b></b>' : ''}`).join('')}</span>`;
