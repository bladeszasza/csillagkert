// Saját ikonkészlet (M5/3): a felület állandó jelei egységes, kerek „matrica" stílusban, rendszer-emoji helyett
// (az emoji eszközönként másképp néz ki). 64 × 64-es rács, tinta-kontúr (#3b2a63), pasztell kitöltés, fehér csillanás.
// Csak a felület jelei vannak itt: állomások, jutalomjátékok, öltöztető-fülek, gombok. A feladatok képei (ételek,
// tárgyak) továbbra is emojik (README „Ikonok és betűk"). Nincs benne böngésző-kód és külső hivatkozás.
const K = '#3b2a63';
const L = (c = K, w = 3) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const shine = (cx, cy, rx, ry, rot = -30) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="#fff" opacity=".7"/>`;
const heartPath = (x, y, s) => `M${x} ${y + 9 * s}c${-7 * s} ${-5 * s} ${-11 * s} ${-9 * s} ${-11 * s} ${-13 * s}a${5.5 * s} ${5.5 * s} 0 0 1 ${11 * s} ${-3 * s}a${5.5 * s} ${5.5 * s} 0 0 1 ${11 * s} ${3 * s}c0 ${4 * s} ${-4 * s} ${8 * s} ${-11 * s} ${13 * s}z`;
const starPath = (cx, cy, r, k = 0.45) => 'M' + Array.from({ length: 10 }, (_, i) => { const rr = i % 2 ? r * k : r, a = -Math.PI / 2 + i * Math.PI / 5; return `${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`; }).join('L') + 'Z';
const gearPath = (cx, cy, r1, r2, n) => {
  let d = '';
  for (let i = 0; i < n * 4; i++) { const a = (i / (n * 4)) * Math.PI * 2 - Math.PI / 2, r = (i % 4 < 2) ? r2 : r1; d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`; }
  return d + 'Z';
};
const flower = (cx, cy, r, c) => { const p = Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [(cx + Math.cos(a) * r * 0.55).toFixed(1), (cy + Math.sin(a) * r * 0.55).toFixed(1)]; });
  return p.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${(r * 0.5 + 1.5).toFixed(1)}" fill="${K}"/>`).join('') + p.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${(r * 0.5).toFixed(1)}" fill="${c}"/>`).join('')
    + `<circle cx="${cx}" cy="${cy}" r="${(r * 0.3).toFixed(1)}" fill="#ffcf3f" ${L(K, 1.5)}/>`; };
const cloud = (x, y, s) => `<path d="M${x} ${y}a${7 * s} ${7 * s} 0 0 1 ${4 * s} ${-13 * s}a${9 * s} ${9 * s} 0 0 1 ${17 * s} ${-2 * s}a${7 * s} ${7 * s} 0 0 1 ${6 * s} ${13 * s}z" fill="#fff" ${L(K, 2.5)}/>`;
const scene = (bg, inner) => `<rect x="6" y="10" width="52" height="44" rx="6" fill="${bg}"/>${inner}<rect x="6" y="10" width="52" height="44" rx="6" fill="none" ${L()}/>`;
const rainbowBands = (cx, cy, rs, w) => ['#ff5d8f', '#ffb020', '#4cc38a', '#4aa8ff'].map((c, i) => { const r = rs - i * w; return `<path d="M${cx - r} ${cy}a${r} ${r} 0 0 1 ${2 * r} 0" fill="none" stroke="${c}" stroke-width="${w - 0.8}"/>`; }).join('');
const crown = `<path d="M10 46L8 18l13 12 11-18 11 18 13-12-2 28z" fill="#ffcf3f" ${L()}/><rect x="10" y="45" width="44" height="10" rx="3" fill="#ffb020" ${L()}/>
  <circle cx="32" cy="36" r="4.5" fill="#ff5d8f" ${L(K, 2)}/><circle cx="20" cy="39" r="3" fill="#4aa8ff" ${L(K, 2)}/><circle cx="44" cy="39" r="3" fill="#4cc38a" ${L(K, 2)}/>
  <circle cx="8" cy="17" r="3.2" fill="#fff" ${L(K, 2)}/><circle cx="32" cy="11" r="3.2" fill="#fff" ${L(K, 2)}/><circle cx="56" cy="17" r="3.2" fill="#fff" ${L(K, 2)}/>`;
const unicornHead = `<circle cx="46" cy="24" r="7" fill="#ff8fc8" ${L()}/><circle cx="50" cy="35" r="7" fill="#c9a3ff" ${L()}/><circle cx="51" cy="47" r="7" fill="#7fd0ff" ${L()}/>
  <path d="M28 60c0-10 3-20 9-30l10 3c2 9 2 18 1 27z" fill="#fff" ${L()}/>
  <path d="M41 23c-1-9-11-12-18-7-5 4-8 9-12 15-2 4 0 9 5 9 5 0 9-3 13-5 8-3 13-6 12-12z" fill="#fff" ${L()}/>
  <path d="M27 16L21 1l12 12z" fill="#ffcf3f" ${L(K, 2.5)}/><path d="M23.5 7.5l5-1.5M25.5 12l4.5-2" ${L(K, 2)}/>
  <path d="M35 17l4-9 4 10z" fill="#fff" ${L(K, 2.5)}/><circle cx="29" cy="23" r="2.6" fill="${K}"/><circle cx="14.5" cy="35" r="1.6" fill="${K}"/><circle cx="24" cy="31" r="3" fill="#ffb3d6"/>`;

export const ICONS = {
  // --- állomások (a kert térképén) ---
  'st-ceruza': `<g transform="rotate(40 32 32)"><path d="M25 8h14v34H25z" fill="#ffcf3f" ${L()}/><path d="M32 18v22" ${L('#e8a800', 2.5)}/>
    <path d="M25 13V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5z" fill="#ff8fc8" ${L()}/><path d="M25 13h14v5H25z" fill="#dfe4f2" ${L()}/>
    <path d="M25 42l7 15 7-15z" fill="#f6d2a2" ${L()}/><path d="M29.6 52l2.4 5 2.4-5z" fill="${K}"/></g>`,
  'st-szamol': `<g transform="rotate(-8 32 32)"><rect x="9" y="9" width="46" height="46" rx="12" fill="#ff8fc8" ${L()}/>
    ${[[21, 21], [43, 21], [32, 32], [21, 43], [43, 43]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.6" fill="#fff" ${L(K, 2)}/>`).join('')}</g>`,
  'st-forma': `<circle cx="21" cy="41" r="13" fill="#4aa8ff" ${L()}/><rect x="31" y="31" width="23" height="23" rx="4" fill="#ffcf3f" ${L()}/>
    <path d="M32 5l15 26H17z" fill="#ff5d5d" ${L()}/>`,
  'st-hang': `<path fill-rule="evenodd" d="M7 55L21 11h8l14 44h-9l-3-10H19l-3 10zM21.5 37h7L25 24z" fill="#8e5be8" ${L()}/>
    <path d="M47 23q6 9 0 18M53 17q11 15 0 30" fill="none" ${L('#ff5d8f', 3.5)}/>`,
  'st-zene': `<path d="M22 47V16l26-6v31" fill="none" ${L(K, 3.5)}/><path d="M22 15l26-6v8l-26 6z" fill="#8e5be8" ${L()}/>
    <ellipse cx="15.5" cy="48" rx="8" ry="6.5" transform="rotate(-20 15.5 48)" fill="#8e5be8" ${L()}/><ellipse cx="41.5" cy="42" rx="8" ry="6.5" transform="rotate(-20 41.5 42)" fill="#8e5be8" ${L()}/>
    ${shine(13, 46, 2.5, 1.5)}${shine(39, 40, 2.5, 1.5)}`,
  'st-allat': `<ellipse cx="23" cy="20" rx="6.5" ry="15" transform="rotate(-12 23 20)" fill="#fff" ${L()}/><ellipse cx="23" cy="21" rx="3" ry="10" transform="rotate(-12 23 21)" fill="#ffb3d6"/>
    <ellipse cx="41" cy="20" rx="6.5" ry="15" transform="rotate(12 41 20)" fill="#fff" ${L()}/><ellipse cx="41" cy="21" rx="3" ry="10" transform="rotate(12 41 21)" fill="#ffb3d6"/>
    <ellipse cx="32" cy="43" rx="18" ry="15.5" fill="#fff" ${L()}/><circle cx="25" cy="41" r="2.8" fill="${K}"/><circle cx="39" cy="41" r="2.8" fill="${K}"/>
    <ellipse cx="32" cy="47" rx="3" ry="2.2" fill="#ff6f9f"/><circle cx="20.5" cy="48" r="3" fill="#ffb3d6"/><circle cx="43.5" cy="48" r="3" fill="#ffb3d6"/>`,
  'st-okos': `<path d="M8 22H4M60 22h-4M13 8l-3-3M51 8l3-3M32 3V0" ${L('#ffb020', 3)}/>
    <path d="M32 8a17 17 0 0 0-10 30.7c2 1.6 3 3.5 3 5.8V47h14v-2.5c0-2.3 1-4.2 3-5.8A17 17 0 0 0 32 8z" fill="#ffe14d" ${L()}/>
    <path d="M25 52h14M27 57h10" ${L()}/><path d="M26 29q6 6 12 0" fill="none" ${L('#e8a800', 2.5)}/>${shine(24, 20, 3, 5.5, 30)}`,
  'st-vilag': `<circle cx="32" cy="32" r="24" fill="#7fd0ff" ${L()}/>
    <path d="M17 19q8 1 8 8-1 6 5 8 4 2 2 8-1 4 2 8-9-1-14-7-5-7-5-14 1-7 2-11z" fill="#6fcf73" ${L(K, 2.5)}/>
    <path d="M37 12q9 1 13 8-6 1-7 5-1 4-6 3-4-1-3-7 0-5 3-9z" fill="#6fcf73" ${L(K, 2.5)}/>
    <path d="M45 37q6-2 9 1-1 7-7 11-3-6-2-12z" fill="#6fcf73" ${L(K, 2.5)}/>${shine(22, 18, 4, 2.4, -35)}`,
  'st-egeszseg': `<path d="M32 19c-4-4-14-5-19 2-6 9-2 24 6 30 4 3 8 3 13 1 5 2 9 2 13-1 8-6 12-21 6-30-5-7-15-6-19-2z" fill="#ff5d5d" ${L()}/>
    <path d="M32 19c0-5 1-8 4-11" fill="none" ${L()}/><path d="M35 12c4-5 11-6 15-3-3 5-10 6-15 3z" fill="#6fcf73" ${L(K, 2.5)}/>${shine(21, 29, 3.5, 6, 25)}`,
  'st-test': `<circle cx="32" cy="14" r="9" fill="#ffd9b8" ${L()}/><circle cx="29" cy="14" r="1.6" fill="${K}"/><circle cx="35" cy="14" r="1.6" fill="${K}"/><path d="M29.5 18q2.5 2 5 0" fill="none" ${L(K, 1.8)}/>
    <path d="M18 29q14-8 28 0l7 10-6 4-4-5v19h-7l-4-10-4 10h-7V38l-4 5-6-4z" fill="#4aa8ff" ${L()}/>
    <path d="${heartPath(32, 33, 0.62)}" fill="#ff5d8f" ${L(K, 2)}/>`,
  'st-ido': `<path d="M15 7h34M15 57h34" ${L(K, 4.5)}/>
    <path d="M20 8c0 12 12 15 12 24s-12 12-12 24h24c0-12-12-15-12-24s12-12 12-24z" fill="#e6f7ff" ${L()}/>
    <path d="M24.5 15h15c-2 6-7.5 8.5-7.5 12 0-3.5-5.5-6-7.5-12z" fill="#ffcf3f"/><path d="M23 55c1-7 9-10 9-14 0 4 8 7 9 14z" fill="#ffcf3f"/><path d="M32 30v12" ${L('#ffcf3f', 2)}/>`,
  'st-algo': `<path d="M32 13V7" ${L()}/><circle cx="32" cy="6" r="4" fill="#ffcf3f" ${L(K, 2.5)}/>
    <rect x="10" y="13" width="44" height="36" rx="15" fill="#e8ecff" ${L()}/><rect x="16" y="20" width="32" height="18" rx="8" fill="#2b2a55"/>
    <ellipse cx="25" cy="29" rx="4" ry="4.5" fill="#7fe0ff"/><ellipse cx="39" cy="29" rx="4" ry="4.5" fill="#7fe0ff"/><path d="M27 43q5 3 10 0" fill="none" ${L('#ff5d8f', 3)}/>
    <rect x="22" y="50" width="20" height="9" rx="4" fill="#c9d2f5" ${L(K, 2.5)}/>`,
  'st-rajz': `<path d="M32 8C17 8 7 19 7 31c0 12 9 21 20 21 4 0 5-3 3-6-2-3 0-6 4-6h7c8 0 16-5 16-14C57 16 46 8 32 8z" fill="#ffe9c7" ${L()}/>
    <circle cx="19" cy="25" r="4.5" fill="#ff5d5d" ${L(K, 2)}/><circle cx="30" cy="17" r="4.5" fill="#ffcf3f" ${L(K, 2)}/><circle cx="42" cy="19" r="4.5" fill="#4aa8ff" ${L(K, 2)}/>
    <circle cx="48" cy="30" r="4.5" fill="#4cc38a" ${L(K, 2)}/><circle cx="20" cy="38" r="4" fill="#bfefff" ${L(K, 2)}/>`,

  // --- jutalomjátékok ---
  'g-sparkhorn': unicornHead,
  'g-bubbles': `<circle cx="24" cy="37" r="17" fill="#cdeeff" ${L()}/><circle cx="46" cy="19" r="10" fill="#ffd9f0" ${L()}/><circle cx="49" cy="46" r="7" fill="#e6dcff" ${L()}/>
    <path d="M14 33a11 11 0 0 1 8-9" fill="none" ${L('#fff', 3.5)}/><path d="M40 16a6 6 0 0 1 4-3" fill="none" ${L('#fff', 3)}/>`,
  'g-foodcatch': `<path d="M14 27L12 8l15 10z" fill="#ffb347" ${L()}/><path d="M50 27l2-19-15 10z" fill="#ffb347" ${L()}/>
    <path d="M16 21l-1-8 6 4zM48 21l1-8-6 4z" fill="#ffb3d6"/><ellipse cx="32" cy="37" rx="22" ry="19" fill="#ffb347" ${L()}/>
    <ellipse cx="24" cy="35" rx="3" ry="4" fill="${K}"/><ellipse cx="40" cy="35" rx="3" ry="4" fill="${K}"/><path d="M29.5 42h5l-2.5 3z" fill="#ff6f9f"/>
    <path d="M32 45q-3 4-6 1M32 45q3 4 6 1" fill="none" ${L(K, 2)}/><path d="M6 41h10M7 48l10-3M58 41H48M57 48l-10-3" ${L(K, 1.8)}/>`,
  'g-healthy': `<circle cx="24" cy="26" r="11" fill="#ff5d5d" ${L()}/><path d="M24 15q1-5 4-7" fill="none" ${L(K, 2.5)}/>
    <path d="M36 32l14-22 5 4z" fill="#ffb020" ${L()}/><path d="M50 10l3-7M52 12l7-2" ${L('#4cc38a', 3)}/>
    <path d="M7 33h50c0 13-11 23-25 23S7 46 7 33z" fill="#8e5be8" ${L()}/><path d="M14 40q18 6 36 0" fill="none" ${L('#c9a3ff', 2.5)}/>`,
  'g-race': `<path d="M13 59V7" ${L(K, 4)}/><rect x="15" y="9" width="40" height="27" fill="#fff"/>
    ${[[15, 9], [35, 9], [25, 18], [45, 18], [15, 27], [35, 27]].map(([x, y]) => `<rect x="${x}" y="${y}" width="10" height="9" fill="${K}"/>`).join('')}
    <rect x="15" y="9" width="40" height="27" fill="none" ${L()}/>`,
  'g-openworld': `<path d="M5 46a27 27 0 0 1 54 0" fill="none" stroke="#ff5d5d" stroke-width="6"/><path d="M11 46a21 21 0 0 1 42 0" fill="none" stroke="#ffcf3f" stroke-width="6"/>
    <path d="M17 46a15 15 0 0 1 30 0" fill="none" stroke="#4cc38a" stroke-width="6"/><path d="M23 46a9 9 0 0 1 18 0" fill="none" stroke="#4a7dff" stroke-width="6"/>
    <path d="M2 59c8-13 20-15 30-9s22 4 30 9z" fill="#6fcf73" ${L()}/>`,
  'g-pet': `<ellipse cx="32" cy="43" rx="13" ry="11" fill="#ff8fc8" ${L()}/>
    <ellipse cx="15" cy="29" rx="5.5" ry="7" transform="rotate(-25 15 29)" fill="#ff8fc8" ${L()}/><ellipse cx="25" cy="18" rx="5.5" ry="7.5" transform="rotate(-8 25 18)" fill="#ff8fc8" ${L()}/>
    <ellipse cx="39" cy="18" rx="5.5" ry="7.5" transform="rotate(8 39 18)" fill="#ff8fc8" ${L()}/><ellipse cx="49" cy="29" rx="5.5" ry="7" transform="rotate(25 49 29)" fill="#ff8fc8" ${L()}/>`,
  'g-dressup': crown,

  // --- az öltöztető fülei ---
  'tab-test': `<path d="M32 5c9 13 19 23 19 35a19 19 0 0 1-38 0C13 28 23 18 32 5z" fill="#ff8fc8" ${L()}/>
    <circle cx="26" cy="38" r="4" fill="#fff"/><circle cx="38" cy="45" r="3.4" fill="#fff"/><circle cx="35" cy="30" r="2.6" fill="#fff"/>${shine(22, 30, 2.5, 5, 20)}`,
  'tab-sor': `<path d="M20 5c-8 11 8 17 0 28s8 18 0 26" fill="none" ${L(K, 11)}/><path d="M32 5c-8 11 8 17 0 28s8 18 0 26" fill="none" ${L(K, 11)}/><path d="M44 5c-8 11 8 17 0 28s8 18 0 26" fill="none" ${L(K, 11)}/>
    <path d="M20 5c-8 11 8 17 0 28s8 18 0 26" fill="none" ${L('#ff5d8f', 6)}/><path d="M32 5c-8 11 8 17 0 28s8 18 0 26" fill="none" ${L('#c9a3ff', 6)}/><path d="M44 5c-8 11 8 17 0 28s8 18 0 26" fill="none" ${L('#7fd0ff', 6)}/>`,
  'tab-szarv': `<path d="M32 4l12 53H20z" fill="#ffcf3f" ${L()}/><path d="M23 45l18-5M26 32l12-4M29 20l6-2" ${L(K, 2.5)}/>`,
  'tab-szarny': `<path d="M7 42C7 21 25 8 54 8c-2 8-8 12-14 13 6 1 10 4 12 9-6 3-12 3-17 1 4 3 6 7 6 11-12 2-26 5-34 0z" fill="#fff" ${L()}/>
    <path d="M14 38c8-10 18-17 32-22M17 42c8-4 14-7 22-9" fill="none" ${L('#c9a3ff', 2.5)}/>`,
  'tab-fej': crown,
  'tab-nyak': `<path d="M8 20c15 9 33 9 48 0v11c-15 9-33 9-48 0z" fill="#ff5d8f" ${L()}/><path d="M35 34l-3 24 11-2 3-22z" fill="#ff5d8f" ${L()}/>
    <path d="M16 25v10M48 25v10M34 50l10-1" ${L('#fff', 3)}/>`,
  'tab-hatter': `<rect x="6" y="10" width="52" height="44" rx="6" fill="#bfefff"/><circle cx="44" cy="24" r="6" fill="#ffe14d" ${L(K, 2.5)}/>
    <path d="M7 46c9-11 20-13 28-6 6-6 14-6 22 0v8a5 5 0 0 1-5 5H12a5 5 0 0 1-5-5z" fill="#6fcf73"/><rect x="6" y="10" width="52" height="44" rx="6" fill="none" ${L()}/>`,
  'tab-matrica': `<path d="${starPath(32, 33, 26)}" fill="#ffcf3f" ${L()}/>${shine(26, 26, 3, 5, 20)}`,

  // --- gombok és jelek ---
  'ui-speaker': `<path d="M8 24h10l15-13v42L18 40H8z" fill="#8e5be8" ${L()}/><path d="M41 24q5 8 0 16M48 17q10 15 0 30" fill="none" ${L(K, 3.5)}/>`,
  'ui-gear': `<path fill-rule="evenodd" d="${gearPath(32, 32, 19, 26, 8)}M41 32a9 9 0 1 0-18 0 9 9 0 1 0 18 0z" fill="#cfc2ef" ${L()}/>`,
  'ui-back': `<path d="M52 32H14M30 15L13 32l17 17" fill="none" ${L(K, 7)}/>`,
  'ui-home': `<path d="M14 29v25h36V29L32 14z" fill="#ffd6ea" ${L()}/><path d="M6 32L32 9l26 23" fill="none" ${L('#ff5d5d', 6)}/><path d="M6 32L32 9l26 23" fill="none" ${L(K, 1.5)}/>
    <rect x="27" y="38" width="10" height="16" rx="3" fill="#8e5be8" ${L(K, 2.5)}/>`,
  'ui-sunset': `<path d="M12 44a20 20 0 0 1 40 0z" fill="#ffb020" ${L()}/><path d="M32 12V6M14 22l-4-4M50 22l4-4M4 44h56M12 53h40" ${L()}/>`,
  'ui-zoom': `<circle cx="26" cy="26" r="15" fill="#e6f7ff" ${L(K, 3.5)}/><path d="M37 37l16 16" ${L(K, 8)}/>${shine(20, 20, 3, 5, 40)}`,
  'ui-heart': `<path d="${heartPath(32, 46, 1.9)}" fill="#ff3d7f" ${L()}/>${shine(21, 22, 3, 5.5, 35)}`,
  'ui-retry': `<path d="M50 30a19 19 0 1 1-6-13" fill="none" ${L(K, 6)}/><path d="M48 6l-2 15-14-4z" fill="${K}" ${L(K, 3)}/>`,
  'ui-jump': `<path d="M32 8L12 30h12v24h16V30h12z" fill="#ffcf3f" ${L()}/>`,
  'ui-friends': `<ellipse cx="15" cy="13" rx="4" ry="9" transform="rotate(-10 15 13)" fill="#fff" ${L(K, 2.5)}/><ellipse cx="26" cy="12" rx="4" ry="9" transform="rotate(10 26 12)" fill="#fff" ${L(K, 2.5)}/>
    <circle cx="21" cy="29" r="12" fill="#fff" ${L()}/><circle cx="17" cy="28" r="1.8" fill="${K}"/><circle cx="25" cy="28" r="1.8" fill="${K}"/><ellipse cx="21" cy="33" rx="2" ry="1.4" fill="#ff6f9f"/>
    <path d="M31 37l-1-14 9 7zM55 37l1-14-9 7z" fill="#ffb347" ${L(K, 2.5)}/><circle cx="43" cy="43" r="14" fill="#ffb347" ${L()}/>
    <ellipse cx="38" cy="42" rx="2" ry="2.6" fill="${K}"/><ellipse cx="48" cy="42" rx="2" ry="2.6" fill="${K}"/><path d="M41.5 47h3l-1.5 2z" fill="#ff6f9f"/>`,
  'ui-close':`<path d="M18 18l28 28M46 18L18 46" ${L(K, 8)}/>`,
  // mutatóujj a kéz SZÉLÉN, mellette behajlított ujjak és a hüvelykujj (így nem olvasható félre)
  'ui-point': `<rect x="17" y="29" width="34" height="29" rx="11" fill="#ffd9b8" ${L()}/>
    <path d="M30 31.5a5 5 0 0 1 10 0M40 32a5 5 0 0 1 10 1" fill="none" ${L(K, 2.5)}/>
    <path d="M17 40V10a6 6 0 0 1 12 0v30" fill="#ffd9b8" ${L()}/>
    <path d="M23 44c-7-3-13 0-12 5 1 4 8 6 15 3" fill="#ffd9b8" ${L()}/>`,
  'ui-none': `<circle cx="32" cy="32" r="21" fill="#fff" ${L('#b9a8d9', 5)}/><path d="M17 47L47 17" ${L('#b9a8d9', 5)}/>`,
  'ui-trophy': `<path d="M18 9h28v14a14 14 0 0 1-28 0z" fill="#ffcf3f" ${L()}/><path d="M18 14H9c0 9 4 13 10 14M46 14h9c0 9-4 13-10 14" fill="none" ${L()}/>
    <path d="M28 37h8v9h-8z" fill="#ffb020" ${L()}/><rect x="19" y="46" width="26" height="10" rx="3" fill="#8e5be8" ${L()}/>${shine(25, 17, 2.5, 5, 10)}`,
  'ui-comb': `<rect x="8" y="14" width="48" height="14" rx="6" fill="#ff8fc8" ${L()}/><path d="${Array.from({ length: 8 }, (_, i) => `M${13 + i * 5.4} 28v20`).join('')}" ${L(K, 3.2)}/>`,
  'ui-hand': `<path d="M20 56c-6-6-10-13-12-20-1-4 3-6 6-3l6 7V14a4 4 0 0 1 8 0v16-20a4 4 0 0 1 8 0v20-16a4 4 0 0 1 8 0v18-12a4 4 0 0 1 8 0v20c0 10-4 16-8 20z" fill="#ffd9b8" ${L()}/>`,
  'ui-ball': `<circle cx="32" cy="32" r="24" fill="#fff" ${L()}/><path d="M32 22l9 7-3 11H26l-3-11z" fill="${K}"/>
    <path d="M32 22V9M41 29l12-4M38 40l7 10M26 40l-7 10M23 29l-12-4" ${L(K, 2.5)}/>`,

  // --- öltöztető: amit az emoji csak hasonlattal mutatna (minta, sörény- és szarvforma, néhány darab) ---
  'pat-spots': `<circle cx="32" cy="32" r="24" fill="#fff" ${L()}/>${[[23, 24, 5], [41, 22, 4], [34, 38, 5.5], [20, 41, 3.5], [45, 42, 3.5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#c9b3f5"/>`).join('')}`,
  'pat-stripes': `<circle cx="32" cy="32" r="24" fill="#fff" ${L()}/>${[[18, 14, 36], [28, 9, 46], [38, 9, 46], [48, 14, 36]].map(([x, y, h]) => `<rect x="${x - 3}" y="${y}" width="6" height="${h}" rx="3" fill="#c9b3f5"/>`).join('')}`,
  'pat-stars': `<circle cx="32" cy="32" r="24" fill="#fff" ${L()}/><path d="${starPath(23, 26, 8)}" fill="#ffcf3f" ${L(K, 1.8)}/><path d="${starPath(41, 38, 9)}" fill="#ffcf3f" ${L(K, 1.8)}/>`,
  'pat-hearts': `<circle cx="32" cy="32" r="24" fill="#fff" ${L()}/><path d="${heartPath(23, 22, 0.7)}" fill="#ff5d8f"/><path d="${heartPath(41, 34, 0.8)}" fill="#ff5d8f"/>`,
  'mane-wave': `<path d="M18 6c-9 11 9 17 0 28s9 18 0 26M32 6c-9 11 9 17 0 28s9 18 0 26M46 6c-9 11 9 17 0 28s9 18 0 26" fill="none" ${L('#ff5d8f', 6)}/>`,
  'mane-braid': `${[0, 1, 2, 3, 4].map(i => `<ellipse cx="${i % 2 ? 36 : 28}" cy="${10 + i * 10.5}" rx="9" ry="7" transform="rotate(${i % 2 ? 30 : -30} ${i % 2 ? 36 : 28} ${10 + i * 10.5})" fill="#ff5d8f" ${L(K, 2.5)}/>`).join('')}`,
  'mane-wild': `<path d="M14 6l8 14-8 8 10 10-6 10 6 12M32 4l6 14-8 10 10 10-8 10 4 12M50 6l-6 14 8 8-10 10 6 10-4 12" fill="none" ${L('#ff5d8f', 5)}/>`,
  'mane-curl': `${[[20, 18], [44, 18], [32, 34], [18, 48], [46, 48]].map(([x, y]) => `<path d="M${x} ${y}m-9 0a9 9 0 1 1 9 9 5.5 5.5 0 1 1 5.5-5.5 2.5 2.5 0 1 1-2.5-2.5" fill="none" ${L('#ff5d8f', 3.5)}/>`).join('')}`,
  'horn-straight': `<path d="M32 4l12 53H20z" fill="#ffcf3f" ${L()}/>${shine(29, 32, 2, 9, 12)}`,
  'horn-spiral': `<path d="M32 4l12 53H20z" fill="#ffcf3f" ${L()}/><path d="M23 45l18-5M26 32l12-4M29 20l6-2" ${L(K, 2.5)}/>`,
  'head-wizard': `<path d="M32 4L18 46h28z" fill="#8e5be8" ${L()}/><ellipse cx="32" cy="48" rx="24" ry="7" fill="#8e5be8" ${L()}/>
    <path d="${starPath(30, 26, 6)}" fill="#ffcf3f"/><circle cx="36" cy="38" r="2.5" fill="#ffcf3f"/><circle cx="27" cy="14" r="2" fill="#ffcf3f"/>`,
  'neck-necklace': `<path d="M10 14c4 22 40 22 44 0" fill="none" ${L('#ffb020', 4)}/><path d="M32 33l-8 9 8 12 8-12z" fill="#ff5d8f" ${L()}/>${shine(29, 41, 1.6, 4, 20)}`,
  // --- az öltöztető többi eleme: szivárvány (sörény, szarv), szárnyak, fejdíszek, szemek, köpeny, hátterek ---
  'rainbow': `<path d="M11 48a21 21 0 0 1 42 0" fill="none" stroke="${K}" stroke-width="21.6"/>${rainbowBands(32, 48, 28.5, 5)}${cloud(3, 57, 0.62)}${cloud(44.3, 57, 0.62)}`,
  'wing-feather': `<path d="M52 6C30 8 15 24 15 47l2 3c24-3 37-18 35-44z" fill="#efe6ff" ${L()}/><path d="M8 59L47 13" ${L(K, 3)}/>
    <path d="M22 42l-6-12M28 35l-5-14M34 28l-2-14M24 40l12 2M30 33l13 1M36 26l11-1" ${L('#c9a3ff', 2.5)}/>`,
  'wing-butterfly': `<path d="M32 30C24 12 8 8 7 18c-1 9 9 14 25 14z" fill="#ff8fc8" ${L()}/><path d="M32 30C40 12 56 8 57 18c1 9-9 14-25 14z" fill="#ff8fc8" ${L()}/>
    <path d="M32 33c-10 2-20 8-17 16 3 6 12 2 17-14z" fill="#c9a3ff" ${L()}/><path d="M32 33c10 2 20 8 17 16-3 6-12 2-17-14z" fill="#c9a3ff" ${L()}/>
    <circle cx="17" cy="19" r="3.5" fill="#fff"/><circle cx="47" cy="19" r="3.5" fill="#fff"/><path d="M31 21c-2-6-5-9-8-10M33 21c2-6 5-9 8-10" fill="none" ${L(K, 2.5)}/>
    <rect x="29.5" y="19" width="5" height="31" rx="2.5" fill="${K}"/>`,
  'wing-fairy': `<path d="M32 32C22 10 10 4 8 10c-3 9 8 20 24 22z" fill="#bfefff" ${L()}/><path d="M32 32C42 10 54 4 56 10c3 9-8 20-24 22z" fill="#bfefff" ${L()}/>
    <path d="M32 34c-8 4-14 12-12 18 2 4 9 0 12-18z" fill="#e3f8ff" ${L()}/><path d="M32 34c8 4 14 12 12 18-2 4-9 0-12-18z" fill="#e3f8ff" ${L()}/>
    <path d="M14 13c5 5 10 10 16 17M50 13c-5 5-10 10-16 17" fill="none" ${L('#7fd0ff', 2)}/>
    <path d="${starPath(12, 44, 5)}" fill="#ffcf3f" ${L(K, 1.5)}/><path d="${starPath(53, 44, 4)}" fill="#ffcf3f" ${L(K, 1.5)}/><path d="${starPath(32, 8, 4)}" fill="#ffcf3f" ${L(K, 1.5)}/>`,
  'wing-rainbow': `<path d="M7 42C7 21 25 8 54 8c-2 8-8 12-14 13 6 1 10 4 12 9-6 3-12 3-17 1 4 3 6 7 6 11-12 2-26 5-34 0z" fill="#fff" ${L()}/>
    <path d="M13 36c8-10 20-18 36-23" fill="none" ${L('#ff5d8f', 4)}/><path d="M15 40c8-7 18-12 32-13" fill="none" ${L('#ffb020', 4)}/><path d="M18 44c7-4 14-6 22-6" fill="none" ${L('#4aa8ff', 4)}/>`,
  'head-flowers': `<path d="M5 26c8 24 46 24 54 0" fill="none" ${L(K, 9)}/><path d="M5 26c8 24 46 24 54 0" fill="none" ${L('#4cc38a', 5)}/>
    <ellipse cx="22" cy="43" rx="6" ry="3.2" transform="rotate(25 22 43)" fill="#4cc38a" ${L(K, 2)}/><ellipse cx="42" cy="43" rx="6" ry="3.2" transform="rotate(-25 42 43)" fill="#4cc38a" ${L(K, 2)}/>
    ${flower(12, 34, 11, '#ff8fc8')}${flower(32, 45, 11, '#fff')}${flower(52, 34, 11, '#ff8fc8')}`,
  'head-bow': `<path d="M29 34l-9 20 7-2 4 5 4-21z" fill="#e8467a" ${L()}/><path d="M35 34l9 20-7-2-4 5-4-21z" fill="#e8467a" ${L()}/>
    <path d="M32 31L10 17c-5 2-6 24 0 28z" fill="#ff5d8f" ${L()}/><path d="M32 31L54 17c5 2 6 24 0 28z" fill="#ff5d8f" ${L()}/>
    <path d="M14 25c4 1 8 3 11 5M50 25c-4 1-8 3-11 5" fill="none" ${L('#fff', 2.5)}/><rect x="25.5" y="24.5" width="13" height="14" rx="4.5" fill="#ff8fc8" ${L()}/>`,
  'eyes-normal': `<path d="M6 34C16 20 48 20 58 34 48 48 16 48 6 34z" fill="#fff" ${L()}/><circle cx="32" cy="34" r="10" fill="#8e5be8" ${L(K, 2.5)}/>
    <circle cx="32" cy="34" r="5" fill="${K}"/><circle cx="35.5" cy="30.5" r="2.6" fill="#fff"/><path d="M15 23l-3-6M24 19l-1-7M40 19l1-7M49 23l3-6" ${L(K, 3)}/>`,
  'eyes-glasses': `<path d="M5 25h54" ${L(K, 4)}/><path d="M7 25h21v6c0 8-5 12-10.5 12S7 39 7 31z" fill="${K}" ${L()}/><path d="M36 25h21v6c0 8-5 12-10.5 12S36 39 36 31z" fill="${K}" ${L()}/>
    ${shine(13, 31, 2.2, 4.5, 30)}${shine(42, 31, 2.2, 4.5, 30)}`,
  'eyes-hearts': `<path d="${heartPath(19, 33, 1.05)}" fill="#ff5d8f" ${L()}/><path d="${heartPath(45, 33, 1.05)}" fill="#ff5d8f" ${L()}/>${shine(14, 28, 2, 3.5, -30)}${shine(40, 28, 2, 3.5, -30)}`,
  'neck-cape': `<path d="M19 10h26l13 44c-10 5-42 5-52 0z" fill="#e8467a" ${L()}/><path d="M27 18l-6 35M37 18l6 35" fill="none" ${L('#b83560', 2.5)}/>
    <path d="M17 10c5 7 25 7 30 0" fill="#ff8fc8" ${L()}/><circle cx="32" cy="15" r="4.5" fill="#ffcf3f" ${L(K, 2.5)}/>`,
  'bg-night': scene('#3d4f9e', `<circle cx="40" cy="27" r="10" fill="#ffe14d"/><circle cx="45" cy="23" r="9" fill="#3d4f9e"/>
    <path d="${starPath(17, 21, 4.5)}" fill="#fff"/><path d="${starPath(25, 41, 3.5)}" fill="#ffe14d"/><path d="${starPath(49, 45, 3)}" fill="#fff"/><circle cx="14" cy="45" r="1.6" fill="#fff"/><circle cx="31" cy="18" r="1.4" fill="#fff"/>`),
  'bg-clouds': scene('#bfefff', `<circle cx="48" cy="19" r="4.5" fill="#ffe14d" ${L(K, 2)}/>${cloud(10, 32, 0.9)}${cloud(25, 49, 0.92)}`),
  'bg-sea': scene('#bfefff', `<circle cx="44" cy="22" r="6" fill="#ffe14d" ${L(K, 2.5)}/><path d="M6 36c5-4 9-4 13 0s9 4 13 0 9-4 13 0 9 4 13 0v12a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6z" fill="#4aa8ff"/>
    <path d="M12 44c4-3 7-3 10 0M30 47c4-3 7-3 10 0" fill="none" ${L('#fff', 2.5)}/>`),
  'bg-castle': scene('#bfefff', `<path d="M6 46h52v2a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6z" fill="#6fcf73"/>
    <rect x="23" y="29" width="18" height="21" fill="#ffc9e4" ${L(K, 2.5)}/><rect x="15" y="24" width="9" height="26" fill="#ffc9e4" ${L(K, 2.5)}/><rect x="40" y="24" width="9" height="26" fill="#ffc9e4" ${L(K, 2.5)}/>
    <path d="M13.5 25l6-11 6 11zM38.5 25l6-11 6 11z" fill="#8e5be8" ${L(K, 2.5)}/><path d="M28 50v-7a4 4 0 0 1 8 0v7z" fill="#8e5be8" ${L(K, 2)}/><path d="M23 29v-4h4v4M30 29v-4h4v4M37 29v-4h4v4" fill="#ffc9e4" ${L(K, 2)}/>`),
  'neck-pearls': `${Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (0.08 + i * 0.105); return `<circle cx="${(32 - Math.cos(a) * 24).toFixed(1)}" cy="${(12 + Math.sin(a) * 30).toFixed(1)}" r="5.2" fill="#fff" ${L(K, 2.2)}/>`; }).join('')}`,
};

// Az öltöztető elemeinek saját ikonja ("csoport:elem"). A színek színes körként jelennek meg, a matricák a saját rajzukkal (avatar-svg.js).
export const DRESS_ICON = {
  'pattern:none': 'ui-none', 'pattern:spots': 'pat-spots', 'pattern:stripes': 'pat-stripes', 'pattern:stars': 'pat-stars', 'pattern:hearts': 'pat-hearts',
  'manestyle:wave': 'mane-wave', 'manestyle:braid': 'mane-braid', 'manestyle:wild': 'mane-wild', 'manestyle:curl': 'mane-curl',
  'hornstyle:straight': 'horn-straight', 'hornstyle:spiral': 'horn-spiral',
  'wing:none': 'ui-none', 'head:none': 'ui-none', 'head:crown': 'g-dressup', 'head:wizard': 'head-wizard',
  'neck:none': 'ui-none', 'neck:necklace': 'neck-necklace', 'neck:pearls': 'neck-pearls',
  'mane:rainbow': 'rainbow', 'horn:rainbow': 'rainbow',
  'wing:feather': 'wing-feather', 'wing:butterfly': 'wing-butterfly', 'wing:fairy': 'wing-fairy', 'wing:rainbow': 'wing-rainbow',
  'head:flowers': 'head-flowers', 'head:bow': 'head-bow',
  'eyes:normal': 'eyes-normal', 'eyes:glasses': 'eyes-glasses', 'eyes:hearts': 'eyes-hearts',
  'neck:scarf': 'tab-nyak', 'neck:cape': 'neck-cape',
  'bg:garden': 'tab-hatter', 'bg:night': 'bg-night', 'bg:clouds': 'bg-clouds', 'bg:sea': 'bg-sea', 'bg:castle': 'bg-castle',
};

// Egy ikon beágyazható SVG-ként (1em × 1em, a betűmérethez igazodik). Ismeretlen névre üres szöveg.
export const icon = (id, cls = '') => ICONS[id] ? `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true" focusable="false">${ICONS[id]}</svg>` : '';
