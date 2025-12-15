# מדריך פרסום - Chrome Web Store

## שלב 1: הכנת חשבון מפתח

1. **צור חשבון Chrome Developer:**
   - גלוש ל-https://chrome.google.com/webstore/devconsole
   - התחבר עם חשבון Google
   - שלם $5 (פעם אחת)
   - מלא את פרטי המפתח

2. **הכן את הפרטים:**
   - שם מפתח: SemesterHub
   - אימייל תמיכה: semesterhub.club@gmail.com
   - אתר: https://www.semesterhub.club

## שלב 2: הכנת Assets

### אייקונים (חובה)
- `icon-16.png` - 16x16 px
- `icon-48.png` - 48x48 px
- `icon-128.png` - 128x128 px

### Screenshots (חובה, 1-5 תמונות)
- גודל: 1280x800 או 640x400
- פורמט: PNG או JPEG

**Screenshots מומלצים:**
1. Popup פתוח על דף Moodle
2. דשבורד SemesterHub עם קורסים מסונכרנים
3. תהליך הסנכרון (progress bar)
4. הודעת הצלחה

### Promotional Images (אופציונלי)
- Small: 440x280 px
- Large: 920x680 px
- Marquee: 1400x560 px

## שלב 3: בניית ה-Extension

```bash
cd extension

# Build לפרודקשן
npm run build:prod

# צור ZIP להעלאה
npm run build:zip
```

הקובץ `extension-vX.X.X.zip` יווצר בתיקיית `extension/`.

## שלב 4: העלאה ל-Chrome Web Store

1. **גלוש ל-Developer Dashboard:**
   https://chrome.google.com/webstore/devconsole

2. **לחץ "New Item"**

3. **העלה את קובץ ה-ZIP**

4. **מלא את פרטי ה-Listing:**

   **Store Listing:**
   - שם: `SemesterHub - Moodle Sync`
   - תיאור קצר: `סנכרן קורסים ומשימות מ-Moodle ל-SemesterHub`
   - תיאור מלא: (ראה `store/description-he.md`)
   - קטגוריה: `Productivity`
   - שפה: `Hebrew` (עברית)

   **Graphic Assets:**
   - העלה אייקון 128x128
   - העלה screenshots

   **Additional Fields:**
   - אתר: `https://www.semesterhub.club`
   - מדיניות פרטיות: `https://www.semesterhub.club/privacy` (או הכתובת שלך)

5. **Privacy Practices:**
   - סמן "This extension doesn't collect or use user data" - לא
   - מלא מה נאסף: Course names, Assignment titles, Due dates

6. **שמור כטיוטה** (Save Draft)

## שלב 5: שליחה לבדיקה

1. **בדוק שוב את כל הפרטים**
2. **לחץ "Submit for Review"**
3. **זמן בדיקה:** 2-3 ימי עסקים (יכול להימשך עד שבוע)

## שלב 6: לאחר אישור

1. ה-Extension יפורסם אוטומטית
2. עדכן את הלינק באתר SemesterHub
3. הוסף badge "Available on Chrome Web Store"

## עדכון גרסה

1. עדכן גרסה ב-`manifest.json` וב-`package.json`
2. בנה ZIP חדש
3. גלוש ל-Developer Dashboard
4. בחר את ה-Extension
5. לחץ "Package" -> "Upload new package"
6. העלה את ה-ZIP החדש
7. שלח לבדיקה

## טיפים

- **כתוב תיאור טוב** - זה משפיע על חיפוש
- **Screenshots איכותיים** - מראה מקצועיות
- **עדכן בקביעות** - מראה שהפרויקט פעיל
- **הגב לביקורות** - בונה אמון

## Firefox Add-ons (אופציונלי)

אם רוצים לפרסם גם ב-Firefox:

1. **צור חשבון:**
   https://addons.mozilla.org/developers/

2. **התאמות נדרשות:**
   - Firefox משתמש ב-Manifest V2 (לעת עתה)
   - צור `manifest-firefox.json` נפרד
   - הוסף script: `npm run build:firefox`

3. **העלאה:**
   - לחץ "Submit a New Add-on"
   - העלה ZIP
   - מלא פרטים דומים

---

## רשימת תיוג לפני פרסום

- [ ] גרסה עודכנה ב-manifest.json
- [ ] גרסה עודכנה ב-package.json
- [ ] Build עבר ללא שגיאות
- [ ] ZIP נוצר בהצלחה
- [ ] נבדק ב-Chrome נקי
- [ ] Screenshots מוכנים (1280x800)
- [ ] אייקון 128x128 מוכן
- [ ] תיאור בעברית מוכן
- [ ] Privacy Policy באתר
- [ ] קישור לאתר עובד
