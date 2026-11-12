// Ellenőrzött szóbankok. Minden képnek EGY neve van (cica, nem macska; labda, nem foci), a ragozott alakok kiírva
// (a magyar ragozás rendhagyó: ló → lovat, bokor → bokrot), nem levezetve.

// Megszámolható tárgyak. ela: -ból/-ből alak ("almából van a legtöbb").
export const THINGS = [
  { e: '🍎', n: 'alma', ela: 'almából' }, { e: '🍐', n: 'körte', ela: 'körtéből' }, { e: '🍓', n: 'eper', ela: 'eperből' },
  { e: '🍌', n: 'banán', ela: 'banánból' }, { e: '🥕', n: 'répa', ela: 'répából' }, { e: '🌸', n: 'virág', ela: 'virágból' },
  { e: '⭐', n: 'csillag', ela: 'csillagból' }, { e: '🎈', n: 'lufi', ela: 'lufiból' }, { e: '🐟', n: 'hal', ela: 'halból' },
  { e: '🐥', n: 'csibe', ela: 'csibéből' }, { e: '🦋', n: 'pillangó', ela: 'pillangóból' }, { e: '🐞', n: 'katica', ela: 'katicából' },
  { e: '🍄', n: 'gomba', ela: 'gombából' }, { e: '🚗', n: 'autó', ela: 'autóból' }, { e: '⚽', n: 'labda', ela: 'labdából' },
  { e: '🍋', n: 'citrom', ela: 'citromból' }, { e: '🐌', n: 'csiga', ela: 'csigából' }, { e: '🦆', n: 'kacsa', ela: 'kacsából' },
  { e: '🍪', n: 'keksz', ela: 'kekszből' }, { e: '🥚', n: 'tojás', ela: 'tojásból' },
];

// Állatok (sorba állítva, sorszámokhoz és jelenetekhez)
export const ANIMALS = [
  { e: '🐶', n: 'kutya' }, { e: '🐱', n: 'cica' }, { e: '🐰', n: 'nyuszi' }, { e: '🦊', n: 'róka' }, { e: '🐻', n: 'maci' },
  { e: '🐼', n: 'panda' }, { e: '🐸', n: 'béka' }, { e: '🐷', n: 'malac' }, { e: '🐮', n: 'tehén' }, { e: '🐔', n: 'tyúk' },
  { e: '🦆', n: 'kacsa' }, { e: '🐭', n: 'egér' }, { e: '🦔', n: 'sün' }, { e: '🐢', n: 'teknős' }, { e: '🐑', n: 'bárány' }, { e: '🐴', n: 'ló' },
];

// egy emoji hányszor szerepel egy szövegben (a tesztek ebből számolnak, a képből)
export const countOf = (html, e) => String(html).split(e).length - 1;
