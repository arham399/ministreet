# Mini Street — Adorably Enchanting Treasures

Production e-commerce website and admin panel for **Mini Street**.

> Brand: Mini Street · Tagline: Adorably Enchanting Treasures · Instagram: [@mini_street.co](https://instagram.com/mini_street.co)

Built to the full AGENT.md production specification.

---

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS 4
- **Supabase PostgreSQL** + Prisma ORM
- **Auth.js (NextAuth v5)** — credentials, JWT, roles
- **Zod** validation · **Zustand** cart/wishlist · **Recharts** analytics
- **Gmail SMTP** order and newsletter emails · **Cloudinary** images · PDF invoices

---

## Quick start

```bash
cd mini-street
cp .env.example .env
# Set DATABASE_URL, DIRECT_URL, AUTH_SECRET, OWNER_EMAIL, OWNER_PASSWORD

npm install
npm run db:generate
npm run db:migrate:deploy
# Optional: seed development/sample data only after reviewing prisma/seed.ts
npm run dev
```

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Storefront |
| http://localhost:3000/admin | Admin (OWNER from seed) |
| http://localhost:3000/login | Customer login |

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

---

## Features

### Customer
- Homepage, shop (filters/sort), categories, product detail
- Cart + coupons + checkout (COD) with server-side price integrity
- Order success, tracking timeline
- Wishlist (guest local + logged-in server sync API)
- Optional accounts: register, login, orders, profile
- Password reset via email token
- Contact form → DB, newsletter signup, FAQ, policies

### Admin
- Role-based access (OWNER, ADMIN, ORDER_MANAGER, INVENTORY_MANAGER, SUPPORT)
- Dashboard + analytics charts (revenue, status, categories, top products)
- Product CRUD + image upload (Cloudinary or URL)
- Categories, inventory
- Orders + status transitions + tracking events + stock restore on cancel
- Coupons, discounts, offers CRUD
- Customers (registered + guests)
- Newsletter campaigns and subscriber management (OWNER/ADMIN only; live preview, custom CTA links, active subscriber delivery, and unsubscribe links)
- Reviews moderation
- Invoices (HTML + PDF download)
- Email log, users & roles, settings
- Audit log on key actions

### Backend integrity
- Transactional order creation
- Prices recalculated from DB (never trust client)
- Inventory decrement + movement log
- Price snapshots on order items
- Human order IDs: `MS-2026-000001`

---

## Environment

See `.env.example`:

| Variable | Required |
|----------|----------|
| `DATABASE_URL` / `DIRECT_URL` | Yes |
| `AUTH_SECRET` | Yes |
| `NEXT_PUBLIC_APP_URL` | Yes |
| `OWNER_EMAIL` / `OWNER_PASSWORD` | For seed owner; `OWNER_EMAIL` also receives newsletter notifications if `ORDER_NOTIFICATION_EMAIL` is unset |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | For customer and order emails |
| `ORDER_NOTIFICATION_EMAIL` | Inbox for new-order notifications |
| `CLOUDINARY_*` | For image uploads |

---

## Production deployment

Production uses Supabase PostgreSQL. Configure both Supabase connection URLs,
then run the PostgreSQL migrations before deploying. Do not ship demo customer data.

See `docs/deployment.md` and `docs/setup.md`.

---

## Scripts

```bash
npm run dev
npm run build
npm run db:migrate
npm run db:seed
npm run db:studio
npm run typecheck
npm run test
```

The default Prisma commands use the Supabase PostgreSQL schema at
`prisma/postgresql/schema.prisma`. Configure `DATABASE_URL` and `DIRECT_URL`
before generating the client or running migrations. The root SQLite schema and
migrations are retained only as a legacy local-data reference.
