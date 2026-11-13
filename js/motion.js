// Mozgás a felületen (M5/3): rugós gombnyomás és a „kevesebb mozgás" beállítás.
// A „kevesebb mozgás" az eszköz beállítása (szülői sarok); ha a szülő nem döntött, a rendszer „Mozgás csökkentése"
// beállítását követi. Bekapcsolva a végtelenített díszmozgások (ugrálás, ragyogás, csengés) egyszer futnak le,
// és a gombok nem pattognak; a visszajelzések (csillag, szív, ajándék) megmaradnak.
import { progress } from './progress.js';

const mq = globalThis.matchMedia ? globalThis.matchMedia('(prefers-reduced-motion: reduce)') : null;
export const calmChoice = () => { const v = progress.device.get().calm; return typeof v === 'boolean' ? v : null; };
export const calm = () => calmChoice() ?? !!mq?.matches;
export function applyCalm() { document.documentElement.classList.toggle('calm', calm()); }
export function setCalm(v) { progress.device.set({ calm: typeof v === 'boolean' ? v : undefined }); applyCalm(); }
mq?.addEventListener?.('change', applyCalm);

// Rugós nyomás: lenyomva a CSS kicsit összenyomja (:active → scale), elengedéskor egy rövid rugózás visszaadja.
// A `scale` külön tulajdonság, így nem írja felül a gombok saját transform-ját (pl. a térkép jelein).
export const PRESSABLE = '.giant, .round, .choice, .station, .answer, .who-card, .area-btn, .du-tab, .du-opt, .pet-tool, .pet-friend, #hearts';
export function setupPress(root = document) {
  root.addEventListener('pointerup', e => {
    const b = e.target.closest?.(PRESSABLE);
    if (!b || !b.animate || calm()) return;
    try { b.animate([{ scale: '0.93' }, { scale: '1.06', offset: 0.45 }, { scale: '1' }], { duration: 320, easing: 'cubic-bezier(.3,.7,.4,1)' }); } catch (err) { }
  }, { passive: true });
}
