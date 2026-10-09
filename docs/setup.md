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

Set `DATABASE_URL` to `file:./dev.db`, then set the application secret and
owner credentials in `.env`.

Generate a secret:

```bash
openssl rand -base64 32
```

## 3. Database

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

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

The app emails the customer an order confirmation and sends your support inbox
an order summary. In the Google Account for `ministreet.support@gmail.com`:

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
