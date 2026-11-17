// A nagy mese (a szülő kérése, 2026-11-17): öt fejezet, öt játéknapon át, a kör meséi (js/story.js) fölött.
//   - A nap első indulásakor Rozi felidézi, hol tartunk (az előző fejezet összefoglalója), és elmondja a mai fejezet elejét.
//   - Az első jutalomkapunál, amit a gyerek aznap elér, szól a fejezet izgalmas vége (cliff); az ötödiknél a nagy mese vége.
//   - Játéknapokhoz kötött, nem a naptárhoz: ha egy nap kimarad, nem marad le fejezetről. Ha egy nap a kapu nem jött el,
//     legközelebb ugyanaz a fejezet jön újra (a gyerek nem hallotta a végét). Ezért a mondatokban nincs "tegnap", "holnap".
//   - Aznapi újranyitáskor nem mondja el újra (ott a kör meséjének folytatása szól).
//   - Csak olyan barátról szól, aki már a gyerek kertjében lakik (who); ha egy mese sem illik, minden a régi szerint megy.
// Mondat-szabályok mint a kör meséinél: legfeljebb tizenkét szó, számjegy és emoji nélkül, kézzel írt alakok.
// Tiszta modul: nem tárol, nem beszél; a napot (dayKey) a hívó adja, így a tesztek napokat léptethetnek.

export const CHAPTERS = 5;
export const WEEK_START = 'Új nagy mese kezdődik!';

// fejezetenként: open (a fejezet eleje, egy mondat), cliff (a fejezet izgalmas vége, legfeljebb két mondat),
// sum (legközelebb ezzel idézi fel, egy mondat); az utolsó fejezetnek cliff helyett end-je van (legfeljebb két mondat)
export const WEEKS = [
  {
    id: 'kis-csillag', who: ['cat'], value: 'segítség', title: 'A kicsi csillag, aki leesett az égről',
    ch: [
      { open: 'Az égről lepottyant egy kicsi csillag, és elbújt a kertben.', cliff: 'A cica csillogó nyomot talált a fűben. Vajon hová vezet?', sum: 'Múltkor egy kicsi csillag pottyant le az égről.' },
      { open: 'Kövessük a csillogó nyomot a cicával!', cliff: 'A nyom a tó felé kanyarodik, de ott elhalványul.', sum: 'Múltkor csillogó nyomot követtünk a fűben.' },
      { open: 'A tó vizében valami fényes csillan meg.', cliff: 'Halk sírást hallunk a bokor mögül. Ki lehet az?', sum: 'Múltkor a tónál kerestük a kicsi csillagot.' },
      { open: 'A bokor mögött ott a kicsi csillag, és fél.', cliff: 'Haza szeretne menni az égre, de nem tudja, hogyan.', sum: 'Múltkor megtaláltuk a félős kicsi csillagot.' },
      { open: 'Segítsünk a kicsi csillagnak hazajutni!', end: 'A cica feldobja, és a csillag felrepül az égre. Azóta onnan integet nekünk minden éjjel.' },
    ],
  },
  {
    id: 'nyuszi-meglepetes', who: ['bunny', 'cat'], value: 'kedvesség', title: 'Meglepetés a nyuszinak',
    ch: [
      { open: 'A cica titkot súg: közeleg a nyuszi születésnapja!', cliff: 'De mit adjunk neki ajándékba? Gondolkodjunk rajta!', sum: 'Múltkor megtudtuk, hogy közeleg a nyuszi születésnapja.' },
      { open: 'Kitaláltuk: répatortát sütünk a nyuszinak!', cliff: 'Jaj, elfogyott a répa a kertből!', sum: 'Múltkor elhatároztuk, hogy répatortát sütünk a nyuszinak.' },
      { open: 'Répát keresünk, de a nyuszi nem tudhat róla.', cliff: 'A cica répát látott a szomszéd kertjében.', sum: 'Múltkor répát kerestünk a tortához.' },
      { open: 'Kedvesen elkérjük a répát a szomszédtól, és megköszönjük.', cliff: 'Kész a torta, de hogyan lesz belőle meglepetés?', sum: 'Múltkor elkértük a répát, és megsütöttük a tortát.' },
      { open: 'Bújjunk el a bokor mögé, és várjuk a nyuszit!', end: 'Meglepetés! A nyuszi ugrál örömében, és mindenkinek ad a tortából.' },
    ],
  },
  {
    id: 'kutya-terkep', who: ['dog', 'cat'], value: 'együttműködés', title: 'A kutya kincses térképe',
    ch: [
      { open: 'A kutya egy régi térképet ásott ki a kertben.', cliff: 'A térképen egy nagy piros kereszt van. Mit jelenthet?', sum: 'Múltkor a kutya egy régi térképet talált.' },
      { open: 'A térkép szerint a kincs a nagy fa mellett van.', cliff: 'A fánál csak egy újabb rajzot találunk.', sum: 'Múltkor a nagy fánál kerestük a kincset.' },
      { open: 'Az új rajzon virágok vannak és egy kis tó.', cliff: 'A cica szerint a kincs a virágok alatt lapul.', sum: 'Múltkor egy új rajzot találtunk a fánál.' },
      { open: 'Együtt ásunk: a kutya a lábával, mi lapáttal.', cliff: 'Koppan valami! Egy kis doboz bukkan elő.', sum: 'Múltkor együtt ástunk, és valami koppant.' },
      { open: 'Nyissuk ki együtt a kis dobozt!', end: 'A dobozban régi játékok vannak. Most mindenki együtt játszik velük.' },
    ],
  },
  {
    id: 'roka-sotet', who: ['fox', 'owl'], value: 'bátorság', title: 'A róka, aki félt a sötétben',
    ch: [
      { open: 'A róka bevallja, hogy fél a sötétben.', cliff: 'A bagoly azt mondja, tud segíteni neki.', sum: 'Múltkor a róka elmondta, hogy fél a sötétben.' },
      { open: 'A bagoly megmutatja, mennyi szép hang van éjjel.', cliff: 'De mi az a furcsa susogás a fák között?', sum: 'Múltkor éjszakai hangokat hallgattunk a bagollyal.' },
      { open: 'Megnézzük együtt, mi susog a fák között.', cliff: 'Csak a szél volt, ami a leveleket fújta!', sum: 'Múltkor kiderült, hogy csak a szél susogott.' },
      { open: 'A róka már kíváncsi, mit láthat még éjjel.', cliff: 'Fénylő pontok jelennek meg a fűben. Mik lehetnek?', sum: 'Múltkor a róka kíváncsi lett az éjszakára.' },
      { open: 'Nézzük meg a fénylő pontokat a rókával!', end: 'Szentjánosbogarak táncolnak! A róka már nem fél, és boldogan nézi őket.' },
    ],
  },
  {
    id: 'sun-haza', who: ['hedgehog', 'bear'], value: 'törődés', title: 'Új ház a sünnek',
    ch: [
      { open: 'A sün kicsi háza összedőlt egy nagy szélben.', cliff: 'Hol fog most aludni a kis sün?', sum: 'Múltkor összedőlt a sün kicsi háza.' },
      { open: 'A maci azt mondja: építsünk neki új házat!', cliff: 'De miből épül egy jó sünház?', sum: 'Múltkor elhatároztuk, hogy új házat építünk a sünnek.' },
      { open: 'Gyűjtünk ágakat, leveleket és puha mohát.', cliff: 'A maci túl nagy ágat hozott, nem fér be!', sum: 'Múltkor ágakat és leveleket gyűjtöttünk.' },
      { open: 'Kicsi ágakból rakjuk össze a falakat.', cliff: 'Már csak a puha ágy hiányzik belőle.', sum: 'Múltkor felépültek a sünház falai.' },
      { open: 'Puha levelekből vetünk ágyat a sünnek.', end: 'A sün bebújik, és boldogan szuszog. A maci halkan jó éjszakát kíván.' },
    ],
  },
  {
    id: 'kacsa-uszas', who: ['duck'], value: 'türelem', title: 'A legkisebb kiskacsa úszni tanul',
    ch: [
      { open: 'A kacsa kicsinyei kikeltek, de még nem tudnak úszni.', cliff: 'A legkisebb fél a víztől. Mit tehetünk?', sum: 'Múltkor kikeltek a kacsa kicsinyei.' },
      { open: 'A kacsa türelmesen mutatja, hogyan kell evezni a lábbal.', cliff: 'A legkisebb csak a parton ül, és nézi a többieket.', sum: 'Múltkor a kacsa úszni tanította a kicsinyeit.' },
      { open: 'Bátorítsuk a legkisebbet kedves szavakkal!', cliff: 'Az egyik lábát már beledugja a vízbe!', sum: 'Múltkor kedves szavakkal bátorítottuk a legkisebbet.' },
      { open: 'Lassan, lépésről lépésre bemerészkedik a sekély vízbe.', cliff: 'Jön egy hullám, és a legkisebb megijed.', sum: 'Múltkor a legkisebb a sekély vízbe merészkedett.' },
      { open: 'Próbáljuk újra, a kacsa ott úszik mellette!', end: 'A legkisebb is úszik, és boldogan hápog! Megérte türelmesnek lenni.' },
    ],
  },
  {
    id: 'kerti-unnep', who: ['cat', 'bunny', 'dog'], value: 'együttműködés', title: 'A nagy kerti ünnep',
    ch: [
      { open: 'A kert lakói nagy ünnepet szeretnének tartani.', cliff: 'De ki mit csináljon? Mindenki mást szeretne!', sum: 'Múltkor elhatároztuk, hogy nagy kerti ünnepet tartunk.' },
      { open: 'Meghallgatjuk egymást, és mindenki választ egy feladatot.', cliff: 'A kutya zenét hoz, de hol fognak táncolni?', sum: 'Múltkor mindenki választott egy feladatot az ünnepre.' },
      { open: 'A nyuszi kitakarítja a tisztást a tánchoz.', cliff: 'Jaj, sötét felhők gyűlnek az égen!', sum: 'Múltkor kitakarítottuk a tisztást a tánchoz.' },
      { open: 'Esik az eső, de a cica szerint ez nem baj.', cliff: 'Eláll az eső, és valami szép jelenik meg az égen.', sum: 'Múltkor esett az eső, de nem keseredtünk el.' },
      { open: 'Nézzük meg, mi ragyog az égen az eső után!', end: 'Szivárvány! Alatta kezdődik az ünnep, és mindenki együtt táncol.' },
    ],
  },
];

const BY_ID = new Map(WEEKS.map(w => [w.id, w]));
export const weekById = id => BY_ID.get(id) || null;
const DAY = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

// a mentett állás, ha érvényes: { id, ch (1..5), day, heard }
export function activeWeek(state) {
  const w = state && state.week;
  return w && typeof w === 'object' && weekById(w.id) && Number.isInteger(w.ch) && w.ch >= 1 && w.ch <= CHAPTERS ? w : null;
}

// A nap első indulásakor: a mai fejezet (új nagy mese, a következő fejezet, vagy a meg nem hallgatott újra).
// Visszaad: { week, weeksUsed?, text } a mentésbe és kimondásra, vagy null (aznap már szólt, vagy egy mese sem illik).
export function weekStart(state, present, day) {
  const w = activeWeek(state);
  if (w && w.day === day) return null;
  let arc, ch, used = null;
  if (w && !(w.heard && w.ch >= CHAPTERS)) { arc = weekById(w.id); ch = w.heard ? w.ch + 1 : w.ch; }
  else {
    const prev = Array.isArray(state?.weeksUsed) ? state.weeksUsed : [];
    const ok = WEEKS.filter(x => x.who.every(f => present.includes(f)));
    const fresh = ok.filter(x => !prev.includes(x.id));
    arc = fresh[0] || ok.find(x => x.id !== prev[prev.length - 1]) || ok[0];
    if (!arc) return null;
    ch = 1; used = fresh.length ? [...prev, arc.id].slice(-40) : [arc.id];
  }
  const text = ch === 1 ? `${WEEK_START} ${arc.ch[0].open}` : `${arc.ch[ch - 2].sum} ${arc.ch[ch - 1].open}`;
  const out = { week: { id: arc.id, ch, day, heard: false }, text };
  if (used) out.weeksUsed = used;
  return out;
}

// Az első jutalomkapunál a fejezet után: a fejezet izgalmas vége, az ötödik fejezetnél a nagy mese vége (egyszer).
export function weekGate(state) {
  const w = activeWeek(state);
  if (!w || w.heard) return null;
  const c = weekById(w.id).ch[w.ch - 1], finale = w.ch >= CHAPTERS;
  return { week: { ...w, heard: true }, text: finale ? c.end : c.cliff, finale };
}
