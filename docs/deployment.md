# Mini Street — Production Deployment

## Database

The production Prisma schema is PostgreSQL in `prisma/postgresql/schema.prisma` and is configured for Supabase. Set these environment variables in `.env` locally and in your deployment environment:

- `DATABASE_URL`: Supabase transaction pooler URL (port 6543) for application traffic.
- `DIRECT_URL`: Supabase session pooler URL (port 5432) for Prisma migrations.

Keep database credentials private and out of source control. The root `prisma/schema.prisma` and root migration history are retained for the original SQLite development setup; production scripts use the PostgreSQL schema and its own migrations under `prisma/postgresql/migrations`.

Generate the client and apply committed PostgreSQL migrations with:

```bash
npm run db:generate
npm run db:migrate:deploy
```

Do not run `db:seed` against production unless you have reviewed the seed data and intend to insert it. Configure the application environment with `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `ORDER_NOTIFICATION_EMAIL`, and `CLOUDINARY_*` as needed.

## Other services

- **Images:** Cloudinary
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
