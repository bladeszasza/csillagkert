// Felhővár-verseny: két unikornis fut egymás mellett egy égi felhőpályán, felhővárak között.
// Koppints bárhová: az unikornis átugorja az akadályt. Ha belefutsz, lelassulsz (nincs büntetés, csak lassabb vagy).
// Aki előbb ér a célba, nyer; a nyertes gyönyörű ajándékot kap (az öltöztető egy új eleme).
import * as THREE from '../../vendor/three.module.js';
import { makeUnicorn, animateRunner } from './creatures.js';
import { say } from '../voice.js';
import { nextGift } from '../gifts.js';

const LEN = 220;                         // a pálya hossza
const LANE = 1.7;                        // a két sáv távolsága a középvonaltól
const HURDLE_EVERY = 16;                 // akadályok közti távolság
const BASE = 9, RIVAL = 8.5;             // alapsebesség (a gyerek kicsit gyorsabb, ha nem hibázik)
const GRAV = -26, JUMP = 9.5;

export function run(container, { onGift } = {}) {
  container.innerHTML = `<div class="race"><canvas class="race-gl"></canvas>
    <div class="race-hud"><div class="race-track"><span class="mk me">🦄</span><span class="mk rv">🦄</span><span class="finish">🏁</span></div></div>
    <div class="race-center"></div><div class="race-hint">Koppints, hogy ugorj! ⬆️</div></div>`;
  const root = container.querySelector('.race'), canvas = root.querySelector('.race-gl');
  const centerEl = root.querySelector('.race-center'), hint = root.querySelector('.race-hint');
  const mkMe = root.querySelector('.mk.me'), mkRv = root.querySelector('.mk.rv');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe9ff); scene.fog = new THREE.Fog(0xbfe9ff, 30, 120);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcdb7ff, 1.5));
  const sun = new THREE.DirectionalLight(0xfff0d0, 1.4); sun.position.set(6, 12, 4); scene.add(sun);

  // --- pálya és díszlet: felhőpálya, felhővár tornyok, szivárványívek, felhők ---
  const white = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const track = new THREE.Mesh(new THREE.BoxGeometry(LANE * 2 + 3.2, 0.5, LEN + 60), new THREE.MeshLambertMaterial({ color: 0xf4eeff }));
  track.position.set(0, -0.3, -LEN / 2 + 10); scene.add(track);
  for (const x of [-LANE, LANE]) { const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.1, LEN + 60), new THREE.MeshBasicMaterial({ color: 0xd9c8ff })); stripe.rotation.x = -Math.PI / 2; stripe.position.set(x * 1.0, -0.04, -LEN / 2 + 10); scene.add(stripe); }
  const towerColors = [0xffd6ea, 0xe6d6ff, 0xd6e6ff, 0xfff0b8];
  for (let z = 6; z > -LEN - 40; z -= 17) {
    for (const side of [-1, 1]) {
      const x = side * (6.5 + Math.random() * 4), h = 4 + Math.random() * 5, c = towerColors[(Math.random() * 4) | 0];
      const t = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, h, 10), new THREE.MeshLambertMaterial({ color: c })); t.position.set(x, h / 2 - 1, z); scene.add(t);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2, 10), new THREE.MeshLambertMaterial({ color: 0x8e5be8 })); roof.position.set(x, h - 1 + 1, z); scene.add(roof);
      const flag = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.05), new THREE.MeshLambertMaterial({ color: 0xff8fc8 })); flag.position.set(x + 0.4, h + 1.8, z); scene.add(flag);
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.1), new THREE.MeshBasicMaterial({ color: 0xffe08a })); win.position.set(x - side * 1.2, h / 2, z); scene.add(win);
      const cloud = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 10), white); cloud.scale.set(1.6, 0.6, 1.2); cloud.position.set(x, -1.2, z); scene.add(cloud);
    }
  }
  for (let z = -10; z > -LEN; z -= 38) {          // szivárványívek a pálya fölött
    const colors = [0xff5d5d, 0xffb020, 0xffe14d, 0x4cc38a, 0x4a7dff];
    colors.forEach((c, i) => { const arc = new THREE.Mesh(new THREE.TorusGeometry(5.2 - i * 0.28, 0.14, 8, 24, Math.PI), new THREE.MeshLambertMaterial({ color: c })); arc.position.set(0, -0.3, z); scene.add(arc); });
  }
  for (let i = 0; i < 28; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(1.5 + Math.random() * 1.5, 10, 8), white); c.scale.set(1.8, 0.7, 1.2); c.position.set((Math.random() - 0.5) * 60, 6 + Math.random() * 10, -Math.random() * (LEN + 40)); scene.add(c); }
  // cél: kapu szalaggal
  const gate = new THREE.Group();
  for (const x of [-LANE - 1.4, LANE + 1.4]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5, 10), new THREE.MeshLambertMaterial({ color: 0xffd24d })); p.position.set(x, 2.2, 0); gate.add(p); }
  const banner = new THREE.Mesh(new THREE.BoxGeometry(LANE * 2 + 3, 0.9, 0.12), new THREE.MeshLambertMaterial({ color: 0xff5d8f })); banner.position.set(0, 4.5, 0); gate.add(banner);
  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(LANE * 2 + 2.8, 0.14, 0.05), new THREE.MeshBasicMaterial({ color: 0xffffff })); ribbon.position.set(0, 0.7, 0); gate.add(ribbon);
  gate.position.z = -LEN; scene.add(gate);
  for (let i = 0; i < 8; i++) { const sq = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x222222 : 0xffffff })); sq.position.set(-LANE - 1 + i * 0.6, 0.05, -LEN - 0.5); sq.rotation.x = -Math.PI / 2; scene.add(sq); }

  // --- akadályok (mindkét sávban, azonos helyeken) ---
  const hurdleGeo = new THREE.BoxGeometry(1.7, 0.18, 0.18), postGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6);
  const hurdles = [];
  for (let z = -22; z > -LEN + 14; z -= HURDLE_EVERY + (hurdles.length % 3)) {
    for (const lane of [-1, 1]) {
      const g = new THREE.Group();
      const bar = new THREE.Mesh(hurdleGeo, new THREE.MeshLambertMaterial({ color: lane < 0 ? 0xff5d8f : 0x4aa8ff })); bar.position.y = 0.6; g.add(bar);
      for (const sx of [-0.8, 0.8]) { const p = new THREE.Mesh(postGeo, white); p.position.set(sx, 0.35, 0); g.add(p); }
      g.position.set(lane * LANE, 0, z); scene.add(g); hurdles.push({ z, lane, g });
    }
  }

  // --- versenyzők ---
  const me = makeUnicorn({ body: 0xffffff, mane: 0xff5d8f, horn: 0xffd24d, scale: 1.0 });
  const rv = makeUnicorn({ body: 0xd6e6ff, mane: 0x4aa8ff, horn: 0xc0e8ff, scale: 1.0 });
  [me, rv].forEach(u => { u.rotation.y = 0; scene.add(u); });
  const S = { me: null, rv: null, t: 0, phase: 'ready', countdown: 3.2, endT: 0, result: null };
  const racer = (x) => ({ x, z: 0, y: 0, vy: 0, grounded: true, slow: 0, blink: 0, nextH: 0 });
  function reset() {
    S.me = racer(-LANE); S.rv = racer(LANE); S.t = 0; S.phase = 'ready'; S.countdown = 3.2; S.result = null; centerEl.innerHTML = ''; hint.style.opacity = 1;
    me.visible = rv.visible = true;
  }
  reset();

  function jump() { const r = S.me; if (S.phase !== 'run') return; if (r.grounded) { r.vy = JUMP; r.grounded = false; } }
  root.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; jump(); });
  const key = e => { if (e.code === 'Space') { e.preventDefault(); jump(); } };
  window.addEventListener('keydown', key);

  function hitCheck(r, lane) {                   // akadályba ütközés: ha a lábak nem elég magasan vannak
    for (const h of hurdles) {
      if (h.lane !== lane) continue;
      if (Math.abs(r.z - (-h.z)) < 0.55 && r.y < 0.75 && !h.hit?.[lane]) {
        (h.hit = h.hit || {})[lane] = true;
        r.slow = 1.1; r.blink = 1.1;               // lelassul és villog
        h.g.rotation.x = -0.6; h.g.position.y = -0.1;  // az akadály billen (kedvesen)
      }
    }
  }
  function aiJump(r) {                           // az ellenfél 82%-ban ugrik időben
    const next = hurdles.find(h => h.lane === 1 && -h.z > r.z + 0.5 && !h.aiDecided);
    if (next && -next.z - r.z < 3.0) { next.aiDecided = true; if (Math.random() < 0.82 && r.grounded) { r.vy = JUMP; r.grounded = false; } }
  }

  function step(dt) {
    S.t += dt;
    if (S.phase === 'ready') {
      S.countdown -= dt;
      const n = Math.ceil(S.countdown);
      centerEl.innerHTML = S.countdown > 0 ? `<div class="race-count">${n > 0 ? n : ''}</div>` : '<div class="race-count go">Rajt!</div>';
      if (S.countdown <= 0) { S.phase = 'run'; setTimeout(() => { if (S.phase === 'run') centerEl.innerHTML = ''; }, 700); }
    }
    if (S.phase === 'run' || S.phase === 'done') {
      for (const [r, lane, isRival] of [[S.me, -1, false], [S.rv, 1, true]]) {
        if (S.phase === 'run' || r.z < LEN + 8) {
          let v = isRival ? RIVAL : BASE;
          if (isRival) { const gap = S.me.z - S.rv.z; v *= gap > 22 ? 1.1 : gap < -22 ? 0.9 : 1; }   // egyensúly: a verseny izgalmas marad
          if (r.slow > 0) { v *= 0.35; r.slow -= dt; }
          if (S.phase === 'done' && ((S.result === 'win') === !isRival)) v *= 0.5;                   // célba érés után lassít
          if (isRival) aiJump(r);
          r.z += v * dt;
          if (!r.grounded) { r.vy += GRAV * dt; r.y += r.vy * dt; if (r.y <= 0) { r.y = 0; r.vy = 0; r.grounded = true; } }
          if (S.phase === 'run') hitCheck(r, lane);
          if (r.blink > 0) r.blink -= dt;
        }
      }
      if (S.phase === 'run') {
        if (S.me.z >= LEN || S.rv.z >= LEN) finish(S.me.z >= S.rv.z ? 'win' : 'lose');
      }
      hint.style.opacity = S.me.z > 14 ? 0 : 1;
    }
    // megjelenítés
    for (const [u, r, isRival] of [[me, S.me, false], [rv, S.rv, true]]) {
      u.position.set(r.x, r.y, -r.z);
      u.visible = r.blink > 0 ? (Math.floor(r.blink * 12) % 2 === 0) : true;
      const running = S.phase === 'run' || S.phase === 'done';
      animateRunner(u, S.t, running ? (r.slow > 0 ? 0.35 : 1) : 0);
      u.rotation.x = r.grounded ? 0 : -0.2;
    }
    const lead = S.me;
    const tz = -lead.z;
    camera.position.set(0, 4.6, tz + 8.5); camera.lookAt(0, 1.2, tz - 9);
    sun.position.set(6, 12, tz + 4); sun.target.position.set(0, 0, tz); sun.target.updateMatrixWorld();
    mkMe.style.left = Math.min(100, (S.me.z / LEN) * 100) + '%'; mkRv.style.left = Math.min(100, (S.rv.z / LEN) * 100) + '%';
  }

  async function finish(result) {
    S.phase = 'done'; S.result = result;
    if (result === 'win') {
      const gift = nextGift();
      if (gift) onGift?.('race-' + Date.now());
      centerEl.innerHTML = `<div class="race-card"><div class="big">🏆</div><h2>Nyertél!</h2>${gift ? `<p>Gyönyörű ajándékot kaptál:</p><div class="gift">${gift.icon}</div><b>${gift.name}</b><p class="sm">Az öltöztetőben ki is próbálhatod!</p>` : '<p>Minden ajándékot megnyertél! Te vagy a bajnok!</p>'}<button class="giant again">Még egyszer</button></div>`;
      say(gift ? `Nyertél! Gyönyörű ajándékot kaptál: ${gift.name}! Az öltöztetőben kipróbálhatod.` : 'Nyertél! Te vagy a bajnok!');
    } else {
      centerEl.innerHTML = `<div class="race-card"><div class="big">🦄</div><h2>Majdnem!</h2><p>A másik unikornis most gyorsabb volt. Próbáljuk újra!</p><button class="giant again">Újra</button></div>`;
      say('Majdnem! A másik unikornis most gyorsabb volt. Próbáljuk újra! Figyelj az akadályokra, és koppints időben!');
    }
    centerEl.querySelector('.again')?.addEventListener('click', () => { hurdles.forEach(h => { h.hit = null; h.aiDecided = false; h.g.rotation.x = 0; h.g.position.y = 0; }); reset(); });
  }

  function size() { const w = root.clientWidth || window.innerWidth, h = root.clientHeight || window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = h > w ? 70 : 55; camera.updateProjectionMatrix(); }
  size(); window.addEventListener('resize', size);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(size) : null; ro?.observe(root);

  let raf = 0, last = performance.now();
  function frame(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; step(dt); renderer.render(scene, camera); raf = requestAnimationFrame(frame); }
  raf = requestAnimationFrame(frame);

  // teszteléshez: gyorsított léptetés és állapot (nem része a játéknak)
  container.__race = { S, step, jump, hurdles, render: () => renderer.render(scene, camera), LEN };

  say('Verseny! Koppints, hogy átugord az akadályokat! Ha belefutsz, lelassulsz.');
  return () => {
    cancelAnimationFrame(raf); ro?.disconnect(); window.removeEventListener('resize', size); window.removeEventListener('keydown', key);
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); });
    renderer.dispose(); renderer.forceContextLoss?.();
  };
}
