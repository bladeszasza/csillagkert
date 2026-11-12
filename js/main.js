import { createGarden } from './garden.js';
import { STATIONS, stationOf, idOf } from './curriculum.js';
import { nextItem, stationItem, noteRound } from './queue.js';
import { progress } from './progress.js';
import { say, repeatLast, hasHungarianVoice, onSpeaking, onMood, stopSpeaking, setMuted, setRepeatHandler } from './voice.js';
import { setScope } from './scope.js';
import { unlock as unlockAudio } from './audio.js';
import { emote, moodFor, introduce } from './robot.js';
import { renderMeter, flyStar } from './stars.js';
import { setupParent } from './parent.js';
import { friendsFor, friendById, AREAS } from './friends.js';
import { withArt } from './hu.js';

const $ = id => document.getElementById(id);

// --- Nagyítás letiltása (iPaden a viewport-meta nem elég): csípés és gesztusok tiltva ---
['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
document.addEventListener('touchmove', e => { if (e.touches.length > 1 || (e.scale && e.scale !== 1)) e.preventDefault(); }, { passive: false });
document.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
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
  betu: () => import('./activities/betu.js'),
  seq: () => import('./activities/seq.js'),
  music: () => import('./activities/music.js'),
  feed: () => import('./activities/feed.js'),
  algo: () => import('./activities/algo.js'),
};
const rewards = {
  sparkhorn: () => import('./rewards/sparkhorn.js'),
  bubbles: () => import('./rewards/bubbles.js'),
  foodcatch: () => import('./rewards/foodcatch.js'),
  healthy: () => import('./rewards/healthy.js'),
  race: () => import('./rewards/race.js'),
  pet: () => import('./rewards/pet.js'),
  openworld: () => import('./rewards/openworld.js'),
  dressup: () => import('./rewards/dressup.js'),
};
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
const PRAISE = ['Ügyes vagy!', 'Nagyszerű!', 'Szuper!', 'Csodás!', 'Ez az!'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const name = () => progress.get().name;
// Egyre több csillag kell: az alapérték + 2 minden megjátszott jutalomkör után (legfeljebb 30)
const perReward = () => Math.min(30, (progress.get().perReward || 10) + 2 * (progress.get().rewardsDone || 0));

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
  garden?.setStars(progress.get().total, progress.get().friends);
  renderMeter(Math.min(progress.get().meter, perReward()), perReward());
  garden?.setDay(progress.get().meter / perReward());        // a nap a csillagmérővel együtt halad a naplemente felé
  const many = progress.list().length > 1;
  $('switch').hidden = !many; $('switch').textContent = progress.get().mark;
  renderAreaButtons();
}
// --- Kertrészek: a tópart (balra) és a tanya (jobbra) lakóihoz egy-egy gomb visz, a kamera átsiklik ---
// A gombon az ottani első barát képe van (olvasni nem kell); a szélső részen a másik oldali 🐱 gomb visz vissza a kert közepére.
let areaTimer = 0, awayTimer = 0;
function goArea(id = null) {
  clearTimeout(areaTimer); clearTimeout(awayTimer);
  const ms = garden?.goTo(id) || 0;
  // a térkép jelei induláskor eltűnnek, visszafelé csak a siklás végén jönnek elő (ne lebegjenek rossz tárgyak fölött)
  if (garden?.area?.()) $('home').classList.add('away');
  else awayTimer = setTimeout(() => $('home').classList.remove('away'), Math.max(0, ms - 300));
  renderAreaButtons();
}
function renderAreaButtons() {
  const here = garden?.area?.() || null, list = garden?.areas?.() || [];
  const hereX = AREAS.find(r => r.id === here)?.x || 0;
  for (const [btn, side] of [[$('go-left'), -1], [$('go-right'), 1]]) {
    let to, icon = '', label = '';
    if (here) { if (Math.sign(hereX) !== side) { to = ''; icon = '🐱'; label = 'Vissza a kert közepére'; } }
    else { const a = list.find(r => Math.sign(r.x) === side); if (a) { to = a.id; icon = friendById(a.friends[0]).emoji; label = AREAS.find(r => r.id === a.id).name; } }
    btn.hidden = to === undefined;
    if (to !== undefined) { btn.dataset.to = to; btn.querySelector('span').textContent = icon; btn.setAttribute('aria-label', label); }
  }
}
for (const id of ['go-left', 'go-right']) $(id).addEventListener('click', e => { unlockAudio(); goArea(e.currentTarget.dataset.to || null); });
if (progress.ready()) fillFor();
setupParent(restart);
$('switch').addEventListener('click', () => restart());      // a „Ki játszik?" képernyőre visz

// Állomások: a gyerek szabadon is választhat (a "Tovább" gomb a sorrendet követi)
$('stations').innerHTML = STATIONS.map(st => `<button class="station" data-st="${st.id}" aria-label="${st.name}"><span>${st.emoji}</span><small>${st.name}</small></button>`).join('');
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
    const pals = document.createElement('small'); pals.textContent = friendsFor(p.total, p.friends).map(id => friendById(id).emoji).join('');
    b.append(mark, nm, pals);
    b.addEventListener('click', () => { unlockAudio(); if (progress.use(p.id)) { fillFor(); begin(); } });
    row.append(b);
  }
}
$('start-btn').addEventListener('click', begin);
async function begin() {
  unlockAudio();                                             // a hangmotor felhasználói koppintásra indul (iOS)
  try { navigator.storage?.persist?.(); } catch (e) {}       // kérjük, hogy a rendszer ne ürítse a mentést (nem mindenhol érhető el)
  $('start').hidden = true; $('hud').hidden = false; $('robot').hidden = false;
  const justIntro = !progress.get().introDone;
  if (justIntro) await introduce();                          // Rozi bemutatkozik (egyszer)
  if (!name() && !progress.get().nameAsked) await askName();
  say(justIntro ? (name() ? `Örülök, ${name()}! Gyűjtsünk együtt csillagokat!` : 'Gyűjtsünk együtt csillagokat!') : (name() ? `Szia ${name()}! Gyűjtsünk csillagokat!` : 'Szia! Gyűjtsünk csillagokat!'), { remember: false });
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
async function runItem(item, station, via) {
  if (running) return;                                       // dupla koppintás ne indítson két feladatot
  running = true;
  const inGarden = item.type === 'feed';                     // az etetés a kertben zajlik: ott a kert nem áll meg
  goArea(null);                                              // minden feladat a kert közepéről indul (a tópartról / tanyáról is)
  setMuted(false); garden?.pause(!inGarden);
  if (inGarden) progress.addFriend(item.kind);               // akit etetünk, az mostantól a kertben lakik
  $('home').hidden = true;
  const ac = new AbortController(); setScope(ac.signal);     // a feladat minden várakozása ehhez a jelhez kötött
  let res = 'error';
  try {
    const mod = await activities[item.type]();
    $('stage').hidden = false; $('stage-x').hidden = false;
    const aborted = new Promise(r => { currentAbort = () => r('abort'); });
    res = await Promise.race([Promise.resolve(mod.run($('stage'), item, { signal: ac.signal, garden })).then(() => 'done'), aborted]);
  } catch (e) { console.error('Feladat-hiba', e); logError(e, item.type); res = 'error'; }
  currentAbort = null; setRepeatHandler(null);
  if (res !== 'done') { ac.abort(); stopSpeaking(); }        // megszakítás vagy hiba: a feladat azonnal és teljesen megáll
  setScope(null);
  $('stage-x').hidden = true; $('stage').hidden = true; $('stage').innerHTML = ''; $('stage').classList.remove('see-garden');
  garden?.endFeed(); garden?.pause(false);                   // kész, megszakítás, hiba: a kamera mindig visszatér a kertre
  running = false;
  if (res !== 'done') {
    progress.skip(idOf(item)); if (via === 'next') noteRound(item);     // legközelebb más feladat jön
    $('home').hidden = false;
    setTimeout(() => say(res === 'abort' ? 'Semmi baj! Válassz mást, vagy játssz, ha kedved van.' : 'Semmi baj! Válasszunk mást!', { remember: false }), 400);
    return;
  }
  const here = new Set(friendsFor(progress.get().total, progress.get().friends));
  const meter = progress.addStar(station, idOf(item));
  if (via === 'next') noteRound(item);
  const arrived = friendsFor(progress.get().total, progress.get().friends).filter(f => !here.has(f));   // ezzel a csillaggal érkezett barát
  garden?.setStars(progress.get().total, progress.get().friends);                 // az új barát besétál, megszólal, szívek szállnak
  garden?.setDay(Math.min(meter, perReward()) / perReward());
  garden?.cheer();
  // A tópartra / tanyára érkező új barátot megnézzük: a kamera odasiklik, kicsivel később vissza (ha a gyerek közben nem választott mást)
  const newcomer = arrived.map(friendById).find(f => f.area);
  if (newcomer && garden) {
    goArea(newcomer.area);
    areaTimer = setTimeout(() => { if (!running && garden.area() === newcomer.area) goArea(null); }, 6500);
  } else renderAreaButtons();
  // Új barátnál Rozi egy mondatban bejelenti; etetés után különben hallgat (ott az állat a saját hangján köszöni meg)
  if (arrived.length) say(`Új barát érkezett: ${withArt(friendById(arrived[0]).name)}!`, { remember: false });
  else if (!inGarden) say(PRAISE[progress.get().total % PRAISE.length] + (name() && meter >= perReward() ? ' ' + name() + '!' : ''), { remember: false });
  await flyStar(Math.min(meter, perReward()) - 1, Math.min(meter, perReward()));
  await sleep(900);
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
  say(`Megvan mind a ${perReward()} csillag! Válassz egy játékot!`);
}
$('reward-x').addEventListener('click', () => {      // ha nem akar játszani: a megszerzett csillagok megmaradnak
  $('reward').hidden = true; $('home').hidden = false;
  stopSpeaking(); say('Semmi baj! A csillagaid megvannak, játszhatsz később is.', { remember: false });
});
let stopGame = null, gameTimer = null;
document.querySelectorAll('.choice').forEach(btn => btn.addEventListener('click', async () => {
  if (!$('game').hidden) return;                             // már fut egy játék
  setMuted(false); garden?.pause(true); unlockAudio();
  $('reward').hidden = true; $('game').hidden = false;
  try {
    const mod = await rewards[btn.dataset.game]();
    stopGame = mod.run($('game-body'), { onGift: id => progress.addGift(id) });
    gameTimer = setTimeout(endReward, progress.get().rewardMinutes * 60 * 1000);
  } catch (e) {
    console.error('Játék-hiba', e); logError(e, btn.dataset.game);
    $('game-body').innerHTML = ''; $('game').hidden = true; $('reward').hidden = false; garden?.pause(false);
    say('Semmi baj! Válasszunk másik játékot!', { remember: false });
  }
}));
$('game-back').addEventListener('click', endReward);

async function endReward() {
  clearTimeout(gameTimer);
  try { stopGame?.(); } catch (e) {}
  stopGame = null;
  $('game-body').innerHTML = ''; $('game').hidden = true; garden?.pause(false);
  progress.completeReward();                       // a következő jutalomhoz több csillag kell
  progress.resetMeter(); renderMeter(0, perReward());
  $('home').hidden = false;
  say('Ez nagyon jó volt! Gyűjtsünk még csillagokat!');
}
