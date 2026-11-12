// Saját rajzolt képek a feladatokhoz (SVG): dobókocka, tízes keret, síkidomok. Nem emoji: minden eszközön ugyanúgy néz ki.
const PIPS = { 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[26, 26], [50, 50], [74, 74]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]], 6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]] };
export const die = (n, size = 120) => `<svg class="die" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><rect x="4" y="4" width="92" height="92" rx="18" fill="#fff" stroke="#3b2a63" stroke-width="5"/>${PIPS[n].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#3b2a63"/>`).join('')}</svg>`;

// tízes keret: két sor, soronként öt hely; a pöttyök balról jobbra, előbb a felső sort töltik
export const tenFrame = (n, size = 260) => {
  let cells = '';
  for (let i = 0; i < 10; i++) { const x = 4 + (i % 5) * 38, y = 4 + Math.floor(i / 5) * 38; cells += `<rect x="${x}" y="${y}" width="38" height="38" fill="#fff" stroke="#3b2a63" stroke-width="3"/>${i < n ? `<circle cx="${x + 19}" cy="${y + 19}" r="13" fill="#ff5d8f"/>` : ''}`; }
  return `<svg class="tenframe" viewBox="0 0 198 84" width="${size}" height="${Math.round(size * 84 / 198)}" aria-hidden="true">${cells}</svg>`;
};

// Síkidomok 0..100-as dobozban. A név a gyerek szókincse (kör, négyzet, háromszög, ...).
const poly = pts => `<polygon points="${pts.map(p => p.join(',')).join(' ')}"/>`;
const reg = (k, r = 44, rot = -90) => Array.from({ length: k }, (_, i) => { const a = (rot + i * 360 / k) * Math.PI / 180; return [50 + r * Math.cos(a), 52 + r * Math.sin(a)].map(v => +v.toFixed(1)); });
const starPts = () => Array.from({ length: 10 }, (_, i) => { const a = (-90 + i * 36) * Math.PI / 180, r = i % 2 ? 19 : 46; return [50 + r * Math.cos(a), 53 + r * Math.sin(a)].map(v => +v.toFixed(1)); });
export const SHAPES = {
  kor: { name: 'kör', corners: 0, svg: '<circle cx="50" cy="50" r="42"/>' },
  negyzet: { name: 'négyzet', corners: 4, svg: '<rect x="12" y="12" width="76" height="76"/>' },
  haromszog: { name: 'háromszög', corners: 3, svg: poly([[50, 8], [94, 88], [6, 88]]) },
  teglalap: { name: 'téglalap', corners: 4, svg: '<rect x="4" y="26" width="92" height="48"/>' },
  ovalis: { name: 'ovális', corners: 0, svg: '<ellipse cx="50" cy="50" rx="46" ry="28"/>' },
  csillag: { name: 'csillag', corners: 10, svg: poly(starPts()) },
  sziv: { name: 'szív', corners: 1, svg: '<path d="M50 88 C20 66 6 48 10 30 C14 12 38 8 50 26 C62 8 86 12 90 30 C94 48 80 66 50 88 Z"/>' },
  rombusz: { name: 'rombusz', corners: 4, svg: poly([[50, 4], [80, 50], [50, 96], [20, 50]]) },   // keskenyebb, mint egy elforgatott négyzet
  otszog: { name: 'ötszög', corners: 5, svg: poly(reg(5, 46)) },
  hatszog: { name: 'hatszög', corners: 6, svg: poly(reg(6, 46, 0)) },
};
export const COLORS = {
  piros: { name: 'piros', hex: '#e8383d' }, kek: { name: 'kék', hex: '#2f6fe0' }, sarga: { name: 'sárga', hex: '#ffd21f' },
  zold: { name: 'zöld', hex: '#2fa84f' }, narancs: { name: 'narancssárga', hex: '#ff8a1f' }, lila: { name: 'lila', hex: '#8e44c9' },
  rozsaszin: { name: 'rózsaszín', hex: '#ff8cc6' }, barna: { name: 'barna', hex: '#8a5a2b' }, fekete: { name: 'fekete', hex: '#222222' },
  feher: { name: 'fehér', hex: '#ffffff' }, szurke: { name: 'szürke', hex: '#9a9a9a' },
};
// egy síkidom adott színnel és mérettel (a fehér is látszik: sötét körvonala van)
export const shape = (key, color = 'lila', size = 110) => `<svg class="shape" data-s="${key}" data-c="${color}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><g fill="${COLORS[color].hex}" stroke="#3b2a63" stroke-width="4" stroke-linejoin="round">${SHAPES[key].svg}</g></svg>`;
// fekete árnyék (sziluett) egy síkidomról
export const shadow = (key, size = 130) => `<svg class="shape" data-s="${key}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><g fill="#2b2140">${SHAPES[key].svg}</g></svg>`;
// nyíl a megadott irányba
const ROT = { fel: -90, le: 90, balra: 180, jobbra: 0 };
export const arrow = (dir, size = 110) => `<svg class="arrow" data-d="${dir}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><g transform="rotate(${ROT[dir]} 50 50)" fill="#8e5be8" stroke="#3b2a63" stroke-width="4" stroke-linejoin="round"><path d="M10 40 H58 V20 L92 50 L58 80 V60 H10 Z"/></g></svg>`;
// méret-összehasonlítás négyzetes dobozban (a gombokon egyforma helyet kap): szalag (hossz), torony (magasság),
// rúd (vastagság); rang 0 = a legkisebb, 1 = a közepes, 2 = a legnagyobb
export function measure(kind, rank, color = '#4cc38a') {
  const k = [0.4, 0.68, 1][rank], st = `fill="${color}" stroke="#3b2a63" stroke-width="3"`, L = Math.round(108 * k);
  const body = kind === 'hossz' ? `<rect x="6" y="52" width="${L}" height="16" rx="8" ${st}/>`
    : kind === 'magas' ? `<rect x="48" y="${114 - L}" width="24" height="${L}" rx="5" ${st}/>`
    : `<rect x="6" y="${Math.round(60 - 23 * k)}" width="108" height="${Math.round(46 * k)}" rx="${Math.round(10 * k)}" ${st}/>`;    // vastag
  return `<svg class="bar" data-m="${kind}" data-r="${rank}" viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">${body}</svg>`;
}
// színfolt (paca) a színek felismeréséhez
export const swatch = (color, size = 110) => `<svg class="swatch" data-c="${color}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><path d="M50 8 C72 6 92 22 90 46 C94 70 74 94 50 90 C26 94 6 74 10 50 C6 26 26 8 50 8 Z" fill="${COLORS[color].hex}" stroke="#3b2a63" stroke-width="4"/></svg>`;
