// Útvesztő (Ceruzavár): tökéletes labirintus (minden mezőhöz pontosan egy út vezet) rögzített magból, és a megoldása.
// A mező nyílásai bitekben: 1 fel, 2 jobbra, 4 le, 8 balra. Tiszta függvények: a tartalom, a teszt és a feladat-modul is ezt használja.
export const DIRS = [[1, 0, -1, 'f'], [2, 1, 0, 'j'], [4, 0, 1, 'l'], [8, -1, 0, 'b']];
const OPP = { 1: 4, 2: 8, 4: 1, 8: 2 };

export function carve(w, h, r) {
  const cells = Array.from({ length: h }, () => Array(w).fill(0)), seen = new Set(['0,0']), stack = [[0, 0]];
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const next = r.shuffle(DIRS).filter(([, dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < w && ny < h && !seen.has(nx + ',' + ny); });
    if (!next.length) { stack.pop(); continue; }
    const [bit, dx, dy] = next[0], nx = x + dx, ny = y + dy;
    cells[y][x] |= bit; cells[ny][nx] |= OPP[bit]; seen.add(nx + ',' + ny); stack.push([nx, ny]);
  }
  return cells;
}
// a falak szövegként (mezőnként egy hexa jegy, soronként): ez kerül a feladatba
export const encode = cells => cells.map(row => row.map(v => v.toString(16)).join(''));
export const decode = rows => rows.map(s => [...s].map(c => parseInt(c, 16)));

// legrövidebb (tökéletes labirintusban az egyetlen) út a kezdőmezőtől a célig: mezők sorban, és betűjellel (f, l, b, j)
export function solveMaze(rows, start, goal) {
  const cells = decode(rows), h = cells.length, w = cells[0].length, key = (x, y) => x + ',' + y;
  const prev = new Map([[key(...start), null]]), q = [start];
  while (q.length) {
    const [x, y] = q.shift();
    if (x === goal[0] && y === goal[1]) break;
    for (const [bit, dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if ((cells[y][x] & bit) && nx >= 0 && ny >= 0 && nx < w && ny < h && !prev.has(key(nx, ny))) { prev.set(key(nx, ny), [x, y]); q.push([nx, ny]); }
    }
  }
  if (!prev.has(key(...goal))) return null;
  const path = []; for (let c = goal; c; c = prev.get(key(...c))) path.unshift(c);
  const letters = path.slice(1).map((c, i) => DIRS.find(([, dx, dy]) => dx === c[0] - path[i][0] && dy === c[1] - path[i][1])[3]).join('');
  return { path, letters };
}
// átléphet-e a gyerek az egyik mezőből a szomszédosba (nincs köztük fal)
export function canStep(cells, [x, y], [nx, ny]) {
  const d = DIRS.find(([, dx, dy]) => dx === nx - x && dy === ny - y);
  return !!d && ny >= 0 && ny < cells.length && nx >= 0 && nx < cells[0].length && !!(cells[y][x] & d[0]);
}
