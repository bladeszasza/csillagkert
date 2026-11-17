// A szülő kiejtés-javítója: ha a felolvasó egy szót rosszul ejt, a szülő megadhat helyette egy írásmódot
// („csillag" → „csil-lag"). Egész szóra illeszt, kis- és nagybetűtől függetlenül, az ékezetes betűket is betűnek véve
// (a JS \b csak az angol betűket ismeri, és a hátratekintő minta régebbi iPadOS-en hibát dob, ezért egyik sincs).
// A bevitt szöveg mindig sima szöveg, soha nem minta. Tiszta modul (Node-teszt).
export const FIX_MAX = 30, FIX_LEN = 30;
const clean = v => String(v ?? '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, FIX_LEN);
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// [[szó, helyette], …] → ellenőrzött lista (üres és ismétlődő szó ki, legfeljebb FIX_MAX darab; az utolsó bevitel nyer)
export function cleanFixes(list) {
  if (!Array.isArray(list)) return [];
  const out = new Map();
  for (const e of list) {
    if (!Array.isArray(e)) continue;
    const w = clean(e[0]), r = clean(e[1]);
    if (!w || !r || !/\p{L}/u.test(w)) continue;
    out.delete(w.toLowerCase()); out.set(w.toLowerCase(), [w, r]);
  }
  return [...out.values()].slice(-FIX_MAX);
}

// Kiejtési korrekciók (csak ha egy hang tévesen ejt valamit). Szülői hangpróba: "csillag, tyúk, szék".
// A hangok eszközönként eltérnek, ezért csak keveset javítunk vakon; bővíthető: [minta, helyettesítés].
export const LEXICON = [
  [/csillag/gi, 'csil-lag'],   // a kettőzött l hallható legyen
];

// A teljes út a felolvasásig: emoji ki (különben "kör pirosan..."-ként olvassa), a szülő javításai elsők, utána a
// beépített szótár (amelyik szót a szülő javította, arra nem fut)
export function speechText(text, fixList) {
  let t = String(text).replace(/\p{Extended_Pictographic}|️|‍|[⃣]/gu, ' ').replace(/<br>/g, ' ').replace(/\s+/g, ' ').trim();
  const fixes = cleanFixes(fixList);
  t = applyFixes(t, fixes);
  for (const [re, rep] of LEXICON) if (!fixes.some(([w]) => { re.lastIndex = 0; return re.test(w); })) { re.lastIndex = 0; t = t.replace(re, rep); }
  return t;
}

export function applyFixes(text, list) {
  let t = String(text);
  for (const [w, r] of cleanFixes(list)) {
    const re = new RegExp('(^|[^\\p{L}\\p{N}])(' + escapeRe(w) + ')(?=[^\\p{L}\\p{N}]|$)', 'giu');
    t = t.replace(re, (m, pre) => pre + r);
  }
  return t;
}
