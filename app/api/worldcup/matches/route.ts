import { NextResponse } from 'next/server';
import { normalizeGroup, type WcMatch } from '@/lib/worldcup';

// Cacheja la resposta 60s per no superar el límit del pla gratuït (10 req/min)
export const revalidate = 60;

const BASE = 'https://api.football-data.org/v4/competitions/WC/matches';

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

    const matches: WcMatch[] = (data.matches ?? []).map((m: any) => ({
      id: m.id,
      utcDate: m.utcDate,
      status: m.status,
      matchday: m.matchday ?? null,
      group: normalizeGroup(m.group),
      stage: m.stage,
      homeTeam: {
        name: m.homeTeam?.name ?? 'Per determinar',
        shortName: m.homeTeam?.shortName,
        tla: m.homeTeam?.tla,
        crest: m.homeTeam?.crest,
      },
      awayTeam: {
        name: m.awayTeam?.name ?? 'Per determinar',
        shortName: m.awayTeam?.shortName,
        tla: m.awayTeam?.tla,
        crest: m.awayTeam?.crest,
      },
      score: {
        home: m.score?.fullTime?.home ?? null,
        away: m.score?.fullTime?.away ?? null,
      },
    }));

    return NextResponse.json({ matches });
  } catch (e) {
    return NextResponse.json(
      { error: 'FETCH_FAILED', message: 'No s\'ha pogut contactar amb football-data.org' },
      { status: 502 },
    );
  }
}
