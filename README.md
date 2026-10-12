# Savernake (unofficial)

Unofficial non-commercial fan web remake scaffold inspired by *Savernake Forest* / «Осенний лес».

> Not affiliated with Devir or Hobby World. Placeholders only — no official art or rulebook text.

## Stack

- **web** — React + Vite + TypeScript + Framer Motion + RU/EN i18n
- **server** — Node + Express + Socket.IO (rooms by shareable link)
- **shared** — types, Zod schemas, `GameEngine` stub

## Run locally

```bash
pnpm install
pnpm dev
```

- Client: http://localhost:5173  
- Server: http://localhost:3001  

Create a room on the landing page, open the shareable `/r/:code` link in another tab.

## Scripts

| Command | What |
|---------|------|
| `pnpm dev` | Client + server |
| `pnpm typecheck` | TS check all packages |
| `pnpm test` | Shared engine stub tests |

## Docs (authoritative in repo)

- **`GAME_RULES.md`** — game mechanics source of truth (do not change gameplay without checking)
- **`Cursor.md`** — points agents at `GAME_RULES.md`
- `LEGAL.md` — unofficial / non-commercial notice

## Repository

https://github.com/alexeiberkov/savernake
