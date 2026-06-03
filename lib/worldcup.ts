// Tipus i helpers compartits per la secció del Mundial

export interface WcTeam {
  name: string;
  shortName?: string;
  tla?: string; // codi de 3 lletres (ESP, BRA...)
  crest?: string; // url de l'escut
}

export interface WcMatch {
  id: number;
  utcDate: string; // ISO UTC
  status: string; // SCHEDULED | TIMED | IN_PLAY | PAUSED | FINISHED ...
  matchday?: number | null;
  group?: string | null; // "GROUP_H"
  stage?: string;
  homeTeam: WcTeam;
  awayTeam: WcTeam;
  score: {
    home: number | null;
    away: number | null;
  };
}

export interface WcStandingRow {
  position: number;
  team: WcTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface WcStandingGroup {
  group: string; // "GROUP_H"
  table: WcStandingRow[];
}

// Selecció que segueix l'Arnau per defecte: Espanya (Grup H del Mundial 2026)
export const FAVOURITE_GROUP = 'GROUP_H';
export const FAVOURITE_TEAM_TLA = 'ESP';

export const SPAIN_TZ = 'Europe/Madrid';

// L'API fa servir dos formats: "GROUP_A" (partits) i "Group A" (classificacions).
// Ho normalitzem tot a la forma canònica "GROUP_X".
export function normalizeGroup(raw?: string | null): string {
  if (!raw) return '';
  const m = raw.toUpperCase().match(/GROUP[_\s]?([A-L])\b/);
  return m ? `GROUP_${m[1]}` : '';
}

// Nom de grup llegible: accepta qualsevol format -> "Grup H"
export function groupLabel(group?: string | null): string {
  const g = normalizeGroup(group);
  if (!g) return '';
  return `Grup ${g.replace('GROUP_', '')}`;
}

// Data "avui" en hora espanyola, format YYYY-MM-DD
export function todayInSpain(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: SPAIN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date()); // en-CA dona format YYYY-MM-DD
}

// Converteix una data ISO a YYYY-MM-DD en hora espanyola
export function isoToSpainDate(iso: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: SPAIN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date(iso));
}

// Hora del partit en format espanyol (ex: "18:00")
export function spainTime(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: SPAIN_TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

// Dia llegible en català (ex: "dijous 11 de juny")
export function spainDayLabel(iso: string): string {
  return new Intl.DateTimeFormat('ca-ES', {
    timeZone: SPAIN_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso));
}

export function isLive(status: string): boolean {
  return status === 'IN_PLAY' || status === 'PAUSED';
}

export function isFinished(status: string): boolean {
  return status === 'FINISHED';
}
