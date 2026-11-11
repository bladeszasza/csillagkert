import { createGarden } from './garden.js';
import { STATIONS, stationOf, idOf } from './curriculum.js';
import { nextItem, stationItem, noteRound } from './queue.js';
import { progress } from './progress.js';
import { say, repeatLast, hasHungarianVoice, onSpeaking, onMood, stopSpeaking, setMuted } from './voice.js';
import { emote, moodFor, introduce } from './robot.js';
import { renderMeter, flyStar } from './stars.js';
import { setupParent } from './parent.js';

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
const PRAISE = ['Ügyes vagy!', 'Nagyszerű!', 'Szuper!', 'Csodás!', 'Ez az!'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const name = () => progress.get().name;
// Egyre több csillag kell: az alapérték + 2 minden megjátszott jutalomkör után (legfeljebb 30)
const perReward = () => Math.min(30, (progress.get().perReward || 10) + 2 * (progress.get().rewardsDone || 0));

let garden = null;
try { garden = createGarden($('garden')); garden.setStars(progress.get().total); }
catch (e) { console.warn('3D nem indult el', e); } // a feladatok 3D nélkül is működnek

setupParent(() => location.reload());
renderMeter(Math.min(progress.get().meter, perReward()), perReward());

// Állomások: a gyerek szabadon is választhat (a "Tovább" gomb a sorrendet követi)
$('stations').innerHTML = STATIONS.map(st => `<button class="station" data-st="${st.id}" aria-label="${st.name}"><span>${st.emoji}</span><small>${st.name}</small></button>`).join('');
$('stations').addEventListener('click', e => {
  const b = e.target.closest('.station'); if (!b) return;
  const item = stationItem(b.dataset.st); if (!item) return;
  runItem(item, b.dataset.st, 'station');
});

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

// 1) Az első koppintás oldja fel a hangot (iOS)
$('start-btn').addEventListener('click', async () => {
  $('start').hidden = true; $('hud').hidden = false; $('robot').hidden = false;
  const justIntro = !progress.get().introDone;
  if (justIntro) await introduce();                          // Rozi bemutatkozik (egyszer)
  if (!name() && !progress.get().nameAsked) await askName();
  say(justIntro ? (name() ? `Örülök, ${name()}! Gyűjtsünk együtt csillagokat!` : 'Gyűjtsünk együtt csillagokat!') : (name() ? `Szia ${name()}! Gyűjtsünk csillagokat!` : 'Szia! Gyűjtsünk csillagokat!'), { remember: false });
  if (progress.get().meter >= perReward()) openReward(); else $('home').hidden = false;
});

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
let currentAbort = null;
async function runItem(item, station, via) {
  setMuted(false); garden?.pause(true);
  $('home').hidden = true;
  const mod = await activities[item.type]();
  $('stage').hidden = false; $('stage-x').hidden = false;
  const aborted = new Promise(r => { currentAbort = () => r('abort'); });
  const res = await Promise.race([mod.run($('stage'), item).then(() => 'done'), aborted]);
  currentAbort = null;
  $('stage-x').hidden = true; $('stage').hidden = true; $('stage').innerHTML = ''; garden?.pause(false);
  if (res === 'abort') {
    stopSpeaking(); setMuted(true); $('home').hidden = false;           // a megszakított feladat ne beszéljen tovább
    setTimeout(() => { setMuted(false); say('Semmi baj! Válassz mást, vagy játssz, ha kedved van.', { remember: false }); }, 700);
    return;
  }
  const meter = progress.addStar(station, idOf(item));
  if (via === 'next') noteRound(item);
  garden?.setStars(progress.get().total);
  garden?.cheer();
  say(PRAISE[progress.get().total % PRAISE.length] + (name() && meter >= perReward() ? ' ' + name() + '!' : ''), { remember: false });
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
  setMuted(false); garden?.pause(true);
  $('reward').hidden = true; $('game').hidden = false;
  const mod = await rewards[btn.dataset.game]();
  stopGame = mod.run($('game-body'), { onGift: id => progress.addGift(id) });
  gameTimer = setTimeout(endReward, progress.get().rewardMinutes * 60 * 1000);
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
