# Ellenőrzési mátrix (M8)

A terv 6. része: minden kategória, kérdés és minijáték külön-külön, majd az egész egységként. Soronként: mit nézünk,
mi ellenőrzi, mi az állapota. Jelek: ✅ gép ellenőrzi és zöld · ⚖️ eltérés a tervtől, indokkal elfogadva ·
📱 csak a szülő tudja eldönteni az iPaden (lásd a végén és a `tests/ipad.html` nyomtatható listát).

**Parancsok** (a böngészős részek a helyi kiszolgálón: `node serve.cjs . 8124`, a mentést módosító tesztek csak ezen a teszt-porton futnak; a README `8080`-as címei a sima kipróbálásra valók):

- Node: `node --test tests/content.test.mjs tests/profiles.test.mjs tests/reward-timer.test.mjs tests/generated.test.mjs tests/scheduler.test.mjs tests/economy.test.mjs tests/avatar.test.mjs tests/quality.test.mjs tests/icons.test.mjs tests/facts.test.mjs tests/story.test.mjs tests/world.test.mjs tests/parent.test.mjs tests/week.test.mjs` (a CI is ezt futtatja)
- Böngészős füstteszt: `tests/smoke.html?only=rest`, `?only=games`, `?only=generated`
- Szimulált ülés: `node tests/flow.mjs`; Varázsvilág tízperces próbafutása: `tests/soak.html` (GPU-val, `--js-flags=--expose-gc`)
- Szülői átnézésre: `tests/tenyek.html?st=<állomás>`, `tests/mesek.html`, `tests/varazsvilag.html`, `tests/gallery.html`, `tests/listen.html`, `tests/ipad.html`

## 6.1 Kategóriánként és kérdésenként (14 állomás)

| Ellenőrzés | Mi ellenőrzi | Állapot |
|---|---|---|
| ≥ 250 önálló feladat állomásonként | `generated.test` (a 8 generált állomás, mind az öt szinten; a 6 ténytábla is ugyanezen a kapun megy át) | ✅ |
| Tudományos ív: minden feladat egy készséghez és szinthez tartozik | `facts.test` (ismert készség és szint), `generated.test` (sablon → állomás), `docs/pedagogia.md` (készségenként forrás és sorrend) | ✅ |
| Szülői átnézés: a ténylisták jóváhagyva | mind a hat tábla jóváhagyva (`js/content/approved.js`, 2026-11-15/16); mesék és Varázsvilág PDF-ben elküldve | ✅ |
| Helyesség: pontosan egy jó válasz | `content.test` („választós feladat”), `generated.test` (független megoldó) | ✅ |
| Egyértelműség: a rossz válasz biztosan téves, nincs két azonos jelentésű opció | `facts.test` (jó és vitatható válasz külön), `generated.test` („minden eltérítő máshol helyes”) | ✅ |
| Nyelvtan: névelő, ragok, számnevek | `content.test` („magyar nyelvtani segédek”), kézzel írt ragozott alakok a bankokban; `avatar.test` (Barátom mondatai) | ✅ |
| Kiejtés | gép nem tudja; `tests/listen.html` állomásonként 30 véletlen mondatot olvas fel; javítás a szülői sarok kiejtés-javítójával | 📱 |
| Megoldhatóság | `?only=generated` (a gépi megoldó minden sablon minden szintjén a valódi feladatot oldja meg) | ✅ |
| Tanítás: jó, rossz és segítség-mondat minden feladathoz | `facts.test` (a tény, a kérdés és a segítség kimondható), `generated.test` („Rozi minden mondata kimondható”) | ✅ |
| Nehézségi ív: öt szint, mindegyiken elég elem | `generated.test` (≥ 250 mind az öt szinten) | ✅ |
| Ismétlés: 300 feladatos menetben nincs azonosító-ismétlés | `scheduler.test` („300 feladat…”, „sok szimulált gyerek…”) | ✅ |
| A jó válasz helye nem árulkodó | `generated.test` („a helyes válasz minden helyen előfordul”) | ✅ |
| Kimondható szöveg: nincs számjegy, jel, emoji; rövid mondatok | `generated.test`, `facts.test`, `story.test`, `content.test` | ✅ |

## 6.2 Minijátékonként és feladattípusonként

| Ellenőrzés | Mi ellenőrzi | Állapot |
|---|---|---|
| Indul és kilép (X, vissza, időzítő); utána nincs élő 3D-jelenet, hang-kontextus, figyelő, időzítő, beszéd | `?only=games` és `?only=rest` (minden feladattípus és jutalomjáték), `reward-timer.test` | ✅ |
| Forgatás és átméretezés | a füstteszt a fő képernyőket fekvő és álló méretben is méri (kert, öltöztető); a valódi forgatás | ✅ / 📱 |
| Apple Pencil és ujj: nyomás, tenyér, több ujj | szintetikus pointer-események a füsttesztben (szabad futás: koppintás, tartott ujj, két ujj, tenyér; tenyérszűrő a rajzos feladatokon); a valódi Pencil | ✅ / 📱 |
| Hang: egyensúly, néma kapcsoló, beszédmennyiség | hangerő-mérés (RMS) a füsttesztben, egyetlen hang-kontextus, beszédkorlát etetésnél és a Varázsvilágban (`soak.html`); a valódi hangszóró és a néma kapcsoló | ✅ / 📱 |
| Teljesítmény: rajzolási hívás, háromszög | füstteszt (kert, minden jutalomjáték ≤ 150 hívás) | ✅ |
| Tízperces memória-mérés | ⚖️ csak a Varázsvilágra (`soak.html`: a memória nem nő); a többi játék rövid, és a füstteszt kilépéskor ellenőrzi, hogy nem marad 3D-jelenet, hang-kontextus és időzítő | ⚖️ |
| Nincs büntetés, mindig van kiút | a füstteszt minden típusnál: tévedés után is befejezhető, X mindig megállít; `story.test` (tanulság, nem kioktatás) | ✅ |
| Ajándék és csillag a megfelelő forrásból, mentés után is | `?only=gifts`, `economy.test` | ✅ |
| Játékokon belüli jutalmak (2. kör): pálya-téma, lufik, varázsnyom, buborék-alak, a tarisznya gombjai, játéksarok, lámpás; a tarisznya mentése | `?only=gifts` 5. rész (ajándékkal és nélküle), `economy.test` („a tarisznya…”), `avatar.test` (az új ruhadarabok látszanak, a játék-kinézet nem az unikornison) | ✅ |

## 6.3 Egységként

| Ellenőrzés | Mi ellenőrzi | Állapot |
|---|---|---|
| Szimulált ülés: feladatok → csillagok → kapu → játék → vissza → pihenő → szülői sarok → újratöltés után minden megmarad | `node tests/flow.mjs` (12 ellenőrzés): egy rövid kör a valódi oldalon, az órát előreállítva | ✅ |
| A terv 30 perces ülése (ajándék → ruha → kert is) | ⚖️ nem egyetlen hosszú futás: a `flow.mjs` rövid köre, a `?only=gifts` (minden játék ajándéka, az ajándék-pillanat, a kerti díszek és a ruha) és a tízperces Varázsvilág-próbafutás együtt fedik le | ⚖️ |
| Régi mentés átemelése (csillagok, látott feladatok, ajándékok, név) 1. profilként | `profiles.test` („régi mentés…”, „nagyon régi mentés…”, „sérült…”), `economy.test` (régi ajándékok) | ✅ |
| Első indulás, két profil váltogatása, mentés fájlba és visszatöltés | `profiles.test` („két gyerek…”, „két megnyitott lap…”, „mentés fájlba…”, „visszatöltés…”) | ✅ |
| Konzol-hibamentesség | `tests/flow.mjs` (nincs kivétel, konzol-hiba, hibanapló-bejegyzés a teljes ülésben), a füstteszt kivétel-figyelése | ✅ |
| Kiáltvány: minden állomás és játék mellett áll, melyik értéket szolgálja; nincs gúny, a dicséret az igyekezetet is elismeri; szív és csillag külön | a lenti táblázat; `economy.test` („szívek: csak jó tettért”), `lines.js` dicséret-változatai | ✅ |
| Szülői ellenőrző lista az iPadre | `tests/ipad.html` (nyomtatható) | 📱 |

## Kiáltvány: melyik érték hol

Okosítás · Erények · Tisztelet · Kedvesség · Törődés · Tudás

| Hely | Fő érték | Hogyan |
|---|---|---|
| Ceruzavár | okosítás | írásmozgás a vonalelemek sorrendjében, betű és szám csak utána |
| Számoló rét | okosítás | tárggyal kezd, a számjegy csak mellette; tízes átlépés csak az 5. szinten |
| Formák és színek | okosítás, tudás | téri szavak (alatt, mögött, között), méret, irány |
| Hangok háza | okosítás | szótag → rím → kezdőhang → betű |
| Zenevár | okosítás | Kodály-sorrend, viszonyított hallás (nem abszolút) |
| Okoskodó | okosítás | sorminta, kakukktojás, analógia, emlékezet |
| Robotpálya | okosítás | programépítés, hibakeresés, ha–akkor |
| Rajzasztal | okosítás, önkifejezés | másolás, tükör, szabad rajz (nincs jó vagy rossz) |
| Állatok és etetés | tudás, törődés | ki mit eszik; a valódi 3D barátot etetjük, az állat köszöni meg; etetés = szív |
| Testünk csodái | tudás, törődés | a test részei és működése, vigyázunk magunkra |
| Szívkert | erények, kedvesség, tisztelet | érzelmek, „mit mondunk, ha…”, segítség, osztozás, őszinteség |
| Világunk | tudás, tisztelet | foglalkozások, évszakok, közlekedés, a közös szabályok |
| Egészség | törődés, tudás | kézmosás, „gyakran / néha” ételek megszégyenítés nélkül, biztonság |
| Időutazás | tudás, tisztelet | régen és ma, hagyományok, mesterségek |
| A kör meséje | erények, kedvesség | minden mesének szelíd tanulsága van, a következmény mutatja meg, nem kioktatás |
| Kert és barátok | törődés, kedvesség | a barátok etetéssel költöznek be; szívek a Barátság fáján |
| Ajándékok, szívek | kedvesség | csillag a tudásért, szív a jó tettért (külön számolva) |
| Felhővár-verseny | tisztelet, kedvesség | az ellenfél is barát, a végén együtt ugrálnak; a második is dicséretet kap |
| Varázsvilág | tisztelet, türelem, tudás | a lényt nem kergetjük, megvárjuk; nevezetességek, tájak |
| Barátom, Hami-adagoló, Csillagfogó cica | törődés | simogatás, etetés, egészséges étel |
| Buborékok, Unikornis-futás, Öltöztető | önkifejezés, öröm | jutalom alkotás és játék, nem nyerőgép |
| Pihenő-javaslat | törődés | a beállított idő után Rozi pihenőt és egy pohár vizet javasol (M8) |

## Eltérések a tervtől (⚖️)

A részletek a README megfelelő részében.

- Ajándék-pillanat 2D (nem 3D jelenet): egy harmadik WebGL-kontextust takarít meg.
- Toon-árnyalás és kontúr nincs: a fehér színek szürkévé váltak; a szülő a két képet megkapta.
- Egy mese egy jutalomkörre (nem naponta egy); esti jelenet nem készült.
- Varázsvilág: sarok-térkép, időjárás és napszak, „ruha = képesség”, gyümölcs, további lények és világbeli kérdések nem
  készültek; a lények és a nevezetességek a Varázskönyvben élnek, a kertbe a kaland ajándéka kerül.
- Öltöztető: hát-, láb- és farok-darabok és a három mentett öltözet nem készült.
- Felvett (természetes) hang nem készült: a szülő nem kérte; a rendszerhangot a kiejtés-javító egészíti ki.

## Ismert gyenge pont

A kert két, valós időben animációra váró füsttesztje (virág-hervadás, néhány etetéses eset) erősen terhelt gépen
elbukhat: a háttérben futó virtuális gép miatt a böngésző kevesebb képkockát ad, és az ellenőrzés túl korán néz.
Terheletlen gépen zöld; ilyenkor újra kell futtatni.
