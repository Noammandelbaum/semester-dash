# SemesterDash - Project Context for Claude

## Current Status (Updated: 2024-11-24)

### What's Working:
- ✅ Google OAuth authentication (login/logout)
- ✅ Protected dashboard routes
- ✅ PostgreSQL database (Neon) with User, Account, Session tables
- ✅ Prisma 7 with adapter pattern
- ✅ Basic UI components (Button, Card)
- ✅ RTL Hebrew support

### What's Next:
- [ ] Deploy to Vercel (SEMDASH-15)
- [ ] Course CRUD (Sprint 2)
- [ ] Task management (Sprint 3)

### Recent Changes:
- Organized project structure (docs/, scripts/)
- Removed hardcoded secrets from jira.mjs
- Added suppressHydrationWarning for VS Code extension
- Fixed @types/pg for build

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
├── docs/                  # Documentation
│   ├── DESIGN_SYSTEM.md  # Colors, typography, components
│   ├── ROADMAP.md        # Product phases (Alpha → Beta → GA)
│   └── LOCALIZATION.md   # Hebrew/English translations
├── prisma/
│   └── schema.prisma     # Database models
├── src/
│   ├── app/              # Next.js pages & API
│   │   ├── api/auth/    # NextAuth endpoints
│   │   ├── dashboard/   # Protected routes
│   │   └── login/       # Auth pages
│   ├── components/       # React components
│   │   ├── ui/          # Base components (Button, Card)
│   │   └── providers/   # Context providers
│   ├── lib/             # Core utilities
│   │   ├── auth.ts      # NextAuth config
│   │   ├── prisma.ts    # DB client
│   │   └── utils.ts     # Helpers
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
npm run build            # Production build
npm run lint             # ESLint

# Database
npx prisma studio        # Database GUI
npx prisma db push       # Push schema changes
npx prisma generate      # Regenerate client

# Jira
node scripts/jira.mjs active
```

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

### Commit Message Format
```
<type>(<scope>): <description>

Closes SEMDASH-XX
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

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
