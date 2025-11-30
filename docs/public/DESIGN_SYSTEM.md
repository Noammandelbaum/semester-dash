# SemesterHub Design System

## 🎯 Design Philosophy

### Core Principles
1. **Clarity Over Complexity** - Students are stressed; the UI should reduce cognitive load, not add to it
2. **Dashboard-First** - One view shows everything; drilling down reveals details
3. **Weekly Focus** - Prioritize "what's happening this week" over distant future
4. **Progress Visibility** - Always show where the user stands (what's done, what's next)
5. **Mobile-First** - Students check their phones constantly; mobile experience is primary
6. **Instant Feedback** - Every action should have immediate visual feedback
7. **Gentle Gamification** - Celebrate progress without creating stress
8. **Delight in Details** - Small animations and micro-interactions make the app feel alive

### Target User
- University/college students (18-30)
- Juggling 5-8 courses per semester
- Often overwhelmed and anxious about deadlines
- Check progress on mobile between classes
- Want quick answers: "What should I do next?"

## 🎨 Brand Identity

### Brand Personality
- **Calm & Organized** - Like a good study buddy who has their life together
- **Encouraging** - Celebrates progress, not just completion
- **Smart** - Anticipates needs, offers helpful suggestions
- **Modern** - Clean, contemporary, not cluttered

### Brand Voice
- Hebrew UI text should be:
  - Friendly but not childish ("!יופי" not "!וואו מדהים")
  - Clear and direct
  - Encouraging ("עוד קצת!", "את/ה בדרך הנכונה")

### Tagline
- **English:** "Your semester, at a glance"
- **Hebrew:** "הסמסטר שלך, במבט אחד"

### Key Message: Stress Reduction
> **75% of students feel overwhelmed by academic workload.**
> SemesterHub exists to change that.

Our messaging focuses on **calm and control**, not productivity hacking:
- ✅ "See your whole semester - it's manageable"
- ✅ "From chaos to calm"
- ❌ NOT "Boost your productivity"
- ❌ NOT "Never miss a deadline again!"

---

## 🇮🇱 Israeli-Specific Features

### Why Israel-First?
SemesterHub is built specifically for the Israeli academic ecosystem:

| Feature | Why It Matters |
|---------|----------------|
| **Hebrew-Native UI** | RTL design, natural Hebrew UX - not a translation |
| **Moodle Integration** | 90%+ of Israeli universities use Moodle |
| **Academic Calendar** | סמסטר א', ב', קיץ + מועדי בחינות |
| **Reserve Duty Mode** | Unique to Israel - automatic deadline adjustments |

### Reserve Duty Mode (מצב מילואים)
A feature no other app offers:
- Mark service period with one click
- System automatically suggests deadline adjustments
- "Catch-up plan" after returning from service
- Calculates "effective semester length" excluding service days

### Moodle Sync (Future)
- Browser extension for automatic course/assignment import
- No manual data entry needed
- Works with TAU, Hebrew U, Technion, BGU, etc.

## 🌈 Color Palette

> **Brand Decision (Nov 27, 2025):** "Playful Energy" palette chosen to align with Moodle's orange
> branding while maintaining a stress-reducing, student-friendly feel.
> See `docs/private/planning/naming-branding.md` for full rationale.

### Primary Colors
```css
--color-primary: #ff6b35;        /* Vibrant Orange - main brand color (Moodle-aligned) */
--color-primary-light: #ff8c5a;  /* Hover states */
--color-primary-dark: #e55a2b;   /* Active states */
```

### Secondary & Accent
```css
--color-secondary: #0f766e;      /* Deep Teal - calm, focus */
--color-secondary-light: #14b8a6;
--color-secondary-dark: #0d5f58;

--color-accent: #fbbf24;         /* Sunny Yellow - optimism, highlights */
--color-accent-light: #fcd34d;
--color-accent-dark: #f59e0b;
```

### Semantic Colors
```css
--color-success: #10B981;        /* Completed, positive */
--color-warning: #F59E0B;        /* Due soon, attention */
--color-danger: #EF4444;         /* Overdue, errors */
--color-info: #3B82F6;           /* Information */
```

### Course Colors (User-selectable)
```css
--course-red: #EF4444;
--course-orange: #ff6b35;        /* Primary brand */
--course-amber: #F59E0B;
--course-green: #22C55E;
--course-teal: #0f766e;          /* Secondary brand */
--course-blue: #3B82F6;
--course-indigo: #6366F1;
--course-purple: #8B5CF6;
--course-pink: #EC4899;
```

### Neutrals
```css
--color-background: #fafaf9;     /* Warm white - page background */
--color-surface: #FFFFFF;        /* Cards, modals */
--color-border: #E5E7EB;         /* Borders, dividers */
--color-text-primary: #111827;   /* Main text */
--color-text-secondary: #6B7280; /* Secondary text */
--color-text-muted: #9CA3AF;     /* Disabled, hints */
```

### Dark Mode (Future)
```css
--color-background-dark: #111827;
--color-surface-dark: #1F2937;
--color-text-primary-dark: #F9FAFB;
```

## 📐 Typography

### Font Family
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-hebrew: 'Rubik', 'Inter', sans-serif;  /* Rubik - designed for Hebrew, modern */
```

> **Note:** Rubik was chosen over Heebo for its modern design optimized for Hebrew.
> See `docs/private/planning/naming-branding.md` for typography rationale.

### Scale
```css
--text-xs: 0.75rem;    /* 12px - labels, hints */
--text-sm: 0.875rem;   /* 14px - secondary text */
--text-base: 1rem;     /* 16px - body text */
--text-lg: 1.125rem;   /* 18px - emphasis */
--text-xl: 1.25rem;    /* 20px - section headers */
--text-2xl: 1.5rem;    /* 24px - page headers */
--text-3xl: 1.875rem;  /* 30px - hero text */
```

### Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## 📏 Spacing & Layout

### Spacing Scale
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
```

### Border Radius
```css
--radius-sm: 0.25rem;  /* 4px - buttons, inputs */
--radius-md: 0.375rem; /* 6px - cards */
--radius-lg: 0.5rem;   /* 8px - modals */
--radius-xl: 0.75rem;  /* 12px - large cards */
--radius-full: 9999px; /* Pills, avatars */
```

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.07);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.15);
```

## 🧩 Components

### Buttons
```
Primary: Background primary, white text, rounded-lg
Secondary: Border primary, primary text, transparent bg
Ghost: No border, primary text, hover bg-gray-100
Danger: Background danger for destructive actions
```

### Cards
- White background
- Subtle shadow (shadow-sm)
- Rounded corners (radius-lg)
- 16-24px padding
- Hover: slight elevation increase

### Progress Indicators
- Circular progress for overall course progress
- Linear progress bar for assignment completion
- Color coding: green (>70%), yellow (40-70%), red (<40%)

### Status Badges
```
Not Started: Gray background, gray text
In Progress: Blue background, blue text
Completed: Green background, green text
Overdue: Red background, red text
```

### Empty States
- Friendly illustration
- Clear message explaining what to do
- Single CTA button
- Example: "אין קורסים עדיין. בוא נוסיף את הקורס הראשון שלך!"

## 📱 Responsive Breakpoints

```css
--screen-sm: 640px;   /* Mobile landscape */
--screen-md: 768px;   /* Tablet */
--screen-lg: 1024px;  /* Desktop */
--screen-xl: 1280px;  /* Large desktop */
```

### Mobile-First Approach
1. Design for mobile (375px) first
2. Add complexity as screen grows
3. Touch targets: minimum 44x44px
4. Bottom navigation on mobile
5. Side navigation on desktop

## ✨ Animations & Micro-interactions

### Principles
- Animations should be fast (150-300ms)
- Use ease-out for entries, ease-in for exits
- Avoid animations that block user actions
- Respect prefers-reduced-motion

### Common Animations
```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Check mark completion */
@keyframes checkmark {
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
}
```

### Interaction Feedback
- Button press: slight scale down (0.98)
- Card hover: subtle lift + shadow increase
- Assignment completion: satisfying checkmark animation
- Progress update: smooth number counting

## 🎉 Celebration Moments
- First course added: "🎓 יופי! הקורס הראשון נוסף"
- Assignment completed: Quick confetti or checkmark animation
- Course 100% complete: Special celebration screen
- Weekly progress: "📈 השבוע השלמת X מטלות!"

## 📋 Key Screens Design Notes

### Dashboard (Home)
- Quick stats at top (courses, tasks completed today)
- "What's Next" section - prioritized by urgency
- Course cards with progress rings
- Upcoming deadlines sidebar/section

### Course View
- Course header with color and stats
- Assignment list grouped by status or due date
- Progress bar prominent
- Quick add assignment button (FAB on mobile)

### Assignment Item
- Checkbox prominent and easy to tap
- Priority indicator
- Due date with color coding
- Swipe actions on mobile (complete, delete)

### Settings
- Profile section with avatar
- Semester date range
- Theme toggle (future)
- Notification preferences (future)

## 🔧 Implementation Notes

### Use Tailwind CSS
All design tokens should be configured in `tailwind.config.ts`:
```typescript
theme: {
  extend: {
    colors: {
      primary: {...},
      success: {...},
      // etc.
    },
    fontFamily: {
      sans: ['Inter', 'Rubik', 'sans-serif'],
    },
  },
}
```

### Component Library
Consider using shadcn/ui as base components and customizing:
- Button
- Card
- Dialog
- Input
- Select
- Checkbox
- Progress
- Badge
- Toast

### Icons
Use Lucide React for consistent iconography.

---

## 🎮 Gamification Guidelines

### **Philosophy: "Gentle Celebration, Not Pressure"**

**DO:**
- ✅ Progress rings/bars with smooth animations
- ✅ Micro-celebrations (0.3s confetti when assignment completed)
- ✅ Encouraging messages ("Great! 3 more this week")
- ✅ Color-coded status (green = good, yellow = attention, red = urgent)
- ✅ Weekly recaps ("You completed 12/15 assignments this week!")
- ✅ Subtle achievements ("First course created! 🎓")

**DON'T:**
- ❌ Points/XP systems (creates pressure)
- ❌ Leaderboards (encourages unhealthy competition)
- ❌ Streaks that punish breaks (Duolingo-style guilt)
- ❌ "You're falling behind!" messaging
- ❌ Aggressive notifications

### **Interaction Patterns:**

**Assignment Completion:**
```
1. Tap/click on checkbox → immediate green fill (150ms)
2. Micro-confetti (2-3 particles, 300ms)
3. Progress bar smoothly animates forward (500ms)
4. Optional: Haptic feedback on mobile (single tap)
5. Encouraging text appears briefly: "כל הכבוד! ✓"
```

**Mobile Gestures:**
```
- Swipe right → Complete assignment
- Swipe left → Skip/delete (with undo)
- Long press → Show details/options
- Pull to refresh → Sync data
```

**Progress Visualization:**
```
- Circular progress (Apple Watch style)
- Color transitions: Red (0-40%) → Yellow (40-70%) → Green (70%+)
- Smooth animations (ease-out, 500ms)
- Numbers count up when updated
```

---

## 📱 UX Flows

### **First-Time User (Onboarding):**

```
Landing → Login (Google) → Welcome →
Setup Semester (dates) → Create First Course →
Dashboard (with tips)
```

**Key Principles:**
- Maximum 3-4 screens before seeing value
- Each step has progress indicator (1/3, 2/3, etc.)
- Can skip and come back later
- Defaults are smart (13 weeks, current semester dates)

### **Daily Use (Returning User):**

```
Open App → Weekly View (default) →
Tap checkbox to complete →
Micro-celebration →
View updated progress
```

**Alternative paths:**
- Swipe to next week
- Tap course → detailed view
- + button → quick add assignment

### **Creating a Course:**

```
+ Add Course →
Fill basic info (name, code, credits, color) →
Confirmation → Back to dashboard
```

**Inline validation:**
- Live preview of color selection
- Auto-suggest course codes (future)
- Default values pre-filled
- Assignments added separately per course

---

**Remember:** Good design isn't decoration—it's about making the app easier and more enjoyable to use. Every design decision should answer: "Does this help the student manage their semester better?"

**New mantra:** Make it fast, make it clear, make it rewarding.

---

## 🎨 UX Vision & Approved Approach

### **The Core Problem We're Solving**

Students don't need another task manager. They need to **see their entire semester at a glance** and feel in control.

**Inspiration:** Excel tracking but interactive, beautiful, and rewarding.

---

### **Key UX Decisions (Approved 2025-11-27)**

#### 1. **Prototype Approach: HTML/CSS Interactive Mockups**

**Decision:** Build functional HTML/CSS prototypes instead of static Figma designs.

**Rationale:**
- ✅ Interactive immediately (click, tap, see animations)
- ✅ Works on mobile/desktop for testing
- ✅ 50% of the final code already done
- ✅ Fast iteration based on feedback
- ⚠️ Less visually polished than professional Figma (acceptable for MVP)

**Future:** If MVP succeeds, invest in professional UI/UX designer for polish.

---

#### 2. **Gamification Philosophy: "Gentle Celebration, Not Pressure"**

**What We DO:**
- ✅ **Progress rings** (Apple Watch style) - smooth animations
- ✅ **Micro-celebrations** - 0.3s confetti when assignment completed
- ✅ **Encouraging messages** - "כל הכבוד! עוד 3 מטלות השבוע"
- ✅ **Color-coded status** - Green = good, Yellow = attention, Red = urgent
- ✅ **Weekly recaps** - "השלמת 12/15 מטלות השבוע!"
- ✅ **Subtle achievements** - "הקורס הראשון נוסף! 🎓"

**What We DON'T:**
- ❌ Points/XP systems (creates pressure)
- ❌ Leaderboards (unhealthy competition)
- ❌ Streaks that punish breaks (Duolingo-style guilt)
- ❌ "You're falling behind!" messaging
- ❌ Aggressive notifications

**Key Principle:** Empower and calm, never stress.

---

#### 3. **First-Time User Experience (Onboarding Flow)**

**Goal:** 3-4 screens max, 1-2 minutes to first value.

```
Landing → Google Login → Welcome →
Setup Semester (dates) → Create First Course →
Dashboard (with gentle tips)
```

**Key Features:**
1. **No overwhelming tutorials** - learning by doing
2. **Smart defaults** - 13 weeks, current semester type auto-detected
3. **Progress indicator** - "צעד 1 מתוך 3"
4. **Skip option** - "אעשה את זה אחר כך"
5. **Immediate celebration** - "🎉 מעולה! הקורס הראשון מוכן"

**Example Flow:**

```
┌─────────────────────────────────────┐
│  צעד 1 מתוך 3: מתי הסמסטר?         │
├─────────────────────────────────────┤
│  📅 סוג סמסטר: [סמסטר א' ▼]        │
│  📅 תאריך התחלה: [01.11.24____]    │
│  📅 תאריך סיום:   [28.02.25____]   │
│                                      │
│  💡 13 שבועות (מחושב אוטומטית)      │
│                                      │
│  [דלג לעכשיו]  [הבא →]              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  צעד 2 מתוך 3: הקורס הראשון        │
├─────────────────────────────────────┤
│  שם: [מבוא למדעי המחשב_______]     │
│  קוד: [CS101] נ"ז: [3.5]           │
│  צבע: 🟠🟢🟡🔴🟣                     │
│                                      │
│  [הוסף קורס →]                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🎉 מעולה! הקורס הראשון מוכן        │
├─────────────────────────────────────┤
│  רוצה להוסיף עוד קורסים?           │
│                                      │
│  [+ הוסף עוד קורס]                 │
│  [סיימתי, קח אותי לדשבורד →]       │
└─────────────────────────────────────┘
```

> **Note:** Assignments are added per-course after initial setup, not during onboarding.
> This keeps onboarding fast (< 2 minutes to first value).

---

#### 4. **Default View: Weekly View**

**Decision:** Default screen = "מה יש לי השבוע"

**Alternative views accessible via tabs/toggle:**
- 📅 **Weekly View** (default) - focus on this week
- 📊 **Dashboard** - all courses overview
- 🗓️ **Timeline** - entire semester grid

**Weekly View Example:**

```
┌──────────────────────────────────────────────────┐
│  🗓️ השבוע שלך - שבוע 4 (20-26 נובמבר)           │
│                              [תצוגה: שבועי ▼]     │
├──────────────────────────────────────────────────┤
│                                                   │
│  🔵 מבוא למדעי המחשב              [פרטים →]     │
│  ┌───────────────────────────────────┐          │
│  │ ████████████████░░░░░░░░ 75%      │          │
│  └───────────────────────────────────┘          │
│  השבוע: ✅ הרצאה  ✅ תרגול  🔶 הגשה 2 (3 ימים) │
│                                                   │
│  🟢 מבני נתונים                   [פרטים →]     │
│  ┌───────────────────────────────────┐          │
│  │ ████████████░░░░░░░░░░░░ 60%      │          │
│  └───────────────────────────────────┘          │
│  השבוע: ✅ הרצאה  ⬜ תרגול  ⬜ מעבדה            │
│                                                   │
├──────────────────────────────────────────────────┤
│  📊 סטטיסטיקות מהירות:                           │
│  • 8/13 משימות הושלמו השבוע                     │
│  • 2 הגשות בשבוע הבא                            │
│  • אתה 15% מעל הממוצע! 🔥                       │
└──────────────────────────────────────────────────┘
```

---

#### 5. **Assignment Completion Animation (The Magic Moment)**

**User Action:** Tap/click on ⬜ checkbox

**System Response (300ms total):**

1. **Immediate visual feedback (0-150ms):**
   - Checkbox fills with green color
   - Smooth transition animation

2. **Celebration (150-300ms):**
   - ✅ Checkmark appears with slide-in
   - 🎊 2-3 confetti particles (subtle!)
   - 📳 Haptic feedback on mobile (single tap)

3. **Progress update (300-500ms):**
   - Progress bar smoothly animates forward
   - Number counts up (75% → 77%)
   - Encouraging message: "כל הכבוד! ✓"

**Code Example (CSS):**
```css
@keyframes checkboxFill {
  from {
    background-color: transparent;
    transform: scale(1);
  }
  to {
    background-color: var(--color-success);
    transform: scale(1.1);
  }
}

@keyframes confetti {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(-20px) rotate(360deg);
    opacity: 0;
  }
}
```

---

#### 6. **Mobile Gestures (Touch-First)**

**Primary Actions:**
- **Tap** - Toggle completion (⬜ → ✅)
- **Swipe right** - Quick complete
- **Swipe left** - Quick skip/delete (with undo toast)
- **Long press** - Show details/options menu
- **Pull to refresh** - Sync data

**Why swipe?**
- ✅ Faster than tapping small checkboxes
- ✅ Feels natural on mobile
- ✅ Familiar pattern (Mail, Todoist)

---

#### 7. **Notifications & Reminders (Gentle, Not Aggressive)**

**Philosophy:** Help, don't nag.

**Delivery Channels:**
1. **In-app banner** (primary)
   ```
   ┌────────────────────────────────────┐
   │  🔔 קרוב ומשמעותי:                 │
   │  • הגשה: תרגיל 3 - עוד 3 ימים    │
   │  [תזכיר מחר] [ראיתי ✓]            │
   └────────────────────────────────────┘
   ```

2. **Email digest** (weekly, opt-in)
   - "מה צפוי השבוע הבא"
   - Sent Sunday evening
   - One email, all deadlines

3. **Browser notifications** (opt-in only)
   - Only for urgent deadlines (< 2 days)
   - User explicitly enables

**Tone Examples:**
- ✅ "הגשת תרגיל 3 קרובה (1 דצמבר) - רוצה לתכנן?"
- ❌ "התראה! הגשה בעוד 2 ימים!!!"

---

#### 8. **Empty States (Encouraging, Not Depressing)**

**No courses yet:**
```
┌────────────────────────────────────┐
│           📚                        │
│     אין לך קורסים עדיין            │
│                                     │
│  בוא נתחיל! הוסף את הקורס הראשון  │
│  שלך ותראה את כל הסמסטר במבט אחד   │
│                                     │
│  [+ צור קורס ראשון]                │
└────────────────────────────────────┘
```

**No assignments this week:**
```
┌────────────────────────────────────┐
│           🎉                        │
│     אין לך מטלות השבוע!            │
│                                     │
│  תהנה מהשבוע הרגוע 😊              │
│  או תתחיל להתכונן לשבוע הבא        │
│                                     │
│  [ראה שבוע הבא →]                  │
└────────────────────────────────────┘
```

---

#### 9. **Responsive Breakpoints & Mobile-First**

**Design Order:**
1. Mobile portrait (375px) - PRIMARY
2. Mobile landscape (667px)
3. Tablet (768px)
4. Desktop (1024px+)

**Mobile optimizations:**
- Touch targets: minimum 44×44px
- Bottom navigation (thumb zone)
- FAB for quick add (bottom-right)
- Swipe gestures enabled
- No hover states required

**Desktop enhancements:**
- Keyboard shortcuts (Space = toggle, N = new task)
- Hover states for discoverability
- Sidebar navigation
- Wider grid views

---

### **Visual Inspiration & References**

**Apps we learn from:**
- ✅ **Notion** - Clean, minimal, intuitive
- ✅ **Linear** - Fast, beautiful, delightful
- ✅ **Todoist** - Smart gamification (gentle)
- ✅ **Apple Reminders** - Simple, effective
- ⚠️ **Duolingo** - Good animations, but too stressful (avoid guilt)

**What makes them work:**
- Instant feedback on every action
- Progress visible at all times
- Minimal clicks to complete assignments
- Beautiful but not distracting
- Mobile-first thinking

---

### **Design Implementation Strategy**

**Phase 1: MVP (Sprints 2-4)**
- Clean, functional UI with basic styling
- Focus on UX flow and interactions
- Use Tailwind CSS defaults
- Minimal custom animations

**Phase 2: Polish (Sprints 5-6)**
- Professional UI/UX designer (if budget allows)
- Advanced animations and transitions
- Branded illustrations
- Micro-interactions refinement

**Principle:** Function first, beauty second.

---

**Document Updated:** 2025-11-30
**Based on:** Research phase findings, naming-branding.md, user-pain-points.md
**Next Review:** After Sprint 2 completion
