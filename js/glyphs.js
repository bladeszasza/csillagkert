// Nyomtatott nagybetűk és számjegyek vonásai (Ceruzavár). Egy vonás = egy ceruzamozdulat, a sorrend a kezdőpontok száma.
// A betűformák és a vonássorrend SAJÁT DÖNTÉS (a szokásos nyomtatott-betű rend: előbb a függőleges, felülről lefelé, balról
// jobbra; a kör alakú betűk felülről, az óramutatóval ellentétesen). Forrást ehhez nem ellenőriztem; a szülő a
// tests/gallery.html?st=ceruza oldalon átnézheti. Az iskola az írott betűket a saját módszerével tanítja.
//
// Koordináták: a betű magassága 1 (y lefelé nő, 0 a teteje), a szélesség betűnként más. Az ékezet a betű fölé kerül (y < 0).
// Egy vonás parancsai: "M x,y" (oda ugrik), "L x,y" (egyenes), "A cx,cy,rx,ry,a0,a1" (ív a0-tól a1 fokig; 0° jobbra,
// 90° lefelé, a növekvő szög az óramutató járása), "D x,y" (pötty: koppintás).

const ACUTE = x => `M${x + 0.1},-0.32 L${x - 0.05},-0.1`;
const DOTS = (a, b) => [`D${a},-0.18`, `D${b},-0.18`];
const DOUBLE = (a, b) => [ACUTE(a), ACUTE(b)];
const O_ = 'A0.4,0.5,0.4,0.5,-90,-450';
const U_ = 'M0,0 L0,0.62 A0.32,0.62,0.32,0.38,180,0 L0.64,0';

export const GLYPHS = {
  A: { w: 0.8, s: ['M0.4,0 L0,1', 'M0.4,0 L0.8,1', 'M0.15,0.64 L0.65,0.64'] },
  B: { w: 0.62, s: ['M0,0 L0,1', 'M0,0 L0.32,0 A0.32,0.25,0.25,0.25,-90,90 L0,0.5', 'M0,0.5 L0.34,0.5 A0.34,0.75,0.26,0.25,-90,90 L0,1'] },
  C: { w: 0.78, s: ['A0.45,0.5,0.45,0.5,-40,-320'] },
  D: { w: 0.68, s: ['M0,0 L0,1', 'M0,0 L0.2,0 A0.2,0.5,0.48,0.5,-90,90 L0,1'] },
  E: { w: 0.58, s: ['M0,0 L0,1', 'M0,0 L0.58,0', 'M0,0.5 L0.48,0.5', 'M0,1 L0.58,1'] },
  F: { w: 0.58, s: ['M0,0 L0,1', 'M0,0 L0.58,0', 'M0,0.5 L0.48,0.5'] },
  G: { w: 0.82, s: ['A0.45,0.5,0.45,0.5,-40,-360 L0.48,0.5'] },
  H: { w: 0.64, s: ['M0,0 L0,1', 'M0.64,0 L0.64,1', 'M0,0.5 L0.64,0.5'] },
  I: { w: 0, s: ['M0,0 L0,1'] },
  J: { w: 0.5, s: ['M0.5,0 L0.5,0.72 A0.25,0.72,0.25,0.28,0,180'] },
  K: { w: 0.6, s: ['M0,0 L0,1', 'M0.6,0 L0.02,0.56', 'M0.2,0.4 L0.62,1'] },
  L: { w: 0.54, s: ['M0,0 L0,1 L0.54,1'] },
  M: { w: 0.82, s: ['M0,0 L0,1', 'M0,0 L0.41,0.72 L0.82,0', 'M0.82,0 L0.82,1'] },
  N: { w: 0.66, s: ['M0,0 L0,1', 'M0,0 L0.66,1', 'M0.66,0 L0.66,1'] },
  O: { w: 0.8, s: [O_] },
  P: { w: 0.6, s: ['M0,0 L0,1', 'M0,0 L0.32,0 A0.32,0.27,0.27,0.27,-90,90 L0,0.54'] },
  Q: { w: 0.84, s: [O_, 'M0.5,0.72 L0.84,1'] },
  R: { w: 0.62, s: ['M0,0 L0,1', 'M0,0 L0.32,0 A0.32,0.27,0.27,0.27,-90,90 L0,0.54', 'M0.26,0.54 L0.62,1'] },
  S: { w: 0.62, s: ['A0.31,0.25,0.29,0.25,-25,-270 A0.31,0.75,0.31,0.25,-90,155'] },
  T: { w: 0.66, s: ['M0.33,0 L0.33,1', 'M0,0 L0.66,0'] },
  U: { w: 0.64, s: [U_] },
  V: { w: 0.72, s: ['M0,0 L0.36,1 L0.72,0'] },
  W: { w: 1.04, s: ['M0,0 L0.26,1 L0.52,0.3 L0.78,1 L1.04,0'] },
  X: { w: 0.66, s: ['M0,0 L0.66,1', 'M0.66,0 L0,1'] },
  Y: { w: 0.7, s: ['M0,0 L0.35,0.5', 'M0.7,0 L0.35,0.5 L0.35,1'] },
  Z: { w: 0.66, s: ['M0,0 L0.66,0 L0,1 L0.66,1'] },
  // ékezetes betűk: az alapbetű vonásai után az ékezet
  Á: { w: 0.8, s: ['M0.4,0 L0,1', 'M0.4,0 L0.8,1', 'M0.15,0.64 L0.65,0.64', ACUTE(0.4)] },
  É: { w: 0.58, s: ['M0,0 L0,1', 'M0,0 L0.58,0', 'M0,0.5 L0.48,0.5', 'M0,1 L0.58,1', ACUTE(0.29)] },
  Í: { w: 0, s: ['M0,0 L0,1', ACUTE(0)] },
  Ó: { w: 0.8, s: [O_, ACUTE(0.4)] },
  Ö: { w: 0.8, s: [O_, ...DOTS(0.24, 0.56)] },
  Ő: { w: 0.8, s: [O_, ...DOUBLE(0.26, 0.56)] },
  Ú: { w: 0.64, s: [U_, ACUTE(0.32)] },
  Ü: { w: 0.64, s: [U_, ...DOTS(0.18, 0.46)] },
  Ű: { w: 0.64, s: [U_, ...DOUBLE(0.18, 0.48)] },
  // számjegyek
  0: { w: 0.56, s: ['A0.28,0.5,0.28,0.5,-90,-450'] },
  1: { w: 0.36, s: ['M0,0.28 L0.34,0 L0.34,1'] },
  2: { w: 0.62, s: ['A0.3,0.3,0.3,0.3,-170,30 L0,1 L0.62,1'] },
  3: { w: 0.6, s: ['A0.3,0.25,0.28,0.25,-160,90 A0.3,0.75,0.3,0.25,-90,160'] },
  4: { w: 0.66, s: ['M0.36,0 L0,0.68 L0.66,0.68', 'M0.5,0.3 L0.5,1'] },
  5: { w: 0.6, s: ['M0.08,0 L0.04,0.46 A0.29,0.68,0.31,0.32,-140,150', 'M0.08,0 L0.58,0'] },
  6: { w: 0.6, s: ['A0.56,0.65,0.54,0.65,-95,-180 A0.3,0.7,0.28,0.3,180,-180'] },
  7: { w: 0.6, s: ['M0,0 L0.6,0 L0.2,1'] },
  8: { w: 0.6, s: ['A0.3,0.25,0.25,0.25,-30,-270 A0.3,0.75,0.3,0.25,-90,270 A0.3,0.25,0.25,0.25,90,-30'] },
  9: { w: 0.6, s: ['A0.3,0.3,0.28,0.3,0,-360 L0.56,1'] },
};
export const LETTERS = [...'AÁBCDEÉFGHIÍJKLMNOÓÖŐPQRSTUÚÜŰVWXYZ'];
export const DIGITS = [...'0123456789'];

// egy vonás pontsora (lépésköz egységben); a pötty egyetlen pont
export function strokePoints(spec, step = 0.03) {
  const pts = [];
  const push = (x, y) => { const l = pts[pts.length - 1]; if (!l || Math.hypot(l[0] - x, l[1] - y) > 1e-6) pts.push([x, y]); };
  const lineTo = (x, y) => {
    const l = pts[pts.length - 1]; if (!l) { push(x, y); return; }
    const n = Math.max(1, Math.ceil(Math.hypot(x - l[0], y - l[1]) / step)), [x0, y0] = l;
    for (let i = 1; i <= n; i++) push(x0 + (x - x0) * i / n, y0 + (y - y0) * i / n);
  };
  for (const m of spec.trim().split(/\s+(?=[MLAD])/)) {
    const c = m[0], v = m.slice(1).split(',').map(Number);
    if (c === 'M') { if (pts.length) throw new Error('M csak a vonás elején'); push(v[0], v[1]); }
    else if (c === 'L') lineTo(v[0], v[1]);
    else if (c === 'D') { pts.push([v[0], v[1]]); }
    else if (c === 'A') {
      const [cx, cy, rx, ry, a0, a1] = v, rad = d => d * Math.PI / 180, at = a => [cx + rx * Math.cos(rad(a)), cy + ry * Math.sin(rad(a))];
      lineTo(...at(a0));
      const len = Math.abs(a1 - a0) * Math.PI / 180 * Math.max(rx, ry), n = Math.max(2, Math.ceil(len / step));
      for (let i = 1; i <= n; i++) push(...at(a0 + (a1 - a0) * i / n));
    } else throw new Error('ismeretlen vonásparancs: ' + c);
  }
  return pts;
}

// szöveg vonásai egymás mellé rakva (betűköz 0.32, szóköz 0.6, kötőjel rövid vonás); ismeretlen jelet kihagy
export function compose(text, gap = 0.32) {
  const strokes = []; let x = 0;
  for (const ch of String(text)) {
    if (ch === ' ') { x += 0.6; continue; }
    if (ch === '-') { strokes.push(strokePoints(`M${x},0.55 L${x + 0.3},0.55`)); x += 0.3 + gap; continue; }
    const g = GLYPHS[ch]; if (!g) continue;
    for (const s of g.s) strokes.push(strokePoints(s).map(([px, py]) => [px + x, py]));
    x += g.w + gap;
  }
  return strokes;
}
export const known = ch => ch === ' ' || ch === '-' || !!GLYPHS[ch];
