export const UserMessages: Record<string, { he: string; en: string }> = {
  E1001: { he: 'אין חיבור לאינטרנט. בדוק את החיבור ונסה שוב.', en: 'No internet connection.' },
  E1002: { he: 'הבקשה ארכה יותר מדי זמן. נסה שוב.', en: 'Request timed out.' },
  E1003: { he: 'שגיאת רשת לא צפויה. נסה שוב.', en: 'Unexpected network error.' },
  E2001: { he: 'פג תוקף ההתחברות. יש להתחבר מחדש.', en: 'Session expired.' },
  E2002: { he: 'טוקן לא תקין. יש להתחבר מחדש.', en: 'Invalid token.' },
  E2003: { he: 'יש להתחבר קודם ל-SemesterHub.', en: 'Please log in first.' },
  E2004: { he: 'פג תוקף ההפעלה. יש להתחבר מחדש.', en: 'Session expired.' },
  E3001: { he: 'סנכרון כבר פועל. המתן לסיום.', en: 'Sync already in progress.' },
  E3002: { he: 'לא נבחרו קורסים לסנכרון.', en: 'No courses selected.' },
  E3003: { he: 'שגיאה בפתיחת לשונית. נסה שוב.', en: 'Failed to open tab.' },
  E3004: { he: 'שגיאה באיסוף נתונים מ-Moodle.', en: 'Failed to scrape data.' },
  E3005: { he: 'שגיאה בשמירת הנתונים. נסה שוב.', en: 'Failed to sync data.' },
  E4001: { he: 'דף זה אינו דף Moodle. נווט לאתר Moodle של המוסד שלך.', en: 'Not a Moodle page.' },
  E4002: { he: 'התוסף לא נטען כראוי. רענן את הדף.', en: 'Extension not loaded.' },
  E4003: { he: 'הדף לא הגיב בזמן. נסה שוב.', en: 'Page timed out.' },
  E5001: { he: 'יש להתחבר ל-Moodle. התחבר וסגור את החלון.', en: 'Please log in to Moodle.' },
  E5002: { he: 'הזמן הקצוב להתחברות ל-Moodle עבר. נסה שוב.', en: 'Moodle login timeout.' },
  E5003: { he: 'חלון Moodle נסגר. נסה שוב.', en: 'Moodle window closed.' },
};

export function getUserMessage(code: string, lang: 'he' | 'en' = 'he'): string {
  return UserMessages[code]?.[lang] || (lang === 'he' ? 'שגיאה לא צפויה' : 'Unknown error');
}
