# Csillagkert

Játékos, magyar nyelvű tanuló- és fejlesztőjáték óvodás korúaknak iPadre és Apple Pencilre.
Feladatok → csillagok → jutalomjáték. Hibázásért nincs büntetés: szelíden újrapróbálhatja, és megtanítjuk.

**Játék:** https://bladeszasza.github.io/csillagkert/

**Amire épül:** okosítás · erények · tisztelet · kedvesség · törődés · tudás.

- **Rozi, a robot** beszél (böngésző-hang), bemutatkozik, ő osztja a csillagokat; az arca a hangulathoz igazodik.
- **Feladatok:** vonalkövetés és betűk, számolás 20-ig, összeadás/kivonás, formák, hangok és rímek,
  zene (harangok, szó–mi, mély–magas, halk–hangos, egyforma–különböző, feljebb–lejjebb),
  állatetetés, testünk, időutazás, robotprogramozás (algoritmikus gondolkodás), rajz.
- **Jutalomjátékok:** Unikornis-futás, Felhővár-verseny, szabad futás procedurális világban, hami-adagoló (3D cica),
  cica-etetés, Barátom (fésülés, simogatás, labdázás), unikornis-öltöztető (ajándékokkal), buborékpukkasztás.
- Nincs build lépés: sima HTML + ES modulok + three.js (`vendor/`). GitHub Pages-en fut. A haladás csak az eszközön tárolódik.

## Hang

- Minden játékhang egyetlen közös hangmotoron megy át (`js/audio.js`): hangerő, kompresszor, torzítás elleni védelem.
- A beszéd és a játékhangok hangereje külön állítható a szülői sarokban (bal alsó ⚙ gomb, 3 mp-ig nyomva tartva).
- Ha a zene nem szól, de Rozi beszél: kapcsold ki az iPad néma módját, és hangosítsd fel.
- Ha nincs magyar hang: Beállítások → Kisegítő lehetőségek → Felolvasott tartalom → Hangok → Magyar.

## Telepítés a főképernyőre

Safari → Megosztás → „Főképernyőhöz adás". Így teljes képernyőn indul.
Figyelem: a főképernyőre telepített példány **külön mentést** használ, mint a Safari-ban megnyitott oldal,
ott a csillagok elölről indulnak. (A mentés fájlba írása és visszatöltése a következő mérföldkőben érkezik.)

## Fejlesztés és tesztek

- Helyi kipróbálás: `node serve.cjs . 8080`, majd `http://localhost:8080/`.
- Tartalom-tesztek: `node --test tests/content.test.mjs` (egyedi azonosítók, egy helyes válasz, besorolás, nyelvtan).
- Böngészős füstteszt: `http://localhost:8080/tests/smoke.html` (hangerő-mérés, a jó válasz helye, megszakítás utáni csend,
  minden feladattípus elindul).
