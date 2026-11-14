// A tény-állomások táblái (kézzel írt tények; a szülő átnézi, lásd ../approved.js).
// Egy új állomás táblája akkor kerül ide, ha teljes (≥ 250 önálló feladat), és a szülő megkapta átnézésre.
import { ALLAT, ALLAT_TABLE } from './allat.js';

export const FACT_TEMPLATES = [...ALLAT];
export const FACT_TABLES = [ALLAT_TABLE];
