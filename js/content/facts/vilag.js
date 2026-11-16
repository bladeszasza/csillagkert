// Világunk – foglalkozások, helyek a városban, évszakok, napszakok, a hét napjai és a hónapok, időjárás és öltözet,
// járművek, közlekedés, a természet és az ünnepek. Ahol nincs jó emoji (évszak, napszak, naptár, lámpa), saját,
// egyszerű rajz van: ugyanaz a fa négy évszakban, ugyanaz a táj négy napszakban, egy naptárlap a kiemelt nappal.
// A szülő a táblákat előre jóváhagyta (lásd ../approved.js); a lista: tests/tenyek.html?st=vilag.
import { Q, pics, nums, factTemplates } from './kit.js';

// --- saját rajzok (64 × 64, emoji-méretben) ---
const INK = '#4a3a7a';
const svg = inner => `<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true">${inner}</svg>`;
const frame = fill => `<rect x="2" y="2" width="60" height="60" rx="10" fill="${fill}"/>`;
const ground = fill => `<path d="M2 50h60v2a10 10 0 0 1-10 10H12A10 10 0 0 1 2 52z" fill="${fill}"/>`;
const dots = (list, r, fill) => list.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
const crown = c => `<circle cx="32" cy="25" r="15" fill="${c}"/><circle cx="20" cy="31" r="9" fill="${c}"/><circle cx="44" cy="31" r="9" fill="${c}"/>`;
const trunk = '<path d="M29 51V33h6v18z" fill="#9a6a3a"/>';
// ugyanaz a fa a négy évszakban
const SEASON = {
  tavasz: frame('#e6f6ff') + ground('#9fdc8c') + trunk + crown('#a8e6a1') + dots([[26, 18], [37, 17], [31, 27], [21, 31], [43, 30], [39, 24], [24, 25]], 2.6, '#ff8fc8'),
  nyár: frame('#bfe8ff') + `<circle cx="52" cy="12" r="6.5" fill="#ffd23f"/>` + ground('#6fca5e') + trunk + crown('#43b552'),
  ősz: frame('#fff1dc') + ground('#e8c27a') + trunk + crown('#ffa14a') + dots([[27, 20], [38, 27], [22, 32]], 2.4, '#e8572a')
    + `<ellipse cx="13" cy="44" rx="3.2" ry="1.8" fill="#e8572a" transform="rotate(30 13 44)"/><ellipse cx="50" cy="40" rx="3.2" ry="1.8" fill="#ffb020" transform="rotate(-25 50 40)"/><ellipse cx="45" cy="54" rx="3.2" ry="1.8" fill="#e8572a"/>`,
  tél: frame('#dfe9f8') + ground('#ffffff') + trunk
    + `<path d="M32 36L21 23M32 33L43 21M32 31V13M26 29l-6-1M38 27l6-3" stroke="#9a6a3a" stroke-width="3" stroke-linecap="round" fill="none"/>`
    + dots([[10, 12], [20, 8], [50, 10], [56, 24], [12, 30], [52, 38], [8, 44]], 1.8, '#ffffff') + dots([[21, 22], [43, 20], [32, 12]], 2.2, '#ffffff'),
};
// ugyanaz a táj a négy napszakban (a reggel világos és balra kel a nap, az este lilás, jobbra megy le, és feljön az első csillag)
const hills = c => `<path d="M2 47q15-9 30 0t30 0v5a10 10 0 0 1-10 10H12A10 10 0 0 1 2 52z" fill="${c}"/>`;
const DAYPART = {
  reggel: frame('#ffe3b8') + `<circle cx="17" cy="45" r="8" fill="#ffb347"/>` + hills('#86d374'),
  dél: frame('#9fd8ff') + `<circle cx="32" cy="15" r="8" fill="#ffd23f"/>` + hills('#6fca5e'),
  este: frame('#b58cf0') + `<circle cx="47" cy="46" r="8" fill="#ff7a45"/>` + dots([[14, 14]], 1.6, '#fff6c2') + hills('#5d9e6a'),
  éjszaka: frame('#2e2c6e') + `<circle cx="42" cy="19" r="9" fill="#fff6c2"/><circle cx="46" cy="16" r="8" fill="#2e2c6e"/>`
    + dots([[12, 12], [22, 22], [16, 32], [52, 34], [30, 9], [56, 10]], 1.5, '#fff6c2') + hills('#3f6b4f'),
};
// naptárlap: n cella, a k-adik kiemelve (a hét napjainál a hétvége zöldes)
const calendar = (n, k, cols, weekend = []) => {
  const rows = Math.ceil(n / cols), cw = 52 / cols, ch = rows > 1 ? 9 : 13, top = rows > 1 ? 23 : 30;
  let g = `<rect x="4" y="10" width="56" height="48" rx="6" fill="#fff" stroke="${INK}" stroke-width="2.5"/><path d="M4 16a6 6 0 0 1 6-6h44a6 6 0 0 1 6 6v4H4z" fill="#ff8fb8"/>`
    + `<rect x="17" y="5" width="4" height="10" rx="2" fill="${INK}"/><rect x="43" y="5" width="4" height="10" rx="2" fill="${INK}"/>`;
  for (let i = 0; i < n; i++) {
    const x = 6 + (i % cols) * cw, y = top + Math.floor(i / cols) * (ch + 2.5);
    g += `<rect x="${(x + 0.6).toFixed(1)}" y="${y}" width="${(cw - 1.2).toFixed(1)}" height="${ch}" rx="1.6" fill="${i === k - 1 ? '#ff5c8a' : weekend.includes(i + 1) ? '#bfeec4' : '#e6e0f2'}"/>`;
  }
  return svg(g);
};
// közlekedési lámpa (három fény) és gyalogos lámpa (piros álló és zöld sétáló emberke)
const LAMP = ['#ff4d4d', '#ffcf3f', '#4cd964'], OFF = '#5d5770';
const lamp = lit => svg(`<rect x="20" y="3" width="24" height="58" rx="8" fill="#3b3550"/>` + LAMP.map((c, i) => `<circle cx="32" cy="${15 + i * 17}" r="6.8" fill="${i === lit ? c : OFF}"/>`).join(''));
const walker = green => {
  const st = c => `stroke="${c}" stroke-width="2.6" stroke-linecap="round" fill="none"`, red = green ? OFF : LAMP[0], grn = green ? LAMP[2] : OFF;
  return svg(`<rect x="18" y="3" width="28" height="58" rx="7" fill="#3b3550"/>`
    + `<circle cx="32" cy="12" r="3.2" fill="${red}"/><path d="M32 16v10M32 26l-3.5 5.5M32 26l3.5 5.5M27 19.5h10" ${st(red)}/>`
    + `<circle cx="33.5" cy="38" r="3.2" fill="${grn}"/><path d="M32.5 42l-1.5 8M31 50l-4.5 6M31 50l4.5 6M27 46l4-3 5 2" ${st(grn)}/>`);
};

const DAYS = ['hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat', 'vasárnap'];
const NTH = ['első', 'második', 'harmadik', 'negyedik', 'ötödik', 'hatodik', 'hetedik', 'nyolcadik', 'kilencedik', 'tizedik', 'tizenegyedik', 'tizenkettedik'];
const MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];

const banks = {
  fogl: pics([
    ['🧑‍🚒', 'tűzoltó', 'Ez a tűzoltó. Ő oltja el a tüzet.'], ['🧑‍⚕️', 'orvos', 'Ez az orvos. Ő gyógyítja meg a betegeket.'],
    ['🧑‍🍳', 'szakács', 'Ez a szakács. Ő főz az étteremben.'], ['🧑‍🏫', 'tanító', 'Ez a tanító. Ő tanít az iskolában.'],
    ['👮', 'rendőr', 'Ez a rendőr. Ő vigyáz a rendre.'], ['🧑‍🌾', 'gazda', 'Ez a gazda. Ő gondozza a földet és az állatokat.'],
    ['🧑‍🔧', 'szerelő', 'Ez a szerelő. Ő javítja meg, ami elromlott.'], ['🧑‍🎨', 'festő', 'Ez a festő. Ő fest képeket.'],
    ['🧑‍✈️', 'pilóta', 'Ez a pilóta. Ő vezeti a repülőt.'], ['🧑‍🚀', 'űrhajós', 'Ez az űrhajós. Ő az űrbe repül.'],
    ['👷', 'kőműves', 'Ez a kőműves. Ő házat épít.'], ['🧑‍🎤', 'énekes', 'Ez az énekes. Ő énekel a színpadon.'],
    ['💃', 'táncos', 'Ez a táncos. Ő táncol a zenére.'],
  ]),
  hely: pics([
    ['🏥', 'kórház', 'Ez a kórház. Itt gyógyítják a betegeket.'], ['🏫', 'iskola', 'Ez az iskola. Itt tanulnak a nagyobb gyerekek.'],
    ['🏪', 'bolt', 'Ez a bolt. Itt vásárolunk.'], ['🎭', 'színház', 'Ez a színház. Itt előadást nézünk.'],
    ['🎪', 'cirkusz', 'Ez a cirkusz. Itt bohócok lépnek fel.'], ['🚉', 'állomás', 'Ez az állomás. Itt szállunk vonatra.'],
    ['🏛️', 'múzeum', 'Ez a múzeum. Itt régi dolgokat nézünk.'], ['🏖️', 'strand', 'Ez a strand. Itt fürdünk nyáron.'],
    ['📚', 'könyvtár', 'Ez a könyvtár. Innen könyvet kölcsönzünk.'], ['🏟️', 'stadion', 'Ez a stadion. Itt focimeccset nézünk.'],
    ['🛫', 'repülőtér', 'Ez a repülőtér. Innen indulnak a repülők.'], ['🎡', 'vidámpark', 'Ez a vidámpark. Itt óriáskerekezünk.'],
    ['🏨', 'szálloda', 'Ez a szálloda. Itt alszunk, ha utazunk.'], ['🏤', 'posta', 'Ez a posta. Itt levelet adunk fel.'],
  ]),
  evszak: pics([
    [svg(SEASON.tavasz), 'tavasz', 'Ez a tavasz. Kivirágzanak a fák.'], [svg(SEASON.nyár), 'nyár', 'Ez a nyár. Meleg van, süt a nap.'],
    [svg(SEASON.ősz), 'ősz', 'Ez az ősz. Lehullanak a falevelek.'], [svg(SEASON.tél), 'tél', 'Ez a tél. Hideg van, és esik a hó.'],
  ]),
  napszak: pics([
    [svg(DAYPART.reggel), 'reggel', 'Ez a reggel. Felkel a nap.'], [svg(DAYPART.dél), 'dél', 'Ez a dél. Magasan süt a nap.'],
    [svg(DAYPART.este), 'este', 'Ez az este. Lemegy a nap.'], [svg(DAYPART.éjszaka), 'éjszaka', 'Ez az éjszaka. Sötét van, és látszanak a csillagok.'],
  ]),
  het: pics(DAYS.map((d, i) => [calendar(7, i + 1, 7, [6, 7]), d, i === 6 ? 'Ez a vasárnap, a hét utolsó napja.' : `Ez a ${d}, a hét ${NTH[i]} napja.`])),
  honap: pics(MONTHS.map((m, i) => [calendar(12, i + 1, 4), m, i === 11 ? 'Ez a december, az év utolsó hónapja.' : `Ez ${/^[aáeéiíoóöőuúüű]/.test(m) ? 'az' : 'a'} ${m}, az év ${NTH[i]} hónapja.`])),
  szam: nums([2, 4, 5, 7, 12]),
  ido: pics([
    ['☀️', 'napsütés', 'Ez a napsütés. Ilyenkor meleg van.'], ['🌧️', 'eső', 'Ez az eső. Ilyenkor esernyő kell.'],
    ['🌨️', 'hóesés', 'Ez a hóesés. Ilyenkor hideg van.'], ['☁️', 'felhő', 'Ez a felhő. Belőle esik az eső.'],
    ['⛈️', 'vihar', 'Ez a vihar. Ilyenkor villámlik és dörög.'], ['🌈', 'szivárvány', 'Ez a szivárvány. Eső után jelenik meg.'],
    ['🌫️', 'köd', 'Ez a köd. Ilyenkor nem látunk messzire.'], ['💨', 'szél', 'Ez a szél. Ilyenkor hajladoznak a fák.'],
  ]),
  visel: pics([
    ['☂️', 'esernyő', 'Ez az esernyő. Eső ellen véd.'], ['🕶️', 'napszemüveg', 'Ez a napszemüveg. A szemünket védi a napfénytől.'],
    ['👒', 'kalap', 'Ez a kalap. A fejünket védi a napon.'], ['🧴', 'naptej', 'Ez a naptej. A bőrünket védi a napon.'],
    ['🧤', 'kesztyű', 'Ez a kesztyű. A kezünket melegíti.'], ['🧣', 'sál', 'Ez a sál. A nyakunkat melegíti.'],
    ['👢', 'csizma', 'Ez a csizma. Pocsolyában és hóban is jó.'], ['🧥', 'kabát', 'Ez a kabát. Hidegben melegít.'],
    ['🩳', 'rövidnadrág', 'Ez a rövidnadrág. Nyáron hordjuk.'], ['🩴', 'papucs', 'Ez a papucs. A strandon hordjuk.'],
    ['🩱', 'fürdőruha', 'Ez a fürdőruha. Úszáshoz vesszük fel.'], ['🧢', 'sapka', 'Ez a sapka. A fejünkre húzzuk.'],
  ]),
  jarmu: pics([
    ['🚗', 'autó'], ['🚌', 'busz'], ['🚲', 'bicikli', 'Ez a bicikli. A lábunkkal tekerjük.'], ['✈️', 'repülő', 'Ez a repülő. A felhők fölött repül.'],
    ['🚂', 'vonat', 'Ez a vonat. Síneken jár.'], ['🚢', 'hajó', 'Ez a hajó. A vízen úszik.'], ['🚁', 'helikopter'], ['🚜', 'traktor'],
    ['🚀', 'rakéta', 'Ez a rakéta. Az űrbe repül.'], ['🚒', 'tűzoltóautó'], ['🚑', 'mentőautó'], ['🚓', 'rendőrautó'],
    ['🛴', 'roller'], ['🚋', 'villamos'], ['🚚', 'teherautó'], ['⛵', 'vitorlás', 'Ez a vitorlás. A szél hajtja.'], ['🏍️', 'motor'],
  ]),
  lampa: pics([
    [lamp(0), 'piros lámpa', 'Ez a piros lámpa. Ilyenkor megállunk.'], [lamp(1), 'sárga lámpa', 'Ez a sárga lámpa. Figyelj, mindjárt vált!'],
    [lamp(2), 'zöld lámpa', 'Ez a zöld lámpa. Ilyenkor lehet menni.'], [walker(false), 'piros emberke', 'Ez a piros emberke. A gyalogos ilyenkor vár.'],
    [walker(true), 'zöld emberke', 'Ez a zöld emberke. A gyalogos ilyenkor átmehet.'],
  ]),
  term: pics([
    ['🧊', 'jég', 'Ez a jég. A víz hidegben jéggé fagy.'], ['💧', 'víz', 'Ez a víz.'], ['⚡', 'villám', 'Ez a villám. Viharban cikázik.'],
    ['🌋', 'vulkán', 'Ez a vulkán. Tüzes lávát okád.'], ['🏔️', 'hegy', 'Ez a hegy. Magasra nyúlik.'], ['🏝️', 'sziget', 'Ez a sziget. Víz veszi körül.'],
    ['🌊', 'tenger', 'Ez a tenger. Sós a vize.'], ['🏜️', 'sivatag', 'Ez a sivatag. Ott alig esik eső.'], ['🌲🌳', 'erdő', 'Ez az erdő. Sok fa nő itt együtt.'],
    ['🌙', 'hold', 'Ez a Hold. Éjszaka világít.'], ['🌞', 'nap', 'Ez a Nap. Fényt és meleget ad.'], ['⭐', 'csillag', 'Ez a csillag. Éjszaka látjuk az égen.'],
    ['🌍', 'Föld', 'Ez a Föld. Ezen a bolygón élünk.'],
  ]),
  unnep: pics([
    ['🎄', 'karácsonyfa', 'Ez a karácsonyfa. Karácsonykor díszítjük fel.'], ['🎅', 'Mikulás', 'Ez a Mikulás. Csomagot hoz.'],
    ['🎂', 'torta', 'Ez a torta. A szülinapon gyertyát fújunk el rajta.'], ['🎁', 'ajándékdoboz', 'Ez az ajándékdoboz.'],
    ['🎆', 'tűzijáték', 'Ez a tűzijáték. Szilveszterkor ragyog az égen.'], ['🥚', 'tojás', 'Ez a tojás. Húsvétkor megfestjük.'],
    ['🦸', 'jelmez', 'Ez a jelmez. Farsangkor ilyenbe öltözünk.'], ['🎈', 'lufi', 'Ez a lufi. A zsúron felfújjuk.'],
    ['🍩', 'fánk', 'Ez a fánk. Farsangkor esszük.'], ['🐰', 'nyuszi', 'Ez a nyuszi. A mesében ő hozza a húsvéti tojást.'],
    ['🌸', 'virág', 'Ez a virág.'],
  ]),
};

const skills = {
  'vilag.fogl': { name: 'Foglalkozások', hint: 'Gondold végig: ki szokta ezt csinálni?' },
  'vilag.hely': { name: 'Helyek a városban', hint: 'Hova mennél, ha ezt szeretnéd csinálni?' },
  'vilag.evszak': { name: 'Évszakok', hint: 'Gondolj a fákra és az időjárásra: mikor van ilyen?' },
  'vilag.napszak': { name: 'Napszakok', hint: 'Gondolj végig egy napot reggeltől estig!' },
  'vilag.naptar': { name: 'A hét napjai és a hónapok', hint: 'Mondd el sorban, és figyeld, melyik jön utána!' },
  'vilag.ido': { name: 'Időjárás és öltözet', hint: 'Milyen az idő odakint? Mi kell hozzá?' },
  'vilag.jarmu': { name: 'Járművek', hint: 'Hol jár ez a jármű: úton, sínen, vízen vagy a levegőben?' },
  'vilag.kozl': { name: 'Közlekedés', hint: 'Mit mutat a lámpa? Mikor szabad menni?' },
  'vilag.term': { name: 'A természet és az ég', hint: 'Gondold végig, mit láttál már a természetben!' },
  'vilag.unnep': { name: 'Ünnepek és szokások', hint: 'Mit szoktunk csinálni ezen az ünnepen?' },
};

const F = (id, sk, lv, f, ...q) => ({ id, sk, lv, f, q });
const O = 'vilag.fogl', H = 'vilag.hely', E = 'vilag.evszak', N = 'vilag.napszak', C = 'vilag.naptar', I = 'vilag.ido', J = 'vilag.jarmu', K = 'vilag.kozl', T = 'vilag.term', U = 'vilag.unnep';
const TOOL = 'Ki használja ezt?';

const facts = [
  // ===== Foglalkozások
  F('tuzolto', O, 1, 'A tűzoltó oltja el a tüzet.', Q('Ki oltja el a tüzet?', 'fogl', 'tűzoltó'), Q(TOOL, 'fogl', 'tűzoltó', { show: '🚒', lv: 2 })),
  F('orvos', O, 1, 'Az orvos meggyógyítja a betegeket.', Q('Kihez megyünk, ha betegek vagyunk?', 'fogl', 'orvos'), Q(TOOL, 'fogl', 'orvos', { show: '🩺', lv: 2 })),
  F('szakacs', O, 1, 'A szakács főzi az ételt az étteremben.', Q('Ki főz az étteremben?', 'fogl', 'szakács'), Q(TOOL, 'fogl', 'szakács', { show: '🍳', lv: 2 })),
  F('tanito', O, 2, 'A tanító az iskolában tanít írni és olvasni.', Q('Ki tanít meg írni és olvasni?', 'fogl', 'tanító')),
  F('rendor', O, 1, 'A rendőr vigyáz a rendre és a közlekedésre.', Q('Ki vigyáz a rendre az utcán?', 'fogl', 'rendőr'), Q(TOOL, 'fogl', 'rendőr', { show: '🚓', lv: 2 })),
  F('gazda', O, 1, 'A gazda gondozza a földet és az állatokat.', Q('Ki gondozza a tanyán az állatokat?', 'fogl', 'gazda'), Q(TOOL, 'fogl', 'gazda', { show: '🚜', lv: 2 })),
  F('szerelo', O, 2, 'A szerelő megjavítja az elromlott autót.', Q('Ki javítja meg az elromlott autót?', 'fogl', 'szerelő'), Q(TOOL, 'fogl', 'szerelő', { show: '🔧', lv: 3 })),
  F('festo', O, 1, 'A festő ecsettel szép képeket fest.', Q('Ki fest képet ecsettel?', 'fogl', 'festő'), Q(TOOL, 'fogl', 'festő', { show: '🎨', lv: 2 })),
  F('pilota', O, 1, 'A pilóta vezeti a repülőgépet.', Q('Ki vezeti a repülőt?', 'fogl', 'pilóta'), Q(TOOL, 'fogl', 'pilóta', { show: '✈️', lv: 2 })),
  F('urhajos', O, 2, 'Az űrhajós rakétával repül az űrbe.', Q('Ki repül az űrbe?', 'fogl', 'űrhajós'), Q(TOOL, 'fogl', 'űrhajós', { show: '🚀', lv: 3 })),
  F('komuves', O, 2, 'A kőműves téglából házat épít.', Q('Ki épít házat téglából?', 'fogl', 'kőműves'), Q(TOOL, 'fogl', 'kőműves', { show: '🧱', lv: 3 })),
  F('enekes', O, 1, 'Az énekes a színpadon énekel.', Q('Ki énekel a színpadon?', 'fogl', 'énekes', { x: ['táncos'] }), Q(TOOL, 'fogl', 'énekes', { show: '🎤', lv: 2 })),
  F('tancos', O, 2, 'A táncos zenére táncol.', Q('Ki táncol a színpadon?', 'fogl', 'táncos', { x: ['énekes'] }), Q(TOOL, 'fogl', 'táncos', { show: '🩰', lv: 3 })),
  F('letra', O, 3, 'Ha a cica fennakad a fán, a tűzoltók létrával segítenek.', Q('Ki segít létrával, ha a cica fennakad a fán?', 'fogl', 'tűzoltó', { x: ['kőműves', 'festő'] })),
  F('eltevedt', O, 3, 'Ha eltévedünk az utcán, a rendőr is segít.', Q('Kitől kérhetünk segítséget, ha eltévedtünk az utcán?', 'fogl', 'rendőr')),
  F('fejes', O, 2, 'A gazda megfeji a tehenet.', Q('Ki feji meg a tehenet?', 'fogl', 'gazda')),
  F('sapka', O, 3, 'A szakács magas fehér sapkát visel.', Q('Kinek van magas fehér sapkája?', 'fogl', 'szakács')),
  F('holdon', O, 4, 'Az űrhajósok már a Holdon is jártak.', Q('Ki járt már a Holdon?', 'fogl', 'űrhajós')),
  F('sisak', O, 3, 'A kőműves sisakot hord, hogy ne sérüljön meg.', Q('Ki hord sisakot az építkezésen?', 'fogl', 'kőműves')),
  F('tuzoltoauto-ul', O, 3, 'A tűzoltók tűzoltóautóval sietnek a tűzhöz.', Q('Kik ülnek a tűzoltóautóban?', 'fogl', 'tűzoltó')),
  F('meghallgat', O, 3, 'Az orvos meghallgatja, hogyan dobog a szívünk.', Q('Ki hallgatja meg a szívünk dobogását?', 'fogl', 'orvos')),
  F('lecke', O, 4, 'Az iskolában a tanító ad feladatot a gyerekeknek.', Q('Ki ad feladatot a gyerekeknek az iskolában?', 'fogl', 'tanító')),
  F('vet', O, 4, 'Tavasszal a gazda elveti a magokat a földbe.', Q('Ki veti el tavasszal a magokat a földbe?', 'fogl', 'gazda')),
  F('bicikli', O, 4, 'A szerelő a lyukas biciklikereket is megfoltozza.', Q('Ki foltozza meg a lyukas biciklikereket?', 'fogl', 'szerelő')),
  F('festek', O, 5, 'A festő sokféle színt kever ki a festékekből.', Q('Ki kever ki sokféle színt a festékekből?', 'fogl', 'festő')),
  F('kapitany', O, 5, 'A pilóta a repülőből beszél az utasokhoz.', Q('Ki beszél az utasokhoz a repülőgép elejéből?', 'fogl', 'pilóta')),

  // ===== Helyek a városban
  F('korhaz', H, 2, 'A kórházban gyógyítják a nagyon beteg embereket.', Q('Hova visz a mentőautó?', 'hely', 'kórház'), Q('Hol dolgozik az orvos?', 'hely', 'kórház', { lv: 2 })),
  F('iskola', H, 1, 'Az iskolában tanulnak a nagyobb gyerekek.', Q('Hova járnak a nagyobb gyerekek tanulni?', 'hely', 'iskola', { x: ['könyvtár'] }), Q('Hol dolgozik a tanító?', 'hely', 'iskola', { lv: 2 })),
  F('bolt', H, 1, 'A boltban vásárolunk kenyeret és tejet.', Q('Hol vásárolunk kenyeret?', 'hely', 'bolt')),
  F('szinhaz', H, 2, 'A színházban előadást nézünk.', Q('Hol nézünk mesés előadást a színpadon?', 'hely', 'színház', { x: ['cirkusz'] }), Q('Hol lép fel a táncos?', 'hely', 'színház', { x: ['cirkusz'], lv: 3 })),
  F('cirkusz', H, 2, 'A cirkuszban bohócok és artisták lépnek fel.', Q('Hol látunk bohócot és zsonglőrt?', 'hely', 'cirkusz', { x: ['színház', 'vidámpark'] })),
  F('allomas', H, 2, 'Az állomáson szállunk fel a vonatra.', Q('Hol szállunk fel a vonatra?', 'hely', 'állomás')),
  F('muzeum', H, 3, 'A múzeumban régi és érdekes dolgokat nézünk meg.', Q('Hol nézünk meg régi és érdekes tárgyakat?', 'hely', 'múzeum')),
  F('strand', H, 1, 'Nyáron a strandon fürdünk.', Q('Hol fürdünk nyáron?', 'hely', 'strand')),
  F('konyvtar', H, 3, 'A könyvtárból könyvet kölcsönzünk, aztán visszavisszük.', Q('Honnan kölcsönzünk könyvet?', 'hely', 'könyvtár')),
  F('stadion', H, 2, 'A stadionban focimeccset nézünk.', Q('Hol nézünk focimeccset?', 'hely', 'stadion')),
  F('repuloter', H, 2, 'A repülőtéren szállunk fel a repülőre.', Q('Hol szállunk fel a repülőre?', 'hely', 'repülőtér')),
  F('vidampark', H, 2, 'A vidámparkban óriáskerékre is ülhetünk.', Q('Hol ülhetünk óriáskerékre?', 'hely', 'vidámpark')),
  F('szalloda', H, 3, 'Ha messzire utazunk, szállodában is alhatunk.', Q('Hol alszunk, ha messzire utazunk nyaralni?', 'hely', 'szálloda')),
  F('posta', H, 3, 'A postán levelet és csomagot adunk fel.', Q('Hol adunk fel levelet a nagymamának?', 'hely', 'posta')),
  F('kepeslap', H, 4, 'A postás hozza el a képeslapot a postáról.', Q('Honnan indul útnak a képeslap?', 'hely', 'posta')),
  F('dino', H, 4, 'A múzeumban dinoszaurusz-csontvázat is láthatunk.', Q('Hol láthatunk dinoszaurusz-csontvázat?', 'hely', 'múzeum')),
  F('jegy', H, 4, 'A vonatjegyet az állomáson vesszük meg.', Q('Hol vesszük meg a vonatjegyet?', 'hely', 'állomás')),
  F('porond', H, 5, 'A cirkusz porondján artisták mutatják be a trükkjeiket.', Q('Hol mutatják be az artisták a trükkjeiket a porondon?', 'hely', 'cirkusz', { x: ['színház', 'stadion'] })),

  // ===== Évszakok (ugyanaz a fa négy évszakban)
  F('kep-tavasz', E, 1, 'Tavasszal kivirágzanak a fák.', Q('Melyik képen tavasz van?', 'evszak', 'tavasz', { quiet: true }), Q('Mikor virágzanak a gyümölcsfák?', 'evszak', 'tavasz', { lv: 2 })),
  F('kep-nyar', E, 1, 'Nyáron van a legmelegebb.', Q('Melyik képen nyár van?', 'evszak', 'nyár', { quiet: true }), Q('Melyik évszakban van a legmelegebb?', 'evszak', 'nyár')),
  F('kep-osz', E, 1, 'Ősszel a falevelek megsárgulnak és lehullanak.', Q('Melyik képen ősz van?', 'evszak', 'ősz', { quiet: true }), Q('Mikor hullanak le a falevelek?', 'evszak', 'ősz')),
  F('kep-tel', E, 1, 'Télen van a leghidegebb.', Q('Melyik képen tél van?', 'evszak', 'tél', { quiet: true }), Q('Melyik évszakban van a leghidegebb?', 'evszak', 'tél')),
  F('ho', E, 1, 'Télen esik a hó.', Q('Melyik évszakban esik a hó?', 'evszak', 'tél')),
  F('hoember', E, 1, 'Télen hóembert építünk.', Q('Mikor építünk hóembert?', 'evszak', 'tél')),
  F('szanko', E, 2, 'Télen szánkózunk a havas dombon.', Q('Mikor szánkózunk?', 'evszak', 'tél')),
  F('strand-nyar', E, 1, 'Nyáron fürdünk a strandon.', Q('Mikor fürdünk a strandon?', 'evszak', 'nyár')),
  F('szuret', E, 3, 'Ősszel szedik le a szőlőt.', Q('Mikor szedik le a szőlőt?', 'evszak', 'ősz', { x: ['nyár'] })),
  F('gesztenye', E, 2, 'Ősszel gesztenyét gyűjtünk.', Q('Mikor gyűjtünk gesztenyét?', 'evszak', 'ősz')),
  F('fecske-jon', E, 3, 'A fecskék tavasszal jönnek vissza hozzánk.', Q('Mikor jönnek vissza a fecskék?', 'evszak', 'tavasz')),
  F('fecske-megy', E, 3, 'Ősszel a fecskék melegebb helyre repülnek.', Q('Mikor repülnek el a fecskék melegebb helyre?', 'evszak', 'ősz')),
  F('iskola-kezd', E, 3, 'Az iskola ősszel kezdődik.', Q('Melyik évszakban kezdődik az iskola?', 'evszak', 'ősz')),
  F('karacsony', E, 2, 'A karácsony télen van.', Q('Melyik évszakban van karácsony?', 'evszak', 'tél')),
  F('husvet', E, 3, 'A húsvét tavasszal van.', Q('Melyik évszakban van húsvét?', 'evszak', 'tavasz')),
  F('farsang', E, 4, 'A farsang a tél végén van.', Q('Melyik évszakban van farsang?', 'evszak', 'tél', { x: ['tavasz'] })),
  F('dinnye', E, 2, 'Nyáron érik a görögdinnye.', Q('Mikor érik a görögdinnye?', 'evszak', 'nyár')),
  F('vetes', E, 2, 'Tavasszal vetjük el a magokat a kertben.', Q('Mikor vetjük el a magokat a kertben?', 'evszak', 'tavasz')),
  F('medve', E, 3, 'A medve télen alszik a barlangjában.', Q('Mikor alszik a medve a barlangjában?', 'evszak', 'tél', { x: ['ősz'] })),
  F('hovirag', E, 4, 'A hóvirág a tél végén, tavasz elején nyílik.', Q('Mikor nyílik a hóvirág?', 'evszak', 'tavasz', { x: ['tél'] })),
  F('kesztyu', E, 2, 'Télen sapkát és kesztyűt húzunk.', Q('Mikor húzunk kesztyűt és sapkát?', 'evszak', 'tél', { x: ['ősz'] })),
  F('rovid', E, 2, 'Nyáron rövidnadrágban és pólóban járunk.', Q('Mikor járunk rövidnadrágban?', 'evszak', 'nyár', { x: ['tavasz'] })),
  F('mokus', E, 2, 'Ősszel a mókus diót gyűjt télire.', Q('Mikor gyűjt a mókus diót télire?', 'evszak', 'ősz')),
  F('vilagos', E, 4, 'Nyáron este sokáig világos van.', Q('Mikor van este sokáig világos?', 'evszak', 'nyár')),
  F('sotet', E, 4, 'Télen sötétedik a legkorábban.', Q('Mikor sötétedik a legkorábban?', 'evszak', 'tél', { x: ['ősz'] })),
  F('utan-tel', E, 3, 'A tél után jön a tavasz.', Q('Melyik évszak jön a tél után?', 'evszak', 'tavasz'), Q('Melyik évszak van a tavasz előtt?', 'evszak', 'tél', { lv: 4 })),
  F('utan-tavasz', E, 3, 'A tavasz után jön a nyár.', Q('Melyik évszak jön a tavasz után?', 'evszak', 'nyár'), Q('Melyik évszak van a nyár előtt?', 'evszak', 'tavasz', { lv: 4 })),
  F('utan-nyar', E, 3, 'A nyár után jön az ősz.', Q('Melyik évszak jön a nyár után?', 'evszak', 'ősz'), Q('Melyik évszak van az ősz előtt?', 'evszak', 'nyár', { lv: 4 })),
  F('utan-osz', E, 3, 'Az ősz után jön a tél.', Q('Melyik évszak jön az ősz után?', 'evszak', 'tél'), Q('Melyik évszak van a tél előtt?', 'evszak', 'ősz', { lv: 4 })),
  F('negy', E, 3, 'Egy évben négy évszak van.', Q('Hány évszak van egy évben?', 'szam', 'négy')),
  F('rugy', E, 5, 'Tavasszal a fák ágain kipattannak a rügyek.', Q('Mikor pattannak ki a rügyek a fák ágain?', 'evszak', 'tavasz')),
  F('tok', E, 5, 'Ősszel érik a sütőtök.', Q('Mikor érik a sütőtök?', 'evszak', 'ősz')),

  // ===== Napszakok (ugyanaz a táj négy napszakban)
  F('kep-reggel', N, 1, 'Reggel felkel a nap.', Q('Melyik képen reggel van?', 'napszak', 'reggel', { quiet: true }), Q('Mikor kel fel a nap?', 'napszak', 'reggel', { lv: 2 })),
  F('kep-del', N, 2, 'Délben jár a legmagasabban a nap.', Q('Melyik képen dél van?', 'napszak', 'dél', { quiet: true }), Q('Mikor jár a nap a legmagasabban az égen?', 'napszak', 'dél', { lv: 3 })),
  F('kep-este', N, 1, 'Este lemegy a nap.', Q('Melyik képen este van?', 'napszak', 'este', { quiet: true }), Q('Mikor megy le a nap?', 'napszak', 'este', { lv: 2 })),
  F('kep-ejszaka', N, 1, 'Éjszaka sötét van, és látszanak a csillagok.', Q('Melyik képen éjszaka van?', 'napszak', 'éjszaka', { quiet: true }), Q('Mikor látjuk a csillagokat?', 'napszak', 'éjszaka', { x: ['este'] })),
  F('reggeli', N, 1, 'Reggel reggelizünk.', Q('Mikor reggelizünk?', 'napszak', 'reggel')),
  F('ebed', N, 1, 'Délben ebédelünk.', Q('Mikor ebédelünk?', 'napszak', 'dél')),
  F('vacsora', N, 1, 'Este vacsorázunk.', Q('Mikor vacsorázunk?', 'napszak', 'este')),
  F('alvas', N, 1, 'Éjszaka alszunk.', Q('Mikor alszunk az ágyunkban?', 'napszak', 'éjszaka', { x: ['este'] })),
  F('ovi', N, 1, 'Reggel indulunk az óvodába.', Q('Mikor indulunk az óvodába?', 'napszak', 'reggel')),
  F('ebredes', N, 1, 'Reggel ébredünk fel.', Q('Mikor ébredünk fel?', 'napszak', 'reggel')),
  F('mese', N, 1, 'Este, lefekvés előtt mesét hallgatunk.', Q('Mikor hallgatunk esti mesét?', 'napszak', 'este', { x: ['éjszaka'] })),
  F('fogmosas', N, 2, 'Este lefekvés előtt fogat mosunk.', Q('Mikor mosunk fogat lefekvés előtt?', 'napszak', 'este', { x: ['éjszaka'] })),
  F('bagoly', N, 2, 'A bagoly éjszaka vadászik.', Q('Mikor vadászik a bagoly?', 'napszak', 'éjszaka', { x: ['este'] })),
  F('kakas', N, 2, 'A kakas reggel kukorékol.', Q('Mikor kukorékol a kakas?', 'napszak', 'reggel')),
  F('holdfeny', N, 2, 'Éjszaka a Hold világít az égen.', Q('Mikor világít a Hold az égen?', 'napszak', 'éjszaka', { x: ['este'] })),
  F('utan-reggel', N, 3, 'A reggel után jön a dél.', Q('Mi jön a reggel után?', 'napszak', 'dél')),
  F('utan-este', N, 3, 'Az este után jön az éjszaka.', Q('Mi jön az este után?', 'napszak', 'éjszaka')),
  F('utan-ejszaka', N, 3, 'Az éjszaka után újra reggel lesz.', Q('Mi jön az éjszaka után?', 'napszak', 'reggel')),
  F('arnyek', N, 4, 'Délben a legrövidebb az árnyékunk.', Q('Mikor a legrövidebb az árnyékunk?', 'napszak', 'dél')),
  F('harmat', N, 4, 'Reggel harmatcseppek csillognak a füvön.', Q('Mikor csillog harmat a füvön?', 'napszak', 'reggel')),
  F('denever', N, 5, 'A denevér nappal alszik, és éjszaka repül.', Q('Mikor repül a denevér?', 'napszak', 'éjszaka', { x: ['este'] })),

  // ===== A hét napjai és a hónapok (naptárlap, a kiemelt nappal)
  ...DAYS.slice(0, 6).map((d, i) => F(`nap-${i + 1}`, C, 3, `${d[0].toUpperCase() + d.slice(1)} után ${DAYS[i + 1]} jön.`,
    Q(`Melyik nap jön ${d} után?`, 'het', DAYS[i + 1]), Q(`Melyik nap van ${DAYS[i + 1]} előtt?`, 'het', d, { lv: 4 }))),
  F('elso-nap', C, 3, 'A hét első napja a hétfő.', Q('Melyik a hét első napja?', 'het', 'hétfő')),
  F('utolso-nap', C, 3, 'A hét utolsó napja a vasárnap.', Q('Melyik a hét utolsó napja?', 'het', 'vasárnap')),
  F('hetvege', C, 2, 'A szombat és a vasárnap a hétvége.', Q('Melyik nap van hétvégén?', 'het', ['szombat', 'vasárnap'])),
  F('kozep', C, 4, 'A szerda a hét közepén van.', Q('Melyik nap van a hét közepén?', 'het', 'szerda')),
  F('het-nap', C, 2, 'Egy héten hét nap van.', Q('Hány nap van egy héten?', 'szam', 'hét')),
  F('hetvege-ket', C, 3, 'A hétvége két napból áll.', Q('Hány napból áll a hétvége?', 'szam', 'kettő')),
  F('ovi-napok', C, 4, 'Hétfőtől péntekig öt napot járunk óvodába.', Q('Hány napot járunk óvodába egy héten?', 'szam', 'öt')),
  F('elso-honap', C, 4, 'Az év első hónapja a január.', Q('Melyik az év első hónapja?', 'honap', 'január')),
  F('december', C, 4, 'Az év utolsó hónapja a december, ekkor van karácsony.', Q('Melyik az év utolsó hónapja?', 'honap', 'december'), Q('Melyik hónapban van karácsony?', 'honap', 'december', { lv: 4 })),
  F('honap-szam', C, 4, 'Egy évben tizenkét hónap van.', Q('Hány hónap van egy évben?', 'szam', 'tizenkettő')),
  F('szeptember', C, 5, 'Szeptemberben kezdődik az iskola.', Q('Melyik hónapban kezdődik az iskola?', 'honap', 'szeptember')),
  ...MONTHS.slice(0, 11).map((m, i) => F(`honap-${i + 1}`, C, 5, `${m[0].toUpperCase() + m.slice(1)} után ${MONTHS[i + 1]} jön.`, Q(`Melyik hónap jön ${m} után?`, 'honap', MONTHS[i + 1]))),

  // ===== Időjárás és öltözet
  F('eso', I, 1, 'Ha esik az eső, esernyőt viszünk.', Q('Esik az eső. Mit viszünk magunkkal?', 'visel', 'esernyő', { x: ['kabát', 'csizma'] }), Q('Mikor viszünk esernyőt?', 'ido', 'eső', { x: ['vihar', 'hóesés'] })),
  F('napszemuveg', I, 1, 'Ha erősen süt a nap, napszemüveget veszünk.', Q('Erősen süt a nap. Mit teszünk a szemünk elé?', 'visel', 'napszemüveg'), Q('Mikor hordunk napszemüveget?', 'ido', 'napsütés', { x: ['hóesés'], lv: 2 })),
  F('kalap', I, 1, 'Ha tűz a nap, kalapot teszünk a fejünkre.', Q('Tűz a nap. Mit teszünk a fejünkre?', 'visel', 'kalap', { x: ['sapka'] })),
  F('naptej', I, 2, 'A strandon naptejjel kenjük be magunkat.', Q('Mivel kenjük be magunkat a strandon?', 'visel', 'naptej')),
  F('kesztyu-ho', I, 1, 'Hóesésben kesztyűt húzunk.', Q('Esik a hó. Mit húzunk a kezünkre?', 'visel', 'kesztyű')),
  F('sal', I, 2, 'Ha hideg szél fúj, sálat kötünk a nyakunkba.', Q('Hideg szél fúj. Mit kötünk a nyakunkba?', 'visel', 'sál')),
  F('csizma', I, 2, 'Pocsolyás időben csizmát húzunk.', Q('Nagy pocsolyák vannak. Mit húzunk a lábunkra?', 'visel', 'csizma')),
  F('kabat', I, 2, 'Ha hideg van, kabátot veszünk.', Q('Hideg van odakint. Mit veszünk fel a pulóver fölé?', 'visel', 'kabát', { x: ['sál'] })),
  F('rovidnadrag', I, 1, 'Nagy melegben rövidnadrágot veszünk.', Q('Nagy meleg van. Melyik nadrágot vesszük fel?', 'visel', 'rövidnadrág')),
  F('papucs', I, 2, 'A strandon papucsban járunk.', Q('Mit húzunk a lábunkra a strandon?', 'visel', 'papucs')),
  F('furdoruha', I, 1, 'Úszáshoz fürdőruhát veszünk.', Q('Mit veszünk fel, ha úszni megyünk?', 'visel', 'fürdőruha', { x: ['rövidnadrág'] })),
  F('sapka-hideg', I, 2, 'Hidegben sapkát húzunk a fejünkre.', Q('Hideg van. Mit húzunk a fejünkre?', 'visel', 'sapka', { x: ['kalap'] })),
  F('vihar', I, 2, 'Viharban villámlik és dörög az ég.', Q('Mikor villámlik és dörög az ég?', 'ido', 'vihar', { x: ['eső'] })),
  F('szivarvany', I, 2, 'Szivárvány akkor van, ha eső után kisüt a nap.', Q('Mi jelenik meg az égen, ha eső után kisüt a nap?', 'ido', 'szivárvány')),
  F('kod', I, 3, 'Ködben nem látunk messzire.', Q('Mikor nem látunk messzire?', 'ido', 'köd', { x: ['hóesés', 'vihar'] })),
  F('szel', I, 2, 'Szélben hajladoznak a fák.', Q('Mikor hajladoznak a fák?', 'ido', 'szél', { x: ['vihar'] })),
  F('sarkany', I, 3, 'A sárkány a szélben repül magasra.', Q('Mi kell, hogy a sárkány magasra repüljön?', 'ido', 'szél', { x: ['vihar'] })),
  F('felho', I, 2, 'Az eső a felhőkből esik.', Q('Honnan esik az eső?', 'ido', 'felhő', { x: ['vihar'] })),
  F('hoember-ho', I, 2, 'Hóesés után hóembert építhetünk.', Q('Mi után építhetünk hóembert?', 'ido', 'hóesés')),
  F('pocsolya', I, 2, 'Eső után pocsolyák maradnak.', Q('Mi után maradnak pocsolyák?', 'ido', 'eső', { x: ['vihar', 'hóesés'] })),
  F('arnyek-nap', I, 4, 'Napsütésben látjuk a saját árnyékunkat.', Q('Mikor látjuk a saját árnyékunkat?', 'ido', 'napsütés', { x: ['szivárvány'] })),
  F('olvad', I, 3, 'Ha kisüt a nap, elolvad a hó.', Q('Mitől olvad el a hóember?', 'ido', 'napsütés', { x: ['eső'] })),
  F('locsol', I, 3, 'Az eső megöntözi a növényeket.', Q('Mi öntözi meg magától a kertet?', 'ido', 'eső', { x: ['vihar'] })),
  F('ruha-vihar', I, 4, 'Viharban nem állunk magas fa alá.', Q('Mikor nem állunk magas fa alá?', 'ido', 'vihar', { x: ['szél'] })),
  F('kod-felho', I, 5, 'A köd olyan, mintha egy felhő leszállt volna a földre.', Q('Melyik olyan, mint egy felhő a földön?', 'ido', 'köd', { x: ['felhő'] })),

  // ===== Járművek
  F('mento', J, 1, 'A mentőautó viszi a beteget a kórházba.', Q('Melyik autó visz a kórházba, ha baj van?', 'jarmu', 'mentőautó')),
  F('tuzoltoauto', J, 1, 'A tűzoltóautó szirénázva siet a tűzhöz.', Q('Melyik autó siet a tűzhöz?', 'jarmu', 'tűzoltóautó')),
  F('rendorauto', J, 1, 'A rendőrautóban rendőrök ülnek.', Q('Melyik autóban ülnek a rendőrök?', 'jarmu', 'rendőrautó')),
  F('traktor', J, 1, 'A gazda traktorral szántja a földet.', Q('Mivel szántja a gazda a földet?', 'jarmu', 'traktor')),
  F('hajo', J, 1, 'A hajó és a vitorlás a vízen jár.', Q('Melyik jár a vízen?', 'jarmu', ['hajó', 'vitorlás'])),
  F('repulo', J, 1, 'A repülő a felhők fölött repül.', Q('Melyik repül a felhők fölött?', 'jarmu', 'repülő', { x: ['helikopter', 'rakéta'] })),
  F('vonat', J, 2, 'A vonat síneken jár.', Q('Melyik jár síneken a városok között?', 'jarmu', 'vonat', { x: ['villamos'] })),
  F('bicikli-teker', J, 1, 'A biciklit a lábunkkal tekerjük.', Q('Melyiket tekerjük a lábunkkal?', 'jarmu', 'bicikli')),
  F('roller', J, 2, 'A rolleren egy lábon állunk, a másikkal hajtjuk.', Q('Melyiken állunk egy lábon, a másikkal hajtjuk?', 'jarmu', 'roller')),
  F('helikopter', J, 3, 'A helikopter egy helyben is tud lebegni a levegőben.', Q('Melyik tud egy helyben lebegni a levegőben?', 'jarmu', 'helikopter')),
  F('raketa', J, 1, 'A rakéta az űrbe repül.', Q('Melyik repül az űrbe?', 'jarmu', 'rakéta')),
  F('busz', J, 2, 'A buszon sok utas elfér.', Q('Melyikkel utazik sok ember egyszerre az úton?', 'jarmu', 'busz', { x: ['villamos'] })),
  F('villamos', J, 3, 'A villamos a város utcáin, síneken jár.', Q('Melyik jár síneken a város utcáin?', 'jarmu', 'villamos')),
  F('teherauto', J, 2, 'A teherautó nagy terhet szállít az úton.', Q('Melyik szállít nagy terhet az úton?', 'jarmu', 'teherautó', { x: ['traktor'] })),
  F('motor', J, 2, 'A motor két keréken gurul, és hangosan berreg.', Q('Melyik berreg hangosan két keréken?', 'jarmu', 'motor')),
  F('vitorlas', J, 3, 'A vitorlást a szél hajtja a vízen.', Q('Melyiket hajtja a szél a vízen?', 'jarmu', 'vitorlás', { x: ['hajó'] })),
  F('levego', J, 2, 'A repülő, a helikopter és a rakéta a levegőben jár.', Q('Melyik jár a levegőben?', 'jarmu', ['repülő', 'helikopter', 'rakéta'])),
  F('szarazfold', J, 3, 'Az autó, a busz és a vonat a szárazföldön jár.', Q('Melyik jár a szárazföldön?', 'jarmu', ['autó', 'busz', 'bicikli', 'vonat', 'traktor', 'tűzoltóautó', 'mentőautó', 'rendőrautó', 'roller', 'villamos', 'teherautó', 'motor'])),
  F('szirena', J, 2, 'A mentőautó, a tűzoltóautó és a rendőrautó szirénázik.', Q('Melyik szirénázik, ha siet?', 'jarmu', ['mentőautó', 'tűzoltóautó', 'rendőrautó'])),
  F('megallo', J, 1, 'A busz a buszmegállóban áll meg.', Q('Melyik áll meg a buszmegállóban?', 'jarmu', 'busz')),
  F('ket-kerek', J, 2, 'A biciklinek két kereke van.', Q('Hány kereke van a biciklinek?', 'szam', 'kettő')),
  F('negy-kerek', J, 2, 'Az autónak négy kereke van.', Q('Hány kereke van az autónak?', 'szam', 'négy')),
  F('tengeri', J, 4, 'A hajó nagyon sok utast és árut visz a tengeren.', Q('Melyik visz utasokat a tengeren?', 'jarmu', 'hajó', { x: ['vitorlás'] })),
  F('eke', J, 5, 'A traktor húzza az ekét és a pótkocsit.', Q('Melyik húzza a pótkocsit a mezőn?', 'jarmu', 'traktor', { x: ['teherautó'] })),

  // ===== Közlekedés
  F('piros', K, 1, 'Piros lámpánál megállunk.', Q('Melyik lámpánál állnak meg az autók?', 'lampa', 'piros lámpa', { x: ['sárga lámpa'] }), Q('Melyik színű lámpa van legfelül?', 'lampa', 'piros lámpa', { x: ['piros emberke'], lv: 3 })),
  F('zold', K, 1, 'Zöld lámpánál indulhatnak az autók.', Q('Melyik lámpánál indulhatnak az autók?', 'lampa', 'zöld lámpa'), Q('Melyik színű lámpa van legalul?', 'lampa', 'zöld lámpa', { x: ['zöld emberke'], lv: 3 })),
  F('sarga', K, 2, 'A sárga lámpa azt mondja: figyelj, mindjárt vált!', Q('Melyik lámpa mondja: figyelj, mindjárt vált?', 'lampa', 'sárga lámpa'), Q('Melyik színű lámpa van középen?', 'lampa', 'sárga lámpa', { lv: 3 })),
  F('emberke-piros', K, 2, 'Ha piros az emberke, a járda szélén várunk.', Q('Melyiknél várunk a járda szélén?', 'lampa', 'piros emberke', { x: ['piros lámpa', 'sárga lámpa'] })),
  F('emberke-zold', K, 2, 'Zöld emberkénél átmehetünk a zebrán.', Q('Melyiknél mehetünk át a zebrán?', 'lampa', 'zöld emberke', { x: ['zöld lámpa'] })),
  F('allo', K, 3, 'A piros emberke áll, mert ilyenkor várni kell.', Q('Melyik emberke áll egy helyben?', 'lampa', 'piros emberke')),
  F('seta', K, 3, 'A zöld emberke lépked, mert ilyenkor mehetünk.', Q('Melyik emberke lépked?', 'lampa', 'zöld emberke')),
  F('ov', K, 2, 'Az autóban mindig bekötjük a biztonsági övet.', Q('Melyikben kötjük be a biztonsági övet, mielőtt elindulunk?', 'jarmu', 'autó', { x: ['repülő', 'busz', 'teherautó', 'mentőautó', 'rendőrautó', 'tűzoltóautó', 'traktor'] })),
  F('kapaszkodo', K, 3, 'Ha állunk a buszon, kapaszkodunk.', Q('Melyiken kapaszkodunk, ha állva utazunk?', 'jarmu', 'busz', { x: ['villamos', 'vonat'] })),
  F('bukosisak', K, 2, 'Biciklizéskor bukósisakot hordunk.', Q('Melyikhez veszünk fel bukósisakot?', 'jarmu', ['bicikli', 'motor', 'roller'])),
  F('sarga-utan', K, 4, 'A sárga lámpa után piros jön.', Q('Melyik lámpa után jön a piros?', 'lampa', 'sárga lámpa')),
  F('gyalog-piros', K, 4, 'A gyalogos lámpán nincs sárga, csak piros és zöld emberke.', Q('Melyik lámpán van három színes fény?', 'lampa', ['piros lámpa', 'sárga lámpa', 'zöld lámpa'])),
  F('mento-ut', K, 5, 'Ha szirénázik a mentő, az autók félrehúzódnak.', Q('Melyik elől húzódnak félre az autók?', 'jarmu', ['mentőautó', 'tűzoltóautó', 'rendőrautó'])),

  // ===== A természet és az ég
  F('jeg', T, 1, 'A víz a fagyasztóban jéggé fagy.', Q('Mi lesz a vízből a fagyasztóban?', 'term', 'jég')),
  F('olvad-jeg', T, 2, 'A jég melegben vízzé olvad.', Q('Mi lesz a jégkockából a napon?', 'term', 'víz')),
  F('felho-viz', T, 4, 'A felhők apró vízcseppekből állnak.', Q('Miből állnak a felhők?', 'term', 'víz', { x: ['jég'] })),
  F('villam', T, 2, 'Viharban villám cikázik az égen.', Q('Mi cikázik az égen viharban?', 'term', 'villám')),
  F('vulkan', T, 2, 'A vulkán tüzes lávát okád.', Q('Melyik okád tüzes lávát?', 'term', 'vulkán')),
  F('hegy', T, 2, 'A legmagasabb hegyek csúcsa a felhők fölé ér.', Q('Melyiknek ér a csúcsa a felhők fölé?', 'term', 'hegy', { x: ['vulkán'] })),
  F('hegy-ho', T, 4, 'A magas hegyek tetején nyáron is hó van.', Q('Hol van nyáron is hó?', 'term', 'hegy', { x: ['vulkán'] })),
  F('sziget', T, 3, 'A szigetet mindenhonnan víz veszi körül.', Q('Melyiket veszi körül mindenhonnan víz?', 'term', 'sziget')),
  F('tenger', T, 3, 'A tenger vize sós.', Q('Melyiknek sós a vize?', 'term', 'tenger')),
  F('sivatag', T, 3, 'A sivatagban nagyon ritkán esik eső.', Q('Hol esik nagyon ritkán eső?', 'term', 'sivatag')),
  F('erdo', T, 1, 'Az erdőben sok fa nő együtt.', Q('Hol nő sok fa együtt?', 'term', 'erdő')),
  F('hold', T, 1, 'A Hold éjszaka világít az égen.', Q('Mi világít éjszaka az égen?', 'term', 'hold', { x: ['csillag'] })),
  F('nap', T, 1, 'A Nap fényt és meleget ad nekünk.', Q('Mi ad nekünk fényt és meleget?', 'term', 'nap', { x: ['csillag'] })),
  F('csillag', T, 2, 'Éjszaka sok-sok csillag látszik az égen.', Q('Miből látunk sokat éjszaka az égen?', 'term', 'csillag')),
  F('fold', T, 3, 'A Földön élünk, és a Föld gömbölyű.', Q('Melyik bolygón élünk?', 'term', 'Föld')),
  F('fold-nap', T, 5, 'A Föld a Nap körül kering.', Q('Mi körül kering a Föld?', 'term', 'nap')),
  F('hold-fold', T, 5, 'A Hold a Föld körül kering.', Q('Mi körül kering a Hold?', 'term', 'Föld', { x: ['nap'] })),
  F('nap-csillag', T, 5, 'A Nap is egy csillag, csak nagyon közel van hozzánk.', Q('Melyik csillag van a legközelebb hozzánk?', 'term', 'nap', { x: ['csillag'] })),
  F('noveny', T, 2, 'A virágnak víz és napfény kell, hogy nőjön.', Q('Mi kell a virágnak, hogy nőjön?', 'term', ['víz', 'nap'])),
  F('folyo', T, 4, 'A folyók a tengerbe folynak.', Q('Hová folynak a folyók?', 'term', 'tenger')),
  F('to-jeg', T, 2, 'Télen a tó vize befagy, jég lesz belőle.', Q('Mi lesz télen a tó vizéből?', 'term', 'jég')),
  F('hoember-viz', T, 3, 'A hóemberből tavasszal víz lesz.', Q('Mi marad a hóemberből tavasszal?', 'term', 'víz')),
  F('teve', T, 4, 'A teve a sivatagban is sokáig kibírja víz nélkül.', Q('Hol bírja ki a teve sokáig víz nélkül?', 'term', 'sivatag')),
  F('hullam', T, 3, 'A tengeren nagy hullámok vannak.', Q('Hol vannak nagy hullámok?', 'term', 'tenger')),
  F('kirandulas', T, 4, 'A hegyre felmászni nagy kirándulás.', Q('Hova mászunk fel egy nagy kiránduláson?', 'term', 'hegy', { x: ['vulkán'] })),
  F('nappal', T, 5, 'Nappal is ott vannak a csillagok, csak a Nap fénye elnyomja őket.', Q('Melyiknek a fényétől nem látjuk nappal a csillagokat?', 'term', 'nap', { x: ['hold'] })),

  // ===== Ünnepek és szokások
  F('karacsonyfa', U, 1, 'Karácsonykor feldíszítjük a karácsonyfát.', Q('Mit díszítünk fel karácsonykor?', 'unnep', 'karácsonyfa')),
  F('fa-ala', U, 2, 'Karácsonykor a fa alá kerülnek az ajándékok.', Q('Mi kerül karácsonykor a fa alá?', 'unnep', 'ajándékdoboz')),
  F('mikulas', U, 1, 'A Mikulás december hatodikán hoz csomagot.', Q('Ki hoz csomagot december hatodikán?', 'unnep', 'Mikulás')),
  F('szakall', U, 2, 'A Mikulásnak piros ruhája és nagy fehér szakálla van.', Q('Kinek van nagy fehér szakálla és piros ruhája?', 'unnep', 'Mikulás')),
  F('csizma-ablak', U, 2, 'Mikulásra kitisztítjuk a csizmánkat, és az ablakba tesszük.', Q('Mit teszünk ki az ablakba Mikulásra?', 'visel', 'csizma')),
  F('torta', U, 1, 'A szülinapi tortán gyertyákat fújunk el.', Q('Min fújjuk el a gyertyákat a szülinapon?', 'unnep', 'torta')),
  F('ajandek', U, 1, 'A szülinaposnak ajándékot adunk.', Q('Mit adunk annak, aki szülinapos?', 'unnep', 'ajándékdoboz', { x: ['torta', 'lufi', 'virág'] })),
  F('lufi', U, 1, 'A zsúron lufikat fújunk fel.', Q('Mit fújunk fel a zsúron?', 'unnep', 'lufi')),
  F('tuzijatek', U, 2, 'Szilveszter éjjelén tűzijáték ragyog az égen.', Q('Mi ragyog az égen szilveszter éjjelén?', 'unnep', 'tűzijáték')),
  F('tojas', U, 1, 'Húsvétkor tojást festünk.', Q('Mit festünk húsvétkor?', 'unnep', 'tojás')),
  F('nyuszi', U, 2, 'A mesében a húsvéti nyuszi dugja el a tojásokat.', Q('Ki dugja el a mesében a húsvéti tojásokat?', 'unnep', 'nyuszi')),
  F('jelmez', U, 2, 'Farsangkor jelmezbe öltözünk.', Q('Mibe öltözünk farsangkor?', 'unnep', 'jelmez')),
  F('fank', U, 3, 'Farsangkor fánkot eszünk.', Q('Mit eszünk farsangkor?', 'unnep', 'fánk')),
  F('anyak-napja', U, 3, 'Anyák napján verset mondunk, és virágot adunk.', Q('Mit adunk anyák napján?', 'unnep', 'virág', { x: ['ajándékdoboz'] })),
  F('kiszebab', U, 4, 'Farsangkor elűzzük a telet, és várjuk a tavaszt.', Q('Mit veszünk fel, amikor farsangkor elűzzük a telet?', 'unnep', 'jelmez')),
  F('ujev', U, 4, 'Szilveszterkor búcsúzunk az óévtől, és köszöntjük az újat.', Q('Mivel köszöntjük éjfélkor az új évet?', 'unnep', 'tűzijáték')),
  F('gyertyak', U, 4, 'A tortán annyi gyertya ég, ahány éves a szülinapos.', Q('Min ég annyi gyertya, ahány éves a szülinapos?', 'unnep', 'torta')),
  F('szaloncukor', U, 5, 'A karácsonyfára gömböket és szaloncukrot akasztunk.', Q('Mire akasztunk szaloncukrot?', 'unnep', 'karácsonyfa')),
];

export const VILAG = factTemplates({ station: 'vilag', icon: '🌍', banks, skills, facts });
export const VILAG_TABLE = { station: 'vilag', banks, skills, facts };
