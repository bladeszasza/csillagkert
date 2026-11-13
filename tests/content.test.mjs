// Tartalom-ellenőrzés (Node): futtatás a repó gyökeréből: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM, STATIONS, stationOf, idOf, BASE_ITEMS, FEED_ITEMS } from '../js/curriculum.js';
import { art, withArt, artLetter, ACC_NUM, numAttr, fromNum } from '../js/hu.js';
import { FRIENDS, FOODS, MEALS, ANY, friendById, friendsFor, flowerSpot, MAX_FLOWERS, GOLD_MAX, goldSpot, FEED_SPOT, FEED_GATE, PLACES, AREAS } from '../js/friends.js';
import { progress } from '../js/progress.js';

const flat = CURRICULUM.flatMap(i => (i.type === 'seq' ? [i, ...i.steps] : [i]));
const picks = flat.filter(i => i.type === 'pick'), orders = flat.filter(i => i.type === 'order');

test('minden feladatnak egyedi azonosítója van', () => {
  const seen = new Map();
  for (const it of CURRICULUM) { const id = idOf(it); assert.ok(id, 'üres azonosító'); assert.ok(!seen.has(id), `ismétlődő azonosító: ${id}`); seen.set(id, it); }
  assert.equal(seen.size, BASE_ITEMS.length + FEED_ITEMS.length);
});

test('minden feladat egy létező állomáshoz tartozik, és minden állomáson van feladat', async () => {
  const { POOL, FEED_POOL } = await import('../js/content/index.js');
  const { GENERATED } = await import('../js/content/engine.js');
  const ids = new Set(STATIONS.map(s => s.id));
  for (const it of CURRICULUM) assert.ok(ids.has(stationOf(it)), `ismeretlen állomás: ${stationOf(it)}`);
  for (const s of STATIONS) assert.ok([...POOL, ...FEED_POOL].some(e => e.station === s.id), `üres állomás: ${s.id}`);
  // a sablonokból készülő állomások régi, kézzel írt feladatai kikerültek (nem keverednek a generáltakkal)
  for (const it of CURRICULUM) assert.ok(!GENERATED.includes(stationOf(it)), `régi feladat egy generált állomáson: ${idOf(it)}`);
});

test('tény-állomások: az audit szerint javított feladatok', () => {
  const prompts = new Set(flat.map(i => i.prompt));
  // kikerült vagy átfogalmazott kérdések (védhető második válasz, felnőttes szó, rossz ige, félrevezető kép)
  for (const p of ['Mikor megyünk aludni?', 'Mi folyik az ereinkben?', 'Mi segít, hogy kipihenjük magunkat?', 'Mivel ízlelünk?',
    'Mi élt nagyon régen, az emberek előtt?', 'Mi melegített és világított az ősembereknek?', 'Mit építettek az egyiptomiak a fáraóknak?',
    'Ki védte a várat?', 'Hogyan világítottak régen, villany nélkül?', 'Mit használunk fogmosáshoz?', 'Hogyan növünk? Koppints sorrendben!'])
    assert.ok(!prompts.has(p), `még benne van: ${p}`);
  // a "fül" eddig csak rossz válasz volt: most egy kérdésnek ő a helyes válasza
  assert.ok(picks.some(p => p.options.some(o => o.ok && o.name === 'fül')), 'a fül sehol nem helyes válasz');
  // a csibe kérdésénél látszik a csibe; a mag képe nem gesztenye; a kézmosásnál nincs taps
  assert.ok(picks.find(p => p.prompt === 'Kinek a kicsinye a csibe?').q.includes('🐥'));
  assert.ok(!orders.some(o => o.steps.some(s => s.t === '🌰' || s.t === '👏')), 'félrevezető kártyakép');
});

test('kimondott tények legfeljebb kb. 70 betűsek (a hosszú mondatot a hang levághatja)', () => {
  for (const it of [...picks, ...orders]) assert.ok(it.fact.length <= 70, `hosszú tény (${it.fact.length}): ${it.fact}`);
});

test('választós feladat: pontosan egy helyes válasz, nincs ismétlődő válasz, van tény', () => {
  for (const p of picks) {
    assert.equal(p.options.filter(o => o.ok).length, 1, `nem egy helyes válasz: ${p.prompt}`);
    const names = p.options.map(o => o.name || o.t);
    assert.equal(new Set(names).size, names.length, `ismétlődő válasz: ${p.prompt}`);
    assert.ok(p.fact, `hiányzó tény: ${p.prompt}`);
  }
});

test('sorba rendezés: van tény, és a kártyák nem árulják el számjeggyel a sorrendet', () => {
  for (const o of orders) {
    assert.ok(o.fact, `hiányzó tény: ${o.prompt}`);
    for (const s of o.steps) assert.ok(!/[0-9]️?⃣/.test(s.t), `számjegyes kártya: ${o.prompt}`);
  }
});

test('a kimondott kérdésekben nincs matematikai jel', () => {
  for (const it of flat) for (const txt of [it.say, it.fact].filter(Boolean)) assert.ok(!/[×÷]/.test(txt), `jel a szövegben: ${txt}`);
});

test('rosszul besorolt feladatok a helyükön vannak', () => {
  const where = prompt => stationOf(flat.find(i => i.prompt === prompt));
  assert.equal(where('Mivel látunk?'), 'test');
  assert.equal(where('Mivel szagolunk?'), 'test');
  assert.equal(where('Esik az eső. Mit viszünk magunkkal?'), 'vilag');
  assert.equal(where('Piros a lámpa. Mit csinálsz?'), 'vilag');
  assert.equal(where('Hogyan mosunk fogat? Koppints sorrendben!'), 'egeszseg');
});

test('zene: Kodály-sorrend (szó–mi-vel kezd, fá és ti csak az 5. szinten), és csak viszonyított hallás', async () => {
  const { TEMPLATES, targetsOf, build } = await import('../js/content/engine.js');
  const { rng } = await import('../js/content/rng.js');
  const zene = TEMPLATES.filter(t => t.station === 'zene').flatMap(t => targetsOf(t).map(x => [x, build(x.id, rng(x.id))]));
  const notesOf = it => (it.type === 'echo' ? it.melody : (it.sound?.events || []).map(e => e.n).filter(Boolean));
  for (const [x, it] of zene.filter(([x]) => x.level === 1 && x.id.startsWith('zene.visszhang'))) assert.ok(notesOf(it).every(n => n === 'szo' || n === 'mi'), `az első szint nem szó–mi: ${x.id}`);
  for (const [x, it] of zene) if (notesOf(it).some(n => n === 'fa' || n === 'ti')) assert.equal(x.level, 5, `fá vagy ti az 5. szint alatt: ${x.id}`);
  // "melyik harang szólt?": előbb minden harang megszólal (a gyerek összehasonlít, nem fejből nevez meg)
  for (const [x, it] of zene.filter(([x]) => x.id.startsWith('zene.harang'))) {
    const refs = it.sound.events.filter(e => e.hi).map(e => e.hi);
    assert.deepEqual([...refs].sort(), it.options.map(o => o.key).sort(), `nem szól minden harang előbb: ${x.id}`);
  }
});

test('magyar nyelvtani segédek', () => {
  assert.equal(art('alma'), 'az'); assert.equal(art('körte'), 'a'); assert.equal(withArt('őz', true), 'Az őz');
  assert.equal(artLetter('M'), 'az'); assert.equal(artLetter('K'), 'a');
  assert.equal(ACC_NUM[3], 'hármat'); assert.equal(numAttr('tizenkettő'), 'tizenkét');
  const from = { öt: 'ötből', hat: 'hatból', három: 'háromból', tíz: 'tízből', nyolc: 'nyolcból', kilenc: 'kilencből', kettő: 'kettőből', húsz: 'húszból', tizenhét: 'tizenhétből', egy: 'egyből' };
  for (const [w, exp] of Object.entries(from)) assert.equal(fromNum(w), exp);
});

test('etetés: csak a kert 3D lakóit etetjük, a jó étel igaz, a rossz étel biztosan téves', () => {
  const keys = new Set();
  MEALS.forEach(([kind, good, ...wrong], i) => {
    const f = friendById(kind);
    assert.ok(f, `ismeretlen állat: ${kind}`);
    if (i > 0) assert.notEqual(MEALS[i - 1][0], kind, 'egymás után ugyanaz az állat éhes');
    if (good === ANY) {                                   // mindenevő: mindegyik felkínált étel jó, ezért mind legyen biztosan igaz
      assert.ok(wrong.length >= 3 && new Set(wrong).size === wrong.length, `legalább három különböző étel kell: ${kind}`);
      for (const x of wrong) { assert.ok(f.eats.includes(x), `${f.name} nem biztosan eszik ilyet: ${x}`); assert.ok(FOODS[x]?.t || FOODS[x]?.svg, `hiányzó kép: ${x}`); }
      return;
    }
    assert.ok(f.eats.includes(good), `${f.name} nem eszik ilyet: ${good}`);
    assert.ok(wrong.length >= 2, `legalább három válasz kell: ${kind} ${good}`);
    for (const w of wrong) assert.ok(!f.eats.includes(w) && !f.maybe.includes(w), `védhető "rossz" válasz: ${f.name} – ${w}`);
    for (const x of [good, ...wrong]) { assert.ok(FOODS[x]?.acc, `hiányzó tárgyeset: ${x}`); assert.ok(FOODS[x].t || FOODS[x].svg, `hiányzó kép: ${x}`); }
    assert.equal(new Set([good, ...wrong]).size, wrong.length + 1, `ismétlődő étel: ${kind} ${good}`);
    const key = `${kind}|${good}`; assert.ok(!keys.has(key), `ismétlődő tény: ${key}`); keys.add(key);
  });
  // minden rossz válaszként használt étel legalább egyszer jó válasz is (ne lehessen kizárással megtanulni)
  const quiz = MEALS.filter(m => m[1] !== ANY);
  const goods = new Set(quiz.map(m => m[1]));
  for (const w of new Set(quiz.flatMap(m => m.slice(2)))) assert.ok(goods.has(w), `soha nem helyes étel: ${w}`);
  // a feladatsorban az etetésnek saját kulcsa van (állat + jó étel, a mindenevőnél "mind"), és minden barátot lehet etetni
  assert.deepEqual(FEED_ITEMS.map(idOf), MEALS.map(m => `feed-${m[0]}-${m[1] === ANY ? 'mind' : m[1]}`));
  // akinek az étrendjét forrással rögzítettük (eats nem üres), annak van etetős feladata; akinek nem, azt nem etetjük (nincs kitalált tény)
  for (const f of FRIENDS) assert.equal(MEALS.some(m => m[0] === f.id), f.eats.length > 0, `etetés és étrend nem egyezik: ${f.name}`);
  for (const id of ['duck', 'hedgehog', 'hen']) assert.ok(MEALS.some(m => m[0] === id && m[1] === ANY), `mindenevő sor hiányzik: ${id}`);
  // a maci mindenevő: nála nincs rossz válasz (a szülő döntése), a kvíz-sorokban ezért nem szerepel
  assert.deepEqual(MEALS.filter(m => m[0] === 'bear').map(m => m[1]), [ANY]);
  const bear = FEED_ITEMS.find(i => i.kind === 'bear');
  assert.deepEqual(bear.any, ['hal', 'áfonya', 'hús']); assert.equal(bear.wrong, undefined);
});

test('kert: a barátok a csillagokkal érkeznek, etetéssel hamarabb is', () => {
  assert.deepEqual(friendsFor(0), ['cat']);
  assert.deepEqual(friendsFor(3), ['cat', 'bunny']);
  assert.deepEqual(friendsFor(10), ['cat', 'bunny', 'dog']);
  assert.deepEqual(friendsFor(29), ['cat', 'bunny', 'dog', 'fox', 'duck']);
  assert.deepEqual(friendsFor(60), ['cat', 'bunny', 'dog', 'fox', 'duck', 'bear', 'frog', 'hedgehog', 'hen', 'panda']);
  assert.deepEqual(friendsFor(0, ['panda']), ['cat', 'panda']);
  assert.deepEqual(friendsFor(150), FRIENDS.map(f => f.id));
  // a terv rögzített érkezési pontjai (a többi küszöb saját beállítás, lásd README)
  const at = { bunny: 3, dog: 8, fox: 15, duck: 25, bear: 30, hedgehog: 40, panda: 55, owl: 70, unicorn: 90 };
  for (const [id, s] of Object.entries(at)) assert.equal(friendById(id).stars, s, id);
  for (let i = 1; i < FRIENDS.length; i++) assert.ok(FRIENDS[i].stars > FRIENDS[i - 1].stars, 'a tábla érkezési sorrendben áll, egy csillagszámra egy barát');
});

test('kertrészek: a tóparti és a tanyasi barátok a virágkörön kívül, egymástól távol laknak', () => {
  const ids = new Set(AREAS.map(a => a.id));
  for (const f of FRIENDS) {
    const [x, z] = f.home;
    assert.ok(f.height > 0.3 && f.height < 3.5, `hiányzó vagy furcsa magasság: ${f.name}`);
    if (!f.area) { assert.ok(Math.hypot(x, z) < 6, `${f.name} a kert közepén lakik`); continue; }
    assert.ok(ids.has(f.area), `ismeretlen kertrész: ${f.area}`);
    const a = AREAS.find(r => r.id === f.area);
    assert.ok(Math.abs(x - a.x) <= 4 && Math.abs(z) <= 3.2, `${f.name} kilóg a(z) ${a.name} képéből`);
    assert.ok(Math.hypot(x, z) > 13.3, `${f.name} a virágok közé lóg`);
    assert.ok((x / (14 * 1.9)) ** 2 + (z / 14) ** 2 < 0.8, `${f.name} a kert szélén túl`);
  }
  const side = FRIENDS.filter(f => f.area);
  for (let i = 0; i < side.length; i++) for (let j = 0; j < i; j++) {
    const a = side[i], b = side[j];
    if (a.area === b.area) assert.ok(Math.hypot(a.home[0] - b.home[0], a.home[1] - b.home[1]) >= 1.6, `túl közel: ${a.name}, ${b.name}`);
  }
  assert.ok(AREAS.every(a => FRIENDS.some(f => f.area === a.id)), 'üres kertrész');
});

test('ételek: mindnek van tárgyesete és képe; az új ételek saját rajzot kapnak, ha nincs jó emoji', () => {
  for (const [k, f] of Object.entries(FOODS)) { assert.ok(f.acc, `hiányzó tárgyeset: ${k}`); assert.ok(f.t || f.svg, `hiányzó kép: ${k}`); }
  for (const k of ['búza', 'zab', 'mogyoró', 'dió', 'makk', 'fű', 'vízinövény']) assert.ok(FOODS[k]?.svg, `saját rajz kell: ${k}`);
  // minden étel, ami az étrendekben szerepel, létezik a FOODS-ban (a maybe listák elírását is megfogja)
  for (const f of FRIENDS) for (const x of [...f.eats, ...f.maybe]) assert.ok(FOODS[x], `ismeretlen étel: ${f.name} – ${x}`);
});

test('állathangok: minden barátnak saját, a többiekétől különböző hangja van', async () => {
  const { VOICE, SOUND_KINDS } = await import('../js/sounds.js');
  const ids = FRIENDS.map(f => f.id);
  for (const id of ids) assert.ok(VOICE[id] && SOUND_KINDS.includes(VOICE[id]), `hiányzó hang: ${id}`);
  assert.equal(new Set(ids.map(id => VOICE[id])).size, ids.length, 'két barátnak ugyanaz a hangja');
});

// a kert összes virághelye: a csillagvirágok (legfeljebb MAX_FLOWERS) és az aranyvirágok
const allSpots = () => [...Array.from({ length: MAX_FLOWERS }, (_, i) => flowerSpot(i)), ...Array.from({ length: GOLD_MAX }, (_, k) => goldSpot(k))];
test('kert: a virágok nem ülnek egymásra, a barátok zugában és az etetőhely előtt nincs virág', () => {
  const pts = allSpots();
  assert.equal(new Set(pts.map(p => `${p.x.toFixed(3)},${p.z.toFixed(3)}`)).size, pts.length);
  for (let i = 0; i < pts.length; i++) for (let j = 0; j < i; j++) assert.ok(Math.hypot(pts[i].x - pts[j].x, pts[i].z - pts[j].z) > 0.6, `túl közeli virágok: ${i}, ${j}`);
  for (const p of pts) {
    for (const f of FRIENDS) assert.ok(Math.hypot(p.x - f.home[0], p.z - f.home[1]) > 1.3, `virág ${f.name} zugában`);
    assert.ok(!(Math.abs(p.x - FEED_SPOT[0]) < 1.7 && p.z > 2.3), 'virág az etetőhely előtt');
    assert.ok(Math.hypot(p.x, p.z) < 13, 'virág a kerten kívül');
  }
});

test('kert: egyszerre legfeljebb MAX_FLOWERS virág, és egyik sem nő a feladatjelek elé (a képernyő aljára)', () => {
  assert.ok(MAX_FLOWERS >= 50 && MAX_FLOWERS <= 100, `furcsa virágszám: ${MAX_FLOWERS}`);
  const front = Math.max(...PLACES.filter(p => p.z > 0).map(p => p.z)) + 1.1, wide = Math.max(...PLACES.map(p => Math.abs(p.x))) - 2;
  allSpots().forEach((p, i) => assert.ok(!(p.z > front && Math.abs(p.x) < wide), `a(z) ${i}. virág (az aranyvirágok a végén) a jelek elé nő (${p.x.toFixed(1)}, ${p.z.toFixed(1)})`));
  const next = flowerSpot(MAX_FLOWERS + 1);
  assert.ok(next.z > front && Math.abs(next.x) < wide, 'a határ szoros: a következő hely már a jelek elé esne (ha nem, nőhet a virágszám)');
});

test('mentés: régi mentésben nincs "friends" mező – üresről indul, bővíthető, újrakezdéskor törlődik', () => {
  assert.deepEqual(progress.get().friends, []);
  progress.addFriend('panda'); progress.addFriend('panda'); progress.addFriend('fox');
  assert.deepEqual(progress.get().friends, ['panda', 'fox']);
  progress.reset();
  assert.deepEqual(progress.get().friends, []);
});

test('térkép: minden állomásnak van helye a kertben, a tereptárgyak nem ülnek egymáson, virág és barát nem nő rájuk', () => {
  assert.deepEqual(PLACES.map(p => p.id).sort(), STATIONS.map(s => s.id).sort());
  for (let i = 0; i < PLACES.length; i++) for (let j = 0; j < i; j++) assert.ok(Math.hypot(PLACES[i].x - PLACES[j].x, PLACES[i].z - PLACES[j].z) >= 1.1, `túl közeli tereptárgyak: ${PLACES[i].id}, ${PLACES[j].id}`);
  for (const p of PLACES) for (const f of FRIENDS) assert.ok(Math.hypot(p.x - f.home[0], p.z - f.home[1]) > 1.6, `${p.id} a(z) ${f.name} zugában áll`);
  const pts = allSpots();
  for (const q of pts) for (const p of PLACES) assert.ok(Math.hypot(q.x - p.x, q.z - p.z) > 0.7, `virág a(z) ${p.id} tereptárgyon`);
  // az etetőhelyre vezető kapu a tereptárgyak sora mellett van, nem rajtuk keresztül
  for (const p of PLACES) assert.ok(Math.hypot(FEED_GATE[0] - p.x, FEED_GATE[1] - p.z) > 1 && Math.hypot(FEED_SPOT[0] - p.x, FEED_SPOT[1] - p.z) > 1, `az etetés útja a(z) ${p.id} tárgyon megy át`);
});
