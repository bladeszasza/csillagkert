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
- **Feladatok:** vonalkövetés, számok, nagybetűk és szavak átírása, útvesztő, pöttyösszekötő, számolás 20-ig, összeadás/kivonás, formák, színek és téri viszonyok,
  gondolkodtató feladatok (sorminta, kakukktojás, ellentétek, párok, „Mi tűnt el?", memória), hangok és rímek
  (szótagtaps, rím, kezdő- és véghang, betű), zene (harangok, feljebb–lejjebb, dallamív, ritmuskártyák, halk–hangos,
  hosszú–rövid, gyors–lassú, dallam-visszhang), állatetetés (a kert valódi 3D lakóját etetjük), testünk, időutazás,
  robotprogramozás (építés, ismétlés, hibakeresés, „Hová ér?", ha–akkor), rajz.
  Hét állomás feladatai sablonokból készülnek, állomásonként több száz (lásd lent).
- **Jutalomjátékok:** Unikornis-futás, Felhővár-verseny, szabad futás procedurális világban, hami-adagoló (3D cica),
  cica-etetés, Barátom (fésülés, simogatás, labdázás), unikornis-öltöztető (ajándékokkal), buborékpukkasztás.
- Nincs build lépés: sima HTML + ES modulok + three.js (`vendor/`). GitHub Pages-en fut. A haladás csak az eszközön tárolódik.

## Tananyag és sorrend

Az M4 mérföldkő harmadik része folyamatban: **7 állomás generált** (a 8 generálhatóból); a Rajzasztal következik.

| Állomás | Önálló feladat | Készség |
|---|---:|---:|
| Számoló rét | 758 | 10 |
| Formák és színek | 304 | 11 |
| Okoskodó | 407 | 8 |
| Hangok háza | 618 | 7 |
| Zenevár | 293 | 7 |
| Robotpálya | 464 | 6 |
| Ceruzavár | 259 | 9 |

- **Sablonok** (`js/content/`): egy sablon egy feladatfajta; a „cél" az, ami a választ meghatározza (darabszám, minta,
  tárgy). Egy önálló feladat egy (sablon, cél) pár: a tárgy fajtája, a színe, a rossz válaszok és a sorrend díszítés,
  nem új feladat. Minden sablonhoz tartozik egy gépi megoldó, amely a gyerek által látott képből számolja ki a választ.
- **Ütemező** (`js/scheduler-core.js`, `js/scheduler.js`): állomásonként öt nehézségi szint; 3 elsőre sikerült feladat
  után feljebb, 2 segítséggel megoldott után lejjebb lép; egy tévedés semleges. A sikerült feladat 1, 3, 7, 14 nap múlva
  tér vissza, a készségek és az állomások váltakoznak. **Ezek a számok saját kiinduló beállítások**, nem kutatásból
  átvett értékek; az indoklás és a források: [`docs/pedagogia.md`](docs/pedagogia.md).
- **Ceruzavár**: a vonalat ceruzával vagy ujjal kell követni, hibajelzés nélkül; vonalnál bármelyik végéről, számnál,
  betűnél és szónál a zöld pöttytől, a számozott sorrendben. A betűformák saját összeállítások: a feladat-galéria
  betűlapján (`tests/gallery.html?st=ceruza`) átnézhetők.
- **Rozi mondatai** (`js/lines.js`): melegebb, kevesebb csillag-emlegetés, több közös felfedezés; a gyerek nevét néha
  kimondja, ha meg van adva (a név csak az eszközön tárolódik).
- **A régi feladatok**: a generált állomások régi, kézzel írt feladatai kikerültek; aki azokból sokat megoldott, az új
  feladatoknál egy szinttel feljebb kezd. A tény-állomások javítandó feladatainak nagy részét az átnézés szerint
  javítottam (például „Mivel hallunk?" került a félreérthető „Mi folyik az ereinkben?" helyére); ezek az állomások az
  M6-ban kapnak szülő által átnézett ténytáblát. Hogy a 61 javítandó régi feladatból mi lett (javítva, kivéve, nyitott),
  az a [`docs/pedagogia.md`](docs/pedagogia.md) 6. részében áll.

## Hang

- Minden játékhang egyetlen közös hangmotoron megy át (`js/audio.js`): hangerő, kompresszor, torzítás elleni védelem.
- A beszéd és a játékhangok hangereje külön állítható a szülői sarokban (bal alsó ⚙ gomb, 3 mp-ig nyomva tartva).
- Ha a zene nem szól, de Rozi beszél: kapcsold ki az iPad néma módját, és hangosítsd fel.
- Ha nincs magyar hang: Beállítások → Kisegítő lehetőségek → Felolvasott tartalom → Hangok → Magyar.

## Szabad futás és a többi jutalomjáték

- **Irányítás:** egy rövid koppintás oda küldi az unikornist, és addig fut, amíg oda nem ér (ha valami útját állja,
  egy idő után megáll). A lent tartott ujjat követi; ha az ujj felemelkedik, megáll. Két ujj vagy a tenyér nem zavarja
  össze: mindig a legutóbb letett ujj irányít, Apple Pencil mellett a tenyér nem számít.
- **Ugrás:** a kis köveket és rönköket magától átugorja, a tetejükre is fel tud ugrani. A fák kerülhetők, nem lehet
  beléjük ragadni; ha egy lomb a kamera elé kerül, összemegy, hogy az unikornis látsszon.
- **Barátok:** akinek köszönsz (odafutsz hozzá), veled jön; egyszerre legfeljebb négyen, sorban, egymást kikerülve.
  A követő barát nem tűnik el, akármilyen messzire futsz.
- **Hangok:** patadobogás, ugrás, érkezés, koccanás; a versenyben visszaszámlálás, rajt és ujjongás. A verseny végén a két
  unikornis egymás felé fordul és együtt ugrál, akárki nyert; aki másodiknak ér be, az is dicséretet kap.
- **A jutalomidő vége szelíd:** egy perccel előtte 🌅 jelzés és egy mondat („Még egy kicsit játszunk…"). Ha épp fut egy
  verseny vagy egy unikornis-futás kör, megvárja a végét (legfeljebb 45 mp-ig), aztán egy búcsúkártya jön, és a kert magától visszatér.
- **Unikornis-futás (Sparkhorn):** amíg tölt, „Töltődik…" kártya látszik; ha nincs internet, Rozi szól, és van „Újra" gomb.
  A játék a saját repójában él (`sparkhorn-sprint`): a three.js helyben van, a kezdőképernyőn és a kör végén magyarul
  beszél, a hangjai a Csillagkert hangjaihoz mérve szólnak, és követik a szülői hangerőt.

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
  függetlensége, két megnyitott lap, mentés fájlba és visszatöltés, hibás fájl elutasítása, az ütemező állásának ellenőrzése).
- Generált feladatok: `node --test tests/generated.test.mjs` (állomásonként legalább 250 önálló feladat, szintenként
  legalább 10; pontosan egy helyes válasz; nincs ismétlődő kép vagy név; a helyes válasz helye egyenletes; minden válasz
  valahol helyes is; a gépi megoldó mindet megoldja; a kimondott szövegben nincs számjegy, jel vagy emoji, egy mondat
  legfeljebb 12 szó).
- Ütemező: `node --test tests/scheduler.test.mjs` (300 feladatos szimuláció ismétlés nélkül, 90 szimulált
  gyereknél is: 5–7 évesek, gyenge–erős; szintlépés és visszalépés; kezdőnek csak a szintjéhez illő készség, egy állomás
  a bevezető készséggel kezd; ismétlési napok; gyakorló feladatok).
- Feladat-galéria: `http://localhost:8080/tests/gallery.html?st=okos` (vagy `szamol`, `forma`, `hang`, `zene`, `algo`) – sablononként és
  szintenként egy minta kicsinyítve, a helyes válasz zöld keretben. Nem szól és nem ír a mentésbe.
- Böngészős füstteszt: `http://localhost:8080/tests/smoke.html` (hangerő-mérés, a jó válasz helye, megszakítás utáni csend,
  minden feladattípus elindul, a kert lakói és rajzolási terhe, a tópart és a tanya, koppintás minden barátra,
  etetés a 3D állattal minden úton, a tanyáról is). A füstteszt memóriában élő tárolóval fut, a valódi mentéshez nem nyúl.
  Csak egy részét is lehet futtatni: `?only=games` (szabad futás és jutalomjátékok), `?only=generated` (a gépi megoldó
  minden sablon minden szintjén a valódi feladatot oldja meg), vagy `?only=` és egy tesztnév-részlet.
- Szabad futás (a füstteszt része): egy futó-robot három különböző világban 2000 egységet tesz meg; nem ragadhat be,
  nem futhat bele fába, a követő barátok nem tűnhetnek el, és a világ széle nem látszhat. Ellenőrzi a koppintást,
  a tartott ujjat, a két ujjat, a tenyeret, az ugrást, a rajzolási terhet és a 3D-jelenet felszabadítását is.
- Jutalomjátékok (a füstteszt része): mindegyik elindul és kilép; kilépés után nem marad 3D-jelenet, hang-kontextus,
  időzítő és beszéd; a hangjaik a közös hangmotoron szólnak.
- A jutalomidő vége: `node --test tests/reward-timer.test.mjs` (figyelmeztetés, a futó verseny kivárása, türelmi idő).
- Állatgaléria: `http://localhost:8080/tests/characters.html` (`?kind=cow`, `?page=2`, `?wave=1`, `?side=1`) – minden faj
  egyenként, a mért és a táblázatban álló magassággal.
- A barátok egyetlen közös, példányosított hálócsomagból rajzolódnak (`js/three/characters.js`): a teljes kert
  19 baráttal 12–30 rajzolási hívás. Háromszögből 300 csillagnál (300 virággal) kb. 194 ezer van; a tervben szereplő
  kb. 150 ezres keretet ez a sok virág miatt átlépi. A teszt saját határa 250 ezer; az iPades próbán érdemes figyelni, nem lassul-e.
