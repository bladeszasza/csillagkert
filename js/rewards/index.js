// A jutalomjátékok egy helyen: a főprogram ebből tölti be őket, és a füstteszt is ezt a listát járja végig
// (így egy új játék nem maradhat ki az ajándék-ellenőrzésből). Minden játék run(tartó, { gift, heart }) alakú:
//   gift(): az első igazi játék-pillanatnál hívja (jutalomkörönként egy ajándék jár, a többi hívás null-t ad)
//   heart(hely?): jó tett (etetés, ölelés, barátság); a korlát a js/economy.js-ben van
export const REWARDS = {
  sparkhorn: () => import('./sparkhorn.js'),
  bubbles: () => import('./bubbles.js'),
  foodcatch: () => import('./foodcatch.js'),
  healthy: () => import('./healthy.js'),
  race: () => import('./race.js'),
  pet: () => import('./pet.js'),
  openworld: () => import('./openworld.js'),
  dressup: () => import('./dressup.js'),
};
