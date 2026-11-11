// Több lépéses feladat egyetlen csillagért (pl. betűlecke: átírás + két szókereső).
const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function run(container, { steps }) {
  for (const step of steps) {
    const mod = await import(`./${step.type}.js`);
    await mod.run(container, step);
    container.innerHTML = '';
    await sleep(300);
  }
}
