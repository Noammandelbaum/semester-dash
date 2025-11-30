# SemesterHub - Project Memory

> **Read this FIRST in every session**
> **Last Updated:** 2025-11-30

---

## Quick Context

**מה:** SemesterHub - דשבורד סמסטר לסטודנטים ישראליים
**שלב:** MVP Development - Sprint 1 (80% complete)
**הבא:** STUDDASH-19 - Database Schema Refactor

---

## Critical Files to Read

Before starting ANY work, read these:

1. **Product Vision:** `docs/planning/product-vision.md`
2. **Gap Analysis:** `docs/planning/gap-analysis.md`
3. **ADR-003 (Refactor Decision):** `docs/decisions/003-refactor-existing-project.md`
4. **Roadmap:** `docs/planning/roadmap.md`

---

## Current Sprint Status

### Sprint 1 (Nov 30 - Dec 14): Infrastructure - ✅ COMPLETE

| Task | Status | Notes |
|------|--------|-------|
| STUDDASH-17: Tech Stack | ✅ Done | Already exists |
| STUDDASH-18: Project Init | ✅ Done | Already exists |
| STUDDASH-19: Database Refactor | ✅ Done | Semester model, Task→Assignment |
| STUDDASH-20: Auth System | ✅ Done | Already exists |
| STUDDASH-21: CI/CD | ✅ Done | Already exists |

### Next: Sprint 2 - UI Framework

See `docs/planning/roadmap.md` for Sprint 2 details.

---

## Upcoming Sprints

| Sprint | Dates | Focus | Status |
|--------|-------|-------|--------|
| 1 | Nov 30 - Dec 14 | Infrastructure | ✅ Done |
| 2 | Dec 15 - Dec 28 | UI Framework | Pending |
| 3 | Dec 29 - Jan 11 | Dashboard + Courses | Pending |
| 4 | Jan 12 - Jan 25 | Assignments + Calendar | Pending |
| 5 | Jan 26 - Feb 8 | Settings + Hebrew | Pending |
| 6 | Feb 9 - Feb 22 | Polish + Launch | Pending |

---

## Key Decisions Made

1. **Target Audience:** Israeli university students (ADR-001)
2. **Approach:** Research-first, then build (ADR-002)
3. **Codebase:** Refactor this project, don't start fresh (ADR-003)
4. **Name:** SemesterHub (English) / מצפן as alternative
5. **Tech Stack:** Next.js 16, Prisma 7, Tailwind 4, NextAuth 5
6. **Pricing:** Freemium, ₪25/month premium

---

## What Already Works (Don't Rebuild!)

### Authentication
- NextAuth with Google OAuth
- Prisma Adapter
- Protected routes (`requireAuth()`)
- Ownership checks (`requireResourceOwnership()`)

### API Layer
- Course CRUD with rate limiting
- Zod validation patterns
- Error handling patterns

### UI Components
- Button, Card, Input, Dialog, Select
- Checkbox, Label, Badge, Progress, Textarea
- Hebrew text support

### Infrastructure
- Vercel deployment
- GitHub Actions CI
- PostgreSQL (Neon)
- Google Analytics 4

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16 | App Router |
| TypeScript | Strict | Type safety |
| Tailwind CSS | 4 | Styling |
| PostgreSQL | Neon | Database |
| Prisma | 7 | ORM (adapter pattern) |
| NextAuth.js | v5 | Authentication |
| Zod | - | Validation |

---

## File Structure

```
semester-dash/
├── CLAUDE.md               # This file
├── docs/
│   ├── research/           # Market & technical research
│   ├── planning/           # Vision, roadmap, gap analysis
│   ├── decisions/          # ADRs (Architecture Decision Records)
│   ├── public/             # Public docs (tracked in git)
│   └── private/            # Private docs (gitignored)
├── prisma/
│   └── schema.prisma       # Database schema (needs refactor!)
├── scripts/
│   └── jira.mjs            # Jira API client
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── api/auth/       # NextAuth endpoints
│   │   ├── api/courses/    # Course CRUD endpoints
│   │   ├── dashboard/      # Protected routes
│   │   └── login/          # Auth pages
│   ├── components/         # React components
│   │   ├── ui/             # Base components
│   │   ├── courses/        # Course-specific
│   │   └── providers/      # Context providers
│   ├── lib/                # Utilities (auth, prisma, etc.)
│   └── schemas/            # Zod validation schemas
└── ...
```

---

## Session Rules

### Before Starting
```bash
1. Read this file (CLAUDE.md)
2. Read docs/planning/gap-analysis.md
3. Run: node scripts/jira.mjs active
4. Ask Noam: "What should I work on?"
```

### During Work
- Use TodoWrite for complex tasks
- One Jira story per session
- Test before marking done

### After Finishing
- Update Jira status (after user approval!)
- Commit with clear message
- Summarize what was done

---

## Jira Integration

**Project:** STUDDASH
**Board:** https://noammandelbaum.atlassian.net/jira/software/projects/STUDDASH/boards/100

### Jira Commands
```bash
node scripts/jira.mjs active   # Current sprint
node scripts/jira.mjs all      # All issues
node scripts/jira.mjs epics    # All epics
```

### Jira Workflow

**IMPORTANT: Claude updates Jira ONLY after user approval!**

**When a task is completed:**
1. Implement and test the feature
2. Show the user what was completed
3. **Ask for approval** before updating Jira
4. After approval: Update Jira status to "Done"

---

## Git Workflow

### CI/CD
- GitHub Actions runs on every push/PR: lint + build
- Vercel auto-deploys on push to main

### When to use what
| Situation | Action |
|-----------|--------|
| Small fix, docs, config | Push directly to main |
| Single task (STUDDASH-XX) | Push to main (CI validates) |
| Large feature / Epic | Create branch → PR to main |
| Risky/breaking change | Create branch → PR to main |

### Branch naming
```
feature/course-crud
fix/login-redirect
refactor/auth-flow
```

### Commit Message Format
```
<type>(<scope>): <description>

Closes STUDDASH-XX
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`

---

## Key Conventions

### Code Style
- **English** for code, comments, documentation
- **Hebrew** only for user-facing text
- **Server components** by default, client only when needed
- **Conventional Commits** for git messages

### Naming
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- API routes: `lowercase-with-hyphens`

### Database
- All tables have `createdAt` and `updatedAt`
- Cascade delete for related records
- Use soft delete where appropriate

---

## Commands

```bash
# Development
npm run dev              # Start dev server
npm run lint             # ESLint

# Build (use npx next build locally - faster, avoids prisma generate hanging)
npx next build           # Local build test (recommended on Windows)
npm run build            # Full build (includes prisma generate - can hang locally)

# Database
npx prisma studio        # Database GUI
npx prisma db push       # Push schema changes
npx prisma generate      # Regenerate client

# Jira
node scripts/jira.mjs active
```

> **Note:** When testing builds locally on Windows, use `npx next build` instead of `npm run build`. The `npm run build` script runs `prisma generate` first which can hang in Windows terminals.

---

## Troubleshooting

### `npm run dev` fails
```bash
rm -rf .next && npm run dev
```

### Port 3000 in use (Windows)
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Prisma out of sync
```bash
npx prisma generate
npx prisma db push
```

---

## Product Vision Summary

**One-liner:** "Your semester, at a glance" | "הסמסטר שלך, במבט אחד"

**Key Differentiators:**
1. Moodle integration (browser extension)
2. Hebrew-native + RTL
3. Reserve duty (מילואים) support
4. Semester visualization (not just weekly)

**Target:** Israeli university students using Moodle

**MVP Goal:** TAU pilot with 100-500 students

---

## Important Don'ts

- Don't rebuild auth - it works!
- Don't rebuild UI components - update them
- Don't skip reading gap-analysis.md
- Don't make architecture decisions without ADR
- Don't commit without testing

---

## Owner

**Noam Mandelbaum** - Solo founder
- Hebrew for user-facing, English for code/docs
- Values: Deep planning > quick hacks
- Goal: Real product → users → revenue
