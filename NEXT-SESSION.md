# הנחיות לסשן הבא

> **תאריך:** 2025-11-30
> **משימה:** Sprint 2 Planning - UI Framework

---

## מה הושלם בסשן הזה

- ✅ STUDDASH-19: Database Schema Refactor
  - הוספת Semester model עם SemesterType enum
  - שינוי Task → Assignment
  - קישור Course ל-Semester
  - API routes חדשים: `/api/assignments`
  - מחיקת קבצי Task ישנים
- ✅ Sprint 1 הושלם ונסגר

---

## המשימה הבאה: Sprint 2 - UI Framework

### לפני שמתחילים:
```bash
# קרא את ה-roadmap
cat docs/private/planning/roadmap.md

# בדוק את ה-gap analysis לסעיף UI Components
cat docs/private/planning/gap-analysis.md
```

### Sprint 2 כולל (לפי Jira):
- STUDDASH-22: Design System (colors, fonts, spacing)
- STUDDASH-23: UI Components (DatePicker, ProgressRing, EmptyState)
- STUDDASH-24: Layout System (sidebar, navigation, RTL)

### מה קיים כבר:
- Button, Card, Input, Dialog, Select
- Checkbox, Label, Badge, Progress, Textarea
- Hebrew text support (בסיסי)

### מה חסר:
- DatePicker (Hebrew-aware)
- ProgressRing (circular progress)
- EmptyState component
- Skeleton loaders
- Toast notifications
- Brand colors update

---

## פקודות שימושיות

```bash
# בדוק סטטוס Jira
node scripts/jira.mjs active

# רץ dev server
npm run dev

# בדוק build
npx next build
```

---

**מוכן להתחיל Sprint 2!**
