# A Csillagkert pedagógiai alapjai

Ez a leírás azt mutatja meg, mire épül a feladatok sorrendje és nehezedése, hogy egy szülő vagy egy óvodapedagógus
át tudja nézni. **A játék nem mér és nem diagnosztizál**, nem helyettesíti a szakember véleményét. A szintek a
feladatok nehézségét jelölik, nem a gyerek fejlettségét.

Minden forrásnál jelölöm, hogyan ellenőriztem (2026. november 12-én):
**[teljes szöveg]** = az eredeti szöveget olvastam (letöltve, vagy a nyílt hozzáférésű teljes szöveget);
**[kivonat]** = a tanulmány kivonatát olvastam (Europe PMC vagy egyetemi adattár), a teljes szöveget nem;
**[másodlagos]** = csak a bibliográfiai adatokat és más szerzők összefoglalóit ismerem, az eredetit és a kivonatot nem
olvastam. A **saját beállítás** jelzésű számok az én döntéseim az elvek alapján, nem kutatásból átvett értékek: a
tapasztalat szerint hangolandók.

Állapot: az M4 második harmada. Generált állomás: **Számoló rét, Formák és színek, Okoskodó, Hangok háza, Zenevár,
Robotpálya**. A Ceruzavár és a Rajzasztal az M4 harmadik részében készül. A tény-állomások
(Világunk, Egészség, Testünk csodái, Időutazás, Állatok, Szívkert) kézzel írt, a szülő által átnézett ténytáblát
kapnak az M6-ban.

---

## 1. A keret: a DIFER

A DIFER (Diagnosztikus fejlődésvizsgáló rendszer) 4–8 éves gyerekek iskolakezdéshez kritikus alapkészségeit írja le.
Az Oktatási Hivatal leírása szerint ez a hét készség: *írásmozgás-koordináció, beszédhallgatás, relációszókincs,
elemi számolás, tapasztalati következtetés, tapasztalati összefüggés-megértés, szocialitás*
([oktatas.hu](https://www.oktatas.hu/kozneveles/meresek/difer/difer_leiras), [teljes szöveg]). A második készséget
az Oktatási Hivatal oldala *beszédhallgatás* néven írja, a DIFER-rel dolgozó kutatók tanulmánya (Józsa és Fazekasné
Fenyvesi, 2006) és a játék terve *beszédhanghallás* néven: „a beszédhangok differenciálásának készsége". A tesztek a
készség fejlettségi szintjét mutatják; ugyanez a tanulmány a szinteket így nevezi: *előkészítő, kezdő, haladó,
befejező, optimális* [teljes szöveg]. (Egy egyetemi oktatói oldal szerint a rendszer Nagy József vezetésével készült;
ezt csak egy részben olvasható összefoglalóból láttam, [másodlagos].)

**Hogyan használja a játék**: területenként (állomásonként) öt nehézségi szintet használ, mert a DIFER is
készségenként, nem összesítve nézi a fejlődést. A játék szintjei *nem* a DIFER mérőskálái (azok százalékos
teljesítményhatárok); csak a gondolatot veszi át: területenként külön szint, és a kitűzött cél a biztos, „optimális"
használat.

| DIFER-készség | Állomás a játékban |
|---|---|
| elemi számolás | Számoló rét |
| relációszókincs (alatt, között, több, legnagyobb…) | Formák és színek (téri viszonyok, méret), Számoló rét (több, kevesebb, előtte, utána) |
| tapasztalati következtetés, összefüggés-megértés | Okoskodó (sorminta, kakukktojás, csoportosítás, analógia) |
| beszédhallgatás | Hangok háza |
| írásmozgás-koordináció | Ceruzavár (M4/3) |
| szocialitás | Szívkert (M6) |

---

## 2. Az ütemező: melyik feladat jön?

A szabályok a `js/scheduler-core.js` fájlban vannak, Node-tesztekkel (`tests/scheduler.test.mjs`).

### 2.1 Az elvek és a forrásaik

| Elv | Forrás | Mit jelent a játékban |
|---|---|---|
| **Magas sikerarány** | Rosenshine (2012): a gyakorlás közbeni optimális sikerarány „about 80 percent" [teljes szöveg] | A gyerek a feladatok nagy részét elsőre megoldja. Ha a sikerarány leesik, több könnyebb feladat és több ismétlés jön; ha nagyon magas, több kihívás. |
| A „85%-os szabály" csak tájékozódási pont | Wilson, Shenhav, Straccia, Cohen (2019): gradiens-alapú tanuló algoritmusoknál kb. 85% pontosság mellett a leggyorsabb a tanulás; mesterséges neurális hálókon és egy majmok észlelési tanulását leíró modellen mutatták meg [teljes szöveg]. A szerzők maguk írják, hogy az oktatásban az optimális nehézséget tapasztalati úton határozzák meg, és sok tényezőtől függ | Nem törvény: csak azt erősíti meg, hogy a túl könnyű és a túl nehéz feladat is lassítja a tanulást. |
| **Elosztott ismétlés** | Cepeda, Pashler, Vul, Wixted, Rohrer (2006): 317 kísérlet metaanalízise az elosztott gyakorlásról; minél később kell emlékezni, annál nagyobb ismétlési köz adja a legjobb megtartást [kivonat] | A sikerült feladat napokkal később visszatér, egyre nagyobb közökkel. |
| **Kevert gyakorlás** | Rohrer és Taylor (2007): egy hét múlva a vegyesen kevert matematikai gyakorlás után sokkal jobb volt az eredmény, mint a típusonként tömbösített után [kivonat] | Egy állomáson belül a készségek váltakoznak, és az állomások is váltakoznak (nincs öt számolás egymás után). |
| **Állványozás (segítség-létra)** | Wood, Bruner, Ross (1976): a felnőtt annyi segítséget ad, amennyivel a gyerek egyedül még el nem érhető feladatot is meg tud oldani [másodlagos] | Első tévedés: megnevezi, amit a gyerek választott, és kedvesen újra kérdez. Második tévedésnél egy tanító mondat jön, és egy rossz válasz eltűnik. A segítséggel megoldott feladat nem büntet, csak a következő feladatot hangolja. |
| **Tanulási pályák** | Clements és Sarama (2004): a tanulási pálya egy matematikai cél, egy fejlődési út és a lépcsőfokokhoz illő feladatok együttese [másodlagos] | Minden készségnek van egy belső sorrendje (lásd 3. rész); a szint a lépcsőfokot jelöli. A konkrét sorrendek a 3. részben az én összeállításaim. |

### 2.2 A szabályok és a számok (mind saját beállítás)

| Szabály | Érték | Megjegyzés |
|---|---|---|
| Kezdőszint | 5 évesen 1, 6 évesen 2, 7 évesen 3 | Saját beállítás. Aki a régi (1.0-s) feladatokból egy állomáson legalább 8-at megoldott, ott a 2. szinten kezd. |
| Szintlépés | 3 elsőre sikerült feladat a gyerek szintjén | Saját beállítás. Ha egy készség legnehezebb feladata a gyerek szintje alatt van, az is számít (különben egy rövid készség-létra megakasztaná a lépést). |
| Visszalépés | 2 olyan feladat, amelyet csak segítséggel (két tévedés után) oldott meg | Saját beállítás. |
| Egy tévedés, aztán magától jó | semleges | Saját beállítás: nem lép feljebb, de az addigi sikersorozat sem vész el. Egy ötévesnél egy elcsúszott koppintás nem jelent tudáshiányt. |
| Gyakorló feladat (memória, vonal, rajz) | 3 befejezés a gyerek szintjén = szintlépés, visszalépés nincs | Saját beállítás: itt nincs „rossz" válasz. |
| Ismétlés | elsőre sikerült: 1, 3, 7, 14 nap múlva; tévedés után: másnap | Saját beállítás a Cepeda-féle elv alapján (a konkrét napok nem a tanulmányból vannak). |
| Ismétlések aránya | 30%, ha a sikerarány legalább 70%; különben 45% | Saját beállítás. |
| Kihívás és bemelegítés | 90% fölött 35% eséllyel egy szinttel nehezebb; 70–90% között 20% nehezebb, 15% könnyebb; 70% alatt nincs nehezebb, 40% könnyebb | Saját beállítás. A sikerarányt az utolsó 20 értékelt feladatból számolja (5 alatt 80%-ot feltételez). |
| Melyik készség jöhet | csak az, amelyiknek a legkönnyebb feladata legfeljebb egy szinttel van a gyerek szintje fölött | Saját beállítás: kezdőnek így nem jön bontás vagy sorszám, amíg a számolás alapjai nem mennek. |
| Készség-választás | a szintjéhez illők közül a legrégebben gyakorolt | Kevert gyakorlás. |
| Feladat-választás | a még nem látott közül véletlenszerűen; ha a gyerek szintjén mindet látta, a legközelebbi szint (legfeljebb eggyel nehezebb) még nem látott feladata; különben a legrégebben látott | Egy 300 feladatos szimulációban nincs ismétlődő feladat (teszt). |
| Állomás-váltás | nem az utolsó kettő közül, a három legrégebben látogatott egyike | Saját beállítás. |
| Etetés | minden 2–3. feladat | Az 1.0-ból megtartva. |

### 2.3 Mi számít „egy feladatnak"?

A 250-es kapu nem az egyedi azonosítókat számolja, hanem az önálló **(sablon, cél)** párokat. A cél csak az, ami a
választ meghatározza (például a darabszám, a számhármas, a minta típusa); a tárgy fajtája, a színe, az eltérítők és a
sorrend díszítés, nem új feladat. Állás: Számoló rét **758**, Formák és színek **304**, Okoskodó **407**, Hangok háza
**618**, Zenevár **293**, Robotpálya **464** önálló feladat (`tests/generated.test.mjs`). A Zenevárban a feljebb vagy
lejjebb ugyanúgy szóló (transzponált) dallam nem új feladat; a Robotpályán az eltolt vagy nagyobb pályán ugyanaz a
program sem.

Minden generált feladatra automatikus ellenőrzés fut: pontosan egy helyes válasz; nincs ismétlődő válasz; a helyes
válasz helye egyenletes; minden válasz valahol helyes is; a kimondott szövegben nincs számjegy, jel vagy emoji; a
gépi megoldó a gyerek által látott képből számolja ki a választ (`tests/generated.test.mjs`), és a böngészőben a
valódi feladatot is megoldja (`tests/smoke.html`).

---

## 3. Állomásonként

### 3.1 Számoló rét (17 sablon, 10 készség)

**Mire épül**: a számlálás öt alapelve (egy-egy megfeleltetés, állandó sorrend, a tőszám elve, absztrakció, a
sorrend közömbössége; Gelman és Gallistel, 1978 [másodlagos]); a korai matematika tanulási pályái (Clements és
Sarama, 2004 [másodlagos]); a számegyenes-szerű lineáris számjátékok hatása a számbecslésre (Siegler és Ramani, 2008:
négy 15 perces játék eltüntette a különbséget, a színes, szám nélküli változat nem [kivonat]); a konkrét → képi →
jelképes út (Bruner nyomán; ezt a forrást nem ellenőriztem).

**Sorrend**: megszámlálás → ránézéses felismerés → mennyiségek összevetése → szám és mennyiség párosítása → számsor
→ összeadás és kivonás tárgyakkal → bontás → sorszám. **Mindig tárggyal kezd**: minden számkártya alatt pöttyök
vannak, a számjegy csak mellettük jelenik meg.

| Készség | Sablonok | Szintek | Mi nehezedik |
|---|---|---|---|
| megszámlálás | koppintós számolás | 1–4 | 1–5, 6–10, 11–15, 16–20 |
| ránézéses felismerés | dobókocka, tízes keret | 1–3 | kocka 1–3, 4–6; tízes keret 1–5, 6–10 (az ötös tagolás segít) |
| mennyiség | „melyik képen van hét?", ugyanannyi (párosítás) | 1–3 | 1–5, 6–10, 11–15 |
| összevetés | legtöbb, legkevesebb | 1–4 | kis számok bármilyen különbséggel → nagyobb számok nagy, majd kis különbséggel |
| számok | legnagyobb, legkisebb szám | 2–5 | tízig nagy különbség → tízig szomszédos → húszig nagy → húszig szomszédos |
| számsor | utána, előtte, között, hiányzó szám | 2–4 | ötig, tízig, húszig |
| összeadás, kivonás | tárgyakkal | 2–5 | ötig, tízig, húszig tízes átlépés nélkül; **tízes átlépés csak az 5. szinten** (első osztályos anyag) |
| bontás | „hány bújt el a doboz alá?" | 3–4 | ötig, tízig |
| sorszám | „ki a harmadik a zászlótól?" | 3–5 | öt-, hét-, tízelemű sor |

### 3.2 Formák és színek (16 sablon, 11 készség)

**Mire épül**: a DIFER relációszókincs-területe (téri viszonyok, méret- és mennyiségviszonyok; a forrásból csak a
készség nevét ellenőriztem). A formák sorrendje (előbb a jellegzetes alak, aztán a hasonló alakok megkülönböztetése és
a tulajdonságok, például a sarkok) **az én összeállításom**, ehhez forrást nem ellenőriztem. A formák saját rajzolt
képek, nem emojik, mert az emoji eszközönként másképp néz ki.

| Készség | Szintek | Mi nehezedik |
|---|---|---|
| formák | 1–5 | kör, háromszög, négyzet → téglalap, csillag, szív → ovális, rombusz → ötszög, hatszög; a hasonló párok megkülönböztetése (kör–ovális a 4., négyzet–téglalap, ötszög–hatszög az 5. szinten) |
| színek | 1–5 | alapszínek → további színek → színkeverés (piros és sárga: narancs…) |
| tárgy színe | 1–3 | „milyen színű a répa?" csak olyan tárgy, aminek egy jellemző színe van; a kép szürke, hogy ne árulja el |
| szín és forma együtt | 2–4 | két tulajdonság egyszerre („a piros négyzet"), a megtévesztő válasz csak az egyikben tér el |
| hány forma? | 2–5 | egy fajta → több fajta közül egyet számolni |
| sarkok | 3–5 | „hány sarka van?", „melyiknek nincs sarka?" |
| téri viszonyok | 1–5 | fölött, alatt → mellett (bal, jobb) → között; jelenet-rácson, a rossz válasz soha nem „lazán igaz". A bal oldalhoz testi kapaszkodó: „Tedd a kezed a szívedre: az a bal oldalad." |
| torony | 1–5 | alulról, felülről számolt hely, egyre magasabb toronyban |
| méret | 1–5 | nagy, kicsi → hosszú, magas, vastag → középső |
| irány | 2–4 | fel, le → balra, jobbra |
| árnyék | 2–5 | formák és állatok árnyéka; hasonló alakok egymás mellett |

### 3.3 Okoskodó (8 sablon, 8 készség)

**Mire épül**: a DIFER tapasztalati következtetés és összefüggés-megértés területe (a forrásból csak a készségek
nevét ellenőriztem); a Piaget-féle osztályozási és sorba rendezési feladatok hagyománya és a végrehajtó funkciók (munkamemória)
gyakorlása [másodlagos, általános szakirodalmi háttér, forrást ehhez nem ellenőriztem].

| Készség | Szintek | Mi nehezedik |
|---|---|---|
| sorminta | 1–5 | AB → ABC, AAB → ABB, AABB → ABCD, ABAC → ABCB; képpel vagy színnel. A rossz válaszok a mintából jönnek, ezért kizárással nem oldható meg. |
| kakukktojás | 1–5 | távoli csoportok (gyümölcs és jármű) → közeli csoportok (gyümölcs és zöldség, háziállat és vadállat) |
| csoportosítás | 1–3 | ismert csoportok → ritkább csoportok (szerszám, rovar, hangszer) |
| ellentétek | 2–4 | meleg–hideg, nagy–kicsi → nehéz–könnyű, édes–savanyú → világos–sötét, idős–fiatal. A rossz válasz olyan kép, amire a kérdezett szó összehasonlításban sem illik; a válaszok nevét nem olvassa fel, mert a név elárulná a megoldást („csukott könyv"). |
| párosítás | 1–3 | kulcs–lakat, zokni–cipő → ecset–festék, levél–postaláda; a félreérthető párok nem kerülnek egymás mellé |
| analógia | 4–5 | „a tyúk tojást ad, mit ad a tehén?"; ki hol él |
| „Mi tűnt el?" | 1–5 | 3, 4, 5 kép, a hely látszik → 4–6 kép összekeverve; a rossz válaszok nem is voltak a képen |
| memória (gyakorló) | 1–5 | 3–6 pár témás paklikból; a kártya neve felfordításkor elhangzik (szókincs) |

### 3.4 Hangok háza (7 sablon, 7 készség)

**Mire épül**: a DIFER beszédhallgatás (beszédhanghallás) területe (a forrásból csak a készség nevét ellenőriztem), és a
fonológiai tudatosság szokásos sorrendje: előbb a nagyobb egységek (szótag, rím), aztán az egyes hangok (kezdőhang,
véghang), végül a betű. Ehhez a sorrendhez ebben a részben forrást nem ellenőriztem; a szintek beosztása **saját
döntés**. A feladatok nem DIFER-tesztek, és nem is utánozzák azokat.

**A szóbank** 132 képes szó. A szótagokat, az első és az utolsó hangot a program számolja ki a szóból, és teszt
ellenőrzi: magyarul egy szótag egy magánhangzó; a kétjegyű betű (cs, sz, zs, gy, ny, ty, dz, dzs) egy hang; a
szótag-határ a kiejtés szerinti (ma-ci, al-ma). Ugyanaz a kép mindenhol ugyanazt a nevet kapja, mint a többi
állomáson (a 🐻 maci, nem medve).

| Készség | Szintek | Mi nehezedik |
|---|---|---|
| szótag-taps | 1–3 | egy-két szótagos szó → három → négy és több szótag; a pöttyök csak tapsolás közben jelennek meg, előre nem árulják el a választ |
| melyik szó hosszabb? | 2–4 | a leghosszabb szót kell megtalálni: két szótagos → három → négy és több szótagos; a többi szó mindig rövidebb |
| azonos első szótag | 2 | „Melyik kezdődik úgy, mint a ma-ci?" |
| rím | 2–3 | zárt utolsó szótag (majom–citrom) → nyitott (cica–katica). A rossz válasz utolsó magánhangzója és utolsó hangja is más, ezért a „majdnem rím" (kés–kéz) nem lehet megtévesztő válasz |
| kezdőhang | 3–4 | magánhangzók és kitartható hangok (m, n, s, sz, l, r, f, v, h, j…) → a többi (p, t, k, b, d, g, cs…). A rossz válasz soha nem a hasonló hang (b–p, d–t, s–sz, a–á) |
| véghang | 4–5 | magánhangzó a szó végén → mássalhangzó |
| betű és hang | 5 | a nagy betű látszik, Rozi kimondja a nevét („Ez az M betű"), a gyerek a vele kezdődő képet keresi |

**Szülőnek érdemes meghallgatni** (az iPad felolvasóján múlik, asztalról nem ellenőrizhető): a szótag-tapsnál Rozi
külön szótagokat mond („e, le, fánt"), a betű-feladatnál a betű nevét („az Ny betű"). Ha valamelyik furcsán szól,
azt jelezni kell. A **mondóka-kiegészítés** a tervben szerepelt, de nem készült el: ehhez ellenőrzött szövegforrás kell.

### 3.5 Zenevár (9 sablon, 7 készség)

**Mire épül**: a Kodály-koncepció sorrendje (a szó–mi hangközzel kezd, aztán jön a lá, a dó és a ré; a fá és a ti
később; [Wikipédia: Kodály method](https://en.wikipedia.org/wiki/Kod%C3%A1ly_method), Choksy alapján, [másodlagos]).
**Csak viszonyított hallás**: soha nem kéri, hogy a gyerek egy hangot magában megnevezzen; a harangok előbb a nevükkel
együtt szólnak, és a kérdés mindig összevetés („melyik szólt a végén?", „feljebb vagy lejjebb?"). A szintek beosztása
**saját döntés**. A ritmuskártyák saját jelek (nagy kör = tá, két kis kör = ti-ti, szaggatott kör = szün), nem a
Kodály-féle ritmusírás.

| Készség | Szintek | Mi nehezedik |
|---|---|---|
| melyik harang? | 2–5 | szó, mi, lá → dó, mi, szó és mi, ré, dó → négy, majd öt harang |
| merre ment a hang? | 1–5 | nagy ugrás → kisebb hangköz → egy lépés (szekund) → félhang (mi–fá, ti–dó) csak az 5. szinten; „ugyanaz" is lehet a válasz |
| dallamív | 2–4 | három hang: felfelé lépcső, lefelé lépcső, domb vagy völgy; szó–mi–lá → dó-val → ré-vel |
| ritmus | 2–4 | négy ütés tá és ti-ti → több ti-ti → egy szünet (szün) |
| melyik a legmagasabb / legmélyebb? | 1–5 | három harang egymás után; oktáv különbség → egyre kisebb, végül félhang |
| hangerő, hossz, tempó | 1–4 | „melyik a leghangosabb / leghalkabb, leghosszabb / legrövidebb, leggyorsabb / leglassabb?": nagy különbség → kisebb különbség (a harmadik harang a kettő között szól). A hangerő-fokozatok különbségét a hangmotor után mértük (hangos és halk között legalább 9 dB) |
| dallam-visszhang | 1–5 | a gyerek a harangokon visszajátssza: két-három hang szó–mi → lá → dó, ré → öt hang (dó, ré, mi, szó, lá) |

A hallásos feladat előtt laponként egyszer **hallás-próba** jön („Hallod a csengőt?"); ha a gyerek nem hallja, Rozi
egy felnőttet kér (hangerő, néma mód). Tévedés után a hangsor újra szól; a visszhangnál a második tévedés után a
harangok is felvillannak, a harmadik után közösen játsszák.

### 3.6 Robotpálya (6 sablon, 6 készség)

**Mire épül**: a korai programozás szokásos fogalmai (sorrend, ismétlés, hibakeresés, feltétel). Ehhez a részhez
forrást nem ellenőriztem; a sorrend és a szintek **saját összeállítás**. A robot **abszolút irányokban** lép (fel,
le, balra, jobbra), nem fordul el, így egy ötéves a képernyőn követheti.

| Készség | Szintek | Mi nehezedik |
|---|---|---|
| programépítés | 1–5 | egyenes út → egy forduló → virágok kerülgetése (legalább két forduló vagy kerülő), legfeljebb nyolc lépés |
| ismétlés (×2, ×3) | 3–5 | kevesebb hely van a programban, mint ahány lépés kell, ezért az ismétlés gomb kell; egyenes → forduló → virágok közt |
| hibakeresés | 2–5 | hiányzik az utolsó lépés → egy fölösleges lépés; a robot épp a hibás lépésnél ütközik meg, és az a lépés kap jelet |
| hová ér a robot? | 1–5 | egy-két nyíl → forduló → négy nyíl → ismétléses program. A többi gyümölcs nem esik a robot útjába, így nem kétértelmű, hol áll meg |
| melyik program jó? | 2–5 | három program, pontosan egy ér a csillaghoz; a többi máshová ér, és a csillagon át sem megy |
| ha–akkor | 2–5 | két, három, négy szabálykártya (szín → nyíl); az 5. szinten két jel egymás után |

A pályákat rögzített magból sorsolja a program (minden betöltéskor ugyanazok), és egy teszt minden pályát megold. A
2. tévedés után megmutatott és a 3. után együtt megépített program a legegyszerűbb megoldás (a legkevesebb
gombnyomás), és teszt ellenőrzi, hogy elfér a program helyein.

---

## 4. Rozi mondatai (monológ-könyvtár)

A mondatok a `js/lines.js` fájlban vannak; szándékonként legalább hat változat, és az utolsó néhány nem ismétlődik.

- **Jó válasz**: egy rövid dicséret és **egy teljes, igaz állítás** (nem a kérdés ismétlése). A dicséret az
  igyekezetet is elismeri, nem csak az eredményt (Carol Dweck munkássága nyomán; ezt a forrást nem ellenőriztem).
- **Első tévedés**: megnevezi, amit a gyerek választott („A méz édes."), és kedvesen, röviden újra kérdez, büntetés
  nélkül.
- **Második tévedés**: újra megnevezi a választását, egy tanító mondat következik („A meleg ellentéte a hideg."), és egy
  rossz válasz eltűnik.
- **Hangnem**: kevesebb szó a csillaggyűjtésről, több közös felfedezés („nézzük meg együtt, fedezzük fel a számok
  világát"). A gyerek nevét néha kimondja, ha a szülő megadta (a név csak az eszközön tárolódik).
- A generált feladatokban egy kimondott mondat legfeljebb 12 szó, a kézzel írt tények legfeljebb kb. 70 betűsek,
  mert a hosszú mondatot a felolvasó levághatja (mindkettő teszt).

---

## 5. Ami még hátra van, és amit nem tudunk

- **Még nem generált** (M4/3): Ceruzavár, Rajzasztal. (A Zenevár Kodály-sorrendjének forrása: a gyakorlatok a kis
  terccel, a szó–mi hangközzel kezdenek, aztán egyenként jön a lá, a dó és a ré; a fá és a ti csak később, mert a
  félhangot a gyerekek nehezen éneklik tisztán; [Wikipédia: Kodály method](https://en.wikipedia.org/wiki/Kod%C3%A1ly_method),
  Choksy: *The Kodály Method I*, 1999, 9–12. o. alapján, [másodlagos].)
- **A Robotpálya régi feladatai**: a hét régi pálya helyett generáltak jöttek. A szendvics-sorrend (hétköznapi
  sorrend) és a „Ha sötét van a szobában…" kérdés most kimarad, az M6 ténytábláiban (Egészség, Világunk) térhet
  vissza; a „Hány taps lesz összesen?" számolást a Számoló rét, a színes sormintát az Okoskodó sorminta-feladatai
  fedik le.
- **Szívkert** (M6): a szociális-érzelmi tanulás öt területe (CASEL: önismeret, önszabályozás, társas tudatosság,
  kapcsolati készségek, felelős döntéshozatal [másodlagos, CASEL-t idéző oldalak alapján; a CASEL saját oldalán
  ellenőrizendő]).
- **A számok hangolandók**: a 2.2 táblázat minden értéke saját kiinduló beállítás. A szülő tapasztalata (túl könnyű?
  túl nehéz? unalmas?) alapján változhatnak.
- **Amit asztali gépről nem lehet ellenőrizni**: az iPad felolvasójának kiejtése és ritmusa, az érintés
  pontossága, és az, hogy egy adott gyereknek mi az érdekes. Néhány újabb emoji (🫘 mag, 🫧 hab, 🪥 fogkefe, 🫁 tüdő)
  csak frissebb iPadOS-en látszik; ha valamelyik helyén üres négyzet van, azt jelezni kell.

---

## 6. Az 1.0 feladatainak átnézése: mi lett a 61 javítandóval?

A tervezéskor mind a 136 régi feladatot átnéztük; 61-et jelöltünk javítandónak. Állapotuk az M4 első része után:

| Állomás | Javítandó | Mi lett velük |
|---|---:|---|
| Számoló rét | 7 | kivéve, a generált feladatok váltják ki (a tízes átlépés csak az 5. szinten, a számok alatt pöttyök, mindig legalább három válasz) |
| Formák és színek | 7 | kivéve, a generált feladatok váltják ki (saját rajzolt formák, jelenet-rács, egyértelmű színek) |
| Okoskodó | 3 | kivéve, a generált feladatok váltják ki (a sorminta rossz válaszai a mintából jönnek, a memória kimondja a kártyák nevét) |
| Állatetetés | 4 | javítva az M2a-ban (kutya, egér, maci, mókus) |
| Világunk | 5 | 4 javítva; **1 nyitott**: a „Melyik nap jön péntek után?" képei (lufi, táska, könyvek) önkényesek, az M6 ténytáblájában naptárcsíkkal |
| Egészség | 5 | 5 javítva (3 áthelyezés az M1-ben; a kézmosás képei és a fogkefe-kérdés rossz válaszai most) |
| Testünk csodái | 5 | 5 javítva (az „erek" helyett most „Mivel hallunk?", így a fül is lehet helyes válasz) |
| Időutazás | 5 | 4 javítva; 1 kivéve: a piramis (az emoji a háromszög jele), az M6-ban rajzolt képpel térhet vissza |
| Robotpálya | 5 | 5 javítva (áthelyezések és a „kétszer, háromszor" kiejtése korábban; a nyelvtan és a taps-tény az M4/1-ben); az M4/2-ben az egész állomás generált lett |
| Ceruzavár | 3 | 2 javítva korábban (a kör azonosítója, a név nélküli betű); **1 nyitott**: kilenc feladat ugyanazt az utasítást mondja → M4/3 |
| Hangok háza | 8 | kivéve, a generált feladatok váltják ki (a válaszok nevét Rozi kimondja, a kép látszik, a tapsolásnál nincs számjegy, sok rím-feladat) |
| Zenevár | 4 | kivéve, a generált feladatok váltják ki (nincs abszolút hallás: a harangok előbb a nevükkel szólnak; a hangnév mindig harang neve; a felirat „ti") |
| Rajzasztal | 0 | – |

Összesen: 29 kiváltva generált feladattal, 29 javítva, 1 kivéve, **2 nyitott** (1 az M6-ban, 1 a Ceruzavárral az
M4/3-ban).

---

## Forrásjegyzék

- Oktatási Hivatal: *A DIFER programcsomag leírása.* https://www.oktatas.hu/kozneveles/meresek/difer/difer_leiras
  [teljes szöveg]
- Józsa Krisztián és Fazekasné Fenyvesi Margit (2006): A DIFER Programcsomag alkalmazási lehetősége tanulásban
  akadályozott gyermekeknél, II. rész. *Gyógypedagógiai Szemle*, 2006/3, 161–176.
  https://epa.oszk.hu/03000/03047/00034/pdf/EPA03047_gyosze_2006_3_161-176.pdf [teljes szöveg]
- Szegedi Tudományegyetem, oktatói oldal: *DIFER = Diagnosztikus Fejlődésvizsgáló Rendszer.*
  https://www.staff.u-szeged.hu/~mlesz/difer [másodlagos: a szöveg csak részben volt olvasható]
- Rosenshine, B. (2012). Principles of Instruction: Research-Based Strategies That All Teachers Should Know.
  *American Educator*, 2012. tavasz, 12–19. és 39. o. https://www.aft.org/ae/spring2012/rosenshine [teljes szöveg]
- Wilson, R. C., Shenhav, A., Straccia, M., & Cohen, J. D. (2019). The Eighty Five Percent Rule for optimal
  learning. *Nature Communications*, 10, 4646. https://doi.org/10.1038/s41467-019-12552-4 (nyílt teljes szöveg:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC6831579/) [teljes szöveg]
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall
  tasks: A review and quantitative synthesis. *Psychological Bulletin*, 132(3), 354–380.
  https://doi.org/10.1037/0033-2909.132.3.354 [kivonat]
- Rohrer, D., & Taylor, K. (2007). The shuffling of mathematics problems improves learning. *Instructional
  Science*, 35, 481–498. Kivonat: https://digitalcommons.usf.edu/psy_facpub/1767/ [kivonat]
- Wood, D., Bruner, J. S., & Ross, G. (1976). The role of tutoring in problem solving. *Journal of Child Psychology
  and Psychiatry*, 17(2), 89–100. https://doi.org/10.1111/j.1469-7610.1976.tb00381.x [másodlagos: az adatbázisban
  nincs kivonata]
- Clements, D. H., & Sarama, J. (2004). Learning trajectories in mathematics education. *Mathematical Thinking and
  Learning*, 6(2), 81–89. https://doi.org/10.1207/s15327833mtl0602_1 [másodlagos]
- Siegler, R. S., & Ramani, G. B. (2008). Playing linear numerical board games promotes low-income children's
  numerical development. *Developmental Science*, 11(5), 655–661. https://doi.org/10.1111/j.1467-7687.2008.00714.x
  [kivonat]
- Gelman, R., & Gallistel, C. R. (1978). *The Child's Understanding of Number.* Harvard University Press.
  [másodlagos]
- Wikipédia: *Kodály method* (a hangok sorrendjéhez Choksy, L. (1999). *The Kodály Method I*, 9–12. o. alapján).
  https://en.wikipedia.org/wiki/Kod%C3%A1ly_method [másodlagos]
- CASEL: a szociális-érzelmi tanulás öt területe. https://casel.org [másodlagos]
