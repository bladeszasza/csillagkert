// A készségek magyar neve a szülői haladás-térképhez (a sorrend és a szavak a docs/pedagogia.md táblázataiból).
// A ténytáblák készségeinek a nevét maga a tábla adja (FACT_TABLES[].skills[].name).
import { FACT_TABLES } from './facts/index.js';

const GEN = {
  'szamol.megszamlalas': 'megszámlálás', 'szamol.ranezes': 'ránézéses felismerés', 'szamol.mennyiseg': 'mennyiség',
  'szamol.osszevetes': 'összevetés (több, kevesebb)', 'szamol.szamok': 'számok (nagyobb, kisebb)', 'szamol.szamsor': 'számsor (előtte, utána)',
  'szamol.osszeadas': 'összeadás tárgyakkal', 'szamol.kivonas': 'kivonás tárgyakkal', 'szamol.bontas': 'bontás', 'szamol.sorszam': 'sorszám',
  'forma.formak': 'formák', 'forma.szinek': 'színek', 'forma.targyszin': 'tárgy színe', 'forma.szinforma': 'szín és forma együtt',
  'forma.hany': 'hány forma?', 'forma.sarok': 'sarkok', 'forma.ter': 'téri viszonyok', 'forma.torony': 'torony', 'forma.meret': 'méret',
  'forma.irany': 'irány', 'forma.arnyek': 'árnyék',
  'okos.sorminta': 'sorminta', 'okos.kakukk': 'kakukktojás', 'okos.csoport': 'csoportosítás', 'okos.ellentet': 'ellentétek',
  'okos.parositas': 'párosítás', 'okos.analogia': 'analógia', 'okos.emlekezet': '„Mi tűnt el?"', 'okos.memoria': 'memória',
  'hang.szotag': 'szótag-taps', 'hang.hosszabb': 'melyik szó hosszabb?', 'hang.szotagkezdo': 'azonos első szótag', 'hang.rim': 'rím',
  'hang.kezdohang': 'kezdőhang', 'hang.veghang': 'véghang', 'hang.betu': 'betű és hang',
  'zene.harang': 'melyik harang?', 'zene.irany': 'merre ment a hang?', 'zene.dallam': 'dallamív', 'zene.ritmus': 'ritmus',
  'zene.magassag': 'legmagasabb, legmélyebb', 'zene.osszevet': 'hangerő, hossz, tempó', 'zene.visszhang': 'dallam-visszhang',
  'algo.epit': 'programépítés', 'algo.ciklus': 'ismétlés a programban', 'algo.hiba': 'hibakeresés', 'algo.hova': 'hová ér a robot?',
  'algo.melyik': 'melyik program jó?', 'algo.haakkor': 'ha–akkor',
  'ceruza.egyenes': 'egyenes vonalak', 'ceruza.ives': 'íves vonalak', 'ceruza.tores': 'tört vonalak', 'ceruza.forma': 'formák rajzolása',
  'ceruza.szam': 'számjegyek', 'ceruza.betu': 'nagybetűk', 'ceruza.szo': 'szavak', 'ceruza.ut': 'útvesztő', 'ceruza.pottyok': 'pöttyösszekötő',
  'rajz.masol': 'másolás', 'rajz.tukor': 'tükör', 'rajz.minta': 'sorminta', 'rajz.szabaly': 'szabály szerinti színezés',
  'rajz.matrica': 'térbeli szavak (matrica)', 'rajz.szabad': 'szabad rajz', 'rajz.kep': 'színező',
};
const FACT = Object.fromEntries(FACT_TABLES.flatMap(t => Object.entries(t.skills).map(([k, s]) => [k, s.name])));
export const SKILL_NAMES = { ...GEN, ...FACT };
export const skillName = id => SKILL_NAMES[id] || String(id).split('.').pop();
// a DIFER öt fejlődési szintje (docs/pedagogia.md 1.): a játék öt nehézségi szintje ezt követi
export const LEVEL_NAMES = ['előkészítő', 'kezdő', 'haladó', 'befejező', 'optimum'];
