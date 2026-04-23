# CLAUDE.md

## Project Overview

DCL Genesis Build — AI-powered architecture catalog and builder for Decentraland. Funded by Regenesis Grants Program Season 1 (Tech Ecosystem).

## What It Does

1. **Building Catalog**: Indexes every building deployed on Decentraland LANDs from the Content Server API
2. **AI Build Engine**: Natural language → Claude API → Blender MCP → GLB model → Deploy to DCL World

## Tech Stack

- **Frontend**: Vite + TypeScript (Vanilla), PWA
- **3D**: three.js (preview), Blender MCP (generation)
- **AI**: Claude API (natural language understanding)
- **Hosting**: Cloudflare Pages + Workers + R2
- **Data Source**: DCL Catalyst Content Server (`peer.decentraland.org`)

## Commands

- `npm run dev` — Start dev server (proxies Content Server API)
- `npm run build` — Type check + production build
- `npm run preview` — Preview production build

## Architecture

```
src/
├── api/content-server.ts   — DCL Content Server API client
├── indexer/crawl.ts         — Scene entity → CatalogEntry processor
├── types.ts                 — Shared type definitions
└── main.ts                  — UI entry point
```

## Key API

- `POST /content/entities/active` with `{"pointers": ["x,y", ...]}` — fetch active scenes
- `GET /content/contents/{hash}` — fetch content files (GLB, thumbnails)
- Dev proxy: `/api/content/*` → `peer.decentraland.org/content/*`

## Deploy

```sh
npm run build
npx --cache /tmp/npm-cache wrangler pages deploy dist --project-name dcl-genesis-build
```

## Output Principles

- All code and docs in English
- Decentraland terminology: LAND, MANA, DCL, Worlds, Catalyst, Content Server
