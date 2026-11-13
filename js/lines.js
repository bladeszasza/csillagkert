// Rozi mondatai szándék szerint. Minden szándékhoz legalább hat változat; az utolsó hármat nem ismételjük.
// A dicséret az igyekezetet is elismeri (a kiáltvány szerint), soha nem mond "rossz"-at.
// Név nélkül is természetes; számjegy és jel nincs benne (a gyerek csak hallja).
export const LINES = {
  good: ['Igen!', 'Úgy van!', 'Pontosan!', 'Ügyes vagy!', 'Eltaláltad!', 'Így van!', 'Szuper!'],
  effort: ['Láttam, hogy nem adtad fel!', 'Kitartó voltál, és sikerült!', 'Nem adtad fel, és megtaláltad!', 'Szépen végiggondoltad!', 'Türelmes voltál, és sikerült!', 'Jól figyeltél, és megoldottad!'],
  tryAgain: ['Nézzük még egyszer!', 'Próbáld újra!', 'Gondold végig még egyszer!', 'Semmi baj, próbáljuk újra!', 'Nézd meg jól még egyszer!', 'Figyeld meg újra!'],
  help: ['Segítek, egyet elveszek.', 'Segítek egy kicsit: ezt elveszem.', 'Segítek! Most már kevesebb közül választhatsz.', 'Egyet elveszek, így könnyebb.', 'Segítek neked, egyet eltüntetek.', 'Nézd, egyet elvettem.'],
  show: ['Nézd, melyik ragyog!', 'A ragyogóra koppints!', 'Megmutatom: az ragyog, ott a jó.', 'Nézd, ott ragyog a jó!', 'Segítek: koppints a ragyogóra!', 'Ott ragyog, nézd!'],
  // kész feladat után (a csillag magától repül, nem kell róla beszélni); {N} helyére néha a gyerek neve kerül
  star: ['Ügyes vagy{, N}!', 'Nagyszerű!', 'Szuper{, N}!', 'Csodás!', 'Ez az!', 'Szépen dolgoztál{, N}!', 'Ezt is megtanultuk együtt!', 'Okosodunk{, N}!'],
  // köszönés induláskor
  hello: ['Szia{, N}! Mit fedezünk fel ma?', 'Szia{, N}! Okosodjunk együtt!', 'Szia{, N}! Gyere, fedezzük fel együtt a világot!', 'Szia{, N}! De jó, hogy itt vagy!', 'Szia{, N}! Kíváncsi vagyok, mit tanulunk ma.', 'Szia{, N}! Kezdjük együtt!'],
  // a jutalomjáték után
  again: ['Ez nagyon jó volt! Fedezzünk fel még valamit együtt!', 'De jó volt! Gyere, tanuljunk még valamit!', 'Szép volt! Nézzük, mit fedezünk fel most!', 'Ez jó móka volt! Okosodjunk tovább együtt!', 'Remek volt! Gyere, folytassuk a felfedezést!', 'Jó volt játszani! Tanuljunk még együtt!'],
};

// Hívogató mondat, amikor egy ülésben először érkezünk egy állomásra (a név néha az elejére kerül)
export const STATION_LINES = {
  ceruza: ['Gyakoroljuk együtt a vonalakat!', 'Rajzoljunk szép vonalakat együtt!'],
  szamol: ['Fedezzük fel együtt a számok világát!', 'Gyere, számoljunk együtt!'],
  forma: ['Nézzük meg együtt a formákat és a színeket!', 'Fedezzük fel a formák és a színek világát!'],
  hang: ['Fedezzük fel együtt a hangok világát!', 'Figyeljük meg együtt a szavak hangjait!'],
  zene: ['Muzsikáljunk együtt!', 'Fedezzük fel együtt a zene világát!'],
  okos: ['Okoskodjunk együtt!', 'Gondolkodjunk együtt, mint a kis detektívek!'],
  vilag: ['Fedezzük fel együtt a világot!', 'Nézzük meg, milyen csodás a világ!'],
  egeszseg: ['Nézzük meg, mitől leszünk erősek és egészségesek!', 'Vigyázzunk együtt az egészségünkre!'],
  test: ['Fedezzük fel együtt a testünk csodáit!', 'Nézzük meg, milyen ügyes a testünk!'],
  ido: ['Utazzunk együtt a régi időkbe!', 'Nézzük meg, hogyan éltek régen!'],
  algo: ['Segítsünk együtt a robotnak!', 'Programozzunk együtt!'],
  rajz: ['Rajzoljunk együtt!', 'Alkossunk valami szépet!'],
};

// {N} → ", Név" vagy semmi. A nevet nem minden mondatba tesszük (p valószínűséggel), hogy ne legyen erőltetett.
// NAME_RATE: a szülő kérésére (2026-11-13) feleannyiszor szól a név, mint eddig. A p = 1 (a bemutatkozás és a napi
// első köszönés) kivétel: ott mindig elhangzik.
export const NAME_RATE = 0.5;
const nameChance = p => (p >= 1 ? 1 : p * NAME_RATE);
export function named(text, name, rand = Math.random, p = 0.35) {
  const use = !!name && rand() < nameChance(p);
  return String(text).replace('{, N}', use ? `, ${name}` : '').replace('{N}', use ? name : '').trim();
}
export function stationLine(station, name, rand = Math.random) {
  const all = STATION_LINES[station]; if (!all) return '';
  const t = all[Math.floor(rand() * all.length)];
  return name && rand() < nameChance(0.5) ? `${name}, ${t[0].toLowerCase()}${t.slice(1)}` : t;
}

const recent = {};
// line('good') → egy változat; az utolsó három kimaradt változat közül választ
export function line(intent, rand = Math.random) {
  const all = LINES[intent]; if (!all) return '';
  const last = recent[intent] || (recent[intent] = []);
  const pool = all.filter(x => !last.includes(x));
  const pick = pool[Math.floor(rand() * pool.length)] ?? all[0];
  last.push(pick); if (last.length > 3) last.shift();
  return pick.replace('{, N}', '').replace('{N}', '');
}
// ugyanaz névvel: lineNamed('star', név) – a név néha bekerül
export function lineNamed(intent, name, rand = Math.random, p) {
  const all = LINES[intent]; if (!all) return '';
  const before = line(intent, rand), raw = all.find(x => x.replace('{, N}', '').replace('{N}', '') === before) || before;
  return named(raw, name, rand, p);
}
export const resetLines = () => { for (const k of Object.keys(recent)) delete recent[k]; };

const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
// "kör, négyzet vagy háromszög" – a válaszok neve, ahogy Rozi felsorolja
export const listOr = names => names.length < 2 ? (names[0] || '') : `${names.slice(0, -1).join(', ')} vagy ${names[names.length - 1]}`;

// A választós feladat összes kimondott mondata (tiszta függvény: Node-ban is tesztelhető).
// item.options[i]: { name, said?, teach? } — said: amit tévedésnél mond ("Ez a négyzet."), teach: rövid tanító mondat.
// item.hint: segítő mondat a második tévedésnél. item.fact: a jó válasz utáni teljes kijelentés.
export function pickSpeech(item, legacyName) {
  const ask = item.say || item.prompt;
  const names = item.options.map(o => o.name).filter(Boolean);
  const question = names.length && !item.noList ? `${ask} ${cap(listOr(names))}?` : ask;
  return {
    question,
    right: (wrong = 0, rand) => [line('good', rand), item.fact, wrong >= 2 ? line('effort', rand) : ''].filter(Boolean).join(' '),
    wrong: (o, n, rand) => {
      const said = o.said || (legacyName ? legacyName(o.name) : '');
      const extra = n === 1 ? `${line('tryAgain', rand)} ${ask}` : n === 2 ? [o.teach || item.hint || '', line('help', rand)].filter(Boolean).join(' ') : line('show', rand);
      return `${said} ${extra}`.trim();
    },
  };
}
