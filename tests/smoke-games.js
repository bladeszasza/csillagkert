// Füstteszt a jutalomjátékokhoz (M3): szabad futás futó-bottal, és a minijátékok indítása / kilépése.
// A szabad futás "kézi" módban fut: nincs saját képkocka-ciklusa, a teszt lépteti fix időlépéssel, rögzített világmaggal.
import { run as runWorld, separation, angDiff, MAX_FOLLOWERS } from '../js/rewards/openworld.js';
import { soundLog, soundMark } from '../js/sounds.js';
import { audio } from '../js/audio.js';
import { makeCharacter } from '../js/three/characters.js';
import { SPARK_KEY, sparkPalette } from '../js/avatar.js';

// „az én unikornisom" a játékokban: egy feltűnő öltözet (varázssüveg, tündérszárny, köpeny, csillagok, kék test)
const LOOK = { body: 'c2', pattern: 'stars', head: 'wizard', wing: 'fairy', neck: 'cape', horn: 'rainbow' };
const nParts = cfg => makeCharacter('unicorn', cfg).userData.parts.length;
const wears = (g, cfg) => !!g?.userData.avatar && g.userData.parts.length === nParts(cfg) && nParts(cfg) !== nParts({});

const wait = ms => new Promise(r => setTimeout(r, ms));
const box = (w = 1024, h = 768) => { const d = document.createElement('div'); d.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;opacity:0;pointer-events:none`; document.body.appendChild(d); return d; };
const pe = (el, type, x, y, id = 1, pointerType = 'touch') => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: id, clientX: x, clientY: y, pointerType }));
const DT = 1 / 30;
const steps = (ow, secs) => { for (let i = 0, n = Math.round(secs / DT); i < n; i++) ow.update(DT); };
const r1 = v => Math.round(v * 10) / 10;

// Képernyőpont a közép körül, adott irányban (0 = fel / észak, 90° = jobbra / kelet)
function aimPoint(canvas, deg, k = 0.38) {
  const r = canvas.getBoundingClientRect(), a = deg * Math.PI / 180, R = k * Math.min(r.width, r.height);
  return [r.left + r.width / 2 + Math.sin(a) * R, r.top + r.height / 2 - Math.cos(a) * R];
}
function reset(ow, x = 0, z = 0) { Object.assign(ow.P, { x, z, y: 0, vy: 0, grounded: true, speed: 0, target: null, tap: false }); steps(ow, 0.5); }

// --- futó-bot: egy irányban tartott ujjal fut (útvonal-javítás nélkül!), 250 egységenként új irányba fordul ---
async function runBot(seed, goal, { setup, stopOnStuck = false } = {}) {
  const h = box(), dispose = runWorld(h, { seed, manual: true }), ow = h.__ow, cv = ow.canvas;
  setup?.(ow);
  let leg = 0, legStart = 0, frames = 0, stuck = null, edgeHoles = 0, inside = 0, mismatch = 0, jumps = 0, wasGround = true;
  let maxChunks = 0, maxPals = 0, maxInst = 0, maxInstFirst = 0;
  const hist = [], joined = new Set(), lost = new Set();
  let [px, py] = aimPoint(cv, 0); pe(cv, 'pointerdown', px, py, 1);
  while (ow.P.moved < goal && frames < 14000) {
    ow.update(DT); frames++;
    const P = ow.P;
    if (P.grounded !== wasGround) { if (!P.grounded) jumps++; wasGround = P.grounded; }
    if (P.moved - legStart > 250) { leg++; legStart = P.moved; [px, py] = aimPoint(cv, leg * 135); pe(cv, 'pointermove', px, py, 1); }
    if (frames % 15 === 0) {                       // beragadás: 3 mp alatt kevesebb, mint 1,5 egységnyi elmozdulás
      hist.push([P.x, P.z]); if (hist.length > 7) hist.shift();
      if (!stuck && hist.length === 7 && Math.hypot(hist[6][0] - hist[0][0], hist[6][1] - hist[0][1]) < 1.5) stuck = `${frames}. kocka (${r1(P.x)}, ${r1(P.z)})`;
      if (stuck && stopOnStuck) break;
    }
    if (frames % 10 === 0) {
      const s = ow.stats();
      maxChunks = Math.max(maxChunks, s.chunks); maxPals = Math.max(maxPals, s.pals); maxInst = Math.max(maxInst, s.instances);
      if (P.moved < goal / 2) maxInstFirst = maxInst;
      if (s.batch !== s.pals) mismatch++;
      for (const f of ow.followers()) joined.add(f);
      for (const f of joined) if (!ow.pals().includes(f)) lost.add(f);
      for (const o of ow.colliders()) if (o.solid && Math.abs(o.x - P.x) < 3 && Math.abs(o.z - P.z) < 3 && separation(o, P.x, P.z).d < o.r + 0.45 - 0.08) inside++;
      // a köd vége előtt (42 egységen belül) minden irányban kész a világ
      for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4, x = P.x + Math.sin(a) * 42, z = P.z + Math.cos(a) * 42;
        if (!ow.chunks.has(Math.floor((x + 15) / 30) + ',' + Math.floor((z + 15) / 30))) edgeHoles++;
      }
    }
    if (frames % 400 === 0) { ow.render(); await wait(0); }
  }
  pe(cv, 'pointerup', px, py, 1);
  const P = ow.P, far = ow.followers().filter(f => Math.hypot(f.x - P.x, f.z - P.z) > 10).length;
  const res = { seed, moved: Math.round(P.moved), frames, stuck, edgeHoles, inside, mismatch, jumps, maxChunks, maxPals, maxInst, maxInstFirst, joined: joined.size, lost: lost.size, far, followers: ow.followers().length };
  dispose(); h.remove();
  return res;
}

export async function testOpenWorld(ok) {
  // 1) futó-bot három világban, összesen jóval több mint 2000 egység
  const runs = [];
  for (const seed of [101, 202, 303]) runs.push(await runBot(seed, 2000));
  for (const b of runs) {
    ok(`szabad futás bot (mag ${b.seed}): 2000 egység beragadás nélkül`, b.moved >= 2000 && !b.stuck && b.inside === 0, `megtett ${b.moved}, ${b.frames} kocka, ${b.jumps} ugrás${b.stuck ? ', BERAGADT: ' + b.stuck : ''}${b.inside ? ', fába lógott ' + b.inside + '×' : ''}`);
    ok(`szabad futás bot (mag ${b.seed}): a világ és a barátok száma nem nő a végtelenségig`, b.maxChunks <= 49 && b.maxPals <= 60 && b.mismatch === 0 && b.maxInst <= Math.max(400, b.maxInstFirst * 1.6), `chunk ≤ ${b.maxChunks}, barát ≤ ${b.maxPals}, példány ≤ ${b.maxInst} (első fél ${b.maxInstFirst}), eltérés ${b.mismatch}`);
    ok(`szabad futás bot (mag ${b.seed}): a csatlakozott barát nem tűnik el`, b.joined >= 1 && b.joined <= MAX_FOLLOWERS && b.lost === 0 && b.far === 0, `csatlakozott ${b.joined}, elveszett ${b.lost}, lemaradt ${b.far}, most ${b.followers}`);
    ok(`szabad futás bot (mag ${b.seed}): nem látszik a világ széle`, b.edgeHoles === 0, `hiányzó darab a köd előtt: ${b.edgeHoles}`);
  }
  ok('szabad futás bot: ugrás-segítő működik (kő / rönk)', runs.every(b => b.jumps > 0), runs.map(b => b.jumps).join(', '));
  // a mérőeszköz ellenőrzése: fákból rakott zárt körben a botnak beragadást KELL jeleznie
  const ring = await runBot(101, 300, { stopOnStuck: true, setup: ow => { const c = ow.chunks.get('0,0'); for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; c.colliders.push({ x: Math.sin(a) * 4, z: Math.cos(a) * 4, r: 0.8, h: 99, solid: true }); } } });
  ok('futó-bot: a beragadás-figyelő tényleg jelez (zárt fakör)', !!ring.stuck && ring.moved < 300, `megtett ${ring.moved}, jelzés: ${ring.stuck || 'nincs'}`);

  // 2) irányítás, ugrás, ütközők – egy világban
  const h = box(), dispose = runWorld(h, { seed: 7, manual: true }), ow = h.__ow, cv = ow.canvas, P = ow.P;
  try {
    // koppintás: oda fut, és ott megáll
    reset(ow);
    let [x, y] = aimPoint(cv, 90, 0.3); pe(cv, 'pointerdown', x, y, 1); pe(cv, 'pointerup', x, y, 1);
    const goal = P.target && { ...P.target };
    steps(ow, 0.6); const midX = P.x, kept = !!P.target;
    steps(ow, 5); const arrived = goal && Math.hypot(P.x - goal.x, P.z - goal.z) < 1.2;
    ok('koppintás: a cél megmarad, oda fut és megáll', goal && kept && midX > 2 && arrived && !P.target && P.speed < 0.5, `cél ${goal ? r1(goal.x) + ',' + r1(goal.z) : '–'}, 0,6 mp után x=${r1(midX)}, végül (${r1(P.x)}, ${r1(P.z)}), sebesség ${r1(P.speed)}`);
    // tartott ujj mozdulatlanul: végig fut, felengedésre megáll
    reset(ow);
    [x, y] = aimPoint(cv, 0); pe(cv, 'pointerdown', x, y, 1);
    const z0 = P.z; steps(ow, 3); const ran = z0 - P.z, still = !!P.target;
    pe(cv, 'pointerup', x, y, 1); steps(ow, 1);
    ok('tartott ujj: amíg lent van, fut (nem áll meg a célpontnál)', ran > 15 && still && !P.target && P.speed < 0.5, `3 mp alatt ${r1(ran)} egység, felengedés után sebesség ${r1(P.speed)}`);
    // két ujj: a második felemelése nem állítja meg, az első ujj veszi vissza az irányítást
    reset(ow);
    const [ax, ay] = aimPoint(cv, 0), [bx, by] = aimPoint(cv, 90);
    pe(cv, 'pointerdown', ax, ay, 1); steps(ow, 0.5);
    pe(cv, 'pointerdown', bx, by, 2); let x1 = P.x; steps(ow, 0.6); const east = P.x - x1;
    pe(cv, 'pointerup', bx, by, 2); let zz = P.z; steps(ow, 0.6); const north = zz - P.z, still2 = !!P.target;
    pe(cv, 'pointerup', ax, ay, 1); steps(ow, 1);
    ok('két ujj: az egyik felemelése nem állítja meg a futást', east > 2 && north > 2 && still2 && P.speed < 0.5, `keletre ${r1(east)}, utána északra ${r1(north)}`);
    // Pencil + tenyér: a Pencil irányít, a lent maradt tenyér nem
    reset(ow);
    const [wx, wy] = aimPoint(cv, 270), [nx, ny] = aimPoint(cv, 0);
    pe(cv, 'pointerdown', wx, wy, 3, 'touch'); pe(cv, 'pointerdown', nx, ny, 4, 'pen');
    zz = P.z; x1 = P.x; steps(ow, 0.7); const penNorth = zz - P.z, drift = Math.abs(P.x - x1);
    pe(cv, 'pointerup', nx, ny, 4, 'pen'); steps(ow, 1); const palmStops = !P.target && P.speed < 0.5;
    pe(cv, 'pointerup', wx, wy, 3, 'touch');
    ok('Pencil elsőbbség: a tenyér nem irányít', penNorth > 2 && drift < 1 && palmStops, `Pencil északra ${r1(penNorth)}, oldalra ${r1(drift)}, tollfelemelés után megáll: ${palmStops}`);

    // ugrás-segítő: a kő előtt magától ugrik, és átjut rajta
    const solids = ow.colliders().filter(o => o.solid);
    const clear = o => !solids.some(s => Math.abs(s.x - o.x) < s.r + 1.8 && s.z > o.z - 6 && s.z < o.z + 6);
    const rock = ow.colliders().find(o => o.rock && clear(o));
    if (rock) {
      reset(ow, rock.x, rock.z + 5); let maxY = 0, n0 = 0;
      ow.setTarget(rock.x, rock.z - 5);
      for (let i = 0; i < 90; i++) { ow.update(DT); maxY = Math.max(maxY, P.y); if (!P.grounded) n0++; }
      ok('ugrás: a követ magától átugorja', P.z < rock.z - 3 && maxY > rock.h, `kő magassága ${r1(rock.h)}, legmagasabb ugrás ${r1(maxY)}, végül z−kő = ${r1(P.z - rock.z)}`);
    } else ok('ugrás: a követ magától átugorja', false, 'nincs szabad kő a tesztvilágban');
    // rönk: kapszula alakú ütköző (oldalt nincs láthatatlan fal, a végén nem lóg ki)
    const log = ow.colliders().find(o => o.log);
    if (log) {
      reset(ow, log.x - log.az * 0.95, log.z + log.ax * 0.95); const sx = P.x, sz = P.z; ow.update(1 / 60);
      const side = Math.hypot(P.x - sx, P.z - sz);
      Object.assign(P, { x: log.x + log.ax * 1.15 - log.az * 0.2, z: log.z + log.az * 1.15 + log.ax * 0.2 }); const ex = P.x, ez = P.z; ow.update(1 / 60);
      const end = Math.hypot(P.x - ex, P.z - ez);
      ok('rönk: kapszula ütköző a rönk mentén', side < 0.01 && end > 0.05, `oldalt 0,95-re elmozdítás ${r1(side * 100) / 100}, a rönk végénél ${r1(end * 100) / 100}`);
    } else ok('rönk: kapszula ütköző a rönk mentén', false, 'nincs rönk a tesztvilágban');
    // fára koppintás: nem fut körbe a végtelenségig, szépen megáll
    const tree = ow.trees().find(t => Math.hypot(t.x, t.z) > 8);
    reset(ow, tree.x, tree.z + 6); ow.setTarget(tree.x, tree.z); steps(ow, 5);
    ok('fára koppintás: odamegy, majd megáll (nem ragad be)', !P.target && Math.hypot(P.x - tree.x, P.z - tree.z) < tree.r + 2.5 && P.speed < 0.5, `távolság a fától ${r1(Math.hypot(P.x - tree.x, P.z - tree.z))}, cél ${P.target ? 'még megvan' : 'törölve'}`);
    // a kamera és az unikornis közé kerülő lomb összemegy, utána visszanő
    const big = ow.trees().filter(t => t.s > 1.3 && Math.hypot(t.x, t.z) > 8).sort((a, b) => b.s - a.s)[0];
    if (big) {
      reset(ow, big.x, big.z - 2.2); steps(ow, 1.2); const k1 = big.k;
      reset(ow, big.x, big.z - 18); steps(ow, 1.5); const k2 = big.k;
      ok('a takaró lomb összemegy, majd visszanő', k1 < 0.5 && k2 > 0.99, `takarásban ${r1(k1 * 100) / 100}, utána ${r1(k2 * 100) / 100}`);
    }
    // barátok fordulása: mindig a rövidebb irányba
    ok('fordulás a rövidebb irányba', Math.abs(angDiff(3.0, -3.0) - (2 * Math.PI - 6)) < 1e-9 && Math.abs(angDiff(-3.1, 3.1) + (2 * Math.PI - 6.2)) < 1e-9, `${angDiff(3.0, -3.0).toFixed(3)}, ${angDiff(-3.1, 3.1).toFixed(3)}`);
    // forgatás (álló képernyő): az állapot megmarad
    const keep = { x: P.x, z: P.z }; h.style.width = '768px'; h.style.height = '1024px'; window.dispatchEvent(new Event('resize')); await wait(50); ow.update(DT); ow.render();
    ok('forgatás után megmarad a hely', Math.hypot(P.x - keep.x, P.z - keep.z) < 0.5 && Math.abs(ow.camera.aspect - 0.75) < 0.01, `képarány ${ow.camera.aspect.toFixed(2)}`);
    // teljesítmény: kevés rajzolási hívás (a barátok egy közös rajzolásban)
    reset(ow); steps(ow, 0.5); ow.render(); const st = ow.stats();
    ok('szabad futás: rajzolási hívások és háromszögek a kereten belül', st.calls <= 150 && st.triangles <= 150000, `${st.calls} hívás, ${Math.round(st.triangles / 1000)}k háromszög, ${st.pals} barát`);
  } finally {
    const gl = cv.getContext('webgl2') || cv.getContext('webgl');
    dispose();
    ok('szabad futás: kilépés után nincs élő 3D-kontextus', !gl || gl.isContextLost(), gl ? 'kontextus elengedve' : 'nincs kontextus');
    h.remove();
  }
}

// --- minijátékok: a 6.2-es lista géppel ellenőrizhető része ---
// indul és kilép hiba nélkül; kilépés után nincs élő 3D-kontextus és nincs új hang-kontextus; forgatás után is fut;
// szabad játékban Rozi ritkán szól; plusz játékonként a javított hibák ellenőrzése.
const spoken = () => window.__spoken.length;
const kinds = n => soundLog.filter(x => x.n > n).map(x => x.kind);
async function lifecycle(ok, name, load, { opts = {}, during, settle = 700 } = {}) {
  const errs = [], onErr = e => errs.push(e.message || String(e.reason?.message || e.reason));
  window.addEventListener('error', onErr); window.addEventListener('unhandledrejection', onErr);
  const h = box(); let dispose = null, gls = [];
  try {
    const mod = await load();
    dispose = mod.run(h, opts);
    await wait(settle);
    if (during) await during(h);
    h.style.width = '768px'; h.style.height = '1024px'; window.dispatchEvent(new Event('resize')); await wait(250);   // forgatás (álló)
    gls = [...h.querySelectorAll('canvas')].map(c => c.getContext('webgl2') || c.getContext('webgl')).filter(Boolean);
  } catch (e) { errs.push(e.stack || e.message); }
  try { dispose?.(); } catch (e) { errs.push('kilépés: ' + e.message); }
  await wait(400);                                                // kilépés után se fusson semmi hibára
  window.removeEventListener('error', onErr); window.removeEventListener('unhandledrejection', onErr);
  ok(`${name}: indul, forgatható, kilép hiba nélkül; utána nincs élő 3D-kontextus`, errs.length === 0 && gls.every(gl => gl.isContextLost()), errs.join(' · ') || `${gls.length} 3D-vászon, mind elengedve`);
  h.remove();
}

export async function testAvatarWorld(ok) {
  const h = box(), dispose = runWorld(h, { seed: 3, manual: true, avatar: LOOK }), ow = h.__ow;
  try {
    steps(ow, 0.5); ow.render();
    const u = ow.player();
    ok('szabad futás: a játékos a saját, felöltöztetett unikornisa (a barátokkal közös rajzolásban)', wears(u, LOOK) && ow.stats().calls <= 150, `${u?.userData.parts.length} alkatrész (alap: ${nParts({})}), ${ow.stats().calls} hívás`);
  } finally { dispose(); h.remove(); }
  const h2 = box(), d2 = runWorld(h2, { seed: 3, manual: true }), u2 = h2.__ow.player();
  ok('szabad futás: öltözet nélkül az alap unikornis fut', !!u2?.userData.avatar && u2.userData.parts.length === nParts({}), `${u2?.userData.parts.length} alkatrész`);
  d2(); h2.remove();
}

export async function testMinigames(ok) {
  audio();                                                        // a közös hangmotor már él (ezt nem számoljuk)
  const Orig = window.AudioContext; let made = 0;
  window.AudioContext = class extends Orig { constructor(...a) { super(...a); made++; } };   // új hang-kontextus számlálása
  try {
    // Barátom: egy 3D-színpad a választó és a gondozás között; ünnepléskor az állat a helyén marad; kevés beszéd
    await lifecycle(ok, 'Barátom', () => import('../js/rewards/pet.js'), {
      opts: { avatar: LOOK },
      during: async h => {
        const P = h.__pet, s0 = spoken();
        P.choose(1); await wait(300);
        const cv1 = [...h.querySelectorAll('canvas.stage3d')];
        const before = P.animalRect(); P.celebrate(); await wait(350); const mid = P.animalRect();
        ok('Barátom: ünnepléskor az állat a helyén marad (nem ugrik a sarokba)', Math.abs(mid.left - before.left) < 3 && Math.abs(mid.top - before.top) < 3 && !h.querySelector('.joy'), `elmozdulás ${Math.round(mid.left - before.left)}, ${Math.round(mid.top - before.top)} px`);
        const s1 = spoken(); P.tool('pet'); await wait(80); P.tool('ball'); await wait(80); P.tool('brush'); await wait(80);
        const chatter = spoken() - s1;
        P.back(); await wait(200); P.choose(3); await wait(300);
        const cv2 = [...h.querySelectorAll('canvas.stage3d')];
        ok('Barátom: egy közös 3D-színpad (váltáskor nincs új WebGL-kontextus)', cv1.length === 1 && cv2.length === 1 && cv1[0] === cv2[0], `vásznak: ${cv1.length} → ${cv2.length}, ugyanaz: ${cv1[0] === cv2[0]}`);
        ok('Barátom: eszközváltáskor nem beszél folyton (15 mp-es korlát)', chatter === 0, `${chatter} mondat három gyors váltásra · ${window.__spoken.slice(s0).join(' | ')}`);
        P.back(); await wait(200);
        const nFriends = h.querySelectorAll('.pet-friend').length, uniBtn = [...h.querySelectorAll('.pet-friend')].findIndex(b => b.textContent.includes('🦄'));
        P.choose(uniBtn); await wait(400);
        const m = P.model(), cv3 = [...h.querySelectorAll('canvas.stage3d')], inCrowd = P.crowd()?.size === 1;
        const r6 = P.animalRect(); P.celebrate(); await wait(500);
        P.back(); await wait(200);
        ok('Barátom: a saját unikornis is választható, a mostani ruhájában (közös 3D-színpadon)', nFriends === 7 && uniBtn === 6 && wears(m, LOOK) && inCrowd && cv3.length === 1 && cv3[0] === cv1[0] && P.crowd()?.size === 0 && r6.width > 0,
          `barátok: ${nFriends}, unikornis helye: ${uniBtn}, alkatrész: ${m?.userData.parts.length}, rajzolóban: ${inCrowd} → ${P.crowd()?.size}, vásznak: ${cv3.length}`);
      },
    });
    // Hami-adagoló: szabad játékban legfeljebb 15 mp-enként egy mondat
    await lifecycle(ok, 'Hami-adagoló', () => import('../js/rewards/healthy.js'), {
      settle: 900,
      during: async h => {
        const H = h.__hd, s0 = spoken(); let feeds = 0;
        for (let k = 0; k < 5; k++) { if (!H.current()) H.dispense(); await wait(60); if (H.current()) { await H.feed(k % 4); feeds++; } await wait(80); }
        const extra = spoken() - s0;
        ok('Hami-adagoló: etetés közben Rozi nem beszél minden falatnál', feeds >= 4 && extra <= 1, `${feeds} adag, ${extra} új mondat · ${window.__spoken.slice(s0).join(' | ')}`);
      },
    });
    // Felhővár-verseny: kevés rajzolási hívás, visszaszámlálás hanggal (felirat csak váltáskor), ünneplés együtt
    await lifecycle(ok, 'Felhővár-verseny', () => import('../js/rewards/race.js'), {
      settle: 100, opts: { avatar: LOOK },
      during: async h => {
        const R = h.__race, l0 = soundMark(); let writes = 0;
        ok('verseny: a játékos a saját, felöltöztetett unikornisa', wears(R.me, LOOK), `${R.me?.userData.parts.length} alkatrész (alap: ${nParts({})})`);
        Object.assign(R.S, { phase: 'ready', countdown: 3.2, shown: null });   // a visszaszámlálás elölről (a saját ciklusa közben már elindult)
        const mo = new MutationObserver(m => { writes += m.length; }); mo.observe(h.querySelector('.race-center'), { childList: true, subtree: true, characterData: true });
        for (let i = 0; i < 70; i++) R.step(1 / 20);              // 3,5 mp visszaszámlálás
        await wait(0); mo.disconnect();
        const k = kinds(l0), beeps = k.filter(x => x === 'beep').length, gos = k.filter(x => x === 'go').length;
        ok('verseny: visszaszámlálás hanggal, a felirat csak váltáskor íródik', beeps === 3 && gos === 1 && writes <= 10, `csippanás ${beeps}, rajt ${gos}, DOM-írás ${writes}`);
        R.render(); const info = R.info();
        ok('verseny: kevés rajzolási hívás (példányosított díszlet)', info.calls <= 120, `${info.calls} hívás, ${Math.round(info.triangles / 1000)}k háromszög`);
        const l1 = soundMark(); R.jump(); for (let i = 0; i < 20; i++) R.step(1 / 20);
        R.S.me.z = R.LEN - 0.05; R.S.rv.z = R.LEN - 15; R.step(1 / 20);
        const busyAfter = h.__busy(), k1 = kinds(l1);
        for (let i = 0; i < 70; i++) R.step(1 / 20);              // a célban egymás felé fordulnak
        const a1 = R.S.me.ang, a2 = R.S.rv.ang;
        ok('verseny: ugrás, pata és ünneplés hangja; a célban együtt ünnepelnek', k1.includes('boing') && k1.includes('step') && k1.includes('cheer') && R.S.phase === 'done' && !busyAfter && Math.abs(a1 + Math.PI / 2) < 0.1 && Math.abs(a2 - Math.PI / 2) < 0.1, `hangok: ${[...new Set(k1)].join(',')}; fázis ${R.S.phase}; foglalt ${busyAfter}; szögek ${a1.toFixed(2)}, ${a2.toFixed(2)}`);
      },
    });
    await lifecycle(ok, 'Buborékpukkasztás', () => import('../js/rewards/bubbles.js'));
    await lifecycle(ok, 'Csillagfogó cica', () => import('../js/rewards/foodcatch.js'));
    await lifecycle(ok, 'Unikornis-öltöztető', () => import('../js/rewards/dressup.js'), {
      during: async h => {
        const D = h.__dress, view = h.querySelector('.du-view'), r = view.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
        const rot0 = D.rot();
        pe(view, 'pointerdown', x, y, 5); for (let k = 1; k <= 5; k++) pe(view, 'pointermove', x + k * 30, y, 5); pe(view, 'pointerup', x + 150, y, 5);
        const turned = D.rot() - rot0;
        h.querySelector('.du-zoom').click(); const z1 = D.zoom(); await wait(300); h.querySelector('.du-zoom').click(); const z2 = D.zoom();
        h.querySelector('.du-tab[data-t="test"]').click(); await wait(20);
        const was = D.sel().body, pick = [...h.querySelectorAll('.du-opt[data-k="body"]:not(.locked):not(.sel)')][2], m0 = D.model();
        pick.click(); await wait(50);
        const changed = D.sel().body === pick.dataset.i && D.model() !== m0 && h.querySelector('.du-opt[data-k="body"].sel')?.dataset.i === pick.dataset.i;   // a gombsor újrarajzolódik
        h.querySelector(`.du-opt[data-k="body"][data-i="${was}"]`).click(); await wait(50);
        D.render(); const calls = D.calls(), height = D.height();
        ok('öltöztető 3D: ujjal forgatható, nagyítható, választásra rögtön átöltözik; kevés rajzolási hívás', turned > 1.5 && z1 === 1 && z2 === 0 && changed && D.sel().body === was && calls <= 20 && height > 2 && height < 2.5,
          `fordulás ${turned.toFixed(2)} rad, nagyítás ${z1}→${z2}, átöltözött: ${changed}, hívások ${calls}, magasság ${height.toFixed(2)}`);
      },
    });
    // Sparkhorn-keret: betöltés után eltűnik a kártya; hálózat nélkül kedves hibaüzenet és Újra gomb
    await lifecycle(ok, 'Sparkhorn-keret', () => import('../js/rewards/sparkhorn.js'), {
      opts: { src: './blank.html', wait: 3000, avatar: LOOK }, settle: 800,
      during: async h => {
        const st = h.__spark.state();
        let saved = null; try { saved = JSON.parse(localStorage.getItem(SPARK_KEY)); } catch (e) {}
        ok('Sparkhorn-keret: a saját unikornis színei a közös kulcsba kerülnek (csak színek, név nélkül)', JSON.stringify(saved) === JSON.stringify(sparkPalette(LOOK)) && window.__memStorage === true, `${localStorage.getItem(SPARK_KEY)}`);
        // a jutalomidő vége kivárja a futó kört: a keretben futó játék busy() jelzését olvassuk
        const fw = h.querySelector('iframe').contentWindow, idle = h.__busy();
        fw.__sparkhorn = { busy: () => true }; const running = h.__busy();
        fw.__sparkhorn = { busy: () => { throw new Error('teszt'); } }; const broken = h.__busy();
        delete fw.__sparkhorn;
        ok('Sparkhorn-keret: a jutalomidő vége kivárja a futó kört', idle === false && running === true && broken === false, `nincs kör: ${idle}, fut: ${running}, hibás jelzés: ${broken}`);
        Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
        const s0 = spoken(); h.__spark.reload(); await wait(100);
        const st2 = h.__spark.state(), retry = !h.querySelector('.spark-retry').hidden;
        delete navigator.onLine;
        ok('Sparkhorn-keret: betöltéskor eltűnik a kártya; net nélkül szól és van Újra gomb', st === 'loaded' && st2 === 'error' && retry && spoken() - s0 === 1, `betöltve: ${st}; net nélkül: ${st2}, újra gomb: ${retry}`);
      },
    });
    ok('jutalomjátékok: egyik sem nyit saját hang-kontextust', made === 0, `${made} új AudioContext`);
  } finally { window.AudioContext = Orig; }
}
