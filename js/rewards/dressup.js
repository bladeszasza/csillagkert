// Unikornis-öltöztető, 3D-ben: a gyerek saját unikornisa forog a választott háttér előtt, és minden darab rögtön
// rajta van (szín, minta, sörény, szarv, szárny, fejdísz, szem, nyakdísz, háttér, matrica). Nincs jó vagy rossz.
// Ujjal forgatható (húzás jobbra-balra); ha nem nyúlnak hozzá, lassan körbefordul és megmutatja magát.
// A nagyító gomb közelebb hozza a fejét (a böngésző nagyítása tiltva marad).
// A zárolt elemek ajándékok: bármelyik játék és minden 20. csillag hozhatja őket (js/economy.js). A még meg nem nyert
// elem árnyképként látszik (lakat helyett), az újonnan kapott felragyog. Ugyanez az unikornis fut a szabad futásban,
// a versenyen, lakik a kertben és választható a Barátom játékban (js/avatar.js, js/three/characters.js).
import * as THREE from '../../vendor/three.module.js';
import { mat as lookMat, addLights, createQuality } from '../three/look.js';
import { giftById } from '../gifts.js';
import { owns } from '../economy.js';
import { say } from '../voice.js';
import { play } from '../sounds.js';
import { progress } from '../progress.js';
import { TABS, DEFAULT, MAX_STICKERS } from '../avatar.js';
import { dressSvg, backdropSvg, stickerLayer, stickerSvg } from '../avatar-svg.js';
import { icon, DRESS_ICON } from '../icons.js';
import { calm } from '../motion.js';
import { makeCharacter, animateCharacter, measureCharacter, createCharacterBatch } from '../three/characters.js';

// A ruhatár a játszó gyerek profiljában él (mindenkinek saját unikornisa van)
const load = () => progress.avatar();
const save = s => progress.set({ dress: s });
// Zárolt: ajándék-ruhadarab, amit ez a gyerek még nem nyert meg (a többi elem kezdettől szabad)
const isLocked = id => giftById(id)?.kind === 'dress' && !owns(progress.get(), id);

// Az ajándék-pillanat képe: a gyerek saját unikornisa, rajta az új ruhadarab ("csoport:elem"). Önálló SVG-dokumentum.
// (2D rajz: az ajándék-pillanat nem nyit külön 3D-vásznat – README „Ajándékok és szívek".)
export function preview(id) {
  const s = load(), [key, val] = String(id).split(':');
  if (key in DEFAULT && key !== 'stickers') s[key] = val;
  return dressSvg(s);
}

// a talaj színe a háttérhez illik (fű, éjszakai domb, felhő, homok, felhővár)
const GROUND = { garden: 0xa8e6a0, night: 0x4a3a90, clouds: 0xffffff, sea: 0xffe9b8, castle: 0xffffff };
const IDLE_MS = 2500, SPIN = 0.35;                   // ennyi tétlenség után kezd lassan forogni (radián / mp)

export function run(container) {
  const sel = load();
  const fresh = new Set(progress.get().newDress || []);    // most nyert darabok: felragyognak, és az ő fülükön nyílik meg
  progress.seenDress();
  const firstTab = TABS.find(t => t.groups.some(g => g.items.some(it => fresh.has(`${g.key}:${it.id}`))));
  let tab = firstTab ? firstTab.id : 'test';
  container.innerHTML = `<div class="dress2"><div class="du-view"><div class="du-bg"></div><div class="du-stks"></div><canvas class="du-canvas"></canvas>
    <button class="round du-zoom" aria-label="Közelebb">${icon('ui-zoom')}</button><div class="du-hint" aria-hidden="true">${icon('ui-point')}</div></div>
    <div class="du-tabs"></div><div class="du-opts"></div><div class="du-msg"></div></div>`;
  const view = container.querySelector('.du-view'), bgEl = container.querySelector('.du-bg'), stkEl = container.querySelector('.du-stks'), canvas = container.querySelector('.du-canvas');
  const tabsEl = container.querySelector('.du-tabs'), optsEl = container.querySelector('.du-opts'), msg = container.querySelector('.du-msg');
  const zoomBtn = container.querySelector('.du-zoom'), hint = container.querySelector('.du-hint');

  // --- 3D: átlátszó vászon a rajzolt háttér előtt; a talaj egy korong puha árnyékkal ---
  let renderer = null, scene = null, camera = null, crowd = null, model = null, ground = null, raf = 0, alive = true, quality = null;
  const still = calm();                                    // kevesebb mozgásnál nem forog magától (megnyitáskor dől el)
  let rotY = Math.PI - 0.6, spinT = performance.now(), hopT = -1e9, zoom = 0, zoomGoal = 0, size = { w: 1, h: 1 };
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    quality = createQuality(renderer, { max: 2 }); renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    addLights(scene, { ground: 0xcfe8b8, sunAt: [3, 7, 6] });
    ground = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.12, 48), lookMat({ color: GROUND.garden }));
    ground.position.y = -0.06; scene.add(ground);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ color: 0x3b2a63, transparent: true, opacity: 0.16, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.005; shadow.scale.set(0.55, 1.15, 1); scene.add(shadow);
    crowd = createCharacterBatch(scene);
  } catch (e) { console.warn('A 3D öltöztető nem indult el', e); renderer = null; }

  // Az unikornis újraépítése a mostani ruhával (a helye és a forgása marad)
  function build(celebrate = false) {
    bgEl.innerHTML = backdropSvg(sel); stkEl.innerHTML = stickerLayer(sel);
    if (!renderer) return;
    ground.material.color.setHex(GROUND[sel.bg] ?? GROUND.garden);
    if (model) crowd.remove(model);
    model = makeCharacter('unicorn', sel); crowd.add(model);
    if (celebrate) hopT = performance.now();
  }
  function resize() {
    if (!renderer) return;
    const w = view.clientWidth || 1, h = view.clientHeight || 1; size = { w, h };
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  // Kamera: az egész unikornis (bármerre fordul, elfér), vagy közelről a feje és a háta
  function placeCamera() {
    const tan = Math.tan(camera.fov * Math.PI / 360), far = Math.max(1.45 / tan, 1.45 / (tan * camera.aspect)) + 1.3;
    const d = far * (1 - 0.38 * zoom), lookY = 1.05 + 0.4 * zoom;
    camera.position.set(0, lookY + 0.55, d); camera.lookAt(0, lookY - 0.08, 0);
  }
  function frame(now) {
    raf = 0; if (!alive || !renderer) return;
    if (now - spinT > IDLE_MS && !drag && !still) rotY += SPIN * 0.016;
    zoom += (zoomGoal - zoom) * 0.15;
    const t = now / 1000, hop = Math.max(0, 1 - (now - hopT) / 900);
    model.rotation.y = rotY;
    model.position.y = hop > 0 ? Math.abs(Math.sin(hop * Math.PI * 2)) * 0.35 : 0;
    animateCharacter(model, t, 0, hop > 0);               // új darabnál ugrik egyet és integet (szárnnyal csapkod)
    quality.tick(); crowd.update(); placeCamera(); renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  // --- forgatás ujjal: húzás jobbra-balra ---
  let drag = null;
  view.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    drag = { id: e.pointerId, x: e.clientX, r: rotY }; spinT = performance.now(); hint.classList.add('gone');
    try { view.setPointerCapture(e.pointerId); } catch (err) {}
  });
  view.addEventListener('pointermove', e => { if (!drag || e.pointerId !== drag.id) return; rotY = drag.r + (e.clientX - drag.x) * 0.012; spinT = performance.now(); });
  const end = e => { if (drag && e.pointerId === drag.id) { drag = null; spinT = performance.now(); } };
  view.addEventListener('pointerup', end); view.addEventListener('pointercancel', end);
  zoomBtn.addEventListener('click', () => { zoomGoal = zoomGoal ? 0 : 1; zoomBtn.classList.toggle('sel', !!zoomGoal); play('plop'); spinT = performance.now(); });
  setTimeout(() => hint.classList.add('gone'), 4500);

  // saját rajz, ha van (minta, sörényforma, szarvforma, néhány dísz, matricák); a többi elem emoji vagy színkorong
  const optIcon = (key, it) => { const s = icon(DRESS_ICON[key + ':' + it.id]) || (key === 'stickers' ? stickerSvg(it.id) : '') || it.icon; return s ? `<span class="oi">${s}</span>` : ''; };
  function renderTabs() { tabsEl.innerHTML = TABS.map(t => `<button class="du-tab${t.id === tab ? ' sel' : ''}" data-t="${t.id}">${icon('tab-' + t.id) || t.icon}</button>`).join(''); }
  function renderOpts() {
    const t = TABS.find(x => x.id === tab);
    optsEl.innerHTML = t.groups.map(g => `<div class="du-row">${g.items.map(it => {
      const id = `${g.key}:${it.id}`, locked = isLocked(id);
      const on = g.multi ? sel[g.key].includes(it.id) : sel[g.key] === it.id;
      return `<button class="du-opt${on ? ' sel' : ''}${locked ? ' locked' : ''}${fresh.has(id) ? ' fresh' : ''}" data-k="${g.key}" data-i="${it.id}" ${it.color && !locked ? `style="background:${it.color}"` : ''}>${optIcon(g.key, it)}</button>`;
    }).join('')}</div>`).join('');
  }
  tabsEl.addEventListener('click', e => { const b = e.target.closest('.du-tab'); if (!b) return; tab = b.dataset.t; renderTabs(); renderOpts(); });
  optsEl.addEventListener('click', e => {
    const b = e.target.closest('.du-opt'); if (!b) return;
    const key = b.dataset.k, id = b.dataset.i;
    if (isLocked(`${key}:${id}`)) { msg.textContent = '🎁'; say('Ezt még meg kell nyerni! Bármelyik játékban ajándékba kaphatod.', { remember: false }); return; }
    msg.textContent = '';
    if (key === 'stickers') { const i = sel.stickers.indexOf(id); if (i >= 0) sel.stickers.splice(i, 1); else sel.stickers.push(id); if (sel.stickers.length > MAX_STICKERS) sel.stickers.shift(); }
    else sel[key] = id;
    save(sel); play('magic'); build(key !== 'bg' && key !== 'stickers'); renderOpts();
  });

  const ro = 'ResizeObserver' in window ? new ResizeObserver(resize) : null; ro?.observe(view);
  window.addEventListener('resize', resize);
  build(); renderTabs(); renderOpts(); resize();
  if (renderer) raf = requestAnimationFrame(frame);

  // teszteléshez: a forgatás, a nagyítás és a mostani ruha (nem része a játéknak)
  container.__dress = { sel: () => ({ ...sel, stickers: sel.stickers.slice() }), model: () => model, rot: () => rotY, zoom: () => zoomGoal, calls: () => renderer?.info.render.calls ?? 0,
    height: () => (model ? measureCharacter(model).height : 0), render: () => { if (renderer) { crowd.update(); placeCamera(); renderer.render(scene, camera); } } };
  return () => {
    alive = false; cancelAnimationFrame(raf); ro?.disconnect(); window.removeEventListener('resize', resize);
    if (renderer) {
      crowd.dispose();
      scene.traverse(o => { o.geometry?.dispose?.(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach(x => x.dispose?.()); });
      renderer.dispose(); renderer.forceContextLoss?.();
    }
    container.innerHTML = '';
  };
}
