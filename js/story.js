// A mese: egy rövid történet, amely egy jutalomkörön át tart (a csillagmérő kiürülésétől a jutalomkapuig).
// A feladatokat továbbra is az ütemező választja (js/scheduler.js); a mese a feladat tartalmához nem nyúl, csak keretet ad:
//   - a kör elején Rozi elmondja, mire készülünk (intro, legfeljebb két mondat);
//   - egy állomás első feladata előtt a mese hívó mondata szólhat az állomás saját hívása helyett (at[állomás]);
//     ez a mondat soha nem állítja, mi lesz a feladatban, csak azt, miért csináljuk ("hogy elkészüljön a torta");
//   - kész feladat után, a csillagmérő haladásával, egy-egy lépés hangzik el a "Szuper!" helyett (beats);
//   - a jutalomkapunál a mese vége szól, a tanulságot a következménye mutatja meg, nem kioktatás (end).
// Etetés után nincs mesemondat (ott az állat beszél). Ha közben új barát érkezik, az ő bejelentése az erősebb: a lépés
// a következő feladatnál jön (a mérő szerint legfrissebb lépés, a kimaradt közbülsők elmaradnak).
// Egy mese csak olyan barátról szólhat, aki már a gyerek kertjében lakik (who), az évszakhoz kötött mese csak a maga
// hónapjaiban jön (months). A mesék sorrendben jönnek, ismétlés nélkül, amíg mind sorra nem került.
// Minden mondat kézzel írt (nincs ragozott névbehelyettesítés), legfeljebb tizenkét szó, számjegy és emoji nélkül.
// Tiszta modul: nem tárol, nem beszél; a js/main.js mondja ki, amit ezek a függvények adnak.

// A kiáltvány értékei, amelyekből a mese tanulsága való
export const VALUES = ['osztozás', 'segítség', 'türelem', 'kitartás', 'bátorság', 'őszinteség', 'bocsánatkérés', 'megbocsátás',
  'vigasztalás', 'hála', 'kedvesség', 'törődés', 'felelősség', 'tisztelet', 'barátság', 'együttműködés', 'tudás'];

export const STORIES = [
  // --- az első napokra: csak a cica vagy senki (a kert elején még csak a cica lakik itt) ---
  {
    id: 'cica-labda', who: ['cat'], value: 'segítség',
    title: 'A cica elveszett labdáját keressük.',
    intro: 'Jaj, a cica elvesztette a labdáját! Megkeressük együtt?',
    beats: ['Nincs a bokor alatt.', 'A virágok között sincs.', 'Hallottam valamit a fa mögül!', 'Egy kis piros csík látszik a fűben.', 'Melegszik, már nagyon közel vagyunk!', 'Ott gurul, a domb mellett!'],
    at: {
      okos: 'Okoskodjunk, mint a detektívek, hátha megtaláljuk a labdát!',
      forma: 'Figyeljük a formákat és a színeket, hátha meglátjuk a labdát!',
      szamol: 'Számoljunk együtt, aztán keressük tovább a labdát!',
      algo: 'Segítsünk a robotnak, ő is a labdát keresi!',
      hang: 'Füleljünk jól, hátha meghalljuk, hol gurul a labda!',
    },
    end: 'Megvan a labda! A cica dorombol, mert segítettél neki.',
  },
  {
    id: 'virag', who: [], value: 'türelem',
    title: 'Virágot ültetünk a kertbe.',
    intro: 'Ma virágot ültetünk a kertbe. Segítesz nekem?',
    beats: ['Kiástuk a kis gödröt.', 'Beletettük a magot a földbe.', 'Meglocsoltuk a magot friss vízzel.', 'Kidugta a fejét egy kis zöld hajtás!', 'Nőnek a levelei, egyre nagyobb.', 'Már bimbója is van!'],
    at: {
      szamol: 'Számoljunk együtt, amíg nő a virág!',
      vilag: 'Fedezzük fel a világot, amíg a mag alszik a földben!',
      rajz: 'Rajzoljunk valami szépet a virág mellé!',
      egeszseg: 'Nézzük meg, mi kell nekünk, hogy erősek legyünk, mint a virág!',
      zene: 'Muzsikáljunk a kis magnak, hogy vidáman nőjön!',
    },
    end: 'Kinyílt a virág, mert türelmesen gondoztuk. Nézd, milyen szép!',
  },
  {
    id: 'cica-alszik', who: ['cat'], value: 'tisztelet',
    title: 'Csendben vigyázunk a cica álmára.',
    intro: 'A cica nagyon álmos ma. Dolgozzunk csendben, hogy pihenhessen!',
    beats: ['A cica befészkelte magát a párnájába.', 'Lassan lecsukódik a szeme.', 'Már dorombol álmában.', 'Csitt, most fordult a másik oldalára!', 'Mosolyog, biztosan szépet álmodik.', 'Nyújtózkodik, mindjárt felébred.'],
    at: {
      zene: 'Muzsikáljunk halkan, hogy a cica szépeket álmodjon!',
      ceruza: 'Gyakoroljuk csendben a vonalakat, a ceruza nem zajong!',
      rajz: 'Rajzoljunk csendben, amíg a cica alszik!',
      szamol: 'Számoljunk csendben, amíg a cica alszik!',
      hang: 'Figyeljük meg a szavak hangjait, de csak halkan!',
    },
    end: 'A cica kipihente magát, és hálásan dorombol. Köszöni, hogy csendben voltál!',
  },
  {
    id: 'rendrakas', who: [], value: 'felelősség',
    title: 'Rendet rakunk a kertben a szél után.',
    intro: 'Éjjel nagy szél fújt, és összekuszálta a kertet. Rakjunk rendet együtt!',
    beats: ['Összeszedtük a lehullott ágakat.', 'A levelek már egy kupacban vannak.', 'Visszaállítottuk a feldőlt cserepet.', 'Az ösvény újra tiszta.', 'A padot is letöröltük.', 'Már csak egy kicsi van hátra!'],
    at: {
      ceruza: 'Gyakoroljuk a vonalakat, aztán rakjunk tovább rendet!',
      okos: 'Okoskodjunk egy kicsit, aztán rakjunk tovább rendet!',
      algo: 'Segítsünk a robotnak, ő is rendet rak!',
      szamol: 'Számoljunk együtt, aztán folytassuk a rendrakást!',
      egeszseg: 'Nézzük meg, mitől leszünk erősek, mert sok a munka!',
    },
    end: 'Rend van a kertben, és mindenki örül. Közös munkával gyorsan megy!',
  },
  {
    id: 'postas', who: [], value: 'hála',
    title: 'Köszönőlapot készítünk a postásnak.',
    intro: 'A postás minden nap elhozza a leveleket. Készítsünk neki köszönőlapot!',
    beats: ['Kiválasztottuk a legszebb papírt.', 'Félbehajtottuk, olyan lett, mint egy kis könyv.', 'Rajzoltunk rá egy napot.', 'Kerül rá egy szív is.', 'Csillámot szórtunk a szélére.', 'Már csak be kell tenni a borítékba.'],
    at: {
      ceruza: 'Gyakoroljuk a vonalakat, szép lesz a lap!',
      rajz: 'Rajzoljunk, hogy szép legyen a köszönőlap!',
      forma: 'Válogassunk formákat és színeket a köszönőlaphoz!',
      hang: 'Figyeljük meg a szavak hangjait, írunk is a lapra!',
      vilag: 'Nézzük meg, kik dolgoznak értünk a világban!',
    },
    end: 'A postás nagyon örült a lapnak. Jó érzés megköszönni, amit értünk tesznek!',
  },
  {
    id: 'futyules', who: [], value: 'kitartás',
    title: 'Fütyülni tanulok.',
    intro: 'Szeretnék megtanulni fütyülni, de még nem megy. Gyakorolsz velem?',
    beats: ['Csak egy kis szél jött ki belőlem.', 'Most egy halk sípolás sikerült!', 'Elrontottam, de nem adom fel.', 'Már két hang is megszólalt!', 'Egyre szebben szól.', 'Majdnem egy egész dallam lett!'],
    at: {
      zene: 'Muzsikáljunk együtt, hátha a fütyülés is jobban megy!',
      hang: 'Figyeljük meg a hangokat, ez a fütyüléshez is kell!',
      algo: 'A robot is gyakorol, segítsünk neki!',
      ceruza: 'Gyakoroljuk a vonalakat, a gyakorlás mindenben segít!',
      okos: 'Gondolkodjunk együtt, közben pihen a szám!',
    },
    end: 'Sikerült, fütyülök! Sokat gyakoroltam, és nem adtam fel.',
  },
  {
    id: 'antenna', who: [], value: 'segítség',
    title: 'Megjavítjuk az antennámat.',
    intro: 'Jaj, elhajlott az antennám, és recseg a hangom. Segítesz megjavítani?',
    beats: ['Megkerestük a kis csavarhúzót.', 'Kicsavartuk a régi csavart.', 'Az antenna már egyenesebb.', 'Kipróbáltuk: már csak kicsit recseg.', 'Kapott egy csepp olajat.', 'Szinte olyan, mint új korában!'],
    at: {
      algo: 'Programozzunk együtt, a javításhoz is kell!',
      okos: 'Okoskodjunk, mint egy igazi szerelő!',
      forma: 'Nézzük a formákat és a színeket, a csavarok is sokfélék!',
      szamol: 'Számoljunk együtt, aztán javítsunk tovább!',
      test: 'Fedezzük fel a testünk csodáit, nekem antennám van, neked füled!',
    },
    end: 'Kész, újra tisztán hallom a hangomat! Köszönöm, hogy segítettél.',
  },
  // --- a kert első barátaival ---
  {
    id: 'nyuszi-szulinap', who: ['bunny'], value: 'osztozás',
    title: 'A nyuszi szülinapjára készülünk.',
    intro: 'Ma van a nyuszi szülinapja! Segítesz előkészíteni a zsúrt?',
    beats: ['Megvan a liszt a tortához.', 'A répát is lereszeltük.', 'Sül a répatorta, finom illat van.', 'Feldíszítettük a kertet szalagokkal.', 'Elkészültek a meghívók.', 'Megérkeztek a vendégek!'],
    at: {
      szamol: 'Számoljunk együtt, hogy mindenkinek jusson torta!',
      zene: 'Muzsikáljunk, hogy vidám legyen a szülinap!',
      rajz: 'Rajzoljunk valami szépet a nyuszi zsúrjára!',
      ceruza: 'Gyakoroljuk a vonalakat, kellenek a meghívókra!',
      sziv: 'Gondoljuk végig, hogyan lehetünk kedvesek a zsúron!',
    },
    end: 'A nyuszi mindenkinek adott a tortából. Együtt ünnepelni a legjobb!',
  },
  {
    id: 'nyuszi-bogre', who: ['bunny'], value: 'vigasztalás',
    title: 'Felvidítjuk a szomorú nyuszit.',
    intro: 'Eltört a nyuszi kedvenc bögréje, és most szomorú. Vidítsuk fel együtt!',
    beats: ['Leültünk mellé, és meghallgattuk.', 'Megöleltük, ettől kicsit jobb lett.', 'Egy felnőtt óvatosan összeszedte a darabokat.', 'Kitaláltuk, hogy festünk egy újat.', 'A nyuszi kiválasztotta a színeket.', 'Már mosolyog egy kicsit!'],
    at: {
      sziv: 'Gondoljuk végig, hogyan vigasztalunk valakit!',
      rajz: 'Rajzoljunk valami vidámat a nyuszinak!',
      forma: 'Nézzük a formákat és a színeket, milyen legyen az új bögre?',
      zene: 'Muzsikáljunk egy vidámat a nyuszinak!',
      szamol: 'Számoljunk együtt, a nyuszi is velünk számol!',
    },
    end: 'Kész az új bögre, és a nyuszi újra nevet. Jó, hogy mellette voltunk!',
  },
  {
    id: 'kutya-virag', who: ['dog'], value: 'bocsánatkérés',
    title: 'Segítünk a kutyának visszaültetni a virágokat.',
    intro: 'A kutya csontot keresett, és véletlenül kiásta a virágokat. Bocsánatot kért, segítsünk neki!',
    beats: ['Összegyűjtöttük a kiásott virágokat.', 'Visszatettük a földet a gödörbe.', 'Az első virág már a helyén van.', 'A kutya óvatosan kapar, nehogy megsértse a gyökeret.', 'Meglocsoltuk őket, felemelték a fejüket.', 'Már csak egy virág maradt!'],
    at: {
      szamol: 'Számoljunk együtt, aztán ültessünk tovább!',
      allat: 'Nézzük meg, mit tudunk az állatokról, a kutya is figyel!',
      egeszseg: 'Nézzük meg, mitől leszünk egészségesek, a kutya is figyel!',
      okos: 'Okoskodjunk együtt, a kutya is kíváncsi!',
      test: 'Fedezzük fel a testünk csodáit, aztán ültetünk tovább!',
    },
    end: 'Újra virágos a kert. A kutya bocsánatot kért, és jóvá is tette.',
  },
  {
    id: 'kutya-vihar', who: ['dog'], value: 'vigasztalás',
    title: 'Megnyugtatjuk a kutyát a vihar alatt.',
    intro: 'Dörög az ég, és a kutya megijedt. Maradjunk vele, amíg elmúlik a vihar!',
    beats: ['Odabújt hozzánk, és remeg egy kicsit.', 'Megsimogattuk a hátát.', 'Kapott egy puha takarót.', 'Már ritkábban dörög.', 'A kutya felemelte a fejét, és figyel.', 'Elállt az eső, csak csepeg a fa.'],
    at: {
      zene: 'Muzsikáljunk szépen, hogy a kutya ne a dörgést hallja!',
      vilag: 'Fedezzük fel a világot, amíg kint esik!',
      szamol: 'Számoljunk együtt, a kutya is figyel!',
      sziv: 'Gondoljuk végig, hogyan vigasztalunk valakit, aki fél!',
      okos: 'Okoskodjunk, amíg elmúlik a vihar!',
    },
    end: 'Kisütött a nap, és szivárvány lett! A kutya már nem fél, mert mellette voltunk.',
  },
  {
    id: 'zenekar', who: ['cat', 'bunny', 'dog'], value: 'együttműködés',
    title: 'Kerti zenekart alapítunk.',
    intro: 'A cica, a nyuszi és a kutya zenélni szeretne. Alapítsunk zenekart!',
    beats: ['A nyuszi talált egy kis dobot.', 'A kutya csengőt hozott.', 'A cica dorombolva dúdol.', 'Először mindenki egyszerre kezdett, nagy zaj lett.', 'Most felváltva játszanak, sokkal szebb.', 'Már egy egész dalt el tudnak játszani!'],
    at: {
      zene: 'Muzsikáljunk mi is a zenekarral!',
      hang: 'Figyeljük meg a hangokat, mint egy igazi zenész!',
      szamol: 'Számoljunk együtt, a zenészek is számolják az ütemet!',
      okos: 'Okoskodjunk, amíg a zenekar hangol!',
      sziv: 'Gondoljuk végig, hogyan figyelünk egymásra!',
    },
    end: 'Kész a koncert, mindenki tapsol! Úgy szép, ha figyelünk egymásra.',
  },
  {
    id: 'roka-rajz', who: ['fox', 'bunny'], value: 'megbocsátás',
    title: 'A róka és a nyuszi újra kibékül.',
    intro: 'A róka véletlenül rálépett a nyuszi rajzára. A nyuszi most szomorú.',
    beats: ['A róka odament a nyuszihoz.', 'Azt mondta: Bocsáss meg, nem akartam.', 'A nyuszi letörölte a könnyeit.', 'Együtt kezdtek egy új rajzot.', 'A róka hozzáfestett egy szivárványt.', 'Az új rajz még szebb lett!'],
    at: {
      rajz: 'Rajzoljunk mi is, ahogy a róka és a nyuszi!',
      ceruza: 'Gyakoroljuk a vonalakat, hogy szép legyen az új rajz!',
      sziv: 'Gondoljuk végig, mit mondunk, ha valami véletlenül elromlik!',
      forma: 'Nézzük a formákat és a színeket, kellenek az új rajzhoz!',
      szamol: 'Számoljunk együtt, amíg ők rajzolnak!',
    },
    end: 'A nyuszi megbocsátott, és újra barátok. Egy bocsánatkérés sokat segít!',
  },
  {
    id: 'piknik', who: ['fox', 'bunny'], value: 'osztozás',
    title: 'Piknikre megyünk a rókával és a nyuszival.',
    intro: 'Szép idő van, menjünk piknikezni! A róka és a nyuszi is jön.',
    beats: ['Bepakoltuk a kosarat.', 'Kiterítettük a pokrócot a fűre.', 'A róka elfelejtette otthon az uzsonnáját.', 'A nyuszi odaadta neki a fél almáját.', 'Mindenki megosztotta, amit hozott.', 'Jól laktunk, most pihenünk egy kicsit.'],
    at: {
      egeszseg: 'Nézzük meg, mitől leszünk erősek a kiránduláson!',
      vilag: 'Fedezzük fel a világot, amíg sétálunk a piknikre!',
      szamol: 'Számoljunk együtt, hogy mindenkinek jusson uzsonna!',
      allat: 'Nézzük meg, mit tudunk az állatokról, ők is velünk jönnek!',
      okos: 'Okoskodjunk egy kicsit a pokrócon ülve!',
    },
    end: 'Senki nem maradt éhes, mert megosztottuk az uzsonnát. Így jó együtt!',
  },
  {
    id: 'roka-suti', who: ['fox'], value: 'őszinteség',
    title: 'A róka elmondja az igazat.',
    intro: 'Eltűntek a sütik az asztalról. A róka valamit szeretne mondani.',
    beats: ['A róka lehajtotta a fejét.', 'Bevallotta: Megettem a sütiket, nem bírtam kivárni.', 'Megköszöntük, hogy elmondta az igazat.', 'Kitaláltuk, hogy süssünk újat együtt.', 'A róka keveri a tésztát.', 'Sülnek a sütik, finom illat van.'],
    at: {
      szamol: 'Számoljunk együtt, hogy mindenkinek jusson süti!',
      egeszseg: 'Nézzük meg, mitől leszünk egészségesek, amíg sül a süti!',
      sziv: 'Gondoljuk végig, miért jó igazat mondani!',
      forma: 'Nézzük a formákat és a színeket, milyen legyen a süti?',
      ido: 'Utazzunk a régi időkbe, régen is sütöttek kemencében!',
    },
    end: 'Mindenki kapott a friss sütiből. A róka megkönnyebbült, hogy igazat mondott.',
  },
  {
    id: 'hinta', who: ['dog', 'bunny', 'fox'], value: 'türelem',
    title: 'Kivárjuk a sorunkat a hintánál.',
    intro: 'Mindenki hintázni szeretne, de csak egy hinta van. Hogyan legyen?',
    beats: ['A kutya, a nyuszi és a róka egyszerre futott oda.', 'Kitalálták, hogy sorba állnak.', 'Először a nyuszi hintázik.', 'Most a kutya repül magasra.', 'A róka türelmesen várt, és most ő jön!', 'Mindenki sorra került, és újra kezdik.'],
    at: {
      szamol: 'Számoljunk együtt, amíg a sorunkra várunk!',
      sziv: 'Gondoljuk végig, hogyan várjuk ki a sorunkat!',
      okos: 'Okoskodjunk egy kicsit, amíg a hinta lendül!',
      test: 'Fedezzük fel a testünk csodáit, a hintázáshoz is kell!',
      zene: 'Muzsikáljunk, amíg mindenki sorra kerül!',
    },
    end: 'Mindenki hintázott, és senki sem veszekedett. Kivárni a sorunkat jó dolog!',
  },
  {
    id: 'idogep', who: [], value: 'tudás',
    title: 'Időgépet építünk, és régi időkbe utazunk.',
    intro: 'Építsünk képzeletbeli időgépet! Megnézzük, hogyan éltek régen.',
    beats: ['Kész az időgép, egy nagy dobozból.', 'Elsőként a dinoszauruszok korába repültünk.', 'Láttunk egy barlangot, ahol tűz pislákolt.', 'Egy várban lovagok gyakoroltak.', 'Egy régi faluban kenyeret sütöttek.', 'Lassan indulunk vissza a mai napba.'],
    at: {
      ido: 'Utazzunk a régi időkbe az időgéppel!',
      algo: 'Programozzuk be az időgépet a robottal!',
      szamol: 'Számoljunk együtt, amíg repül az időgép!',
      okos: 'Okoskodjunk, mint az igazi felfedezők!',
      vilag: 'Fedezzük fel a mai világot is!',
    },
    end: 'Hazaértünk az időutazásból. Milyen jó sok mindent megtudni a világról!',
  },
  // --- a tópart és a tanya barátaival ---
  {
    id: 'kacsa-to', who: ['duck'], value: 'tisztelet',
    title: 'Megtisztítjuk a tavat a kacsának.',
    intro: 'A kacsa tavába szemét került. Tegyük rendbe együtt!',
    beats: ['Kihalásztuk az első papírt.', 'Egy üres flakon is a kukába került.', 'A víz egyre tisztább.', 'Már látszanak a kis halak!', 'A tavirózsa újra kinyílt.', 'A kacsa boldogan csobban.'],
    at: {
      vilag: 'Nézzük meg, hogyan vigyázunk a világra!',
      allat: 'Nézzük meg, mit tudunk az állatokról, a kacsa is figyel!',
      szamol: 'Számoljunk együtt, aztán tisztítsuk tovább a tavat!',
      okos: 'Okoskodjunk egy kicsit a tóparton!',
      egeszseg: 'Nézzük meg, mitől leszünk egészségesek, a tiszta víz is kell!',
    },
    end: 'Tiszta a tó, a kacsa vidáman úszik. A természet megköszöni, ha vigyázunk rá!',
  },
  {
    id: 'bemutato', who: ['frog', 'duck'], value: 'tisztelet',
    title: 'Mindenki megmutatja, mit tud.',
    intro: 'A tóparton ma bemutatót tartunk. Mindenki megmutatja, mit tud!',
    beats: ['A béka nagyot ugrott a levélre.', 'A kacsa szépen siklik a vízen.', 'A béka is úszni próbált, de inkább ugrik.', 'A kacsa ugrani próbált, és nagyot nevetett.', 'Most együtt mutatnak be valamit.', 'A béka ugrik, a kacsa utána úszik!'],
    at: {
      test: 'Fedezzük fel a testünk csodáit, mindenki másban ügyes!',
      allat: 'Nézzük meg, mit tudunk az állatokról, ők is figyelnek!',
      szamol: 'Számoljunk együtt, ez a mi bemutatónk!',
      zene: 'Muzsikáljunk a bemutatóhoz!',
      okos: 'Okoskodjunk, ebben mi vagyunk ügyesek!',
    },
    end: 'Mindenki tapsolt mindenkinek. Mindenki másban ügyes, és ez így jó!',
  },
  {
    id: 'maci-vacok', who: ['bear'], value: 'törődés', months: [9, 10, 11],
    title: 'Segítünk a macinak előkészíteni a téli vackát.',
    intro: 'Hűvösödik, a maci téli álomra készül. Segítsünk neki puha vackot készíteni!',
    beats: ['Gyűjtöttünk száraz leveleket.', 'Puha mohát is hoztunk.', 'A maci megmutatta, hol lesz a vacka.', 'Kibéleltük a vackot levelekkel.', 'A maci kipróbálta, és nagyot ásított.', 'Már egészen kényelmes!'],
    at: {
      vilag: 'Fedezzük fel a világot, amíg leveleket gyűjtünk!',
      allat: 'Nézzük meg, mit tudunk az állatokról, a maci is figyel!',
      szamol: 'Számoljunk együtt, hogy elég levél legyen!',
      ido: 'Utazzunk a régi időkbe, amíg a maci pihen!',
      rajz: 'Rajzoljunk valami szépet a maci vackára!',
    },
    end: 'A maci elégedetten bebújt a vackába. Tavasszal kipihenten köszön majd!',
  },
  {
    id: 'sun-haza', who: ['hedgehog'], value: 'türelem',
    title: 'Hazakísérjük a sünt.',
    intro: 'A sün eltévedt a nagy kertben. Kísérjük haza együtt!',
    beats: ['Megkerestük a lábnyomait.', 'Átmentünk a kis hídon.', 'A sün lassan totyog, megvárjuk.', 'A bokrok alatt már ismerős neki.', 'Megérezte az otthona illatát!', 'Már látszik a kis vacka.'],
    at: {
      algo: 'Segítsünk a robotnak, ő is utat keres!',
      okos: 'Okoskodjunk, mint a jó útkeresők!',
      test: 'Fedezzük fel a testünk csodáit, a sün is pihen egyet!',
      szamol: 'Számoljunk együtt, aztán megyünk tovább!',
      allat: 'Nézzük meg, mit tudunk az állatokról, a sün is kíváncsi!',
    },
    end: 'A sün hazaért, és álmosan megköszönte. Türelemmel mindenki hazatalál!',
  },
  {
    id: 'tyuk-csibek', who: ['hen'], value: 'felelősség',
    title: 'Segítünk a tyúknak összegyűjteni a csibéket.',
    intro: 'Mindjárt esik, és a tyúk csibéi szétszaladtak. Gyűjtsük össze őket!',
    beats: ['Az első csibe a kerítésnél csipogott.', 'Kettő a szalmában bújt el.', 'Egy a kút mellett szaladgált.', 'Egy kis sárga pihe a fűben!', 'A tyúk hívogatja őket: kot-kot!', 'Már csak a legkisebb hiányzik.'],
    at: {
      szamol: 'Számoljunk együtt, hogy egy csibe se maradjon ki!',
      allat: 'Nézzük meg, mit tudunk az állatokról, a tyúk is figyel!',
      okos: 'Okoskodjunk, hol bújhat el egy kis csibe!',
      hang: 'Füleljünk jól, mint a tyúk, ha a csibéit hívja!',
      vilag: 'Fedezzük fel a világot, a tanyán is sok minden történik!',
    },
    end: 'Minden csibe a tyúk szárnya alatt van. Együtt vigyáztunk rájuk!',
  },
  {
    id: 'panda-maszik', who: ['panda'], value: 'kitartás',
    title: 'A panda fára mászni tanul.',
    intro: 'A panda szeretne felmászni a fára. Bátorítsuk együtt!',
    beats: ['Megfogta az alsó ágat.', 'Lecsúszott, de újra próbálja.', 'Most már a második ágon ül!', 'Egy kicsit megpihent.', 'Lassan, óvatosan mászik tovább.', 'Már majdnem a tetején van!'],
    at: {
      test: 'Fedezzük fel a testünk csodáit, a mászáshoz is kell!',
      egeszseg: 'Nézzük meg, mitől leszünk erősek, mint a panda!',
      szamol: 'Számoljunk együtt, a panda közben pihen!',
      algo: 'Segítsünk a robotnak, ő is gyakorol!',
      sziv: 'Gondoljuk végig, hogyan bátorítunk valakit!',
    },
    end: 'Fent van a panda, és büszkén integet! Sokat próbálkozott, és sikerült.',
  },
  {
    id: 'mokus-dio', who: ['squirrel'], value: 'segítség',
    title: 'Megkeressük a mókus elrejtett dióit.',
    intro: 'A mókus sok diót rejtett el, de elfelejtette, hová. Segítsünk neki!',
    beats: ['Egy dió a moha alatt volt.', 'Kettő a fa gyökerénél bújt meg.', 'A mókusnak eszébe jutott egy titkos hely.', 'Az odú tele van dióval!', 'Egy diót a szél elgurított a kőhöz.', 'Már tele van a kosár.'],
    at: {
      szamol: 'Számoljunk együtt, aztán keressük tovább a diókat!',
      okos: 'Okoskodjunk, mint a detektívek, hol lehet még dió!',
      allat: 'Nézzük meg, mit tudunk az állatokról, a mókus is figyel!',
      algo: 'Segítsünk a robotnak, ő is diót keres!',
      vilag: 'Fedezzük fel a világot, amíg diót keresünk!',
    },
    end: 'A mókus megtalálta a dióit, és nekünk is adott egyet. Köszöni a segítséget!',
  },
  {
    id: 'bagoly-csillag', who: ['owl'], value: 'tisztelet',
    title: 'Este a bagollyal nézzük a csillagokat.',
    intro: 'A bagoly napközben alszik, este ébred. Ma vele nézzük a csillagokat!',
    beats: ['Lemegy a nap, narancssárga az ég.', 'A bagoly kinyitotta a nagy, kerek szemét.', 'Feljött az első csillag.', 'Szentjánosbogarak gyúltak a fűben.', 'A bagoly megmutatta a Holdat.', 'Már tele van az ég csillagokkal!'],
    at: {
      vilag: 'Fedezzük fel a világot, este is sok csoda van!',
      szamol: 'Számoljunk együtt, mintha csillagokat számolnánk!',
      allat: 'Nézzük meg, mit tudunk az állatokról, a bagoly is figyel!',
      zene: 'Muzsikáljunk halkan, ahogy este illik!',
      ido: 'Utazzunk a régi időkbe, régen is nézték a csillagokat!',
    },
    end: 'Csodás este volt a bagollyal. Mindenki másképp pihen, és ez így jó!',
  },
  {
    id: 'eger-dal', who: ['mouse'], value: 'bátorság',
    title: 'Az egér először énekel a többieknek.',
    intro: 'A kis egér szépen énekel, de izgul. Bátorítsuk együtt!',
    beats: ['Az egér halkan gyakorol a fűben.', 'Odaállt a kis színpadra.', 'Remeg a bajsza, de mosolyog.', 'Elénekelte az első sort!', 'A többiek csendben, figyelmesen hallgatják.', 'Egyre bátrabban szól a hangja.'],
    at: {
      zene: 'Muzsikáljunk együtt, az egér is velünk gyakorol!',
      hang: 'Figyeljük meg a hangokat, mint egy igazi énekes!',
      sziv: 'Gondoljuk végig, mitől lesz bátrabb valaki!',
      szamol: 'Számoljunk együtt, amíg az egér készülődik!',
      test: 'Fedezzük fel a testünk csodáit, az éneklés is ezzel megy!',
    },
    end: 'Mindenki tapsolt az egérnek! Izgult, mégis megpróbálta: ez a bátorság.',
  },
  {
    id: 'malac-vendeg', who: ['pig'], value: 'kedvesség',
    title: 'A malac vendégül látja a barátait.',
    intro: 'A malac meghívta a barátait uzsonnára. Segítsünk neki készülődni!',
    beats: ['Megterítettük a kis asztalt.', 'Kerültek rá friss almák.', 'A malac virágot tett a közepére.', 'Kopogtak, megjöttek az első vendégek!', 'Mindenki kapott egy pohár vizet.', 'Vidám beszélgetés lett az asztalnál.'],
    at: {
      szamol: 'Számoljunk együtt, hogy minden vendégnek jusson tányér!',
      egeszseg: 'Nézzük meg, mitől lesz egészséges az uzsonna!',
      forma: 'Nézzük a formákat és a színeket, szép lesz az asztal!',
      sziv: 'Gondoljuk végig, hogyan fogadjuk kedvesen a vendéget!',
      okos: 'Okoskodjunk, amíg a vendégek megérkeznek!',
    },
    end: 'A vendégek jól érezték magukat, és megköszönték. A malac boldog, hogy adhatott!',
  },
  {
    id: 'barany-sal', who: ['sheep'], value: 'hála',
    title: 'Sálat kötünk a bárány gyapjából.',
    intro: 'A bárány nyáron odaadta a puha gyapját. Kössünk belőle sálat!',
    beats: ['Megmostuk a gyapjút.', 'Megfésültük, olyan lett, mint a felhő.', 'Fonalat sodortunk belőle.', 'Elkezdtük kötni a sálat.', 'Már egészen hosszú!', 'A végére bojt is került.'],
    at: {
      ido: 'Utazzunk a régi időkbe, régen is így készült a ruha!',
      ceruza: 'Gyakoroljuk a vonalakat, amíg kötünk!',
      szamol: 'Számoljunk együtt, amíg nő a sál!',
      forma: 'Nézzük a formákat és a színeket, milyen legyen a sál?',
      allat: 'Nézzük meg, mit tudunk az állatokról, a bárány is figyel!',
    },
    end: 'Kész a meleg sál, és az elsőt a bárány kapta. Köszönjük a gyapjút!',
  },
  {
    id: 'teknos-seta', who: ['turtle'], value: 'türelem',
    title: 'Sétálunk a teknőssel a tópartra.',
    intro: 'A teknős megmutatja a kedvenc virágát a tóparton. Sétáljunk vele lassan!',
    beats: ['A teknős kidugta a fejét a páncéljából.', 'Megtettük az első lépéseket.', 'Megálltunk, mert egy katicát nézett.', 'Lassan, de biztosan haladunk.', 'Már halljuk a víz csobogását.', 'Ott van a tópart!'],
    at: {
      vilag: 'Fedezzük fel a világot, lassan mindent jobban látunk!',
      szamol: 'Számoljunk együtt, a teknős közben is halad!',
      ido: 'Utazzunk a régi időkbe, a teknősök nagyon régóta élnek!',
      okos: 'Okoskodjunk egy kicsit, nem sietünk sehová!',
      allat: 'Nézzük meg, mit tudunk az állatokról, a teknős is figyel!',
    },
    end: 'Megláttuk a teknős kedvenc virágát! Megérte kivárni, amíg odaértünk.',
  },
  {
    id: 'poni-felvonulas', who: ['pony'], value: 'törődés',
    title: 'Szépítjük a pónit a nagy felvonulásra.',
    intro: 'Holnap felvonulás lesz a tanyán. Készítsük fel együtt a pónit!',
    beats: ['Lekeféltük a port a hátáról.', 'Kifésültük a sörényét.', 'Szalagot fontunk a farkába.', 'A póni ivott egy nagyot.', 'Kapott egy szép almát is.', 'Fényes a szőre, csak úgy ragyog.'],
    at: {
      egeszseg: 'Nézzük meg, hogyan vigyázunk magunkra, ahogy a pónira is!',
      forma: 'Nézzük a formákat és a színeket, milyen szalag legyen?',
      test: 'Fedezzük fel a testünk csodáit, a póni is figyel!',
      szamol: 'Számoljunk együtt, aztán fésüljük tovább!',
      rajz: 'Rajzoljunk valami szépet a felvonulásra!',
    },
    end: 'A póni büszkén lépked a felvonuláson. Látszik, hogy gondoskodtunk róla!',
  },
  // --- évszakhoz kötött mesék (csak a maguk hónapjaiban jönnek) ---
  {
    id: 'pillangok', who: ['cat'], value: 'tisztelet', months: [3, 4, 5],
    title: 'A cicával pillangókat figyelünk.',
    intro: 'Megjöttek a tavaszi pillangók! Figyeljük meg őket a cicával, csendben.',
    beats: ['A cica kergetni akarta őket, de megállt.', 'Leültünk a virágok mellé.', 'Egy sárga pillangó szállt a virágra.', 'A cica csak nézi, a farka sem mozdul.', 'Jött egy kék pillangó is!', 'Az egyik a cica orrára szállt!'],
    at: {
      vilag: 'Fedezzük fel a világot, tavasszal minden ébred!',
      forma: 'Nézzük a formákat és a színeket, mint a pillangók szárnyán!',
      allat: 'Nézzük meg, mit tudunk az állatokról, a cica is figyel!',
      szamol: 'Számoljunk együtt, csendben, mint a cica!',
      rajz: 'Rajzoljunk valami szépet, színeset, mint egy pillangó!',
    },
    end: 'A pillangók nem repültek el, mert nem kergettük őket. A cica is büszke magára!',
  },
  {
    id: 'locsolas', who: [], value: 'törődés', months: [6, 7, 8],
    title: 'Meglocsoljuk a kertet a nagy melegben.',
    intro: 'Nagyon meleg van, a virágok szomjasak. Locsoljuk meg együtt a kertet!',
    beats: ['Megtöltöttük a kis kannát.', 'A rózsák kaptak először vizet.', 'A fű is felfrissült.', 'A madaraknak is töltöttünk egy kis tálat.', 'A kertben minden csillog a cseppektől.', 'Szivárvány lett a locsoló fölött!'],
    at: {
      egeszseg: 'Igyunk egy korty vizet, aztán nézzük meg, mitől leszünk erősek!',
      vilag: 'Fedezzük fel a világot, nyáron is sok csoda van!',
      szamol: 'Számoljunk együtt, aztán locsoljunk tovább!',
      forma: 'Nézzük a formákat és a színeket, mint a szivárványban!',
      test: 'Fedezzük fel a testünk csodáit, a víz nekünk is kell!',
    },
    end: 'A kert felfrissült, és minden virág kinyílt. Megköszönik, hogy gondoltunk rájuk!',
  },
  {
    id: 'falevelek', who: [], value: 'tisztelet', months: [9, 10, 11],
    title: 'Őszi falevelekből képet készítünk.',
    intro: 'Színesek lettek a falevelek. Gyűjtsünk belőlük, és készítsünk képet!',
    beats: ['Találtunk egy piros levelet.', 'Egy sárga is került mellé.', 'Ez a barna olyan, mint egy kis kéz.', 'Kiraktuk őket a papírra.', 'Felragasztottuk az utolsó levelet is.', 'Már csak keret kell a képnek.'],
    at: {
      forma: 'Nézzük a formákat és a színeket, a levelek is sokfélék!',
      rajz: 'Rajzoljunk is a falevelek mellé!',
      vilag: 'Fedezzük fel a világot, ősszel minden színes!',
      szamol: 'Számoljunk együtt, aztán gyűjtsünk még leveleket!',
      okos: 'Okoskodjunk egy kicsit, amíg szárad a ragasztó!',
    },
    end: 'Kész a falevélkép, kitesszük a kert kapujára. Minden levél más, mégis együtt szépek!',
  },
  {
    id: 'hoember', who: [], value: 'együttműködés', months: [12, 1, 2],
    title: 'Hóembert építünk.',
    intro: 'Leesett az első hó! Építsünk együtt hóembert!',
    beats: ['Gurítottunk egy nagy hógolyót.', 'Kisebbet is gurítottunk a tetejére.', 'A feje is a helyén van.', 'Kapott két szenet szemnek.', 'Répa lett az orra.', 'Sálat is kötöttünk a nyakába.'],
    at: {
      forma: 'Nézzük a formákat és a színeket, a hóember is kerek!',
      szamol: 'Számoljunk együtt, aztán gurítsuk tovább a hógolyót!',
      egeszseg: 'Nézzük meg, mitől leszünk erősek a hidegben is!',
      vilag: 'Fedezzük fel a világot, télen is szép!',
      ceruza: 'Gyakoroljuk a vonalakat, mintha a hóba rajzolnánk!',
    },
    end: 'Kész a hóember, és integet nekünk! Együtt sokkal könnyebb volt.',
  },
];

const BY_ID = new Map(STORIES.map(s => [s.id, s]));
export const storyById = id => BY_ID.get(id) || null;

// A mentésben tárolt mese, ha még létezik (egy kihúzott vagy átnevezett mese helyett tisztán újat választunk)
export function activeStory(state) {
  const st = state && state.story;
  return st && typeof st === 'object' && storyById(st.id) ? st : null;
}
export const eligible = (s, present, month) => s.who.every(w => present.includes(w)) && (!s.months || s.months.includes(month));

// Új kör: a következő mese, ami a kertbe illik és még nem volt soron. Ha mind sorra került, elölről (a legutóbbi kivételével).
// Visszaad: a mentésbe írandó változás, vagy null (ha egyetlen mese sem illik, ami a tesztek szerint nem fordulhat elő).
export function startRound(state, present, month) {
  const used = Array.isArray(state?.storiesUsed) ? state.storiesUsed : [];
  const ok = STORIES.filter(s => eligible(s, present, month));
  const fresh = ok.filter(s => !used.includes(s.id));
  const last = used[used.length - 1];
  const s = fresh[0] || ok.find(x => x.id !== last) || ok[0];
  if (!s) return null;
  return { story: { id: s.id, step: 0, ended: false }, storiesUsed: fresh.length ? [...used, s.id].slice(-80) : [s.id] };
}

// A kör első mondata. Ha a kör már elkezdődött (újraindított játék a kör közepén), csak egy rövid emlékeztető.
export function openingLine(state, meter = 0) {
  const st = activeStory(state); if (!st || st.ended) return '';
  const s = storyById(st.id);
  return st.step > 0 || meter > 0 ? `Folytassuk! ${s.title}` : s.intro;
}
// Hívó mondat egy állomás első feladata előtt (ha a mesének van ide illő mondata)
export function inviteLine(state, station) {
  const st = activeStory(state); if (!st || st.ended) return '';
  return storyById(st.id).at[station] || '';
}
// Kész feladat után: a mérő szerint esedékes lépés (legfeljebb egy), vagy semmi. A lépések egyenletesen oszlanak el a
// körön: per csillagos körben a k-adik lépés a k·per/(lépések+1)-edik csillagnál jön; a kör utolsó csillagán a mese vége szól.
export function beatAfter(state, meter, per) {
  const st = activeStory(state); if (!st || st.ended || !(per > 0) || meter >= per) return null;
  const s = storyById(st.id), n = s.beats.length;
  const due = Math.min(n, Math.floor(meter * (n + 1) / per));
  if (due <= st.step) return null;
  return { text: s.beats[due - 1], story: { ...st, step: due } };
}
// A jutalomkapunál: a mese vége (egyszer)
export function endingLine(state) {
  const st = activeStory(state); if (!st || st.ended) return null;
  return { text: storyById(st.id).end, story: { ...st, ended: true } };
}
