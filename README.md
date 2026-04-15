# AI Notes App

Phase 2 implementation for an AI Notes App built with Next.js 15, TypeScript, Tailwind CSS, Prisma, and SQLite.

## Included in Phase 2

- Next.js 15 App Router project structure
- TypeScript configuration
- Tailwind CSS setup
- Prisma schema for notebooks, notes, and tags
- SQLite datasource configuration
- Prisma seed script with starter data
- Real 3-panel notes workspace with CRUD, filtering, and autosave

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite

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

## Database Notes

- SQLite database path is configured through `DATABASE_URL` in `.env`
- The default database file will be `prisma/dev.db`
- Prisma schema lives in `prisma/schema.prisma`

## Phase 2 Features

- notebook CRUD
- note CRUD
- tag editing
- search across title and content
- notebook filtering
- selected note editor with autosave
- loading, error, and empty states

## Suggested Local Setup Flow

```bash
npm install
npm run prisma:generate
npm run db:push
npm run db:seed
npm run dev
```
