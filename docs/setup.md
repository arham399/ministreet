# Mini Street — Local Setup

## 1. Clone & install

```bash
cd mini-street
npm install
```

## 2. Environment

```bash
cp .env.example .env
```

Set `DATABASE_URL` to the Supabase transaction-pooler URL (port 6543)
and `DIRECT_URL` to the session-pooler URL (port 5432). Also set the
application secret and owner credentials in `.env`.

The app uses Drizzle ORM with Supabase PostgreSQL; it does not use Supabase Auth.
Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from your Supabase project
for secure payment-proof uploads. Keep the service-role key server-side; never
prefix it with `NEXT_PUBLIC_` or commit it. A migration creates the private
`payment-proofs` bucket. The admin page uses expiring signed links to view proofs.

Generate a secret:

```bash
openssl rand -base64 32
```

## 3. Database

For an existing Supabase database whose application tables are already present,
record the Drizzle baseline once, then use Drizzle migrations:

```bash
npm run db:drizzle:migrate:mark-existing
npm run db:migrate
```

For a new, empty Supabase database, apply the checked-in baseline with
`npm run db:migrate`. Seed sample data only when it is intended:
`npm run db:seed`.

## 4. Develop

```bash
npm run dev
```

- Storefront: http://localhost:3000
- Admin login: http://localhost:3000/admin/login

## 5. Optional services

- **Order emails:** set up Gmail SMTP as described below.
- **Images:** set Cloudinary vars; until then local `/public` placeholders are used

### Gmail order notifications

The app emails the customer an order-received/payment-review message and sends
your support inbox an order summary with an admin link. Payment proofs are not
attached to emails. In the Google Account for `ministreet.support@gmail.com`:

1. Enable 2-Step Verification.
2. Create an App Password in your Google Account's App passwords settings.
3. Put the credentials in `.env`:

```env
GMAIL_USER="ministreet.support@gmail.com"
GMAIL_APP_PASSWORD="your-16-character-google-app-password"
ORDER_NOTIFICATION_EMAIL="ministreet.support@gmail.com"
```

Use the App Password, not your normal Gmail password. Keep it private. Restart
the development server after changing `.env`. Order emails are sent after the
order is saved; an email failure does not cancel the order and is recorded in
the Email Log.
