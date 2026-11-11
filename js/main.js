import { createGarden } from './garden.js';
import { CURRICULUM } from './curriculum.js';
import { progress } from './progress.js';
import { say, repeatLast } from './voice.js';
import { renderMeter, flyStar } from './stars.js';
import { setupParent } from './parent.js';

const $ = id => document.getElementById(id);
const activities = {
  trace: () => import('./activities/trace.js'),
  count: () => import('./activities/count.js'),
};
const rewards = {
  sparkhorn: () => import('./rewards/sparkhorn.js'),
  bubbles: () => import('./rewards/bubbles.js'),
};
const PRAISE = ['Ügyes vagy!', 'Nagyszerű!', 'Szuper!', 'Csodás!', 'Ez az!'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const name = () => progress.get().name;

let garden = null;
try { garden = createGarden($('garden')); garden.setStars(progress.get().total); }
catch (e) { console.warn('3D nem indult el', e); } // a feladatok 3D nélkül is működnek

setupParent(() => location.reload());
renderMeter(progress.get().meter % 3);

$('again').addEventListener('click', () => repeatLast());

// 1) Az első koppintás oldja fel a hangot (iOS)
$('start-btn').addEventListener('click', async () => {
  $('start').hidden = true; $('hud').hidden = false;
  say(name() ? `Szia ${name()}! Gyűjtsünk csillagokat!` : 'Szia! Gyűjtsünk együtt csillagokat!');
  if (progress.get().meter >= 3) openReward(); else $('home').hidden = false;
});

// 2) Tovább: a következő feladat a tananyagsorból
$('next').addEventListener('click', async () => {
  $('home').hidden = true;
  const item = CURRICULUM[progress.get().index % CURRICULUM.length];
  const mod = await activities[item.type]();
  $('stage').hidden = false;
  await mod.run($('stage'), item);
  $('stage').hidden = true; $('stage').innerHTML = '';
  const meter = progress.addStar();
  garden?.setStars(progress.get().total);
  garden?.cheer();
  say(PRAISE[progress.get().total % PRAISE.length] + (name() && meter === 3 ? ' ' + name() + '!' : ''), { remember: false });
  await flyStar(meter - 1);
  await sleep(900);
  if (meter >= 3) openReward(); else $('home').hidden = false;
});

// 3) Jutalom: 3 csillag után egy időre szóló játék, utána magától visszatér
function openReward() {
  $('reward').hidden = false;
  say('Megvan a három csillag! Válassz egy játékot!');
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
  progress.resetMeter(); renderMeter(0);
  $('home').hidden = false;
  say('Ez nagyon jó volt! Gyűjtsünk még három csillagot!');
}
