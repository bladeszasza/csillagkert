// Unikornis-öltöztető: sok szín, minta, sörény, szarv, szárny, fejdísz, nyakék, háttér és matrica.
// Nincs jó vagy rossz. A zárolt elemek ajándékok: bármelyik játék és minden 20. csillag hozhatja őket (js/economy.js).
// A még meg nem nyert elem árnyképként látszik (lakat helyett), az újonnan kapott pedig felragyog.
// Vektorgrafika (SVG): forgatásnál és bármilyen méretben éles, és nem kell vászonra emojit rajzolni.
import { giftById } from '../gifts.js';
import { owns } from '../economy.js';
import { say } from '../voice.js';
import { progress } from '../progress.js';

const COLORS = ['#ffffff', '#ffd6ea', '#d6e6ff', '#e6d6ff', '#fff0b8', '#c8f2dd', '#ffc9a8', '#3b2a63'];
const MANES = ['#ff5d8f', '#8e5be8', '#4aa8ff', '#4cc38a', '#ffb020', '#ff7ac8', '#2fd0d0'];

// Csoportok fülenként. item: {id, color|icon, name}; a zárolt elemeket a gifts.js dönti el ("key:id").
const TABS = [
  { id: 'test', icon: '🐴', groups: [
    { key: 'body', items: COLORS.map((c, i) => ({ id: 'c' + i, color: c })) },
    { key: 'pattern', items: [['none', '∅'], ['spots', '⚫'], ['stripes', '🦓'], ['stars', '⭐'], ['hearts', '💗']].map(([id, icon]) => ({ id, icon })) },
  ] },
  { id: 'sor', icon: '🎀', groups: [
    { key: 'mane', items: [...MANES.map((c, i) => ({ id: 'c' + i, color: c })), { id: 'rainbow', icon: '🌈' }] },
    { key: 'manestyle', items: [['wave', '🌊'], ['braid', '🪢'], ['wild', '⚡'], ['curl', '🌀']].map(([id, icon]) => ({ id, icon })) },
  ] },
  { id: 'szarv', icon: '🦄', groups: [
    { key: 'horn', items: [['gold', '#ffd24d'], ['pink', '#ff8fc8'], ['ice', '#9be6ff'], ['rainbow', null]].map(([id, color]) => ({ id, color, icon: color ? undefined : '🌈' })) },
    { key: 'hornstyle', items: [['straight', '▲'], ['spiral', '🌀']].map(([id, icon]) => ({ id, icon })) },
  ] },
  { id: 'szarny', icon: '🦋', groups: [
    { key: 'wing', items: [['none', '∅'], ['feather', '🪶'], ['butterfly', '🦋'], ['fairy', '🧚'], ['rainbow', '🌈']].map(([id, icon]) => ({ id, icon })) },
  ] },
  { id: 'fej', icon: '👑', groups: [
    { key: 'head', items: [['none', '∅'], ['crown', '👑'], ['flowers', '🌸'], ['bow', '🎀'], ['wizard', '🧙']].map(([id, icon]) => ({ id, icon })) },
    { key: 'eyes', items: [['normal', '👁️'], ['glasses', '🕶️'], ['hearts', '😍']].map(([id, icon]) => ({ id, icon })) },
  ] },
  { id: 'nyak', icon: '🧣', groups: [
    { key: 'neck', items: [['none', '∅'], ['necklace', '📿'], ['scarf', '🧣'], ['cape', '🦸'], ['pearls', '🤍']].map(([id, icon]) => ({ id, icon })) },
  ] },
  { id: 'hatter', icon: '🖼️', groups: [
    { key: 'bg', items: [['garden', '🌷'], ['night', '🌙'], ['clouds', '☁️'], ['sea', '🌊'], ['castle', '🏰']].map(([id, icon]) => ({ id, icon })) },
  ] },
  { id: 'matrica', icon: '⭐', groups: [
    { key: 'stickers', multi: true, items: [['star', '⭐'], ['heart', '💖'], ['flower', '🌼'], ['moon', '🌙'], ['rain', '🌈']].map(([id, icon]) => ({ id, icon })) },
  ] },
];

const DEFAULT = { body: 'c0', pattern: 'none', mane: 'c0', manestyle: 'wave', horn: 'gold', hornstyle: 'straight', wing: 'none', head: 'none', eyes: 'normal', neck: 'none', bg: 'garden', stickers: [] };

// A ruhatár a játszó gyerek profiljában él (mindenkinek saját unikornisa van)
function load() { const d = progress.get().dress, s = { ...DEFAULT, ...(d && typeof d === 'object' ? d : {}) }; s.stickers = Array.isArray(s.stickers) ? s.stickers.slice() : []; return s; }
function save(s) { progress.set({ dress: s }); }
// Zárolt: ajándék-ruhadarab, amit ez a gyerek még nem nyert meg (a többi elem kezdettől szabad)
const isLocked = id => giftById(id)?.kind === 'dress' && !owns(progress.get(), id);

// Az ajándék-pillanat képe: a gyerek saját unikornisa, rajta az új ruhadarab ("csoport:elem"). Önálló SVG-dokumentum.
export function preview(id) {
  const s = load(), [key, val] = String(id).split(':');
  if (key in DEFAULT && key !== 'stickers') s[key] = val;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 480">${scene(s)}</svg>`;
}

const colorOf = (key, id) => { const g = TABS.flatMap(t => t.groups).find(x => x.key === key); return g?.items.find(i => i.id === id)?.color; };
const star = (x, y, r, fill) => { let d = ''; for (let i = 0; i < 10; i++) { const rad = i % 2 ? r * 0.45 : r, a = -Math.PI / 2 + i * Math.PI / 5; d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * rad).toFixed(1)} ${(y + Math.sin(a) * rad).toFixed(1)}`; } return `<path d="${d}Z" fill="${fill}" stroke="#e69a00" stroke-width="2" stroke-linejoin="round"/>`; };
const heart = (x, y, s, fill) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 8 C-14 -4 -6 -16 0 -6 C6 -16 14 -4 0 8Z" fill="${fill}"/>`;

function scene(s) {
  const body = colorOf('body', s.body) || '#fff';
  const dark = '#3b2a63', line = `stroke="${dark}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
  const maneFill = s.mane === 'rainbow' ? 'url(#rb)' : (colorOf('mane', s.mane) || '#ff5d8f');
  const hornFill = s.horn === 'rainbow' ? 'url(#rb)' : (colorOf('horn', s.horn) || '#ffd24d');
  let o = `<defs>
    <linearGradient id="rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5d5d"/><stop offset=".25" stop-color="#ffb020"/><stop offset=".5" stop-color="#ffe14d"/><stop offset=".75" stop-color="#4cc38a"/><stop offset="1" stop-color="#4a7dff"/></linearGradient>
    <clipPath id="bodyclip"><ellipse cx="290" cy="270" rx="140" ry="85"/></clipPath>
    <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfefff"/><stop offset="1" stop-color="#e6f7ff"/></linearGradient>
    <linearGradient id="nightg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1040"/><stop offset="1" stop-color="#5b3bb0"/></linearGradient>
    <linearGradient id="seag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfefff"/><stop offset=".55" stop-color="#7fd6ff"/><stop offset="1" stop-color="#3aa3e0"/></linearGradient>
  </defs>`;
  // háttér
  const bgs = {
    garden: `<rect width="600" height="480" fill="url(#skyg)"/><ellipse cx="300" cy="470" rx="420" ry="120" fill="#a8e6a0"/>${[[60, 430, '#ff8fc8'], [150, 450, '#ffcf3f'], [470, 440, '#8e5be8'], [540, 455, '#ff8fc8'], [420, 462, '#ffcf3f']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="9" fill="${c}"/><rect x="${x - 1.5}" y="${y}" width="3" height="22" fill="#4caf50"/>`).join('')}<circle cx="520" cy="60" r="34" fill="#ffe14d"/>`,
    night: `<rect width="600" height="480" fill="url(#nightg)"/>${Array.from({ length: 26 }, (_, i) => star((i * 97) % 580 + 10, (i * 53) % 260 + 10, 4 + (i % 3) * 2, '#fff7b0')).join('')}<circle cx="520" cy="70" r="36" fill="#fff3c4"/><circle cx="534" cy="62" r="30" fill="#2b1a6b" opacity=".55"/><ellipse cx="300" cy="480" rx="420" ry="90" fill="#3b2a80"/>`,
    clouds: `<rect width="600" height="480" fill="url(#skyg)"/>${[[100, 90, 1], [470, 60, .8], [300, 140, 1.2], [540, 200, .9]].map(([x, y, k]) => `<g transform="translate(${x} ${y}) scale(${k})" fill="#fff"><ellipse cx="0" cy="0" rx="50" ry="22"/><ellipse cx="-28" cy="8" rx="30" ry="16"/><ellipse cx="30" cy="8" rx="32" ry="16"/></g>`).join('')}<ellipse cx="300" cy="470" rx="440" ry="90" fill="#fff"/>`,
    sea: `<rect width="600" height="480" fill="url(#seag)"/><circle cx="90" cy="70" r="32" fill="#ffe14d"/>${[0, 1, 2].map(i => `<path d="M0 ${380 + i * 34} q40 -22 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 V480 H0Z" fill="#ffffff" opacity="${0.22 + i * 0.12}"/>`).join('')}`,
    castle: `<rect width="600" height="480" fill="url(#skyg)"/>${[[110, 220, 70, 150, '#ffd6ea'], [250, 170, 90, 200, '#e6d6ff'], [410, 210, 70, 160, '#ffd6ea'], [505, 250, 56, 120, '#d6e6ff']].map(([x, y, w, h, c]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" stroke="#b9a0e8" stroke-width="3"/><polygon points="${x - 6},${y} ${x + w / 2},${y - 50} ${x + w + 6},${y}" fill="#8e5be8"/><rect x="${x + w / 2 - 8}" y="${y + 24}" width="16" height="26" rx="8" fill="#ffd24d"/>`).join('')}<path d="M0 410 q150 -50 300 -10 t300 10 V480 H0Z" fill="#fff"/><ellipse cx="300" cy="470" rx="440" ry="60" fill="#fff"/>`,
  };
  o += bgs[s.bg] || bgs.garden;
  // matricák
  const stk = { star: (x, y) => star(x, y, 20, '#ffcf3f'), heart: (x, y) => heart(x, y, 2, '#ff5d8f'), flower: (x, y) => `<g transform="translate(${x} ${y})">${[0, 1, 2, 3, 4].map(i => `<circle cx="${Math.cos(i * 1.256) * 11}" cy="${Math.sin(i * 1.256) * 11}" r="8" fill="#ff8fc8"/>`).join('')}<circle r="7" fill="#ffe14d"/></g>`, moon: (x, y) => `<circle cx="${x}" cy="${y}" r="18" fill="#fff3c4"/><circle cx="${x + 8}" cy="${y - 4}" r="15" fill="#bfefff" opacity=".0"/>`, rain: (x, y) => `<g transform="translate(${x} ${y})" fill="none" stroke-width="6" stroke-linecap="round"><path d="M-24 8 a24 24 0 0 1 48 0" stroke="#ff5d5d"/><path d="M-17 8 a17 17 0 0 1 34 0" stroke="#ffe14d"/><path d="M-10 8 a10 10 0 0 1 20 0" stroke="#4a7dff"/></g>` };
  const spots = [[60, 70], [540, 90], [80, 200], [530, 330]];
  s.stickers.forEach((id, i) => { const p = spots[i % spots.length]; o += stk[id]?.(p[0], p[1]) || ''; });
  // szárny (a test mögött)
  const wing = {
    feather: `<g fill="#fff" ${line}><path d="M250 215 C150 90 90 150 120 240 C150 200 190 210 250 235Z"/><path d="M262 220 C190 70 130 100 150 190Z" fill="#f0e6ff"/></g>`,
    butterfly: `<g ${line}><path d="M250 215 C140 60 70 120 140 210Z" fill="#ff8fc8"/><path d="M262 235 C170 280 110 260 150 220Z" fill="#8e5be8"/><circle cx="150" cy="150" r="14" fill="#fff" stroke="none" opacity=".7"/></g>`,
    fairy: `<g fill="#bfefff" fill-opacity=".65" stroke="#7fd6ff" stroke-width="4"><path d="M250 215 C150 40 80 100 140 210Z"/><path d="M262 232 C170 290 100 250 150 222Z"/></g>`,
    rainbow: `<g fill="none" stroke-width="14" stroke-linecap="round"><path d="M250 215 C150 70 90 110 130 215" stroke="#ff5d5d"/><path d="M252 222 C170 100 120 130 150 220" stroke="#ffb020"/><path d="M254 228 C190 130 150 155 168 224" stroke="#4cc38a"/><path d="M256 234 C210 170 185 180 190 228" stroke="#4a7dff"/></g>`,
  };
  o += wing[s.wing] || '';
  // farok (a test mögött)
  const tail = s.manestyle === 'curl' ? `<path d="M170 250 C80 230 70 330 130 330 C90 310 110 270 175 275Z" fill="${maneFill}" ${line}/>` :
    s.manestyle === 'wild' ? `<path d="M170 250 L80 210 L110 250 L60 270 L120 285 L90 330 L175 285Z" fill="${maneFill}" ${line}/>` :
    `<path d="M170 245 C90 215 60 280 100 340 C115 300 130 285 175 285Z" fill="${maneFill}" ${line}/>`;
  o += tail;
  // lábak
  for (const [x, back] of [[200, 1], [240, 1], [350, 0], [392, 0]]) o += `<path d="M${x} 320 h34 v90 q0 14 -17 14 q-17 0 -17 -14Z" fill="${body}" ${line}/><path d="M${x} 400 h34 v14 q0 10 -17 10 q-17 0 -17 -10Z" fill="${dark}" opacity="${back ? .85 : 1}"/>`;
  // test + minta
  o += `<ellipse cx="290" cy="270" rx="140" ry="85" fill="${body}" ${line}/>`;
  const pc = body === '#3b2a63' ? '#ffffff' : '#c9b3f5';
  if (s.pattern !== 'none') {
    o += `<g clip-path="url(#bodyclip)">`;
    if (s.pattern === 'spots') o += [[220, 240, 16], [300, 300, 18], [350, 250, 14], [260, 310, 12], [190, 290, 12], [320, 215, 11]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${pc}"/>`).join('');
    if (s.pattern === 'stripes') o += [200, 240, 280, 320, 360].map(x => `<path d="M${x} 180 l-30 170" stroke="${pc}" stroke-width="14"/>`).join('');
    if (s.pattern === 'stars') o += [[220, 240], [300, 290], [350, 245], [260, 320]].map(([x, y]) => star(x, y, 15, '#ffcf3f')).join('');
    if (s.pattern === 'hearts') o += [[220, 245], [300, 295], [350, 245], [255, 320]].map(([x, y]) => heart(x, y, 1.6, '#ff5d8f')).join('');
    o += `</g>`;
  }
  // köpeny / nyak
  if (s.neck === 'cape') o += `<path d="M360 215 C300 200 200 220 150 330 C250 300 320 300 380 260Z" fill="#c53b6e" ${line}/>`;
  // nyak + fej
  o += `<path d="M360 230 C380 150 410 120 445 105 L520 150 C500 190 470 215 430 270Z" fill="${body}" ${line}/>`;
  o += `<ellipse cx="480" cy="160" rx="64" ry="48" transform="rotate(18 480 160)" fill="${body}" ${line}/>`;
  o += `<ellipse cx="528" cy="178" rx="26" ry="20" fill="${body}" ${line}/><ellipse cx="540" cy="176" rx="5" ry="4" fill="#ff8fc8"/>`;
  o += `<path d="M436 120 l-6 -44 l40 30Z" fill="${body}" ${line}/><path d="M440 112 l-3 -22 l20 16Z" fill="#ffb3d6"/>`;
  // arc
  const eyeX = 492, eyeY = 150;
  if (s.eyes === 'hearts') o += heart(eyeX, eyeY, 1.0, '#ff2f7a'); else o += `<circle cx="${eyeX}" cy="${eyeY}" r="8" fill="${dark}"/><circle cx="${eyeX + 3}" cy="${eyeY - 3}" r="3" fill="#fff"/>`;
  o += `<ellipse cx="505" cy="188" rx="9" ry="6" fill="#ff8fc8" opacity=".55"/>`;
  if (s.eyes === 'glasses') o += `<g fill="#222" stroke="${dark}" stroke-width="3"><circle cx="${eyeX}" cy="${eyeY}" r="16" fill-opacity=".85"/><path d="M${eyeX - 16} ${eyeY} L${eyeX - 40} ${eyeY - 6}" fill="none"/></g>`;
  // szarv
  o += `<path d="M470 108 L500 12 L512 118Z" fill="${hornFill}" ${line}/>`;
  if (s.hornstyle === 'spiral') o += [40, 62, 84].map(y => `<path d="M${478 + (y - 40) * 0.1} ${y + 14} L${506 + (y - 40) * 0.05} ${y + 2}" stroke="${dark}" stroke-width="4" stroke-linecap="round"/>`).join('');
  // sörény
  const manes = { wave: [[430, 120], [412, 150], [398, 182], [386, 214]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="26" ry="20" fill="${maneFill}" ${line}/>`).join(''),
    braid: [[432, 118], [414, 146], [400, 176], [388, 206], [380, 236]].map(([x, y], i) => `<ellipse cx="${x + (i % 2) * 6}" cy="${y}" rx="15" ry="22" fill="${maneFill}" ${line}/>`).join(''),
    wild: `<path d="M450 100 L405 90 L420 130 L370 140 L405 170 L360 195 L400 215 L370 245 L430 240Z" fill="${maneFill}" ${line}/>`,
    curl: [[430, 120], [412, 152], [396, 184], [384, 216]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="22" fill="${maneFill}" ${line}/><path d="M${x - 8} ${y} a8 8 0 1 1 8 8" fill="none" stroke="${dark}" stroke-width="3"/>`).join('') };
  o += manes[s.manestyle] || manes.wave;
  // nyakék / sál
  if (s.neck === 'necklace') o += `<path d="M372 232 q30 36 66 8" fill="none" stroke="#ffcf3f" stroke-width="5"/>${[0, 1, 2, 3, 4].map(i => `<circle cx="${380 + i * 13}" cy="${248 + Math.sin(i / 4 * Math.PI) * 14}" r="7" fill="#ff5d8f" stroke="${dark}" stroke-width="2"/>`).join('')}`;
  if (s.neck === 'pearls') o += `${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="${374 + i * 11}" cy="${240 + Math.sin(i / 5 * Math.PI) * 16}" r="7" fill="#fff" stroke="#c9b3f5" stroke-width="2"/>`).join('')}`;
  if (s.neck === 'scarf') o += `<path d="M366 228 q36 26 78 -4 l6 24 q-44 30 -88 4Z" fill="#ff5d8f" ${line}/><path d="M376 244 l-6 50 l24 -8 l-4 -36Z" fill="#ff5d8f" ${line}/><path d="M380 250 h16 M378 262 h16" stroke="#fff" stroke-width="4"/>`;
  // fejdísz
  const head = { crown: `<path d="M440 112 l10 -34 l16 22 l18 -28 l18 30 l14 -18 l6 38Z" transform="rotate(8 480 100)" fill="#ffd24d" ${line}/><circle cx="470" cy="94" r="5" fill="#ff5d8f"/><circle cx="490" cy="88" r="5" fill="#4aa8ff"/>`,
    flowers: [[440, 118], [462, 104], [486, 100], [508, 110]].map(([x, y], i) => `<g transform="translate(${x} ${y})">${[0, 1, 2, 3, 4].map(k => `<circle cx="${Math.cos(k * 1.256) * 9}" cy="${Math.sin(k * 1.256) * 9}" r="7" fill="${['#ff8fc8', '#ffcf3f', '#8e5be8', '#ff9f43'][i]}"/>`).join('')}<circle r="5" fill="#fff"/></g>`).join(''),
    bow: `<g transform="translate(444 106)"><path d="M0 0 l-30 -18 v36Z M0 0 l30 -18 v36Z" fill="#ff5d8f" ${line}/><circle r="8" fill="#ff2f7a" ${line}/></g>`,
    wizard: `<g transform="rotate(10 470 100)"><path d="M430 112 L486 -20 L530 112Z" fill="#6a3fc0" ${line}/><ellipse cx="480" cy="112" rx="64" ry="12" fill="#5a2fb0" ${line}/>${star(486, 40, 14, '#ffe14d')}${star(466, 82, 8, '#ffe14d')}</g>` };
  o += head[s.head] || '';
  return o;
}

export function run(container) {
  const sel = load();
  const fresh = new Set(progress.get().newDress || []);    // most nyert darabok: felragyognak, és az ő fülükön nyílik meg
  progress.seenDress();
  const firstTab = TABS.find(t => t.groups.some(g => g.items.some(it => fresh.has(`${g.key}:${it.id}`))));
  let tab = firstTab ? firstTab.id : 'test';
  container.innerHTML = `<div class="dress2"><svg class="du-svg" viewBox="0 0 600 480" preserveAspectRatio="xMidYMid meet"></svg><div class="du-tabs"></div><div class="du-opts"></div><div class="du-msg"></div></div>`;
  const svg = container.querySelector('.du-svg'), tabsEl = container.querySelector('.du-tabs'), optsEl = container.querySelector('.du-opts'), msg = container.querySelector('.du-msg');

  const draw = () => { svg.innerHTML = scene(sel); };
  function renderTabs() { tabsEl.innerHTML = TABS.map(t => `<button class="du-tab${t.id === tab ? ' sel' : ''}" data-t="${t.id}">${t.icon}</button>`).join(''); }
  function renderOpts() {
    const t = TABS.find(x => x.id === tab);
    optsEl.innerHTML = t.groups.map(g => `<div class="du-row">${g.items.map(it => {
      const id = `${g.key}:${it.id}`, locked = isLocked(id);
      const on = g.multi ? sel[g.key].includes(it.id) : sel[g.key] === it.id;
      return `<button class="du-opt${on ? ' sel' : ''}${locked ? ' locked' : ''}${fresh.has(id) ? ' fresh' : ''}" data-k="${g.key}" data-i="${it.id}" ${it.color && !locked ? `style="background:${it.color}"` : ''}>${it.icon ? `<span class="oi">${it.icon}</span>` : ''}</button>`;
    }).join('')}</div>`).join('');
  }
  function refresh() { draw(); renderTabs(); renderOpts(); }
  tabsEl.addEventListener('click', e => { const b = e.target.closest('.du-tab'); if (!b) return; tab = b.dataset.t; renderTabs(); renderOpts(); });
  optsEl.addEventListener('click', e => {
    const b = e.target.closest('.du-opt'); if (!b) return;
    const key = b.dataset.k, id = b.dataset.i;
    if (isLocked(`${key}:${id}`)) { msg.textContent = '🎁'; say('Ezt még meg kell nyerni! Bármelyik játékban ajándékba kaphatod.', { remember: false }); return; }
    msg.textContent = '';
    if (key === 'stickers') { const i = sel.stickers.indexOf(id); if (i >= 0) sel.stickers.splice(i, 1); else sel.stickers.push(id); if (sel.stickers.length > 4) sel.stickers.shift(); }
    else sel[key] = id;
    save(sel); refresh();
  });
  refresh();
  return () => {};
}
