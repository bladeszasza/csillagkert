# Csillagkert

Játékos, magyar nyelvű tanuló- és fejlesztőjáték óvodás korúaknak iPadre és Apple Pencilre.
Feladatok → csillagok → jutalomjáték. Hibázásért nincs büntetés: szelíden újrapróbálhatja, és megtanítjuk.

**Játék:** https://bladeszasza.github.io/csillagkert/

**Amire épül:** okosítás · erények · tisztelet · kedvesség · törődés · tudás.

- **A kert él:** a cica mellett a csillagokkal sorban 18 barát érkezik, 150 csillag után pedig jutalomkörönként egy újdonság:
  új barát vagy új fa (lásd lent). A tóparton túl egy egész új kertrész, **Ausztrália** népesül be nyolc állattal. Pislognak, sétálnak a zugukban,
  koppintásra megszólalnak a saját hangjukon (mindegyiknek más). Minden csillag egy virág, de egyszerre legfeljebb 71 nyílik
  (a szülő kérésére, hogy ne nője be a kertet): ha már 71 van, a legrégebbi elhervad, és a helyén új, más színű virág nő.
  A 71 azért ennyi, mert a 72. hely már az alsó feladatjelek elé, a képernyő aljára esne (teszt: `tests/content.test.mjs`).
  Az új barát besétál, megszólal, és Rozi egy mondatban bejelenti. A nap a csillagmérővel együtt halad a naplemente felé.
- **Tópart és tanya:** a kert két szélén két új rész van. Balra a tó (kacsa, béka, sün, mókus, bagoly, egér, teknős),
  jobbra a tanya (tyúk, unikornis, malac, bárány, póni, tehén) kerítéssel, pajtával, szénabálával és szivárvánnyal.
  Alul a két szélső gomb (rajta az ottani első barát képe) viszi át oda a kamerát, a 🐱 gomb hozza vissza a kert közepére.
  Ha valaki a tópartra vagy a tanyára érkezik, a kamera odasiklik megnézni, aztán magától visszatér.
  A feladatok jelei (a szülő kérésére) a tópartról és a tanyáról is elérhetők: a helyükön maradnak, és onnan is egy koppintással
  indul a feladat. Fekvő és álló képernyőn mérve egyik jel sem takar gombot, és egyik barátot sem (legfeljebb a koppintási
  területe 7%-át), így a barátok is koppinthatók maradnak.
- **A kert a térkép:** az állomások helyek a kertben (ceruzatorony, házikó, almafa, földgömb, robot, festőállvány,
  számolókockák, harangok, piknik…), a jelükre koppintva lehet odamenni. A „Tovább" gomb megmaradt annak, aki nem akar választani.
- **Rozi, a robot** beszél (böngésző-hang), bemutatkozik, ő osztja a csillagokat; az arca a hangulathoz igazodik.
- **Feladatok:** vonalkövetés, számok, nagybetűk és szavak átírása, útvesztő, pöttyösszekötő, számolás 20-ig, összeadás/kivonás, formák, színek és téri viszonyok,
  gondolkodtató feladatok (sorminta, kakukktojás, ellentétek, párok, „Mi tűnt el?", memória), hangok és rímek
  (szótagtaps, rím, kezdő- és véghang, betű), zene (harangok, feljebb–lejjebb, dallamív, ritmuskártyák, halk–hangos,
  hosszú–rövid, gyors–lassú, dallam-visszhang), állatetetés (a kert valódi 3D lakóját etetjük), testünk, időutazás,
  robotprogramozás (építés, ismétlés, hibakeresés, „Hová ér?", ha–akkor), rajzasztal (rácsos másolás, tükör, sorminta,
  szabály szerinti színezés, térbeli szavak matricával, színező, szabad rajz).
  Nyolc állomás feladatai sablonokból készülnek, állomásonként több száz (lásd lent).
- **Jutalomjátékok:** Unikornis-futás, Felhővár-verseny, szabad futás procedurális világban, hami-adagoló (3D cica),
  cica-etetés, Barátom (fésülés, simogatás, labdázás), 3D unikornis-öltöztető (a megnyert ruhákkal), buborékpukkasztás.
  Minden játék ajándékot ad, a jó tettek szívet (lásd „Ajándékok és szívek"). A gyerek felöltöztetett unikornisa
  mindenhol ő maga (lásd „Az én unikornisom").
- Nincs build lépés: sima HTML + ES modulok + three.js (`vendor/`). GitHub Pages-en fut. A haladás csak az eszközön tárolódik.

## Tananyag és sorrend

Az M4 mérföldkő kész: **mind a 8 generálható állomás** sablonokból készül.

| Állomás | Önálló feladat | Készség |
|---|---:|---:|
| Számoló rét | 758 | 10 |
| Formák és színek | 304 | 11 |
| Okoskodó | 407 | 8 |
| Hangok háza | 618 | 7 |
| Zenevár | 293 | 7 |
| Robotpálya | 464 | 6 |
| Ceruzavár | 259 | 9 |
| Rajzasztal | 266 (ebből 60 szabad rajz) | 7 |

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
- **Rajzasztal**: rossz szín vagy rossz hely nem marad meg, Rozi megmondja, mi volna ott; a matricánál azt is, hova
  került a matrica („A cica most a szék mellett van."). A szabad rajznak nincs jó vagy rossz megoldása, ezért nem számít
  bele a szintlépésbe; Rozi a végén a használt színeket mondja el. A színezős képek a galéria képlapján
  (`tests/gallery.html?st=rajz`) átnézhetők.
- **Rozi mondatai** (`js/lines.js`): melegebb, kevesebb csillag-emlegetés, több közös felfedezés; a gyerek nevét néha
  kimondja, ha meg van adva (a név csak az eszközön tárolódik).
- **A régi feladatok**: a generált állomások régi, kézzel írt feladatai kikerültek; aki azokból sokat megoldott, az új
  feladatoknál egy szinttel feljebb kezd. A tény-állomások javítandó feladatainak nagy részét az átnézés szerint
  javítottam (például „Mivel hallunk?" került a félreérthető „Mi folyik az ereinkben?" helyére); ezek az állomások az
  M6-ban kapnak szülő által átnézett ténytáblát. Hogy a 61 javítandó régi feladatból mi lett (javítva, kivéve, nyitott),
  az a [`docs/pedagogia.md`](docs/pedagogia.md) 6. részében áll.

## Hang

- Minden játékhang egyetlen közös hangmotoron megy át (`js/audio.js`): hangerő, kompresszor, torzítás elleni védelem.
- A beszéd és a játékhangok hangereje külön állítható a szülői sarokban (bal alsó fogaskerék gomb, 3 mp-ig nyomva tartva).
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
- **Akit (még) nem etetünk:** béka, bagoly, egér, unikornis, malac, bárány, teknős, és a távoli földek (Ausztrália, később Afrika)
  minden lakója: náluk `eats: []` és `maybe: []` áll a táblában, így etetős feladat nem készül velük. Ők a kertben élnek és megszólalnak,
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

### Jövevények a tehén után: egy jutalomkörönként

A szülő kérésére a tehén (150 csillag) után nagyjából **jutalomkörönként egy** újdonság érkezik, ahogy az ajándék is:
**30 csillagonként** hol egy új barát, hol egy új fa. Egy jutalomkör a beállított kezdőszámmal (5, 7, 10 vagy 15 csillag)
indul, körönként kettővel hosszabb, és legfeljebb 30 csillag (`roundStars`, `js/economy.js`). Ezért egy körben soha nem jön
egynél több jövevény (Node-teszt mind a négy kezdőszámmal), és ha a kör már 30 csillagos, a teljes rendben minden körre jut egy.
A rend rögzített (az én beállításom, a `js/friends.js` elején):

| Csillag | Jövevény | Hol |
|---:|---|---|
| 180 · 210 · 240 | kenguru · eukaliptuszfa · koala | Ausztrália |
| 270 | cseresznyefa 🌸 | kert közepe (hátul, a jelek között) |
| 300 · 330 | kakadu · vombat | Ausztrália |
| 360 | almafa 🍎 | tanya (a hinta mögött) |
| 390 · 420 · 450 · 480 · 510 | emu · kacsacsőrű emlős · palackfa · kvokka · hangyászsün | Ausztrália |
| 540 · 570 · 600 · 630 · 660 · 690 | elefánt · majomkenyérfa · zsiráf · ernyőakác · zebra · oroszlán | Afrika |
| 720 | szomorúfűz 🌳 | tópart (a virágkapu mögött) |
| 750 · 780 · 810 · 840 · 870 | víziló · szurikáta · pálmafa · flamingó · majom | Afrika |

Ausztrália kész; Afrika még készül. A táblázat a végleges rendet mutatja, de a kódba egy jövevény csak a kész modelljével
kerül be. Egy 30 csillagos körrel számolva Afrika kb. 13 körrel a tehén után nyílik, az utolsó jövevény 24 körrel utána jön.
A fák a barátok mögött, a hátsó sorban nőnek, így senkit nem takarnak el; amikor egy fa kinő, Rozi bejelenti
(„Új fa nőtt a kertben: …"), és ha egy szélső kertrészben nőtt, a kamera odasiklik.

### Ausztrália (a tóparton túl, balra)

Saját, homokszínű talaj a kert bal végén túl: hátul vörös sziklahegy, egy kis billabong (tavacska) a kacsacsőrű emlősnek,
termeszvár, tüskés spinifex-fűcsomók, vörös kövek, szürkészöld sóbokrok és piros sivatagi virágok. Nyolc saját tervezésű
lakó, mindegyik saját hanggal (szintetizált, nem felvétel):

| Állat | Mi teszi felismerhetővé | Hangja |
|---|---|---|
| kenguru 🦘 | felegyenesedve áll, a zsebéből kikandikál a kicsinye; ugrálva halad | puha horkantás |
| koala 🐨 | szürke, nagy pamacsos fül, nagy sötét orr | mély, reszelős bőgés |
| kakadu 🦜 | fehér, sárga bóbita | éles rikoltás |
| vombat | zömök, szürkésbarna, széles orr | rövid röffenés |
| emu | magas, bozontos tollú madár, hosszú kékes nyak | mély dobolás |
| kacsacsőrű emlős | lapos test, kacsacsőr, lapát farok; a tavacskában lakik | halk morgás |
| kvokka | kicsi, kerek, mindig mosolyog; ugrálva halad | lefelé csúszó cippantás |
| hangyászsün | krémszínű, sötét hegyű tüskék, hosszú cső orr (nem sün!) | mély fújtatás |

- **Odajutás:** a kert alsó sarkaiban lévő gombok mindig a szomszédos részre visznek: középről balra a tópart, onnan tovább
  Ausztrália; visszafelé a tópart, aztán a 🐱 gomb a kert közepére. A gombon az ottani első barát képe van.
- **Elrendezés:** a zugokat fekvő és álló képernyőn (900×650, 650×900, 1024×768, 768×1024) kiszámoltam és a füstteszt
  is méri: mindenki a képen van, a gombsor fölött, és a térkép jelei egyiküket sem takarják 15%-nál jobban. A legkisebb
  (kacsacsőrű emlős) ezért nem középen, hanem bal elöl lakik, mert középen az alsó jelsor eltakarná.
- **Rajzolási teher:** a távoli föld tájelemei, fái és lakói csak akkor rajzolódnak, ha a kamera látja őket (a befoglalóikat
  – a lakóknál gömböt, a tájelemeknél és a fáknál dobozt – a kamera látóterével vetjük össze, így semmi nem „pattan be" a kép
  szélén). Ausztráliában a kert közepe nem rajzolódik: ott kb. 74 ezer háromszög és 15 rajzolási hívás. A tópartról nézve
  iPad-arányú képernyőn Ausztráliából semmi nem esik a képbe, ezért ott sem rajzolódik (csak széles, 16:9-es képernyőn látszik
  a széle); a kert közepén 420 csillagnál változatlanul kb. 134 ezer.

## Ajándékok és szívek

Két külön jutalom van, két külön értékért (`js/economy.js`):

- **⭐ csillag a tudásért:** minden kész feladat egy csillag. A csillagok a kertet virágoztatják, a jutalomkaput nyitják,
  és **minden 20. csillag** egy ajándék.
- **❤ szív a jó tettért:** etetés, gondoskodás, ajándék másnak, barátság. A szívekből nő a **Barátság fája** a kert
  hátsó részén: 40 szívnél éri el a teljes méretét, és a lombján legfeljebb 40 szív látszik. A szívet nem lehet
  gyűjtögetni: egy jutalomkörben játékonként legfeljebb néhány jár (hami-adagoló 3, Barátom 3, verseny 3,
  csillagfogó cica 2, szabad futás 4). Minden etetős feladat után is jár egy szív.

**Minden játék ad ajándékot**, jutalomkörönként egyet: amelyik játék előbb adja. Mindig egy igazi játék-pillanatnál jön,
nem a belépéskor:

| Játék | Mikor jön az ajándék | Mikor jár szív |
|---|---|---|
| Felhővár-verseny | a célba éréskor, akár nyert, akár nem | amikor a végén összebújnak |
| hami-adagoló | a harmadik etetésnél, vagy az első becsomagolt ajándékdoboznál | minden etetésnél és ajándékdoboznál |
| Barátom | amikor a barát örül (a gondozás végén) | ugyanekkor |
| csillagfogó cica | amikor jóllakott | ugyanekkor |
| buborékok | a 15. kipukkasztott buboréknál | – |
| szabad futás | amikor az első barát csatlakozik | minden új útitársnál |
| unikornis-futás (Sparkhorn) | az első végigfutott kör után | – |
| öltöztető | nem ad: itt várnak a megnyert ruhák | – |

- **Az ajándéklétra** (`js/gifts.js`) rögzített sorrendű, véletlen nincs benne: a tíz ruhadarab és tizenkét kerti dísz
  felváltva jön (korona, lámpás, szivárványszárny, kerti pad, …). Ami megvan, nem jön újra.
  Ha a létra elfogyott, **aranyvirág** nyílik a kertben, így soha nincs üres ajándék. Az aranyvirágok a virágos rész
  külső gyűrűjén nyílnak: nem nőnek a feladatjelek elé, és egyik virágra sem lógnak rá.
- **A következő ajándék** sziluettje a jobb felső sarokban látszik; koppintásra Rozi megmondja, mi lesz az.
  A bal felső ❤ jel a szívek száma; koppintásra Rozi elmondja, mire valók.
- **Az ajándék-pillanat** (`js/gift-moment.js`): egy doboz megremeg és kinyílik, kiugrik belőle az ajándék
  (ruhánál a saját unikornis, rajta az új darab), Rozi egy mondatban elmondja, mit kapott (a csillagokat nem számolja),
  aztán az ajándék a „következő ajándék" jelhez repül. Koppintásra azonnal továbbmegy, játék közben átengedi az érintést.
  **Eltérés a tervtől:** a terv 3D jelenetet írt; ez 2D réteg lett, hogy ne nyíljon egy harmadik 3D-vászon a játék
  és a kert mellé (régebbi iPaden ez kockázat).
- **Kerti díszek:** a tópart és a tanya szabad zugaiba kerülnek, úgy, hogy egyik barátot se takarják (a füstteszt
  mindkét tájolásban ellenőrzi). Új dísz után a kamera odanéz.
- **Öltöztető:** a még meg nem nyert darabok sziluettként látszanak (lakat nélkül); koppintásra Rozi elmondja, hogy
  bármelyik játékban megnyerhető. Az új darabot csillogás jelzi, és a választóban egy ❤ jel mutatja, hogy új ruha vár.
- **A régi mentés átvétele:** aki már játszott, megtartja, amit addig nyert (a régi sorrend szerinti ruhákat).
  A csillagokért eddig járó ajándékok kifizetettnek számítanak: nem jönnek újra, és egy sem marad ki.
  A szívek a már megetetett barátokkal indulnak (minden etetés egy jó tett volt).
- **Minden szám saját beállítás** (20 csillagonként egy ajándék, a szív-korlátok, a 40 szíves fa, a 15 buborék),
  szabadon átírható a `js/economy.js`, `js/decor3d.js` és a játékok fájljaiban.

## Az én unikornisom

- **3D öltöztető** (`js/rewards/dressup.js`): a gyerek saját unikornisa áll a választott háttér előtt. Ujjal jobbra-balra
  húzva forgatható; ha nem nyúlnak hozzá, lassan körbefordul. A nagyító gomb közelebb hozza a fejét (a böngésző nagyítása
  továbbra is tiltva). Minden választás rögtön rajta van, egy ugrással és integetéssel (a szárnyas unikornis csapkod).
- **Választható:** testszín és minta (pötty, csík, csillag, szív), a sörény színe és fazonja, a szarv színe és formája
  (egyenes, spirál), szárny, fejdísz (korona, virágkoszorú, masni, varázssüveg), szem (napszemüveg, szívszem),
  nyakdísz (nyaklánc, sál, köpeny, gyöngysor), háttér és matricák. Minden darab valódi 3D alkatrész ugyanabból a
  néhány alapformából (`js/three/characters.js`), így a kertben is a többi baráttal közös, példányosított rajzolásban fut.
  A leírás a profilban van (`js/avatar.js`): ismeretlen vagy meg nem nyert darab helyett az alap kerül rá.
- **Mindenhol ő az:** a kertben (90 csillagnál költözik a tanyára, és átöltözik, ha a gyerek új ruhát választ),
  a szabad futásban, a Felhővár-versenyen (az ellenfél egy kék barát-unikornis), a Barátom játékban (hetedik barátként
  választható) és az unikornis-futásban.
- **Unikornis-futás (Sparkhorn):** indulás előtt a Csillagkert a saját unikornis **színeit** (név és más adat nélkül)
  a közös `csillagkert_avatar` kulcsba írja (`sparkPalette`, `js/avatar.js`; ugyanaz a github.io cím). A Sparkhorn
  (külön repó, külön feltöltéssel) ebből teszi a választható unikornisok elejére „Az én unikornisom"-at, ha az adat
  ellenőrzött; ha nincs vagy hibás, minden a régi. A régebbi Sparkhorn-változat nem olvassa, a Csillagkert vele is működik.
- **Mérések:** az alap unikornis 34 alkatrész és kb. 5,3 ezer háromszög, a legnehezebb öltözet 101 alkatrész és kb. 9,3 ezer;
  az öltöztető 7–9 rajzolási hívás. A teljes kert (510 csillag, 71 virág, minden dísz, 60 aranyvirág, 40 szív) a legnehezebb
  öltözettel kb. 162 ezer háromszög és 48 rajzolási hívás (saját határ: 250 ezer; a virágok korlátozása előtt 242 ezer volt).
- **Eltérések a tervtől:**
  - A saját unikornis a kertbe továbbra is 90 csillagnál érkezik (a terv küszöbe); addig a játékokban és az öltöztetőben látszik.
  - Az ajándék-pillanat képe 2D rajz maradt (ugyanazzal a ruhával), hogy ne nyíljon egy harmadik 3D-vászon.
  - A háttér rajzolt kép a 3D unikornis mögött, nem külön 3D jelenet.
  - A tervben szereplő hát- (nyereg, hátizsák), láb- (cipő) és farok-díszek, valamint a három mentett öltözet még nincs meg;
    a meglévő csoportok mind 3D-ben működnek.
- **A gyerek neve:** Rozi kb. feleannyiszor mondja, mint korábban (a szülő kérésére; `NAME_RATE` a `js/lines.js`-ben).

## Megjelenés: ikonok, betű, gombok, 3D

- **Saját ikonok** (`js/icons.js`, galéria: `tests/icons.html`): 74 egyforma stílusú rajz (tinta-kontúr, pasztell kitöltés):
  a 13 állomás jele, a 8 jutalomjáték csempéje, az öltöztető 8 füle és minden választható eleme (minták, sörény- és
  szarvformák, szárnyak, fejdíszek, szemek, nyakdíszek, hátterek; a színek színes körként, a matricák a saját rajzukkal),
  a gombok (hangszóró, vissza, haza, bezárás, fogaskerék, nagyító, ugrás) és a Barátom eszközei. Minden eszközön ugyanúgy néz ki (az emoji
  eszközönként más). A Barátom „másik barát" gombja két barát-fej, nem ugyanaz a nyíl, mint a kilépés.
- **Betű:** Nunito (SIL Open Font License 1.1, `fonts/OFL.txt`), a repóban tárolva, két részhalmaz (latin és latin-ext,
  együtt kb. 73 KB), nincs külső kérés. A terv a Fredokát javasolta, de abból mérhetően hiányzik az ő, ű, Ő, Ű
  (tartalék betűvel jelent volna meg), ezért Nunito lett. A számjegyek és a betűk alakja (1, 4, 7, 9, I, J, G, a, g)
  ugyanaz, mint a korábbi betűé, csak kerekebb, ezért a tananyag betűi és a vásznon rajzolt számok is erre álltak át.
  A sormagasság a régi betűéhez igazítva (1,2). Mind a 311 mintafeladatot (minden sablon minden szintje és a régi
  feladatok) lemértük a régi és az új betűvel, fekvő és álló iPad-méretben: fekvő képernyőn egyik sem lett magasabb,
  álló képernyőn 8 kicsit igen (a legalább 56 px-es gombok miatt, legfeljebb 63 px-szel), de mind elfér; levágott felirat nincs.
- **Gombok:** egységes, rugós nyomás (lenyomva kicsit összemegy, elengedve visszapattan; `js/motion.js`). Minden
  gomb legalább 56 px: a kezdő-, fő- és jutalomképernyőn, mind a 311 mintafeladatban és minden jutalomjátékban, fekvő
  és álló iPad-méretben mérve. A kijelző szélén a gombok kihagyják a biztonságos sávot (home-sáv, állapotsor).
- **Kevesebb mozgás:** szülői sarok → „Mozgás a képernyőn" (a rendszer beállítása szerint / teljes / kevesebb). Bekapcsolva
  a végtelenített díszmozgások (ugrálás, pislogó fények, a húzást mutató kéz) egyszer futnak le vagy állnak, a gombok
  nem rugóznak, és az öltöztető unikornisa nem forog magától. Ami jelzés, az állóképként marad: a segítségként felragyogó
  jó válasz és a szóló harang arany keretet kap, Rozi szája beszéd közben mozog. A visszajelzések (csillag, szív, ajándék)
  és a 3D-figurák élete (séta, pislogás) megmaradnak. Az eszköz beállítása, nem a gyereké.
- **Közös 3D-megjelenés** (`js/three/look.js`): minden jelenet ugyanazt a fényt (ég, nap, erősség) és anyagot kapja; csak
  a föld felől visszavert szín más (rét, felhő, lila pálya). A kertben minden lakó alatt puha foltárnyék van (egyetlen közös
  hálóban, egy rajzolási hívás).
- **Automatikus minőség:** ha a képkocka-idő tartósan (3 mp-ig) 20 ms fölött van, a felbontás egy lépcsővel csökken
  (2 → 1,75 → 1,5 → 1,25 → 1). A kiugró képkockák (pl. háttérbe tett lap) nem számítanak. Minden lépcső után 2 mp-ig
  méri, segített-e: ha a képkocka nem lett legalább 15%-kal rövidebb (a lassúság oka nem a felbontás, hanem pl. egy 30 fps-es
  energiatakarékos mód), visszalép, és többé nem nyúl hozzá; különben nem ugrál a felbontás. Mind az öt 3D-vászon ugyanazt
  a figyelőt használja. 2-es pixelarányú (iPad-szerű) kijelzőt utánozva kipróbálva: a kép felbontása csökken, a mérete és a
  koppintási helyek nem változnak. A valódi iPades viselkedést a szülő próbája mutatja meg.
- **Eltérések a tervtől:**
  - Toon-árnyalás nincs: ugyanazokon a jeleneteken kipróbálva a fehér és pasztell figurák szürkévé fakultak (a fehér
    unikornis bézs lett), ezért maradt a matt anyag. Kontúr sincs, mert megduplázná a háromszögeket.
  - Továbbra is emoji: a feladatok képei és jelei (ételek, tárgyak, állatok, a robotpálya parancsai, a kérdés melletti kis
    jel), a Barátom állatválasztója, a hami-adagoló számlálói, a szülői sarok gombjai és néhány visszajelzés (🎁, ❤️). A saját
    rajz egyelőre a felület állandó jeleire és az öltöztetőre készült.
  - A foltárnyék csak a kertben van (sík talaj); a hullámos terepű szabad futásban és a versenyen nincs.

## Több gyerek, mentés

- **Mindenkinek saját világa van:** külön csillagok, kert, barátok, látott feladatok, ruhatár és beállítások.
  Új gyereket a szülői sarokban lehet felvenni (bal alsó fogaskerék gomb, 3 mp-ig nyomva tartva → „＋ Új gyerek").
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
- Az én unikornisom: `node --test tests/avatar.test.mjs` (minden választható elem látszik az unikornison vagy a háttéren,
  a meg nem nyert ajándék lekerül, a talaján áll és elfér, a legnehezebb öltözet is a háromszög-kereten belül, a Sparkhorn
  csak színeket kap, a Barátom mondatai magyarosak).
- Ikonok és betű: `node --test tests/icons.test.mjs` (minden állomásnak, játéknak, öltöztető-fülnek és öltöztető-elemnek saját rajza van,
  a rajzokban nincs külső hivatkozás, azonosító vagy szöveg, a betűfájlok helyben vannak, licenccel).
- Automatikus minőség: `node --test tests/quality.test.mjs` (60 fps mellett nem csökken, tartós akadozásnál lépcsőnként,
  ha a lépcső nem segít, visszalép és megáll, a kiugró képkockák nem számítanak, 1 alá nem megy).
- Ajándékok és szívek: `node --test tests/economy.test.mjs` (a régi mentés átvétele, a létra sorrendje, aranyvirág a végén,
  20 csillagonként egy ajándék, jutalomkörönként egy ajándék, a szív-korlátok, Rozi ajándék-mondatai számok nélkül).
- Ütemező: `node --test tests/scheduler.test.mjs` (300 feladatos szimuláció ismétlés nélkül, 90 szimulált
  gyereknél is: 5–7 évesek, gyenge–erős; szintlépés és visszalépés; kezdőnek csak a szintjéhez illő készség, egy állomás
  a bevezető készséggel kezd; ismétlési napok; gyakorló feladatok).
- Feladat-galéria: `http://localhost:8080/tests/gallery.html?st=okos` (vagy `szamol`, `forma`, `hang`, `zene`, `algo`) – sablononként és
  szintenként egy minta kicsinyítve, a helyes válasz zöld keretben. Nem szól és nem ír a mentésbe.
- Böngészős füstteszt: `http://localhost:8080/tests/smoke.html` (hangerő-mérés, a jó válasz helye, megszakítás utáni csend,
  minden feladattípus elindul, a kert lakói és rajzolási terhe, a tópart és a tanya, koppintás minden barátra,
  etetés a 3D állattal minden úton, a tanyáról is). A füstteszt memóriában élő tárolóval fut, a valódi mentéshez nem nyúl.
  Csak egy részét is lehet futtatni: `?only=games` (szabad futás, jutalomjátékok, ajándékok), `?only=gifts` (minden játék
  ad-e ajándékot és szívet, az ajándék-pillanat, a kerti díszek helye és rajzolási terhe), `?only=generated` (a gépi megoldó
  minden sablon minden szintjén a valódi feladatot oldja meg), vagy `?only=` és egy tesztnév-részlet.
- Szabad futás (a füstteszt része): egy futó-robot három különböző világban 2000 egységet tesz meg; nem ragadhat be,
  nem futhat bele fába, a követő barátok nem tűnhetnek el, és a világ széle nem látszhat. Ellenőrzi a koppintást,
  a tartott ujjat, a két ujjat, a tenyeret, az ugrást, a rajzolási terhet és a 3D-jelenet felszabadítását is.
- Jutalomjátékok (a füstteszt része): mindegyik elindul és kilép; kilépés után nem marad 3D-jelenet, hang-kontextus,
  időzítő és beszéd; a hangjaik a közös hangmotoron szólnak. A saját unikornis ruhája látszik a futásban, a versenyen,
  a Barátomban és a kertben; az öltöztető ujjal forgatható, nagyítható, és választásra rögtön átöltözik; a Sparkhorn-kulcsba
  csak színek kerülnek. A gombok saját ikont mutatnak és legalább 56 px-esek.
- Megjelenés (a füstteszt része): a Nunito betöltődik, és az ő/ű is a sajátja; a „kevesebb mozgás" leállítja a díszmozgást
  és a rugózást, a jelzések állóképként maradnak; a kertben minden lakó alatt van árnyék, és a felbontást a minőség-figyelő
  adja; minden jutalomjátékban minden gomb legalább 56 px.
- A jutalomidő vége: `node --test tests/reward-timer.test.mjs` (figyelmeztetés, a futó verseny kivárása, türelmi idő).
- Állatgaléria: `http://localhost:8080/tests/characters.html` (`?kind=cow`, `?page=2`, `?wave=1`, `?side=1`) – minden faj
  egyenként, a mért és a táblázatban álló magassággal.
- A barátok egyetlen közös, példányosított hálócsomagból rajzolódnak (`js/three/characters.js`): a teljes kert
  19 baráttal 12–31 rajzolási hívás. A távoli földek lakói saját csomagban vannak (lásd Ausztrália). Mivel egyszerre legfeljebb 71 virág nyílik, a háromszögek száma 71 csillag után már
  csak a barátokkal nő: 300 és 420 csillagnál is kb. 130 ezer (a korlátozás előtt 300 csillagnál 194 ezer volt), így a kert
  a tervben szereplő kb. 150 ezres kereten belül marad. A legtöbb ajándékkal kicsit fölé megy: 510 csillagnál minden kerti
  dísszel, a Barátság fájával (40 szív), 60 aranyvirággal és a saját unikornis legnehezebb öltözetével a kert közepén
  kb. 162 ezer háromszög és 48 rajzolási hívás, a tóparton és a tanyán kb. 157 ezer, Ausztráliában kb. 80 ezer.
  A teszt saját határa 250 ezer; az iPades próbán érdemes figyelni, nem lassul-e.
