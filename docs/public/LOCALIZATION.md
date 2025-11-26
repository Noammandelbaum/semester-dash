# SemesterDash Localization Guide

## Supported Languages

### Phase 1 (MVP)
| Language | Code | Direction | Native Name |
|----------|------|-----------|-------------|
| Hebrew | `he` | RTL | עברית |
| English | `en` | LTR | English |

### Phase 2 (Post-MVP)
| Language | Code | Direction | Native Name |
|----------|------|-----------|-------------|
| Russian | `ru` | LTR | Русский |
| Arabic | `ar` | RTL | العربية |

### Phase 3 (Future)
| Language | Code | Direction | Native Name |
|----------|------|-----------|-------------|
| French | `fr` | LTR | Français |
| Spanish | `es` | LTR | Español |
| Amharic | `am` | LTR | አማርኛ |

## Implementation Strategy

### i18n Library
Use `next-intl` for internationalization:
- Server Component support
- Type-safe translations
- Automatic locale detection
- RTL support

### Folder Structure
```
src/
├── messages/
│   ├── he.json      # Hebrew translations
│   ├── en.json      # English translations
│   ├── ru.json      # Russian translations (Phase 2)
│   └── ar.json      # Arabic translations (Phase 2)
├── i18n/
│   ├── request.ts   # Locale detection
│   └── routing.ts   # Locale routing
```

### URL Structure
```
/he/dashboard    # Hebrew (default)
/en/dashboard    # English
/ru/dashboard    # Russian
/ar/dashboard    # Arabic
```

## Translation Keys Structure

```json
{
  "common": {
    "appName": "SemesterDash",
    "save": "שמור",
    "cancel": "ביטול",
    "delete": "מחק",
    "edit": "ערוך",
    "add": "הוסף",
    "loading": "טוען...",
    "error": "שגיאה",
    "success": "הצלחה"
  },
  "auth": {
    "signIn": "התחברות",
    "signOut": "התנתקות",
    "signInWithGoogle": "התחבר עם Google",
    "welcome": "ברוך הבא!"
  },
  "courses": {
    "title": "הקורסים שלי",
    "addCourse": "הוסף קורס",
    "courseName": "שם הקורס",
    "courseCode": "קוד הקורס",
    "credits": "נקודות זכות",
    "noCourses": "אין קורסים עדיין",
    "noCoursesHint": "בוא נוסיף את הקורס הראשון שלך!"
  },
  "tasks": {
    "title": "משימות",
    "addTask": "הוסף משימה",
    "taskName": "שם המשימה",
    "taskType": "סוג המשימה",
    "dueDate": "תאריך יעד",
    "types": {
      "lecture": "הרצאה",
      "tutorial": "תרגול",
      "lab": "מעבדה",
      "assignment": "מטלה",
      "exam": "מבחן",
      "project": "פרויקט",
      "reading": "קריאה"
    },
    "status": {
      "notStarted": "לא התחיל",
      "inProgress": "בתהליך",
      "completed": "הושלם",
      "skipped": "דילוג"
    }
  },
  "dashboard": {
    "title": "לוח הבקרה",
    "progress": "התקדמות",
    "whatsNext": "מה עכשיו?",
    "upcomingDeadlines": "דדליינים קרובים",
    "completedToday": "הושלמו היום",
    "totalProgress": "התקדמות כללית"
  },
  "celebration": {
    "firstCourse": "🎓 יופי! הקורס הראשון נוסף",
    "taskCompleted": "✅ כל הכבוד!",
    "courseCompleted": "🎉 סיימת את כל המשימות בקורס!",
    "weeklyProgress": "📈 השבוע השלמת {count} משימות!"
  }
}
```

## RTL Support

### CSS Considerations
```css
/* Use logical properties */
.card {
  margin-inline-start: 1rem;  /* Instead of margin-left */
  padding-inline-end: 1rem;   /* Instead of padding-right */
}

/* Text alignment */
.text-start {
  text-align: start;  /* Respects RTL */
}
```

### Tailwind RTL Plugin
Install `tailwindcss-rtl` for RTL utilities:
```css
.ltr:ml-4   /* Left margin in LTR */
.rtl:mr-4   /* Right margin in RTL */
```

### Component Considerations
- Icons that indicate direction (arrows) should flip in RTL
- Progress bars fill from right in RTL
- Carousels navigate opposite direction in RTL

## Language Detection

### Priority Order
1. User preference (stored in database/localStorage)
2. URL locale parameter
3. Browser Accept-Language header
4. Default: Hebrew

### Language Selector
- Show in header/settings
- Display native language name
- Flag icon (optional, can be controversial)
- Persist preference

## Translation Workflow

### Adding New Text
1. Add key to `en.json` first (source of truth)
2. Add translation to other language files
3. Use `t('key')` in components

### Translation Quality
- Professional translation for launch
- Community contributions welcome post-launch
- Consider context (button text vs. paragraph)
- Keep text concise for UI elements

## Testing Translations

### Checklist
- [ ] All keys exist in all language files
- [ ] No truncated text in UI
- [ ] RTL layout correct for Hebrew/Arabic
- [ ] Numbers formatted correctly
- [ ] Dates formatted correctly (locale-aware)
- [ ] Pluralization works

### Pseudo-localization
For testing layout:
- Add 30% extra length to strings
- Include special characters (ñ, ü, etc.)
- Verify text doesn't overflow

## Resources
- [next-intl docs](https://next-intl-docs.vercel.app/)
- [RTL Styling Guide](https://rtlstyling.com/)
- [Hebrew Typography](https://practicaltypography.com/hebrew.html)
