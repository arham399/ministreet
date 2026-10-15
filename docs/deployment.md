# Mini Street — Production Deployment

## Database

The application uses Drizzle ORM with Supabase PostgreSQL. Configure these
environment variables locally and in the deployment environment:

- `DATABASE_URL`: Supabase transaction pooler URL for application traffic.
- `DIRECT_URL`: Supabase session/direct pooler URL for Drizzle migrations and
  schema introspection.

The app's runtime reads and writes, including Auth.js, catalog, checkout,
orders, and admin operations, use Drizzle. Legacy ORM code, dependencies, and
install hooks have been removed. Local SQLite backups, if present, are archived
only and are not read by the app.

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

Administrators with settings permission can edit the default delivery charge and
free-shipping minimum in **Admin → Settings**. The saved values are used in the
storefront announcement bar, cart, checkout, new order totals, and shipping
policy pages. Already-created orders retain the shipping amount recorded when
they were placed.

`npm run db:drizzle:schema` re-introspects the configured PostgreSQL database
and regenerates the Drizzle schema. Review the resulting changes before
committing. `npm run db:seed` inserts development sample data; do not run it
against production unless that data is intended.

Keep database credentials private and out of source control. Configure the
application environment with `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `GMAIL_USER`,
`GMAIL_APP_PASSWORD`, `ORDER_NOTIFICATION_EMAIL`, `CONTACT_FORM_NOTIFICATION_EMAIL`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, and `CLOUDINARY_*` as needed. The service-role key
is server-only and must never use a `NEXT_PUBLIC_` prefix.

## Other services

- **Product images:** Cloudinary
- **Payment-proof uploads:** private Supabase Storage bucket named
  `payment-proofs`; the migration creates/configures it as private and limits
  uploads to 5 MB JPEG, PNG, and WebP. Only server code accesses it with the
  service-role key. Admins see a five-minute signed link on the order detail
  page. Proofs are not attached to email.
- **Order retention:** admins may permanently delete only cancelled or delivered
  orders. The order, items, invoice, associated email logs, inventory movements,
  tracking history, and payment proof object are removed. A minimal audit entry
  is retained to record who performed the deletion. If Storage cleanup fails,
  the admin receives a notice to remove that object from the private bucket.
- **Category deletion:** removes the category and unassigns products from it;
  products and their shared Cloudinary images are retained.
- **Database exports:** Owner/Admin can download application data as Excel XML
  workbook (`.xls`) or PDF from Admin → Database exports. Authentication
  tokens, password hashes, and payment proof paths are excluded.
- **Email:** Gmail SMTP using a Google App Password

## Post-deploy checklist

- [ ] Homepage loads with logo
- [ ] Shop and product pages work
- [ ] Cart → checkout → order creates in the database
- [ ] Bank transfer proof uploads to the private bucket and appears in the admin order page
- [ ] Admin verifies a transfer before confirming or fulfilling a prepaid order
- [ ] Inventory decrements
- [ ] Tracking page shows timeline
- [ ] Admin can view and update orders
- [ ] Customer confirmations and order notifications send (when Gmail SMTP is configured)
- [ ] HTTPS and custom domain
