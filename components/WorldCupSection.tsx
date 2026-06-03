'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  WcMatch,
  WcStandingGroup,
  groupLabel,
  todayInSpain,
  isoToSpainDate,
  spainTime,
  spainDayLabel,
  isLive,
  isFinished,
  FAVOURITE_GROUP,
  FAVOURITE_TEAM_TLA,
} from '@/lib/worldcup';

export default function WorldCupSection() {
  const [matches, setMatches] = useState<WcMatch[] | null>(null);
  const [groups, setGroups] = useState<WcStandingGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [mRes, sRes] = await Promise.all([
          fetch('/api/worldcup/matches'),
          fetch('/api/worldcup/standings'),
        ]);
        if (mRes.status === 500) {
          const j = await mRes.json();
          if (j.error === 'NO_TOKEN') {
            if (!cancelled) setConfigError(true);
            return;
          }
        }
        if (!mRes.ok) throw new Error('matches');
        const mJson = await mRes.json();
        const sJson = sRes.ok ? await sRes.json() : { groups: [] };
        if (!cancelled) {
          setMatches(mJson.matches ?? []);
          setGroups(sJson.groups ?? []);
        }
      } catch {
        if (!cancelled) setError('No s\'han pogut carregar les dades del Mundial.');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Partits d'avui (hora espanyola); si no n'hi ha, busca el proper dia amb partits
  const { dayLabel, dayMatches, isToday } = useMemo(() => {
    if (!matches) return { dayLabel: '', dayMatches: [] as WcMatch[], isToday: true };
    const today = todayInSpain();
    const todays = matches.filter((m) => isoToSpainDate(m.utcDate) === today);
    if (todays.length > 0) {
      return { dayLabel: spainDayLabel(todays[0].utcDate), dayMatches: sortByTime(todays), isToday: true };
    }
    // proper dia amb partits
    const future = matches
      .filter((m) => isoToSpainDate(m.utcDate) >= today)
      .sort((a, b) => a.utcDate.localeCompare(b.utcDate));
    if (future.length === 0) return { dayLabel: '', dayMatches: [], isToday: false };
    const nextDate = isoToSpainDate(future[0].utcDate);
    const next = future.filter((m) => isoToSpainDate(m.utcDate) === nextDate);
    return { dayLabel: spainDayLabel(next[0].utcDate), dayMatches: sortByTime(next), isToday: false };
  }, [matches]);

  // Grups a mostrar: els dels equips que juguen aquell dia + sempre el d'Espanya
  const groupsToShow = useMemo(() => {
    if (!groups) return [];
    const wanted = new Set<string>([FAVOURITE_GROUP]);
    for (const m of dayMatches) {
      if (m.group && m.group.startsWith('GROUP_')) wanted.add(m.group);
    }
    return groups
      .filter((g) => wanted.has(g.group))
      .sort((a, b) => a.group.localeCompare(b.group));
  }, [groups, dayMatches]);

  if (configError) {
    return (
      <Section>
        <div className="notice">
          Falta configurar el token de l&apos;API. Crea una variable d&apos;entorn{' '}
          <code>FOOTBALL_DATA_TOKEN</code> a Vercel amb el teu token gratuït de{' '}
          football-data.org i torna a desplegar. Tens les instruccions al README.
        </div>
      </Section>
    );
  }

  if (error) {
    return (
      <Section>
        <div className="card muted">{error}</div>
      </Section>
    );
  }

  return (
    <Section>
      <div className="card reveal" style={{ marginBottom: 16 }}>
        <div className="standings-title" style={{ marginBottom: 14 }}>
          {matches === null
            ? 'Carregant partits…'
            : isToday
              ? `Partits d'avui — ${dayLabel}`
              : dayMatches.length
                ? `Avui no hi ha partits · Pròxims: ${dayLabel}`
                : 'Sense partits propers'}
        </div>

        {matches === null && (
          <>
            <div className="skeleton" />
            <div className="skeleton" />
          </>
        )}

        {matches !== null && dayMatches.length === 0 && (
          <div className="empty">
            <div className="big">No hi ha cap partit programat.</div>
            <div>El Mundial comença l&apos;11 de juny de 2026.</div>
          </div>
        )}

        {dayMatches.map((m) => (
          <MatchRow key={m.id} m={m} />
        ))}
      </div>

      <div className="grid grid-2">
        {groups === null && (
          <>
            <div className="skeleton" style={{ height: 180 }} />
            <div className="skeleton" style={{ height: 180 }} />
          </>
        )}
        {groupsToShow.map((g) => (
          <StandingsTable key={g.group} g={g} />
        ))}
        {groups !== null && groupsToShow.length === 0 && (
          <div className="card muted">
            Encara no hi ha classificacions disponibles (es publiquen quan comença la fase de grups).
          </div>
        )}
      </div>

      <p className="subnote">
        Es mostren les classificacions dels grups amb partit aquell dia, més el d&apos;Espanya (Grup H).
        Els horaris són en hora peninsular espanyola.
      </p>
    </Section>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <div className="section-head">
        <span className="accent-bar" />
        <div>
          <div className="section-kicker">FIFA World Cup · USA · Canadà · Mèxic</div>
          <h2 className="section-title">Mundial 2026</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function MatchRow({ m }: { m: WcMatch }) {
  const live = isLive(m.status);
  const finished = isFinished(m.status);
  const showScore = live || finished;

  return (
    <div className="match reveal">
      <div className="team">
        {m.homeTeam.crest && <img src={m.homeTeam.crest} alt="" />}
        <span className="nm">{m.homeTeam.shortName || m.homeTeam.name}</span>
      </div>
      <div className="mid">
        {showScore ? (
          <div className="score">
            {m.score.home ?? 0}–{m.score.away ?? 0}
          </div>
        ) : (
          <div className="time">{spainTime(m.utcDate)}</div>
        )}
        {live ? (
          <span className="badge-live">EN DIRECTE</span>
        ) : finished ? (
          <span className="badge-ft">FINAL</span>
        ) : (
          <div className="grp">{groupLabel(m.group)}</div>
        )}
      </div>
      <div className="team away">
        {m.awayTeam.crest && <img src={m.awayTeam.crest} alt="" />}
        <span className="nm">{m.awayTeam.shortName || m.awayTeam.name}</span>
      </div>
    </div>
  );
}

function StandingsTable({ g }: { g: WcStandingGroup }) {
  return (
    <div className="card reveal">
      <div className="standings-title">{groupLabel(g.group)}</div>
      <table className="standings">
        <thead>
          <tr>
            <th></th>
            <th className="left">Equip</th>
            <th>PJ</th>
            <th>G</th>
            <th>E</th>
            <th>P</th>
            <th>DG</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {g.table.map((row) => {
            const qualifies = row.position <= 2;
            const isFav = row.team.tla === FAVOURITE_TEAM_TLA;
            return (
              <tr
                key={row.team.name + row.position}
                className={`${qualifies ? 'qualify' : ''} ${isFav ? 'highlight-team' : ''}`}
              >
                <td>
                  <span className="pos">{row.position}</span>
                </td>
                <td className="left">
                  <span className="row-team">
                    {row.team.crest && <img src={row.team.crest} alt="" />}
                    {row.team.shortName || row.team.name}
                  </span>
                </td>
                <td>{row.playedGames}</td>
                <td>{row.won}</td>
                <td>{row.draw}</td>
                <td>{row.lost}</td>
                <td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                <td className="pts">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function sortByTime(arr: WcMatch[]): WcMatch[] {
  return [...arr].sort((a, b) => a.utcDate.localeCompare(b.utcDate));
}
