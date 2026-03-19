# web2party – AI Project Context

> **Last updated:** 2026-03-19
> This file is the single source of truth for any AI assistant working on this codebase.
> It is tool-agnostic — Gemini CLI, GitHub Copilot, Cursor, and any other AI tool should follow these rules.

---

## 1. Project Mission

`web2party` is a **SaaS platform for DJs and event organizers**. It provides tools for managing customers, equipment, music libraries, and event planning (parties). It includes features like song analysis (BPM, Key), playlist management, and music request systems for guests.

**Target users:** DJs, event managers, and mobile event organizers in Germany.

---

## 2. AI Memory System

A persistent memory file exists at **`Ai/memory.md`**. Every AI assistant MUST:

1. **Read** `Ai/memory.md` at the start of every session to recall prior decisions, known issues, and conventions.
2. **Append** notes to the appropriate section after completing significant work (architecture decisions, lessons learned, bugs found, conventions established).
3. **Keep entries concise** — use bullet points, not paragraphs.
4. **Never delete** existing entries unless they are confirmed obsolete.

---

## 3. Tech Stack & Architecture

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.1.4 |
| **UI Library** | React | 19.2.3 |
| **Language** | TypeScript (Strict Mode) | 5.x |
| **Styling** | Tailwind CSS v4 | 4.x |
| **Database** | MySQL with Prisma ORM | 6.19.2 |
| **Auth** | NextAuth.js v5 (Beta) | 5.0.0-beta.30 |
| **Audio Analysis** | aubiojs, web-audio-beat-detector, music-metadata | — |
| **Media Processing** | fluent-ffmpeg, archiver | — |
| **PDF Export** | jspdf, jspdf-autotable | — |
| **Icons** | Lucide React | — |
| **Deployment** | Plesk, PM2 | — |

---

## 4. Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes (login, register)
│   ├── dashboard/                # Authenticated dashboard routes
│   │   ├── customers/            # Customer management
│   │   ├── equipment/            # Equipment management
│   │   ├── files/                # File manager
│   │   ├── invoices/             # Invoice management
│   │   ├── locations/            # Location management
│   │   ├── music/                # Music management (library, upload)
│   │   ├── parties/              # Party/Event management
│   │   ├── partners/             # Partner management
│   │   ├── playlists/            # Playlist management
│   │   ├── profile/              # DJ Profile
│   │   └── users/                # User management (Admin)
│   ├── api/                      # API routes (music analysis, upload, etc.)
│   ├── anfrage/                  # Public inquiry page
│   └── wunsch/                   # Public music request page (guests)
├── components/                   # UI components
│   ├── AuthProvider.tsx          # Session provider
│   ├── Sidebar.tsx               # Dashboard navigation
│   ├── Waveform.tsx              # Basic audio waveform
│   └── WaveformWithCuePoints.tsx # Advanced waveform with cue points
├── lib/                          # Core utilities
│   ├── audio-analyzer.ts         # Audio analysis logic
│   ├── auth.ts                   # NextAuth configuration
│   ├── bpm-detector.ts           # BPM detection logic
│   ├── harmonic-mixing.ts        # Musical key compatibility logic
│   └── prisma.ts                 # Prisma client instance
└── types/                        # TypeScript type definitions
```

---

## 5. Database Schema Overview (Simplified)

### Core
- **User** — User accounts (ADMIN/USER), DJ profile fields.
- **Customer** — Clients, address, billing info.
- **Location** — Event venues linked to customers.
- **Invoice** — Billing for parties.

### Music & Playlists
- **Song** — Music metadata (BPM, Key, Genre, Year).
- **CuePoint** — Visual markers in songs (Intro, Drop, Outro).
- **Playlist** — Custom song collections (Smart Playlists supported).
- **PlaylistSong** — Many-to-many relationship with positions.

### Party Management
- **Party** — Core event entity (Date, Status, Price, Customer, Location).
- **PartyTimelineEntry** — Scheduled sets/actions during a party.
- **PartyChecklistItem** — Preparation tasks.
- **PartyNote** — Highlights, wishes, forbidden songs.
- **PlayedSong** — History and audience reaction.
- **MusicRequest** — Guest wishes via QR code.

### Equipment & Partners
- **Equipment** — Gear (Speakers, Mixers, Lights, etc.).
- **Partner** — Rental partners for non-owned equipment.
- **PartyEquipment** — Gear assigned to a specific party.

---

## 6. Authentication & Authorization

### RBAC
- **ADMIN** — Full access to all features.
- **USER** — Access to own data and shared resources (if applicable).
- Registration requires confirmation (`isActive` field).

### Auth Flow
- Credentials provider (email + password).
- JWT session managed by NextAuth.

---

## 7. Coding Principles

### 7.1 German Terminology (User-Facing)
Use German for all user-facing labels and features, but keep code symbols (variables, classes) in English.

### 7.2 Surgical Updates
Always perform targeted edits to existing files. Use `replace` or similar tools instead of rewriting entire files.

### 7.3 Type Safety
Strict TypeScript usage across the codebase. Ensure Prisma models and API responses are correctly typed.

---

## 8. Workflow Rules

### 8.1 API Routes vs. Server Actions
The project currently uses both. Prefer existing patterns in `src/app/api/` for complex operations (like bulk uploads or heavy audio analysis).

### 8.2 Database Mutations
Always use `src/lib/prisma.ts`. Ensure proper error handling and validation before writing to the DB.

### 8.3 Music Metadata
When uploading songs, prioritize automatic extraction of BPM, Key, and other metadata using the internal analyzers in `src/lib/`.

---

## 9. Current Status & Known Issues

### Implementation Status
- ✅ Music library with BPM/Key analysis
- ✅ Playlist PDF & ZIP export
- ✅ Smart Playlists
- ✅ Party management (Timeline, Checklist, Notes, Statistics)
- ✅ Guest music request system (QR)

### Known Issues
- ⚠️ **Cue Points:** Not visible even when set.
- ⚠️ **Prisma Error:** `tags` argument failure in `prisma.song.update`.
- ❌ **Missing:** Equipment maintenance history, Bundles, QR for Equipment.
- ❌ **Missing:** Dashboard statistics, Calendar integration, Dark mode.

---

## 10. Key Reference Files

| Purpose | File |
|---------|------|
| Auth configuration | `src/lib/auth.ts` |
| DB client | `src/lib/prisma.ts` |
| DB Schema | `prisma/schema.prisma` |
| Audio Logic | `src/lib/audio-analyzer.ts` |
| Waveform UI | `src/components/WaveformWithCuePoints.tsx` |

---

## 11. Compliance Requirements

- **DSGVO (GDPR):** Data is user-scoped. Ensure personal customer data is handled securely.
- **Access Control:** Only confirmed users have dashboard access.

---

## 12. Agent Workflow Rules

- Read `Ai/memory.md` at start.
- Update `Ai/memory.md` after changes.
- Use parallel execution for research tasks.
- Always provide technical rationale for changes.
