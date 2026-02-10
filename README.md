# MyFinance Family

Local-first family finance manager built with Next.js, Drizzle ORM, and SQLite. Import AIB-style PDF statements, review extracted transactions, and track monthly budgets.

## Features
- Accounts, categories, and transactions stored locally in SQLite
- PDF import with AIB-style parsing and review flow
- Auto-categorization and transfer detection
- Dashboard with net worth and monthly summary
- Budget page with editable fixed cost targets

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Apply the database schema

```bash
npx drizzle-kit push
```

3. Seed defaults

```bash
npm run db:seed
```

4. Run the app

```bash
npm run dev -- -p 3001
```

Open `http://localhost:3001`.

## Import Flow
1. Go to **Import**.
2. Select an account and upload an AIB PDF statement.
3. Review the extracted transactions and adjust fields.
4. Click **Confirm import** to save (deduped by hash).

## Parser Test

A sample AIB statement fixture and parser test are included.

```bash
npm run test
```

## Notes
- The parser uses text extraction (`pdf-parse`) and line heuristics. If a PDF renders differently, you may need to tune the rules in `src/lib/aibParser.ts`.
- Auto-categorization keywords live in `src/lib/categorize.ts`.
- Budget targets are stored per month in the `budget_item` table.
