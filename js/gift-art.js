// Az új ajándékok rajzai (64 × 64-es rács, a js/icons.js stílusában: tinta-kontúr, pasztell kitöltés, fehér csillanás).
// Csak a rajz belseje van itt (az <svg> keret nélkül): a js/gifts.js ebből készíti az ajándék képét, a js/icons.js
// ugyanezt adja az öltöztető gombjaihoz ("gift-<azonosító>"). Nincs benne böngésző-kód, azonosító és külső hivatkozás.
const K = '#3b2a63';
const L = (c = K, w = 3) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const f1 = n => n.toFixed(1);
export const starD = (cx, cy, r, k = 0.45) => 'M' + Array.from({ length: 10 }, (_, i) => { const rr = i % 2 ? r * k : r, a = -Math.PI / 2 + i * Math.PI / 5; return `${f1(cx + Math.cos(a) * rr)} ${f1(cy + Math.sin(a) * rr)}`; }).join('L') + 'Z';
export const heartD = (x, y, s) => `M${f1(x)} ${f1(y + 9 * s)}c${f1(-7 * s)} ${f1(-5 * s)} ${f1(-11 * s)} ${f1(-9 * s)} ${f1(-11 * s)} ${f1(-13 * s)}a${f1(5.5 * s)} ${f1(5.5 * s)} 0 0 1 ${f1(11 * s)} ${f1(-3 * s)}a${f1(5.5 * s)} ${f1(5.5 * s)} 0 0 1 ${f1(11 * s)} ${f1(3 * s)}c0 ${f1(4 * s)} ${f1(-4 * s)} ${f1(8 * s)} ${f1(-11 * s)} ${f1(13 * s)}z`;
const star = (cx, cy, r, c = '#ffcf3f', w = 2.5) => `<path d="${starD(cx, cy, r)}" fill="${c}" ${L(K, w)}/>`;
const heart = (x, y, s, c = '#ff5d8f', w = 2.5) => `<path d="${heartD(x, y, s)}" fill="${c}" ${L(K, w)}/>`;
const bubble = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#dff6ff" ${L('#4aa8ff', 2.5)}/><ellipse cx="${f1(x - r * 0.35)}" cy="${f1(y - r * 0.35)}" rx="${f1(r * 0.3)}" ry="${f1(r * 0.18)}" transform="rotate(-35 ${f1(x - r * 0.35)} ${f1(y - r * 0.35)})" fill="#fff"/>`;
const RB = ['#ff5d8f', '#ffb020', '#ffe14d', '#4cc38a', '#4aa8ff'];
// varázsnyom: egy kis patkónyom-sor, amiből a nyom kiindul
const hoof = (x, y) => `<path d="M${x - 5} ${y + 4}a5 5 0 1 1 10 0" fill="none" ${L(K, 3)}/>`;
const scene = (bg, inner) => `<rect x="6" y="10" width="52" height="44" rx="6" fill="${bg}"/>${inner}<rect x="6" y="10" width="52" height="44" rx="6" fill="none" ${L()}/>`;

export const ART = {
  // --- öltöztető: új ruhadarabok ---
  'tail:ribbon': `<path d="M14 8c-6 14 10 22 2 36s6 14 14 12" fill="none" stroke="#ff8fc8" stroke-width="12" stroke-linecap="round"/><path d="M14 8c-6 14 10 22 2 36s6 14 14 12" fill="none" ${L(K, 2.5)}/>
    <path d="M30 30l-12-9v18zM30 30l12-9v18z" fill="#8e5be8" ${L(K, 2.5)}/><circle cx="30" cy="30" r="4.5" fill="#c9a3ff" ${L(K, 2)}/>${star(48, 48, 9)}${star(50, 14, 6)}`,
  'feet:shoes': `<path d="M8 40c0-8 5-14 12-14h4c3 0 4 4 6 7l6 7c2 3 0 8-4 8H12c-3 0-4-3-4-8z" fill="#ff8fc8" ${L()}/><path d="M8 44h30" ${L(K, 2.5)}/>
    <path d="M32 32c0-8 5-14 12-14h4c3 0 4 4 6 7l2 3c2 3 0 8-4 8H36c-3 0-4-1-4-4z" fill="#ffb3d6" ${L()}/><circle cx="21" cy="30" r="3.4" fill="#ffcf3f" ${L(K, 2)}/><circle cx="45" cy="22" r="3.4" fill="#ffcf3f" ${L(K, 2)}/>`,
  'back:saddle': `<path d="M6 34c8-4 16-6 26-6s18 2 26 6c-2 10-12 16-26 16S8 44 6 34z" fill="#c98a52" ${L()}/><path d="M14 30c2-8 9-12 18-12s16 4 18 12" fill="#e7b07a" ${L()}/>
    ${[[18, 40, '#ff8fc8'], [32, 44, '#ffcf3f'], [46, 40, '#8e5be8']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="5" fill="${c}" ${L(K, 2)}/><circle cx="${x}" cy="${y}" r="1.8" fill="#fff"/>`).join('')}`,
  'pattern:sparkle': `<circle cx="32" cy="32" r="24" fill="#f4eeff" ${L()}/>${[[22, 24, 7], [40, 20, 5], [42, 40, 8], [24, 44, 5], [32, 32, 3.5]].map(([x, y, r]) => `<path d="M${x} ${y - r}l${f1(r * 0.3)} ${f1(r * 0.7)} ${f1(r * 0.7)} ${f1(r * 0.3)} ${f1(-r * 0.7)} ${f1(r * 0.3)} ${f1(-r * 0.3)} ${f1(r * 0.7)} ${f1(-r * 0.3)} ${f1(-r * 0.7)} ${f1(-r * 0.7)} ${f1(-r * 0.3)} ${f1(r * 0.7)} ${f1(-r * 0.3)}z" fill="#c9a3ff" ${L('#8e5be8', 1.8)}/>`).join('')}`,
  'neck:lilacape': `<path d="M12 14c12 6 28 6 40 0l4 40c-14 6-34 6-48 0z" fill="#a77bf0" ${L()}/><path d="M12 14c12 6 28 6 40 0" fill="none" stroke="#ffcf3f" stroke-width="5"/><path d="M12 14c12 6 28 6 40 0" fill="none" ${L(K, 2)}/>
    <circle cx="32" cy="19" r="4.5" fill="#ffcf3f" ${L(K, 2)}/>${star(24, 38, 5, '#fff', 1.8)}${star(41, 44, 4, '#fff', 1.8)}`,
  'head:tiara': `<path d="M8 46c6-6 14-9 24-9s18 3 24 9" fill="none" stroke="#d8dcef" stroke-width="7" stroke-linecap="round"/><path d="M8 46c6-6 14-9 24-9s18 3 24 9" fill="none" ${L(K, 2)}/>
    <path d="M18 40l4-14 6 10 4-20 4 20 6-10 4 14" fill="#eef1ff" ${L()}/><path d="M32 18l3 5-3 5-3-5z" fill="#ff8fc8" ${L(K, 1.8)}/><circle cx="22" cy="31" r="2.6" fill="#4aa8ff" ${L(K, 1.5)}/><circle cx="42" cy="31" r="2.6" fill="#4aa8ff" ${L(K, 1.5)}/>`,
  // --- varázsnyomok: a patanyom mögött a nyom ---
  'trail:stars': `${hoof(10, 52)}${star(22, 42, 6)}${star(36, 30, 8)}${star(50, 16, 10)}`,
  'trail:hearts': `${hoof(10, 52)}${heart(22, 38, 0.55)}${heart(36, 25, 0.75)}${heart(50, 10, 0.95)}`,
  'trail:rainbow': `${hoof(10, 54)}${RB.map((c, i) => `<path d="M14 ${46 - i * 4}C26 ${42 - i * 4} 36 ${24 - i * 4} 56 ${14 - i * 4}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`).join('')}`,
  'trail:bubbles': `${hoof(10, 52)}${bubble(22, 40, 6)}${bubble(37, 28, 8)}${bubble(51, 14, 9)}`,
  // --- játékok kinézete ---
  'track:sunset': scene('#ffb37a', `<circle cx="32" cy="38" r="12" fill="#ffe14d" ${L(K, 2.5)}/><path d="M6 40h52v8a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6z" fill="#ff8f6b"/><path d="M24 54l6-14h4l6 14z" fill="#ffd6ea" ${L(K, 2)}/>`),
  'track:night': scene('#2b1a6b', `${star(16, 20, 4, '#fff7b0', 1.5)}${star(46, 18, 3, '#fff7b0', 1.5)}${star(32, 26, 3, '#fff7b0', 1.5)}<circle cx="48" cy="30" r="6" fill="#fff3c4" ${L(K, 2)}/><path d="M24 54l6-16h4l6 16z" fill="#8e7be8" ${L(K, 2)}/>`),
  'track:candy': scene('#ffe0f0', `<circle cx="16" cy="26" r="6" fill="#fff" ${L(K, 2)}/><path d="M12 22l8 8M16 20v12" stroke="#ff5d8f" stroke-width="2.5"/><path d="M42 16v14" ${L(K, 3)}/><circle cx="42" cy="16" r="6" fill="#8fd6ff" ${L(K, 2)}/>
    <path d="M24 54l6-16h4l6 16z" fill="#fff" ${L(K, 2)}/><path d="M26 48h12M28 43h8" stroke="#ff5d8f" stroke-width="3"/>`),
  'bubble:hearts': `${heart(24, 10, 1.4, '#ffd6ea')}${heart(46, 34, 0.9, '#ffd6ea')}<ellipse cx="17" cy="20" rx="4" ry="2.5" transform="rotate(-35 17 20)" fill="#fff"/>`,
  'bubble:stars': `${star(24, 26, 18, '#fff3b0')}${star(48, 46, 10, '#fff3b0')}<ellipse cx="18" cy="20" rx="3.5" ry="2" transform="rotate(-35 18 20)" fill="#fff"/>`,
  // --- díszek a játékokban ---
  'deco:balloons': `<path d="M20 34c2 10-2 16 2 26M34 30c0 12 4 18 0 30M46 36c-2 10 4 14 0 24" fill="none" ${L(K, 2)}/>
    <ellipse cx="20" cy="22" rx="10" ry="12" fill="#ff5d8f" ${L()}/><ellipse cx="34" cy="17" rx="10" ry="12" fill="#ffcf3f" ${L()}/><ellipse cx="47" cy="25" rx="10" ry="12" fill="#4aa8ff" ${L()}/>
    <ellipse cx="17" cy="17" rx="2.5" ry="4" fill="#fff" opacity=".7"/><ellipse cx="31" cy="12" rx="2.5" ry="4" fill="#fff" opacity=".7"/><ellipse cx="44" cy="20" rx="2.5" ry="4" fill="#fff" opacity=".7"/>`,
  'deco:lantern': `<path d="M32 4v6" ${L()}/><path d="M24 10h16l-2 6H26z" fill="#8e5be8" ${L()}/><path d="M22 16h20l2 30H20z" fill="#ffe9a0" ${L()}/><path d="M28 24h8v16h-8z" fill="#ffb020" ${L(K, 2)}/>
    <path d="M32 26c3 4 3 8 0 11-3-3-3-7 0-11z" fill="#fff"/><path d="M18 46h28l-2 8H20z" fill="#8e5be8" ${L()}/>`,
  'deco:toys': `<circle cx="22" cy="40" r="15" fill="#ff5d8f" ${L()}/><path d="M7.5 38c10 4 20 4 29 0M22 25c-4 10-4 20 0 30" fill="none" ${L('#fff', 3)}/>
    <path d="M38 20c6-4 14-4 18 0 2 6 2 12 0 18-4 4-12 4-18 0-2-6-2-12 0-18z" fill="#c9a3ff" ${L()}/><circle cx="47" cy="29" r="3.5" fill="#ffcf3f" ${L(K, 2)}/>`,
  // --- tarisznya: elhasználható meglepetések ---
  'fogy:falat': `<path d="M10 40c0-12 10-20 22-20s22 8 22 20z" fill="#ffd27a" ${L()}/><path d="M8 40h48v4c0 6-4 10-10 10H18c-6 0-10-4-10-10z" fill="#ffb3d6" ${L()}/>
    <circle cx="22" cy="30" r="3" fill="#ff5d8f"/><circle cx="34" cy="26" r="3" fill="#4cc38a"/><circle cx="44" cy="32" r="3" fill="#4aa8ff"/>${heart(32, 4, 0.7)}`,
  'fogy:varazspor': `<path d="M22 22h20v6c6 4 8 10 8 16 0 8-6 12-18 12s-18-4-18-12c0-6 2-12 8-16z" fill="#e6d6ff" ${L()}/><path d="M22 18h20v6H22z" fill="#ff8fc8" ${L()}/>
    ${RB.map((c, i) => `<circle cx="${22 + i * 5}" cy="${44 + (i % 2) * 4}" r="2.6" fill="${c}"/>`).join('')}${star(50, 12, 6)}${star(14, 10, 4)}`,
  'fogy:tuzijatek': `${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<path d="M${f1(32 + Math.cos(a) * 7)} ${f1(24 + Math.sin(a) * 7)}L${f1(32 + Math.cos(a) * 18)} ${f1(24 + Math.sin(a) * 18)}" stroke="${RB[i % 5]}" stroke-width="4" stroke-linecap="round"/>`; }).join('')}
    <circle cx="32" cy="24" r="4" fill="#fff" ${L(K, 2)}/><path d="M28 46h8l-1 14h-6z" fill="#ff5d8f" ${L(K, 2.5)}/><path d="M32 46v-6" ${L(K, 2)}/>`,
};

// Az öltöztető új fülei és alapelemei (ezek nem ajándékok, kezdettől szabadok)
export const TAB_ART = {
  'tab-kieg': `<path d="M6 30c8-4 16-6 26-6s18 2 26 6c-2 10-12 16-26 16S8 40 6 30z" fill="#e7b07a" ${L()}/><circle cx="32" cy="36" r="5" fill="#ff8fc8" ${L(K, 2)}/><path d="M14 52h12M38 52h12" ${L(K, 4)}/>`,
  'tab-varazs': `${hoof(10, 52)}${star(24, 38, 7)}${star(44, 20, 11, '#ff8fc8')}`,
  'tab-jatek': `<path d="M8 52l14-36h20l14 36z" fill="#f4eeff" ${L()}/><path d="M32 18v6M32 30v6M32 42v8" ${L('#8e5be8', 3)}/><path d="M10 14v-8l10 4z" fill="#ff5d8f" ${L(K, 2)}/>`,
  'track-clouds': scene('#bfefff', `<ellipse cx="18" cy="24" rx="8" ry="4" fill="#fff"/><ellipse cx="46" cy="20" rx="7" ry="3.5" fill="#fff"/><path d="M24 54l6-16h4l6 16z" fill="#f4eeff" ${L(K, 2)}/>`),
  'bubble-round': `${bubble(26, 26, 16)}${bubble(46, 46, 9)}`,
};
