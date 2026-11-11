// Szabad futkározás: végtelen, procedurálisan generált világ (dombok, fák, virágok, sziklák, rönkök, tócsák).
// A világ a játékos előtt, darabokban (chunk) generálódik, így addig futhat, ameddig csak akar – csak a talajon.
// Koppints / tartsd az ujjad (vagy a Pencilt) arra, merre menjen az unikornis; a nagy gomb ugrik.
// Barátságos állatok: némelyik együtt fut veled, némelyik csak mosolyog és integet.
import * as THREE from '../../vendor/three.module.js';
import { makeUnicorn, animateRunner, makeFriend, animateFriend, SPECIES_LIST } from './creatures.js';
import { say } from '../voice.js';

const CHUNK = 30, GEN_R = 2, KEEP_R = 3;
const WALK = 7.5, JUMP_V = 8.5, GRAV = -24;
const SEED = (Math.random() * 1e9) | 0;

// --- determinisztikus véletlen és zaj ---
function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash2 = (x, z, s = SEED) => { let h = (Math.imul(x, 374761393) + Math.imul(z, 668265263) + s) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const smooth = t => t * t * (3 - 2 * t);
function noise(x, z) {
  const x0 = Math.floor(x), z0 = Math.floor(z), fx = smooth(x - x0), fz = smooth(z - z0);
  const a = hash2(x0, z0), b = hash2(x0 + 1, z0), c = hash2(x0, z0 + 1), d = hash2(x0 + 1, z0 + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}
export function heightAt(x, z) {
  const d = Math.hypot(x, z), flat = smooth(Math.min(1, d / 14));        // a kezdőpont körül sík
  return ((noise(x * 0.035, z * 0.035) - 0.5) * 6 + (noise(x * 0.1, z * 0.1) - 0.5) * 1.4) * flat;
}

const GREENS = [0x8fd98a, 0x9be08f, 0x86d082, 0xa6e59a];
const PASTEL = [0xff8fc8, 0xffcf3f, 0xffffff, 0x9bb8ff, 0xc9a0ff, 0xff9f43];

export function run(container) {
  container.innerHTML = `<div class="ow"><canvas class="ow-gl"></canvas><div class="ow-load">🌍 Világ építése…</div>
    <div class="ow-hint">Érintsd meg, merre fusson az unikornis! 👆</div><button class="ow-jump round" aria-label="Ugrás">⬆️</button></div>`;
  const root = container.querySelector('.ow'), canvas = root.querySelector('.ow-gl');
  const loadEl = root.querySelector('.ow-load'), hint = root.querySelector('.ow-hint'), jumpBtn = root.querySelector('.ow-jump');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe9ff); scene.fog = new THREE.Fog(0xbfe9ff, 40, 95);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 160);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb6e0a0, 1.5));
  const sun = new THREE.DirectionalLight(0xfff0d0, 1.4); sun.position.set(20, 40, 10); scene.add(sun);

  // közös geometriák / anyagok (a chunkok újrahasznosítják)
  const G = {
    trunk: new THREE.CylinderGeometry(0.18, 0.26, 1.4, 7), crown: new THREE.ConeGeometry(1.1, 2.6, 8), crown2: new THREE.SphereGeometry(1.0, 8, 6),
    flower: new THREE.SphereGeometry(0.13, 6, 5), rock: new THREE.DodecahedronGeometry(1, 0), log: new THREE.CylinderGeometry(0.32, 0.32, 2.0, 8),
    puddle: new THREE.CircleGeometry(1, 16),
  };
  const M = {
    trunk: new THREE.MeshLambertMaterial({ color: 0x8a5a3c }), crown: new THREE.MeshLambertMaterial({ color: 0xffffff }),
    flower: new THREE.MeshLambertMaterial({ color: 0xffffff }), rock: new THREE.MeshLambertMaterial({ color: 0xb8b0c8, flatShading: true }),
    log: new THREE.MeshLambertMaterial({ color: 0x9b6b43 }), puddle: new THREE.MeshLambertMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.7 }),
  };
  const tmp = new THREE.Object3D(), col = new THREE.Color();
  function instanced(geo, mat, n, place, colors) {
    const m = new THREE.InstancedMesh(geo, mat, n);
    for (let i = 0; i < n; i++) { place(tmp, i); tmp.updateMatrix(); m.setMatrixAt(i, tmp.matrix); if (colors) m.setColorAt(i, col.setHex(colors(i))); }
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; return m;
  }

  // --- világ: chunkok ---
  const chunks = new Map();
  function makeChunk(cx, cz) {
    const rnd = mulberry(hash2(cx, cz, SEED + 7) * 4294967296 | 0);
    const ox = cx * CHUNK, oz = cz * CHUNK, group = new THREE.Group();
    const colliders = [], friends = [];
    // talaj
    const geo = new THREE.PlaneGeometry(CHUNK, CHUNK, 15, 15); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const wx = ox + pos.getX(i), wz = oz + pos.getZ(i); pos.setY(i, heightAt(wx, wz));
      col.setHex(GREENS[(noise(wx * 0.2, wz * 0.2) * 4) | 0]).offsetHSL(0, 0, (noise(wx * 0.5, wz * 0.5) - 0.5) * 0.06); colors.set([col.r, col.g, col.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3)); geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true })); ground.position.set(ox, 0, oz); group.add(ground);
    const spot = () => { for (let k = 0; k < 8; k++) { const x = ox + (rnd() - 0.5) * CHUNK, z = oz + (rnd() - 0.5) * CHUNK; if (Math.hypot(x, z) > 5) return [x, z]; } return [ox + 12, oz + 12]; };
    // fák (törzs + korona), ütközők
    const nTrees = 6 + ((rnd() * 7) | 0), trees = Array.from({ length: nTrees }, () => { const [x, z] = spot(); return { x, z, s: 0.8 + rnd() * 0.9, round: rnd() < 0.4 }; });
    for (const t of trees) colliders.push({ x: t.x, z: t.z, r: 0.5 * t.s + 0.25, h: 99, solid: true });
    group.add(instanced(G.trunk, M.trunk, nTrees, (o, i) => { const t = trees[i]; o.position.set(t.x, heightAt(t.x, t.z) + 0.7 * t.s, t.z); o.scale.setScalar(t.s); o.rotation.set(0, 0, 0); }));
    const crowns = instanced(G.crown, M.crown, nTrees, (o, i) => { const t = trees[i]; o.position.set(t.x, heightAt(t.x, t.z) + 2.3 * t.s, t.z); o.scale.setScalar(t.s); o.rotation.set(0, 0, 0); }, i => [0x6fcf7f, 0x57c46f, 0xffa8d4, 0x8fe08f][(trees[i].x * 7 | 0) & 3 || 0]);
    group.add(crowns);
    // virágok
    const nFl = 50 + ((rnd() * 40) | 0), fl = Array.from({ length: nFl }, () => spot());
    group.add(instanced(G.flower, M.flower, nFl, (o, i) => { o.position.set(fl[i][0], heightAt(fl[i][0], fl[i][1]) + 0.14, fl[i][1]); o.scale.setScalar(0.8 + (i % 3) * 0.3); o.rotation.set(0, 0, 0); }, i => PASTEL[i % PASTEL.length]));
    // sziklák és rönkök: átugorható akadályok
    const nR = 2 + ((rnd() * 3) | 0), rocks = Array.from({ length: nR }, () => { const [x, z] = spot(); return { x, z, s: 0.45 + rnd() * 0.3 }; });
    for (const r of rocks) colliders.push({ x: r.x, z: r.z, r: r.s * 1.0 + 0.2, h: r.s * 1.2, solid: false });
    group.add(instanced(G.rock, M.rock, nR, (o, i) => { const r = rocks[i]; o.position.set(r.x, heightAt(r.x, r.z) + r.s * 0.4, r.z); o.scale.set(r.s, r.s * 0.8, r.s); o.rotation.set(0, i, 0); }));
    const nL = 1 + ((rnd() * 2) | 0), logs = Array.from({ length: nL }, () => { const [x, z] = spot(); return { x, z, a: rnd() * Math.PI }; });
    for (const l of logs) colliders.push({ x: l.x, z: l.z, r: 1.0, h: 0.6, solid: false });
    group.add(instanced(G.log, M.log, nL, (o, i) => { const l = logs[i]; o.position.set(l.x, heightAt(l.x, l.z) + 0.3, l.z); o.rotation.set(0, l.a, Math.PI / 2); o.scale.setScalar(1); }));
    // tócsák (díszítés)
    const nP = 1 + ((rnd() * 3) | 0), pu = Array.from({ length: nP }, () => spot());
    group.add(instanced(G.puddle, M.puddle, nP, (o, i) => { o.position.set(pu[i][0], heightAt(pu[i][0], pu[i][1]) + 0.05, pu[i][1]); o.rotation.set(-Math.PI / 2, 0, 0); o.scale.setScalar(0.9 + (i % 2) * 0.7); }));
    // barátságos állatok: együtt futnak, vagy csak mosolyognak és integetnek
    if (rnd() < 0.7) {
      const n = 1 + (rnd() < 0.3 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const [x, z] = spot(), f = makeFriend(SPECIES_LIST[(rnd() * SPECIES_LIST.length) | 0]);
        f.position.set(x, heightAt(x, z), z); group.add(f);
        friends.push({ g: f, x, z, mode: rnd() < 0.5 ? 'follow' : 'wave', v: 0, ang: rnd() * 6.28, state: 'idle', near: false });
      }
    }
    scene.add(group);
    return { group, colliders, friends, cx, cz };
  }
  function disposeChunk(c) {
    scene.remove(c.group);
    c.group.traverse(o => { if (o.isInstancedMesh) o.dispose?.(); if (o.geometry && o.geometry !== G.trunk && !Object.values(G).includes(o.geometry)) o.geometry.dispose(); if (o.material && o.material.vertexColors) o.material.dispose(); });
  }
  const key = (cx, cz) => cx + ',' + cz;
  function ensure(px, pz, budget = 1) {                 // a játékos előtt gyártjuk a világot (kevés darab / képkocka)
    const cx = Math.floor((px + CHUNK / 2) / CHUNK), cz = Math.floor((pz + CHUNK / 2) / CHUNK);
    let made = 0;
    const need = [];
    for (let dx = -GEN_R; dx <= GEN_R; dx++) for (let dz = -GEN_R; dz <= GEN_R; dz++) if (!chunks.has(key(cx + dx, cz + dz))) need.push([cx + dx, cz + dz, Math.hypot(dx, dz)]);
    need.sort((a, b) => a[2] - b[2]);
    for (const [x, z] of need) { if (made >= budget) break; chunks.set(key(x, z), makeChunk(x, z)); made++; }
    for (const [k, c] of chunks) if (Math.abs(c.cx - cx) > KEEP_R || Math.abs(c.cz - cz) > KEEP_R) { disposeChunk(c); chunks.delete(k); }
    return need.length - made;
  }

  // --- játékos ---
  const unicorn = makeUnicorn({ body: 0xffffff, mane: 0xff5d8f, horn: 0xffd24d, scale: 1.15 }); scene.add(unicorn);
  const P = { x: 0, z: 0, y: 0, vy: 0, grounded: true, ang: 0, speed: 0, target: null, bump: 0 };
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), ndc = new THREE.Vector2(), hit = new THREE.Vector3();
  let steering = false;
  function aimAt(e) {
    const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    plane.constant = -heightAt(P.x, P.z); ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(plane, hit)) P.target = { x: hit.x, z: hit.z };
  }
  canvas.addEventListener('pointerdown', e => { steering = true; aimAt(e); hint.style.opacity = 0; try { canvas.setPointerCapture(e.pointerId); } catch (err) {} });
  canvas.addEventListener('pointermove', e => { if (steering) aimAt(e); });
  const stop = () => { steering = false; P.target = null; };
  canvas.addEventListener('pointerup', stop); canvas.addEventListener('pointercancel', stop);
  function jump() { if (P.grounded) { P.vy = JUMP_V; P.grounded = false; } }
  jumpBtn.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); jump(); });
  const keys = new Set();
  const kd = e => { keys.add(e.code); if (e.code === 'Space') { e.preventDefault(); jump(); } }, ku = e => keys.delete(e.code);
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

  let t = 0, hearts = 0;
  function update(dt) {
    t += dt;
    // irány: mutatott pont felé vagy nyilak
    let dx = 0, dz = 0;
    if (P.target) { dx = P.target.x - P.x; dz = P.target.z - P.z; const d = Math.hypot(dx, dz); if (d > 0.8) { dx /= d; dz /= d; } else { dx = dz = 0; } }
    if (keys.has('ArrowLeft') || keys.has('KeyA')) dx -= 1; if (keys.has('ArrowRight') || keys.has('KeyD')) dx += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) dz -= 1; if (keys.has('ArrowDown') || keys.has('KeyS')) dz += 1;
    const m = Math.hypot(dx, dz);
    const want = m > 0.01 ? WALK : 0;
    P.speed += (want - P.speed) * Math.min(1, dt * 7);
    if (m > 0.01) {
      const targetAng = Math.atan2(-dx, -dz); let da = targetAng - P.ang; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      P.ang += da * Math.min(1, dt * 9);
      P.x += (dx / m) * P.speed * dt; P.z += (dz / m) * P.speed * dt;
    }
    // ugrás
    const ground = heightAt(P.x, P.z);
    if (!P.grounded) { P.vy += GRAV * dt; P.y += P.vy * dt; if (P.y <= 0) { P.y = 0; P.vy = 0; P.grounded = true; } }
    // ütközések a környező chunkokban: fák kikerülendők, kövek/rönkök átugorhatók
    const cx = Math.floor((P.x + CHUNK / 2) / CHUNK), cz = Math.floor((P.z + CHUNK / 2) / CHUNK);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const c = chunks.get(key(cx + a, cz + b)); if (!c) continue;
      for (const o of c.colliders) {
        const ddx = P.x - o.x, ddz = P.z - o.z, d = Math.hypot(ddx, ddz), rr = o.r + 0.45;
        if (d < rr && d > 0.0001) {
          if (!o.solid && P.y > o.h * 0.9) continue;          // ugrás közben átrepül a kövön / rönkön
          const push = (rr - d); P.x += (ddx / d) * push; P.z += (ddz / d) * push;
          if (!o.solid) P.bump = 0.25;                         // kis "bumm" – nincs büntetés
        }
      }
    }
    P.bump = Math.max(0, P.bump - dt);
    const gy = heightAt(P.x, P.z);
    unicorn.position.set(P.x, gy + P.y + (P.bump > 0 ? Math.sin(P.bump * 30) * 0.05 : 0), P.z);
    unicorn.rotation.y = P.ang;
    unicorn.rotation.x = P.grounded ? 0 : -0.25;
    animateRunner(unicorn, t, P.grounded ? Math.min(1, P.speed / WALK) : 0.6);

    // barátok
    hearts = 0;
    for (const c of chunks.values()) for (const f of c.friends) {
      const fx = f.x - P.x, fz = f.z - P.z, dist = Math.hypot(fx, fz);
      f.near = dist < 6;
      let moveV = 0;
      if (f.mode === 'follow' && dist < 18) {
        // a játékos mellé fut, oldalt, kicsit lemaradva
        const side = f.g.userData.kind.length % 2 ? 2.2 : -2.2;
        const tx = P.x + Math.cos(P.ang) * side + Math.sin(P.ang) * 1.5, tz = P.z - Math.sin(P.ang) * side + Math.cos(P.ang) * 1.5;
        const ddx = tx - f.x, ddz = tz - f.z, dd = Math.hypot(ddx, ddz);
        if (dd > 0.6) { moveV = Math.min(WALK * 1.05, dd * 3); f.x += (ddx / dd) * moveV * dt; f.z += (ddz / dd) * moveV * dt; f.ang += (Math.atan2(-ddx, -ddz) - f.ang) * Math.min(1, dt * 8); }
        else f.ang += (P.ang - f.ang) * Math.min(1, dt * 4);
      } else if (dist < 14) {                                  // csak mosolyog és integet: feléd fordul
        f.ang += (Math.atan2(fx, fz) - f.ang) * Math.min(1, dt * 4);
      }
      const fy = heightAt(f.x, f.z);
      f.g.position.set(f.x, fy, f.z); f.g.rotation.y = f.ang;
      animateFriend(f.g, t + f.x, Math.min(1, moveV / WALK), dist < 14 && (f.mode === 'wave' || moveV < 0.5));
      const h = f.g.userData.heart; h.visible = f.near; if (f.near) { h.position.y = 1.9 + Math.sin(t * 4) * 0.12; h.rotation.y = t * 3; hearts++; }
    }
    // kamera: követi az unikornist (az irány a képernyőn állandó, így "oda megy, ahová mutatsz")
    const landscape = root.clientWidth >= root.clientHeight;
    const cam = new THREE.Vector3(P.x, gy + (landscape ? 10 : 13), P.z + (landscape ? 11 : 14));
    camera.position.lerp(cam, Math.min(1, dt * 4)); camera.lookAt(P.x, gy + 0.8, P.z - 2);
    sun.position.set(P.x + 20, 40, P.z + 10); sun.target.position.set(P.x, 0, P.z); sun.target.updateMatrixWorld();
    ensure(P.x, P.z, 1);
  }

  function size() { const w = root.clientWidth || window.innerWidth, h = root.clientHeight || window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  size(); window.addEventListener('resize', size);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(size) : null; ro?.observe(root);

  let raf = 0, last = performance.now(), ready = false, alive = true;
  camera.position.set(0, 10, 11); camera.lookAt(0, 0.8, -2);
  // kezdeti világ előre legenerálva (néhány darab képkockánként), csak utána indul a futás
  function preload() {
    if (!alive) return;
    const left = ensure(0, 0, 3);
    if (left > 0) { loadEl.textContent = `🌍 Világ építése… ${Math.round((1 - left / 25) * 100)}%`; setTimeout(preload, 16); }
    else { ready = true; loadEl.style.display = 'none'; hint.style.opacity = 1; setTimeout(() => { hint.style.opacity = 0; }, 8000); say('Szabad futás! Érintsd meg, merre menjen az unikornis. A nagy nyíl ugrik. Köszönj a barátoknak!'); }
  }
  preload();
  function frame(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; if (ready) update(dt); renderer.render(scene, camera); raf = requestAnimationFrame(frame); }
  raf = requestAnimationFrame(frame);

  container.__ow = { P, chunks, update, jump, heightAt, isReady: () => ready, render: () => renderer.render(scene, camera), friends: () => [...chunks.values()].flatMap(c => c.friends), setTarget: (x, z) => { P.target = { x, z }; } };

  return () => {
    alive = false; cancelAnimationFrame(raf); ro?.disconnect();
    window.removeEventListener('resize', size); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
    for (const c of chunks.values()) disposeChunk(c);
    Object.values(G).forEach(g => g.dispose()); Object.values(M).forEach(m => m.dispose()); renderer.dispose(); renderer.forceContextLoss?.();
  };
}
