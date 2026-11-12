# Csillagkert

Játékos, magyar nyelvű tanuló- és fejlesztőjáték óvodás korúaknak iPadre és Apple Pencilre.
Feladatok → csillagok → jutalomjáték. Hibázásért nincs büntetés: szelíden újrapróbálhatja, és megtanítjuk.

**Játék:** https://bladeszasza.github.io/csillagkert/

**Amire épül:** okosítás · erények · tisztelet · kedvesség · törődés · tudás.

- **A kert él:** a cica mellett a csillagokkal sorban 18 barát érkezik (lásd lent). Pislognak, sétálnak a zugukban,
  koppintásra megszólalnak a saját hangjukon (mindegyiknek más). Minden csillag egy virág.
  Az új barát besétál, megszólal, és Rozi egy mondatban bejelenti. A nap a csillagmérővel együtt halad a naplemente felé.
- **Tópart és tanya:** a kert két szélén két új rész van. Balra a tó (kacsa, béka, sün, mókus, bagoly, egér, teknős),
  jobbra a tanya (tyúk, unikornis, malac, bárány, póni, tehén) kerítéssel, pajtával, szénabálával és szivárvánnyal.
  Alul a két szélső gomb (rajta az ottani első barát képe) viszi át oda a kamerát, a 🐱 gomb hozza vissza a kert közepére.
  Ha valaki a tópartra vagy a tanyára érkezik, a kamera odasiklik megnézni, aztán magától visszatér.
- **A kert a térkép:** az állomások helyek a kertben (ceruzatorony, házikó, almafa, földgömb, robot, festőállvány,
  számolókockák, harangok, piknik…), a jelükre koppintva lehet odamenni. A „Tovább" gomb megmaradt annak, aki nem akar választani.
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
| kacsa | kukorica, saláta, vízinövény – **mindegyik jó** | jóváhagyott terv; mindenevő, ezért a macihoz hasonlóan nincs rossz válasz |
| mókus | mogyoró, dió, makk | jóváhagyott terv |
| póni | zab, széna, alma | jóváhagyott terv |
| tehén | fű, széna | jóváhagyott terv |
| sün | bogár, giliszta, csiga – **mindegyik jó** | [British Hedgehog Preservation Society: Basic Facts](https://www.britishhedgehogs.org.uk/the-basic-facts/) (bogarak, hernyók, giliszták, meztelen csigák), [Wildlife Online](https://www.wildlifeonline.me.uk/questions/answer/do-hedgehogs-eat-slugs-and-snails) (vékony házú csigák) – szülői átnézésre vár |
| tyúk | kukorica, búza, bogár – **mindegyik jó** | [Poultry Extension: What does a chicken eat?](https://poultry.extension.org/articles/poultry-related-youth-programs/what-does-a-chicken-eat/) (kukorica, búza, rovarok, giliszták) – szülői átnézésre vár |

- **A sün és az alma:** a mesékben a sün almát visz a tüskéin, a valóságban rovarokat, gilisztát, csigát eszik.
  Az alma ezért nála se jó, se rossz válasz nem lehet.
- **Akit (még) nem etetünk:** béka, bagoly, egér, unikornis, malac, bárány, teknős. Ők a kertben élnek és megszólalnak,
  de etetős feladatuk csak akkor lesz, ha az étrendjüket forrásból ellenőriztük (vagy a szülő jóváhagyja).
- A „rossz" ételek is ellenőrzöttek: amit az állat néha megeszik (pl. a panda ritkán halat), az nem lehet rossz válasz.

## Ki mikor érkezik a kertbe

| Csillag | Barát | Hol lakik |
|---:|---|---|
| 0 | cica | kert közepe |
| 3 · 8 · 15 | nyuszi · kutya · róka | kert közepe |
| 25 | kacsa | tópart |
| 30 | maci | kert közepe |
| 35 | béka | tópart |
| 40 | sün | tópart |
| 48 | tyúk | tanya |
| 55 | panda | kert közepe |
| 62 | mókus | tópart |
| 70 | bagoly (nappal szundikál, koppintásra felébred) | tópart |
| 80 | egér | tópart |
| 90 | unikornis | tanya |
| 100 · 110 · 120 | malac · bárány · teknős | tanya · tanya · tópart |
| 135 · 150 | póni · tehén | tanya |

A jóváhagyott terv ezeket rögzítette: nyuszi 3, kutya 8, róka 15, kacsa 25, maci 30, sün 40, panda 55, bagoly 70, unikornis 90.
**A többi küszöb (béka, tyúk, mókus, egér, malac, bárány, teknős, póni, tehén) az én beállításom**, szabadon átírható
a `js/friends.js` táblájában. Etetéssel bárki hamarabb is beköltözik.

## Több gyerek, mentés

- **Mindenkinek saját világa van:** külön csillagok, kert, barátok, látott feladatok, ruhatár és beállítások.
  Új gyereket a szülői sarokban lehet felvenni (bal alsó ⚙ gomb, 3 mp-ig nyomva tartva → „＋ Új gyerek").
- **Ki játszik?** Ha több gyerek van, induláskor mindenki a saját jelére koppint (olvasni nem kell hozzá).
  Játék közben a jobb alsó, jelet mutató gombbal lehet átadni a helyet a testvérnek.
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
  minden feladattípus elindul, a kert lakói és rajzolási terhe, a tópart és a tanya, koppintás minden barátra,
  etetés a 3D állattal minden úton, a tanyáról is). A füstteszt memóriában élő tárolóval fut, a valódi mentéshez nem nyúl.
- Állatgaléria: `http://localhost:8080/tests/characters.html` (`?kind=cow`, `?page=2`, `?wave=1`, `?side=1`) – minden faj
  egyenként, a mért és a táblázatban álló magassággal.
- A barátok egyetlen közös, példányosított hálócsomagból rajzolódnak (`js/three/characters.js`): a teljes kert
  19 baráttal 12–30 rajzolási hívás. Háromszögből 300 csillagnál (300 virággal) kb. 194 ezer van; a tervben szereplő
  kb. 150 ezres keretet ez a sok virág miatt átlépi. A teszt saját határa 250 ezer; az iPades próbán érdemes figyelni, nem lassul-e.
