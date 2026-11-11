// Betűk átírása (pl. a saját név): a betűket ceruzával / ujjal kell "kitölteni".
// Lefedettség-alapú: elég a betűk nagy részét bejárni, a pontos sorrend nem számít.
import { attachPen } from '../pen.js';
import { progress } from '../progress.js';
import { say } from '../voice.js';

export function run(container, { text = 'A', useName = false, say: sayText }) {
  return new Promise(resolve => {
    let word = (useName && progress.get().name) ? progress.get().name.toUpperCase() : text;
    word = word.slice(0, 10);
    container.innerHTML = `
      <div class="activity">
        <div class="prompt">Írd át a betűket! ✏️</div>
        <div class="pad"><canvas class="guide"></canvas><canvas class="ink"></canvas></div>
      </div>`;
    const guide = container.querySelector('.guide'), ink = container.querySelector('.ink');
    let samples = [], covered = 0, done = false;

    function layout() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2), r = guide.getBoundingClientRect();
      const W = r.width, H = r.height;
      guide.width = Math.max(1, W * dpr); guide.height = Math.max(1, H * dpr);
      const c = guide.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
      let size = Math.min(H * 0.75, 260);
      c.font = `900 ${size}px "Trebuchet MS", Arial, sans-serif`;
      while (c.measureText(word).width > W * 0.9 && size > 40) { size -= 6; c.font = `900 ${size}px "Trebuchet MS", Arial, sans-serif`; }
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#efe6ff'; c.fillText(word, W / 2, H / 2);
      c.setLineDash([2, 14]); c.lineWidth = 5; c.lineCap = 'round'; c.strokeStyle = '#8e5be8'; c.strokeText(word, W / 2, H / 2);
      // minták a betű belsejéből
      const img = c.getImageData(0, 0, guide.width, guide.height), step = Math.round(14 * dpr);
      samples = [];
      for (let y = 0; y < guide.height; y += step) for (let x = 0; x < guide.width; x += step) {
        const a = img.data[(y * guide.width + x) * 4 + 3];
        if (a > 200) samples.push({ x: x / dpr, y: y / dpr, hit: false });
      }
      covered = 0;
    }
    function mark(p) {
      const R2 = 30 * 30;
      for (const s of samples) if (!s.hit && (s.x - p.x) ** 2 + (s.y - p.y) ** 2 < R2) { s.hit = true; covered++; }
      if (!done && samples.length && covered / samples.length >= 0.72) { done = true; setTimeout(async () => { await say('Szép betűk!'); resolve(); }, 500); }
    }
    attachPen(ink, { color: '#ff5d8f', baseWidth: 26, onStart: mark, onMove: mark });
    layout(); new ResizeObserver(layout).observe(guide);
    say(sayText || `Fesd át a betűket a ceruzáddal! ${word.length > 1 ? '' : 'Ez az ' + word + ' betű.'}`);
  });
}
