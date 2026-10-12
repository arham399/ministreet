# Mini Street — Production Deployment

## Database

The active Prisma schema is PostgreSQL in `prisma/postgresql/schema.prisma` and is configured for Supabase. The default database, install, and build scripts use this schema. Set these environment variables in `.env` locally and in your deployment environment:

- `DATABASE_URL`: Supabase transaction pooler URL (port 6543) for application traffic.
- `DIRECT_URL`: Supabase session pooler URL (port 5432) for Prisma migrations.

Keep database credentials private and out of source control. The root `prisma/schema.prisma` and root migration history are retained only as a legacy SQLite reference. The active PostgreSQL schema uses its own migrations under `prisma/postgresql/migrations`.

Generate the client and apply committed PostgreSQL migrations with:

```bash
npm run db:generate
npm run db:migrate:deploy
```

Existing rows in the local SQLite database are not copied automatically. Back
up and migrate any data that must be retained before switching a live store to
Supabase.

To transfer the current `prisma/dev.db`, first apply the PostgreSQL migrations,
review the transfer counts with a dry run, then perform the import:

```bash
npm run db:migrate:deploy
npm run db:transfer:local -- --dry-run
npm run db:transfer:local
```

The import refuses to write if any application table in Supabase is non-empty,
and wraps the copy in a transaction. It does not modify the SQLite source file.
To import a different SQLite file, set `LOCAL_SQLITE_DATABASE_URL` to its
`file:` URL before running the command.

Do not run `db:seed` against production unless you have reviewed the seed data and intend to insert it. Configure the application environment with `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `ORDER_NOTIFICATION_EMAIL`, and `CLOUDINARY_*` as needed.

## Other services

- **Product images:** Cloudinary
- **Payment-proof uploads:** not enabled yet; implement them with a private Supabase Storage bucket and server-side access controls
- **Email:** Gmail SMTP using a Google App Password

## Post-deploy checklist

- [ ] Homepage loads with logo
- [ ] Shop / product pages work
- [ ] Cart → checkout → order creates in the database
- [ ] Inventory decrements
- [ ] Tracking page shows timeline
- [ ] Admin can view and update orders
- [ ] Customer confirmations and order notifications send (when Gmail SMTP is configured)
- [ ] HTTPS + custom domain
