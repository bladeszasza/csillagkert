// Ceruzavár: írás-előkészítő, generált gyakorló feladatok (nincs rossz válasz, a befejezés számít).
// Sorrend (a terv 1c része szerint): függőleges → vízszintes → kör → kereszt → ferde → négyzet → háromszög, mellette
// íves és töréses vonalcsaládok egyre több elemmel, aztán számjegyek, nyomtatott nagybetűk, rövid szavak és a saját név.
// Útvesztő és pöttyösszekötő a tervezéshez és a ceruza irányításához. A szintek beosztása saját döntés.
//
// Kulcs-szabály: a kulcs a vonal alakja (család + az elemek száma + álló/fekvő + forgásirány), a betű, a szám, a szó,
// az útvesztő megoldása (betűjellel, mint a Robotpályán) és a pöttyös kép. NEM új feladat: ugyanaz az alak nagyobban,
// máshol vagy fordított irányban végigjárva (a nyitott vonal mindkét végéről kezdhető), és ugyanaz az útvesztő-megoldás
// más zsákutcákkal. A tükörkép csak ott külön feladat, ahol a forgásirány más (csigavonal, hurok).
import { strokePoints, compose, LETTERS, DIGITS } from '../glyphs.js';
import { ACC_NUM, withArt, artLetter } from '../hu.js';
import { rng } from './rng.js';
import { carve, encode, solveMaze } from '../maze-core.js';

const S = { station: 'ceruza', icon: '✏️', graded: false };
const TAU = Math.PI * 2;
const poly = verts => strokePoints(`M${verts[0].join(',')} ${verts.slice(1).map(v => 'L' + v.join(',')).join(' ')}`);
// paraméteres görbe, egyenletesen besűrítve (két szomszédos pont legfeljebb 0.03 egységre)
const densify = pts => pts.flatMap((p, i) => { if (!i) return [p]; const q = pts[i - 1], k = Math.ceil(Math.hypot(p[0] - q[0], p[1] - q[1]) / 0.03); return Array.from({ length: k }, (_, j) => [q[0] + (p[0] - q[0]) * (j + 1) / k, q[1] + (p[1] - q[1]) * (j + 1) / k]); });
const curve = (fn, n) => densify(Array.from({ length: n + 1 }, (_, i) => fn(i / n)));
const swap = pts => pts.map(([x, y]) => [y, x]);
const circle = (cx, cy, r, ry = r) => curve(t => [cx + r * Math.cos(-Math.PI / 2 - t * TAU), cy + ry * Math.sin(-Math.PI / 2 - t * TAU)], 72);   // felülről, az óramutatóval ellentétesen

// --- vonalak: { kulcs, szint, vonások, Rozi mondata } ---
const LINES = [];
const line = (skill, key, level, strokes, say, tol = 0.2) => LINES.push({ skill, key, level, strokes, say, tol });
// egyenes vonalak (felülről lefelé, balról jobbra)
line('ceruza.egyenes', 'fuggoleges', 1, [poly([[0, 0], [0, 2.2]])], 'Húzz egy egyenes vonalat fentről lefelé!');
line('ceruza.egyenes', 'vizszintes', 1, [poly([[0, 0], [3, 0]])], 'Húzz egy egyenes vonalat balról jobbra!');
line('ceruza.egyenes', 'eso', 1, [0, 1, 2].map(x => poly([[x, 0], [x, 1.6]])), 'Rajzolj esőt! Minden csepp fentről lefelé esik.');
line('ceruza.egyenes', 'fu', 2, [0, 0.5, 1, 1.5, 2].map(x => poly([[x, 0], [x, 0.8]])), 'Kövesd a fűszálakat, mindig fentről lefelé!');
line('ceruza.egyenes', 'kerites', 2, [...[0, 1, 2, 3].map(x => poly([[x, 0], [x, 2]])), poly([[-0.3, 0.8], [3.3, 0.8]])], 'Építsünk kerítést! Előbb a léceket, aztán a keresztlécet.');
line('ceruza.egyenes', 'ferde-fel', 3, [poly([[0, 2], [2, 0]])], 'Húzz egy ferde vonalat, mint egy csúszda!');
line('ceruza.egyenes', 'ferde-le', 3, [poly([[0, 0], [2, 2]])], 'Csússz le a ferde vonalon, fentről lefelé!');
line('ceruza.egyenes', 'teto', 3, [poly([[1.2, 0], [0, 1.3]]), poly([[1.2, 0], [2.4, 1.3]])], 'Rajzolj háztetőt! Mindkét vonal a csúcsról indul.');
line('ceruza.egyenes', 'letra', 3, [poly([[0, 0], [0, 3]]), poly([[1.2, 0], [1.2, 3]]), ...[0.5, 1.2, 1.9, 2.6].map(y => poly([[0, y], [1.2, y]]))], 'Rajzoljunk létrát! Előbb a két szárát, aztán a fokokat.');
line('ceruza.egyenes', 'sugarak', 4, [circle(0, 0, 0.55), ...Array.from({ length: 8 }, (_, i) => { const a = i * TAU / 8 - Math.PI / 2; return poly([[0.75 * Math.cos(a), 0.75 * Math.sin(a)], [1.25 * Math.cos(a), 1.25 * Math.sin(a)]]); })], 'Rajzolj napot! Előbb a kört, aztán a sugarakat.');
// íves vonalak
const wave = n => curve(t => [t * n * 1.2, 0.5 - 0.5 * Math.sin(t * n * TAU)], 40 * n);
[[2, 1], [3, 2], [4, 3], [5, 4]].forEach(([n, lv]) => line('ceruza.ives', `hullam${n}`, lv, [wave(n)], 'Kövesd a hullámot! Fel és le, mint a tenger.'));
[[2, 2], [3, 3], [4, 4]].forEach(([n, lv]) => line('ceruza.ives', `hullam-allo${n}`, lv, [swap(wave(n))], 'Kövesd a hullámot fentről lefelé, mint egy kígyó!'));
[[2, 1], [3, 2], [4, 3], [5, 4]].forEach(([n, lv]) => line('ceruza.ives', `kehely${n}`, lv, [curve(t => [t * n, Math.abs(Math.sin(Math.PI * t * n))], 30 * n)], 'Kövesd a vonalat! Le és fel, mint a hinta.'));
[[2, 1], [3, 2], [4, 3], [5, 4]].forEach(([n, lv]) => line('ceruza.ives', `arkad${n}`, lv, [curve(t => [t * n, 1 - Math.abs(Math.sin(Math.PI * t * n))], 30 * n)], 'Kövesd a dombokat! Fel és le, át a dombokon.'));
const loops = (n, s) => curve(t => { const a = t * n * TAU; return [0.9 * a / TAU + s * 0.45 * Math.sin(a), 0.5 + 0.45 * Math.cos(a)]; }, 48 * n);
[[2, 2], [3, 3], [4, 4], [5, 5]].forEach(([n, lv]) => line('ceruza.ives', `hurok${n}`, lv, [loops(n, 1)], 'Kövesd a hurkokat, mint egy gombolyag fonala!'));
[[2, 3], [3, 4], [4, 5]].forEach(([n, lv]) => line('ceruza.ives', `hurok-masik${n}`, lv, [loops(n, -1)], 'Kövesd a hurkokat! Most a másik irányba pörögnek.'));
const spiral = (turns, s) => curve(t => { const r = 0.12 + 0.88 * t, a = s * t * turns * TAU; return [r * Math.cos(a), r * Math.sin(a)]; }, 60 * turns);
[[2, 1, 3], [2, -1, 3], [3, 1, 4], [3, -1, 4]].forEach(([n, s, lv]) => line('ceruza.ives', `csiga${n}${s > 0 ? 'j' : 'b'}`, lv, [spiral(n, s)], 'Kövesd a csigavonalat! Körbe-körbe, mint a csiga háza.', 0.16));
const eight = curve(t => [-Math.cos(t * TAU), 0.55 * Math.sin(2 * t * TAU)], 120);
line('ceruza.ives', 'nyolcas-fekvo', 4, [eight], 'Kövesd a nyolcast! Körbe-körbe, mint a kisvasút.');
line('ceruza.ives', 'nyolcas-allo', 5, [swap(eight)], 'Kövesd az álló nyolcast! Körbe-körbe, mint a kisvasút.');
[[3, 2], [5, 3]].forEach(([n, lv]) => line('ceruza.ives', `buborek${n}`, lv, Array.from({ length: n }, (_, i) => circle(i * 1.25, 0, 0.5)), 'Rajzolj buborékokat! Mindegyik egy kis kör.'));
const hook = x => strokePoints(`M${x},0 L${x},0.75 A${x - 0.28},0.75,0.28,0.28,0,180`);
[[3, 3], [5, 4]].forEach(([n, lv]) => line('ceruza.ives', `kampo${n}`, lv, Array.from({ length: n }, (_, i) => hook(i * 0.9)), 'Kövesd a kampókat! Le, aztán egy kis kanyar.'));
// töréses vonalak
const zig = n => poly(Array.from({ length: 2 * n + 1 }, (_, i) => [i * 0.55, i % 2 ? 0 : 1]));
[[3, 2], [4, 3], [5, 3], [6, 4]].forEach(([n, lv]) => line('ceruza.tores', `cikcak${n}`, lv, [zig(n)], 'Kövesd a cikcakkot, mint a villám!'));
[[3, 3], [4, 4], [5, 5]].forEach(([n, lv]) => line('ceruza.tores', `cikcak-allo${n}`, lv, [swap(zig(n))], 'Kövesd a cikcakkot fentről lefelé!'));
const steps = n => poly([[0, n * 0.7], ...Array.from({ length: n }, (_, i) => [[i * 0.8, (n - i - 1) * 0.7], [(i + 1) * 0.8, (n - i - 1) * 0.7]]).flat()]);
[[3, 2], [4, 3], [5, 4]].forEach(([n, lv]) => line('ceruza.tores', `lepcso${n}`, lv, [steps(n)], 'Mássz fel a lépcsőn! Fel, aztán előre.'));
const wall = n => poly([[0, 1], ...Array.from({ length: n }, (_, i) => [[i * 1.6, 0], [i * 1.6 + 0.8, 0], [i * 1.6 + 0.8, 1], [i * 1.6 + 1.6, 1]]).flat()]);
[[2, 3], [3, 4], [4, 5]].forEach(([n, lv]) => line('ceruza.tores', `varfal${n}`, lv, [wall(n)], 'Rajzolj várfalat! Fel, át, le, át.'));
const saw = n => poly([[0, 1], ...Array.from({ length: n }, (_, i) => [[i * 0.8, 0], [(i + 1) * 0.8, 1]]).flat()]);
[[3, 3], [4, 4], [5, 5]].forEach(([n, lv]) => line('ceruza.tores', `fures${n}`, lv, [saw(n)], 'Kövesd a fűrész fogait! Fel, aztán ferdén le.'));

// --- formák (a kör, a négyzet és a többi zárt alak bármelyik irányban körbejárható) ---
const FORMS = [
  ['kor', 1, 'kört', [circle(0, 0, 1)]],
  ['felkor', 1, 'szivárványt', [curve(t => [Math.cos(Math.PI + t * Math.PI), 0.1 + Math.sin(Math.PI + t * Math.PI)], 60)]],
  ['tojas', 2, 'tojást', [circle(0, 0, 0.75, 1)]],
  ['kereszt', 2, 'keresztet', [poly([[0.8, 0], [0.8, 1.6]]), poly([[0, 0.8], [1.6, 0.8]])]],
  ['negyzet', 3, 'négyzetet', [poly([[0, 0], [0, 1.6], [1.6, 1.6], [1.6, 0], [0, 0]])]],
  ['teglalap', 3, 'téglalapot', [poly([[0, 0], [0, 1.2], [2.4, 1.2], [2.4, 0], [0, 0]])]],
  ['ferde-kereszt', 3, 'ferde keresztet', [poly([[0, 0], [1.5, 1.5]]), poly([[1.5, 0], [0, 1.5]])]],
  ['haziko', 3, 'házikót', [poly([[0.9, 0], [0, 0.8], [0, 1.8], [1.8, 1.8], [1.8, 0.8], [0.9, 0]])]],
  ['haromszog', 4, 'háromszöget', [poly([[0.9, 0], [0, 1.6], [1.8, 1.6], [0.9, 0]])]],
  ['hold', 4, 'holdsarlót', [strokePoints('A0,0,1,1,-70,-290 A0.62,0,0.62,0.9,110,250 L0.342,-0.94')]],
  ['csepp', 4, 'cseppet', [strokePoints('M0,-1.1 L-0.62,0.05 A0,0.32,0.66,0.66,200,-20 L0,-1.1')]],
  ['sziv', 5, 'szívet', [strokePoints('A-0.48,-0.4,0.48,0.48,0,-200 L0,0.95 L0.931,-0.236 A0.48,-0.4,0.48,0.48,20,-180')]],
  ['rombusz', 5, 'rombuszt', [poly([[0.7, 0], [0, 1], [0.7, 2], [1.4, 1], [0.7, 0]])]],
  ['csillag', 5, 'csillagot', [poly([0, 1, 2, 3, 4, 5].map(i => { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; return [Math.cos(a), 0.05 + Math.sin(a)]; }))]],
];
for (const [key, level, acc, strokes] of FORMS) line('ceruza.forma', key, level, strokes, `Rajzolj egy ${acc}! Kövesd a pöttyöket.`);

// --- számok, betűk, szavak: a vonás iránya számít (a zöld pöttytől indul), a sorrendet a kezdőpontok száma mutatja ---
const DIGIT_LV = { 0: 3, 1: 3, 7: 3, 2: 4, 3: 4, 4: 4, 5: 4, 9: 4, 6: 5, 8: 5 };
const DIGIT_ACC = { 0: 'nullát', 1: 'egyest', 2: 'kettest', 3: 'hármast', 4: 'négyest', 5: 'ötöst', 6: 'hatost', 7: 'hetest', 8: 'nyolcast', 9: 'kilencest' };
const LETTER_LV = L => ('ILTEFH'.includes(L) ? 3 : 'AKMNVWXYZOCUJDP'.includes(L) ? 4 : 5);
// szavak a képükkel: két betűs szavak a 4., hosszabbak az 5. szinten
const WORDS = [['LÓ', '🐴'], ['TÓ', '🏞️'], ['HÓ', '❄️'], ['FA', '🌳'], ['ÁG', '🌿'], ['ÚT', '🛣️'], ['ŐZ', '🦌'], ['SÓ', '🧂'], ['ÍJ', '🏹'],
  ['CICA', '🐱'], ['MAMA', '👩'], ['PAPA', '👨'], ['BABA', '👶'], ['ALMA', '🍎'], ['HAL', '🐟'], ['NAP', '☀️'], ['MÉZ', '🍯'], ['KÉZ', '✋'],
  ['LÁB', '🦶'], ['FÜL', '👂'], ['ORR', '👃'], ['HOLD', '🌙'], ['VÁR', '🏰'], ['HÁZ', '🏠'], ['AUTÓ', '🚗'], ['BUSZ', '🚌'], ['BÉKA', '🐸'],
  ['RÓKA', '🦊'], ['MACI', '🧸'], ['LIBA', '🪿'], ['TEVE', '🐪'], ['ZEBRA', '🦓'], ['EPER', '🍓'], ['SAS', '🦅'], ['KUTYA', '🐶'], ['NYUSZI', '🐰'],
  ['KACSA', '🦆'], ['SZÍV', '❤️'], ['CSIGA', '🐌'], ['ÓRA', '⏰'], ['VÍZ', '💧'], ['TORTA', '🎂'], ['LABDA', '⚽'], ['KÖNYV', '📚'], ['SÜN', '🦔'],
  ['TEHÉN', '🐮'], ['MALAC', '🐷'], ['MÓKUS', '🐿️'], ['PANDA', '🐼'], ['BAGOLY', '🦉'], ['BANÁN', '🍌'], ['TOJÁS', '🥚']];
const lower = w => w.toLocaleLowerCase('hu');
const WRITE = [
  ...DIGITS.map(d => ({ skill: 'ceruza.szam', key: `szam${d}`, level: DIGIT_LV[d], text: d, say: `Írd le ${withArt(DIGIT_ACC[d])}! Kezdd a zöld pöttynél.` })),
  ...Array.from({ length: 11 }, (_, i) => 10 + i).map(n => ({ skill: 'ceruza.szam', key: `szam${n}`, level: 5, text: String(n), say: `Írd le a ${ACC_NUM[n]}! Kezdd a zöld pöttynél.` })),
  ...LETTERS.map(L => ({ skill: 'ceruza.betu', key: `betu-${L}`, level: LETTER_LV(L), text: L, say: `Írd át ${artLetter(L)} ${L} betűt! Kezdd a zöld pöttynél.` })),
  ...WORDS.map(([w, e]) => ({ skill: 'ceruza.szo', key: `szo-${lower(w)}`, level: w.length <= 2 ? 4 : 5, text: w, pic: e, say: `Írd át a szót: ${lower(w)}!` })),
  // a saját név: a feladat-modul futáskor olvassa ki a helyi mentésből (nem kerül azonosítóba, kulcsba vagy naplóba);
  // ha nincs megadott név, egy szót írunk helyette
  { skill: 'ceruza.szo', key: 'nev', level: 5, text: 'MAMA', pic: '👩', useName: true, say: 'Írd át a szót: mama!' },
];

// --- útvesztő: a szintet a pálya mérete és a megoldás hossza adja; minden szintre legfeljebb tizenkét különböző megoldás ---
const MAZE_LV = [[1, 3, 3, 4, 6], [2, 4, 3, 5, 7], [3, 4, 4, 7, 10], [4, 5, 4, 9, 14], [5, 6, 5, 12, 30]];
function mazeTargets() {
  const out = [], seen = new Set();
  for (const [level, w, h, lo, hi] of MAZE_LV) {
    const r = rng(`ceruza.ut.${level}`);
    for (let tries = 0, n = 0; n < 12 && tries < 4000; tries++) {
      const rows = encode(carve(w, h, r)), s = solveMaze(rows, [0, 0], [w - 1, h - 1]);
      if (s.letters.length < lo || s.letters.length > hi || seen.has(s.letters)) continue;
      seen.add(s.letters); out.push({ key: s.letters, level, w, h, rows }); n++;
    }
  }
  return out;
}

// --- pöttyösszekötő: a pöttyök sorrendje rajzolja ki a képet (a végén kiderül, mi az) ---
const DOTS = [
  ['sarkany', 1, '🪁', 'egy papírsárkány', true, [[5, 0], [8, 4], [5, 10], [2, 4]]],
  ['zaszlo', 1, '🚩', 'egy zászló', false, [[2, 10], [2, 0], [8, 2.5], [2, 5]]],
  ['gyemant', 1, '💎', 'egy gyémánt', true, [[3, 1], [7, 1], [10, 4], [5, 10], [0, 4]]],
  ['haz', 1, '🏠', 'egy ház', true, [[1, 10], [1, 4], [5, 0], [9, 4], [9, 10]]],
  ['hal', 2, '🐟', 'egy hal', true, [[0, 5], [3, 2], [6, 2.5], [10, 1], [8, 5], [10, 9], [6, 7.5], [3, 8]]],
  ['fenyo', 2, '🌲', 'egy fenyőfa', true, [[5, 0], [9, 8], [6, 8], [6, 10], [4, 10], [4, 8], [1, 8]]],
  ['korona', 2, '👑', 'egy korona', true, [[0, 8], [0, 2], [2.5, 5], [5, 1], [7.5, 5], [10, 2], [10, 8]]],
  ['fagyi', 2, '🍦', 'egy fagylalt', true, [[5, 10], [2, 4], [2, 2.5], [3.5, 1], [6.5, 1], [8, 2.5], [8, 4]]],
  ['csillag', 3, '⭐', 'egy csillag', true, Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 2.2 : 5.2; return [5 + r * Math.cos(a), 5.4 + r * Math.sin(a)]; })],
  ['sziv', 3, '❤️', 'egy szív', true, [[5, 3], [3.5, 1], [1.5, 1], [0, 3], [0.5, 5.5], [5, 10], [9.5, 5.5], [10, 3], [8.5, 1], [6.5, 1]]],
  ['gomba', 3, '🍄', 'egy gomba', true, [[0, 5], [1, 2], [3.5, 0.3], [6.5, 0.3], [9, 2], [10, 5], [6.5, 5], [6.5, 9.5], [3.5, 9.5], [3.5, 5]]],
  ['raketa', 3, '🚀', 'egy rakéta', true, [[5, 0], [7, 3], [7, 7], [9, 9.5], [6.5, 9], [5, 10], [3.5, 9], [1, 9.5], [3, 7], [3, 3]]],
  ['hajo', 4, '🚢', 'egy hajó', true, [[0, 6], [3, 6], [3, 3], [5, 3], [5, 1], [6, 1], [6, 3], [7, 3], [7, 6], [10, 6], [8, 9.5], [2, 9.5]]],
  ['var', 4, '🏰', 'egy vár', true, [[0, 10], [0, 2], [2, 2], [2, 3.5], [4, 3.5], [4, 2], [6, 2], [6, 3.5], [8, 3.5], [8, 2], [10, 2], [10, 10]]],
  ['kacsa', 4, '🦆', 'egy kacsa', true, [[2, 4], [2.5, 1.5], [4.5, 0.5], [6, 2], [5.5, 4], [9.5, 4], [10, 6], [8.5, 9], [3, 9], [1, 7], [1.5, 5], [0, 4.3]]],
  ['macska', 4, '🐱', 'egy cicafej', true, [[5, 10], [2.5, 9.5], [0.8, 7.5], [0.5, 4.5], [1, 0.5], [3, 2], [4, 2.5], [6, 2.5], [7, 2], [9, 0.5], [9.5, 4.5], [9.2, 7.5], [7.5, 9.5]]],
  ['pillango', 5, '🦋', 'egy pillangó', true, [[5, 2.5], [7, 0.5], [9.5, 0.5], [10, 3], [8, 5], [9, 7], [8.5, 9.5], [6, 9], [5, 7], [4, 9], [1.5, 9.5], [1, 7], [2, 5], [0, 3], [0.5, 0.5], [3, 0.5]]],
  ['karacsonyfa', 5, '🎄', 'egy karácsonyfa', true, [[5, 0], [7.5, 3], [6.5, 3], [8.5, 6], [7.2, 6], [9.5, 9], [5.8, 9], [5.8, 11], [4.2, 11], [4.2, 9], [0.5, 9], [2.8, 6], [1.5, 6], [3.5, 3], [2.5, 3]]],
  ['dino', 5, '🦕', 'egy dínó', true, [[0, 9], [1, 6.5], [3, 5], [5.5, 5], [6.5, 2.5], [7.5, 0.5], [9.5, 0.8], [10, 2], [8.5, 2.8], [8, 5.5], [8.5, 8], [7.8, 10], [7, 8], [5.5, 8.2], [5, 10], [4, 8], [2, 8.6]]],
  ['mozdony', 5, '🚂', 'egy mozdony', true, [[0, 9], [0, 4], [1, 4], [1, 1.8], [0, 1.8], [0, 0.3], [3, 0.3], [3, 1.8], [2, 1.8], [2, 4], [5, 4], [5, 1], [9, 1], [9, 4], [10, 4], [10, 9]]],
];

// --- sablonok ---
const traceItem = (x, extra = {}) => ({ type: 'trace', strokes: x.strokes, free: true, tol: x.tol, say: x.say, prompt: 'Kövesd a pöttyöket! ✏️', ...extra });
const writeItem = x => ({ type: 'trace', strokes: compose(x.text), free: false, tol: 0.17, say: x.say, text: x.text, pic: x.pic, useName: x.useName,
  prompt: x.pic ? `${x.pic} Írd át! ✏️` : 'Írd át! ✏️' });
const fromLines = skill => ({ ...S, id: skill, skill,
  targets: () => LINES.filter(l => l.skill === skill).map(({ key, level }) => ({ key, level })),
  make: t => traceItem(LINES.find(l => l.skill === skill && l.key === t.key)),
  solve: item => item.strokes });
const fromWrite = skill => ({ ...S, id: skill, skill,
  targets: () => WRITE.filter(w => w.skill === skill).map(({ key, level }) => ({ key, level })),
  make: t => writeItem(WRITE.find(w => w.skill === skill && w.key === t.key)),
  solve: item => compose(item.text) });

export const CERUZA = [
  fromLines('ceruza.egyenes'), fromLines('ceruza.ives'), fromLines('ceruza.tores'), fromLines('ceruza.forma'),
  fromWrite('ceruza.szam'), fromWrite('ceruza.betu'), fromWrite('ceruza.szo'),
  { ...S, id: 'ceruza.ut', skill: 'ceruza.ut', icon: '🌀',
    targets: mazeTargets,
    make: t => ({ type: 'maze', w: t.w, h: t.h, rows: t.rows, start: [0, 0], goal: [t.w - 1, t.h - 1], prompt: 'Vezesd a cicát a csillaghoz! 🐱',
      say: t.level === 1 ? 'Vezesd a cicát az úton a csillaghoz! A falon nem lehet átmenni.' : 'Vezesd a cicát a csillaghoz! Keresd meg az utat.' }),
    solve: item => solveMaze(item.rows, item.start, item.goal).path },
  { ...S, id: 'ceruza.pottyok', skill: 'ceruza.pottyok', icon: '🔢',
    targets: () => DOTS.map(([key, level]) => ({ key, level })),
    make: t => { const [, , pic, name, closed, dots] = DOTS.find(d => d[0] === t.key);
      return { type: 'dots', dots, closed, pic, name, prompt: 'Kösd össze a pöttyöket sorban! 🔢', say: 'Kösd össze a pöttyöket sorban, az egyestől! Mi lesz belőle?' }; },
    solve: item => item.dots.map((_, i) => i) },
];
