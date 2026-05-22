# Budget App

Personal finance budgeting app with email/password auth, PostgreSQL, month-wise wallet budgets, and automatic rollover.

## Stack

- Next.js 15 (App Router)
- PostgreSQL via Neon + Prisma
- Email/password auth with secure HTTP-only session cookies

## Features

- Register and sign in with email/password
- Full catalog of Pakistani mobile wallets and banks (JazzCash, Easypaisa, NayaPay, HBL, UBL, Meezan, and more)
- Month-wise budgets across multiple wallets with rollover
- Category budgets with partial spending support
- Wallet balances: opening + added - spent
- Automatic rollover of unused wallet balances into the next month
- Toggle rollover on/off per month in Settings

## Setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Apply database migrations:

```bash
npm run db:migrate:deploy
```

For local development when changing the schema:

```bash
npm run db:migrate
```

4. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and start logging transactions.

## Key routes

- `/register` — create account
- `/login` — sign in
- `/dashboard` — monthly overview
- `/wallets` — wallet balances and category progress
- `/transactions/new` — log spending
- `/settings` — rollover toggle

## Rollover behavior

When a new month is opened:

1. Remaining wallet balance = opening balance + added amount - spent
2. That remaining amount becomes the next month's opening balance
3. Category budget amounts copy forward from the previous month

If rollover is disabled for a month, the following month starts with zero opening balances (you can still add funds manually).
