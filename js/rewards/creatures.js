// Közös, saját tervezésű 3D szereplők a jutalomjátékokhoz (three.js primitívekből): unikornis és barátságos állatok.
// A figurák előre néznek (-z irány). Minden állatnak mosolya van; némelyik integet.
import * as THREE from '../../vendor/three.module.js';

const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
const mat = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const ball = (r, color, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat(color)); m.scale.set(sx, sy, sz); return m; };

function legPair(group, color, hoof, positions, h = 0.5) {
  const legs = [];
  for (const [x, z] of positions) {
    const pivot = new THREE.Group(); pivot.position.set(x, 0.55, z);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, h, 8), mat(color)); leg.position.y = -h / 2; pivot.add(leg);
    const hoofM = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.08, 8), mat(hoof)); hoofM.position.y = -h; pivot.add(hoofM);
    group.add(pivot); legs.push(pivot);
  }
  return legs;
}

export function makeUnicorn({ body = 0xffffff, mane = 0xff5d8f, horn = 0xffd24d, scale = 1 } = {}) {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  inner.add(at(ball(0.5, body, 0.75, 0.65, 1.25), 0, 0.95, 0));
  const neck = ball(0.28, body, 0.8, 1.3, 0.9); neck.position.set(0, 1.3, -0.62); neck.rotation.x = -0.5; inner.add(neck);
  const head = new THREE.Group(); head.position.set(0, 1.55, -0.85); inner.add(head);
  head.add(ball(0.27, body, 0.9, 0.9, 1.15));
  const snout = ball(0.16, body, 1, 0.9, 1.1); snout.position.set(0, -0.06, -0.26); head.add(snout);
  const nose = ball(0.04, 0xff8fc8); nose.position.set(0, -0.04, -0.4); head.add(nose);
  for (const sx of [-1, 1]) {
    const eye = ball(0.045, 0x3b2a63); eye.position.set(sx * 0.17, 0.07, -0.18); head.add(eye);
    const shine = ball(0.015, 0xffffff); shine.position.set(sx * 0.18, 0.09, -0.22); head.add(shine);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 6), mat(body)); ear.position.set(sx * 0.14, 0.3, 0.02); ear.rotation.z = -sx * 0.25; head.add(ear);
    const cheek = ball(0.045, 0xffb3d6, 1, 1, 0.4); cheek.position.set(sx * 0.2, -0.05, -0.2); head.add(cheek);
  }
  const hornM = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.38, 8), mat(horn)); hornM.position.set(0, 0.46, -0.1); hornM.rotation.x = -0.25; head.add(hornM);
  for (let i = 0; i < 5; i++) { const t = ball(0.12, mane, 0.8, 1, 0.9); t.position.set(0, 1.78 - i * 0.14, -0.62 + i * 0.16); inner.add(t); }
  const tail = new THREE.Group(); tail.position.set(0, 1.0, 0.62); inner.add(tail);
  for (let i = 0; i < 4; i++) { const t = ball(0.13 - i * 0.015, mane); t.position.set(0, -i * 0.13, 0.08 + i * 0.1); tail.add(t); }
  const legs = legPair(inner, body, 0x3b2a63, [[-0.2, -0.45], [0.2, -0.45], [-0.2, 0.45], [0.2, 0.45]], 0.55);
  g.scale.setScalar(scale);
  g.userData = { legs, inner, tail, head, phase: 0 };
  return g;
}

// Vágtázás / séta / állás animáció. speed: 0..1 (0 = áll). t: idő mp-ben.
export function animateRunner(g, t, speed) {
  const { legs, inner, tail, head } = g.userData;
  const f = 3 + speed * 10, amp = 0.15 + speed * 0.7;
  const s = speed > 0.02 ? 1 : 0;
  legs[0].rotation.x = Math.sin(t * f) * amp * s;
  legs[3].rotation.x = Math.sin(t * f) * amp * s;
  legs[1].rotation.x = Math.sin(t * f + Math.PI) * amp * s;
  legs[2].rotation.x = Math.sin(t * f + Math.PI) * amp * s;
  inner.position.y = Math.abs(Math.sin(t * f)) * 0.08 * s * (0.5 + speed);
  inner.rotation.x = Math.sin(t * f) * 0.03 * s;
  tail.rotation.x = 0.3 + Math.sin(t * f * 0.7) * 0.25 * (0.3 + speed);
  head.rotation.x = Math.sin(t * f * 0.5) * 0.05;
}

const SPECIES = {
  bunny: { body: 0xffffff, accent: 0xffb3d6, ear: 'long', tail: 'puff' },
  cat: { body: 0xffb870, accent: 0xff8fc8, ear: 'tri', tail: 'long' },
  dog: { body: 0xc8895a, accent: 0x6b4226, ear: 'floppy', tail: 'long' },
  fox: { body: 0xff8a3d, accent: 0xffffff, ear: 'tri', tail: 'puff' },
};
export const SPECIES_LIST = Object.keys(SPECIES);

// Barátságos állat: mosolyog, szívecske jelenik meg mellette, ha közel a játékos; integethet.
export function makeFriend(kind = 'bunny') {
  const sp = SPECIES[kind] || SPECIES.bunny;
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  inner.add(at(ball(0.42, sp.body, 0.9, 0.8, 1.2), 0, 0.7, 0));
  const head = new THREE.Group(); head.position.set(0, 1.15, -0.5); inner.add(head);
  head.add(ball(0.3, sp.body));
  for (const sx of [-1, 1]) {
    const eye = ball(0.05, 0x3b2a63); eye.position.set(sx * 0.12, 0.06, -0.26); head.add(eye);
    const cheek = ball(0.06, 0xffb3d6, 1, 1, 0.4); cheek.position.set(sx * 0.2, -0.07, -0.24); head.add(cheek);
    let ear;
    if (sp.ear === 'long') { ear = ball(0.09, sp.body, 0.7, 2.6, 0.5); ear.position.set(sx * 0.12, 0.5, 0); ear.rotation.z = -sx * 0.15; }
    else if (sp.ear === 'floppy') { ear = ball(0.1, sp.accent, 0.6, 1.6, 0.4); ear.position.set(sx * 0.3, 0.05, 0); ear.rotation.z = sx * 0.4; }
    else { ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 4), mat(sp.body)); ear.position.set(sx * 0.17, 0.3, 0); ear.rotation.z = -sx * 0.2; }
    head.add(ear);
  }
  const nose = ball(0.045, 0xff6f9f); nose.position.set(0, -0.02, -0.3); head.add(nose);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.015, 6, 12, Math.PI), mat(0x3b2a63)); smile.position.set(0, -0.1, -0.27); smile.rotation.z = Math.PI; head.add(smile);
  const tail = ball(sp.tail === 'puff' ? 0.15 : 0.1, sp.tail === 'puff' ? sp.accent : sp.body, 1, 1, sp.tail === 'puff' ? 1 : 2.4); tail.position.set(0, 0.8, 0.62); inner.add(tail);
  const arm = new THREE.Group(); arm.position.set(0.38, 0.85, -0.2); inner.add(arm);
  const armM = ball(0.08, sp.body, 0.8, 2.2, 0.8); armM.position.y = 0.12; arm.add(armM);
  const legs = legPair(inner, sp.body, sp.accent, [[-0.18, -0.3], [0.18, -0.3], [-0.18, 0.3], [0.18, 0.3]], 0.38);
  const heart = ball(0.08, 0xff4f8f, 1, 1, 0.5); heart.position.set(0, 2, 0); heart.visible = false; g.add(heart);
  g.scale.setScalar(1.0);
  g.userData = { legs, inner, head, arm, heart, tail, kind };
  return g;
}
export function animateFriend(g, t, speed, waving) {
  const { legs, inner, arm, tail } = g.userData;
  const f = 4 + speed * 9, amp = 0.2 + speed * 0.6, s = speed > 0.02 ? 1 : 0;
  legs[0].rotation.x = legs[3].rotation.x = Math.sin(t * f) * amp * s;
  legs[1].rotation.x = legs[2].rotation.x = Math.sin(t * f + Math.PI) * amp * s;
  inner.position.y = Math.abs(Math.sin(t * f)) * 0.07 * s;
  tail.rotation.y = Math.sin(t * 6) * 0.4;
  arm.rotation.z = waving ? -2.4 + Math.sin(t * 9) * 0.5 : 0.1;       // integet vagy lógatja
  arm.position.y = waving ? 0.95 : 0.85;
}
