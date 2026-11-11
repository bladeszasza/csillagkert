// Hami-adagoló: az adagoló különféle finomságokat ad. Az egészséges ételt a cicának és barátainak kell
// megetetni (ők mindig örülnek neki). Az édességet be kell dobozolni: a megtelt dobozt becsomagoljuk,
// és ajándékba átadjuk. Nincs büntetés: ha rossz helyre kerül, kedvesen visszajön és elmondjuk, hová való.
import { say } from '../voice.js';
import { happy, unlockAudio } from '../sounds.js';
import * as THREE from '../../vendor/three.module.js';
import { createStage } from './stage3d.js';
import { makeGardenCat, animateCat, CAT_HEIGHT } from './cat3d.js';
import { makeFriend, animateFriend } from './creatures.js';

const HEALTHY = [['🥕', 'répa'], ['🍎', 'alma'], ['🍌', 'banán'], ['🥦', 'brokkoli'], ['🐟', 'hal'], ['🥛', 'tej'], ['🍓', 'eper'], ['🍇', 'szőlő'], ['🍐', 'körte'], ['🥒', 'uborka']];
const SWEETS = [['🍭', 'nyalóka'], ['🍬', 'cukorka'], ['🍩', 'fánk'], ['🧁', 'sütemény'], ['🍫', 'csokoládé'], ['🍪', 'keksz']];
const PALS = ['🐱', '🐰', '🐶', '🦊'];
const RECIPIENTS = [['👧', 'a szomszéd kislánynak'], ['👵', 'a nagymamának'], ['🧑‍🏫', 'a tanító néninek'], ['👦', 'a barátodnak']];
const BOX_CAP = 5;                           // szabad játékban ennyi édesség tölt meg egy dobozt
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = a => a[(Math.random() * a.length) | 0];

// opts.rounds: rövid kör egy feladat végén (3 egészséges + 2 édesség); kész, ha mind elfogyott (onDone).
export function run(container, opts = {}) {
  const rounds = !!opts.rounds, cap = rounds ? 2 : BOX_CAP;
  const queue = rounds ? [true, true, true, false, false].sort(() => Math.random() - 0.5) : null;
  container.innerHTML = `
    <div class="hd">
      <div class="hd-top">
        <div class="hd-stat">🍎 <b id="hd-fed">0</b></div>
        <div class="hd-machine"><div class="hd-lights"><i></i><i></i><i></i></div><div class="hd-title">HAMI-ADAGOLÓ</div><div class="hd-slot"></div></div>
        <div class="hd-stat">🎁 <b id="hd-gifts">0</b></div>
      </div>
      <div class="hd-tray" id="hd-tray"></div>
      <div class="hd-bottom">
        <div class="hd-pals">${PALS.map((p, i) => `<div class="hd-pal${i === 0 ? ' main' : ''}" data-i="${i}"><span class="face">${p}</span><span class="hearts"></span></div>`).join('')}</div>
        <div class="hd-box" id="hd-box"><div class="lid">📦</div><div class="cnt"><b id="hd-cnt">0</b>/${cap}</div></div>
      </div>
      <div class="hd-bubble" id="hd-bubble"></div>
      <div class="hd-gift" id="hd-gift"></div>
    </div>`;
  const root = container.querySelector('.hd'), tray = root.querySelector('#hd-tray'), bubble = root.querySelector('#hd-bubble');
  const pals = [...root.querySelectorAll('.hd-pal')], box = root.querySelector('#hd-box'), giftEl = root.querySelector('#hd-gift');
  const fedEl = root.querySelector('#hd-fed'), giftsEl = root.querySelector('#hd-gifts'), cntEl = root.querySelector('#hd-cnt');
  let fed = 0, gifts = 0, inBox = 0, current = null, alive = true, busy = false, audio = null;

  // 3D szereplők: a kertből ismert cica és három barát (nyuszi, kutya, róka), kedves mosollyal
  let st3 = null, raf = 0;
  const ps = PALS.map(() => ({ happy: 0, nom: 0, shake: 0 }));
  const models = [];
  try {
    st3 = createStage(root);
    PALS.forEach((p, i) => {
      const m = i === 0 ? makeGardenCat() : makeFriend(['bunny', 'dog', 'fox'][i - 1]);
      if (i > 0) m.rotation.y = Math.PI;                       // a barátok -z felé néznek: fordítsuk a kamera felé
      m.userData.facing = i === 0 ? 0 : Math.PI; st3.add(m); models.push(m);
    });
    const t0 = performance.now();
    const loop = now => {
      if (!st3) return;
      if (!root.isConnected) { alive = false; st3.dispose(); st3 = null; return; }   // megszakított feladat: ne maradjon futó jelenet
      const t = (now - t0) / 1000, rr = st3.hostRect();
      pals.forEach((pal, i) => {
        const r = pal.querySelector('.face').getBoundingClientRect(), m = models[i], s = ps[i];
        const hopT = Math.max(0, (s.happy - now) / 1300), nomT = Math.max(0, (s.nom - now) / 500), shT = Math.max(0, (s.shake - now) / 700);
        const hPx = r.height * (i === 0 ? 1.45 : 1.3);
        st3.place(m, r.left - rr.left + r.width / 2, r.bottom - rr.top - 4 - (hopT > 0 ? Math.abs(Math.sin((1 - hopT) * Math.PI * 3)) * 26 : 0), hPx, i === 0 ? CAT_HEIGHT : 1.9);
        m.rotation.y = (m.userData.facing || 0) + Math.sin(t * 0.8 + i) * 0.18;
        if (i === 0) animateCat(m, t, { hop: hopT > 0 ? 1 - hopT : 0, nom: nomT > 0 ? 1 - nomT : 0, shake: shT > 0 ? 1 - shT : 0, cheer: hopT > 0 });
        else { animateFriend(m, t + i, 0, hopT > 0); m.userData.inner.rotation.z = shT > 0 ? Math.sin((1 - shT) * Math.PI * 6) * 0.12 : 0; m.userData.head.rotation.x = nomT > 0 ? Math.sin((1 - nomT) * Math.PI) * 0.4 : 0; }
      });
      st3.render(); raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  } catch (e) { console.warn('3D állatok nem indultak el, emoji marad', e); st3 = null; root.querySelectorAll('.hd-pal .face').forEach(f => { f.style.opacity = 1; }); }

  function unlock() { try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch (e) {} }
  function ding(f = 660, d = 0.25) { try { if (!audio) return; const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime; o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(.3, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + d + .05); } catch (e) {} }
  root.addEventListener('pointerdown', () => { unlock(); unlockAudio(); });
  const say2 = (t, speak = true) => { bubble.textContent = t; bubble.classList.add('on'); clearTimeout(say2.t); say2.t = setTimeout(() => bubble.classList.remove('on'), 2200); return speak ? say(t, { remember: false }) : Promise.resolve(); };

  function dispense() {
    if (!alive || current || !root.isConnected) return;
    if (queue && !queue.length) { if (!busy) { alive = false; setTimeout(() => opts.onDone?.(), 600); } return; }
    const healthy = queue ? queue.shift() : Math.random() < 0.6, [emoji, name] = rnd(healthy ? HEALTHY : SWEETS);
    const el = document.createElement('div'); el.className = 'hd-item drop'; el.textContent = emoji; tray.appendChild(el);
    current = { el, healthy, name, emoji }; ding(520); setTimeout(() => ding(780), 120);
    wire(current);
    say2(healthy ? `${name}. Egészséges!` : `${name}. Édesség!`);
  }

  function rectOf(el) { return el.getBoundingClientRect(); }
  const over = (e, el, pad = 24) => { const r = rectOf(el); return e.clientX > r.left - pad && e.clientX < r.right + pad && e.clientY > r.top - pad && e.clientY < r.bottom + pad; };
  function back(item) { item.el.style.transition = 'transform .4s'; item.el.style.transform = ''; item.el.style.zIndex = ''; }

  function wire(item) {
    const el = item.el; let start = null;
    el.addEventListener('pointerdown', e => { if (busy) return; start = { x: e.clientX, y: e.clientY, moved: false }; try { el.setPointerCapture(e.pointerId); } catch (err) {} el.style.transition = 'none'; el.style.zIndex = 8; el.classList.remove('drop'); });
    el.addEventListener('pointermove', e => { if (!start) return; const dx = e.clientX - start.x, dy = e.clientY - start.y; if (Math.abs(dx) + Math.abs(dy) > 8) start.moved = true; el.style.transform = `translate(${dx}px, ${dy}px) scale(1.15)`; });
    el.addEventListener('pointercancel', () => { start = null; back(item); });
    el.addEventListener('pointerup', async e => {
      if (!start) return; const s = start; start = null;
      if (!s.moved) { back(item); say2(item.healthy ? `${item.name}. Egészséges! Etesd meg a cicát!` : `${item.name}. Édesség! Ez a dobozba megy.`); return; }
      const palIdx = pals.findIndex(p => over(e, p)), onBox = over(e, box);
      if (palIdx >= 0) return feedPal(item, palIdx);
      if (onBox) return boxIt(item);
      back(item);                                   // nem ért célba: visszatér a tálcára
    });
  }

  async function feedPal(item, i) {
    busy = true;
    const pal = pals[i], face = pal.querySelector('.face');
    if (item.healthy) {
      item.el.style.transition = 'transform .3s, opacity .3s'; const a = rectOf(face), b = rectOf(item.el);
      item.el.style.transform = `translate(${a.left + a.width / 2 - (b.left + b.width / 2)}px, ${a.top + a.height / 2 - (b.top + b.height / 2)}px) scale(.3)`; item.el.style.opacity = 0;
      await sleep(320); item.el.remove(); current = null;
      fed++; fedEl.textContent = fed; ding(700 + (fed % 5) * 90);
      face.classList.add('happy'); ps[i].happy = performance.now() + 1300; ps[i].nom = performance.now() + 500; pal.querySelector('.hearts').textContent = '❤️❤️'; happy(PALS[i]);
      say2('❤️', false);                       // etetés után csak az állat hangja szól
      await sleep(1100); face.classList.remove('happy'); pal.querySelector('.hearts').textContent = '';
    } else {
      back(item); face.classList.add('shake'); ps[i].shake = performance.now() + 700; say2('Ez édesség, a dobozba megy!');
      await sleep(900); face.classList.remove('shake');
    }
    busy = false; if (!current) setTimeout(dispense, 500);
  }

  async function boxIt(item) {
    busy = true;
    if (!item.healthy) {
      item.el.style.transition = 'transform .3s, opacity .3s'; const a = rectOf(box), b = rectOf(item.el);
      item.el.style.transform = `translate(${a.left + a.width / 2 - (b.left + b.width / 2)}px, ${a.top + a.height / 2 - (b.top + b.height / 2)}px) scale(.3)`; item.el.style.opacity = 0;
      await sleep(320); item.el.remove(); current = null; inBox++; cntEl.textContent = inBox; box.classList.add('pop'); ding(500, 0.2); await sleep(250); box.classList.remove('pop');
      if (inBox >= cap) await wrap();
      else say2('📦', false);
    } else {
      back(item); box.classList.add('shake'); say2('Ezt együk meg! Etesd meg a cicát!'); await sleep(900); box.classList.remove('shake');
    }
    busy = false; if (!current) setTimeout(dispense, 500);
  }

  async function wrap() {                              // becsomagolás és átadás
    const [emoji, who] = rnd(RECIPIENTS);
    box.querySelector('.lid').textContent = '🎁'; box.classList.add('closed'); ding(660); await sleep(250); ding(880); happy('🦄');
    say2(`Ajándék ${who}!`);
    giftEl.innerHTML = `<div class="who">${emoji}</div><div class="pk">🎁</div>`; giftEl.classList.add('go');
    await sleep(2600); giftEl.classList.remove('go'); giftEl.innerHTML = '';
    gifts++; giftsEl.textContent = gifts; inBox = 0; cntEl.textContent = 0; box.classList.remove('closed'); box.querySelector('.lid').textContent = '📦';
    say2('🎁', false);
    await sleep(900);
  }

  const intro = rounds ? 'Etesd meg a barátokat! Az édesség a dobozba megy.' : 'Hami-adagoló! Az egészséges az állatoké, az édesség a dobozba megy.';
  say(intro, { remember: false }).then(() => setTimeout(dispense, 500)); setTimeout(dispense, 9000);
  return () => { alive = false; clearTimeout(say2.t); cancelAnimationFrame(raf); st3?.dispose(); st3 = null; try { audio && audio.close(); } catch (e) {} };
}
