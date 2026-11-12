// Pixeles (ortografikus) 3D színpad a DOM-játékok mögé/fölé: a 3D figurák képernyő-pozícióhoz köthetők,
// így a játék elemei (HTML) és a 3D állatok együtt működnek. A canvas nem fogad érintést.
import * as THREE from '../../vendor/three.module.js';

export function createStage(host, { maxDpr = 2 } = {}) {
  const canvas = document.createElement('canvas'); canvas.className = 'stage3d';
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;';
  host.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr)); renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 100, 100, 0, -2000, 2000); camera.position.z = 800;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd6c8ff, 1.7));
  const sun = new THREE.DirectionalLight(0xfff0d0, 1.2); sun.position.set(-200, 400, 600); scene.add(sun);
  let W = 100, H = 100;
  function size() {
    W = host.clientWidth || 100; H = host.clientHeight || 100; renderer.setSize(W, H, false);
    camera.left = 0; camera.right = W; camera.top = H; camera.bottom = 0; camera.updateProjectionMatrix();
  }
  size(); const ro = 'ResizeObserver' in window ? new ResizeObserver(size) : null; ro?.observe(host);
  return {
    scene, canvas, add: m => { scene.add(m); return m; },
    // figura levétele a színpadról (a saját geometriái és anyagai felszabadulnak; a színpad megmarad)
    remove(m) { scene.remove(m); m.traverse(o => { o.geometry?.dispose?.(); const x = o.material; if (x) (Array.isArray(x) ? x : [x]).forEach(y => y.dispose?.()); }); },
    // a figura talpa a (cx, bottom) pixelen (a host bal-felső sarkához képest), magassága px-ben
    place(model, cx, bottom, heightPx, modelHeight = 3) { model.position.set(cx, H - bottom, 0); model.scale.setScalar(heightPx / modelHeight); },
    hostRect: () => host.getBoundingClientRect(),
    render: () => renderer.render(scene, camera),
    dispose() { ro?.disconnect(); scene.traverse(o => { o.geometry?.dispose?.(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach(x => x.dispose?.()); }); renderer.dispose(); renderer.forceContextLoss?.(); canvas.remove(); },
  };
}
