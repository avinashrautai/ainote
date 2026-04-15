# AI Notes App

A premium AI Notes App built with Next.js 15, TypeScript, Tailwind CSS, Prisma, and SQLite.

## Included

- Next.js 15 App Router project structure
- TypeScript configuration
- Tailwind CSS setup
- Prisma schema for notebooks and notes
- SQLite datasource configuration
- Prisma seed script with starter data
- Notes workspace with CRUD, filtering, autosave, import/export, and installable PWA support

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite
- Progressive Web App support

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Generate the Prisma client:

```bash
npm run prisma:generate
```

3. Create the SQLite database schema:

```bash
npm run db:push
```

4. Seed the database:

```bash
npm run db:seed
```

5. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## PWA Usage

- Build and run the app in production mode to test installability:

```bash
npm run build
npm run start
```

- Visit the app in a Chromium-based browser and use the install prompt from the browser UI.
- On mobile, open the production deployment in a supported browser and choose the install or add-to-home-screen option.
- The app includes a web app manifest, install icons, and a production service worker for basic offline shell support.
- Offline mode is intentionally lightweight: the app shell and previously visited pages can load without a network, but live database-backed changes still require connectivity.

## Database Notes

- SQLite database path is configured through `DATABASE_URL` in `.env`
- The default database file will be `prisma/dev.db`
- Prisma schema lives in `prisma/schema.prisma`

## Suggested Local Setup Flow

```bash
npm install
npm run prisma:generate
npm run db:push
npm run db:seed
npm run dev
```
