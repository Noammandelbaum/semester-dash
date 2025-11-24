# SemesterDash Design System

## 🎯 Design Philosophy

### Core Principles
1. **Clarity Over Complexity** - Students are stressed; the UI should reduce cognitive load, not add to it
2. **Progress Visibility** - Always show where the user stands (what's done, what's next)
3. **Mobile-First** - Students check their phones constantly; mobile experience is primary
4. **Instant Feedback** - Every action should have immediate visual feedback
5. **Delight in Details** - Small animations and micro-interactions make the app feel alive

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

## 🌈 Color Palette

### Primary Colors
```css
--color-primary: #6366F1;        /* Indigo - main brand color */
--color-primary-light: #818CF8;  /* Hover states */
--color-primary-dark: #4F46E5;   /* Active states */
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
--course-orange: #F97316;
--course-amber: #F59E0B;
--course-green: #22C55E;
--course-teal: #14B8A6;
--course-blue: #3B82F6;
--course-indigo: #6366F1;
--course-purple: #8B5CF6;
--course-pink: #EC4899;
```

### Neutrals
```css
--color-background: #FAFAFA;     /* Page background */
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
--font-hebrew: 'Heebo', 'Inter', sans-serif;
```

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
- Linear progress bar for task completion
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
- Task completion: satisfying checkmark animation
- Progress update: smooth number counting

## 🎉 Celebration Moments
- First course added: "🎓 יופי! הקורס הראשון נוסף"
- Task completed: Quick confetti or checkmark animation
- Course 100% complete: Special celebration screen
- Weekly progress: "📈 השבוע השלמת X משימות!"

## 📋 Key Screens Design Notes

### Dashboard (Home)
- Quick stats at top (courses, tasks completed today)
- "What's Next" section - prioritized by urgency
- Course cards with progress rings
- Upcoming deadlines sidebar/section

### Course View
- Course header with color and stats
- Task list grouped by type or week
- Progress bar prominent
- Quick add task button (FAB on mobile)

### Task Item
- Checkbox prominent and easy to tap
- Task type icon
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
      sans: ['Inter', 'Heebo', 'sans-serif'],
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

**Remember:** Good design isn't decoration—it's about making the app easier and more enjoyable to use. Every design decision should answer: "Does this help the student manage their semester better?"
