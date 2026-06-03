'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  GtaState,
  DEFAULT_STATE,
  calcBunker,
  calcAcidLab,
  calcNightclub,
  buildRecommendations,
  empireSummary,
  formatMoney,
  formatMinutes,
  NIGHTCLUB_GOODS,
  NightclubGood,
} from '@/lib/gta';

const STORAGE_KEY = 'gta-empire-v1';

export default function GtaSection() {
  const [state, setState] = useState<GtaState>(DEFAULT_STATE);
  const [mounted, setMounted] = useState(false);

  // Carrega de localStorage despres del muntatge (evita mismatch d'hidratacio)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
    } catch {
      /* ignora */
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* ignora */
      }
    }
  }, [state, mounted]);

  const bunker = useMemo(() => calcBunker(state.bunker), [state.bunker]);
  const acid = useMemo(() => calcAcidLab(state.acidlab), [state.acidlab]);
  const club = useMemo(() => calcNightclub(state.nightclub), [state.nightclub]);
  const recs = useMemo(() => buildRecommendations(state), [state]);
  const empire = useMemo(() => empireSummary(state), [state]);

  // helpers d'actualitzacio
  const setBunker = (p: Partial<GtaState['bunker']>) =>
    setState((s) => ({ ...s, bunker: { ...s.bunker, ...p } }));
  const setAcid = (p: Partial<GtaState['acidlab']>) =>
    setState((s) => ({ ...s, acidlab: { ...s.acidlab, ...p } }));
  const setClub = (p: Partial<GtaState['nightclub']>) =>
    setState((s) => ({ ...s, nightclub: { ...s.nightclub, ...p } }));

  const toggleGood = (g: NightclubGood) =>
    setState((s) => {
      const has = s.nightclub.ownedGoods.includes(g);
      return {
        ...s,
        nightclub: {
          ...s.nightclub,
          ownedGoods: has
            ? s.nightclub.ownedGoods.filter((x) => x !== g)
            : [...s.nightclub.ownedGoods, g],
        },
      };
    });

  if (!mounted) {
    return (
      <Section>
        <div className="skeleton" style={{ height: 120 }} />
      </Section>
    );
  }

  return (
    <Section>
      {/* KPIs d'imperi */}
      <div className="kpi-row reveal">
        <div className="kpi">
          <div className="label">Producció passiva (aprox.)</div>
          <div className="value mag">{formatMoney(empire.ratePerHour)}/h</div>
        </div>
        <div className="kpi">
          <div className="label">Valor potencial en estoc</div>
          <div className="value lim">{formatMoney(empire.potentialStock)}</div>
        </div>
      </div>

      {/* Passes recomanades */}
      <div className="card reveal" style={{ marginBottom: 16 }}>
        <div className="standings-title">Passes recomanades</div>
        {recs.map((r, i) => (
          <div className="rec" key={i} data-p={r.priority}>
            <span className="rb">
              {r.business}
              <br />
              {r.priority}
            </span>
            <span className="rt">{r.text}</span>
          </div>
        ))}
      </div>

      {/* Negocis */}
      <div className="grid">
        {/* BUNKER */}
        <div className="card biz-card reveal">
          <div className="biz-head">
            <div className="biz-name">Bunker</div>
            <div className="biz-stat">
              Estoc actual: <b>{state.bunker.stockPct}%</b> ·{' '}
              <b>{formatMoney(bunker.currentValue)}</b>
            </div>
          </div>

          <div className="biz-figures">
            <Fig label="Valor estoc ple" value={formatMoney(bunker.fullValue)} accent="mag" />
            <Fig label="Temps d'omplir" value={formatMinutes(bunker.fillMinutes)} />
            <Fig label="Ritme" value={`${formatMoney(bunker.ratePerHour)}/h`} accent="lim" />
            <Fig label="Benefici/lot" value={formatMoney(bunker.profitPerCycle)} />
          </div>

          <div className="controls">
            <Toggle on={state.bunker.equipment} onClick={() => setBunker({ equipment: !state.bunker.equipment })}>
              Equipament
            </Toggle>
            <Toggle on={state.bunker.staff} onClick={() => setBunker({ staff: !state.bunker.staff })}>
              Personal
            </Toggle>
            <Toggle on={state.bunker.security} onClick={() => setBunker({ security: !state.bunker.security })}>
              Seguretat
            </Toggle>
            <div className="seg">
              <button data-on={state.bunker.sellLocation === 'ls'} onClick={() => setBunker({ sellLocation: 'ls' })}>
                Los Santos
              </button>
              <button data-on={state.bunker.sellLocation === 'far'} onClick={() => setBunker({ sellLocation: 'far' })}>
                Altres estats
              </button>
            </div>
          </div>

          <Slider label="Estoc" value={state.bunker.stockPct} onChange={(v) => setBunker({ stockPct: v })} />

          <ul className="notes">
            {bunker.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
            <li>Subministraments per omplir: {formatMoney(bunker.supplyCost)} (0 si els robes).</li>
          </ul>
        </div>

        {/* ACID LAB */}
        <div className="card biz-card reveal">
          <div className="biz-head">
            <div className="biz-name">Acid Lab</div>
            <div className="biz-stat">
              Estoc actual: <b>{state.acidlab.stockPct}%</b> · <b>{formatMoney(acid.currentValue)}</b>
            </div>
          </div>

          <div className="biz-figures">
            <Fig label="Valor lot ple" value={formatMoney(acid.fullValue)} accent="mag" />
            <Fig label="Temps d'omplir" value={formatMinutes(acid.fillMinutes)} />
            <Fig label="Ritme" value={`${formatMoney(acid.ratePerHour)}/h`} accent="lim" />
            <Fig label="Benefici/lot" value={formatMoney(acid.profitPerCycle)} />
          </div>

          <div className="controls">
            <Toggle on={state.acidlab.equipment} onClick={() => setAcid({ equipment: !state.acidlab.equipment })}>
              Equipament
            </Toggle>
            <Toggle on={state.acidlab.named} onClick={() => setAcid({ named: !state.acidlab.named })}>
              Producte amb nom (+5%)
            </Toggle>
            <Toggle
              on={state.acidlab.boost}
              onClick={() => setAcid({ boost: !state.acidlab.boost })}
            >
              Boost diari
            </Toggle>
          </div>

          <Slider label="Estoc" value={state.acidlab.stockPct} onChange={(v) => setAcid({ stockPct: v })} />

          <ul className="notes">
            {acid.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
            <li>Subministraments per omplir: {formatMoney(acid.supplyCost)} (0 si els robes).</li>
          </ul>
        </div>

        {/* NIGHTCLUB */}
        <div className="card biz-card reveal">
          <div className="biz-head">
            <div className="biz-name">Discoteca (Nightclub)</div>
            <div className="biz-stat">
              Caixa: <b>{state.nightclub.popularityFull ? `${formatMoney(club.safePerHour)}/h` : 'aturada'}</b>
            </div>
          </div>

          <div className="biz-figures">
            <Fig label="Caixa forta (popularitat)" value={`${formatMoney(club.safePerHour)}/h`} accent="lim" />
            <Fig label="Límit caixa" value={formatMoney(club.safeCap)} />
            <Fig label="Magatzem (net Tony)" value={formatMoney(club.warehouseNet)} accent="mag" />
          </div>

          <div className="controls">
            <Toggle on={state.nightclub.equipment} onClick={() => setClub({ equipment: !state.nightclub.equipment })}>
              Equipament (clau)
            </Toggle>
            <Toggle on={state.nightclub.staff} onClick={() => setClub({ staff: !state.nightclub.staff })}>
              Personal
            </Toggle>
            <Toggle on={state.nightclub.extraFloors} onClick={() => setClub({ extraFloors: !state.nightclub.extraFloors })}>
              Plantes extra
            </Toggle>
            <Toggle
              on={state.nightclub.popularityFull}
              onClick={() => setClub({ popularityFull: !state.nightclub.popularityFull })}
            >
              Popularitat al màxim
            </Toggle>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
            Negocis vinculats (marca els que tens):
          </div>
          <div className="goods">
            {(Object.keys(NIGHTCLUB_GOODS) as NightclubGood[]).map((g) => {
              const info = NIGHTCLUB_GOODS[g];
              const on = state.nightclub.ownedGoods.includes(g);
              return (
                <span
                  key={g}
                  className="good-chip"
                  data-on={on}
                  data-tier={info.tier}
                  title={`Requereix: ${info.requires}`}
                  onClick={() => toggleGood(g)}
                >
                  {info.label}
                </span>
              );
            })}
          </div>

          {club.missingHighValue.length > 0 && (
            <ul className="notes" style={{ marginTop: 12 }}>
              <li>
                Bens d&apos;alt valor que et falten:{' '}
                {club.missingHighValue.map((m) => m.label).join(', ')}.
              </li>
            </ul>
          )}

          <ul className="notes" style={{ marginTop: 8 }}>
            {club.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="subnote">
        Totes les xifres de GTA són aproximades i poden variar amb actualitzacions de Rockstar o
        setmanes amb bonus (x2/x3). Pots afinar els valors base a <code>lib/gta.ts</code>. La teva
        configuració es desa al navegador.
      </p>
    </Section>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <div className="section-head">
        <span className="accent-bar gta" />
        <div>
          <div className="section-kicker">Negocis passius · Imperi criminal</div>
          <h2 className="section-title">GTA Online</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function Fig({ label, value, accent }: { label: string; value: string; accent?: 'mag' | 'lim' }) {
  return (
    <div className="fig">
      <div className="fl">{label}</div>
      <div className={`fv ${accent ?? ''}`}>{value}</div>
    </div>
  );
}

function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <span className="toggle" data-on={on} onClick={onClick}>
      <span className="dot" />
      {children}
    </span>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="slider-row">
      <label>{label}</label>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="slider-val">{value}%</span>
    </div>
  );
}
