'use client';

import { useEffect, useState } from 'react';
import WorldCupSection from '@/components/WorldCupSection';
import GtaSection from '@/components/GtaSection';
import { SPAIN_TZ } from '@/lib/worldcup';

export default function Page() {
  const [tab, setTab] = useState<'mundial' | 'gta'>('mundial');
  const [now, setNow] = useState('');

  useEffect(() => {
    const tick = () => {
      setNow(
        new Intl.DateTimeFormat('ca-ES', {
          timeZone: SPAIN_TZ,
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date()),
      );
    };
    tick();
    const id = setInterval(tick, 1000 * 30);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          El meu panell<span className="dot">.</span>
        </div>
        <div className="clock">
          <b>Hora espanyola</b>
          <br />
          {now}
        </div>
      </header>

      <nav className="tabs">
        <button
          className="tab"
          data-active={tab === 'mundial'}
          onClick={() => setTab('mundial')}
        >
          Mundial 2026
        </button>
        <button
          className="tab"
          data-accent="gta"
          data-active={tab === 'gta'}
          onClick={() => setTab('gta')}
        >
          GTA Online
        </button>
      </nav>

      {tab === 'mundial' ? <WorldCupSection /> : <GtaSection />}

      <p className="foot">
        Dades del Mundial via football-data.org · Negocis de GTA: estimacions de la comunitat (aprox.)
      </p>
    </main>
  );
}
