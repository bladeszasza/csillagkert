// Színezős képek a Rajzasztalhoz (saját rajz, egyszerű formákból, 200×200-as mezőben).
// Minden kép részekből áll; egy rész egy vagy több forma (pl. a virág összes szirma). A később felsorolt rész takarja a
// korábbit (a kémény a tető mögött van). A díszítés (vonal, pupilla) nem színezhető és nem fogja meg a koppintást.
// Forma: ['rect', x, y, w, h, rx?] | ['circle', cx, cy, r] | ['ellipse', cx, cy, rx, ry] | ['poly', x1, y1, x2, y2, …]
// Rész: [azonosító, szint, "a tető", "a tetőt", jutalomszín (a kész képen), illő színek (Rozi ezek közül kér), formák, többes szám?]
// Szint: 1 = nagy, feltűnő rész; 2 = közepes; 3 = kicsi rész; 4 = két hasonló közül az egyik (bal / jobb, felső / alsó).
export const KEPEK = {
  haz: { pic: '🏠', name: 'ház', parts: [
    ['kemeny', 3, 'a kémény', 'a kéményt', '#c0504d', null, [['rect', 122, 42, 16, 40]]],
    ['teto', 1, 'a tető', 'a tetőt', '#e53935', null, [['poly', 32, 98, 100, 38, 168, 98]]],
    ['fal', 1, 'a fal', 'a falat', '#ffd36b', null, [['rect', 45, 95, 110, 85, 3]]],
    ['ajto', 2, 'az ajtó', 'az ajtót', '#8a5a3c', null, [['rect', 87, 128, 26, 52, 3]]],
    ['ablak-bal', 4, 'a bal oldali ablak', 'a bal oldali ablakot', '#7cc7ff', ['kék', 'sárga'], [['rect', 54, 110, 26, 26, 2]]],
    ['ablak-jobb', 4, 'a jobb oldali ablak', 'a jobb oldali ablakot', '#7cc7ff', ['kék', 'sárga'], [['rect', 120, 110, 26, 26, 2]]],
  ], deco: [['line', 67, 110, 67, 136], ['line', 54, 123, 80, 123], ['line', 133, 110, 133, 136], ['line', 120, 123, 146, 123], ['dot', 106, 156, 2.5], ['line', 20, 180, 180, 180]] },
  hal: { pic: '🐟', name: 'hal', parts: [
    ['farok', 2, 'a hal farka', 'a hal farkát', '#ff8a1f', null, [['poly', 52, 100, 12, 62, 22, 100, 12, 138]]],
    ['uszony-fent', 4, 'a felső uszony', 'a felső uszonyt', '#ffb020', null, [['poly', 72, 72, 100, 34, 128, 72]]],
    ['uszony-lent', 4, 'az alsó uszony', 'az alsó uszonyt', '#ffb020', null, [['poly', 86, 130, 102, 160, 120, 130]]],
    ['test', 1, 'a hal teste', 'a hal testét', '#2f8cff', null, [['ellipse', 100, 100, 62, 38]]],
    ['szem', 3, 'a hal szeme', 'a hal szemét', '#ffffff', null, [['circle', 136, 92, 11]]],
  ], deco: [['dot', 139, 92, 4], ['ring', 176, 60, 6], ['ring', 186, 38, 4], ['line', 150, 110, 160, 105]] },
  virag: { pic: '🌸', name: 'virág', parts: [
    ['szar', 2, 'a virág szára', 'a virág szárát', '#3fb950', ['zöld', 'barna'], [['rect', 95, 92, 10, 66]]],
    ['level', 3, 'a levél', 'a levelet', '#3fb950', ['zöld', 'sárga', 'narancssárga'], [['poly', 104, 134, 116, 116, 144, 112, 130, 132]]],
    ['szirmok', 1, 'a szirmok', 'a szirmokat', '#ff6fae', ['piros', 'kék', 'sárga', 'lila', 'rózsaszín', 'narancssárga'], [['circle', 126, 70, 17], ['circle', 113, 92, 17], ['circle', 87, 92, 17], ['circle', 74, 70, 17], ['circle', 87, 48, 17], ['circle', 113, 48, 17]], true],
    ['kozep', 2, 'a virág közepe', 'a virág közepét', '#ffd400', ['sárga', 'narancssárga', 'barna', 'piros'], [['circle', 100, 70, 15]]],
    ['cserep', 1, 'a cserép', 'a cserepet', '#c0704d', ['barna', 'narancssárga', 'piros', 'kék'], [['poly', 64, 150, 136, 150, 124, 190, 76, 190]]],
  ], deco: [['line', 66, 162, 134, 162]] },
  fa: { pic: '🌳', name: 'fa', parts: [
    ['nap', 2, 'a nap', 'a napot', '#ffd400', ['sárga', 'narancssárga'], [['circle', 170, 30, 16]]],
    ['fu', 2, 'a fű', 'a füvet', '#7fcf6c', ['zöld'], [['rect', 14, 170, 172, 20, 8]]],
    ['torzs', 1, 'a fa törzse', 'a fa törzsét', '#8a5a3c', ['barna'], [['rect', 88, 110, 24, 70, 3]]],
    ['lomb', 1, 'a lomb', 'a lombot', '#3fb950', ['zöld', 'sárga', 'narancssárga', 'piros'], [['circle', 100, 78, 46], ['circle', 60, 96, 28], ['circle', 140, 96, 28]]],
    ['almak', 3, 'az almák', 'az almákat', '#e53935', ['piros', 'sárga', 'zöld'], [['circle', 80, 70, 8], ['circle', 118, 58, 8], ['circle', 128, 100, 8], ['circle', 74, 108, 8]], true],
  ], deco: [['line', 100, 140, 108, 132]] },
  auto: { pic: '🚗', name: 'autó', parts: [
    ['auto', 1, 'az autó', 'az autót', '#e53935', null, [['poly', 20, 146, 20, 118, 52, 112, 72, 82, 132, 82, 154, 112, 182, 120, 182, 146]]],
    ['ablak', 2, 'az ablak', 'az ablakot', '#7cc7ff', ['kék', 'sárga'], [['poly', 80, 90, 126, 90, 142, 110, 66, 110]]],
    ['ajto', 3, 'az ajtó', 'az ajtót', '#ffb020', null, [['rect', 92, 114, 34, 26, 4]]],
    ['kerek-bal', 4, 'a bal oldali kerék', 'a bal oldali kereket', '#444444', null, [['circle', 60, 148, 19]]],
    ['kerek-jobb', 4, 'a jobb oldali kerék', 'a jobb oldali kereket', '#444444', null, [['circle', 144, 148, 19]]],
  ], deco: [['dot', 60, 148, 5], ['dot', 144, 148, 5], ['line', 116, 122, 122, 122], ['line', 10, 168, 190, 168]] },
  hajo: { pic: '⛵', name: 'hajó', parts: [
    ['viz', 1, 'a víz', 'a vizet', '#4aa8ff', ['kék', 'zöld'], [['rect', 8, 150, 184, 42, 10]]],
    ['alja', 1, 'a hajó alja', 'a hajó alját', '#8a5a3c', null, [['poly', 36, 138, 170, 138, 150, 168, 56, 168]]],
    ['vitorla-nagy', 4, 'a nagy vitorla', 'a nagy vitorlát', '#ffffff', null, [['poly', 104, 40, 104, 132, 160, 132]]],
    ['vitorla-kis', 4, 'a kis vitorla', 'a kis vitorlát', '#ffffff', null, [['poly', 96, 64, 96, 132, 58, 132]]],
    ['zaszlo', 3, 'a zászló', 'a zászlót', '#e53935', null, [['poly', 101, 12, 132, 24, 101, 36]]],
  ], deco: [['line', 100, 12, 100, 138], ['line', 30, 178, 52, 178], ['line', 140, 182, 166, 182]] },
  robot: { pic: '🤖', name: 'robot', parts: [
    ['antenna', 3, 'az antenna', 'az antennát', '#ff5d8f', null, [['circle', 100, 24, 10]]],
    ['fej', 1, 'a robot feje', 'a robot fejét', '#b9a7f5', null, [['rect', 62, 46, 76, 54, 12]]],
    ['kar-bal', 4, 'a bal oldali kar', 'a bal oldali kart', '#8e5be8', null, [['rect', 34, 108, 20, 52, 9]]],
    ['kar-jobb', 4, 'a jobb oldali kar', 'a jobb oldali kart', '#8e5be8', null, [['rect', 146, 108, 20, 52, 9]]],
    ['test', 1, 'a robot teste', 'a robot testét', '#b9a7f5', null, [['rect', 58, 104, 84, 64, 10]]],
    ['labak', 2, 'a robot lábai', 'a robot lábait', '#8e5be8', null, [['rect', 70, 168, 22, 24, 5], ['rect', 108, 168, 22, 24, 5]], true],
  ], deco: [['line', 100, 34, 100, 46], ['dot', 84, 70, 5], ['dot', 116, 70, 5], ['line', 86, 86, 114, 86], ['ring', 100, 134, 10]] },
  raketa: { pic: '🚀', name: 'rakéta', parts: [
    ['lang', 2, 'a láng', 'a lángot', '#ff8a1f', ['narancssárga', 'piros', 'sárga'], [['poly', 84, 158, 116, 158, 100, 198]]],
    ['szarny-bal', 4, 'a bal oldali szárny', 'a bal oldali szárnyat', '#e53935', null, [['poly', 74, 116, 42, 160, 74, 160]]],
    ['szarny-jobb', 4, 'a jobb oldali szárny', 'a jobb oldali szárnyat', '#e53935', null, [['poly', 126, 116, 158, 160, 126, 160]]],
    ['raketa', 1, 'a rakéta', 'a rakétát', '#eef2ff', null, [['rect', 72, 58, 56, 106, 14]]],
    ['orra', 2, 'a rakéta orra', 'a rakéta orrát', '#e53935', null, [['poly', 72, 66, 100, 16, 128, 66]]],
    ['ablak', 2, 'az ablak', 'az ablakot', '#7cc7ff', ['kék', 'sárga'], [['circle', 100, 98, 15]]],
  ], deco: [['line', 80, 140, 120, 140]] },
};

// --- geometria: koppintási pont és látható terület (a teszt és a füstteszt is ezt használja) ---
function inPoly(px, py, p) {
  let ins = false;
  for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
    const xi = p[i], yi = p[i + 1], xj = p[j], yj = p[j + 1];
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
export function inShape(px, py, [k, ...a]) {
  if (k === 'rect') return px >= a[0] && px <= a[0] + a[2] && py >= a[1] && py <= a[1] + a[3];
  if (k === 'circle') return (px - a[0]) ** 2 + (py - a[1]) ** 2 <= a[2] ** 2;
  if (k === 'ellipse') return ((px - a[0]) / a[2]) ** 2 + ((py - a[1]) / a[3]) ** 2 <= 1;
  if (k === 'poly') return inPoly(px, py, a);
  return false;
}
// A rész látható pontjai (2 egységes rácson): benne van a saját formáiban, és egyik később rajzolt rész sem takarja.
export function visible(pic, partId) {
  const parts = KEPEK[pic].parts, i = parts.findIndex(p => p[0] === partId), mine = parts[i][6], later = parts.slice(i + 1).flatMap(p => p[6]);
  const pts = [];
  for (let y = 1; y < 200; y += 2) for (let x = 1; x < 200; x += 2)
    if (mine.some(s => inShape(x, y, s)) && !later.some(s => inShape(x, y, s))) pts.push([x, y]);
  return pts;
}
// A koppintási pont: a látható pontok közül az, amelyik a legtávolabb esik a rész szélétől (nem a határon koppint)
export function tapPoint(pic, partId) {
  const pts = visible(pic, partId); if (!pts.length) return null;
  const set = new Set(pts.map(([x, y]) => `${x},${y}`));
  let best = pts[0], bd = -1;
  for (const [x, y] of pts) {
    let d = 0; while (d < 40 && set.has(`${x + 2 * (d + 1)},${y}`) && set.has(`${x - 2 * (d + 1)},${y}`) && set.has(`${x},${y + 2 * (d + 1)}`) && set.has(`${x},${y - 2 * (d + 1)}`)) d++;
    if (d > bd) { bd = d; best = [x, y]; }
  }
  return best;
}
// SVG-elem egy formához
export function shapeSvg([k, ...a], attrs = '') {
  if (k === 'rect') return `<rect x="${a[0]}" y="${a[1]}" width="${a[2]}" height="${a[3]}" rx="${a[4] || 0}" ${attrs}/>`;
  if (k === 'circle') return `<circle cx="${a[0]}" cy="${a[1]}" r="${a[2]}" ${attrs}/>`;
  if (k === 'ellipse') return `<ellipse cx="${a[0]}" cy="${a[1]}" rx="${a[2]}" ry="${a[3]}" ${attrs}/>`;
  if (k === 'poly') return `<polygon points="${a.join(' ')}" ${attrs}/>`;
  return '';
}
export function decoSvg([k, ...a]) {
  if (k === 'line') return `<line x1="${a[0]}" y1="${a[1]}" x2="${a[2]}" y2="${a[3]}" stroke="#3b2a63" stroke-width="3" stroke-linecap="round"/>`;
  if (k === 'dot') return `<circle cx="${a[0]}" cy="${a[1]}" r="${a[2]}" fill="#3b2a63"/>`;
  if (k === 'ring') return `<circle cx="${a[0]}" cy="${a[1]}" r="${a[2]}" fill="none" stroke="#3b2a63" stroke-width="2.5"/>`;
  return '';
}
