# web2party – AI Persistent Memory

> **Last updated:** 2026-03-19
> This file is the single source of truth for prior decisions, known issues, and conventions.

---

## 1. Architecture Decisions

- **Framework:** Next.js 16.1.4 (App Router) for SEO, performance, and modern DX.
- **ORM:** Prisma 6.19.2 with MySQL for type-safe database access.
- **Auth:** NextAuth.js v5 (Beta) for robust authentication and multi-user support.
- **Styling:** Tailwind CSS v4 for utility-first styling.
- **Audio Analysis:** Using `aubiojs`, `web-audio-beat-detector`, and `music-metadata` for BPM and key detection.
- **Media Processing:** `fluent-ffmpeg` for server-side audio processing (ZIP exports).

---

## 2. Lessons Learned

- **Audio Analysis:** Client-side analysis with `web-audio-beat-detector` is faster for UI feedback, but server-side analysis (via API) is needed for bulk operations.
- **File Management:** Custom file manager using `Folder` and `File` models in Prisma allows for a hierarchical structure independent of the physical filesystem.

---

## 3. Known Issues & Workarounds

- **Prisma Song Update Error:** `prisma.song.update` fails with unknown argument `tags`. Workaround: Need to verify if `tags` is part of the schema (it is a `String?` in `schema.prisma`) and why the client might be outdated or why it's failing.
- **Cue Points Visibility:** Cue points are not showing even when set. Likely a UI/State management issue in `WaveformWithCuePoints.tsx`.

---

## 4. Implementation Notes

- **Smart Playlists:** Logic is stored as JSON in `smartCriteria` field of the `Playlist` model.
- **Music Requests:** Each party has a `requestCode` for guests to submit requests without logging in.

---

## 5. Conventions

- **Database:** Use `prisma` client from `src/lib/prisma.ts`.
- **API Routes:** Prefer Next.js Route Handlers in `src/app/api/`.
- **Components:** Use functional components with TypeScript.
- **Legal/German:** Use German terms for user-facing features (Kunde, Technik, Party, etc.) as the target market is German DJs.
