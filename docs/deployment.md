# Mini Street — Production Deployment

## Database

The application uses Drizzle ORM with Supabase PostgreSQL. Configure these
environment variables locally and in the deployment environment:

- `DATABASE_URL`: Supabase transaction pooler URL for application traffic.
- `DIRECT_URL`: Supabase session/direct pooler URL for Drizzle migrations and
  schema introspection.

The app's runtime reads and writes, including Auth.js, catalog, checkout,
orders, and admin operations, use Drizzle. Prisma is no longer an application
runtime dependency. The Prisma schemas and migrations remain in the repository
as a legacy reference and for the optional local SQLite-to-PostgreSQL transfer
utility; they are not used by the deployed app.
The install hook generates those legacy clients solely for the optional transfer
utility and type-checking its source; application routes do not import them.

The current Supabase schema was initialized and the local SQLite records were
transferred and row-count verified. Do not rerun the transfer against the
populated database. Record the existing schema as the Drizzle baseline exactly
once, then use the normal Drizzle migration command:

```bash
npm run db:drizzle:migrate:mark-existing
npm run db:migrate
```

The marker checks that the expected 31-table schema exists and records only
Drizzle migration history; it does not change application tables or data. For a
new empty PostgreSQL database, skip the marker and run `npm run db:migrate` to
apply the baseline migration. Use `npm run db:generate` after changing the
Drizzle schema to create a migration, and review its SQL before applying it.

Useful commands:

```bash
npm run db:drizzle:check
npm run db:drizzle:catalog-check
npm run db:generate
npm run db:migrate
npm run db:studio
npm run typecheck
npm test
```

`npm run db:drizzle:schema` re-introspects the configured PostgreSQL database
and regenerates the Drizzle schema. Review the resulting changes before
committing. `npm run db:seed` inserts development sample data; do not run it
against production unless that data is intended.

The optional `npm run db:transfer:local` utility imports data from the retained
SQLite database. It refuses to write when application tables at the destination
are non-empty, wraps the import in a transaction, verifies per-table row
counts, and does not modify the SQLite source. Use `-- --dry-run` to review a
transfer first. To choose another SQLite file, set
`LOCAL_SQLITE_DATABASE_URL` to its `file:` URL. The transfer utility needs the
legacy Prisma CLI/client to inspect the two historical Prisma schemas.

Keep database credentials private and out of source control. Configure the
application environment with `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `GMAIL_USER`,
`GMAIL_APP_PASSWORD`, `ORDER_NOTIFICATION_EMAIL`, and `CLOUDINARY_*` as needed.

## Other services

- **Product images:** Cloudinary
- **Payment-proof uploads:** not enabled; use a private Supabase Storage bucket
  with server-side access controls if implementing this feature
- **Email:** Gmail SMTP using a Google App Password

## Post-deploy checklist

- [ ] Homepage loads with logo
- [ ] Shop and product pages work
- [ ] Cart → checkout → order creates in the database
- [ ] Inventory decrements
- [ ] Tracking page shows timeline
- [ ] Admin can view and update orders
- [ ] Customer confirmations and order notifications send (when Gmail SMTP is configured)
- [ ] HTTPS and custom domain
