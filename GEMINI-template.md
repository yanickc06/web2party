# CouncilOne – AI Project Context

> **Last updated:** 2026-03-13
> This file is the single source of truth for any AI assistant working on this codebase.
> It is tool-agnostic — Gemini CLI, GitHub Copilot, Cursor, and any other AI tool should follow these rules.

---

## 1. Project Mission

CouncilOne is a **SaaS platform for German works councils** (*Betriebsräte*). It digitizes the entire operational lifecycle of a works council — meetings, resolutions, elections, committees, member management, protocols, and more — while enforcing strict compliance with the **BetrVG** (German Works Constitution Act), **DSGVO** (GDPR), and **ISO 27001**.

**Target users:** Works council members in German companies, including accessibility officers (*Inklusionsbeauftragte*).

---

## 2. AI Memory System

A persistent memory file exists at **`Ai/memory.md`**. Every AI assistant MUST:

1. **Read** `Ai/memory.md` at the start of every session to recall prior decisions, known issues, and conventions.
2. **Append** notes to the appropriate section after completing significant work (architecture decisions, lessons learned, bugs found, conventions established).
3. **Keep entries concise** — use bullet points, not paragraphs.
4. **Never delete** existing entries unless they are confirmed obsolete.

The memory file has five sections: Architecture Decisions, Lessons Learned, Known Issues & Workarounds, Implementation Notes, and Conventions.

---

## 3. Tech Stack & Architecture

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.1.6 |
| **UI Library** | React | 19.2.3 |
| **Language** | TypeScript (Strict Mode) | 5.x |
| **Styling** | Tailwind CSS v4 + Shadcn/UI | 4.x |
| **Icons** | Lucide React | 0.563+ |
| **Database** | MySQL with Drizzle ORM | drizzle-orm 0.45.1 |
| **Auth** | NextAuth.js v5 (Beta) with JWT + Credentials | 5.0.0-beta.30 |
| **Validation** | Zod | 4.3.6 |
| **Forms** | React Hook Form + Zod resolvers | — |
| **PDF Export** | @react-pdf/renderer | 4.3.2 |
| **Email** | Resend | 6.9.2 |
| **Drag & Drop** | @dnd-kit | 6.3.1 |
| **Testing** | Vitest | 4.0.18 |
| **Package Manager** | pnpm (workspace) | — |
| **Deployment** | Plesk, Node.js 18+, PM2 | — |

---

## 4. Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes (login, register)
│   ├── (dashboard)/              # All authenticated dashboard routes
│   ├── api/                      # API routes (minimal — prefer Server Actions)
│   └── manage/                   # Management routes
├── components/                   # Feature-specific UI components
│   ├── sitzungen/                # Meeting components
│   ├── beschluesse/              # Resolution/voting components
│   ├── mitglieder/               # Member management components
│   ├── wahlen/                   # Election components
│   ├── protokoll/                # Protocol/minutes components
│   ├── ausschuesse/              # Committee components
│   ├── betriebsvereinbarungen/   # Collective agreement components
│   ├── betriebsversammlungen/    # Staff assembly components
│   ├── dokumente/                # Document management components
│   ├── geschaeftsordnung/        # Rules of procedure components
│   ├── meldungen/                # Issue/ticket components
│   ├── news/                     # Newsletter components
│   ├── antraege/                 # Proposals components
│   ├── aushaenge/                # Announcement components
│   ├── einstellungen/            # Settings components
│   ├── dashboard/                # Dashboard widgets
│   └── ui/                       # Shadcn/UI primitives
├── db/
│   ├── schema/                   # 25 Drizzle ORM table definitions
│   ├── index.ts                  # Database connection
│   └── tenant-query.ts           # Tenant-filtered query abstraction (RLS)
├── server/
│   └── actions/                  # 27 Server Action modules (all mutations)
├── lib/                          # Core utilities
│   ├── auth.ts                   # NextAuth configuration
│   ├── rbac.ts                   # Role-based access control
│   ├── permissions.ts            # 19 granular permissions
│   ├── tenant.ts                 # Tenant context extraction from JWT
│   ├── beschluss-logik.ts        # Resolution logic (§ 33 BetrVG)
│   ├── ersatzmitglied-logik.ts   # Substitute member logic (§ 25 BetrVG)
│   ├── email.ts                  # Resend email service
│   └── rate-limit.ts             # Login rate limiting (ISO 27001 A.8.26)
├── plugins/                      # Plugin architecture
│   ├── registry.ts               # Plugin registry
│   └── wahlvorstand/             # Electoral board plugin
├── hooks/
│   └── use-mobile.ts             # Mobile detection hook
└── types/
    └── next-auth.d.ts            # NextAuth type augmentation
```

**Other important root files:**
- `Ai/memory.md` — AI persistent memory (see Section 2)
- `ROADMAP.md` — Phase-by-phase implementation guide with exact specs per feature
- `DOCUMENTATION.md` — Comprehensive architecture & schema docs (12 sections)
- `fixing_stuff.md` — Known bugs & pending fixes
- `new_needed_features.md` — BetrVG compliance analysis (✅/⚠️/❌ status matrix)
- `concept.md` — Strategic vision, market analysis, Vibecoding philosophy
- `DEPLOYMENT.md` — Plesk server deployment guide
- `docs/security/` — ISO 27001 security plans (incident response, BCP, vulnerability management)

---

## 5. Database Schema Overview (26 Tables)

### Core
- **tenants** — Tenant/Council records with subscription plans
- **users** — User accounts with role references
- **audit\_logs** — Security audit trail (every mutation logged)

### Meetings (§§ 29-30 BetrVG)
- **sitzungen** — Meeting records with status workflow (`geplant → eingeladen → laufend → abgeschlossen`)
- **tagesordnungspunkte** — Agenda items with drag-drop ordering
- **sitzung\_teilnehmer** — Attendance tracking + QR check-in
- **sitzung\_gaeste** — Guest management

### Members (§ 25 BetrVG)
- **mitglieder** — Council members (ordentlich/ersatz, functions, gender, lists)

### Resolutions (§ 33 BetrVG)
- **beschluesse** — Resolutions with voting results (ja/nein/enthaltung) and sequential numbering

### Elections (§§ 16-20 BetrVG)
- **wahlen** — Election records
- **waehler\_liste** — Voter registry
- **wahlvorschlaege** — Electoral proposals/lists
- **wahl\_kandidaten** — Candidates
- **wahl\_ergebnisse** — Results (supports d'Hondt seat allocation)

### Committees (§§ 27-28 BetrVG)
- **ausschuesse** — Committee definitions
- **ausschuss\_mitglieder** — Committee memberships

### Documents & Agreements
- **betriebsvereinbarungen** — Collective agreements
- **bv\_versionen** — Agreement version history
- **geschaeftsordnung** — Rules of procedure (TipTap rich text JSON)
- **dokumente** — General document management
- **textbausteine** — Reusable text templates

### Communications
- **betriebsversammlungen** — Staff assemblies (§§ 42-46 BetrVG)
- **monatsgespraeche** — Monthly employer talks (§ 74 BetrVG)
- **schulungen** / **schulung\_teilnehmer** — Training management
- **news\_verteiler** / **news\_beitraege** — Newsletter system

### Issues & Proposals
- **meldungen** / **meldung\_kommentare** — Ticket/issue tracking
- **antraege** — Proposals linked to resolution numbers

### Configuration
- **tenant\_features** — Feature flag system
- **gremium\_einstellungen** — Council settings
- **gbr\_mitglieder** — Central works council members
- **protokoll\_bestaetigungen** — Protocol confirmations

---

## 6. Authentication & Authorization

### Multi-Tenancy (RLS)
- MySQL has no native Row-Level Security. RLS is enforced at the **application level**.
- **Every database query MUST filter by `tenant_id`**, enforced via `src/db/tenant-query.ts`.
- Tenant ID is extracted from the JWT session via `src/lib/tenant.ts`.
- Zero cross-tenant data leakage is a non-negotiable requirement.

### RBAC — 5 Roles
| Role | Key | Scope |
|------|-----|-------|
| Chair | `vorsitzender` | Full admin |
| Vice-Chair | `stellvertreter` | Equivalent to Chair |
| Secretary | `schriftfuehrer` | Protocol-focused |
| Member | `mitglied` | Limited write access |
| Substitute | `ersatzmitglied` | Dynamic, context-dependent |

### 19 Granular Permissions
`sitzung:erstellen`, `sitzung:bearbeiten`, `sitzung:laden`, `sitzung:leiten`, `beschluss:starten`, `beschluss:abstimmen`, `protokoll:erstellen`, `protokoll:bearbeiten`, `protokoll:lesen`, `protokoll:finalisieren`, `mitglied:verwalten`, `top:verwalten`, `einstellungen:verwalten`, `audit:lesen`, `benutzer:verwalten`, and more.

### Auth Flow
1. Credentials provider (email + bcryptjs-hashed password)
2. Rate limiting on login attempts (ISO 27001 A.8.26)
3. JWT session containing `tenant_id`, `role`, `userId`
4. Audit logging of all login attempts (success + failure)

---

## 7. Coding Principles

### 7.1 Privacy First
- Every DB query MUST include a `tenant_id` filter — no exceptions.
- Use `src/db/tenant-query.ts` for all tenant-scoped queries.
- Never expose tenant data in client-side error messages or URLs.
- All mutations must be audit-logged.

### 7.2 Accessibility
- All UI components MUST meet **WCAG 2.1 AA** (critical for *Inklusionsbeauftragte*).
- Use semantic HTML, ARIA attributes, keyboard navigation, and sufficient color contrast.

### 7.3 BetrVG Terminology
Use the legal terminology from the *Betriebsverfassungsgesetz* (BetrVG) — never anglicize.

**Glossary for AI assistants:**

| German Term | English Meaning | Context |
|-------------|----------------|---------|
| Betriebsrat (BR) | Works council | The elected employee body |
| Sitzung | Meeting/Session | Council meeting (§§ 29-30) |
| Tagesordnungspunkt (TOP) | Agenda item | Items on the meeting agenda |
| Beschlussfassung | Resolution/Vote | Formal voting process (§ 33) |
| Beschlussfähigkeit | Quorum | ≥50% of members present (§ 33 Abs. 2) |
| Ladung | Invitation/Summons | Formal meeting invitation (§ 29) |
| Ladungsfrist | Invitation deadline | Minimum 3 days before meeting |
| Protokoll / Niederschrift | Minutes/Protocol | Meeting minutes (§ 34) |
| Mitglied (ordentlich) | Regular member | Full voting rights |
| Ersatzmitglied | Substitute member | Steps in when regular absent (§ 25) |
| Vorsitzende/r | Chair | Leads the council |
| Stellvertreter/in | Vice-Chair | Deputy chair |
| Schriftführer/in | Secretary | Responsible for minutes |
| Ausschuss | Committee | Working committee (§§ 27-28) |
| Betriebsvereinbarung (BV) | Collective agreement | Binding agreement with employer |
| Geschäftsordnung | Rules of procedure | Internal governance rules |
| Betriebsversammlung | Staff assembly | General employee assembly (§§ 42-46) |
| Monatsgespräch | Monthly talk | Monthly employer meeting (§ 74) |
| Wahlvorstand | Electoral board | Manages elections (§§ 16-20) |
| Antrag | Proposal/Motion | Formal proposal for a resolution |
| Meldung | Report/Ticket | Issue reported by employees |
| Schulung | Training | Member training (§ 37 Abs. 6) |
| Aushang | Announcement | Public notice board |
| Gremium | Body/Board | The council as a body |

### 7.4 Error Handling
- User-facing errors: friendly, precise, in German.
- Technical details: server-side logging only — never expose stack traces, SQL, or internal IDs to the client.

### 7.5 Compliance
- All implementations MUST comply with **ISO 27001**, **BetrVG**, and **DSGVO** (GDPR).
- Security-relevant changes require audit log entries.
- Refer to `docs/security/` for incident response and business continuity plans.

---

## 8. Workflow Rules

### 8.1 Form Validation
- Generate **Zod schemas** for every form input — client AND server validation.
- Use `zod` v4 with React Hook Form resolvers.

### 8.2 Mutations via Server Actions Only
- Use **Server Actions** for all data mutations. No API routes for mutations.
- This preserves end-to-end TypeScript type safety.

### 8.3 Canonical Server Action Pattern
Every Server Action MUST follow this structure:

```typescript
"use server";

export async function actionName(formData: FormData) {
  // 1. Permission check
  await requirePermission("resource:action");

  // 2. Extract tenant context
  const tenantId = await getTenantId();

  // 3. Validate input with Zod
  const validated = schema.parse(Object.fromEntries(formData));

  // 4. Database mutation (ALWAYS filter by tenantId)
  const result = await db.insert(table).values({ ...validated, tenantId });

  // 5. Audit log
  await createAuditLog({ tenantId, action: "resource.action", details: {...} });

  // 6. Return result
  return { success: true, data: result };
}
```

### 8.4 Testing
- Create a **Vitest test file** for every component and server action.
- Test file location: adjacent to the source file or in `__tests__/`.

### 8.5 Audit Logging
- Every mutation (create, update, delete) MUST generate an audit log entry.
- Audit logs include: `tenantId`, `userId`, `action`, `timestamp`, `details`.

---

## 9. Current Status & Known Issues

### Implementation Status
Refer to `new_needed_features.md` for a full BetrVG compliance matrix showing what is ✅ implemented, ⚠️ partially done, ❌ missing, or 🔌 stubbed.

### Known Bugs & Pending Fixes
Refer to `fixing_stuff.md` for the current list. Key items include:
- Election card spacing issues
- Substitute member (Nachrücker) list logic
- Resolution voting should work during meetings, not only after
- File attachments for meetings missing
- Logo upload broken
- Protocol confirmation workflow incomplete
- Guest management for meetings missing
- Meeting pause/cancel functionality missing

### Implementation Roadmap
Refer to `ROADMAP.md` for the phase-by-phase implementation guide with exact specs.

---

## 10. Key Reference Files

| Purpose | File |
|---------|------|
| Auth configuration | `src/lib/auth.ts` |
| Role enforcement | `src/lib/rbac.ts` |
| Permission matrix | `src/lib/permissions.ts` |
| Tenant context (RLS) | `src/lib/tenant.ts` |
| Tenant-scoped queries | `src/db/tenant-query.ts` |
| DB connection | `src/db/index.ts` |
| All schema definitions | `src/db/schema/index.ts` |
| Resolution logic (§ 33) | `src/lib/beschluss-logik.ts` |
| Substitute logic (§ 25) | `src/lib/ersatzmitglied-logik.ts` |
| Email service | `src/lib/email.ts` |
| Rate limiting | `src/lib/rate-limit.ts` |
| Middleware | `src/middleware.ts` |
| Server Actions | `src/server/actions/*.ts` (27 modules) |

---

## 11. Compliance Requirements

### BetrVG (Works Constitution Act)
| Paragraph | Topic | Status |
|-----------|-------|--------|
| §§ 16-20 | Elections (Wahlen) | 🔌 Framework complete |
| § 25 | Substitute members (Ersatzmitglieder) | ✅ Implemented |
| §§ 27-28 | Committees (Ausschüsse) | ⚠️ Auto-sizing incomplete |
| §§ 29-30 | Meeting management (Sitzungen) | ✅ Implemented |
| § 33 | Resolution voting (Beschlussfassung) | ⚠️ Quorum UI needs refinement |
| § 34 | Meeting minutes (Protokoll) | ⚠️ Confirmation workflow incomplete |
| § 37 Abs. 6 | Training (Schulungen) | ✅ Implemented |
| §§ 42-46 | Staff assemblies (Betriebsversammlungen) | ⚠️ Basic structure |
| § 74 | Monthly talks (Monatsgespräche) | ⚠️ Basic structure |

### ISO 27001
- ✅ Multi-tenant isolation (app-level RLS)
- ✅ Comprehensive audit logging
- ✅ Login rate limiting (A.8.26)
- ✅ Password hashing (bcryptjs)
- ✅ Incident response plan (`docs/security/incident-response-plan.md`)
- ✅ Business continuity plan (`docs/security/business-continuity-plan.md`)
- ✅ Vulnerability management (`docs/security/vulnerability-management.md`)

### DSGVO (GDPR)
- All personal data is tenant-scoped and cannot leak across tenants.
- Audit logs provide traceability for data access.
- Data minimization: only collect what is legally required for BetrVG compliance.

---

## 12. Agent Workflow Rules

- When a task is too complex or lengthy, **automatically split it across multiple agents/subtasks**.
- Use parallel execution for independent subtasks.
- Always check `Ai/memory.md` before starting work and update it after significant changes.
- When uncertain about a BetrVG requirement, consult the glossary in Section 7.3 and reference the specific paragraph.
- Prefer referencing existing utilities (`src/lib/`) over creating new abstractions.
- Check `fixing_stuff.md` and `new_needed_features.md` before implementing features to avoid duplicating known issues or missing existing partial implementations. 
