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

### 🚨 **MAJOR PIVOT - Sprint 3 Refactor** 🚨

**What Happened:**
- Built Task CRUD in Sprint 3 (backend + frontend complete)
- **User feedback:** Architecture doesn't match the product vision
- **Root issue:** Tasks were separate entities, not integrated into semester view

**New Vision (Approved):**
- 🎯 **Dashboard-first approach:** One view to see the entire semester
- 🎯 **Course-centric:** Tasks are part of courses, not standalone
- 🎯 **Weekly tracking:** Focus on "what do I have this week?"
- 🎯 **Gamification (subtle):** Progress rings, gentle celebrations, no pressure

### Sprint 1 - Foundation: COMPLETED ✅
**All 9 tasks completed successfully!**

### Sprint 2 - Course Management: COMPLETED ✅
**19/26 tasks completed - Core functionality 100% working!**

### Sprint 3.5 - Weekly View Implementation: READY FOR PHASE 1 🚀
**Status:** ✅ Planning Complete (2025-11-27) → 🚀 Ready for Implementation
**Approach:** 5-phase implementation over 3 weeks (8-10h/week)

**Approved Plan:** `docs/private/WEEKLY_VIEW_PLAN.md`

**Key Decisions (User-Confirmed):**
- ✅ **Default view:** Weekly View ("מה יש לי השבוע")
- ✅ **Assignment tracking:** Pre-define count (e.g., "5 הגשות")
- ✅ **Holiday handling:** Automatic via Israeli calendar (`@hebcal/core`)
- ✅ **Category management:** Smart defaults (lectures + tutorials), user-editable
- ✅ **Gamification:** "Gentle celebration" - progress rings, micro-confetti, no stress
- ✅ **Mobile-first:** Swipe gestures, 44×44px touch targets, thumb-zone optimization

**Current Phase:** Phase 1 - Database & API (Week 1, 8-10h)

**Phase 1 Tasks:**
1. Update Prisma schema (Semester, Category, WeeklyProgress, Milestone)
2. Create `/api/weekly-view` endpoint
3. Create `/api/progress/weekly/toggle` endpoint
4. Create Zod validation schemas
5. Create date-utils with Israeli holiday detection

**Next After Phase 1:**
- Phase 2: Core UI components (Week 1-2)
- Phase 3: "Magic Moment" animations (Week 2)
- Phase 4: Mobile gestures (Week 2-3)
- Phase 5: Polish & accessibility (Week 3)

### What's Working:
- ✅ **Sprint 1**: Google OAuth, Protected routes, PostgreSQL + Prisma, UI library, Vercel deployment, GA4
- ✅ **Sprint 2**: Full Course CRUD (Create, Read, Update, Delete)
  - ✅ Backend: 6 API endpoints with auth, validation, rate limiting
  - ✅ Frontend: Course list page, Create/Edit dialogs, Hebrew UI
  - ✅ Security: Headers, rate limiting, ownership checks, input validation
- ⚠️ **Sprint 3**: Task CRUD built but needs architectural refactor

### What's Next:
- [ ] Sprint 3.5: UX Prototype + Architecture Refactor ← **CURRENT**
  - Design Weekly View mockup
  - Design Course Detail view
  - Design Onboarding flow
  - Refactor Database: Semester → Course (with Categories) → Progress
  - Rebuild frontend with new UX
- [ ] Sprint 4: Dashboard polish, Progress visualization, Landing page

### Recent Changes:
- **Implementation plan approved** (2025-11-27): Complete 5-phase roadmap created
  - Full plan: `docs/private/WEEKLY_VIEW_PLAN.md` (370 lines, approved)
  - Phase breakdown added to `SPRINT_PLANNING.md`
  - All user requirements confirmed via Q&A session
  - Holiday handling: Automatic via `@hebcal/core` library (user correction implemented)
  - Assignment tracking: Pre-defined counts matching syllabus workflow
  - Category management: Smart defaults with future Moodle automation readiness
- **Sprint 3 pivot decision** (2025-11-26): Refactoring to dashboard-first approach
  - User wants: Excel-like view of entire semester, not task lists
  - New architecture: Semester → Course → Categories → WeeklyProgress/Milestone
  - Weekly tracking: Check off what you did this week
  - Gentle gamification: Progress rings, celebrations, no stress
- **UX vision finalized** (2025-11-27): Full discussion documented
  - See `DESIGN_SYSTEM.md` § "UX Vision & Approved Approach" for full details
  - Mobile-first: Swipe gestures, 44×44px touch targets, thumb-zone optimization
  - "Magic Moment" animation: 300ms timeline (haptic → fill → confetti → toast)
- **Code quality**: TypeScript clean, ready for Phase 1 implementation
- **Security**: All existing security measures remain + will extend to new endpoints

---

## Project Overview

SemesterDash is a **semester-at-a-glance dashboard** that helps students visualize and track their entire semester in one view - inspired by Excel tracking but interactive, beautiful, and rewarding.

**Core Value:** See your entire semester at a glance. Track progress. Feel accomplished.

**Key Differentiators:**
- 📊 **Dashboard-first:** Not a task list app - it's a semester visualization tool
- 📅 **Weekly View:** Focus on "what's happening this week" across all courses
- 🎯 **Course Categories:** Each course has customizable tracking (lectures, tutorials, assignments, exams)
- 🎮 **Gentle Gamification:** Progress rings, micro-celebrations, no stress
- 📱 **Mobile-first:** Quick check-ins between classes
- 🎨 **Delightful UX:** Every interaction should feel rewarding

**What It's NOT:**
- ❌ Not another todo list app (Todoist, Things, etc.)
- ❌ Not a calendar app (Google Calendar does that)
- ❌ Not a grade tracker (that's a separate problem)

**Target Users:**
- University/college students (18-30, Gen Z)
- Juggling 4-6 courses per semester
- Want to feel organized without stress
- Mobile-native, expect instant feedback

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

## Data Architecture (New - Sprint 3.5)

### **The New Model:**

```typescript
// Top-level: Semester
Semester {
  id, name, startDate, endDate, weeksCount, userId
}

// Courses belong to semesters
Course {
  id, name, code, credits, color, semesterId, userId

  // Dynamic categories (what to track in this course)
  categories: Category[]
}

// Category = type of tracking in a course
Category {
  id, courseId
  type: "LECTURE" | "TUTORIAL" | "LAB" | "ASSIGNMENT" | "EXAM" | "CUSTOM"
  name: string // editable if CUSTOM
  icon: string
  trackingMode: "weekly" | "milestone"

  // If weekly:
  frequency: { perWeek: number } // e.g., 2 lectures/week

  // If milestone:
  totalCount: number // e.g., 5 assignments
}

// Weekly Progress (for weekly categories)
WeeklyProgress {
  id, courseId, categoryId, weekNumber
  completed: boolean
  completedAt: DateTime
}

// Milestones (for assignments, exams)
Milestone {
  id, courseId, categoryId
  title, dueDate, status, completedAt, grade, notes
}
```

### **Key Principles:**

1. **Semester-first:** Everything starts with defining the semester (dates, weeks)
2. **Course-centric:** Tasks/tracking are properties of courses, not standalone
3. **Flexible categories:** Each course can have different tracking needs
4. **Weekly + Milestone:** Support both recurring (lectures) and one-off (exams)
5. **User-owned:** All data tied to userId for security

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
