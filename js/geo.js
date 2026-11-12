// Közös 3D segédek: több test egyetlen geometriává olvasztása (pozíció + normál + csúcsszín),
// hogy egy virág vagy az összes kerti tereptárgy egyetlen rajzolási hívás legyen.
import * as THREE from '../vendor/three.module.js';

// parts: [{ geo, matrix?, color? }] – a kapott geometriákat felszabadítja
export function merge(parts) {
  const pos = [], nor = [], col = [];
  for (const { geo, matrix, color } of parts) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (matrix) g.applyMatrix4(matrix);
    const p = g.attributes.position, n = g.attributes.normal, c = new THREE.Color(color ?? 0xffffff);
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); col.push(c.r, c.g, c.b); }
    g.dispose(); geo.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return out;
}

// Egy alkatrész: geometria + szín + hely [x,y,z] + forgatás [x,y,z] + méret (szám vagy [x,y,z])
export function part(geo, color, pos = [0, 0, 0], rot = [0, 0, 0], scale = 1) {
  const s = typeof scale === 'number' ? [scale, scale, scale] : scale;
  return { geo, color, matrix: new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...s)) };
}
