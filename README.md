# DCL Genesis Build

> AI-Powered Architecture Catalog & Builder for Decentraland

DCL Genesis Build is a mobile-first PWA that combines two capabilities:

1. **Building Catalog** — A searchable index of every building deployed on Decentraland LANDs, with 3D previews, metadata, and a public REST API.
2. **AI Build Engine** — Describe buildings in natural language, Claude API interprets the request, Blender MCP generates a DCL-compliant GLB, preview in 3D, and deploy to DCL Worlds.

## Problem

Creating 3D content for Decentraland requires Blender expertise and desktop access. Most of the ~90,000 LAND parcels remain empty or use basic templates. There are zero tools to create and deploy DCL 3D content from a mobile device.

## Solution

Genesis Build eliminates this barrier with natural language input on mobile, while the catalog makes the entire DCL architectural heritage discoverable and reusable for the first time.

## Architecture

```
User (Mobile) → Natural Language Input
    → Claude API (understand & refine)
    → Blender MCP (generate GLB)
    → three.js Preview (in-browser)
    → Deploy to DCL World
```

The Building Catalog crawls the Decentraland Content Server to index all deployed scenes, providing:
- Searchable database with 3D thumbnails
- Public REST API for external developers
- Reference library for AI-assisted generation ("build something like this")

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + TypeScript |
| 3D Preview | three.js |
| AI | Claude API + Blender MCP |
| Hosting | Cloudflare Pages + Workers + R2 |
| Data Source | DCL Catalyst Content Server |

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and click "Crawl Parcels" to index scenes from the Decentraland Content Server.

## Development

```bash
npm run dev      # Start dev server with API proxy
npm run build    # Type check + production build
npm run preview  # Preview production build
```

## Technical Specification

See [docs/SPEC.md](docs/SPEC.md) for the full technical specification.

## Grant

This project is funded by the [Regenesis Grants Program Season 1](https://grants.dclregenesislabs.xyz/) (Tech Ecosystem track).

## License

MIT

## Links

- **Website**: [ethcouple.pages.dev](https://ethcouple.pages.dev)
- **X**: [@ethcouple](https://x.com/ethcouple)
- **Decentraland DAO**: [Profile](https://decentraland.org/governance/profile/?address=0x011afddafc55d4536068ae72ef2e64716763b833)
