// A tény-állomások táblái (kézzel írt tények; a szülő átnézi, lásd ../approved.js).
// Egy új állomás táblája akkor kerül ide, ha teljes (≥ 250 önálló feladat), és a szülő megkapta átnézésre.
import { ALLAT, ALLAT_TABLE } from './allat.js';
import { TEST, TEST_TABLE } from './test.js';
import { SZIV, SZIV_TABLE } from './sziv.js';
import { VILAG, VILAG_TABLE } from './vilag.js';

export const FACT_TEMPLATES = [...ALLAT, ...TEST, ...SZIV, ...VILAG];
export const FACT_TABLES = [ALLAT_TABLE, TEST_TABLE, SZIV_TABLE, VILAG_TABLE];
