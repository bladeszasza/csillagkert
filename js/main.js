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
import { friendsFor, friendById, AREAS } from './friends.js';
import { withArt } from './hu.js';
import { createRewardTimer } from './reward-timer.js';
import { play } from './sounds.js';
import { nextGift, newRewardSession } from './economy.js';
import { giftById } from './gifts.js';
import { showGift, giftBusy, clearGifts, floatHeart, BOX_SVG } from './gift-moment.js';
import { REWARDS } from './rewards/index.js';
import { icon } from './icons.js';
import { applyCalm, setupPress } from './motion.js';

const $ = id => document.getElementById(id);
// A felület saját ikonjai: a [data-icon] elemek emojija csak tartalék (ha a modul nem töltődne be)
for (const el of document.querySelectorAll('[data-icon]')) { const s = icon(el.dataset.icon); if (s) el.innerHTML = s; }
applyCalm(); setupPress();

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
    else { const a = list.find(r => Math.sign(r.x) === side); if (a) { to = a.id; icon = a.friends.length ? friendById(a.friends[0]).emoji : ''; label = AREAS.find(r => r.id === a.id).name; if (!icon) icon = { svg: giftById(a.decor[0]).icon }; } }
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
  say(justIntro ? named('Örülök, hogy megismertelek{, N}! Gyere, fedezzük fel együtt a világot!', name(), Math.random, 1) : lineNamed('hello', name(), Math.random, 1), { remember: false });
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
    if (!inGarden && !invited.has(station)) { invited.add(station); const t = stationLine(station, name()); if (t) go = await Promise.race([say(t, { remember: false }).then(() => 'go'), aborted]); }
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
  const here = new Set(friendsFor(progress.get().total, progress.get().friends));
  const meter = progress.addStar(station, idOf(item));
  if (inGarden) { progress.taskHeart(); floatHeart(); }     // etetés = gondoskodás: egy szív a Barátság fájának
  const starGift = progress.starGift();                      // minden 20. csillag egy ajándék (a mentés már most megtörténik)
  renderTreasure();
  record(item, { wrong: outcome.wrong || 0, help: outcome.help || 0 });   // az ütemező ebből hangolja a következő feladatot
  if (via === 'next') noteRound(item);
  const arrived = friendsFor(progress.get().total, progress.get().friends).filter(f => !here.has(f));   // ezzel a csillaggal érkezett barát
  garden?.setStars(progress.get().total, progress.get().friends);                 // az új barát besétál, megszólal, szívek szállnak
  garden?.setDay(Math.min(meter, perReward()) / perReward());
  garden?.cheer();
  // A tópartra / tanyára érkező új barátot megnézzük: a kamera odasiklik, kicsivel később vissza (ha a gyerek közben nem választott mást)
  const newcomer = [...arrived, ...fedNew].map(friendById).find(f => f.area);
  if (newcomer && garden) {
    goArea(newcomer.area);
    areaTimer = setTimeout(() => { if (!running && garden.area() === newcomer.area) goArea(null); }, 6500);
  } else renderAreaButtons();
  // Új barátnál Rozi egy mondatban bejelenti; etetés után különben hallgat (ott az állat a saját hangján köszöni meg)
  if (arrived.length) say(`Új barát érkezett: ${withArt(friendById(arrived[0]).name)}!`, { remember: false });
  else if (!inGarden) say(lineNamed('star', name(), Math.random, meter >= perReward() ? 0.6 : 0.3), { remember: false });
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
  say(named('Ügyes voltál{, N}! Válassz egy játékot!', name(), Math.random, 0.5));
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
    const ctx = {
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
  say(fromBye ? named('Gyere{, N}, fedezzünk fel még valamit együtt!', name(), Math.random, 0.5) : lineNamed('again', name()));
}
