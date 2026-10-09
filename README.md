# Mini Street — Adorably Enchanting Treasures

Production e-commerce website and admin panel for **Mini Street**.

> Brand: Mini Street · Tagline: Adorably Enchanting Treasures · Instagram: [@mini_street.co](https://instagram.com/mini_street.co)

Built to the full AGENT.md production specification.

---

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS 4
- **SQLite** + Prisma ORM
- **Auth.js (NextAuth v5)** — credentials, JWT, roles
- **Zod** validation · **Zustand** cart/wishlist · **Recharts** analytics
- **Gmail SMTP** order emails · **Cloudinary** images · PDF invoices

---

## Quick start

```bash
cd mini-street
cp .env.example .env
# Edit DATABASE_URL (SQLite file), AUTH_SECRET, OWNER_EMAIL, OWNER_PASSWORD

npm install
npm run db:generate
npm run db:migrate
npm run db:seed
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
- Contact form → DB, newsletter, FAQ, policies

### Admin
- Role-based access (OWNER, ADMIN, ORDER_MANAGER, INVENTORY_MANAGER, SUPPORT)
- Dashboard + analytics charts (revenue, status, categories, top products)
- Product CRUD + image upload (Cloudinary or URL)
- Categories, inventory
- Orders + status transitions + tracking events + stock restore on cancel
- Coupons, discounts, offers CRUD
- Customers (registered + guests)
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
| `DATABASE_URL` | Yes |
| `AUTH_SECRET` | Yes |
| `NEXT_PUBLIC_APP_URL` | Yes |
| `OWNER_EMAIL` / `OWNER_PASSWORD` | For seed owner |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | For customer and order emails |
| `ORDER_NOTIFICATION_EMAIL` | Inbox for new-order notifications |
| `CLOUDINARY_*` | For image uploads |

---

## Production deployment

SQLite needs a persistent filesystem. Deploy to a host with a persistent
volume; serverless platforms with ephemeral filesystems are not suitable for
this SQLite database. Configure `DATABASE_URL` to point at the database file,
run migrations, and seed the owner once. Do not ship demo customer data.

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
