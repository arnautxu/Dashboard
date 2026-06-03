// ============================================================================
//  GTA ONLINE — Motor de negocis
//  Totes les xifres son APROXIMADES (Rockstar les reajusta amb actualitzacions
//  i les setmanes d'esdeveniments donen multiplicadors x2/x3). Edita aqui els
//  valors si canvien o si vols afinar-los al teu cas.
//  Font de referencia: guies comunitaries (gtaboom, GTA Wiki) — juny 2026.
// ============================================================================

export type BusinessId = 'bunker' | 'acidlab' | 'nightclub';

// Estat configurable de cada negoci (es guarda al localStorage)
export interface BunkerState {
  owned: boolean;
  equipment: boolean; // +velocitat i +valor ($1.155.000)
  staff: boolean; // +velocitat ($598.500)
  security: boolean; // -risc raids ($351.000)
  sellLocation: 'ls' | 'far'; // Los Santos vs altres estats (+50%)
  stockPct: number; // 0-100, estoc actual
}

export interface AcidLabState {
  owned: boolean;
  equipment: boolean; // millora d'equipament ($250.000)
  named: boolean; // producte amb nom (+5%)
  boost: boolean; // boost diari actiu
  stockPct: number;
}

// Bens que la discoteca pot acumular i el negoci que cal tenir per a cadascun
export type NightclubGood =
  | 'cargo'
  | 'sporting'
  | 'south_american'
  | 'pharma'
  | 'organic'
  | 'printing'
  | 'cash';

export interface NightclubState {
  owned: boolean;
  equipment: boolean; // LA millora clau: accelera el magatzem
  staff: boolean; // la popularitat baixa mes lent
  extraFloors: boolean; // plantes d'emmagatzematge extra (mes capacitat)
  popularityFull: boolean; // popularitat al maxim?
  ownedGoods: NightclubGood[]; // de quins negocis vinculables tens
}

export interface GtaState {
  bunker: BunkerState;
  acidlab: AcidLabState;
  nightclub: NightclubState;
}

export const DEFAULT_STATE: GtaState = {
  bunker: {
    owned: true,
    equipment: false,
    staff: false,
    security: false,
    sellLocation: 'ls',
    stockPct: 0,
  },
  acidlab: {
    owned: true,
    equipment: false,
    named: false,
    boost: false,
    stockPct: 0,
  },
  nightclub: {
    owned: true,
    equipment: false,
    staff: false,
    extraFloors: false,
    popularityFull: true,
    // L'Acid Lab NO es vincula a la discoteca. El Bunker si (Sporting Goods).
    ownedGoods: ['sporting'],
  },
};

// ---------------------------------------------------------------------------
//  BUNKER
// ---------------------------------------------------------------------------
const BUNKER = {
  baseValueLS: 700_000, // estoc ple, sense millores, venent a Los Santos
  equipmentValueBonus: 175_000,
  staffValueBonus: 175_000,
  farMultiplier: 1.5, // vendre a altres estats
  baseFillMinutes: 600, // ~10h sense millores
  equipmentSpeed: 0.7, // multiplicador de temps amb equipament
  staffSpeed: 0.7, // multiplicador de temps amb personal
  supplyCostToFill: 525_000, // ~7 resubministraments de $75.000 (0 si robes)
  upgradeCost: { equipment: 1_155_000, staff: 598_500, security: 351_000 },
};

// ---------------------------------------------------------------------------
//  ACID LAB
// ---------------------------------------------------------------------------
const ACID = {
  baseValue: 237_600, // lot ple sense millora
  equipmentValue: 335_200, // lot ple amb millora d'equipament
  namedBonus: 0.05, // +5% si poses nom al producte
  capacityUnits: 160,
  baseFillMinutes: 360, // ~6h sense millora
  equipmentFillMinutes: 240, // ~4h amb millora
  boostFillMinutes: 180, // ~3h amb boost diari actiu
  supplyCostToFill: 192_000, // comprant subministraments (0 si robes)
  upgradeCost: { equipment: 250_000 },
};

// ---------------------------------------------------------------------------
//  NIGHTCLUB
// ---------------------------------------------------------------------------
export const NIGHTCLUB_GOODS: Record<
  NightclubGood,
  { label: string; requires: string; fullValue: number; tier: 'alt' | 'mig' | 'baix' }
> = {
  cargo: { label: 'Cargo and Shipments', requires: 'Magatzem Special Cargo (CEO)', fullValue: 490_000, tier: 'alt' },
  south_american: { label: 'South American Imports', requires: 'Cocaine Lockup', fullValue: 420_000, tier: 'alt' },
  cash: { label: 'Cash Creation', requires: 'Counterfeit Cash factory', fullValue: 245_000, tier: 'mig' },
  pharma: { label: 'Pharmaceutical Research', requires: 'Meth Lab', fullValue: 245_000, tier: 'mig' },
  sporting: { label: 'Sporting Goods', requires: 'Bunker', fullValue: 245_000, tier: 'mig' },
  organic: { label: 'Organic Produce', requires: 'Weed Farm', fullValue: 175_000, tier: 'baix' },
  printing: { label: 'Printing and Copying', requires: 'Document Forgery', fullValue: 140_000, tier: 'baix' },
};

const NIGHTCLUB = {
  safePerGameDay: 50_000, // amb popularitat al maxim, cada dia de joc (48 min reals)
  safeCap: 250_000,
  tonyCut: 0.1, // Tony es queda el 10% de les vendes del magatzem
  extraFloorsFactor: 1.0, // amb totes les plantes
  noFloorsFactor: 0.4, // nomes la planta inicial (capacitat reduida)
  upgradeNote: { equipment: '~$1,4M', staff: '~$700k' },
};

const GAME_DAY_MINUTES = 48; // 1 dia de joc = 48 min reals

// ===========================================================================
//  CALCULS
// ===========================================================================

export interface BusinessResult {
  id: BusinessId;
  name: string;
  fullValue: number; // valor de l'estoc ple
  currentValue: number; // valor de l'estoc actual (stockPct)
  fillMinutes: number; // minuts per omplir de 0 a 100
  ratePerHour: number; // $/hora de producció
  supplyCost: number; // cost de subministraments per omplir
  profitPerCycle: number; // benefici net per lot ple (comprant subministraments)
  notes: string[];
}

export function calcBunker(s: BunkerState): BusinessResult {
  let fullValue = BUNKER.baseValueLS;
  if (s.equipment) fullValue += BUNKER.equipmentValueBonus;
  if (s.staff) fullValue += BUNKER.staffValueBonus;
  if (s.sellLocation === 'far') fullValue *= BUNKER.farMultiplier;

  let fillMinutes = BUNKER.baseFillMinutes;
  if (s.equipment) fillMinutes *= BUNKER.equipmentSpeed;
  if (s.staff) fillMinutes *= BUNKER.staffSpeed;

  const ratePerHour = fullValue / (fillMinutes / 60);
  const supplyCost = BUNKER.supplyCostToFill;

  return {
    id: 'bunker',
    name: 'Bunker',
    fullValue: Math.round(fullValue),
    currentValue: Math.round((fullValue * s.stockPct) / 100),
    fillMinutes: Math.round(fillMinutes),
    ratePerHour: Math.round(ratePerHour),
    supplyCost,
    profitPerCycle: Math.round(fullValue - supplyCost),
    notes: [
      s.sellLocation === 'ls'
        ? 'Venent a Los Santos (valor mes alt i 1 sol viatge).'
        : 'Venent a altres estats: +50% pero pot caldre mes vehicles.',
      'Producció passiva: omple mentre tens subministraments.',
    ],
  };
}

export function calcAcidLab(s: AcidLabState): BusinessResult {
  let fullValue = s.equipment ? ACID.equipmentValue : ACID.baseValue;
  if (s.named) fullValue *= 1 + ACID.namedBonus;

  let fillMinutes = ACID.baseFillMinutes;
  if (s.equipment) fillMinutes = ACID.equipmentFillMinutes;
  if (s.equipment && s.boost) fillMinutes = ACID.boostFillMinutes;

  const ratePerHour = fullValue / (fillMinutes / 60);
  const supplyCost = ACID.supplyCostToFill;

  return {
    id: 'acidlab',
    name: 'Acid Lab',
    fullValue: Math.round(fullValue),
    currentValue: Math.round((fullValue * s.stockPct) / 100),
    fillMinutes: Math.round(fillMinutes),
    ratePerHour: Math.round(ratePerHour),
    supplyCost,
    profitPerCycle: Math.round(fullValue - supplyCost),
    notes: [
      'Venda sempre amb 1 sol vehicle → ideal en solitari.',
      "L'estoc no es pot robar (no hi ha raids).",
    ],
  };
}

export interface NightclubResult {
  name: string;
  safePerHour: number;
  safeCap: number;
  warehouseFullValue: number; // valor brut amb els bens que tens
  warehouseNet: number; // despres del 10% de Tony
  activeGoods: { good: NightclubGood; label: string; value: number }[];
  missingHighValue: { good: NightclubGood; label: string; requires: string }[];
  notes: string[];
}

export function calcNightclub(s: NightclubState): NightclubResult {
  const safePerHour = s.popularityFull
    ? Math.round((NIGHTCLUB.safePerGameDay * 60) / GAME_DAY_MINUTES)
    : 0;

  const floorsFactor = s.extraFloors ? NIGHTCLUB.extraFloorsFactor : NIGHTCLUB.noFloorsFactor;

  const activeGoods = s.ownedGoods.map((good) => ({
    good,
    label: NIGHTCLUB_GOODS[good].label,
    value: Math.round(NIGHTCLUB_GOODS[good].fullValue * floorsFactor),
  }));

  const warehouseFullValue = activeGoods.reduce((sum, g) => sum + g.value, 0);
  const warehouseNet = Math.round(warehouseFullValue * (1 - NIGHTCLUB.tonyCut));

  // bens d'alt valor que NO tens vinculats
  const missingHighValue = (Object.keys(NIGHTCLUB_GOODS) as NightclubGood[])
    .filter((g) => NIGHTCLUB_GOODS[g].tier === 'alt' && !s.ownedGoods.includes(g))
    .map((g) => ({ good: g, label: NIGHTCLUB_GOODS[g].label, requires: NIGHTCLUB_GOODS[g].requires }));

  return {
    name: 'Discoteca (Nightclub)',
    safePerHour,
    safeCap: NIGHTCLUB.safeCap,
    warehouseFullValue,
    warehouseNet,
    activeGoods,
    missingHighValue,
    notes: [
      'Els tècnics produeixen sense cost de subministraments: només cal tenir el negoci actiu.',
      "L'Acid Lab NO es vincula a la discoteca (no té categoria de tècnic).",
      'Tony es queda un 10% de les vendes del magatzem.',
    ],
  };
}

// ===========================================================================
//  RECOMANACIONS (motor de passes a seguir)
// ===========================================================================

export interface Recommendation {
  business: string;
  priority: 'alta' | 'mitjana' | 'baixa' | 'ok';
  text: string;
}

export function buildRecommendations(state: GtaState): Recommendation[] {
  const recs: Recommendation[] = [];

  // ---- BUNKER ----
  if (state.bunker.owned) {
    if (!state.bunker.equipment) {
      recs.push({
        business: 'Bunker',
        priority: 'alta',
        text: 'Compra la millora d\'Equipament ($1.155.000): puja el valor de l\'estoc i accelera la producció. És la de més impacte.',
      });
    }
    if (!state.bunker.staff) {
      recs.push({
        business: 'Bunker',
        priority: 'mitjana',
        text: 'Compra la millora de Personal ($598.500): accelera producció i recerca, i puja el valor.',
      });
    }
    if (state.bunker.sellLocation === 'far') {
      recs.push({
        business: 'Bunker',
        priority: 'baixa',
        text: 'Vendre a altres estats dona +50%, però sol requerir més vehicles. En solitari, sovint compensa vendre a Los Santos.',
      });
    }
    if (!state.bunker.security) {
      recs.push({
        business: 'Bunker',
        priority: 'baixa',
        text: 'Opcional: millora de Seguretat ($351.000). No dona benefici, només redueix el risc de raids.',
      });
    }
    if (state.bunker.equipment && state.bunker.staff) {
      recs.push({
        business: 'Bunker',
        priority: 'ok',
        text: 'Bunker optimitzat ✓. Mantén subministraments i ven quan l\'estoc estigui al 100%.',
      });
    }
  }

  // ---- ACID LAB ----
  if (state.acidlab.owned) {
    if (!state.acidlab.equipment) {
      recs.push({
        business: 'Acid Lab',
        priority: 'alta',
        text: 'Fes 10 Fooligan Jobs i compra la millora d\'Equipament ($250.000): puja el lot de $237.600 a $335.200. Barata i molt rendible.',
      });
    }
    if (!state.acidlab.named) {
      recs.push({
        business: 'Acid Lab',
        priority: 'mitjana',
        text: 'Posa nom al producte (+5% de valor; gratis el primer cop).',
      });
    }
    if (state.acidlab.equipment && !state.acidlab.boost) {
      recs.push({
        business: 'Acid Lab',
        priority: 'baixa',
        text: 'Activa el Boost de producció cada dia (taula de químics) per omplir més ràpid.',
      });
    }
    if (state.acidlab.equipment && state.acidlab.named) {
      recs.push({
        business: 'Acid Lab',
        priority: 'ok',
        text: 'Acid Lab optimitzat ✓. La venda és sempre amb 1 vehicle: perfecte per fer en solitari.',
      });
    }
  }

  // ---- NIGHTCLUB ----
  if (state.nightclub.owned) {
    if (!state.nightclub.equipment) {
      recs.push({
        business: 'Discoteca',
        priority: 'alta',
        text: 'Compra la millora d\'Equipament de la discoteca: és LA millora clau, accelera l\'acumulació del magatzem.',
      });
    }
    if (!state.nightclub.popularityFull) {
      recs.push({
        business: 'Discoteca',
        priority: 'alta',
        text: 'La popularitat no és al màxim: fes una missió de promoció (Tony) o canvia de DJ ($10k) per omplir-la. Sense popularitat, la caixa forta no genera.',
      });
    }
    // Nomes Bunker vinculat (cas tipic d'aquest perfil)
    const onlyLowLink =
      state.nightclub.ownedGoods.length <= 1 &&
      !state.nightclub.ownedGoods.some((g) => NIGHTCLUB_GOODS[g].tier === 'alt');
    if (onlyLowLink) {
      recs.push({
        business: 'Discoteca',
        priority: 'alta',
        text: '⚠️ Ara mateix gairebé no aprofites el magatzem (només "Sporting Goods" del Bunker). Per treure\'n el màxim, compra negocis vinculables d\'alt valor: un Magatzem de Special Cargo (Cargo and Shipments) i/o un Cocaine Lockup (South American Imports).',
      });
    }
    if (!state.nightclub.staff) {
      recs.push({
        business: 'Discoteca',
        priority: 'baixa',
        text: 'Opcional: millora de Personal — la popularitat baixa més lent, així manteniment de la caixa forta.',
      });
    }
    if (!state.nightclub.extraFloors) {
      recs.push({
        business: 'Discoteca',
        priority: 'baixa',
        text: 'Amplia les plantes del magatzem per pujar la capacitat total (i el valor per venda).',
      });
    }
    recs.push({
      business: 'Discoteca',
      priority: 'baixa',
      text: 'Recull la caixa forta abans que arribi a $250.000 o deixaràs de guanyar.',
    });
  }

  // Ordena per prioritat
  const order = { alta: 0, mitjana: 1, baixa: 2, ok: 3 };
  return recs.sort((a, b) => order[a.priority] - order[b.priority]);
}

// Resum d'imperi: produccio passiva total aproximada i valor potencial
export function empireSummary(state: GtaState) {
  let ratePerHour = 0;
  let potentialStock = 0;

  if (state.bunker.owned) {
    const b = calcBunker(state.bunker);
    ratePerHour += b.ratePerHour;
    potentialStock += b.fullValue;
  }
  if (state.acidlab.owned) {
    const a = calcAcidLab(state.acidlab);
    ratePerHour += a.ratePerHour;
    potentialStock += a.fullValue;
  }
  if (state.nightclub.owned) {
    const n = calcNightclub(state.nightclub);
    ratePerHour += n.safePerHour;
    potentialStock += n.warehouseNet;
  }

  return {
    ratePerHour: Math.round(ratePerHour),
    potentialStock: Math.round(potentialStock),
  };
}

export function formatMoney(n: number): string {
  return '$' + n.toLocaleString('es-ES');
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}
