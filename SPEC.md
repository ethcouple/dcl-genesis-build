# DCL Genesis Build — Technical Specification

> AI-Powered Architecture Catalog & Builder for Decentraland

**Version:** 0.1.0 (Prototype)
**Author:** ethcouple
**Grant:** Regenesis Grants Program Season 1 — Tech Ecosystem
**Timeline:** 90 days from approval

---

## 1. System Overview

DCL Genesis Build is a mobile-first PWA that combines two capabilities:

1. **Building Catalog** — A searchable index of every building deployed on Decentraland LANDs, with 3D previews, metadata, and a public REST API.
2. **AI Build Engine** — A natural language → 3D model pipeline where users describe buildings, Claude API interprets the request, Blender MCP generates a DCL-compliant GLB, and users preview/deploy to DCL Worlds.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile PWA (Vite + TS)                │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Catalog       │  │ AI Builder   │  │ Deploy Flow   │  │
│  │ Browser       │  │ Interface    │  │ (DCL Worlds)  │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
│         │                 │                   │          │
│  ┌──────┴─────────────────┴───────────────────┴───────┐  │
│  │              three.js 3D Preview                    │  │
│  └─────────────────────┬──────────────────────────────┘  │
└────────────────────────┼─────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Catalog API  │  │ Claude API   │  │ DCL Content  │
│ (CF Workers) │  │ (Anthropic)  │  │ Server       │
└──────┬───────┘  └──────┬───────┘  │ (Catalyst)   │
       │                 │          └──────────────┘
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ R2 Storage   │  │ Blender MCP  │
│ (index data) │  │ (VPS)        │
└──────────────┘  └──────────────┘
```

---

## 2. Component Breakdown

### 2.1 Building Catalog Indexer

**Purpose:** Crawl the entire Decentraland Content Server and build a searchable database of all deployed scenes.

**Data Source:** Decentraland Catalyst Content Server

| Item | Detail |
|---|---|
| Base URL | `https://peer.decentraland.org` |
| Active Entities | `POST /content/entities/active` |
| Content Files | `GET /content/contents/{hash}` |
| Parcel Range | Approx. -150 to 150 on both axes (~90,000 parcels) |

**Crawl Strategy:**

```
1. Generate all parcel coordinate strings: "-150,-150" through "150,150"
2. Batch into groups of 200 pointers
3. POST each batch to /content/entities/active
4. Deduplicate scenes (one scene spans multiple parcels)
5. Extract metadata: title, description, owner, parcel list, content hashes
6. Identify GLB/glTF files from content array
7. Generate 3D thumbnails via three.js offscreen rendering
8. Store in Cloudflare R2 (JSON index + thumbnails)
```

**Scene Entity Structure (from Content Server):**

```typescript
interface SceneEntity {
  id: string;                    // Unique entity ID
  type: "scene";
  timestamp: number;             // Deployment timestamp (ms)
  pointers: string[];            // Parcel coordinates ["0,0", "1,0"]
  content: ContentFile[];        // Deployed files
  metadata: SceneMetadata;
}

interface ContentFile {
  file: string;                  // Filename (e.g., "model.glb")
  hash: string;                  // Content hash for retrieval
}

interface SceneMetadata {
  display: {
    title: string;
    description: string;
    navmapThumbnail: string;     // Thumbnail filename
  };
  owner: string;                 // Ethereum address
  scene: {
    parcels: string[];           // All parcels this scene covers
    base: string;                // Base parcel coordinate
  };
  main: string;                  // Entry point file
  tags: string[];
}
```

**Indexed Record (our database):**

```typescript
interface CatalogEntry {
  id: string;                    // Scene entity ID
  title: string;
  description: string;
  owner: string;                 // Ethereum address
  parcels: string[];             // Parcel coordinates
  baseParcel: string;
  deployedAt: number;            // Timestamp
  glbFiles: ContentFile[];       // 3D model files
  thumbnailUrl: string;          // Generated thumbnail
  parcelCount: number;           // Number of parcels
  tags: string[];
}
```

### 2.2 Public REST API

Hosted on Cloudflare Workers, serving the catalog data from R2 storage.

| Endpoint | Method | Description |
|---|---|---|
| `/api/buildings` | GET | List buildings (paginated) |
| `/api/buildings/:parcel` | GET | Get building at parcel coordinate |
| `/api/search?q=...` | GET | Full-text search by title/description/tags |
| `/api/stats` | GET | Catalog statistics (total scenes, parcels, etc.) |

**Pagination:** Cursor-based with `?cursor=<id>&limit=50` (default limit 50, max 200).

**Response format:**

```json
{
  "data": [CatalogEntry],
  "cursor": "next-cursor-id",
  "total": 12345
}
```

### 2.3 AI Build Engine

**Pipeline:** Natural Language → Claude API → Blender MCP → GLB → Preview → Deploy

```
User Input: "A two-story Japanese-style tower with a red roof"
     │
     ▼
┌─────────────────────────────────────────────┐
│ Claude API                                   │
│ - Interprets architectural description       │
│ - Optionally references catalog entries       │
│ - Generates Blender MCP tool calls           │
│ - Validates DCL constraints                  │
└──────────────────┬──────────────────────────┘
                   │ MCP tool calls
                   ▼
┌─────────────────────────────────────────────┐
│ Blender MCP (Headless VPS)                   │
│ - Executes 3D modeling operations            │
│ - Generates geometry, materials, textures    │
│ - Exports as GLB                             │
└──────────────────┬──────────────────────────┘
                   │ GLB file
                   ▼
┌─────────────────────────────────────────────┐
│ Constraint Validator                         │
│ - Triangle count ≤ 10,000                    │
│ - Texture size ≤ 512x512                     │
│ - Total file size ≤ 50 MB                    │
│ - Height ≤ 20m per parcel                    │
│ - Within parcel boundaries                   │
└──────────────────┬──────────────────────────┘
                   │ Validated GLB
                   ▼
┌─────────────────────────────────────────────┐
│ three.js Preview (in-browser)                │
│ - Interactive 3D viewer                      │
│ - Orbit controls, lighting                   │
│ - Wireframe toggle, stats overlay            │
└─────────────────────────────────────────────┘
```

**Iterative Refinement:**
- Up to 20 rounds of conversation
- User can say "make it taller", "add windows", "Japanese style"
- Claude maintains context of the building being designed
- Each round produces an updated GLB

**Catalog Integration:**
- User can select a catalog entry as reference: "Build something like this"
- Claude receives the reference building's metadata and structure
- Generates variations or inspired designs

### 2.4 Mobile PWA

**Core Screens:**

1. **Catalog Browser** — Grid of building thumbnails with search/filter
2. **Building Detail** — 3D preview, metadata, "Build something like this" button
3. **AI Builder** — Chat interface for natural language building
4. **Preview** — Full 3D viewer with stats overlay
5. **Deploy** — Connect wallet → select World → publish

**Tech Stack:**

| Layer | Technology |
|---|---|
| Framework | Vite + TypeScript (Vanilla) |
| 3D Rendering | three.js |
| State | In-memory (no framework) |
| Styling | CSS custom properties + responsive |
| PWA | vite-plugin-pwa (service worker, offline) |
| Hosting | Cloudflare Pages |

---

## 3. DCL Constraints Reference

Models deployed to Decentraland must comply with these limits:

| Constraint | Limit |
|---|---|
| Triangles | 10,000 per parcel |
| Texture size | 512 x 512 px |
| Max file size | 50 MB per model |
| Height | 20m per parcel |
| Supported formats | GLB (binary glTF) |
| UV maps | 1 per model |
| Animations | Embedded in glTF |

---

## 4. Infrastructure

| Service | Usage | Cost Estimate |
|---|---|---|
| Cloudflare Pages | PWA hosting | Free |
| Cloudflare Workers | API endpoints | Free tier (100k req/day) |
| Cloudflare R2 | Catalog data + thumbnails | ~$0.015/GB/month |
| VPS (Hetzner) | Headless Blender MCP | ~$16/month (16GB RAM) |
| Claude API | NL understanding + generation | ~$25-80/month |

---

## 5. 90-Day Milestone Plan

### Milestone 1: Day 30 — Catalog & API

| Deliverable | Status |
|---|---|
| Full Content Server crawl (90k parcels) | |
| Searchable database with metadata | |
| 3D thumbnail generation | |
| Public REST API with documentation | |
| Basic PWA with catalog browsing | |
| three.js preview for individual buildings | |

### Milestone 2: Day 60 — AI Build Engine

| Deliverable | Status |
|---|---|
| Claude API ↔ Blender MCP pipeline | |
| Natural language → GLB generation | |
| DCL constraint validation | |
| Iterative refinement (up to 20 rounds) | |
| Catalog reference integration | |
| Integrated into PWA builder screen | |

### Milestone 3: Day 90 — Launch

| Deliverable | Status |
|---|---|
| DCL World deployment flow | |
| Mobile-optimized UX | |
| Performance optimization | |
| Open-source release (MIT) on GitHub | |
| User documentation | |
| Launch campaign | |

---

## 6. Open Source

- **Repository:** `github.com/gdalabs/dcl-genesis-build`
- **License:** MIT
- **Includes:** All source code, indexing scripts, AI prompts, Blender MCP integration, API server, PWA
- **Public API:** Free to use, documented, no auth required for read endpoints
