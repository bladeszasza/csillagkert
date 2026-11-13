// Felhővár-verseny: két unikornis fut egymás mellett egy égi felhőpályán, felhővárak között.
// Koppints bárhová: az unikornis átugorja az akadályt. Ha belefutsz, lelassulsz (nincs büntetés, csak lassabb vagy).
// A másik unikornis a barátod: a célban mindketten megállnak, egymás felé fordulnak és együtt ünnepelnek.
// A futam végén (győzelemnél és vereségnél is) ajándék jár, a célban összebújás egy szív (js/economy.js).
// A díszlet példányosított (közös geometria és anyag), így kevés rajzolási hívással fut.
import * as THREE from '../../vendor/three.module.js';
import { makeCharacter, animateRunner, createCharacterBatch } from '../three/characters.js';
// az ellenfél: kék barát-unikornis (az öltöztető színeiből)
const RIVAL_LOOK = { body: 'c2', mane: 'c2', horn: 'ice' }, RIVAL_ALT = { body: 'c5', mane: 'c3', horn: 'pink' };   // ha a gyereké is kék: menta
import { say } from '../voice.js';
import { play } from '../sounds.js';

const LEN = 220;                         // a pálya hossza
const LANE = 1.7;                        // a két sáv távolsága a középvonaltól
const HURDLE_EVERY = 16;                 // akadályok közti távolság
const BASE = 9, RIVAL = 8.5;             // alapsebesség (a gyerek kicsit gyorsabb, ha nem hibázik)
const GRAV = -26, JUMP = 9.5;

export function run(container, ctx = {}) {
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

  // --- pálya és díszlet: felhőpálya, felhővár tornyok, szivárványívek, felhők (mind példányosítva) ---
  const geos = [], mats = [];
  const G = g => { geos.push(g); return g; }, Mt = m => { mats.push(m); return m; };
  const lambert = Mt(new THREE.MeshLambertMaterial({ color: 0xffffff })), basic = Mt(new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const tmp = new THREE.Object3D(), col = new THREE.Color();
  // egy fajta díszletelem az összes helyén, egyetlen rajzolással; items: [x, y, z, sx, sy, sz, szín, (rx)]
  function inst(geo, mat, items) {
    const m = new THREE.InstancedMesh(geo, mat, items.length);
    items.forEach(([x, y, z, sx, sy, sz, c, rx = 0], i) => { tmp.position.set(x, y, z); tmp.scale.set(sx, sy, sz); tmp.rotation.set(rx, 0, 0); tmp.updateMatrix(); m.setMatrixAt(i, tmp.matrix); m.setColorAt(i, col.setHex(c)); });
    scene.add(m); return m;
  }
  const track = new THREE.Mesh(G(new THREE.BoxGeometry(LANE * 2 + 3.2, 0.5, LEN + 60)), Mt(new THREE.MeshLambertMaterial({ color: 0xf4eeff })));
  track.position.set(0, -0.3, -LEN / 2 + 10); scene.add(track);
  inst(G(new THREE.PlaneGeometry(0.1, LEN + 60)), basic, [-LANE, LANE].map(x => [x, -0.04, -LEN / 2 + 10, 1, 1, 1, 0xd9c8ff, -Math.PI / 2]));
  const towerColors = [0xffd6ea, 0xe6d6ff, 0xd6e6ff, 0xfff0b8], towers = [], roofs = [], flags = [], wins = [], puffs = [];
  for (let z = 6; z > -LEN - 40; z -= 17) {
    for (const side of [-1, 1]) {
      const x = side * (6.5 + Math.random() * 4), h = 4 + Math.random() * 5;
      towers.push([x, h / 2 - 1, z, 1, h, 1, towerColors[(Math.random() * 4) | 0]]);
      roofs.push([x, h, z, 1, 1, 1, 0x8e5be8]);
      flags.push([x + 0.4, h + 1.8, z, 1, 1, 1, 0xff8fc8]);
      wins.push([x - side * 1.2, h / 2, z, 1, 1, 1, 0xffe08a]);
      puffs.push([x, -1.2, z, 1.6 * 2.2, 0.6 * 2.2, 1.2 * 2.2, 0xffffff]);
    }
  }
  inst(G(new THREE.CylinderGeometry(1.2, 1.4, 1, 10)), lambert, towers);
  inst(G(new THREE.ConeGeometry(1.6, 2, 10)), lambert, roofs);
  inst(G(new THREE.BoxGeometry(0.7, 0.4, 0.05)), lambert, flags);
  inst(G(new THREE.BoxGeometry(0.4, 0.6, 0.1)), basic, wins);
  const cloudGeo = G(new THREE.SphereGeometry(1, 12, 10)), sky = [];
  for (let i = 0; i < 28; i++) { const r = 1.5 + Math.random() * 1.5; sky.push([(Math.random() - 0.5) * 60, 6 + Math.random() * 10, -Math.random() * (LEN + 40), 1.8 * r, 0.7 * r, 1.2 * r, 0xffffff]); }
  inst(cloudGeo, lambert, [...puffs, ...sky]);
  const arcs = [], RAINBOW = [0xff5d5d, 0xffb020, 0xffe14d, 0x4cc38a, 0x4a7dff];
  for (let z = -10; z > -LEN; z -= 38) RAINBOW.forEach((c, i) => { const k = (5.2 - i * 0.28) / 5.2; arcs.push([0, -0.3, z, k, k, k, c]); });   // szivárványívek a pálya fölött
  inst(G(new THREE.TorusGeometry(5.2, 0.14, 8, 24, Math.PI)), lambert, arcs);
  // cél: kapu szalaggal és kockás vonallal
  const box = G(new THREE.BoxGeometry(1, 1, 1));
  inst(G(new THREE.CylinderGeometry(0.2, 0.2, 5, 10)), lambert, [-LANE - 1.4, LANE + 1.4].map(x => [x, 2.2, -LEN, 1, 1, 1, 0xffd24d]));
  inst(box, lambert, [[0, 4.5, -LEN, LANE * 2 + 3, 0.9, 0.12, 0xff5d8f]]);
  inst(box, basic, [[0, 0.7, -LEN, LANE * 2 + 2.8, 0.14, 0.05, 0xffffff], ...Array.from({ length: 8 }, (_, i) => [-LANE - 1 + i * 0.6, 0.05, -LEN - 0.5, 0.6, 0.01, 0.6, i % 2 ? 0x222222 : 0xffffff])]);

  // --- akadályok (mindkét sávban, azonos helyeken): egy rúd-háló és egy oszlop-háló az összeshez ---
  const hurdles = [];
  for (let z = -22; z > -LEN + 14; z -= HURDLE_EVERY + ((hurdles.length / 2) % 3)) for (const lane of [-1, 1]) hurdles.push({ z, lane, tip: 0 });
  const bars = new THREE.InstancedMesh(G(new THREE.BoxGeometry(1.7, 0.18, 0.18)), lambert, hurdles.length);
  const posts = new THREE.InstancedMesh(G(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6)), lambert, hurdles.length * 2);
  const base = new THREE.Object3D(), part = new THREE.Object3D(), m4 = new THREE.Matrix4();
  // egy akadály helyzete: ha belefutottak, kedvesen hátrabillen
  function poseHurdle(h, i) {
    base.position.set(h.lane * LANE, -0.1 * h.tip, h.z); base.rotation.set(-0.6 * h.tip, 0, 0); base.updateMatrix();
    part.position.set(0, 0.6, 0); part.updateMatrix(); bars.setMatrixAt(i, m4.multiplyMatrices(base.matrix, part.matrix));
    [-0.8, 0.8].forEach((sx, k) => { part.position.set(sx, 0.35, 0); part.updateMatrix(); posts.setMatrixAt(i * 2 + k, m4.multiplyMatrices(base.matrix, part.matrix)); });
    bars.instanceMatrix.needsUpdate = posts.instanceMatrix.needsUpdate = true;
  }
  hurdles.forEach((h, i) => { poseHurdle(h, i); bars.setColorAt(i, col.setHex(h.lane < 0 ? 0xff5d8f : 0x4aa8ff)); posts.setColorAt(i * 2, col.setHex(0xffffff)); posts.setColorAt(i * 2 + 1, col.setHex(0xffffff)); });
  scene.add(bars, posts);

  // --- versenyzők ---
  const me = makeCharacter('unicorn', ctx.avatar || {});        // a gyerek saját, felöltöztetett unikornisa
  const rv = makeCharacter('unicorn', ctx.avatar?.body === RIVAL_LOOK.body ? RIVAL_ALT : RIVAL_LOOK);
  const crowd = createCharacterBatch(scene);
  [me, rv].forEach(u => { u.rotation.y = 0; scene.add(u); crowd.add(u); });
  const S = { me: null, rv: null, t: 0, phase: 'ready', countdown: 3.2, endT: 0, result: null, shown: null, hoofT: 0, goT: null };
  const racer = (x) => ({ x, z: 0, y: 0, vy: 0, grounded: true, slow: 0, blink: 0, ang: 0 });
  function reset() {
    S.me = racer(-LANE); S.rv = racer(LANE); S.t = 0; S.phase = 'ready'; S.countdown = 3.2; S.result = null; S.endT = 0; S.shown = null; S.goT = null; centerEl.innerHTML = ''; hint.style.opacity = 1;
    me.visible = rv.visible = true;
  }
  reset();

  function jump() { const r = S.me; if (S.phase !== 'run') return; if (r.grounded) { r.vy = JUMP; r.grounded = false; play('boing'); } }
  root.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; jump(); });
  const key = e => { if (e.code === 'Space') { e.preventDefault(); jump(); } };
  window.addEventListener('keydown', key);

  function hitCheck(r, lane) {                   // akadályba ütközés: ha a lábak nem elég magasan vannak
    hurdles.forEach((h, i) => {
      if (h.lane !== lane || h.hit) return;
      if (Math.abs(r.z - (-h.z)) < 0.55 && r.y < 0.75) {
        h.hit = true; r.slow = 1.1; r.blink = 1.1;   // lelassul és villog
        h.tip = 1; poseHurdle(h, i);                 // az akadály kedvesen hátrabillen
        if (r === S.me) play('bump');
      }
    });
  }
  function aiJump(r) {                           // az ellenfél 82%-ban ugrik időben
    const next = hurdles.find(h => h.lane === 1 && -h.z > r.z + 0.5 && !h.aiDecided);
    if (next && -next.z - r.z < 3.0) { next.aiDecided = true; if (Math.random() < 0.82 && r.grounded) { r.vy = JUMP; r.grounded = false; } }
  }

  function step(dt) {
    S.t += dt;
    if (S.phase === 'ready') {
      S.countdown -= dt;
      const n = S.countdown > 0 ? Math.min(3, Math.ceil(S.countdown)) : 0;
      if (n !== S.shown) {                             // a felirat csak váltáskor íródik újra (nem minden képkockában)
        S.shown = n;
        centerEl.innerHTML = n > 0 ? `<div class="race-count">${n}</div>` : '<div class="race-count go">Rajt!</div>';
        play(n > 0 ? 'beep' : 'go');
      }
      if (S.countdown <= 0) { S.phase = 'run'; S.goT = S.t; }
    }
    if (S.phase === 'run' && S.goT != null && S.t - S.goT > 0.7) { S.goT = null; centerEl.innerHTML = ''; }
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
        else if (S.me.grounded && (S.hoofT -= dt) <= 0) { S.hoofT = S.me.slow > 0 ? 0.42 : 0.24; play('step'); }   // patakopogás
      }
      if (S.phase === 'done') S.endT += dt;
      hint.style.opacity = S.me.z > 14 ? 0 : 1;
    }
    // megjelenítés
    // a célban: mindketten megállnak, egymás felé fordulnak és összebújnak (a másik unikornis is barát)
    const hug = S.phase === 'done' && S.endT > 1.3 ? Math.min(1, (S.endT - 1.3) / 0.8) : 0;
    if (hug >= 1 && !S.hugged) { S.hugged = true; ctx.heart?.(); }        // a célban összebújnak: barátság = egy szív
    for (const [u, r, side] of [[me, S.me, 1], [rv, S.rv, -1]]) {
      if (hug > 0) { const z = Math.max(S.me.z, S.rv.z); r.z += (z - r.z) * Math.min(1, dt * 3); r.x = -side * (LANE - 0.8 * hug); }
      r.ang += ((-side * Math.PI / 2) * hug - r.ang) * Math.min(1, dt * 6);
      u.position.set(r.x, r.y + (hug >= 1 ? Math.abs(Math.sin(S.endT * 6)) * 0.25 : 0), -r.z);
      u.rotation.order = 'YXZ'; u.rotation.y = r.ang;
      u.visible = r.blink > 0 ? (Math.floor(r.blink * 12) % 2 === 0) : true;
      const running = S.phase === 'run' || (S.phase === 'done' && hug === 0);
      animateRunner(u, S.t, running ? (r.slow > 0 ? 0.35 : 1) : 0, !r.grounded);
      u.rotation.x = r.grounded ? 0 : -0.2;
    }
    const tz = -(hug > 0 ? Math.max(S.me.z, S.rv.z) : S.me.z);
    camera.position.set(0, 4.6, tz + 8.5); camera.lookAt(0, 1.2, tz - 9);
    sun.position.set(6, 12, tz + 4); sun.target.position.set(0, 0, tz); sun.target.updateMatrixWorld();
    mkMe.style.left = Math.min(100, (S.me.z / LEN) * 100) + '%'; mkRv.style.left = Math.min(100, (S.rv.z / LEN) * 100) + '%';
  }

  // A futam vége: győzelemnél és vereségnél is jár az ajándék (a részvétel számít); a jutalomkörben az első futam adja
  function finish(result) {
    S.phase = 'done'; S.result = result; S.endT = 0; S.hugged = false;
    play('cheer');
    if (result === 'win') {
      centerEl.innerHTML = `<div class="race-card"><div class="big">🏆</div><h2>Nyertél!</h2><p>Szép futás volt!</p><button class="giant again">Még egyszer</button></div>`;
      say('Nyertél! Szép futás volt!');
    } else {
      centerEl.innerHTML = `<div class="race-card"><div class="big">🦄💖🦄</div><h2>Szép futás volt!</h2><p>Most a barátod ért be előbb.</p><button class="giant again">Még egyszer</button></div>`;
      say('Szép futás volt! Most a barátod ért be előbb. Futunk még egyet?');
    }
    ctx.gift?.();
    centerEl.querySelector('.again')?.addEventListener('click', () => { hurdles.forEach((h, i) => { h.hit = false; h.aiDecided = false; h.tip = 0; poseHurdle(h, i); }); reset(); });
  }

  function size() { const w = root.clientWidth || window.innerWidth, h = root.clientHeight || window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = h > w ? 70 : 55; camera.updateProjectionMatrix(); }
  size(); window.addEventListener('resize', size);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(size) : null; ro?.observe(root);

  let raf = 0, last = performance.now();
  const draw = () => { crowd.update(); renderer.render(scene, camera); };
  function frame(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; step(dt); draw(); raf = requestAnimationFrame(frame); }
  raf = requestAnimationFrame(frame);

  // teszteléshez: gyorsított léptetés és állapot (nem része a játéknak)
  container.__busy = () => S.phase === 'run' || S.phase === 'ready';   // a jutalomidő vége megvárja a futam végét
  container.__race = { S, step, jump, hurdles, render: draw, me, LEN, info: () => renderer.info.render, canvas, busy: () => S.phase === 'run' || S.phase === 'ready' };

  say('Verseny! Koppints, és az unikornisod átugorja az akadályt!');
  return () => {
    cancelAnimationFrame(raf); ro?.disconnect(); window.removeEventListener('resize', size); window.removeEventListener('keydown', key);
    crowd.dispose();
    scene.traverse(o => { if (o.isInstancedMesh) o.dispose(); if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); });
    geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose());
    renderer.dispose(); renderer.forceContextLoss?.();
  };
}
