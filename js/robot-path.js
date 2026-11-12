// Robotpálya közös számításai (böngészőben és Node-ban is): irányok, futtatás, legrövidebb program.
// A feladat-modul (activities/algo.js), a feladat-generátor (content/algo.js) és a tesztek ugyanezt használják,
// így a segítség (2. és 3. tévedés) mindig ugyanazt a programot mutatja, amit a tesztek ellenőriztek.
// Pálya: { w, h, start: [x, y], goal: [x, y], walls: [[x, y], …], loops }. Program: irányok ('right') vagy lépések ({ dir, times }).

export const DIRS = { up: [0, -1, '⬆️', 'fel'], down: [0, 1, '⬇️', 'le'], left: [-1, 0, '⬅️', 'balra'], right: [1, 0, '➡️', 'jobbra'] };
export const ORDER = ['up', 'down', 'left', 'right'];
// rövid betűjel az azonosítókhoz: fel, le, balra, jobbra
export const LETTER = { up: 'f', down: 'l', left: 'b', right: 'j' };
const FROM = { f: 'up', l: 'down', b: 'left', j: 'right' };

const inside = (lv, x, y) => x >= 0 && y >= 0 && x < lv.w && y < lv.h;
const wallSet = lv => new Set((lv.walls || []).map(([x, y]) => x + ',' + y));
const toTokens = program => program.map(t => (typeof t === 'string' ? { dir: t, times: 1 } : t));
export const expand = program => toTokens(program).flatMap(t => Array(t.times || 1).fill(t.dir));

// betűjeles azonosító: kibontott út ('jjl') vagy ismétléses lépések ('j3l2')
export const keyOf = program => toTokens(program).map(t => LETTER[t.dir] + (t.times > 1 ? t.times : '')).join('');
export const parseKey = key => [...String(key).matchAll(/([flbj])([23]?)/g)].map(m => ({ dir: FROM[m[1]], times: m[2] ? +m[2] : 1 }));
export const turns = path => path.reduce((n, d, i) => n + (i && d !== path[i - 1] ? 1 : 0), 0);

// egymás utáni azonos lépések összevonása ×n lépéssé (ha az ismétlés engedélyezett; legfeljebb ×3)
export function compress(path, loops) {
  const out = [];
  for (const d of path) { const l = out[out.length - 1]; if (loops && l && l.dir === d && l.times < 3) l.times++; else out.push({ dir: d, times: 1 }); }
  return out;
}

// A program végrehajtása ugyanúgy, ahogy a robot csinálja: falnál vagy a pálya szélén megáll.
// Eredmény: { ok, step (a hibás lépés sorszáma), why: 'edge' | 'wall' | 'short', end, cells (a bejárt mezők) }
export function simulate(lv, program) {
  const walls = wallSet(lv), toks = toTokens(program);
  let [x, y] = lv.start; const cells = [[x, y]];
  for (let i = 0; i < toks.length; i++) for (let k = 0; k < (toks[i].times || 1); k++) {
    const [dx, dy] = DIRS[toks[i].dir], nx = x + dx, ny = y + dy;
    if (!inside(lv, nx, ny)) return { ok: false, step: i, why: 'edge', end: [x, y], cells };
    if (walls.has(nx + ',' + ny)) return { ok: false, step: i, why: 'wall', end: [x, y], cells };
    x = nx; y = ny; cells.push([x, y]);
  }
  const ok = !!lv.goal && x === lv.goal[0] && y === lv.goal[1];
  return { ok, step: ok ? -1 : toks.length - 1, why: ok ? null : 'short', end: [x, y], cells };
}

// A legrövidebb utak közül az, amelyik a legkevesebb gombnyomásból áll (ismétléssel összevonva), aztán a legkevesebb
// fordulóból; döntetlennél a betűjel szerinti első. Így a segítség mindig a legegyszerűbb programot mutatja.
export function solve(lv) {
  const walls = wallSet(lv), dist = new Map([[lv.goal.join(','), 0]]), q = [lv.goal];
  while (q.length) {
    const [x, y] = q.shift(), d = dist.get(x + ',' + y);
    for (const k of ORDER) {
      const nx = x + DIRS[k][0], ny = y + DIRS[k][1], key = nx + ',' + ny;
      if (!inside(lv, nx, ny) || walls.has(key) || dist.has(key)) continue;
      dist.set(key, d + 1); q.push([nx, ny]);
    }
  }
  if (!dist.has(lv.start.join(','))) return null;
  const score = p => [compress(p, !!lv.loops).length, turns(p), keyOf(p)];
  const less = (a, b) => a[0] - b[0] || a[1] - b[1] || (a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : 0);
  let best = null, bestScore = null, count = 0;
  const walk = (x, y, path) => {
    if (count > 4000) return;
    const d = dist.get(x + ',' + y);
    if (d === 0) { count++; const s = score(path); if (!best || less(s, bestScore) < 0) { best = path.slice(); bestScore = s; } return; }
    for (const k of ORDER) {
      const nx = x + DIRS[k][0], ny = y + DIRS[k][1];
      if (dist.get(nx + ',' + ny) === d - 1) { path.push(k); walk(nx, ny, path); path.pop(); }
    }
  };
  walk(lv.start[0], lv.start[1], []);
  return best;
}

// a legkisebb pálya, amin egy út elfér: { w, h, start, goal }
export function fit(path) {
  let x = 0, y = 0, minX = 0, maxX = 0, minY = 0, maxY = 0;
  for (const d of path) { x += DIRS[d][0]; y += DIRS[d][1]; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  return { w: maxX - minX + 1, h: maxY - minY + 1, start: [-minX, -minY], goal: [x - minX, y - minY] };
}
