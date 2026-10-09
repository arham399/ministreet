# Mini Street — Production Deployment

## Database

The Prisma schema currently uses SQLite. Set `DATABASE_URL` to a SQLite file
such as `file:./dev.db`, then run migrations before starting the application:

```bash
npx prisma migrate deploy
```

SQLite requires persistent disk storage. Do not use an ephemeral/serverless
filesystem for production data; deploy to a host with a persistent volume and
back up the database file regularly. Switching to a hosted PostgreSQL service
requires changing the Prisma datasource and adapting/migrating the schema first.

## Other services

- **Images:** Cloudinary
- **Email:** Gmail SMTP using a Google App Password

## Steps

1. Choose a host with persistent disk storage for the SQLite database.
2. Push this repo to GitHub.
3. Set environment variables:
   - `DATABASE_URL`
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_URL` (your production URL)
   - `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `ORDER_NOTIFICATION_EMAIL`
   - `CLOUDINARY_*`
4. Run migrations before starting the application:

```bash
npx prisma migrate deploy && next build
```

5. Deploy.
6. Create the first OWNER account by running seed once with `OWNER_EMAIL` and `OWNER_PASSWORD` against the production database (or use a secure setup script).

## Post-deploy checklist

- [ ] Homepage loads with logo
- [ ] Shop / product pages work
- [ ] Cart → checkout → order creates in DB
- [ ] Inventory decrements
- [ ] Tracking page shows timeline
- [ ] Admin can view and update orders
- [ ] Customer confirmations and order notifications send (when Gmail SMTP is configured)
- [ ] HTTPS + custom domain
