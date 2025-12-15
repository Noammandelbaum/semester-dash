# SemesterHub Extension - Publishing Guide

> **Created:** December 2025
> **Purpose:** Step-by-step guide for publishing the extension to browser stores

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Chrome Web Store](#2-chrome-web-store)
3. [Microsoft Edge Add-ons](#3-microsoft-edge-add-ons)
4. [Firefox Add-ons](#4-firefox-add-ons)
5. [Opera Add-ons](#5-opera-add-ons)
6. [Post-Publishing](#6-post-publishing)

---

## 1. Prerequisites

### Before Publishing

- [ ] Privacy Policy page is live at: `https://www.semesterhub.club/privacy`
- [ ] Terms of Service page is live at: `https://www.semesterhub.club/terms`
- [ ] Extension builds successfully (`cd extension && pnpm run build`)
- [ ] Extension tested manually in Chrome DevMode

### Store Assets Needed

| Asset | Dimensions | Format | Notes |
|-------|------------|--------|-------|
| Extension icon | 128x128 | PNG | Already in manifest |
| Store icon | 128x128 | PNG | Same as extension icon |
| Screenshots | 1280x800 or 640x400 | PNG/JPG | At least 1, recommended 5 |
| Promotional tile (optional) | 440x280 | PNG | For featured listings |

### Screenshot Ideas

1. **Extension popup** - Show connected state with course sync
2. **Dashboard view** - Show SemesterHub dashboard with synced courses
3. **Moodle integration** - Show extension working on Moodle page
4. **Assignment tracking** - Show assignments synced from Moodle

---

## 2. Chrome Web Store

### Step 1: Create Developer Account

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay one-time $5 registration fee
3. Use a dedicated email (recommended): `semesterhub.dev@gmail.com` or your main email

### Step 2: Build Extension

```bash
cd extension
pnpm run build
```

This creates the `dist/` folder with the production build.

### Step 3: Create ZIP Package

```bash
cd extension
# Create a zip of the dist folder
# On Windows (PowerShell):
Compress-Archive -Path dist\* -DestinationPath semesterhub-extension.zip

# On Mac/Linux:
cd dist && zip -r ../semesterhub-extension.zip . && cd ..
```

### Step 4: Submit Extension

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **"New Item"**
3. Upload `semesterhub-extension.zip`
4. Fill in the listing details:

#### Store Listing Details

**Package (Auto-filled from manifest)**
- Name: SemesterHub
- Version: 1.0.0

**Listing**

| Field | Hebrew | English |
|-------|--------|---------|
| **Short description** (132 chars max) | סנכרן את הקורסים והמטלות שלך מ-Moodle לדשבורד אחוד | Sync your courses and assignments from Moodle to a unified dashboard |
| **Detailed description** | See below | See below |

**Hebrew Description:**
```
SemesterHub מסנכרן אוטומטית את הקורסים והמטלות שלך מ-Moodle לדשבורד אחוד.

מה התוסף עושה:
• מזהה את דפי Moodle שלך
• מאפשר לבחור קורסים לסנכרון
• סוחב משימות ותאריכי הגשה
• מסנכרן ל-SemesterHub לצפייה נוחה

פיצ'רים:
✓ סנכרון אוטומטי של קורסים
✓ מעקב אחרי דדליינים
✓ ממשק בעברית
✓ תמיכה במוסדות אקדמיים בישראל

הפרטיות שלך חשובה לנו:
• לא אוספים סיסמאות
• לא אוספים ציונים
• לא משתפים מידע עם צדדים שלישיים

נבנה במיוחד לסטודנטים ישראליים.
```

**English Description:**
```
SemesterHub automatically syncs your courses and assignments from Moodle to a unified dashboard.

What this extension does:
• Detects your Moodle pages
• Lets you select courses to sync
• Fetches assignments and due dates
• Syncs to SemesterHub for easy viewing

Features:
✓ Automatic course sync
✓ Deadline tracking
✓ Hebrew interface
✓ Support for Israeli academic institutions

Your privacy matters:
• We don't collect passwords
• We don't collect grades
• We don't share data with third parties

Built specifically for Israeli students.
```

**Category:** Education or Productivity

**Language:** Hebrew (primary), English

#### Privacy Section

| Field | Value |
|-------|-------|
| Privacy Policy URL | `https://www.semesterhub.club/privacy` |
| Single Purpose | This extension syncs academic course data from Moodle to the SemesterHub dashboard |
| Permissions Justification | See below |

**Permission Justifications:**

| Permission | Justification |
|------------|---------------|
| `host_permissions: *://*.ac.il/*` | Required to access Israeli university Moodle pages (e.g., moodle.tau.ac.il) to scrape course and assignment data |
| `host_permissions: *://*.edu.il/*` | Required to access Israeli college Moodle pages to scrape course and assignment data |
| `storage` | Used to store authentication tokens and user preferences locally |
| `tabs` | Used to detect when user is on a Moodle page and to open sync tabs |
| `activeTab` | Used to read course and assignment data from the currently active Moodle page when the user initiates a sync. Only activated when the user explicitly clicks the extension or triggers a sync action. |
| `alarms` | Used to keep the service worker active during long-running sync operations. This prevents the browser from terminating the extension before the sync process completes. The alarm is only active during sync and is cleared immediately after. |
| `cookies` | Used to verify the user's authentication status with Moodle. The extension checks if the user is logged into Moodle before attempting to scrape course data. No cookies are transmitted or stored externally. |

**Remote Code Justification:**
> This extension does NOT use any remote code. All code is bundled locally within the extension. The extension communicates with the SemesterHub API (https://semesterhub.club) via standard HTTPS fetch requests to sync academic data, but no code is loaded or executed remotely.

### Step 5: Visibility Settings

For initial submission:
- **Visibility:** Unlisted (for beta testing)
- **Regions:** All regions (or specific if needed)

After testing:
- Change to **Public** for full release

### Step 6: Submit for Review

1. Click **Submit for Review**
2. Wait 1-3 weeks (longer due to host_permissions)
3. Check email for updates

### Expected Review Issues

Due to `*.ac.il` and `*.edu.il` permissions, expect:
- Manual review (not automatic)
- Possible request for more justification
- Review time: 1-3 weeks

**How to respond:**
> "This extension is specifically designed for Israeli university students to sync their academic data from Moodle LMS. The host permissions are limited to Israeli academic domains (.ac.il for universities, .edu.il for colleges). We only access Moodle pages to extract course names, assignment titles, and due dates. We do not access any other pages on these domains."

---

## 3. Microsoft Edge Add-ons

### Step 1: Create Developer Account

1. Go to [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview)
2. Sign in with Microsoft account
3. Registration is **FREE**

### Step 2: Submit Extension

The **same ZIP package** works for Edge:

1. Click **"Create new extension"**
2. Upload `semesterhub-extension.zip`
3. Fill in listing details (same as Chrome)
4. Submit for review

### Review Time

- Typically 2-4 business days
- Usually faster than Chrome

---

## 4. Firefox Add-ons

### Important: Firefox Needs Modifications

Firefox requires slight manifest changes. The extension currently uses Chrome-specific syntax.

### Option A: Wait for Phase 2

Focus on Chrome and Edge first, add Firefox support later.

### Option B: Add Firefox Support Now

1. Install webextension-polyfill:
```bash
cd extension
pnpm add webextension-polyfill
```

2. Create Firefox manifest variant (see docs/private/planning/extension-publishing-guide.md)

3. Submit to [Firefox Add-ons](https://addons.mozilla.org/developers/)

---

## 5. Opera Add-ons

### Step 1: Create Developer Account

1. Go to [Opera Developer Portal](https://addons.opera.com/developer/)
2. Registration is **FREE**

### Step 2: Submit Extension

Same ZIP package often works:

1. Upload extension
2. Fill in listing details
3. Submit for review

### Review Time

- Typically 1-7 days

---

## 6. Post-Publishing

### After Chrome Approval

1. **Update extension URLs:**
   - Update `CHROME_STORE_URL` in `src/app/onboarding/extension/page.tsx`
   - Update `SUPPORTED_BROWSERS` in `src/lib/browser-detection.ts`

2. **Update documentation:**
   - Add Chrome Web Store link to README
   - Update CLAUDE.md with store links

3. **Monitor reviews:**
   - Respond to user feedback
   - Fix issues promptly

### After Edge Approval

1. Update Edge Add-ons URL in codebase
2. Announce Edge support

### Updating the Extension

For updates:

1. Increment version in `manifest.json`
2. Build: `pnpm run build`
3. Create new ZIP
4. Upload to each store
5. Updates usually reviewed faster (24-72 hours)

---

## Quick Reference

### Build Commands

```bash
# Full build
cd extension
pnpm run build

# Create ZIP (PowerShell)
Compress-Archive -Path dist\* -DestinationPath semesterhub-extension.zip -Force

# Create ZIP (Mac/Linux)
cd dist && zip -r ../semesterhub-extension.zip . && cd ..
```

### Store URLs

| Store | Developer Dashboard |
|-------|-------------------|
| Chrome | https://chrome.google.com/webstore/devconsole |
| Edge | https://partner.microsoft.com/dashboard/microsoftedge |
| Firefox | https://addons.mozilla.org/developers/ |
| Opera | https://addons.opera.com/developer/ |

### Contact for Issues

- Chrome: [Developer Support](https://support.google.com/chrome_webstore/contact/dev_support)
- Edge: Through Partner Center
- Firefox: [AMO Support](https://extensionworkshop.com/community/)

---

## Checklist

### Before Submitting

- [ ] Privacy Policy live at /privacy
- [ ] Terms of Service live at /terms
- [ ] Extension builds without errors
- [ ] Extension tested in Chrome DevMode
- [ ] Screenshots prepared (at least 1)
- [ ] Descriptions written (Hebrew + English)

### Chrome Web Store

**Privacy Practices Tab:**
- [ ] Explained `activeTab` permission
- [ ] Explained `alarms` permission
- [ ] Explained `cookies` permission
- [ ] Explained remote code usage (we don't use any)
- [ ] Confirmed compliance with Developer Program Policy

**Account Tab:**
- [ ] Contact email provided (`semesterhub.club@gmail.com`)
- [ ] Contact email verified

**Store Listing:**
- [ ] Developer account created ($5 paid)
- [ ] ZIP package created
- [ ] Icon image uploaded (128x128)
- [ ] At least 1 screenshot uploaded (1280x800)
- [ ] Listing details filled
- [ ] Permission justifications written
- [ ] Submitted as "Unlisted"
- [ ] Review passed
- [ ] Changed to "Public"

### Edge Add-ons

- [ ] Developer account created (free)
- [ ] Extension submitted
- [ ] Review passed

### After Publishing

- [ ] Store URLs updated in codebase
- [ ] README updated with install links
- [ ] Monitoring set up for reviews/feedback
