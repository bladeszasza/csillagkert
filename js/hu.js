// Magyar nyelvtani segédek a kimondott mondatokhoz (a gyerek csak hallja, ezért helyesnek kell lennie).
// Határozott névelő: "az", ha magánhangzóval kezdődik a szó, különben "a".
const VOWEL = /^[aáeéiíoóöőuúüű]/i;
export const art = (word, cap = false) => { const a = VOWEL.test(String(word).trim()) ? 'az' : 'a'; return cap ? a[0].toUpperCase() + a.slice(1) : a; };
export const withArt = (word, cap = false) => `${art(word, cap)} ${word}`;

// Betűnév alapján ("az A", "az M", de "a K", "a T"): a betű NEVE kezdődik-e magánhangzóval (a, e, ef, el, em, en, es, ...)
const VOWEL_LETTERS = new Set('AEFILMNORSUXÁÉÍÓÖŐÚÜŰ'.split(''));
export const artLetter = (L, cap = false) => { const a = VOWEL_LETTERS.has(String(L).toUpperCase()) ? 'az' : 'a'; return cap ? a[0].toUpperCase() + a.slice(1) : a; };

// tárgyeset számokra ("Elveszünk kettőt")
export const ACC_NUM = { 1: 'egyet', 2: 'kettőt', 3: 'hármat', 4: 'négyet', 5: 'ötöt', 6: 'hatot', 7: 'hetet', 8: 'nyolcat', 9: 'kilencet', 10: 'tizet', 11: 'tizenegyet', 12: 'tizenkettőt', 13: 'tizenhármat', 14: 'tizennégyet', 15: 'tizenötöt', 16: 'tizenhatot', 17: 'tizenhetet', 18: 'tizennyolcat', 19: 'tizenkilencet', 20: 'húszat' };
// főnév előtt: "két alma", "tizenkét alma" (nem "kettő alma")
export const numAttr = word => String(word).replace(/kettő$/, 'két');
// a barátok tárgyesete (simogasd meg a cicát)
export const FRIEND_ACC = { cica: 'cicát', nyuszi: 'nyuszit', kutya: 'kutyát', róka: 'rókát', maci: 'macit', panda: 'pandát' };
