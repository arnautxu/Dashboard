import { NextResponse } from 'next/server';
import { normalizeGroup, type WcStandingGroup } from '@/lib/worldcup';

export const revalidate = 60;

const BASE = 'https://api.football-data.org/v4/competitions/WC/standings';

export async function GET() {
  const token = process.env.FOOTBALL_DATA_TOKEN;

  if (!token) {
    return NextResponse.json(
      {
        error: 'NO_TOKEN',
        message:
          "Falta la variable d'entorn FOOTBALL_DATA_TOKEN. Configura-la a Vercel.",
      },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(BASE, {
      headers: { 'X-Auth-Token': token },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'UPSTREAM', message: `football-data.org ha respost ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();

    const groups: WcStandingGroup[] = (data.standings ?? [])
      .filter((s: any) => s.type === 'TOTAL' || !s.type)
      .map((s: any) => ({
        group: normalizeGroup(s.group),
        table: (s.table ?? []).map((row: any) => ({
          position: row.position,
          team: {
            name: row.team?.name ?? '',
            shortName: row.team?.shortName,
            tla: row.team?.tla,
            crest: row.team?.crest,
          },
          playedGames: row.playedGames ?? 0,
          won: row.won ?? 0,
          draw: row.draw ?? 0,
          lost: row.lost ?? 0,
          points: row.points ?? 0,
          goalsFor: row.goalsFor ?? 0,
          goalsAgainst: row.goalsAgainst ?? 0,
          goalDifference: row.goalDifference ?? 0,
        })),
      }))
      .filter((g: WcStandingGroup) => g.group);

    return NextResponse.json({ groups });
  } catch (e) {
    return NextResponse.json(
      { error: 'FETCH_FAILED', message: 'No s\'ha pogut contactar amb football-data.org' },
      { status: 502 },
    );
  }
}
