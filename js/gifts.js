// Ajándékok: egyetlen, rögzített sorrendű ajándéklétra. Minden játék és minden 20. csillag ebből ad.
// Nincs benne böngésző-kód, így a Node-tesztek is beolvassák. A logika a js/economy.js-ben van.
//   kind: 'dress' = az öltöztető eleme (id = "csoport:elem", ahogy az öltöztető nevezi);  'garden' = kerti dísz
//   nom: a neve (alanyeset), acc: tárgyesettel, névelővel, kézzel kiírva ("egy lámpást") – a gép nem ragoz
//   icon: saját rajz (SVG, 64×64), sziluettként is jól felismerhető
//   spot: a kerti dísz helye [kertrész, x, z, forgatás, méret?] – a tópart és a tanya szabad zugaiban (js/decor3d.js építi meg)

const svg = body => `<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true">${body}</svg>`;
const RB = ['#ff5d5d', '#ffb020', '#ffe14d', '#4cc38a', '#4a7dff', '#8e5be8'];

export const CATALOG = [
  // --- az öltöztető tíz eleme (a régi sorrendben: a régi mentésekből ezek közül az első N már megvan) ---
  { id: 'head:crown', kind: 'dress', nom: 'ragyogó korona', acc: 'egy ragyogó koronát',
    icon: svg('<path d="M8 50 L6 18 L20 32 L32 10 L44 32 L58 18 L56 50Z" fill="#ffd24d" stroke="#c98a00" stroke-width="3" stroke-linejoin="round"/><rect x="8" y="46" width="48" height="8" rx="3" fill="#ffbf1f" stroke="#c98a00" stroke-width="3"/><circle cx="32" cy="36" r="5" fill="#ff5d8f"/><circle cx="18" cy="40" r="3.5" fill="#4aa8ff"/><circle cx="46" cy="40" r="3.5" fill="#4cc38a"/>') },
  { id: 'wing:rainbow', kind: 'dress', nom: 'szivárványszárny', acc: 'egy szivárványszárnyat',
    icon: svg(RB.slice(0, 5).map((c, i) => `<path d="M${54 - i * 3} 54 C${50 - i * 6} ${30 - i * 4} ${30 - i * 4} ${10 + i * 3} ${8 + i * 5} ${12 + i * 4}" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`).join('')) },
  { id: 'bg:castle', kind: 'dress', nom: 'felhővár háttér', acc: 'egy felhővár hátteret',
    icon: svg('<rect x="6" y="28" width="14" height="26" fill="#ffd6ea" stroke="#b9a0e8" stroke-width="2.5"/><rect x="25" y="18" width="14" height="36" fill="#e6d6ff" stroke="#b9a0e8" stroke-width="2.5"/><rect x="44" y="28" width="14" height="26" fill="#ffd6ea" stroke="#b9a0e8" stroke-width="2.5"/><path d="M4 28 L13 12 L22 28Z M23 18 L32 2 L41 18Z M42 28 L51 12 L60 28Z" fill="#8e5be8"/><rect x="29" y="38" width="6" height="10" rx="3" fill="#ffd24d"/><ellipse cx="32" cy="58" rx="30" ry="6" fill="#fff" stroke="#d6e6ff" stroke-width="2"/>') },
  { id: 'horn:rainbow', kind: 'dress', nom: 'szivárványszarv', acc: 'egy szivárványszarvat',
    icon: svg('<defs><linearGradient id="gh" x1="0" y1="1" x2="0" y2="0">' + RB.map((c, i) => `<stop offset="${i / 5}" stop-color="${c}"/>`).join('') + '</linearGradient></defs><path d="M20 58 L32 4 L44 58Z" fill="url(#gh)" stroke="#3b2a63" stroke-width="3" stroke-linejoin="round"/><path d="M24 46 L41 40 M27 32 L38 28 M29 20 L36 17" stroke="#3b2a63" stroke-width="2.5" stroke-linecap="round"/>') },
  { id: 'neck:cape', kind: 'dress', nom: 'varázsköpeny', acc: 'egy varázsköpenyt',
    icon: svg('<path d="M20 8 Q32 16 44 8 L58 56 Q32 48 6 56Z" fill="#c53b6e" stroke="#7a1f45" stroke-width="3" stroke-linejoin="round"/><path d="M20 8 Q32 16 44 8" fill="none" stroke="#ffd24d" stroke-width="5" stroke-linecap="round"/><circle cx="32" cy="14" r="4" fill="#ffd24d"/>') },
  { id: 'wing:fairy', kind: 'dress', nom: 'tündérszárny', acc: 'egy tündérszárnyat',
    icon: svg('<g fill="#bfefff" fill-opacity=".8" stroke="#3aa3e0" stroke-width="3"><path d="M30 32 C10 2 2 20 8 34 C14 42 24 38 30 32Z"/><path d="M34 32 C54 2 62 20 56 34 C50 42 40 38 34 32Z"/><path d="M30 34 C16 44 12 58 22 58 C28 56 30 46 30 34Z"/><path d="M34 34 C48 44 52 58 42 58 C36 56 34 46 34 34Z"/></g>') },
  { id: 'head:wizard', kind: 'dress', nom: 'varázssüveg', acc: 'egy varázssüveget',
    icon: svg('<path d="M14 50 L34 4 L50 50Z" fill="#6a3fc0" stroke="#3b2a63" stroke-width="3" stroke-linejoin="round"/><ellipse cx="32" cy="51" rx="28" ry="7" fill="#5a2fb0" stroke="#3b2a63" stroke-width="3"/><path d="M32 22 l2.4 5 5.4.6-4 3.7 1.1 5.3-4.9-2.7-4.9 2.7 1.1-5.3-4-3.7 5.4-.6z" fill="#ffe14d"/>') },
  { id: 'mane:rainbow', kind: 'dress', nom: 'szivárványsörény', acc: 'egy szivárványsörényt',
    icon: svg(RB.map((c, i) => `<path d="M${10 + i * 8} 8 q8 12 0 24 q-8 12 0 24" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`).join('')) },
  { id: 'bg:sea', kind: 'dress', nom: 'tengerparti háttér', acc: 'egy tengerparti hátteret',
    icon: svg('<rect x="2" y="2" width="60" height="60" rx="10" fill="#bfefff"/><circle cx="18" cy="18" r="9" fill="#ffe14d"/><path d="M2 38 q8-6 15 0 t15 0 t15 0 t15 0 V62 H2Z" fill="#7fd6ff"/><path d="M2 48 q8-6 15 0 t15 0 t15 0 t15 0 V62 H2Z" fill="#3aa3e0"/>') },
  { id: 'neck:pearls', kind: 'dress', nom: 'gyöngysor', acc: 'egy gyöngysort',
    icon: svg([[10, 16], [14, 28], [21, 38], [32, 42], [43, 38], [50, 28], [54, 16]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#fff" stroke="#b9a0e8" stroke-width="2.5"/>`).join('') + '<circle cx="32" cy="52" r="7" fill="#ffd6ea" stroke="#ff8fc8" stroke-width="2.5"/>') },

  // --- kerti díszek (tópart és tanya); a helyükön senki nem lakik, és nem takarnak el barátot ---
  { id: 'garden:lampas', kind: 'garden', nom: 'lámpás', acc: 'egy lámpást', spot: ['to', -12.75, -4.0, 0.2],
    icon: svg('<rect x="29" y="22" width="6" height="38" fill="#3b2a63"/><rect x="18" y="58" width="28" height="4" rx="2" fill="#3b2a63"/><path d="M20 6 h24 l-4 6 h-16z" fill="#3b2a63"/><rect x="22" y="12" width="20" height="16" rx="3" fill="#ffe680" stroke="#3b2a63" stroke-width="3"/><circle cx="32" cy="20" r="4" fill="#ffb020"/>') },
  { id: 'garden:pad', kind: 'garden', nom: 'kerti pad', acc: 'egy kerti padot', spot: ['to', -18.75, -4.0, 0.35],
    icon: svg('<rect x="6" y="18" width="52" height="7" rx="2" fill="#e6bb82" stroke="#9a6a3a" stroke-width="2"/><rect x="6" y="28" width="52" height="7" rx="2" fill="#e6bb82" stroke="#9a6a3a" stroke-width="2"/><rect x="4" y="38" width="56" height="7" rx="2" fill="#e6bb82" stroke="#9a6a3a" stroke-width="2"/><path d="M10 45 v14 M54 45 v14 M10 25 v13 M54 25 v13" stroke="#9a6a3a" stroke-width="5" stroke-linecap="round"/>') },
  { id: 'garden:hinta', kind: 'garden', nom: 'hinta', acc: 'egy hintát', spot: ['tanya', 18.75, -6.25, 0],
    icon: svg('<path d="M6 60 L16 6 L48 6 L58 60" fill="none" stroke="#9a6a3a" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><path d="M24 8 V44 M40 8 V44" stroke="#3b2a63" stroke-width="2.5"/><rect x="20" y="42" width="24" height="6" rx="2" fill="#ff8fc8" stroke="#c53b6e" stroke-width="2"/>') },
  { id: 'garden:odu', kind: 'garden', nom: 'madárodú', acc: 'egy madárodút', spot: ['to', -20.25, -6.0, 0.3],
    icon: svg('<rect x="29" y="40" width="6" height="22" fill="#9a6a3a"/><rect x="16" y="20" width="32" height="24" rx="2" fill="#e6bb82" stroke="#9a6a3a" stroke-width="2.5"/><path d="M10 22 L32 4 L54 22Z" fill="#f2545b" stroke="#a83a3f" stroke-width="2.5" stroke-linejoin="round"/><circle cx="32" cy="31" r="5.5" fill="#3b2a63"/>') },
  { id: 'garden:kapu', kind: 'garden', nom: 'virágkapu', acc: 'egy virágkaput', spot: ['to', -17.75, -7.0, 0],
    icon: svg('<path d="M10 60 V28 A22 22 0 0 1 54 28 V60" fill="none" stroke="#58b85c" stroke-width="6" stroke-linecap="round"/>' + [[10, 40, '#ff8fc8'], [12, 22, '#ffcf3f'], [22, 10, '#8e5be8'], [32, 7, '#ff8fc8'], [42, 10, '#ffcf3f'], [52, 22, '#8e5be8'], [54, 40, '#ff8fc8']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="6" fill="${c}"/><circle cx="${x}" cy="${y}" r="2" fill="#fff"/>`).join('')) },
  { id: 'garden:szelforgo', kind: 'garden', nom: 'szélforgó', acc: 'egy szélforgót', spot: ['to', -13, -0.5, 0.2],
    icon: svg('<rect x="30" y="30" width="4" height="32" fill="#9a6a3a"/><g stroke="#3b2a63" stroke-width="2" stroke-linejoin="round"><path d="M32 30 L32 4 L46 18Z" fill="#ff5d5d"/><path d="M32 30 L58 30 L44 44Z" fill="#4a7dff"/><path d="M32 30 L32 56 L18 42Z" fill="#ffe14d"/><path d="M32 30 L6 30 L20 16Z" fill="#4cc38a"/></g><circle cx="32" cy="30" r="3" fill="#fff"/>') },
  { id: 'garden:kut', kind: 'garden', nom: 'szökőkút', acc: 'egy szökőkutat', spot: ['tanya', 21.75, -1.75, -0.3],
    icon: svg('<ellipse cx="32" cy="50" rx="28" ry="9" fill="#ece4d2" stroke="#b9ad92" stroke-width="2.5"/><ellipse cx="32" cy="48" rx="22" ry="5" fill="#7fd0ff"/><rect x="28" y="24" width="8" height="24" fill="#ece4d2" stroke="#b9ad92" stroke-width="2"/><path d="M32 24 C24 6 14 12 12 26 M32 24 C40 6 50 12 52 26 M32 24 V4" fill="none" stroke="#3aa3e0" stroke-width="3.5" stroke-linecap="round"/>') },
  { id: 'garden:gombahaz', kind: 'garden', nom: 'gombaház', acc: 'egy gombaházat', spot: ['to', -22.0, -1.5, 0.4, 0.8],
    icon: svg('<path d="M18 34 h28 v24 h-28z" fill="#fff3dc" stroke="#b9ad92" stroke-width="2.5"/><path d="M4 36 C4 10 60 10 60 36Z" fill="#f2545b" stroke="#a83a3f" stroke-width="3"/><circle cx="20" cy="24" r="4" fill="#fff"/><circle cx="36" cy="18" r="4" fill="#fff"/><circle cx="48" cy="28" r="3.5" fill="#fff"/><rect x="27" y="42" width="10" height="16" rx="5" fill="#9a6a3a"/>') },
  { id: 'garden:mehkas', kind: 'garden', nom: 'méhkas', acc: 'egy méhkast', spot: ['tanya', 15.75, -3.5, -0.3],
    icon: svg('<path d="M10 54 C6 20 58 20 54 54Z" fill="#f2c94c" stroke="#c9972a" stroke-width="3"/><path d="M12 44 h40 M14 34 h36 M20 25 h24" stroke="#c9972a" stroke-width="3"/><rect x="27" y="46" width="10" height="8" rx="4" fill="#3b2a63"/><ellipse cx="50" cy="16" rx="6" ry="4" fill="#ffe14d" stroke="#3b2a63" stroke-width="2"/><path d="M48 13 v6 M51 13 v6" stroke="#3b2a63" stroke-width="2"/>') },
  { id: 'garden:napraforgo', kind: 'garden', nom: 'napraforgók', acc: 'napraforgókat', spot: ['to', -16.0, -5.75, -0.2],
    icon: svg([[18, 22], [44, 16]].map(([x, y]) => `<path d="M${x} ${y} V62" stroke="#58b85c" stroke-width="4"/>` + Array.from({ length: 10 }, (_, k) => `<ellipse cx="${(x + Math.cos(k * 0.628) * 10).toFixed(1)}" cy="${(y + Math.sin(k * 0.628) * 10).toFixed(1)}" rx="5" ry="3" transform="rotate(${k * 36} ${(x + Math.cos(k * 0.628) * 10).toFixed(1)} ${(y + Math.sin(k * 0.628) * 10).toFixed(1)})" fill="#ffcf3f"/>`).join('') + `<circle cx="${x}" cy="${y}" r="6.5" fill="#9a6a3a"/>`).join('') + '<path d="M18 44 q-10 -6 -12 2 q8 4 12 -2z M44 40 q10 -6 12 2 q-8 4 -12 -2z" fill="#58b85c"/>') },
  { id: 'garden:posta', kind: 'garden', nom: 'postaláda', acc: 'egy postaládát', spot: ['tanya', 17.25, 2.75, 0.2],
    icon: svg('<rect x="29" y="34" width="6" height="28" fill="#9a6a3a"/><path d="M12 36 V22 a10 10 0 0 1 10 -10 H44 a10 10 0 0 1 10 10 V36Z" fill="#4aa8ff" stroke="#2a6ab0" stroke-width="3"/><path d="M44 12 a10 10 0 0 0 -10 10 V36" fill="none" stroke="#2a6ab0" stroke-width="3"/><path d="M50 18 V6 h8 v6 h-8" fill="#f2545b" stroke="#a83a3f" stroke-width="2"/>') },
  { id: 'garden:homokozo', kind: 'garden', nom: 'homokozó', acc: 'egy homokozót', spot: ['tanya', 16.0, 0.75, 0.3],
    icon: svg('<path d="M4 40 L32 30 L60 40 L32 52Z" fill="#ffe3a3" stroke="#e6bb82" stroke-width="3" stroke-linejoin="round"/><path d="M4 40 V46 L32 58 L60 46 V40 M32 52 V58" fill="none" stroke="#9a6a3a" stroke-width="3" stroke-linejoin="round"/><path d="M38 20 h12 l-2 14 h-8z" fill="#ff5d8f" stroke="#c53b6e" stroke-width="2"/><path d="M38 20 q6 -8 12 0" fill="none" stroke="#c53b6e" stroke-width="2"/><path d="M16 26 l4 12" stroke="#4aa8ff" stroke-width="4" stroke-linecap="round"/><ellipse cx="21" cy="40" rx="5" ry="3" fill="#4aa8ff"/>') },
];

// Ha a létra minden fokát megszerezte: aranyvirág nyílik a kertben (nincs üres ajándék)
export const GOLD = { id: 'gold', kind: 'gold', nom: 'aranyvirág', acc: 'egy aranyvirágot',
  icon: svg('<path d="M32 62 V34" stroke="#58b85c" stroke-width="4"/><path d="M32 50 q-12 -8 -16 0 q10 6 16 0z" fill="#58b85c"/>' + Array.from({ length: 6 }, (_, k) => `<circle cx="${(32 + Math.cos(k * 1.047) * 12).toFixed(1)}" cy="${(24 + Math.sin(k * 1.047) * 12).toFixed(1)}" r="8" fill="#ffd24d" stroke="#e0a400" stroke-width="2"/>`).join('') + '<circle cx="32" cy="24" r="7" fill="#fff3a0" stroke="#e0a400" stroke-width="2"/>') };

// A létra: a ruhák és a kerti díszek felváltva, mindig ebben a sorrendben. A régi mentésből megvan a ruhák eleje,
// így annak, akinek már minden ruhája megvan, a következő ajándék kerti dísz lesz.
export const LADDER = ['head:crown', 'garden:lampas', 'wing:rainbow', 'garden:pad', 'bg:castle', 'garden:hinta', 'horn:rainbow', 'garden:odu',
  'neck:cape', 'garden:kapu', 'wing:fairy', 'garden:szelforgo', 'head:wizard', 'garden:kut', 'mane:rainbow', 'garden:gombahaz', 'bg:sea', 'garden:mehkas',
  'neck:pearls', 'garden:napraforgo', 'garden:posta', 'garden:homokozo'];
// A régi (2.0 előtti) feloldási sorrend: a régi mentés "unlockedCount" darab eleme ebből a listából való
export const OLD_ORDER = ['head:crown', 'wing:rainbow', 'bg:castle', 'horn:rainbow', 'neck:cape', 'wing:fairy', 'head:wizard', 'mane:rainbow', 'bg:sea', 'neck:pearls'];

export const giftById = id => (id === GOLD.id ? GOLD : CATALOG.find(g => g.id === id) || null);
export const DECOR = CATALOG.filter(g => g.kind === 'garden');
