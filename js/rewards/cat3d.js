// A kertből ismert 3D cica (saját tervezés), újrahasználható a játékokban. A talpa az origóban van (y = 0),
// előre a +z irányba néz (a kamera felé). Magassága kb. 3.1 egység.
import * as THREE from '../../vendor/three.module.js';

export const CAT_HEIGHT = 3.1;

export function makeGardenCat() {
  const cat = new THREE.Group();
  const fur = new THREE.MeshLambertMaterial({ color: 0xffb870 });
  const white = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const dark = new THREE.MeshBasicMaterial({ color: 0x3b2a63 });
  const pink = new THREE.MeshLambertMaterial({ color: 0xff8fc8 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 18), fur); body.scale.set(1, 0.95, 1.1); body.position.y = 0.9; cat.add(body);
  const head = new THREE.Group(); head.position.set(0, 2.1, 0.2);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.75, 24, 18), fur));
  const eyes = [];
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.5, 4), fur); ear.position.set(sx * 0.48, 0.7, 0); ear.rotation.z = -sx * 0.25; head.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 4), pink); inner.position.set(sx * 0.48, 0.68, 0.1); inner.rotation.z = -sx * 0.25; head.add(inner);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), dark); eye.position.set(sx * 0.27, 0.1, 0.68); head.add(eye); eyes.push(eye);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), white); shine.position.set(sx * 0.3, 0.14, 0.77); head.add(shine);
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), pink); cheek.position.set(sx * 0.46, -0.12, 0.6); cheek.scale.z = 0.4; head.add(cheek);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), pink); nose.position.set(0, -0.02, 0.73); head.add(nose);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 14, Math.PI), dark); smile.position.set(0, -0.2, 0.68); smile.rotation.z = Math.PI; head.add(smile);
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), new THREE.MeshBasicMaterial({ color: 0x7a2340 })); mouth.scale.set(1.1, 1, 0.5); mouth.position.set(0, -0.24, 0.68); mouth.visible = false; head.add(mouth);   // evéskor nyílik
  cat.add(head);
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.12, 10, 20, Math.PI * 1.2), fur); tail.position.set(-0.9, 0.8, -0.3); tail.rotation.y = 1.2; cat.add(tail);
  for (const sx of [-1, 1]) { const paw = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), white); paw.position.set(sx * 0.4, 0.2, 0.7); cat.add(paw); }
  const root = new THREE.Group(); root.add(cat);
  root.userData = { cat, head, tail, height: CAT_HEIGHT, body, eyes, smile, mouth };
  return root;
}

// mozgás: lélegzés, farok csóválás; hop (ugrálás), nom (evés: a fej lebiccen), shake (fejcsóválás: "köszi, nem")
export function animateCat(root, t, { hop = 0, nom = 0, shake = 0, cheer = false } = {}) {
  const { cat, head, tail } = root.userData;
  cat.position.y = hop > 0 ? Math.abs(Math.sin(hop * Math.PI * 3)) * 0.7 : Math.sin(t * 2) * 0.04;
  head.rotation.z = shake > 0 ? Math.sin(shake * Math.PI * 6) * 0.3 : Math.sin(t * 1.3) * 0.08;
  head.rotation.x = nom > 0 ? Math.sin(nom * Math.PI) * 0.5 : 0;
  tail.rotation.z = Math.sin(t * (cheer || hop > 0 ? 9 : 2.4)) * 0.3;
}
