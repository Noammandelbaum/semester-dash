# SemesterHub

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

<img src="screenshot-dashboard.png" alt="SemesterHub Dashboard" width="700">

**Your semester, at a glance**

[Live Demo](https://semester-dash.vercel.app/login) • [Features](#-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started)

</div>

---

## 🎯 The Story Behind the Code

**The Problem:** Every student knows the frustration. Moodle shows assignments scattered across multiple pages. No clear overview of deadlines. Progress tracking is non-existent. You click through 10 pages just to see what's due this week.

**The Question:** *What if your semester data was actually... organized?*

This project started from personal pain. As a student at JCT, I spent more time navigating Moodle than actually studying. So I built the tool I wished existed: **a clean dashboard that shows everything at a glance**.

### The Challenge

> "Build a system that talks to a university platform you don't control, syncs data reliably, and presents it beautifully."

This required solving real engineering problems:
- **Browser Extension Development** – Manifest v3, content scripts, service workers
- **Authentication Complexity** – Google OAuth for the webapp + JWT tokens for the extension
- **Data Synchronization** – Reliable sync between Moodle → Extension → Backend → Dashboard
- **Real-time Updates** – Keep data fresh without overwhelming the server

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 📋 Assignment Tracking
See all your assignments in one place. Switch between **Kanban** and **List** views. Drag-and-drop to update status.

</td>
<td width="50%">

### 📅 Calendar View
Day, week, and month views of your deadlines. Never miss a submission again.

</td>
</tr>
<tr>
<td width="50%">

### 📊 Progress Tracking
Visual progress bars for each course. See exactly how much you've completed.

</td>
<td width="50%">

### 🔄 Real-time Sync
Browser extension syncs data automatically whenever you visit Moodle.

</td>
</tr>
<tr>
<td width="50%">

### 🔐 Secure Authentication
Google OAuth + JWT tokens. Your data stays yours.

</td>
<td width="50%">

### 🌐 Hebrew RTL Support
Full right-to-left support. Built for Israeli students.

</td>
</tr>
</table>

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Student's Browser                           │
│                                                                  │
│  ┌─────────────────┐              ┌─────────────────────────┐   │
│  │   Moodle Tab    │              │  SemesterHub Dashboard  │   │
│  │   (ac.il)       │              │  (semester-dash.vercel) │   │
│  └────────┬────────┘              └────────────┬────────────┘   │
│           │                                    │                 │
│           │         ┌──────────────────┐       │                 │
│           └────────►│    Extension     │◄──────┘                 │
│                     │  ┌────────────┐  │                         │
│                     │  │  Content   │  │                         │
│                     │  │  Scripts   │  │                         │
│                     │  └────────────┘  │                         │
│                     │  ┌────────────┐  │                         │
│                     │  │  Service   │  │                         │
│                     │  │  Worker    │  │                         │
│                     │  └────────────┘  │                         │
│                     └────────┬─────────┘                         │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               │ HTTPS + JWT
                               ▼
                ┌──────────────────────────────┐
                │     Next.js API (Vercel)     │
                │  ┌────────────────────────┐  │
                │  │   /api/extension/*     │  │  Token generation
                │  │   /api/sync/moodle     │  │  Data sync endpoint
                │  │   /api/courses/*       │  │  CRUD operations
                │  │   /api/assignments/*   │  │  CRUD operations
                │  └────────────────────────┘  │
                │  ┌────────────────────────┐  │
                │  │   NextAuth.js v5       │  │  Google OAuth
                │  │   Rate Limiter         │  │  10 req/min
                │  │   CORS Whitelist       │  │  Security
                │  └────────────────────────┘  │
                └──────────────┬───────────────┘
                               │
                               │ Prisma ORM
                               ▼
                ┌──────────────────────────────┐
                │    PostgreSQL (Neon Cloud)   │
                │  ┌────────────────────────┐  │
                │  │  Users                 │  │
                │  │  Semesters             │  │
                │  │  Courses               │  │
                │  │  Assignments           │  │
                │  │  UserPreferences       │  │
                │  └────────────────────────┘  │
                └──────────────────────────────┘
```

### Data Flow: How Sync Works

```
1. Student visits Moodle
           │
           ▼
2. Extension detects Moodle page
           │
           ▼
3. Content script scrapes course/assignment data
           │
           ▼
4. Extension checks for valid JWT token
           │
     ┌─────┴─────┐
     │           │
   Valid      Invalid
     │           │
     │           ▼
     │    5a. Request new token
     │        (using session cookie)
     │           │
     │           ▼
     │    5b. Store token in
     │        chrome.storage.local
     │           │
     └─────┬─────┘
           │
           ▼
6. POST /api/sync/moodle with Bearer token
           │
           ▼
7. Server validates JWT + rate limit
           │
           ▼
8. Upsert courses/assignments (by moodleId)
           │
           ▼
9. Dashboard shows updated data
```

---

## 🛠️ Tech Stack

### Web Application

| Layer | Technology | Why |
|-------|------------|-----|
| **Framework** | Next.js 16 (App Router) | Server components, API routes, great DX |
| **Language** | TypeScript (strict) | Type safety across the entire stack |
| **Database** | PostgreSQL (Neon) | Reliable, scalable, serverless |
| **ORM** | Prisma 7 | Type-safe queries, migrations, studio |
| **Auth** | NextAuth.js v5 | Google OAuth, session management |
| **Styling** | Tailwind CSS 4 | Utility-first, RTL support |
| **UI Components** | Radix UI | Accessible, unstyled primitives |
| **Icons** | Lucide | Clean, consistent iconography |
| **Drag & Drop** | DnD Kit | Accessible drag-and-drop |

### Browser Extension

| Layer | Technology | Why |
|-------|------------|-----|
| **Manifest** | V3 | Latest Chrome extension standard |
| **Build** | Vite 6 | Fast builds, HMR for development |
| **Language** | TypeScript | Same type safety as webapp |
| **Auth** | JWT Bearer Tokens | Secure, stateless authentication |
| **Storage** | chrome.storage.local | Persistent token storage |

### Infrastructure

| Layer | Technology | Why |
|-------|------------|-----|
| **Hosting** | Vercel | Zero-config Next.js deployment |
| **Database** | Neon | Serverless PostgreSQL |
| **CI/CD** | GitHub Actions | Automated lint + build |
| **Security** | CORS + Rate Limiting | Protection against abuse |

---

## 📊 Database Schema

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  image         String?
  semesters     Semester[]
  preferences   UserPreferences?
}

model Semester {
  id        String   @id @default(cuid())
  name      String   // "A", "B", "Summer"
  year      Int
  startDate DateTime
  endDate   DateTime
  courses   Course[]
  user      User     @relation(...)
}

model Course {
  id           String       @id @default(cuid())
  name         String
  courseCode   String?
  moodleId     String?      @unique
  moodleUrl    String?
  color        String?
  lastSyncedAt DateTime?
  assignments  Assignment[]
  semester     Semester     @relation(...)
}

model Assignment {
  id                     String   @id @default(cuid())
  title                  String
  description            String?
  dueDate                DateTime?
  type                   AssignmentType  // ASSIGNMENT, QUIZ, FORUM
  status                 AssignmentStatus // NOT_STARTED, IN_PROGRESS, COMPLETED
  moodleId               String?  @unique
  moodleSubmissionStatus String?
  course                 Course   @relation(...)
}
```

---

## 🔐 Security Implementation

### Authentication Flow

| Component | Method | Details |
|-----------|--------|---------|
| **Web App** | Google OAuth | NextAuth.js handles the entire flow |
| **Extension** | JWT Tokens | 30-day expiry, stored in chrome.storage |
| **API** | Bearer Token | Validated on every request |

### Token Generation (Extension)

```typescript
// Extension requests token using existing session
const response = await fetch('/api/extension/token', {
  credentials: 'include'  // Sends session cookie
});

const { token, expiresAt } = await response.json();

// Token payload
{
  userId: "cuid_xxx",
  email: "student@mail.com",
  name: "Student Name",
  aud: "extension",
  iss: "semesterhub",
  exp: 1234567890  // 30 days
}
```

### API Protection

```typescript
// Rate limiting: 10 requests per minute per user
const rateLimiter = new RateLimiter({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500
});

// CORS whitelist
const allowedOrigins = [
  'chrome-extension://*',
  'moz-extension://*',
  'https://semester-dash.vercel.app'
];
```

---

## 📁 Project Structure

```
semester-dash/
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/
│   │   │   ├── extension/        # Token endpoints
│   │   │   │   ├── token/        # GET - Generate JWT
│   │   │   │   └── verify/       # GET - Validate JWT
│   │   │   ├── sync/
│   │   │   │   └── moodle/       # POST - Sync data
│   │   │   ├── courses/          # CRUD
│   │   │   ├── assignments/      # CRUD
│   │   │   └── semesters/        # CRUD
│   │   │
│   │   ├── dashboard/            # Protected pages
│   │   │   ├── page.tsx          # Main dashboard
│   │   │   ├── assignments/      # Assignment views
│   │   │   ├── calendar/         # Calendar view
│   │   │   ├── courses/          # Course management
│   │   │   └── semesters/        # Semester management
│   │   │
│   │   ├── login/                # Auth pages
│   │   └── onboarding/           # New user flow
│   │
│   ├── components/
│   │   ├── ui/                   # Base components
│   │   ├── assignments/          # Assignment components
│   │   ├── courses/              # Course components
│   │   └── layout/               # Navigation, sidebar
│   │
│   ├── lib/
│   │   ├── auth.ts               # NextAuth config
│   │   ├── prisma.ts             # Prisma client
│   │   └── rate-limit.ts         # Rate limiter
│   │
│   └── types/                    # TypeScript types
│
├── extension/                    # Browser Extension
│   ├── src/
│   │   ├── background/           # Service worker
│   │   │   └── index.ts
│   │   ├── content/              # Content scripts
│   │   │   ├── moodle.ts         # Moodle scraper
│   │   │   └── webapp.ts         # Dashboard integration
│   │   ├── popup/                # Extension popup
│   │   └── shared/               # Shared utilities
│   │       ├── api-client.ts     # API wrapper
│   │       └── token-manager.ts  # JWT handling
│   │
│   ├── manifest.json             # Extension manifest
│   └── vite.config.ts            # Build config
│
├── prisma/
│   └── schema.prisma             # Database schema
│
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or [Neon](https://neon.tech) account)
- Google Cloud Console project (for OAuth)

### 1. Clone & Install

```bash
git clone https://github.com/Noammandelbaum/semester-dash.git
cd semester-dash
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"

# JWT
JWT_SECRET="your-jwt-secret"
```

### 3. Database Setup

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
# Open http://localhost:3000
```

### 5. Build Extension

```bash
cd extension
npm install
npm run build
```

Then load `extension/dist/` as unpacked extension in Chrome.

---

## 🤖 Built with AI

This entire project was developed using **Claude Code** - an AI-assisted development workflow.

From database schema design to browser extension architecture, every component was built collaboratively with AI agents. This approach enabled:

- **Rapid prototyping** – Ideas to working code in hours, not days
- **Consistent code quality** – AI maintains patterns across the codebase
- **Complex problem solving** – JWT auth, content scripts, real-time sync
- **Learning acceleration** – Understanding new technologies faster

**The future of development isn't AI replacing developers – it's developers and AI building together.**

---

## 📚 What I Learned

### Technical Skills

- **Browser Extension Development** – Manifest v3, content scripts, service workers, chrome.storage API
- **Authentication Complexity** – OAuth flows, JWT tokens, secure token storage
- **Full-Stack TypeScript** – End-to-end type safety from database to UI
- **Real-time Sync** – Designing reliable data synchronization between systems

### Software Engineering

- **API Design** – RESTful endpoints with proper error handling and rate limiting
- **Security First** – CORS, token validation, input sanitization
- **Database Design** – Normalized schemas, efficient queries, proper indexing
- **Developer Experience** – Clear project structure, comprehensive types

### Key Insight

<div align="center">
<h3>
<strong>"The best tools are the ones that solve your own problems first."</strong>
</h3>
</div>

I built SemesterHub because I needed it. That personal investment drove every feature decision and kept the scope focused on what actually matters to students.

---

## 📬 Contact

<div align="center">

[![Email](https://img.shields.io/badge/Email-noam.mandelbaum@gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:noam.mandelbaum@gmail.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Noam_Mandelbaum-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/noam-mandelbaum-9443471b9/)
[![GitHub](https://img.shields.io/badge/GitHub-Noammandelbaum-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Noammandelbaum)

</div>

---

<div align="center">

**Built with precision, synced with reliability, designed for students.**

*Turning Moodle chaos into academic clarity*

</div>
