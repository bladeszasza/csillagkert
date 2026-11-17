import { createGarden } from './garden.js';
import { STATIONS, stationOf, idOf } from './curriculum.js';
import { nextItem, stationItem, noteRound, record } from './scheduler.js';
import { lineNamed, named, stationLine } from './lines.js';
import { progress } from './progress.js';
import { say, repeatLast, hasHungarianVoice, onSpeaking, onMood, stopSpeaking, setMuted, setRepeatHandler } from './voice.js';
import { setScope } from './scope.js';
import { unlock as unlockAudio } from './audio.js';
import { emote, moodFor, introduce } from './robot.js';
import { renderMeter, flyStar } from './stars.js';
import { setupParent } from './parent.js';
import { friendsFor, friendById, floraFor, floraById, AREAS } from './friends.js';
import { withArt } from './hu.js';
import { createRewardTimer } from './reward-timer.js';
import { play } from './sounds.js';
import { nextGift, newRewardSession, roundStars, roundsToday, dayKey } from './economy.js';
import { giftById } from './gifts.js';
import { showGift, giftBusy, clearGifts, floatHeart, BOX_SVG } from './gift-moment.js';
import { REWARDS } from './rewards/index.js';
import { icon } from './icons.js';
import { applyCalm, setupPress } from './motion.js';
import { createBreakTimer } from './break-timer.js';
import { startRound, activeStory, storyById, openingLine, inviteLine, beatAfter, endingLine } from './story.js';
import { weekStart, weekGate } from './story-week.js';

const $ = id => document.getElementById(id);
// A felület saját ikonjai: a [data-icon] elemek emojija csak tartalék (ha a modul nem töltődne be)
for (const el of document.querySelectorAll('[data-icon]')) { const s = icon(el.dataset.icon); if (s) el.innerHTML = s; }
applyCalm(); setupPress();

// --- Nagyítás letiltása (iPaden a viewport-meta nem elég): csípés és gesztusok tiltva ---
['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
document.addEventListener('touchmove', e => { if (e.touches.length > 1 || (e.scale && e.scale !== 1)) e.preventDefault(); }, { passive: false });
document.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
// Dupla koppintásos nagyítás (a szülő jelezte: iPaden a ceruzával nagyított). A gyors, közeli második koppintás
// alapértelmezését letiltjuk; a mutató-események addigra lefutottak, a gombnak pedig magunk adjuk át a kattintást.
let lastTap = { t: -1e9, x: 0, y: 0 };
document.addEventListener('touchend', e => {
  if (e.touches.length || e.changedTouches.length !== 1) return;
  const c = e.changedTouches[0], t = e.timeStamp;
  if (e.target.closest?.('input, select, textarea')) { lastTap.t = -1e9; return; }
  if (t - lastTap.t < 450 && Math.hypot(c.clientX - lastTap.x, c.clientY - lastTap.y) < 70) {
    e.preventDefault(); lastTap.t = -1e9;
    // a kattintást magára a koppintott elemre adjuk (felbuborékol): a nem gomb célpontok (kártyák, lépések) is megkapják
    if (!e.target.closest?.('button:disabled')) e.target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: c.clientX, clientY: c.clientY }));
    return;
  }
  lastTap = { t, x: c.clientX, y: c.clientY };
}, { passive: false });
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) e.preventDefault(); });

const activities = {
  trace: () => import('./activities/trace.js'),
  count: () => import('./activities/count.js'),
  math: () => import('./activities/math.js'),
  pick: () => import('./activities/pick.js'),
  order: () => import('./activities/order.js'),
  memory: () => import('./activities/memory.js'),
  clap: () => import('./activities/clap.js'),
  draw: () => import('./activities/draw.js'),
  maze: () => import('./activities/maze.js'),
  dots: () => import('./activities/dots.js'),
  racs: () => import('./activities/racs.js'),
  matrica: () => import('./activities/matrica.js'),
  kep: () => import('./activities/kep.js'),
  seq: () => import('./activities/seq.js'),
  echo: () => import('./activities/echo.js'),
  feed: () => import('./activities/feed.js'),
  algo: () => import('./activities/algo.js'),
};
const rewards = REWARDS;                                   // a jutalomjátékok listája (js/rewards/index.js; a füstteszt is ezt járja végig)
// Hibanapló (csak ezen az eszközön): a szülői sarok megmutatja, ha valami elromlott
function logError(e, where) {
  try {
    const list = JSON.parse(localStorage.getItem('csillagkert_errors') || '[]');
    list.push({ t: new Date().toISOString(), where: String(where || ''), msg: String(e?.message || e).slice(0, 200) });
    localStorage.setItem('csillagkert_errors', JSON.stringify(list.slice(-20)));
  } catch (err) {}
}
window.addEventListener('error', ev => logError(ev.error || ev.message, 'ablak'));
window.addEventListener('unhandledrejection', ev => logError(ev.reason, 'ígéret'));

const sleep = ms => new Promise(r => setTimeout(r, ms));
const name = () => progress.get().name;
// Aznap egyre több csillag kell: az alapérték + 2 minden ma megjátszott jutalomkör után (legfeljebb 30); másnap elölről
const perReward = () => roundStars(progress.get().perReward, roundsToday(progress.get()));

// --- A mese (js/story.js): egy jutalomkörön át tart. A feladatokat továbbra is az ütemező választja; a mese csak keretet ad
// (a kör elején mire készülünk, egy állomás előtt miért csináljuk, a csillagokkal haladó lépések, a kapunál a vége).
const month = () => new Date().getMonth() + 1;
const storyOpen = () => { const s = activeStory(progress.get()); return !!s && !s.ended; };
function newStory() {
  const p = startRound(progress.get(), friendsFor(progress.get().total, progress.get().friends), month());
  if (p) progress.set(p);
  invited.clear();                                           // az új mese hívó mondatai is elhangozhatnak
  return p ? openingLine(progress.get(), 0) : '';
}
// ha a mese barátja a tóparton vagy a tanyán lakik, a kamera odasiklik, amíg Rozi meséli (kicsivel később vissza)
function showStoryFriend() {
  const st = activeStory(progress.get()), w = st && storyById(st.id).who[0], f = w && friendById(w);
  if (!f?.area || !garden) return;
  goArea(f.area); areaTimer = setTimeout(() => { if (!running && garden.area() === f.area) goArea(null); }, 6500);
}

let garden = null;
try { garden = createGarden($('garden')); window.__garden = garden; }
catch (e) { console.warn('3D nem indult el', e); } // a feladatok 3D nélkül is működnek

// --- Profilok: minden gyereknek saját állása és saját kertje van ---
// Váltás = újratöltés. A szülői sarokból választott gyerek azonosítója egy újratöltésen át a lapon marad (sessionStorage).
const PICK = 'csillagkert:pick';
function restart(pick) { try { if (pick) sessionStorage.setItem(PICK, pick); else sessionStorage.removeItem(PICK); } catch (e) {} location.reload(); }
try { const pick = sessionStorage.getItem(PICK); sessionStorage.removeItem(PICK); if (pick) progress.use(pick); } catch (e) {}
// A játszó gyerek kertje és csillagmérője. Több gyereknél csak a választás után töltjük fel (addig üres a kert).
function fillFor() {
  garden?.setAvatar(progress.avatar());                      // a saját unikornis a mostani ruhájában (ha már a kertben lakik)
  garden?.setStars(progress.get().total, progress.get().friends);
  garden?.setGifts(progress.get(), false);                  // kerti díszek, a Barátság fája, aranyvirágok
  renderTreasure();
  renderMeter(Math.min(progress.get().meter, perReward()), perReward());
  garden?.setDay(progress.get().meter / perReward());        // a nap a csillagmérővel együtt halad a naplemente felé
  const many = progress.list().length > 1;
  $('switch').hidden = !many; $('switch').textContent = progress.get().mark;
  renderAreaButtons();
}
// --- Szívek és a következő ajándék a fejlécben (olvasni nem kell: kép és koppintásra Rozi mondja) ---
$('gift-next').querySelector('.bow').innerHTML = BOX_SVG;
function renderTreasure() {
  const st = progress.get();
  $('gift-next').querySelector('.ic').innerHTML = nextGift(st).icon;          // a következő ajándék árnyképe
  $('hearts').querySelector('.n').textContent = String(st.hearts || 0);
  document.querySelector('.choice[data-game="dressup"]')?.classList.toggle('new', (st.newDress || []).length > 0);
}
const bump = el => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };
$('gift-next').addEventListener('click', () => { bump($('gift-next')); say(`A következő ajándékod: ${nextGift(progress.get()).nom}.`, { remember: false }); });
$('hearts').addEventListener('click', () => { bump($('hearts')); say('A szíveket a jó tettekért kapod. Ettől nő a Barátság fája.', { remember: false }); });

// --- Kertrészek: balra a tópart (azon túl Ausztrália), jobbra a tanya; a gombok mindig a szomszédos részre visznek ---
// A gombon az ottani első barát képe van (olvasni nem kell); a kert közepével szomszédos részen a 🐱 gomb visz vissza középre.
// A térkép jelei a szélső részeken is a helyükön maradnak és koppinthatók (a szülő kérésére): ott a kertrész barátai
// fölött lebegnek, de egyiket sem takarják el (fekvő és álló képernyőn mérve, lásd README).
let areaTimer = 0;
function goArea(id = null) {
  clearTimeout(areaTimer);
  garden?.goTo(id);
  renderAreaButtons();
}
function renderAreaButtons() {
  const here = garden?.area?.() || null, list = garden?.areas?.() || [];
  // a megállók balról jobbra: a lakott kertrészek és a kert közepe; a gombok a szomszédos megállóra visznek
  const stops = [{ id: null, x: 0 }, ...list].sort((p, q) => p.x - q.x);
  let i = stops.findIndex(s => s.id === here); if (i < 0) i = stops.findIndex(s => s.id === null);
  for (const [btn, side] of [[$('go-left'), -1], [$('go-right'), 1]]) {
    let to, icon = '', label = '';
    const a = stops[i + side];
    if (a && a.id === null) { to = ''; icon = '🐱'; label = 'Vissza a kert közepére'; }
    else if (a) {
      to = a.id; icon = a.friends.map(friendById).find(f => f?.emoji)?.emoji || ''; label = AREAS.find(r => r.id === a.id).name;
      if (!icon) icon = a.decor.length ? { svg: giftById(a.decor[0]).icon } : floraById(a.flora[0])?.emoji || '🌿';   // ahol még csak dísz vagy fa van
    }
    btn.hidden = to === undefined;
    if (to !== undefined) {                                  // ahol még csak kerti dísz áll, ott a dísz saját rajza van a gombon
      btn.dataset.to = to; const sp = btn.querySelector('span');
      if (typeof icon === 'object') sp.innerHTML = icon.svg; else sp.textContent = icon;
      btn.setAttribute('aria-label', label);
    }
  }
}
for (const id of ['go-left', 'go-right']) $(id).addEventListener('click', e => { unlockAudio(); goArea(e.currentTarget.dataset.to || null); });
if (progress.ready()) fillFor();
setupParent(restart);
$('switch').addEventListener('click', () => restart());      // a „Ki játszik?" képernyőre visz

// Állomások: a gyerek szabadon is választhat (a "Tovább" gomb a sorrendet követi)
$('stations').innerHTML = STATIONS.map(st => `<button class="station" data-st="${st.id}" aria-label="${st.name}"><span>${icon('st-' + st.id) || st.emoji}</span><small>${st.name}</small></button>`).join('');
$('stations').addEventListener('click', e => {
  const b = e.target.closest('.station'); if (!b) return;
  const item = stationItem(b.dataset.st); if (!item) return;
  runItem(item, b.dataset.st, 'station');
});
// Térkép: ha van 3D kert, az állomások jelei a kerti tereptárgyaikra kerülnek (ceruzatorony, házikó, almafa…).
// 3D nélkül a jelek alul, egy sorban maradnak.
function layoutPlaces() {
  const pts = garden?.places?.() || null;
  $('home').classList.toggle('map', !!pts);
  for (const b of $('stations').children) { const p = pts?.[b.dataset.st]; b.style.left = p ? p.x + 'px' : ''; b.style.top = p ? p.y + 'px' : ''; }
}
layoutPlaces();
window.addEventListener('resize', () => requestAnimationFrame(layoutPlaces));
window.addEventListener('orientationchange', () => setTimeout(layoutPlaces, 350));
window.visualViewport?.addEventListener('resize', () => requestAnimationFrame(layoutPlaces));

// Ha nincs magyar hang, azt már az indulóképernyőn jelezzük (a szülőnek)
const checkVoice = () => { $('voice-warn').hidden = hasHungarianVoice(); };
setTimeout(checkVoice, 800); setTimeout(checkVoice, 2500);

$('again').addEventListener('click', () => repeatLast());
$('robot').addEventListener('click', () => repeatLast());
onSpeaking(on => $('robot').classList.toggle('talking', on));
onMood(text => { const m = moodFor(text); if (m) emote(m[0], m[1]); });   // az arc a mondathoz igazodik

// Ha a gyerek mellé koppint (nem gombra / rajzterületre), Rozi emlékeztet a feladatra
let lastNudge = 0;
$('stage').addEventListener('pointerdown', e => {
  if (e.target.closest('button, canvas, .answers, .cards, .items, .mathrow, .animal, .hd, .feedpad, .agrid, .apal, .aprog, .food')) return;
  if (Date.now() - lastNudge < 3000) return;
  lastNudge = Date.now(); repeatLast();
});

// 1) Az első koppintás oldja fel a hangot (iOS). Több gyereknél ez a koppintás a „Ki játszik?" kártyára esik.
if (!progress.ready()) {
  const who = $('who');
  $('start-btn').hidden = true; who.hidden = false;
  const title = document.createElement('h2'); title.textContent = 'Ki játszik?'; who.append(title);
  const row = document.createElement('div'); row.className = 'who-row'; who.append(row);
  for (const p of progress.list()) {                         // a név és a jel szövegként kerül ki (nem HTML-ként)
    const b = document.createElement('button'); b.className = 'who-card'; b.dataset.id = p.id; b.setAttribute('aria-label', p.name || 'Játékos');
    const mark = document.createElement('span'); mark.className = 'mark'; mark.textContent = p.mark;
    const nm = document.createElement('b'); nm.textContent = p.name || '';
    const pals = document.createElement('small'); pals.textContent = friendsFor(p.total, p.friends).map(id => friendById(id).emoji).filter(Boolean).join('');
    b.append(mark, nm, pals);
    b.addEventListener('click', () => { unlockAudio(); if (progress.use(p.id)) { fillFor(); begin(); } });
    row.append(b);
  }
}
// Pihenő (törődés): a beállított aktív játékidő után két feladat között Rozi pihenőt javasol; csak a látható lap számít
const breaks = createBreakTimer({ minutes: () => (progress.ready() ? progress.get().breakMin : 0) });
$('break').__timer = breaks;                                // tesztekhez
document.addEventListener('visibilitychange', () => breaks.visible(document.visibilityState === 'visible'));
const BREAK_LINES = ['Pihenjünk egy kicsit! Igyál egy pohár vizet, és nyújtózz egy nagyot!', 'Ügyes voltál! Most tarts egy kis szünetet. Igyál egy kis vizet!', 'Sokat játszottunk! Állj fel, nyújtózz, és igyál egy pohár vizet!'];
function restBreak() {
  return new Promise(resolve => {
    $('break').hidden = false; garden?.pause(true);
    say(named(BREAK_LINES[Math.floor(Math.random() * BREAK_LINES.length)], name(), Math.random, 0), { remember: false });
    $('break-go').onclick = () => { $('break').hidden = true; garden?.pause(false); breaks.rested(); stopSpeaking(); resolve(); };
  });
}
$('start-btn').addEventListener('click', begin);
async function begin() {
  breaks.start();
  unlockAudio();                                             // a hangmotor felhasználói koppintásra indul (iOS)
  try { navigator.storage?.persist?.(); } catch (e) {}       // kérjük, hogy a rendszer ne ürítse a mentést (nem mindenhol érhető el)
  $('start').hidden = true; $('hud').hidden = false; $('robot').hidden = false;
  const justIntro = !progress.get().introDone;
  if (justIntro) await introduce();                          // Rozi bemutatkozik (egyszer)
  if (!name() && !progress.get().nameAsked) await askName();
  // a kör meséje: új kör elején a kezdete, félbehagyott körnél egy rövid emlékeztető (teli mérőnél a kapunál a vége szól)
  const st = progress.get(), cur = activeStory(st);
  let open = st.meter >= perReward() ? '' : cur && !cur.ended ? openingLine(st, st.meter) : newStory();
  // a nagy mese (js/story-week.js): a nap első indulásakor a mai fejezet; ilyenkor a kör meséjéből csak a címe szól,
  // hogy Rozi ne beszéljen túl sokat (köszönés + két mondat fejezet + egy mondat kör)
  if (open) {
    const wk = weekStart(progress.get(), friendsFor(progress.get().total, progress.get().friends), dayKey());
    if (wk) {
      progress.set(wk.weeksUsed ? { week: wk.week, weeksUsed: wk.weeksUsed } : { week: wk.week });
      const rs = activeStory(progress.get());
      open = rs && !rs.ended ? `${wk.text} ${storyById(rs.id).title}` : wk.text;
    }
  }
  const hello = named(justIntro ? 'Örülök, hogy megismertelek{, N}!' : 'Szia{, N}!', name(), Math.random, 1);
  say(open ? `${hello} ${open}` : justIntro ? named('Örülök, hogy megismertelek{, N}! Gyere, fedezzük fel együtt a világot!', name(), Math.random, 1) : lineNamed('hello', name(), Math.random, 1), { remember: false });
  if (open) showStoryFriend();
  if (progress.get().meter >= perReward()) openReward(); else $('home').hidden = false;
}

// Név bekérése az elején (átugorható)
function askName() {
  return new Promise(resolve => {
    $('name-screen').hidden = false;
    say(progress.get().introDone ? 'Hogy hívnak?' : 'Hogy hívnak?', { remember: false });
    const done = save => {
      if (save && $('name-input').value.trim()) progress.set({ name: $('name-input').value.trim() });
      progress.set({ nameAsked: true });
      $('name-screen').hidden = true; resolve();
    };
    $('name-ok').onclick = () => done(true);
    $('name-skip').onclick = () => done(false);
    $('name-input').onkeydown = e => { if (e.key === 'Enter') done(true); };
  });
}

// 2) Egy feladat lefuttatása: "Tovább" (sorrend) vagy szabadon választott állomás. Az X gombbal kiléphet.
let currentAbort = null, running = false;
const invited = new Set();                                   // ebben az ülésben már "meghívott" állomások
async function runItem(item, station, via) {
  if (running) return;                                       // dupla koppintás ne indítson két feladatot
  running = true;
  if (breaks.due()) { $('home').hidden = true; await restBreak(); }   // két feladat között: pihenő, utána indul a választott feladat
  const inGarden = item.type === 'feed';                     // az etetés a kertben zajlik: ott a kert nem áll meg
  goArea(null);                                              // minden feladat a kert közepéről indul (a tópartról / tanyáról is)
  const before = new Set(friendsFor(progress.get().total, progress.get().friends));
  const fedNew = inGarden && !before.has(item.kind) ? [item.kind] : [];   // első etetés: ő is új lakó (a kertrészbe költözik)
  setMuted(false); garden?.pause(!inGarden);
  if (inGarden) progress.addFriend(item.kind);               // akit etetünk, az mostantól a kertben lakik
  $('home').hidden = true;
  const ac = new AbortController(); setScope(ac.signal);     // a feladat minden várakozása ehhez a jelhez kötött
  let res = 'error', outcome = {};
  try {
    const mod = await activities[item.type]();
    $('stage').hidden = false; $('stage-x').hidden = false;
    const aborted = new Promise(r => { currentAbort = () => r('abort'); });
    // ülésenként egyszer egy-egy állomáson: meleg hívás a felfedezésre (etetésnél nem: ott az állat beszél)
    let go = 'go';
    if (!inGarden && !invited.has(station)) { invited.add(station); const t = inviteLine(progress.get(), station) || stationLine(station, name()); if (t) go = await Promise.race([say(t, { remember: false }).then(() => 'go'), aborted]); }
    res = go === 'abort' ? 'abort' : await Promise.race([Promise.resolve(mod.run($('stage'), item, { signal: ac.signal, garden })).then(r => { outcome = r && typeof r === 'object' ? r : {}; return 'done'; }), aborted]);
  } catch (e) { console.error('Feladat-hiba', e); logError(e, item.type); res = 'error'; }
  currentAbort = null; setRepeatHandler(null);
  if (res !== 'done') { ac.abort(); stopSpeaking(); }        // megszakítás vagy hiba: a feladat azonnal és teljesen megáll
  setScope(null);
  $('stage-x').hidden = true; $('stage').hidden = true; $('stage').innerHTML = ''; $('stage').classList.remove('see-garden');
  garden?.endFeed(); garden?.pause(false);                   // kész, megszakítás, hiba: a kamera mindig visszatér a kertre
  running = false;
  if (res !== 'done') {
    progress.skip(idOf(item)); record(item, { aborted: true }); if (via === 'next') noteRound(item);     // legközelebb más feladat jön
    renderAreaButtons();                                     // a félbehagyott első etetés után is ott a gomb az új lakó kertrészéhez
    $('home').hidden = false;
    setTimeout(() => say(res === 'abort' ? 'Semmi baj! Válassz mást, vagy játssz, ha kedved van.' : 'Semmi baj! Válasszunk mást!', { remember: false }), 400);
    return;
  }
  const here = new Set(friendsFor(progress.get().total, progress.get().friends)), hereFlora = new Set(floraFor(progress.get().total));
  const meter = progress.addStar(station, idOf(item));
  if (inGarden) { progress.taskHeart(); floatHeart(); }     // etetés = gondoskodás: egy szív a Barátság fájának
  const starGift = progress.starGift();                      // minden 20. csillag egy ajándék (a mentés már most megtörténik)
  renderTreasure();
  record(item, { wrong: outcome.wrong || 0, help: outcome.help || 0 });   // az ütemező ebből hangolja a következő feladatot
  if (via === 'next') noteRound(item);
  const arrived = friendsFor(progress.get().total, progress.get().friends).filter(f => !here.has(f));   // ezzel a csillaggal érkezett barát
  const grown = floraFor(progress.get().total).filter(f => !hereFlora.has(f)).map(floraById);          // ezzel a csillaggal nőtt fa
  garden?.setStars(progress.get().total, progress.get().friends);                 // az új barát besétál, megszólal, szívek szállnak
  garden?.setDay(Math.min(meter, perReward()) / perReward());
  garden?.cheer();
  // A tópartra / tanyára érkező új barátot (vagy ott nőtt fát) megnézzük: a kamera odasiklik, kicsivel később vissza
  // (ha a gyerek közben nem választott mást)
  const newcomer = [...[...arrived, ...fedNew].map(friendById), ...grown].find(f => f.area);
  if (newcomer && garden) {
    goArea(newcomer.area);
    areaTimer = setTimeout(() => { if (!running && garden.area() === newcomer.area) goArea(null); }, 6500);
  } else renderAreaButtons();
  // Új barátnál Rozi egy mondatban bejelenti; etetés után különben hallgat (ott az állat a saját hangján köszöni meg)
  if (arrived.length) say(`Új barát érkezett: ${withArt(friendById(arrived[0]).name)}!`, { remember: false });
  else if (grown.length) say(`Új fa nőtt a kertben: ${withArt(grown[0].name)}!`, { remember: false });
  else if (!inGarden) {
    const b = beatAfter(progress.get(), meter, perReward());   // a mese a csillagokkal halad: néha egy lépése szól a dicséret helyett
    if (b) { progress.set({ story: b.story }); say(b.text, { remember: false }); }
    else if (meter < perReward() || !storyOpen()) say(lineNamed('star', name(), Math.random, meter >= perReward() ? 0.6 : 0.3), { remember: false });
  }
  await flyStar(Math.min(meter, perReward()) - 1, Math.min(meter, perReward()));
  garden?.setGifts(progress.get(), true);                    // az etetés szíve a Barátság fáján
  if (starGift) {
    await showGift(starGift, { name: name() });
    garden?.setGifts(progress.get(), true);
    const nd = progress.takeNewDecor();                      // a kertbe kapott dísz: a kamera odasiklik és megmutatja
    if (nd.length && garden && !newcomer) {
      const ar = garden.decorArea(nd[0]); goArea(ar);
      areaTimer = setTimeout(() => { if (!running && garden.area() === ar) goArea(null); }, 6500);
    }
  } else await sleep(900);
  if (meter >= perReward()) openReward(); else $('home').hidden = false;
}
$('stage-x').addEventListener('click', () => currentAbort?.());
$('next').addEventListener('click', () => {
  const item = nextItem();
  runItem(item, stationOf(item), 'next');
});

// 3) Jutalom: elég csillag után egy időre szóló játék, utána magától visszatér
function openReward() {
  $('reward').hidden = false;
  renderTreasure();
  const e = endingLine(progress.get());                       // a kör meséjének vége (egyszer), utána a választás
  if (e) { progress.set({ story: e.story }); garden?.cheer(); }
  // a nagy mese mai fejezetének izgalmas vége (az aznapi első kapunál); az ötödik fejezetnél a nagy mese vége a kör vége helyett
  const g = weekGate(progress.get());
  if (g) { progress.set({ week: g.week }); if (!e) garden?.cheer(); }
  const tale = [g?.finale ? '' : e?.text, g?.text].filter(Boolean).join(' ');
  say(tale ? `${tale} ${named('Válassz egy játékot{, N}!', name(), Math.random, 0.5)}` : named('Ügyes voltál{, N}! Válassz egy játékot!', name(), Math.random, 0.5));
}
$('reward-x').addEventListener('click', () => {      // ha nem akar játszani: a megszerzett csillagok megmaradnak
  $('reward').hidden = true; $('home').hidden = false;
  stopSpeaking(); say('Semmi baj! Minden megmarad, játszhatsz később is.', { remember: false });
});
let stopGame = null, rewardTimer = null, byeTimer = 0, rewardSess = null;
// a játék törzséből minden teszt-kapaszkodót (__ow, __race, __busy…) leveszünk, hogy a lezárt jelenet ne maradjon a memóriában
const clearGameBody = () => { const b = $('game-body'); b.innerHTML = ''; for (const k of Object.keys(b)) if (k.startsWith('__')) delete b[k]; };
document.querySelectorAll('.choice').forEach(btn => btn.addEventListener('click', async () => {
  if (!$('game').hidden) return;                             // már fut egy játék
  setMuted(false); garden?.pause(true); unlockAudio();
  $('reward').hidden = true; $('game').hidden = false; $('game-soon').hidden = true; $('game-bye').hidden = true;
  try {
    const mod = await rewards[btn.dataset.game]();
    // Egy jutalomkör: legfeljebb egy ajándék (az első igazi játék-pillanatnál) és játékonként korlátos számú szív (js/economy.js)
    const src = btn.dataset.game; rewardSess = newRewardSession();
    const sess = rewardSess;
    const w = progress.world();
    const ctx = {
      // a Varázsvilág saját világa: a megtalált nevezetességek és a kaland állása azonnal mentődik
      world: {
        seed: w.seed, found: w.found.slice(), adv: { ...w.adv }, met: w.met.slice(), onFind: lm => progress.foundLandmark(lm), onPick: () => progress.pickItem(),
        onMeet: id => progress.metCreature(id),
        onAdventure() { if (sess !== rewardSess) return null; const g = progress.adventureDone(sess); if (g) { renderTreasure(); showGift(g, { name: name() }); } return g; },
      },
      avatar: progress.avatar(),                             // a saját unikornis ruhája (futás, verseny, Barátom)
      gift() { if (sess !== rewardSess) return null; const g = progress.rewardGift(sess, src); if (g) { renderTreasure(); showGift(g, { name: name() }); } return g; },
      heart(at) { if (sess !== rewardSess) return false; const ok = progress.rewardHeart(sess, src); if (ok) { renderTreasure(); floatHeart(at); } return ok; },
    };
    stopGame = mod.run($('game-body'), ctx);
    // szelíd vége: egy perccel előtte szól, a kör közepén nem vág bele (legfeljebb 45 mp-et vár), utána búcsúkártya
    rewardTimer = createRewardTimer({
      minutes: progress.get().rewardMinutes,
      isBusy: () => !!$('game-body').__busy?.() || giftBusy(),   // az ajándék-pillanat alatt sem ér véget
      onWarn: () => { $('game-soon').hidden = false; say('Még egy kicsit játszunk, aztán hazamegyünk!', { remember: false }); },
      onEnd: goodbye,
    });
  } catch (e) {
    console.error('Játék-hiba', e); logError(e, btn.dataset.game);
    clearGameBody(); $('game').hidden = true; $('reward').hidden = false; garden?.pause(false);
    say('Semmi baj! Válasszunk másik játékot!', { remember: false });
  }
}));
$('game-back').addEventListener('click', () => endReward());
function goodbye() {
  $('game-bye').hidden = false; play('yay');
  say('Ez nagyon jó volt! Most hazamegyünk a kertbe.', { remember: false });
  byeTimer = setTimeout(() => endReward(true), 7000);
}
$('game-bye-home').addEventListener('click', () => endReward(true));

function endReward(fromBye = false) {
  if ($('game').hidden) return;
  rewardTimer?.stop(); rewardTimer = null; clearTimeout(byeTimer);
  clearGifts(); rewardSess = null;                           // az ajándék-pillanat is azonnal eltűnik (a nyeremény már mentve)
  try { stopGame?.(); } catch (e) {}
  stopGame = null;
  clearGameBody(); $('game').hidden = true; $('game-soon').hidden = true; $('game-bye').hidden = true; garden?.pause(false);
  garden?.setAvatar(progress.avatar());                      // az öltöztetőben választott ruha a kertben is látszik
  garden?.setGifts(progress.get(), true); renderTreasure();  // a megnyert dísz és a szívek most bukkannak fel a kertben
  const nd = progress.takeNewDecor();
  if (nd.length && garden) { const ar = garden.decorArea(nd[0]); goArea(ar); areaTimer = setTimeout(() => { if (!running && garden.area() === ar) goArea(null); }, 6500); }
  progress.completeReward();                       // a következő jutalomhoz több csillag kell
  progress.resetMeter(); renderMeter(0, perReward());
  $('home').hidden = false;
  const open = newStory();                                   // új kör, új mese
  say(open || (fromBye ? named('Gyere{, N}, fedezzünk fel még valamit együtt!', name(), Math.random, 0.5) : lineNamed('again', name())));
  if (open && !nd.length) showStoryFriend();
}
