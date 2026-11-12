# Csillagkert

Játékos, magyar nyelvű tanuló- és fejlesztőjáték óvodás korúaknak iPadre és Apple Pencilre.
Feladatok → csillagok → jutalomjáték. Hibázásért nincs büntetés: szelíden újrapróbálhatja, és megtanítjuk.

**Játék:** https://bladeszasza.github.io/csillagkert/

**Amire épül:** okosítás · erények · tisztelet · kedvesség · törődés · tudás.

- **A kert él:** a cica mellett a csillagokkal sorban megérkezik a nyuszi, a kutya, a róka, a maci és a panda.
  Pislognak, sétálnak a zugukban, koppintásra megszólalnak a saját hangjukon. Minden csillag egy virág.
- **Rozi, a robot** beszél (böngésző-hang), bemutatkozik, ő osztja a csillagokat; az arca a hangulathoz igazodik.
- **Feladatok:** vonalkövetés és betűk, számolás 20-ig, összeadás/kivonás, formák, hangok és rímek,
  zene (harangok, szó–mi, mély–magas, halk–hangos, egyforma–különböző, feljebb–lejjebb),
  állatetetés (a kert valódi 3D lakóját etetjük), testünk, időutazás, robotprogramozás (algoritmikus gondolkodás), rajz.
- **Jutalomjátékok:** Unikornis-futás, Felhővár-verseny, szabad futás procedurális világban, hami-adagoló (3D cica),
  cica-etetés, Barátom (fésülés, simogatás, labdázás), unikornis-öltöztető (ajándékokkal), buborékpukkasztás.
- Nincs build lépés: sima HTML + ES modulok + three.js (`vendor/`). GitHub Pages-en fut. A haladás csak az eszközön tárolódik.

## Hang

- Minden játékhang egyetlen közös hangmotoron megy át (`js/audio.js`): hangerő, kompresszor, torzítás elleni védelem.
- A beszéd és a játékhangok hangereje külön állítható a szülői sarokban (bal alsó ⚙ gomb, 3 mp-ig nyomva tartva).
- Ha a zene nem szól, de Rozi beszél: kapcsold ki az iPad néma módját, és hangosítsd fel.
- Ha nincs magyar hang: Beállítások → Kisegítő lehetőségek → Felolvasott tartalom → Hangok → Magyar.

## Etetés

Az éhes barát az etetőhelyre sétál, a kamera ráközelít, és az asztalról neki kell adni az ételt (húzással vagy koppintással).
Jó ételnél rág, megköszöni, és csak az ő hangja szól; tévedésnél udvariasan elfordítja a fejét, a második tévedés után
Rozi egy mondatban megtanítja („A nyuszi répát eszik."). Akit megetettek, az a kertben marad.

Ki mit eszik (`js/friends.js`): rossz válasz csak olyan étel lehet, amit az állat biztosan nem eszik.

| Állat | Jó válasz | Honnan |
|---|---|---|
| nyuszi | répa, saláta, széna | jóváhagyott terv |
| cica | hal, hús | jóváhagyott terv |
| kutya | csont, hús | jóváhagyott terv |
| panda | bambusz | jóváhagyott terv |
| róka | hús, tojás | [Wildlife Online: Red Fox Diet](https://www.wildlifeonline.me.uk/animals/article/red-fox-diet-what-foxes-eat) (kisemlősök, tojás, bogyók) – szülői átnézésre vár |
| maci | hal, áfonya, hús – **mindegyik jó** | A barnamedve mindenevő: növények, bogyók, hal, kisemlősök ([US National Park Service](https://www.nps.gov/subjects/bears/brown-bears.htm)). Nála ezért nincs rossz válasz (szülői döntés): Rozi elmondja, hogy „a maci sokfélét eszik", és a gyerek választja ki, mit ad neki. |

## Több gyerek, mentés

- **Mindenkinek saját világa van:** külön csillagok, kert, barátok, látott feladatok, ruhatár és beállítások.
  Új gyereket a szülői sarokban lehet felvenni (bal alsó ⚙ gomb, 3 mp-ig nyomva tartva → „＋ Új gyerek").
- **Ki játszik?** Ha több gyerek van, induláskor mindenki a saját jelére koppint (olvasni nem kell hozzá).
  Játék közben a jobb felső, jelet mutató gombbal lehet átadni a helyet a testvérnek.
- **A korábbi, egyetlen mentés** az első gyerek lesz, semmi nem vész el belőle; a régi mentés biztonsági másolatként megmarad.
- **Mentés fájlba / visszatöltés** (szülői sarok): a játszó gyerek állása egy fájlba menthető, és másik eszközön
  (vagy a főképernyőre telepített példányban) visszatölthető. A visszatöltött mentés mindig új gyerekként jelenik meg.
- Minden adat az eszközön marad (`localStorage`, `js/progress.js`); a hang beállításai az eszközhöz tartoznak, nem a gyerekhez.

## Telepítés a főképernyőre

Safari → Megosztás → „Főképernyőhöz adás". Így teljes képernyőn indul.
Figyelem: a főképernyőre telepített példány **külön mentést** használ, mint a Safari-ban megnyitott oldal,
ott a csillagok elölről indulnak. Az állás a szülői sarokból fájlba menthető, és ott visszatölthető.

## Fejlesztés és tesztek

- Helyi kipróbálás: `node serve.cjs . 8080`, majd `http://localhost:8080/`.
- Tartalom-tesztek: `node --test tests/content.test.mjs` (egyedi azonosítók, egy helyes válasz, besorolás, nyelvtan,
  etetési tábla, a barátok érkezése, a virágok helye).
- Profil- és mentés-tesztek: `node --test tests/profiles.test.mjs` (a régi mentés átvétele, sérült adatok, két gyerek
  függetlensége, két megnyitott lap, mentés fájlba és visszatöltés, hibás fájl elutasítása).
- Böngészős füstteszt: `http://localhost:8080/tests/smoke.html` (hangerő-mérés, a jó válasz helye, megszakítás utáni csend,
  minden feladattípus elindul, a kert lakói és rajzolási terhe, etetés a 3D állattal minden úton).
  A füstteszt memóriában élő tárolóval fut, a valódi mentéshez nem nyúl.
