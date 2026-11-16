// A mese (js/story.js): mennyiség, mondat-szabályok, a kert lakóihoz igazodás, a lépések elosztása a körön.
import test from 'node:test';
import assert from 'node:assert/strict';
import { STORIES, VALUES, storyById, activeStory, eligible, startRound, openingLine, inviteLine, beatAfter, endingLine } from '../js/story.js';
import { FRIENDS, friendsFor } from '../js/friends.js';
import { ALL_STATIONS } from '../js/curriculum.js';

const sentences = t => String(t).match(/[^.!?]+[.!?]+/g) || [];
const words = s => s.trim().split(/\s+/).filter(w => /\p{L}/u.test(w)).length;
const mentions = (text, stem) => new RegExp('(^|[^\\p{L}])' + stem, 'u').test(text);   // szó elején (a "segítsünk" nem sün)
const lines = s => [['title', s.title], ['intro', s.intro], ['end', s.end], ...s.beats.map((b, i) => ['beat' + (i + 1), b]), ...Object.entries(s.at).map(([k, v]) => ['at.' + k, v])];

// a kert lakóinak neve a mondatokban (ragozott alakokkal együtt): akit a mese említ, annak a kertben kell laknia
const STEMS = {
  cat: ['cica', 'cicá'], bunny: ['nyuszi'], dog: ['kutya', 'kutyá', 'kutyus'], fox: ['róka', 'róká'], duck: ['kacsa', 'kacsá'],
  bear: ['maci'], frog: ['béka', 'béká'], hedgehog: ['sün'], hen: ['tyúk'], panda: ['panda', 'pandá'], squirrel: ['mókus'],
  owl: ['bagoly', 'bagly'], mouse: ['egér', 'egere'], unicorn: ['unikornis'], pig: ['malac'], sheep: ['bárány'], turtle: ['teknős'],
  pony: ['póni'], cow: ['tehén', 'tehen'], kangaroo: ['kenguru'], koala: ['koala'], elephant: ['elefánt'], giraffe: ['zsiráf'],
  zebra: ['zebra', 'zebrá'], lion: ['oroszlán'], hippo: ['víziló', 'vízilov'], monkey: ['majom', 'majm'], flamingo: ['flamingó'],
};

test('legalább harminc mese, egyedi azonosítóval, mindegyik hat–tíz lépéses', () => {
  assert.ok(STORIES.length >= 30, `csak ${STORIES.length} mese`);
  const ids = STORIES.map(s => s.id);
  assert.equal(new Set(ids).size, ids.length, 'ismétlődő azonosító');
  for (const s of STORIES) {
    assert.match(s.id, /^[a-z0-9-]+$/, s.id);
    const steps = 1 + s.beats.length + 1;                       // kezdés + lépések + vége
    assert.ok(steps >= 6 && steps <= 10, `${s.id}: ${steps} lépés`);
    assert.equal(storyById(s.id), s);
  }
});

test('minden mondat rövid, kimondható: legfeljebb tizenkét szó, számjegy és emoji nélkül', () => {
  for (const s of STORIES) for (const [k, t] of lines(s)) {
    assert.equal(typeof t, 'string', `${s.id}.${k}`);
    assert.doesNotMatch(t, /[0-9]/, `${s.id}.${k}: számjegy`);
    assert.doesNotMatch(t, /\p{Extended_Pictographic}/u, `${s.id}.${k}: emoji`);
    assert.match(t, /^[A-ZÁÉÍÓÖŐÚÜŰ]/, `${s.id}.${k}: nagybetűvel kezdődik`);
    assert.match(t, /[.!?]$/, `${s.id}.${k}: írásjellel zárul`);
    const ss = sentences(t);
    assert.equal(ss.join('').replace(/\s/g, ''), t.replace(/\s/g, ''), `${s.id}.${k}: mondatokra bontható`);
    for (const x of ss) assert.ok(words(x) <= 12, `${s.id}.${k}: túl hosszú mondat (${words(x)} szó): ${x}`);
    const most = k === 'intro' || k === 'end' ? 2 : 1;            // a kezdés és a vége legfeljebb két mondat, a többi egy
    assert.ok(ss.length <= most, `${s.id}.${k}: ${ss.length} mondat`);
  }
});

test('a tanulság a kiáltvány értékeiből való; a mese csak létező barátról, létező állomásra szól', () => {
  const friendIds = FRIENDS.map(f => f.id), stIds = ALL_STATIONS.map(s => s.id);
  for (const s of STORIES) {
    assert.ok(VALUES.includes(s.value), `${s.id}: ismeretlen érték ${s.value}`);
    for (const w of s.who) assert.ok(friendIds.includes(w), `${s.id}: ismeretlen barát ${w}`);
    for (const k of Object.keys(s.at)) assert.ok(stIds.includes(k), `${s.id}: ismeretlen állomás ${k}`);
    assert.ok(Object.keys(s.at).length >= 4, `${s.id}: kevés állomás-mondat`);
    if (s.months) for (const m of s.months) assert.ok(Number.isInteger(m) && m >= 1 && m <= 12, `${s.id}: hónap ${m}`);
    const text = lines(s).map(([, t]) => t.toLowerCase()).join(' ');
    for (const [id, stems] of Object.entries(STEMS)) {
      if (stems.some(x => mentions(text, x))) assert.ok(s.who.includes(id), `${s.id}: említi (${id}), de nincs a who listában`);
    }
    for (const w of s.who) assert.ok(STEMS[w].some(x => mentions(text, x)), `${s.id}: a who listában van (${w}), de a mese nem említi`);
  }
});

test('minden állomásnak sok mesében van hívó mondata (az etetésnek nincs: ott az állat beszél)', () => {
  for (const st of ALL_STATIONS) {
    const n = STORIES.filter(s => s.at[st.id]).length;
    assert.ok(n >= 5, `${st.id}: csak ${n} mesében`);
  }
  assert.ok(STORIES.every(s => !('feed' in s.at)));
});

test('az első napokon (csak a cica lakik a kertben) minden hónapban van elég mese', () => {
  const present = friendsFor(0, []);
  assert.deepEqual(present, ['cat']);
  for (let m = 1; m <= 12; m++) {
    const n = STORIES.filter(s => eligible(s, present, m)).length;
    assert.ok(n >= 6, `${m}. hónap: csak ${n} mese`);
  }
  const full = friendsFor(100000, []);
  for (let m = 1; m <= 12; m++) assert.ok(STORIES.filter(s => eligible(s, full, m)).length >= 30, `${m}. hónap, teljes kert`);
});

test('a mesék sorban jönnek: mind sorra kerül, mielőtt bármelyik ismétlődne; utána sem jön kétszer egymás után', () => {
  const present = friendsFor(100000, []);
  for (const m of [1, 4, 7, 10]) {
    let state = { storiesUsed: [] }; const got = [];
    const n = STORIES.filter(s => eligible(s, present, m)).length;
    for (let i = 0; i < n * 2 + 3; i++) {
      const p = startRound(state, present, m); assert.ok(p, 'mindig van mese');
      got.push(p.story.id); state = { ...state, ...p };
      assert.ok(eligible(storyById(p.story.id), present, m));
    }
    assert.equal(new Set(got.slice(0, n)).size, n, `${m}. hónap: az első körben ismétlődés`);
    for (let i = 1; i < got.length; i++) assert.notEqual(got[i], got[i - 1], `${m}. hónap: kétszer egymás után: ${got[i]}`);
  }
  // csak a kert lakóiról: az elején csak a cicás vagy barát nélküli mesék
  const first = startRound({}, ['cat'], 7);
  assert.ok(storyById(first.story.id).who.every(w => w === 'cat'));
});

test('a mentésben maradt, már nem létező mese helyett tisztán új jön; sérült adat nem dob hibát', () => {
  for (const bad of [{ story: { id: 'nincs-ilyen', step: 2 } }, { story: 'x' }, { story: null }, {}, null, undefined]) {
    assert.equal(activeStory(bad), null);
    assert.equal(openingLine(bad), '');
    assert.equal(inviteLine(bad, 'szamol'), '');
    assert.equal(beatAfter(bad, 3, 10), null);
    assert.equal(endingLine(bad), null);
  }
  assert.ok(startRound({ storiesUsed: 'sérült' }, ['cat'], 5));
});

test('egy kör: a lépések sorban, egyenletesen, feladatonként legfeljebb egy; a vége egyszer, a kör utolsó csillagán', () => {
  const s = STORIES[0], n = s.beats.length;
  for (const per of [5, 7, 10, 12, 15, 20, 30]) {
    let state = { story: { id: s.id, step: 0, ended: false } };
    assert.equal(openingLine(state, 0), s.intro);
    const spoken = [];
    for (let meter = 1; meter < per; meter++) {
      const b = beatAfter(state, meter, per);
      if (b) { spoken.push(b.story.step); state = { ...state, story: b.story }; assert.equal(b.text, s.beats[b.story.step - 1]); }
    }
    assert.deepEqual(spoken, [...spoken].sort((a, b) => a - b), `${per}: sorrend`);
    assert.equal(new Set(spoken).size, spoken.length, `${per}: ismétlés`);
    if (per >= n + 1) assert.equal(spoken.length, n, `${per} csillagos körben minden lépés elhangzik`);
    else assert.ok(spoken.length >= per - 2, `${per}: túl kevés lépés (${spoken.length})`);
    assert.equal(beatAfter(state, per, per), null, 'az utolsó csillagnál nem lépés, hanem a vége jön');
    assert.equal(openingLine(state, 3), `Folytassuk! ${s.title}`, 'a kör közepén csak emlékeztető');
    const e = endingLine(state); assert.equal(e.text, s.end);
    state = { ...state, story: e.story };
    assert.equal(endingLine(state), null, 'a vége csak egyszer');
    assert.equal(inviteLine(state, 'szamol'), '', 'a mese vége után nincs több mesemondat');
    assert.equal(openingLine(state), '');
  }
  // ha egy lépés kimaradt (közben etetés vagy új barát jött), a következő feladat a legfrissebbet mondja, nem a lemaradtat
  const late = beatAfter({ story: { id: s.id, step: 0, ended: false } }, 6, 10);
  assert.equal(late.story.step, Math.floor(6 * (n + 1) / 10));
});

test('a hívó mondat csak arra az állomásra szól, amelyikhez írtuk', () => {
  const s = STORIES.find(x => x.at.szamol && !x.at.rajz);
  const state = { story: { id: s.id, step: 1, ended: false } };
  assert.equal(inviteLine(state, 'szamol'), s.at.szamol);
  assert.equal(inviteLine(state, 'rajz'), '');
});
