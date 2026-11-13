// Saját ikonok és betű (M5/3): minden felületi jelnek van saját rajza, a rajzok önállóak (nincs külső hivatkozás,
// azonosító vagy szöveg), és a betűfájlok a repóban vannak, licenccel.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { ICONS, DRESS_ICON, icon } from '../js/icons.js';
import { STATIONS } from '../js/curriculum.js';
import { REWARDS } from '../js/rewards/index.js';
import { TABS, GROUPS } from '../js/avatar.js';

const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');

test('minden állomásnak, jutalomjátéknak és öltöztető-fülnek saját ikonja van', () => {
  for (const st of STATIONS) assert.ok(ICONS['st-' + st.id], 'állomás: ' + st.id);
  for (const g of Object.keys(REWARDS)) assert.ok(ICONS['g-' + g], 'játék: ' + g);
  for (const t of TABS) assert.ok(ICONS['tab-' + t.id], 'fül: ' + t.id);
});

test('az öltöztető ikon-táblája létező elemekre és létező rajzokra mutat', () => {
  for (const [k, id] of Object.entries(DRESS_ICON)) {
    const [key, item] = k.split(':');
    const g = GROUPS.find(x => x.key === key);
    assert.ok(g && g.items.some(it => it.id === item), 'nincs ilyen elem: ' + k);
    assert.ok(ICONS[id], 'nincs ilyen rajz: ' + id);
  }
});

test('az öltöztető minden választható eleme saját rajzot kap (a színek színes kört, a matricák a saját matrica-rajzukat)', () => {
  for (const g of GROUPS) for (const it of g.items) {
    if (it.color || g.key === 'stickers' || g.key === 'body') continue;
    assert.ok(DRESS_ICON[g.key + ':' + it.id], 'nincs rajza: ' + g.key + ':' + it.id);
  }
});

test('a rajzok önállóak és érvényesek', () => {
  for (const [id, body] of Object.entries(ICONS)) {
    const s = icon(id);
    assert.ok(s.startsWith('<svg class="ico" viewBox="0 0 64 64"') && s.endsWith('</svg>'), id);
    assert.ok(!/undefined|NaN|null/.test(body), 'hibás szám vagy érték: ' + id);
    assert.ok(!/\bid=|href|url\(|<text|<image|<script|on\w+=/i.test(body), 'tilos elem: ' + id);
    const open = (body.match(/<(path|circle|ellipse|rect|g)\b/g) || []).length;
    const closed = (body.match(/\/>|<\/g>/g) || []).length;
    assert.equal(open, closed, 'lezáratlan elem: ' + id);
  }
  assert.equal(icon('nincs-ilyen'), '');
});

test('az index.html minden data-icon jele létező ikon, és mindegyik jutalomcsempén van', () => {
  const html = read('index.html');
  const ids = [...html.matchAll(/data-icon="([^"]+)"/g)].map(m => m[1]);
  assert.ok(ids.length >= 20);
  for (const id of ids) assert.ok(ICONS[id], 'ismeretlen ikon: ' + id);
  for (const g of [...html.matchAll(/data-game="([^"]+)"><span data-icon="([^"]+)"/g)]) assert.equal(g[2], 'g-' + g[1]);
});

test('a betű a repóban van, licenccel; a stíluslap csak helyi fájlra hivatkozik', () => {
  const css = read('style.css');
  const urls = [...css.matchAll(/url\("([^"]+)"\)/g)].map(m => m[1]);
  assert.ok(urls.length >= 2);
  for (const u of urls) {
    assert.ok(!/^https?:|^\/\//.test(u), 'külső hivatkozás: ' + u);
    const f = new URL(u, root); assert.ok(existsSync(f) && statSync(f).size > 1000, 'hiányzik: ' + u);
    assert.equal(readFileSync(f).subarray(0, 4).toString('latin1'), 'wOF2', 'nem woff2: ' + u);
  }
  assert.match(read('fonts/OFL.txt'), /SIL OPEN FONT LICENSE Version 1\.1/);
  assert.match(css, /font-family: "Nunito"/);
  assert.match(css, /unicode-range: U\+0100-02BA/, 'a latin-ext részhalmaz (ő, ű) hiányzik');
});
