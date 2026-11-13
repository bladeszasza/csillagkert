// A kert: élő 3D jelenet a játék mögött. A gyűjtött csillagok virágként kinőnek, a barátok (cica, nyuszi,
// kutya, róka, maci, panda) itt laknak: pislognak, sétálnak a zugukban, koppintásra megszólalnak.
// Etetésnél az éhes barát az etetőhelyre sétál, a kamera ráközelít, és őt magát etetjük (js/activities/feed.js).
import * as THREE from '../vendor/three.module.js';
import { makeGardenCat, animateCat } from './rewards/cat3d.js';
import { makeCharacter, animateCharacter, createCharacterBatch } from './three/characters.js';
import { friendById, friendsFor, flowerSpot, MAX_FLOWERS, GOLD_MAX, goldSpot, FEED_SPOT, FEED_GATE, PLACES, AREAS, floraFor, floraById } from './friends.js';
import { animalVoice } from './sounds.js';
import { merge } from './geo.js';
import { buildPlaces, buildLand } from './places3d.js';
import { DECOR, giftById } from './gifts.js';
import { buildDecorGeo, createFriendTree } from './decor3d.js';
import { buildFloraGeo } from './flora3d.js';
import { mat as lookMat, addLights, createQuality } from './three/look.js';

const FOV = 50, TAN = Math.tan(FOV * Math.PI / 360);
const SCALE = 1.35;                                  // a barátok mérete a kertben
const SKY = 0xbfefff;
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = v => Math.max(0, Math.min(1, v));
const ease = k => k * k * (3 - 2 * k);
const angDiff = (to, from) => { let d = (to - from) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

export function createGarden(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  const quality = createQuality(renderer, { max: 2 });          // a felbontás gazdája: tartós akadozásnál lépcsőzetesen csökkenti
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, 14, 34);
  const fogHome = [14, 34];
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);

  const { sun } = addLights(scene, { ground: 0xcfe8b8, sunAt: [4, 8, 5] });

  const ground = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 0.6, 64), lookMat({ color: 0xa8e6a0 }));
  ground.position.y = -0.3; ground.scale.x = 1.9; scene.add(ground);           // széles rét: balra a tópart, jobbra a tanya

  // Az állomások helyei (ceruzatorony, házikó, harangos pavilon…) és a háttér fái: egyetlen háló, egyetlen rajzolási hívás
  let placesMesh = null;
  try { placesMesh = buildPlaces(); scene.add(placesMesh); } catch (e) { console.warn('A kerti tereptárgyak nem épültek fel', e); }

  // Napszak: a csillagmérővel együtt a reggeli égből naplementés aranyóra lesz (k: 0..1)
  const skyA = new THREE.Color(SKY), skyB = new THREE.Color(0xffd9b8), sunA = new THREE.Color(0xfff2d0), sunB = new THREE.Color(0xffb870);
  function setDay(k) {
    k = clamp01(k);
    scene.background.lerpColors(skyA, skyB, k * k); scene.fog.color.copy(scene.background);
    sun.color.lerpColors(sunA, sunB, k); sun.position.set(4 + k * 5, 8 - k * 3.5, 5);
  }

  const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), q4 = new THREE.Quaternion(), s3 = new THREE.Vector3();

  // --- felhők: 18 gömb egyetlen példányosított hálóban ---
  const puffs = [], cloudX = [], cloudY = [], cloudZ = [];
  for (let i = 0; i < 6; i++) {
    cloudX.push(-12 + i * 5); cloudY.push(5 + Math.random() * 2); cloudZ.push(-8 - Math.random() * 4);
    for (let j = 0; j < 3; j++) puffs.push({ c: i, ox: j * 0.8 - 0.8, oy: Math.random() * 0.3, r: 0.7 + Math.random() * 0.4 });
  }
  const clouds = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 10), lookMat({ color: 0xffffff }), puffs.length);
  clouds.frustumCulled = false; scene.add(clouds);
  function placeClouds(px = 0) {                         // px: a kamera vízszintes helye – a felhők messze vannak, vele tartanak
    puffs.forEach((p, k) => { m4.makeScale(p.r, p.r, p.r).setPosition(px + cloudX[p.c] + p.ox, cloudY[p.c] + p.oy, cloudZ[p.c]); clouds.setMatrixAt(k, m4); });
    clouds.instanceMatrix.needsUpdate = true;
  }
  placeClouds();

  // --- virágok = a gyűjtött csillagok (egyszerre legfeljebb MAX_FLOWERS); két példányosított háló (szár + közép, szirmok) ---
  const tilt = new THREE.Matrix4().makeRotationX(0.55).setPosition(0, 0.95, 0);     // a virág arca a néző felé dől
  const at = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
  const stemGeo = merge([
    { geo: new THREE.CylinderGeometry(0.04, 0.05, 0.9, 5, 1, true), matrix: at(0, 0.45, 0), color: 0x4caf50 },
    { geo: new THREE.SphereGeometry(0.17, 7, 5), matrix: tilt, color: 0xffe066 },
  ]);
  const petalGeo = merge(Array.from({ length: 6 }, (_, k) => ({
    geo: new THREE.SphereGeometry(0.2, 6, 4), matrix: tilt.clone().multiply(at(Math.cos(k * 1.047) * 0.26, 0, Math.sin(k * 1.047) * 0.26)),
  })));
  const sway = { value: 0 };
  const swaying = mat => {                              // a hajladozást a videokártya számolja, nem képkockánként mi
    mat.onBeforeCompile = sh => {
      sh.uniforms.uSway = sway;
      sh.vertexShader = 'uniform float uSway;\n' + sh.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n#ifdef USE_INSTANCING\n  transformed.x += sin(uSway * 1.2 + instanceMatrix[3][0] * 1.7 + instanceMatrix[3][2]) * 0.05 * transformed.y;\n#endif');
    };
    return mat;
  };
  const mainGroup = new THREE.Group(); scene.add(mainGroup);
  const stems = new THREE.InstancedMesh(stemGeo, swaying(lookMat({ vertexColors: true })), MAX_FLOWERS);
  const petals = new THREE.InstancedMesh(petalGeo, swaying(lookMat({ color: 0xffffff })), MAX_FLOWERS);
  stems.count = petals.count = 0; stems.frustumCulled = petals.frustumCulled = false; mainGroup.add(stems, petals);
  const colors = [0xff8fc8, 0xffcf3f, 0x8e5be8, 0x7fe0c0, 0xff9f6b].map(c => new THREE.Color(c));
  const faded = new THREE.Color(0xc9a46a), tint = new THREE.Color();
  // A j. virág (j = hányadik csillag) a j % MAX_FLOWERS helyen nyílik; ha a hely foglalt, a régi virág előbb elhervad.
  // Ugyanazon a helyen körönként más színű virág nyílik.
  const growing = [];
  let bloomed = 0;                                          // eddig nyílt virágok = csillagok (a látható ennél kevesebb lehet)
  const slotOf = j => j % MAX_FLOWERS;
  const colorOf = j => colors[(j + Math.floor(j / MAX_FLOWERS)) % colors.length];
  function setFlower(j, k, sink = 0) {
    const s = slotOf(j), p = flowerSpot(s), size = (0.85 + ((j * 37) % 10) * 0.03) * k;
    m4.makeScale(size, size, size).setPosition(p.x, -sink, p.z);
    stems.setMatrixAt(s, m4); petals.setMatrixAt(s, m4);
    stems.instanceMatrix.needsUpdate = petals.instanceMatrix.needsUpdate = true;
  }
  function paint(j, c) { petals.setColorAt(slotOf(j), c); petals.instanceColor.needsUpdate = true; }
  function addFlower(j, animate) {
    const s = slotOf(j), old = j - MAX_FLOWERS;
    for (let k = growing.length - 1; k >= 0; k--) if (slotOf(growing[k].j) === s) { setFlower(growing[k].j, 1); growing.splice(k, 1); }
    if (animate && old >= 0) growing.push({ j, old, born: performance.now() });          // előbb a régi hervad el, aztán nő az új
    else {
      paint(j, colorOf(j)); setFlower(j, animate ? 0.01 : 1);
      if (animate) growing.push({ j, born: performance.now() });
    }
    stems.count = petals.count = Math.max(stems.count, s + 1);
  }
  // tesztekhez: a j. virág mérete (a teljes méretéhez képest), színe, és hogy épp hervad-e (fade: mennyire fakult meg)
  const probe = new THREE.Color();
  function flowerAt(j) {
    const s = slotOf(j), g = growing.find(x => slotOf(x.j) === s);
    let shown = g ? (g.old !== undefined ? g.old : g.j) : j; while (shown >= bloomed) shown -= MAX_FLOWERS;   // ami most ezen a helyen nyílik
    stems.getMatrixAt(s, m4); m4.decompose(v3, q4, s3); petals.getColorAt(s, probe);
    const base = colorOf(shown), far = Math.hypot(faded.r - base.r, faded.g - base.g, faded.b - base.b) || 1;
    return { slot: s, shown, k: s3.x / (0.85 + ((shown * 37) % 10) * 0.03), color: probe.getHex(), own: probe.getHex() === colorOf(j).getHex(),
      withering: g?.old !== undefined, fade: Math.hypot(probe.r - base.r, probe.g - base.g, probe.b - base.b) / far };
  }
  function stepFlowers(now) {
    for (let k = growing.length - 1; k >= 0; k--) {
      const g = growing[k]; let age = (now - g.born) / 700;
      if (g.old !== undefined) {                            // hervadás: a szirmok megfakulnak, a virág lekonyul és eltűnik
        const w = Math.min(1, (now - g.born) / 900);
        if (w < 1) { paint(g.old, tint.copy(colorOf(g.old)).lerp(faded, Math.min(1, w * 1.6))); setFlower(g.old, Math.max(0.01, 1 - w * w), w * 0.35); continue; }
        paint(g.j, colorOf(g.j)); g.born += 900; delete g.old; age = (now - g.born) / 700;
      }
      if (age >= 1) { setFlower(g.j, 1); growing.splice(k, 1); }
      else setFlower(g.j, Math.max(0.01, 1 - Math.pow(1 - age, 3)) * (1 + Math.sin(age * 3.14) * 0.3));
    }
  }

  // --- ajándékok a kertben: kerti díszek (tópart, tanya), aranyvirágok és a szívekből növő Barátság fája ---
  const decorMat = lookMat({ vertexColors: true }), decor = new Map(), popping = [];
  const tree = createFriendTree(scene);
  const goldStems = new THREE.InstancedMesh(stemGeo, swaying(lookMat({ vertexColors: true })), GOLD_MAX);
  const goldPetals = new THREE.InstancedMesh(petalGeo, swaying(lookMat({ color: 0xffc21a, emissive: 0x6a4300 })), GOLD_MAX);
  goldStems.count = goldPetals.count = 0; goldStems.frustumCulled = goldPetals.frustumCulled = false; mainGroup.add(goldStems, goldPetals);
  function addDecor(id, animate) {
    const g = giftById(id); if (!g?.spot || decor.has(id)) return;
    const geo = buildDecorGeo(id); if (!geo) return;
    const m = new THREE.Mesh(geo, decorMat), [, x, z, rot, k = 1] = g.spot;
    m.position.set(x, 0, z); m.rotation.y = rot || 0; m.frustumCulled = false; m.userData.k = k;
    m.scale.setScalar(animate ? 0.01 : k); scene.add(m); decor.set(id, m);
    if (animate) popping.push({ m, t0: performance.now() + 500 });
  }
  // --- távoli földek (js/friends.js AREAS, land): saját tájelemek és fák egy csoportban, a lakóik saját kötegben ---
  // Mindkettőt csak akkor rajzoljuk, ha a kamera látja valamelyik részét (lásd cull), így a háromszögek száma kordában marad.
  const lands = new Map();
  for (const r of AREAS.filter(a => a.land)) {
    const group = new THREE.Group(), crowdGroup = new THREE.Group(); scene.add(group, crowdGroup);
    let boxes = [];
    try { const b = buildLand(r.id); if (b) { group.add(b.mesh); boxes = b.boxes.map(([a, b2, c, d, e, f]) => new THREE.Box3(new THREE.Vector3(a, b2, c), new THREE.Vector3(d, e, f))); } }
    catch (e) { console.warn('Egy távoli föld tájelemei nem épültek fel', r.id, e); }
    lands.set(r.id, { group, crowdGroup, crowd: createCharacterBatch(crowdGroup, { shadows: true }), boxes });
  }
  const landOf = def => (def?.area && lands.get(def.area)) || null;

  // A kertrészek saját növényei (js/friends.js FLORA): a csillagokkal nőnek, mint a barátok; saját tárban, nem az ajándékok között
  const flora = new Map();
  function addFlora(id, animate) {
    const f = floraById(id); if (!f || flora.has(id)) return;
    const geo = buildFloraGeo(id); if (!geo) return;
    const m = new THREE.Mesh(geo, decorMat), [x, z, rot = 0, k = 1] = f.spot;
    m.position.set(x, 0, z); m.rotation.y = rot; m.frustumCulled = false; m.userData.k = k;
    const land = landOf(f);
    m.scale.setScalar(animate ? 0.01 : k); (land?.group || scene).add(m); flora.set(id, m);
    if (land) { geo.computeBoundingBox(); const bb = geo.boundingBox; land.boxes.push(new THREE.Box3(new THREE.Vector3(x + bb.min.x * k - 0.1, 0, z + bb.min.z * k - 0.1), new THREE.Vector3(x + bb.max.x * k + 0.1, bb.max.y * k, z + bb.max.z * k + 0.1))); }
    if (animate) popping.push({ m, t0: performance.now() + 500 });
  }
  // owned: a megszerzett ajándékok; hearts: szívek; gold: aranyvirágok; animate: az új díszek és szívek kipattannak
  function setGifts({ owned = [], hearts = 0, gold = 0 } = {}, animate = false) {
    for (const id of owned) if (giftById(id)?.kind === 'garden') addDecor(id, animate);
    tree.setHearts(hearts, animate);
    const n = Math.min(GOLD_MAX, gold | 0);
    for (let k = goldPetals.count; k < n; k++) {
      const p = goldSpot(k), s = 1.25;
      m4.makeScale(s, s, s).setPosition(p.x, 0, p.z); goldStems.setMatrixAt(k, m4); goldPetals.setMatrixAt(k, m4);
    }
    goldStems.count = goldPetals.count = n; goldStems.instanceMatrix.needsUpdate = goldPetals.instanceMatrix.needsUpdate = true;
  }

  // --- szívek (koppintásra és evés után): rajzolt szív, nem emoji ---
  const heartTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    x.fillStyle = '#ff4f8f'; x.beginPath(); x.moveTo(32, 57); x.bezierCurveTo(2, 36, 8, 8, 32, 22); x.bezierCurveTo(56, 8, 62, 36, 32, 57); x.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const hearts = Array.from({ length: 8 }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, transparent: true, depthWrite: false, fog: false })); s.visible = false; scene.add(s);
    return { s, t0: -1e9, x: 0, y: 0, z: 0 };
  });
  function heartsAt(a, n = 3) {
    const top = a.def.height * a.size;
    for (let k = 0; k < n; k++) {
      const h = hearts.reduce((best, x) => (x.t0 < best.t0 ? x : best));
      h.t0 = performance.now() + k * 160; h.x = a.x + rnd(-0.5, 0.5) * a.size; h.y = top * rnd(0.8, 1.0); h.z = a.z + 0.3;
    }
  }

  // --- a kert lakói: a cica saját modell, a többi barát alkatrészei közös, példányosított hálókban (pár rajzolási hívás) ---
  const actors = new Map(), crowd = createCharacterBatch(mainGroup, { shadows: true });
  let avatarCfg = null;                                 // a saját unikornis ruhája (js/avatar.js); setAvatar() állítja
  function spawn(id, enter) {
    if (actors.has(id)) return actors.get(id);
    const def = friendById(id); if (!def) return null;
    const isCat = id === 'cat', g = isCat ? makeGardenCat() : makeCharacter(id, id === 'unicorn' ? avatarCfg : undefined), size = isCat ? 1 : SCALE;
    g.scale.setScalar(size);
    if (!isCat) (landOf(def)?.crowd || crowd).add(g); else crowd.shadow(g, 0.8, 0.66);
    const u = g.userData, now = performance.now();
    const a = { id, def, g, isCat, size, face0: isCat ? 0 : Math.PI, x: def.home[0], z: def.home[1], heading: isCat ? 0 : Math.PI, want: isCat ? 0 : Math.PI,
      state: 'idle', move: null, until: now + rnd(1500, 5000), seed: rnd(0, 9), last: now, hop: 0, chew: 0, nod: 0, turn: 0, turnSide: 1, wave: 0,
      blink: now + rnd(800, 4000), blinkEnd: 0, belly: 0, bodyBase: u.body.scale.clone(), awake: 0 };
    if (enter) {                                                                  // érkezés: kívülről besétál, aztán köszön
      if (def.area) { a.x = def.home[0] + (def.home[0] < 0 ? -8 : 8); a.z = def.home[1] + 0.8; }
      else { a.x = def.home[0] < 0 ? -10 : 10; a.z = 1.6; }
      a.greet = true; walk(a, def.home[0], def.home[1], 2600, 'idle', true);
    }
    a.heading = a.want;
    scene.add(g); actors.set(id, a);
    return a;
  }
  // Egyenes vonalú séta az óra szerint (nem képkockánként), így lassú megjelenítés mellett is időre odaér
  // via: közbülső pontok (pl. a tereptárgyak közti rés), hogy a barát ne a tárgyakon sétáljon át
  // chainAt: ha egy séta végén a következő séta indul (pl. tanyára menet), az óra szerint akkor indult volna,
  // amikor az előző véget ért – így akkor is jó helyen jár, ha közben sokáig nem volt képkocka (szünet, háttérben futás)
  let chainAt = 0;
  function walk(a, x, z, dur, then, run, via = []) {
    const pts = [[a.x, a.z], ...via, [x, z]], lens = [0];
    for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    a.move = { pts, lens, t0: chainAt || performance.now(), dur: Math.max(1, dur), then, run: !!run };
    a.state = 'walk';
  }
  const pathLen = (a, x, z, via = []) => { let l = 0, p = [a.x, a.z]; for (const q of [...via, [x, z]]) { l += Math.hypot(q[0] - p[0], q[1] - p[1]); p = q; } return l; };
  function stepActor(a, now, t) {
    let speed = 0;
    for (let guard = 0; a.move && guard < 4; guard++) {                           // egymás utáni séták: egy lépésben akár többön is túljut
      const m = a.move, k = clamp01((now - m.t0) / m.dur), d = k * m.lens[m.lens.length - 1];
      let i = 1; while (i < m.pts.length - 1 && m.lens[i] < d) i++;
      const p0 = m.pts[i - 1], p1 = m.pts[i], u = clamp01((d - m.lens[i - 1]) / ((m.lens[i] - m.lens[i - 1]) || 1));
      a.x = p0[0] + (p1[0] - p0[0]) * u; a.z = p0[1] + (p1[1] - p0[1]) * u; speed = m.run ? 0.85 : 0.25;
      if (!a.isCat && (p1[0] !== p0[0] || p1[1] !== p0[1])) a.want = a.face0 + Math.atan2(p1[0] - p0[0], p1[1] - p0[1]);
      if (k < 1) break;
      // megérkezett: ugrik, megszólal, szívek
      a.move = null; a.until = now + rnd(2500, 6500); speed = 0;
      if (typeof m.then === 'function') { a.state = 'idle'; chainAt = m.t0 + m.dur; try { m.then(a); } finally { chainAt = 0; } } else a.state = m.then;
      if (a.greet) { a.greet = false; poke(a); }
    }
    if (!a.move) {
      if (a.state === 'feeding') a.want = a.face0 + Math.atan2(camera.position.x - a.x, camera.position.z - a.z);
      else {
        a.want = a.face0;
        if (!a.isCat && !a.def.still && now > a.until) {                         // kis séta a saját zugában (a bagoly a helyén szundikál)
          const ang = rnd(0, 6.28), r = rnd(0.15, 0.4), x = a.def.home[0] + Math.cos(ang) * r, z = a.def.home[1] + Math.sin(ang) * r;
          walk(a, x, z, Math.hypot(x - a.x, z - a.z) / 0.55 * 1000, 'idle', false);
          if (Math.random() < 0.3) a.wave = now + 1600;
        }
      }
    }
    const dt = Math.min(0.5, (now - a.last) / 1000); a.last = now;
    a.heading += angDiff(a.want, a.heading) * (1 - Math.exp(-dt * 9));

    const hopK = a.hop > now ? 1 - (a.hop - now) / 900 : 0;
    const skip = a.isCat && a.move ? Math.abs(Math.sin((now - a.move.t0) / 170)) * 0.3 : 0;      // a cicának nincs lába: apró ugrásokkal halad
    a.g.position.set(a.x, hopK > 0 ? Math.abs(Math.sin(hopK * Math.PI * 2)) * 0.55 * a.size : skip, a.z);
    a.g.rotation.y = a.heading;
    if (a.isCat) animateCat(a.g, t, { cheer: hopK > 0 });
    else animateCharacter(a.g, t + a.seed, speed, a.wave > now || hopK > 0);

    const u = a.g.userData, sign = a.isCat ? 1 : -1;                              // a cica +z, a többiek -z felé néznek
    const chewing = a.chew > now, nodK = a.nod > now ? 1 - (a.nod - now) / 800 : 0, turnK = a.turn > now ? 1 - (a.turn - now) / 1000 : 0;
    u.head.rotation.x = sign * (chewing ? 0.14 + Math.sin(t * 17) * 0.07 : nodK > 0 ? Math.sin(nodK * Math.PI * 2) ** 2 * 0.4 : 0);
    u.head.rotation.y = turnK > 0 ? Math.sin(turnK * Math.PI) * 0.8 * a.turnSide : 0;   // udvariasan elfordítja a fejét
    u.mouth.visible = chewing; u.smile.visible = !chewing;
    if (chewing) u.mouth.scale.y = 0.35 + Math.abs(Math.sin(t * 9)) * 0.75;
    // a bagoly nappal szundikál: csukott szemmel ül, koppintásra, érkezéskor és etetéskor felébred egy kicsit
    const dozing = a.def.sleepy && now > a.awake && a.state !== 'feeding' && !a.move;
    const shut = now < a.blinkEnd || dozing; u.eyes.forEach(e => { e.scale.y = shut ? 0.12 : 1; });
    if (now > a.blink) { a.blinkEnd = now + 130; a.blink = now + rnd(2200, 6000); }
    const b = a.belly, bb = a.bodyBase; u.body.scale.set(bb.x * (1 + 0.16 * b), bb.y * (1 + 0.07 * b), bb.z * (1 + 0.12 * b));
  }

  // --- kamera: alaphelyzet (az egész kert) és etetés (közeli az éhes barátról); a kettő között simán vált ---
  let W = 1, H = 1;
  const home = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() }, close = { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), d: 8 };
  const zoom = { from: 0, to: 0, t0: 0, dur: 1 };
  let feeding = null;
  const zoomAt = now => zoom.from + (zoom.to - zoom.from) * ease(clamp01((now - zoom.t0) / zoom.dur));
  // vízszintes átsiklás a kert széleire (tópart, tanya): az óra szerint, így lassú képfrissítésnél is időre odaér
  const pan = { from: 0, to: 0, t0: 0, dur: 1, area: null };
  const panAt = now => pan.from + (pan.to - pan.from) * ease(clamp01((now - pan.t0) / pan.dur));
  function goTo(areaId = null) {
    const now = performance.now(), x = AREAS.find(r => r.id === areaId)?.x ?? 0, from = panAt(now);
    pan.area = x ? areaId : null;
    if (Math.abs(from - x) < 0.01 && Math.abs(pan.to - x) < 0.01) return 0;
    pan.from = from; pan.to = x; pan.t0 = now; pan.dur = Math.max(500, Math.min(1500, Math.abs(x - from) * 75));
    if (paused) draw(now);
    return pan.dur;
  }
  function computeHome() {
    const portrait = H > W, small = H < 640 && W > H;
    // álló képernyőn a kamera messzebbről és magasabbról néz, hogy minden barát elférjen egymás mellett
    home.pos.set(0, portrait ? 7.2 : 4.2, portrait ? 15.5 : 9);
    fogHome[0] = home.pos.length() + 4; fogHome[1] = home.pos.length() + 24;
    // Alul a csempék és a Tovább gomb vannak: a kert közepe ezért a képernyő közepénél feljebb kerül
    const ny = 1 - 2 * (portrait ? 0.37 : small ? 0.34 : 0.43);
    const dy = 1.3 - home.pos.y, dz = -home.pos.z, pitch = Math.atan2(-dy, -dz) + Math.atan(ny * TAN);
    home.quat.setFromEuler(new THREE.Euler(-pitch, 0, 0));
  }
  function computeClose() {
    if (!feeding) return;
    const a = feeding.a, hA = a.def.height * a.size, r = canvas.getBoundingClientRect();
    let fr = null; try { fr = feeding.frame?.(); } catch (e) {}
    const f = fr && fr.width > 40 && fr.height > 40
      ? { cx: fr.left + fr.width / 2 - r.left, cy: fr.top + fr.height / 2 - r.top, w: fr.width, h: fr.height }
      : { cx: W / 2, cy: H * 0.42, w: W * 0.8, h: H * 0.45 };
    const pxH = Math.max(60, Math.min(f.h * 0.86, f.w * 0.9)), d = hA * H / (pxH * 2 * TAN), p = 0.14;
    const xc = (f.cx - W / 2) / (W / 2) * d * TAN * (W / H), yc = (H / 2 - f.cy) / (H / 2) * d * TAN;
    close.pos.set(feeding.x - xc, hA / 2 - yc * Math.cos(p) + d * Math.sin(p), feeding.z + yc * Math.sin(p) + d * Math.cos(p));
    close.quat.setFromEuler(new THREE.Euler(-p, 0, 0)); close.d = d;
  }
  const homeAt = new THREE.Vector3();
  function applyCamera(now) {
    const k = zoomAt(now);
    if (k > 0) computeClose();
    homeAt.copy(home.pos); homeAt.x += panAt(now);
    camera.position.lerpVectors(homeAt, close.pos, k); camera.quaternion.slerpQuaternions(home.quat, close.quat, k);
    // etetésnél a háttér (a többi barát) elhalványul, hogy az éhes állat legyen a főszereplő
    scene.fog.near = fogHome[0] + (close.d + 0.6 - fogHome[0]) * k; scene.fog.far = fogHome[1] + (close.d + 9 - fogHome[1]) * k;
    camera.updateMatrixWorld();
  }
  function resize() {
    W = canvas.clientWidth || window.innerWidth; H = canvas.clientHeight || window.innerHeight;
    renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
    computeHome();
    if (paused) draw(performance.now());                // szünetben is igazodjon a kép az új mérethez
  }

  // --- mit lát a kamera? A kert közepe (virágmező + lakók) és a távoli földek (tájelemek, fák, lakók) csak akkor rajzolódik,
  // ha valamelyik befoglalójuk (a lakóknál gömb, a tájelemeknél és a fáknál doboz) a látótérbe esik. A befoglalók fedik a
  // tárgyakat (a lakóké a szökkenést is), így semmi nem „pattan be" a kép szélén.
  const frustum = new THREE.Frustum(), pv = new THREE.Matrix4(), probeS = new THREE.Sphere(), FIELD = new THREE.Sphere(new THREE.Vector3(0, 0.5, -1), 13.2);
  const sees = (x, z, h) => { probeS.center.set(x, h / 2, z); probeS.radius = Math.max(0.6, h * 0.8); return frustum.intersectsSphere(probeS); };
  function cull() {
    pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); frustum.setFromProjectionMatrix(pv);
    let main = frustum.intersectsSphere(FIELD);
    const seen = new Set();
    actors.forEach(a => {
      const L = landOf(a.def);
      if (L ? seen.has(L) : main) return;
      if (sees(a.x, a.z, a.def.height * a.size)) { if (L) seen.add(L); else main = true; }
    });
    mainGroup.visible = main;
    for (const L of lands.values()) { L.crowdGroup.visible = seen.has(L); L.group.visible = L.boxes.some(b => frustum.intersectsBox(b)); }
  }

  // --- egy lépés: minden az óra szerint mozog, így a lassan frissülő képernyőn is jó helyen áll ---
  const t0 = performance.now();
  let lastCloud = t0;
  function step(now) {
    const t = (now - t0) / 1000;
    applyCamera(now); cull();
    actors.forEach(a => stepActor(a, now, t));
    if (mainGroup.visible) crowd.update();                                         // amit nem lát a kamera, annak a kötegét nem frissítjük
    for (const L of lands.values()) if (L.crowdGroup.visible) L.crowd.update();
    return t;
  }
  function draw(now) {
    const t = step(now), dt = Math.min(0.1, (now - lastCloud) / 1000); lastCloud = now;
    sway.value = t;
    for (let i = 0; i < 6; i++) { cloudX[i] += 0.24 * (1 + i * 0.1) * dt; if (cloudX[i] > 16) cloudX[i] = -16; }
    placeClouds(panAt(now));
    stepFlowers(now);
    for (let k = popping.length - 1; k >= 0; k--) {                // új kerti dísz: kipattan a helyén
      const p = popping[k], a = (now - p.t0) / 700;
      if (a < 0) continue;
      if (a >= 1) { p.m.scale.setScalar(p.m.userData.k); popping.splice(k, 1); } else p.m.scale.setScalar(p.m.userData.k * Math.max(0.01, Math.sin(a * Math.PI / 2) * (1 + Math.sin(a * Math.PI) * 0.25)));
    }
    tree.update(now);
    for (const h of hearts) {
      const k = (now - h.t0) / 1300;
      if (k < 0 || k > 1) { h.s.visible = false; continue; }
      h.s.visible = true; h.s.position.set(h.x, h.y + k * 1.5, h.z); h.s.scale.setScalar(0.35 + Math.sin(k * 3.14) * 0.35); h.s.material.opacity = 1 - k * k;
    }
    renderer.render(scene, camera);
  }
  let paused = false, raf = 0;
  function loop(now) { raf = 0; if (paused) return; quality.tick(); draw(now); raf = requestAnimationFrame(loop); }

  window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 250));
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  window.visualViewport?.addEventListener('resize', resize);
  resize();
  raf = requestAnimationFrame(loop);

  // --- képernyő-vetítés: hol van a barát (és a szája) a képernyőn ---
  function screenOf(a, now = performance.now()) {
    step(now); a.g.updateMatrixWorld(true);
    const r = canvas.getBoundingClientRect(), hA = a.def.height * a.size;
    const px = p => { v3.copy(p).project(camera); return { x: r.left + (v3.x + 1) / 2 * r.width, y: r.top + (1 - v3.y) / 2 * r.height }; };
    const depth = v3.set(a.x, hA / 2, a.z).sub(camera.position).dot(s3.set(0, 0, -1).applyQuaternion(camera.quaternion));
    const ppu = r.height / (2 * TAN * Math.max(0.5, depth));                       // képpont / egység ebben a mélységben
    const c = px(new THREE.Vector3(a.x, a.g.position.y + hA / 2, a.z)), mouth = px(a.g.userData.mouth.getWorldPosition(new THREE.Vector3()));
    const hw = Math.max(28, hA * 0.36 * ppu), hh = Math.max(28, hA * 0.52 * ppu);   // a kicsiket (egér, teknős) is könnyű eltalálni: legalább 56 képpont
    return { left: c.x - hw, right: c.x + hw, top: c.y - hh, bottom: c.y + hh, cx: c.x, cy: c.y, mouth, visible: depth > 0.5 };
  }

  // koppintás a kertben: a barát ugrik egyet, megszólal a saját hangján, szívek szállnak
  function poke(a) { const now = performance.now(); a.hop = now + 900; a.awake = now + 4500; heartsAt(a, 2); animalVoice(a.id); }
  canvas.addEventListener('pointerdown', e => {
    if (paused || feeding) return;
    let hit = null, best = Infinity;
    actors.forEach(a => { const s = screenOf(a); if (s.visible && e.clientX > s.left && e.clientX < s.right && e.clientY > s.top && e.clientY < s.bottom) { const d = Math.hypot(e.clientX - s.cx, e.clientY - s.cy); if (d < best) { best = d; hit = a; } } });
    if (hit) poke(hit);
  });

  // Átöltözés: a kertben lakó saját unikornis új ruhát kap (a helye és a mozgása marad)
  function setAvatar(cfg) {
    avatarCfg = cfg || null;
    const a = actors.get('unicorn'); if (!a) return false;
    const old = a.g, g = makeCharacter('unicorn', avatarCfg);
    g.scale.setScalar(a.size); g.position.copy(old.position); g.rotation.copy(old.rotation);
    crowd.remove(old); scene.remove(old); crowd.add(g); scene.add(g);
    a.g = g; a.bodyBase = g.userData.body.scale.clone();
    if (paused) draw(performance.now());
    return true;
  }

  function setStars(total, fed = [], animate = true) {
    total = Math.max(0, total | 0);
    const first = bloomed === 0 || total < bloomed;        // betöltéskor csak a legutóbbi virágok nyílnak ki, animáció nélkül
    if (first) { bloomed = Math.max(0, total - MAX_FLOWERS); growing.length = 0; stems.count = petals.count = 0; }
    while (bloomed < total) { addFlower(bloomed, !first && bloomed === total - 1); bloomed++; }
    const had = actors.size > 0;
    for (const id of friendsFor(total, fed)) {                                    // új barát: besétál az ösvényen
      if (actors.has(id)) continue;
      try { spawn(id, had && animate); } catch (e) { console.warn('Egy barát nem érkezett meg', id, e); }   // egy hibás modell ne állítsa le a kertet
    }
    for (const id of floraFor(total)) {                                           // új fa: kinő a helyén
      try { addFlora(id, had && animate); } catch (e) { console.warn('Egy fa nem nőtt ki', id, e); }
    }
  }

  // Etetés: az éhes barát az etetőhelyre megy, a kamera ráközelít. frame(): a képernyő-téglalap, ahová az állat kerüljön.
  function beginFeed(id, frame) {
    endFeed();
    const fresh = !actors.has(id), a = spawn(id, false); if (!a) return null;
    const now = performance.now(), sx = FEED_SPOT[0], sz = FEED_SPOT[1];
    goTo(null);                                                                           // a kamera a kert közepére siklik vissza
    const far = fresh || !!a.def.area;
    if (far) { a.x = 10; a.z = sz + 0.6; a.move = null; }                                 // új barát, vagy a tópartról / tanyáról jön: oldalról sétál be
    const via = far ? [] : [FEED_GATE];                                                   // a kertből a tereptárgyak közti résen át jön ki
    const dur = Math.max(500, Math.min(2600, pathLen(a, sx, sz, via) / 3.6 * 1000));
    walk(a, sx, sz, dur, 'feeding', true, via);
    a.belly = 0;
    feeding = { a, frame, x: sx, z: sz };
    zoom.from = zoomAt(now); zoom.to = 1; zoom.t0 = now; zoom.dur = 1100;
    computeClose();
    return {
      fresh, arriveMs: Math.max(dur, 900),
      rect: () => screenOf(a),
      eat(ms = 1200) { const n = performance.now(); a.chew = n + ms; a.turn = 0; },
      refuse() { a.turn = performance.now() + 1000; a.turnSide = Math.random() < 0.5 ? -1 : 1; },
      thank() { const n = performance.now(); a.chew = 0; a.belly = 1; a.nod = n + 800; a.hop = n + 1700; heartsAt(a, 4); },
    };
  }
  function endFeed() {
    if (!feeding || feeding.done) return;
    const a = feeding.a, now = performance.now();
    feeding = { ...feeding, done: true };
    zoom.from = zoomAt(now); zoom.to = 0; zoom.t0 = now; zoom.dur = 900;
    a.chew = 0;
    if (a.def.area) {                                                                     // a tópartra / tanyára: kisétál oldalt, és a kertrész széléről hazasétál
      const [hx, hz] = a.def.home;
      walk(a, 10.5, FEED_SPOT[1] + 0.6, 1600, b => { b.x = hx + (hx < 0 ? -8 : 8); b.z = hz + 0.8; walk(b, hx, hz, 2600, 'idle', true); }, true);
    } else {
      const via = a.z > FEED_GATE[1] + 0.3 ? [FEED_GATE] : [];                           // hazafelé is a résen át megy
      walk(a, a.def.home[0], a.def.home[1], Math.max(600, pathLen(a, a.def.home[0], a.def.home[1], via) / 3.2 * 1000), 'idle', true, via);
    }
    setTimeout(() => { if (feeding?.done && feeding.a === a) feeding = null; }, 950);
    setTimeout(() => { a.belly = 0; }, 6000);
  }

  // Hol vannak az állomások jelei a képernyőn (az alaphelyzetű kamerából nézve)? { állomás: {x, y} }, vagy null, ha nincs térkép
  const homeCam = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  function places() {
    if (!placesMesh) return null;
    homeCam.aspect = W / H; homeCam.updateProjectionMatrix();
    homeCam.position.copy(home.pos); homeCam.quaternion.copy(home.quat); homeCam.updateMatrixWorld();
    const r = canvas.getBoundingClientRect(), out = {};
    for (const p of PLACES) { v3.set(p.x, p.sign[0], p.z + p.sign[1]).project(homeCam); out[p.id] = { x: r.left + (v3.x + 1) / 2 * r.width, y: r.top + (1 - v3.y) / 2 * r.height }; }
    return out;
  }

  // A kert szélső részei (a távoli földekkel együtt), ahol már lakik valaki: [{ id, x, friends: [azonosítók], decor, flora }] – ehhez jelennek meg az átsikló gombok
  function areas() {
    return AREAS.map(r => ({ id: r.id, x: r.x, friends: [...actors.values()].filter(a => a.def.area === r.id).map(a => a.id), decor: [...decor.keys()].filter(id => giftById(id).spot[0] === r.id),
      flora: [...flora.keys()].filter(id => floraById(id).area === r.id) }))
      .filter(r => r.friends.length || r.decor.length || r.flora.length);          // ahol már lakik valaki, vagy dísz, fa áll
  }

  return {
    setStars, setGifts, setAvatar, beginFeed, endFeed, places, setDay, goTo, areas, flowerAt,
    decorArea: id => giftById(id)?.spot?.[0] || null,
    area: () => pan.area,
    cheer() { const now = performance.now(); let k = 0; actors.forEach(a => { a.hop = now + 900 + (k++ % 3) * 70; }); },   // új csillag: mindenki ugrik egyet
    pause(p) { paused = !!p; if (!paused && !raf) raf = requestAnimationFrame(loop); },
    qualityTick: ms => { quality.tick(ms); return { ...quality.state(), buffer: [renderer.domElement.width, renderer.domElement.height] }; },   // teszthez: egy képkocka adott idővel    // tesztekhez és hibakereséshez: rajzolási hívások, lakók, virágok, a barátok helye a képernyőn
    debug() {
      draw(performance.now());
      return { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, shadows: crowd.shadows + [...lands.values()].reduce((s, L) => s + L.crowd.shadows, 0), quality: quality.state(),
        drawn: { main: mainGroup.visible, ...Object.fromEntries([...lands].map(([id, L]) => [id, L.group.visible || L.crowdGroup.visible])), ...Object.fromEntries([...lands].map(([id, L]) => [id + 'Friends', L.crowdGroup.visible])) }, flowers: stems.count, bloomed, decor: [...decor.keys()], flora: [...flora.keys()], treeHearts: tree.count(), treeScale: tree.group.scale.x, gold: goldPetals.count,
        decorScreen: Object.fromEntries([...decor].map(([id, m]) => { v3.set(m.position.x, 0.8, m.position.z).project(camera); return [id, { x: (v3.x + 1) / 2 * W, y: (1 - v3.y) / 2 * H }]; })),
        floraScreen: Object.fromEntries([...flora].map(([id, m]) => { v3.set(m.position.x, 1.6 * m.userData.k, m.position.z).project(camera); return [id, { x: (v3.x + 1) / 2 * W, y: (1 - v3.y) / 2 * H, scale: m.scale.x / m.userData.k }]; })), friends: [...actors.keys()], zoom: zoomAt(performance.now()), pan: panAt(performance.now()), feeding: feeding && !feeding.done ? feeding.a.id : null,
        awake: Object.fromEntries([...actors.values()].filter(a => a.def.sleepy).map(a => [a.id, a.g.userData.eyes[0].scale.y > 0.5])),
        screen: Object.fromEntries([...actors.values()].map(a => [a.id, screenOf(a)])) };
    },
  };
}
