// A kert: háttérben forgó, lágy 3D jelenet. A gyűjtött csillagok virágként kinőnek.
import * as THREE from '../vendor/three.module.js';

export function createGarden(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfefff);
  scene.fog = new THREE.Fog(0xbfefff, 14, 34);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 4.2, 9); camera.lookAt(0, 1.2, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfe8b8, 1.5));
  const sun = new THREE.DirectionalLight(0xfff2d0, 1.6); sun.position.set(4, 8, 5); scene.add(sun);

  const ground = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 0.6, 48), new THREE.MeshLambertMaterial({ color: 0xa8e6a0 }));
  ground.position.y = -0.3; scene.add(ground);

  // felhők
  const clouds = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.7 + Math.random() * 0.4, 12, 10), new THREE.MeshLambertMaterial({ color: 0xffffff }));
      s.position.set(j * 0.8 - 0.8, Math.random() * 0.3, 0); c.add(s);
    }
    c.position.set(-12 + i * 5, 5 + Math.random() * 2, -8 - Math.random() * 4); clouds.add(c);
  }
  scene.add(clouds);

  // kiscica-kabala (saját tervezés)
  const cat = new THREE.Group();
  const fur = new THREE.MeshLambertMaterial({ color: 0xffb870 });
  const white = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const dark = new THREE.MeshBasicMaterial({ color: 0x3b2a63 });
  const pink = new THREE.MeshLambertMaterial({ color: 0xff8fc8 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 18), fur); body.scale.set(1, 0.95, 1.1); body.position.y = 0.9; cat.add(body);
  const head = new THREE.Group(); head.position.set(0, 2.1, 0.2);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.75, 24, 18), fur); head.add(skull);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.5, 4), fur); ear.position.set(sx * 0.48, 0.7, 0); ear.rotation.z = -sx * 0.25; head.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 4), pink); inner.position.set(sx * 0.48, 0.68, 0.1); inner.rotation.z = -sx * 0.25; head.add(inner);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), dark); eye.position.set(sx * 0.27, 0.1, 0.68); head.add(eye);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), white); shine.position.set(sx * 0.3, 0.14, 0.77); head.add(shine);
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), pink); cheek.position.set(sx * 0.46, -0.12, 0.6); cheek.scale.z = 0.4; head.add(cheek);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), pink); nose.position.set(0, -0.02, 0.73); head.add(nose);
  cat.add(head);
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.12, 10, 20, Math.PI * 1.2), fur); tail.position.set(-0.9, 0.8, -0.3); tail.rotation.y = 1.2; cat.add(tail);
  for (const sx of [-1, 1]) { const paw = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), white); paw.position.set(sx * 0.4, 0.2, 0.7); cat.add(paw); }
  cat.position.set(0, 0, 1);
  scene.add(cat);

  // virágok = összes gyűjtött csillag
  const flowers = new THREE.Group(); scene.add(flowers);
  const colors = [0xff8fc8, 0xffcf3f, 0x8e5be8, 0x7fe0c0, 0xff9f6b];
  let flowerCount = 0;
  function spot(i) { // determinisztikus, lazán szétszórt elhelyezés a macska körül
    const a = i * 2.399, r = 2.6 + (i % 7) * 0.9;
    return { x: Math.cos(a) * r, z: Math.sin(a) * r * 0.55 - 1.2 };
  }
  function addFlower(i, animate) {
    const g = new THREE.Group(); const p = spot(i);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.9, 6), new THREE.MeshLambertMaterial({ color: 0x4caf50 })); stem.position.y = 0.45; g.add(stem);
    const bloom = new THREE.Group(); bloom.position.y = 0.95;
    const col = colors[i % colors.length];
    for (let k = 0; k < 6; k++) {
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshLambertMaterial({ color: col }));
      petal.position.set(Math.cos(k * 1.047) * 0.26, 0, Math.sin(k * 1.047) * 0.26); bloom.add(petal);
    }
    const mid = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), new THREE.MeshLambertMaterial({ color: 0xffe066 })); bloom.add(mid);
    bloom.rotation.x = -0.5; g.add(bloom);
    g.position.set(p.x, 0, p.z); g.userData.born = animate ? performance.now() : -1e9;
    g.scale.setScalar(animate ? 0.01 : 1);
    flowers.add(g);
  }
  function setStars(total) {
    const target = Math.min(total, 70);
    while (flowerCount < target) { addFlower(flowerCount, flowerCount >= target - 1 && total > 0 && flowerCount > 0); flowerCount++; }
  }

  let cheerUntil = 0, paused = false;
  function cheer() { cheerUntil = performance.now() + 1400; }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.set(0, h > w ? 5.4 : 4.2, h > w ? 12 : 9); camera.lookAt(0, (h < 640 && w > h) ? -0.3 : 1.2, 0);
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 250));
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  window.visualViewport?.addEventListener('resize', resize);
  resize();

  function frame(now) {
    if (paused) { requestAnimationFrame(frame); return; }
    const t = now / 1000;
    const cheering = now < cheerUntil;
    cat.position.y = cheering ? Math.abs(Math.sin(t * 9)) * 0.7 : Math.sin(t * 2) * 0.04;
    head.rotation.z = Math.sin(t * 1.3) * 0.08;
    tail.rotation.z = Math.sin(t * (cheering ? 9 : 2.4)) * 0.3;
    clouds.children.forEach((c, i) => { c.position.x += 0.004 * (1 + i * 0.1); if (c.position.x > 16) c.position.x = -16; });
    flowers.children.forEach(f => {
      const age = (now - f.userData.born) / 700;
      if (age < 1) f.scale.setScalar(Math.max(0.01, 1 - Math.pow(1 - age, 3)) * (1 + Math.sin(age * 3.14) * 0.3));
      else f.scale.setScalar(1);
      f.rotation.z = Math.sin(t * 1.2 + f.position.x) * 0.04;
    });
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { setStars, cheer, pause: p => { paused = !!p; } };
}
