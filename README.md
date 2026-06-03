# El meu panell — Mundial 2026 + GTA Online

Dashboard personal fet amb **Next.js 14** (App Router + TypeScript), llest per desplegar a **Vercel**.

Dues seccions:

1. **Mundial 2026** — partits del dia en **hora espanyola** i classificacions dels grups dels equips que juguen aquell dia (sempre amb el Grup H d'Espanya destacat). Les dades venen de [football-data.org](https://www.football-data.org) a través d'una funció serverless que amaga el token.
2. **GTA Online** — tracker configurable dels teus negocis (Bunker, Acid Lab i Discoteca): producció, valor d'estoc, ritme per hora i **passes recomanades** segons les teves millores. Es desa al navegador (localStorage).

---

## 1. Obtenir el token de football-data.org (gratuït)

1. Registra't a https://www.football-data.org/client/register
2. Rebràs un **API token** per correu.
3. El pla gratuït cobreix el Mundial (codi `WC`) amb un límit de 10 peticions/min — més que suficient (la app cacheja les respostes 60s).

## 2. Provar-ho en local

```bash
npm install
cp .env.example .env.local      # i posa-hi el teu token
npm run dev                     # http://localhost:3000
```

A `.env.local`:

```
FOOTBALL_DATA_TOKEN=el_teu_token
```

## 3. Desplegar a Vercel

1. Puja el projecte a un repositori de GitHub.
2. A [vercel.com](https://vercel.com) → **Add New → Project** → importa el repo.
3. Framework: Vercel detectarà **Next.js** automàticament. No cal tocar res.
4. A **Settings → Environment Variables** afegeix:
   - **Name:** `FOOTBALL_DATA_TOKEN`
   - **Value:** el teu token
   - **Environments:** Production, Preview i Development
5. **Deploy**. Llest.

> Si canvies la variable d'entorn després del primer desplegament, cal fer un **Redeploy** perquè agafi el valor nou.

---

## Personalització ràpida

- **Equip / grup favorit:** a `lib/worldcup.ts`, variables `FAVOURITE_GROUP` i `FAVOURITE_TEAM_TLA` (per defecte Espanya, Grup H).
- **Xifres de GTA:** a `lib/gta.ts`. Tots els valors (preus de millores, valor d'estoc, temps d'omplir, etc.) són constants editables i comentades. Ajusta'ls si Rockstar reequilibra o si hi ha setmana de bonus.
- **Negocis de GTA que tens:** es marquen directament a la interfície i es guarden al navegador.

## Estructura

```
app/
  layout.tsx                 tipografies + metadata
  page.tsx                   pestanyes + rellotge
  globals.css                sistema de disseny
  api/worldcup/matches/      proxy de partits (amaga el token)
  api/worldcup/standings/    proxy de classificacions
components/
  WorldCupSection.tsx
  GtaSection.tsx
lib/
  worldcup.ts                tipus + helpers d'hora espanyola
  gta.ts                     model de negocis + recomanacions
```

## Notes

- Les classificacions estaran a zero fins que comenci la fase de grups (11 de juny de 2026).
- Les xifres de GTA són estimacions de la comunitat (gtaboom, GTA Wiki) i poden variar amb actualitzacions.
