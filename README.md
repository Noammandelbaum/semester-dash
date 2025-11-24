# SemesterDash 📚

> **One view to see everything and know what to do next.**

SemesterDash is a student semester management dashboard that helps students track their courses, tasks (lectures, assignments, labs), and progress throughout the semester.

## Features

- 🔐 **Google OAuth** - Sign in with your Google account
- 📊 **Dashboard** - See all your courses and tasks at a glance
- 📝 **Task Management** - Track lectures, assignments, labs, and exams
- 📈 **Progress Tracking** - Visualize your semester progress
- 🌐 **Hebrew RTL Support** - Built for Hebrew-speaking students

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org/) | React framework with App Router |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS 4](https://tailwindcss.com/) | Styling |
| [PostgreSQL](https://www.postgresql.org/) | Database (via [Neon](https://neon.tech/)) |
| [Prisma 7](https://www.prisma.io/) | ORM |
| [NextAuth.js v5](https://authjs.dev/) | Authentication |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or use [Neon](https://neon.tech/) free tier)
- Google OAuth credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Noammandelbaum/semester-dash.git
cd semester-dash
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. Push the database schema:
```bash
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Auth
AUTH_SECRET=your-secret
AUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Project Structure

```
semester-dash/
├── docs/                  # Documentation
│   ├── DESIGN_SYSTEM.md  # UI/UX guidelines
│   ├── ROADMAP.md        # Product roadmap
│   └── LOCALIZATION.md   # Translations
├── prisma/               # Database schema
├── src/
│   ├── app/             # Next.js pages & API
│   ├── components/      # React components
│   ├── lib/             # Utilities
│   └── types/           # TypeScript definitions
└── CLAUDE.md            # AI development context
```

## Roadmap

- **Phase 1 (Alpha)**: Manual course and task management
- **Phase 2 (Beta)**: Moodle integration, automation
- **Phase 3 (GA)**: Multi-university support, analytics

See [docs/ROADMAP.md](docs/ROADMAP.md) for details.

## Contributing

This project is currently in early development. Contributions are welcome!

## License

Private - All rights reserved.

---

Built with ❤️ for students
