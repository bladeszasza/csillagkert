import { createGarden } from './garden.js';
import { CURRICULUM, STATIONS, itemsOf, stationOf } from './curriculum.js';
import { progress } from './progress.js';
import { say, repeatLast, hasHungarianVoice } from './voice.js';
import { renderMeter, flyStar } from './stars.js';
import { setupParent } from './parent.js';

const $ = id => document.getElementById(id);
const activities = {
  trace: () => import('./activities/trace.js'),
  count: () => import('./activities/count.js'),
  pick: () => import('./activities/pick.js'),
  order: () => import('./activities/order.js'),
  memory: () => import('./activities/memory.js'),
  clap: () => import('./activities/clap.js'),
  draw: () => import('./activities/draw.js'),
  betu: () => import('./activities/betu.js'),
};
const rewards = {
  sparkhorn: () => import('./rewards/sparkhorn.js'),
  bubbles: () => import('./rewards/bubbles.js'),
  starcatch: () => import('./rewards/starcatch.js'),
  dressup: () => import('./rewards/dressup.js'),
};
const PRAISE = ['Ügyes vagy!', 'Nagyszerű!', 'Szuper!', 'Csodás!', 'Ez az!'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const name = () => progress.get().name;

let garden = null;
try { garden = createGarden($('garden')); garden.setStars(progress.get().total); }
catch (e) { console.warn('3D nem indult el', e); } // a feladatok 3D nélkül is működnek

setupParent(() => location.reload());
const perReward = () => progress.get().perReward || 3;
renderMeter(Math.min(progress.get().meter, perReward()), perReward());

// Állomások: a gyerek szabadon is választhat (a "Tovább" gomb a sorrendet követi)
$('stations').innerHTML = STATIONS.map(st => `<button class="station" data-st="${st.id}" aria-label="${st.name}"><span>${st.emoji}</span><small>${st.name}</small></button>`).join('');
$('stations').addEventListener('click', e => {
  const b = e.target.closest('.station'); if (!b) return;
  const list = itemsOf(b.dataset.st); if (!list.length) return;
  runItem(list[(progress.get().sp[b.dataset.st] || 0) % list.length], b.dataset.st, 'station');
});

// Ha nincs magyar hang, azt már az indulóképernyőn jelezzük (a szülőnek)
const checkVoice = () => { $('voice-warn').hidden = hasHungarianVoice(); };
setTimeout(checkVoice, 800); setTimeout(checkVoice, 2500);

$('again').addEventListener('click', () => repeatLast());

// 1) Az első koppintás oldja fel a hangot (iOS)
$('start-btn').addEventListener('click', async () => {
  $('start').hidden = true; $('hud').hidden = false;
  say(name() ? `Szia ${name()}! Gyűjtsünk csillagokat!` : 'Szia! Gyűjtsünk együtt csillagokat!');
  if (progress.get().meter >= perReward()) openReward(); else $('home').hidden = false;
});

// 2) Egy feladat lefuttatása: "Tovább" (sorrend) vagy szabadon választott állomás
async function runItem(item, station, via) {
  $('home').hidden = true;
  const mod = await activities[item.type]();
  $('stage').hidden = false;
  await mod.run($('stage'), item);
  $('stage').hidden = true; $('stage').innerHTML = '';
  const meter = progress.addStar(station, via);
  garden?.setStars(progress.get().total);
  garden?.cheer();
  say(PRAISE[progress.get().total % PRAISE.length] + (name() && meter >= perReward() ? ' ' + name() + '!' : ''), { remember: false });
  await flyStar(Math.min(meter, perReward()) - 1);
  await sleep(900);
  if (meter >= perReward()) openReward(); else $('home').hidden = false;
}
$('next').addEventListener('click', () => {
  const item = CURRICULUM[progress.get().index % CURRICULUM.length];
  runItem(item, stationOf(item), 'next');
});

// 3) Jutalom: 3 csillag után egy időre szóló játék, utána magától visszatér
function openReward() {
  $('reward').hidden = false;
  say('Megvan az összes csillag! Válassz egy játékot!');
}
let stopGame = null, gameTimer = null;
document.querySelectorAll('.choice').forEach(btn => btn.addEventListener('click', async () => {
  $('reward').hidden = true; $('game').hidden = false;
  const mod = await rewards[btn.dataset.game]();
  stopGame = mod.run($('game-body'));
  gameTimer = setTimeout(endReward, progress.get().rewardMinutes * 60 * 1000);
}));
$('game-back').addEventListener('click', endReward);

async function endReward() {
  clearTimeout(gameTimer);
  try { stopGame?.(); } catch (e) {}
  stopGame = null;
  $('game-body').innerHTML = ''; $('game').hidden = true;
  progress.resetMeter(); renderMeter(0, perReward());
  $('home').hidden = false;
  say('Ez nagyon jó volt! Gyűjtsünk még csillagokat!');
}
