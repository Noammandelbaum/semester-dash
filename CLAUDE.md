# SemesterDash - Project Context for Claude

## 🚨 START OF SESSION - MANDATORY

**At the start of EVERY conversation, before doing anything else:**

1. **Read all context files:**
   - `CLAUDE.md` (this file)
   - `docs/private/SPRINT_PLANNING.md` - Sprint 2-4 detailed plan
   - `docs/public/DESIGN_SYSTEM.md` - UI guidelines
   - `docs/private/SECURITY_INTERNAL.md` - Security guidelines (private)
   - `docs/private/ROADMAP.md` - Product phases (private)
   - `docs/private/DEVOPS_ROADMAP.md` - DevOps plan (private)

2. **Load Jira state:**
   ```bash
   node scripts/jira.mjs active   # Current sprint
   node scripts/jira.mjs full     # Full overview (if needed)
   ```

3. **Summarize to user:**
   - Current sprint + remaining tasks
   - What's blocked / what's next
   - Ask what to work on

**Do NOT start working until you understand the full context!**

---

## Current Status (Updated: 2025-11-26)

### Sprint 1 - Foundation: COMPLETED ✅
**All 9 tasks completed successfully!**

### Sprint 2 - Course Management: COMPLETED ✅
**19/26 tasks completed - Core functionality 100% working!**

### What's Working:
- ✅ **Sprint 1**: Google OAuth, Protected routes, PostgreSQL + Prisma, UI library, Vercel deployment, GA4
- ✅ **Sprint 2**: Full Course CRUD (Create, Read, Update, Delete)
  - ✅ Backend: 6 API endpoints with auth, validation, rate limiting
  - ✅ Frontend: Course list page, Create/Edit dialogs, Hebrew UI
  - ✅ Security: Headers, rate limiting, ownership checks, input validation
  - ✅ Database: Course model with userId, cascade delete
  - ✅ Infrastructure: Zod schemas, auth-utils, rate-limit utilities

### What's Next:
- [ ] Sprint 3: Task Management + Sprint 2 Finalization ← **Ready to start**
  - Week 1: Manual testing (SEMDASH-89), Sprint checklist (SEMDASH-90)
  - Week 1-2: Task CRUD implementation
  - Week 2: Sentry integration (SEMDASH-86)
- [ ] Sprint 4: Dashboard, Progress visualization, Landing page

### Recent Changes:
- **Sprint 2 completed** (2025-11-26): Course CRUD fully functional
  - Migrated 3 tasks to Sprint 3: Testing (SEMDASH-89, -90), Sentry (SEMDASH-86)
  - Migrated 3 tasks to Sprint 4: Landing page, Illustrations, Progress viz
  - User stories (SEMDASH-21-26) marked as Done (functionality implemented)
- **Code quality**: All TypeScript errors fixed, lint clean, npm audit OK for production
- **Security**: Rate limiting, ownership checks, Zod validation working

---

## Project Overview

SemesterDash is a student semester management dashboard that helps students track their courses, tasks (lectures, assignments, labs), and progress throughout the semester.

**Core Value:** One view to see everything and know what to do next.

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

## Project Structure
```
semester-dash/
├── CLAUDE.md              # This file - main context
├── README.md              # Public readme
├── docs/
│   ├── public/           # ✅ Safe for public repo (tracked in git)
│   │   ├── README.md         # Public docs overview
│   │   ├── SECURITY.md       # Security policy (disclosure)
│   │   ├── DESIGN_SYSTEM.md  # UI guidelines
│   │   └── LOCALIZATION.md   # i18n guide
│   └── private/          # 🔒 Private (gitignored)
│       ├── README.md             # Private docs overview
│       ├── BRANDING_STRATEGY.md  # Marketing + personal brand
│       ├── ROADMAP.md            # Product phases
│       ├── DEVOPS_ROADMAP.md     # DevOps strategy
│       ├── SECURITY_INTERNAL.md  # Detailed security
│       ├── SPRINT_PLANNING.md    # Sprint 2-4 roadmap
│       └── SPRINT_CHECKLIST.md   # Quality gates
├── prisma/
│   └── schema.prisma     # Database models
├── src/
│   ├── app/              # Next.js pages & API
│   │   ├── api/auth/    # NextAuth endpoints
│   │   ├── api/courses/ # Course CRUD endpoints
│   │   ├── dashboard/   # Protected routes
│   │   └── login/       # Auth pages
│   ├── components/       # React components
│   │   ├── ui/          # Base components (Button, Card, Dialog)
│   │   ├── courses/     # Course-specific components
│   │   └── providers/   # Context providers
│   ├── lib/             # Core utilities
│   │   ├── auth.ts      # NextAuth config
│   │   ├── auth-utils.ts # Auth helpers
│   │   ├── rate-limit.ts # Rate limiting
│   │   ├── prisma.ts    # DB client
│   │   └── utils.ts     # Helpers
│   ├── schemas/         # Zod validation schemas
│   │   └── course.ts    # Course validation
│   └── types/           # TypeScript definitions
└── scripts/              # Local dev tools (gitignored)
    └── jira.mjs         # Jira CLI
```

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

## Jira Integration

**Project:** SEMDASH
**Board:** https://noammandelbaum.atlassian.net/jira/software/projects/SEMDASH/board

### Sprint Structure
| Sprint | Status | Focus |
|--------|--------|-------|
| Sprint 1 - Foundation | Active | Deploy, DB, Auth |
| Sprint 2 - Course Management | Future | CRUD courses |
| Sprint 3 - Task Management | Future | Tasks, progress |

### Jira CLI (local only)
```bash
node scripts/jira.mjs active    # Current sprint tasks
node scripts/jira.mjs full      # Full project overview
```

---

## Environment Variables

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://...

# Auth
AUTH_SECRET=...
AUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Jira (local dev only)
JIRA_API_TOKEN=...
JIRA_USER_EMAIL=...
JIRA_URL=...
```

---

## Commands

```bash
# Development
npm run dev              # Start dev server
npm run lint             # ESLint

# Build (use npx next build locally - faster, avoids prisma generate hanging)
npx next build           # Local build test (recommended)
npm run build            # Full build (includes prisma generate - can hang locally)

# Database
npx prisma studio        # Database GUI
npx prisma db push       # Push schema changes
npx prisma generate      # Regenerate client

# Jira
node scripts/jira.mjs active
```

> **Note for Claude:** When testing builds locally, always use `npx next build` instead of `npm run build`. The `npm run build` script runs `prisma generate` first which can hang in Windows terminals.

---

## Working Practices

### Starting a Session
1. Read this file for context
2. Check `node scripts/jira.mjs active` for current tasks
3. Ask if unclear about priorities

### During Development
1. Keep commits small and focused
2. Test after each change
3. Update this file's "Current Status" on significant changes

### Ending a Session
1. Commit working code
2. Update "Current Status" section
3. Note any blockers or next steps

### Jira Workflow

**IMPORTANT: Claude updates Jira ONLY after user approval!**

**When a task is completed:**
1. Implement and test the feature
2. Show the user what was completed
3. **Ask for approval** before updating Jira
4. After approval: Update Jira status to "Done"

**Jira Update Commands:**
```bash
# Check current sprint
node scripts/jira.mjs active

# Update task status (manual - use Jira web UI or API)
# For now: Ask user to confirm, then update manually in Jira
```

**Sprint Closure Process:**
1. Review all sprint tasks with user
2. Get approval for what's "Done" vs "Moved"
3. Update Jira:
   - Mark completed tasks as "Done"
   - Move incomplete tasks to next sprint
   - Add comments explaining migrations
4. Update CLAUDE.md and SPRINT_PLANNING.md
5. Commit sprint closure changes

### Git Workflow
**CI/CD:**
- GitHub Actions runs on every push/PR: lint + build
- Vercel auto-deploys on push to main

**When to use what:**
| Situation | Action |
|-----------|--------|
| Small fix, docs, config | Push directly to main |
| Single task (SEMDASH-XX) | Push to main (CI validates) |
| Large feature / Epic | Create branch → PR to main |
| Risky/breaking change | Create branch → PR to main |

**Branch naming:**
```
feature/course-crud
fix/login-redirect
refactor/auth-flow
```

**PR Flow (for large features):**
```bash
git checkout -b feature/course-crud
# ... work ...
git push -u origin feature/course-crud
# Create PR on GitHub → CI runs → merge when green
```

### Commit Message Format
```
<type>(<scope>): <description>

Closes SEMDASH-XX
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`

---

## Design Guidelines

See `docs/DESIGN_SYSTEM.md` for full details.

**Key Points:**
- Mobile-first approach
- Every action needs: loading state, success feedback, error handling
- Use CSS variables for colors
- Animations should feel snappy (150-300ms)

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

## Notes for Claude

1. **Check Jira first** - Know what we're working on
2. **Ask before implementing** - Clarify requirements
3. **Design matters** - Follow DESIGN_SYSTEM.md
4. **Mobile first** - Every feature should work on mobile
5. **Test changes** - Don't push broken code
6. **Update this file** - Keep "Current Status" fresh
