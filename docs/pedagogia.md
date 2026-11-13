# A Csillagkert pedagógiai alapjai

Ez a leírás azt mutatja meg, mire épül a feladatok sorrendje és nehezedése, hogy egy szülő vagy egy óvodapedagógus
át tudja nézni. **A játék nem mér és nem diagnosztizál**, nem helyettesíti a szakember véleményét. A szintek a
feladatok nehézségét jelölik, nem a gyerek fejlettségét.

Minden forrásnál jelölöm, hogyan ellenőriztem (2026. november 12–13-án):
**[teljes szöveg]** = az eredeti szöveget olvastam (letöltve, vagy a nyílt hozzáférésű teljes szöveget);
**[kivonat]** = a tanulmány kivonatát olvastam (Europe PMC vagy egyetemi adattár), a teljes szöveget nem;
**[másodlagos]** = csak a bibliográfiai adatokat és más szerzők összefoglalóit ismerem, az eredetit és a kivonatot nem
olvastam. A **saját beállítás** jelzésű számok az én döntéseim az elvek alapján, nem kutatásból átvett értékek: a
tapasztalat szerint hangolandók.

Állapot: az M4 kész. Generált állomás: **Számoló rét, Formák és színek, Okoskodó, Hangok háza, Zenevár,
Robotpálya, Ceruzavár, Rajzasztal**. A tény-állomások
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
| relációszókincs (alatt, között, több, legnagyobb…) | Formák és színek (téri viszonyok, méret), Számoló rét (több, kevesebb, előtte, utána), Rajzasztal (matrica: fölé, alá, rá, bele, mellé, balra, jobbra, közé) |
| tapasztalati következtetés, összefüggés-megértés | Okoskodó (sorminta, kakukktojás, csoportosítás, analógia) |
| beszédhallgatás | Hangok háza |
| írásmozgás-koordináció | Ceruzavár |
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
| Gyakorló feladat (memória, vonal, útvesztő, pöttyösszekötő) | 3 befejezés a gyerek szintjén = szintlépés; hibaszám nincs | Saját beállítás: itt nincs „rossz" válasz. |
| Szabad rajz | semleges: nem léptet és nem léptet vissza; a látott feladat számít | Saját beállítás: egy rajz befejezése nem mond semmit a tudásról. A rajz témája az állomás szintjét követi, amit a Rajzasztal többi feladata állít. |
| Elakadás gyakorló feladatnál | 6 másodperc tétlenség után felvillan a következő pont; ha a gyerek a segítség után sem halad tovább (kétszer egymás után 6 másodpercig nincs haladás), az egy vonal, útvesztő vagy pöttyösszekötő közben elakadás. Két elakadás után egy szinttel könnyebb jön, és a feladat másnap visszatér. Egyetlen segítség, vagy több rövid, egymástól független szünet egy hosszú feladatban semleges | Saját beállítás: a tévedés itt nem jel (a vonalról le lehet térni), a hosszú megakadás viszont az, hogy a feladat még nehéz. |
| Ismétlés | elsőre sikerült: 1, 3, 7, 14 nap múlva; tévedés után: másnap | Saját beállítás a Cepeda-féle elv alapján (a konkrét napok nem a tanulmányból vannak). |
| Ismétlések aránya | 30%, ha a sikerarány legalább 70%; különben 45% | Saját beállítás. |
| Kihívás és bemelegítés | 90% fölött 35% eséllyel egy szinttel nehezebb; 70–90% között 20% nehezebb, 15% könnyebb; 70% alatt nincs nehezebb, 40% könnyebb | Saját beállítás. A sikerarányt az utolsó 20 értékelt feladatból számolja (5 alatt 80%-ot feltételez). |
| Melyik készség jöhet | csak az, amelyiknek a legkönnyebb feladata legfeljebb egy szinttel van a gyerek szintje fölött; egy állomás első két feladata a bevezető készségekből jön (amelyik a legkönnyebb szinten kezdődik) | Saját beállítás: kezdőnek így nem jön bontás vagy sorszám, amíg a számolás alapjai nem mennek, és a Robotpályán a gyerek (idősebb is) előbb maga épít programot vagy előrejelez, csak utána jön hibakeresés vagy ismétlés. |
| Készség-választás | a szintjéhez illők közül a legrégebben gyakorolt; ha annak a gyerek szintje körül már nincs új feladata, a következő | Kevert gyakorlás. |
| Feladat-választás | a még nem látott közül véletlenszerűen; ha a gyerek szintjén mindet látta, a legközelebbi szint (legfeljebb eggyel nehezebb) még nem látott feladata; különben a legrégebben látott | Teszt: 90 szimulált gyerek (5, 6 és 7 évesek, gyenge, közepes és erős játékos, 10 véletlen kezdés) 300 feladatában nincs ismétlődő feladat. Egy 270 futásos próbán is 0 volt az ismétlés. A javítás előtt 20 futásban akadt, gyenge ötéveseknél, olyan készségeknél, amelyeknek a legkönnyebb szintjén kevés feladat van. |
| Állomás-váltás | nem az utolsó kettő közül, a három legrégebben látogatott egyike | Saját beállítás. |
| Etetés | minden 2–3. feladat | Az 1.0-ból megtartva. |

### 2.3 Mi számít „egy feladatnak"?

A 250-es kapu nem az egyedi azonosítókat számolja, hanem az önálló **(sablon, cél)** párokat. A cél csak az, ami a
választ meghatározza (például a darabszám, a számhármas, a minta típusa); a tárgy fajtája, a színe, az eltérítők és a
sorrend díszítés, nem új feladat. Állás: Számoló rét **758**, Formák és színek **304**, Okoskodó **407**, Hangok háza
**618**, Zenevár **293**, Robotpálya **464**, Ceruzavár **259**, Rajzasztal **266** (ebből 60 szabad rajz, lásd 3.8)
önálló feladat (`tests/generated.test.mjs`). A
Zenevárban a feljebb vagy lejjebb ugyanúgy szóló (transzponált) dallam nem új feladat; a Robotpályán az eltolt vagy
nagyobb pályán ugyanaz a program sem; a Ceruzavárban ugyanaz a vonal nagyobban, máshol vagy fordított irányban sem,
és ugyanaz az útvesztő-megoldás más zsákutcákkal sem.

Minden generált feladatra automatikus ellenőrzés fut: pontosan egy helyes válasz; nincs ismétlődő válasz; a helyes
válasz helye egyenletes; minden válasz valahol helyes is; a kimondott szövegben nincs számjegy, jel vagy emoji; a
gépi megoldó a gyerek által látott képből számolja ki a választ (`tests/generated.test.mjs`), és a böngészőben a
valódi feladatot is megoldja (`tests/smoke.html`). A Ceruzavárban a választós szabályok helyett ez fut: a vonalak
pontjai elég sűrűk, minden betű ismert, az útvesztő minden mezője elérhető és pontosan egy útja van, a pöttyök nem
esnek túl közel egymáshoz; a böngészős megoldó tollal (szimulált Apple Pencil-vonással) végigköveti a vonalat, végigvezeti
a cicát az útvesztőn, és sorban összeköti a pöttyöket. A Rajzasztalon: a rácsok megoldója a mintából, a fél képből,
a sor elejéből vagy a jelmagyarázatból számolja ki a képet; a matrica megoldója a mondat jelentéséből és a helyek
elhelyezkedéséből találja meg a jó helyet; a színező megoldója a kimondott mondatból veszi ki a részt és a színt, és
minden rész látható és koppintható (a böngésző saját találat-vizsgálatával is).

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
| hibakeresés | 3–5 | hiányzik az utolsó lépés → egy fölösleges lépés; a robot épp a hibás lépésnél ütközik meg, és az a lépés kap jelet |
| hová ér a robot? | 1–5 | egy-két nyíl → forduló → négy nyíl → ismétléses program. A többi gyümölcs nem esik a robot útjába, így nem kétértelmű, hol áll meg |
| melyik program jó? | 3–5 | három program, pontosan egy ér a csillaghoz; a többi máshová ér, és a csillagon át sem megy |
| ha–akkor | 3–5 | két, három, négy szabálykártya (szín → nyíl); az 5. szinten két jel egymás után |

A hibakeresés, a programok összevetése és a ha–akkor a 3. szinten indul: a gyerek előbb maga épít programot, így egy
friss profil a Robotpályán építéssel és a „Hová ér?" kérdéssel kezd.

A pályákat rögzített magból sorsolja a program (minden betöltéskor ugyanazok), és egy teszt minden pályát megold. A
2. tévedés után megmutatott és a 3. után együtt megépített program a legegyszerűbb megoldás (a legkevesebb
gombnyomás), és teszt ellenőrzi, hogy elfér a program helyein.

### 3.7 Ceruzavár (9 sablon, 9 készség)

**Mire épül**: a DIFER írásmozgás-koordináció területe (a forrásból csak a készség nevét ellenőriztem). A vonalelemek
sorrendje a Beery-féle vizuomotoros teszt (VMI) formáinak sorrendjét követi. A teszt 15 formája egyre nehezebb, az
első kilenc: függőleges vonal, vízszintes vonal, kör, kereszt, jobbra dőlő ferde vonal, négyzet, balra dőlő ferde
vonal, ferde kereszt, háromszög (Flores és mtsai, 2023, a teszt kézikönyve alapján [teljes szöveg]; magát a
kézikönyvet nem olvastam). Daly, Kelley és Krauss (2003) 54 óvodás gyerek vizsgálatában azok, akik az első kilenc
formát le tudták másolni, olvashatóbban másolták le a betűket is [kivonat]; Marr és Cermak (2002) 101 gyereknél
viszont azt találta, hogy az óvodás VMI-eredmény az egész csoportra nézve nem jelezte előre az első osztályos
kézírást [kivonat]. A játék ezért csak a sorrendet veszi át: nem mér, és a formákat nem kéri számon.

**Hogyan működik**: a gyerek ceruzával vagy ujjal követi a pöttyös vonalat. **Nincs hibajelzés és nincs hibaszám**: ha
letér, onnan folytathatja. Vonalnál és formánál bármelyik végéről indulhat (a kört bármelyik irányba); számnál,
betűnél és szónál a zöld pöttytől, a nyíl irányában, a kezdőpontok számozása szerinti sorrendben. A tűrés a rajz
méretéhez igazodik (14 és 46 képpont között). Ha a gyerek 6 másodpercig nem halad, felvillan a következő pont, és
ritkán újra elhangzik az utasítás; ez a segítség az ütemezőnek is jel (2.2: elakadás).

| Készség | Feladat | Szintek | Mi nehezedik |
|---|---:|---|---|
| egyenes vonalak | 10 | 1–4 | függőleges, vízszintes, eső → fűszálak, kerítés → ferde vonalak, háztető, létra → napsugarak |
| íves vonalak | 32 | 1–5 | hullám, kehely, dombok (két–öt elem) → hurkok, csigavonal mindkét forgásiránnyal → nyolcas, buborékok, kampók |
| tört vonalak | 16 | 2–5 | cikcakk (fekvő és álló), lépcső, várfal, fűrész; egyre több elemmel |
| formák | 14 | 1–5 | kör, szivárvány → tojás, kereszt → négyzet, téglalap, ferde kereszt, házikó → háromszög, holdsarló, csepp → szív, rombusz, csillag |
| számjegyek, számok | 21 | 3–5 | 0, 1, 7 → 2, 3, 4, 5, 9 → 6, 8 és a kétjegyű számok tíztől húszig |
| nagybetűk | 35 | 3–5 | csak egyenes vonásból (I, L, T, E, F, H) → ferde és íves vonással (A, K, M, N, V, W, X, Y, Z, O, C, U, J, D, P) → a többi és az ékezetes betűk |
| szavak | 53 | 4–5 | kétbetűs szavak (ló, tó, fa, ág…) → három–hat betűs szavak (cica, alma, nyuszi…); a saját név, ha a szülő megadta |
| útvesztő | 58 | 1–5 | 3×3-as rácstól 6×5-ösig, egyre hosszabb úttal és több zsákutcával; a cica a ceruzát követi, falon nem megy át |
| pöttyösszekötő | 20 | 1–5 | 4–6 pöttytől 15–17 pöttyig; a végén kiderül, mi lett belőle (papírsárkány, hal, csillag, hajó, pillangó…) |

**Mi számít egy feladatnak**: a vonal családja és elemszáma (és hogy fekvő vagy álló, illetve merre forog), a szám, a
betű, a szó, az útvesztő megoldása (a lépések sora) és a pöttyös kép. Az útvesztőket rögzített magból sorsolja a
program, és teszt ellenőrzi, hogy mindegyiknek pontosan egy útja van.

**A betűformák saját összeállítás**: a nyomtatott nagybetűk és a számjegyek alakját és vonássorrendjét én írtam le,
iskolai vagy óvodai forrással nem vetettem össze. A feladat-galéria betűlapján (`tests/gallery.html?st=ceruza`) mind
látszik, számozott kezdőponttal és nyíllal; ha egy betűt az óvoda vagy az iskola másképp tanít, azt jelezni kell, és
átírom. **Kisbetű és írott betű nem készült** (saját döntés: ezek már iskolai anyagok).

**A saját név**: a „nevem" feladat a szülő által megadott nevet írja ki nagybetűvel (legfeljebb kilenc betű, hosszú
névnél az első szó). A név csak futás közben, a helyi mentésből kerül a feladatba; nem kerül azonosítóba, naplóba vagy
a repóba. Ha nincs név megadva, a „MAMA" szót kell átírni.

**Szülőnek érdemes kipróbálni** (asztali gépről nem ellenőrizhető): a tűrés az iPaden ceruzával és ujjal (túl
szigorú? túl laza?), és hogy a vastag vonal kényelmes-e a kis kéznek.

### 3.8 Rajzasztal (7 sablon, 7 készség)

**Mire épül**: a térbeli szavak (fölé, alá, rá, bele, mellé, balra, jobbra, közé) a DIFER relációszókincs-területéhez
tartoznak (1. rész). A sormintára: Zippert, Douglas és Rittle-Johnson (2020) 65 óvodás (négy–hat éves) gyereknél azt
találta, hogy az ismétlődő sorminta-tudás a verbális és téri munkamemóriától függetlenül előre jelezte az iskolakezdés
előtti év (az amerikai kindergarten) végén mért matematikai és számfogalmi tudást [kivonat]. A térbeli összerakásra:
Verdine és mtsai (2014) 102 hároméves gyereknél azt találta, hogy az egymásba illeszthető kockákból való építés
ügyessége az ugyanakkor mért matematikai teljesítmény egy részét önállóan magyarázta [kivonat]. Mindkettő együttjárást
mutat, nem azt, hogy a gyakorlás okozza a fejlődést; a játék csak annyit vesz át, hogy a sorminta és a minta szerinti
másolás helyet kap (hogy a rácsos másolás a kockaépítéshez hasonló készséget kér, az saját feltevés). **A feladatok sorrendje és nehezedése saját összeállítás** (a tükrözés, a szabály
szerinti színezés és a színező is), ehhez forrást nem ellenőriztem.

**Hogyan működik**: a rácsos feladatoknál a gyerek színt választ, és a cellára koppint. Rossz szín vagy rossz hely
nem marad meg: a cella megbillen, visszafehéredik, és Rozi megmondja, mi volna ott („A mintán itt piros van.").
Ha a tévedések a rács méretéhez képest sokan vannak, a következő hiányzó cella felvillan, még több után a kész kép
halványan előtűnik. A matricánál a gyerek a polcról a helyre húzza (vagy a helyre koppint) a matricát; rossz helyen
Rozi megmondja, hova került („A cica most a szék mellett van."), és a matrica visszaszáll; a második tévedés után a
jó hely felvillan, balra–jobbra kérdésnél pedig emlékeztet: „Tedd a kezed a szívedre: az a bal oldalad." A
színezőnél: „Ez az ajtó. A tetőt keressük."; a második tévedés után a jó rész villan fel, a harmadik után a jó szín
is; sikerre a kép többi része magától kiszíneződik. Az iPaden a ceruza elsőbbséget kap: ha a ceruza 4 másodpercen
belül járt a képernyőn, az ujj (tenyér) érintése nem számít.

| Készség | Feladat | Szintek | Mi nehezedik |
|---|---:|---|---|
| másolás | 61 | 1–5 | 3×3-as rács, egy szín, két–négy cella → 5×5-ös rács, három szín, hét–kilenc cella; a minta mellett (álló iPaden fölötte) |
| tükör | 55 | 2–5 | 2×4-es fél kép, egy szín → 4×5-ös fél kép, két szín; a fél kép mindig eléri a tükörtengelyt |
| sorminta | 16 | 1–5 | AB → AAB, ABB, ABC → AABB, AAAB, ABBB → ABCD, AABC, ABBC, ABCC → ABAC, ABCB; síkban: sakktábla, csíkos, átlós |
| szabály szerinti színezés | 16 | 1–5 | egy alak, egy szín → két, három, négy szabály; szabály nélküli alakok (fehérek maradnak); hasonló alakok (kör és ovális, négyzet és téglalap); méret szerinti szabály (a nagy négyzet más, mint a kicsi) |
| térbeli szavak (matrica) | 15 | 1–5 | fölé, alá → rá, bele, mellé → balra, jobbra, közé → két egyforma, egy nagy és egy kicsi tárgy közül a megnevezett mellé, alá, fölé, bele, rá |
| színező | 43 | 1–4 | nagy rész (tető, fal, a hal teste) → közepes (ajtó, ablak) → kicsi (kémény, szem, zászló) → két hasonló közül a megnevezett (bal vagy jobb oldali ablak, felső vagy alsó uszony, nagy vagy kis vitorla); nyolc saját rajzolt kép |
| szabad rajz | 60 | 1–5 | egy forma (nap, labda, lufi) → két-három forma (alma, gomba, hóember) → tárgy (ház, autó, hajó) → állat, Rozi, „rajzold le magadat" → kis jelenet térbeli szóval („Rajzolj egy fát, és rá egy madarat!") |

**Mi számít egy feladatnak**: másolásnál az alak (eltolva, elforgatva, tükrözve vagy más színekkel ugyanaz a
feladat, a szintek között is); tükörnél a fél kép alakja a tengelyhez illesztve (függőlegesen eltolva, fejjel lefelé
vagy más színnel ugyanaz); sormintánál a szerkezet; szabálynál a szabály szerkezete (hogy melyik alak melyik színt
kapja, díszítés); matricánál a viszony és hogy egy vagy két tárgy közül kell választani (a tárgy és a matrica fajtája
díszítés, a választható helyek száma feladatonként állandó); színezőnél a kép és a megnevezett rész (a kért szín
díszítés); szabad rajznál a téma.

**Őszintén a szabad rajzról**: a 266 feladatból 60 szabad rajz. Ezeknek nincs jó vagy rossz megoldása: a gépi
ellenőrzés csak azt nézi, hogy a feladat elindul, üres lappal nem fejeződik be, elfogad egy vonást, a visszavonás
működik, és a pipára véget ér. Értékelt (jó vagy rossz választ adó) feladat 206 van. A pipához egyetlen vonás is elég
(az 1.0-s átnézés ezt nyitott pontként jelölte; saját döntés, hogy így marad: a gyerek dönti el, mikor kész a rajza).
Rozi a végén nem minősít, hanem elmondja, milyen színeket lát („Látom, pirosat és sárgát használtál."), vagy megköszöni.
**Kiegészítős rajz** (hiányzó rész odarajzolása) nem készült, mert géppel nem értékelhető; a rajzok egyelőre nem
kerülnek ki a kert rajztáblájára (az M5-ben).

**Szülőnek érdemes kipróbálni**: a matrica húzása ujjal és ceruzával az iPaden, és hogy a tárgyak (szék, ágy, kosár,
doboz) képe az iPad saját emojijaival is úgy néz-e ki, hogy a „szék alá" hely tényleg a szék alatt legyen (a helyeket
a tárgyak szokásos rajzához igazítottam, de az emojik eszközönként eltérnek).

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

- **A Zenevár Kodály-sorrendjének forrása**: a gyakorlatok a kis terccel, a szó–mi hangközzel kezdenek, aztán
  egyenként jön a lá, a dó és a ré; a fá és a ti csak később, mert a félhangot a gyerekek nehezen éneklik tisztán
  ([Wikipédia: Kodály method](https://en.wikipedia.org/wiki/Kod%C3%A1ly_method), Choksy: *The Kodály Method I*, 1999,
  9–12. o. alapján, [másodlagos]).
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
| Ceruzavár | 3 | 2 javítva korábban (a kör azonosítója, a név nélküli betű); 1 kiváltva: a kilenc azonos utasítású régi vonal helyett generált feladatok jöttek, mindegyiknek saját utasítása van („Rajzolj esőt! Minden csepp fentről lefelé esik.") |
| Hangok háza | 8 | kivéve, a generált feladatok váltják ki (a válaszok nevét Rozi kimondja, a kép látszik, a tapsolásnál nincs számjegy, sok rím-feladat) |
| Zenevár | 4 | kivéve, a generált feladatok váltják ki (nincs abszolút hallás: a harangok előbb a nevükkel szólnak; a hangnév mindig harang neve; a felirat „ti") |
| Rajzasztal | 0 | a négy régi rajzos feladat (nap, ház és virág kiszínezése, szabad rajz) helyett generált feladatok jöttek (3.8) |

Összesen: 30 kiváltva generált feladattal, 29 javítva, 1 kivéve, **1 nyitott** (az M6-ban).

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
- Daly, C. J., Kelley, G. T., & Krauss, A. (2003). Relationship between visual-motor integration and handwriting
  skills of children in kindergarten: a modified replication study. *American Journal of Occupational Therapy*,
  57(4), 459–462. https://doi.org/10.5014/ajot.57.4.459 [kivonat]
- Flores, P., Coelho, E., Mourão-Carvalhal, M. I., & Forte, P. M. (2023). Preliminary Adaptation of Motor Tests to
  Evaluate Fine Motor Skills Associated with Mathematical Skills in Preschoolers. *European Journal of Investigation in
  Health, Psychology and Education*, 13(7), 1330–1361. https://doi.org/10.3390/ejihpe13070098 (a Beery-féle VMI
  formáinak listája, Beery és Beery kézikönyve alapján) [teljes szöveg]
- Verdine, B. N., Golinkoff, R. M., Hirsh-Pasek, K., Newcombe, N. S., Filipowicz, A. T., & Chang, A. (2014).
  Deconstructing building blocks: preschoolers' spatial assembly performance relates to early mathematical skills.
  *Child Development*, 85(3), 1062–1076. https://doi.org/10.1111/cdev.12165 [kivonat]
- Zippert, E. L., Douglas, A. A., & Rittle-Johnson, B. (2020). Finding patterns in objects and numbers: Repeating
  patterning in pre-K predicts kindergarten mathematics knowledge. *Journal of Experimental Child Psychology*, 200,
  104965. https://doi.org/10.1016/j.jecp.2020.104965 [kivonat]
- Marr, D., & Cermak, S. (2002). Predicting handwriting performance of early elementary students with the
  developmental test of visual-motor integration. *Perceptual and Motor Skills*, 95(2), 661–669.
  https://doi.org/10.2466/pms.2002.95.2.661 [kivonat]
