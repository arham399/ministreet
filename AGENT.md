# MINI STREET — PRODUCTION E-COMMERCE MASTER AGENT SPECIFICATION

> **Purpose:** This file is the single source of truth for an AI coding agent building the Mini Street production-ready e-commerce website and owner admin panel.
>
> **Brand:** Mini Street  
> **Tagline:** Adorably Enchanting Treasures  
> **Business:** Women's/girls' jewelry and fashion accessories  
> **Social:** Instagram `@mini_street.co`  
> **Reference logo:** The Mini Street logo supplied with this project/chat. Use it as the primary visual identity reference.

---

# 0. AGENT OPERATING RULES

You are acting as a **senior product designer, UX designer, frontend engineer, backend engineer, database architect, security engineer, QA engineer, and DevOps engineer**.

Build this as a real production application, not a demo, mockup, template, or static portfolio.

## Non-negotiable rules

1. **Do not create fake functionality.**
   - Buttons must work.
   - Forms must submit.
   - Cart calculations must be real.
   - Orders must persist.
   - Inventory must update safely.
   - Tracking status must persist.
   - Analytics must be calculated from database data.
   - PDFs must be generated from actual orders.
   - Emails must use real templates/providers once credentials are configured.

2. **Do not hard-code products, orders, sales, analytics, categories, or customer information.**
   All business data must come from the database.

3. **Do not use localStorage as the primary database.**
   It may be used only for suitable client-side convenience such as guest cart persistence.

4. **Do not expose secrets to the browser.**
   API keys, database credentials, email credentials, auth secrets, etc. must remain server-side.

5. **Do not build an insecure hidden admin route.**
   Admin authorization must be enforced server-side.

6. **Do not copy SHEIN/TEMU branding or exact UI.**
   Take inspiration from their information architecture, shopping convenience, filtering, product discovery, and checkout quality, but create an original Mini Street visual identity.

7. **Do not overuse animation.**
   Animations should feel premium, smooth, feminine, and intentional.

8. **Do not use poor placeholder UI in the final implementation.**
   During development, placeholders are acceptable, but the production UI must have polished empty states, loading states, error states, and responsive layouts.

9. **Do not destroy existing project functionality if this specification is being applied to an existing project.**
   Inspect the existing project first and preserve compatible code/data.

10. **Before declaring the project complete, test the critical customer and admin journeys end-to-end.**

---

# 1. PRODUCT VISION

Mini Street is a feminine jewelry and accessories brand selling:

- Handcuffs
- Earrings
- Watches
- Bracelets
- Necklaces
- Rings
- Handchains
- Combo Sets

The website should feel like a **premium modern online boutique**.

The desired emotional response:

> Cute, elegant, trustworthy, exciting, polished, feminine, premium.

Avoid making it look childish.

The visual language should combine:

- The pink/magenta color from the logo
- Warm cream/off-white backgrounds
- Pastel accents
- Subtle teal/green inspired by the rainbow
- Soft gold/yellow accents
- Rounded cards
- Fine borders
- Editorial whitespace
- High-quality product photography
- Elegant typography
- Small sparkle details
- Smooth micro-interactions

The brand's logo contains a rainbow and clouds. Use those motifs subtly rather than repeating large rainbows everywhere.

---

# 2. PRIMARY TECHNOLOGY STACK

Use the following architecture unless the existing project has a strong reason to use an equivalent:

## Frontend

- Next.js
- App Router
- TypeScript
- React
- Tailwind CSS
- shadcn/ui where appropriate
- Framer Motion for animations
- Lucide icons

## Backend

Use Next.js for the backend as requested:

- Route Handlers
- Server Actions where appropriate
- Server Components by default
- Server-side validation
- Secure server-side database operations

## Database

Preferred:

- PostgreSQL
- Prisma ORM

Design the database for production scalability.

## Validation

- Zod

## Authentication

Use a secure production authentication approach such as Auth.js/NextAuth or another well-maintained equivalent.

Admin authentication must include:

- Secure password hashing
- Session handling
- Protected routes
- Role-based authorization
- Login rate limiting
- Secure cookies
- Server-side authorization checks

## File/image storage

Prefer:

- Cloudinary, S3-compatible storage, or UploadThing

Do not store large image binaries directly in PostgreSQL.

## Email

Email architecture:

- SMTP-compatible provider (currently Gmail SMTP)
- React Email or equivalent reusable templates

## PDF invoices

Generate actual printable/downloadable PDFs server-side.

## Deployment

The architecture should be deployment-friendly for:

- Vercel
- PostgreSQL provider
- Cloud image storage
- Transactional email provider

---

# 3. BRAND DESIGN SYSTEM

## Primary colors

Use CSS variables so the brand can be changed centrally.

Suggested starting palette:

- Brand Pink/Magenta: `#D91B83` or a visually matched logo pink
- Deep Pink: `#B80F69`
- Soft Pink: `#F8DCEB`
- Blush: `#FCECF3`
- Warm Cream: `#FFF8F2`
- Soft Teal: `#59B8AE`
- Soft Gold: `#E7C66A`
- Charcoal: `#252126`
- Muted Text: `#746B72`
- White: `#FFFFFF`
- Border: `#EDE4E8`
- Success: a restrained green
- Warning: a restrained amber
- Error: a restrained red

IMPORTANT:
Before finalizing colors, inspect the supplied Mini Street logo and visually tune the palette to it.

## Typography

Use a premium combination such as:

- Elegant display serif for selected headings
- Modern clean sans-serif for UI/body

Do not use excessive decorative fonts.

Typography should feel similar to a modern fashion/lifestyle brand.

## Radius

Use a consistent radius system:

- Small: 8px
- Medium: 12px
- Large: 18px
- Extra large: 24px

Buttons can be rounded, but avoid making every element pill-shaped.

## Shadows

Use subtle soft shadows.

Never use heavy generic dashboard shadows.

---

# 4. GLOBAL UX PRINCIPLES

Every page must have:

- Responsive desktop/tablet/mobile design
- Keyboard accessibility
- Visible focus states
- Good contrast
- Loading states
- Error states
- Empty states
- Skeleton states where appropriate
- Proper hover states on desktop
- Touch-friendly controls on mobile
- Meaningful aria labels
- Semantic HTML

Use progressive disclosure rather than overwhelming customers.

The mobile experience is extremely important because many customers will arrive from Instagram/Facebook.

---

# 5. GLOBAL WEBSITE HEADER

Desktop header:

1. Announcement bar
2. Main navigation
3. Search
4. Wishlist
5. Cart
6. Customer/account entry if accounts are enabled

Suggested structure:

MINI STREET logo | Shop | Categories | New Arrivals | Best Sellers | Offers | Search | Wishlist | Cart

Announcement bar should be configurable from admin.

Examples:

- "✨ New treasures just arrived"
- "Free delivery on orders over Rs. X"
- "Limited-time offers available now"

Admin controls the announcement text and visibility.

Mobile header:

- Hamburger
- Logo
- Wishlist
- Cart

Search should be easily accessible.

---

# 6. GLOBAL FOOTER

Create a polished multi-column footer.

Columns:

### Shop
- All Products
- New Arrivals
- Best Sellers
- Offers
- Combo Sets

### Categories
- Handcuffs
- Earrings
- Watches
- Bracelets
- Necklaces
- Rings
- Handchains
- Combo Sets

### Customer Care
- Track Order
- Shipping
- Returns & Exchanges
- FAQs
- Contact

### About
- Our Story
- About Mini Street
- Instagram
- Facebook

### Newsletter

"Join the Mini Street Club"

Email input + subscribe button.

Footer bottom:

- Copyright
- Privacy Policy
- Terms
- Shipping Policy
- Returns Policy

---

# 7. ROUTE MAP

Create a clean route architecture.

## Customer routes

```text
/
 /shop
 /shop/[category]
 /product/[slug]
 /search
 /new-arrivals
 /best-sellers
 /offers
 /cart
 /checkout
 /order-success/[orderId]
 /track-order
 /track-order/[trackingId]
 /wishlist
 /about
 /contact
 /faq
 /shipping-policy
 /return-policy
 /privacy-policy
 /terms
```

## Authentication

```text
/login
/register
/forgot-password
/reset-password
/account
/account/orders
/account/orders/[id]
/account/profile
```

Customer accounts may be optional for checkout.

## Admin

```text
/admin/login
/admin
/admin/products
/admin/products/new
/admin/products/[id]
/admin/categories
/admin/orders
/admin/orders/[id]
/admin/customers
/admin/inventory
/admin/discounts
/admin/coupons
/admin/offers
/admin/reviews
/admin/analytics
/admin/invoices
/admin/emails
/admin/settings
/admin/users
```

---

# 8. HOMEPAGE — DETAILED DESIGN SPECIFICATION

The homepage must feel like a real established jewelry brand.

## Section 1 — Announcement bar

Small, elegant, centered.

Example:

"✨ Adorably enchanting treasures, made to sparkle with you."

Allow admin to change this.

---

## Section 2 — Navigation

Use the global header.

On scroll:

- Header becomes slightly compact
- Subtle backdrop blur
- Thin bottom border
- Smooth transition

Do not make it excessively sticky or intrusive.

---

## Section 3 — Hero

This is the main visual section.

### Layout

Desktop:

- Large editorial hero image on one side or full-width visual
- Text content layered or beside it
- CTA buttons
- Small decorative sparkle/rainbow details

Suggested copy:

**ADORABLY ENCHANTING TREASURES**

"Little details. Beautiful moments. Jewelry and accessories chosen to make every look feel a little more special."

Buttons:

- SHOP COLLECTION
- EXPLORE NEW ARRIVALS

Hero should immediately communicate:

- Jewelry
- Feminine aesthetic
- Premium quality
- Brand personality

### Hero image direction

Use a premium editorial jewelry image, not a generic stock-photo look.

Prompt for image generation:

> "Luxury feminine jewelry editorial for a modern Pakistani/South Asian online boutique called Mini Street, delicate gold and silver jewelry arranged beautifully on a warm cream silk surface, soft blush pink accents, subtle pastel teal detail, tiny elegant sparkles, dreamy natural studio lighting, premium fashion e-commerce photography, sophisticated composition, clean negative space for website text, realistic product photography, high detail, warm cream background, no text, no logos, no watermark, vertical-to-landscape adaptable composition."

Create desktop and mobile crops from the same visual when possible.

Do NOT put text inside the generated image.

---

## Section 4 — Category discovery

Heading:

"SHOP BY CATEGORY"

Use large visual category cards.

Cards:

- Earrings
- Bracelets
- Necklaces
- Rings
- Watches
- Handchains
- Handcuffs
- Combo Sets

Each card includes:

- Image
- Category name
- Small "Explore" action

Hover:

- Slight image zoom
- Arrow movement
- Soft overlay

Mobile should become a horizontal swipe carousel or responsive grid.

---

## Section 5 — New arrivals

Heading:

"NEW ARRIVALS"

Subtitle:

"Meet the latest little treasures."

Product carousel/grid.

Product cards must include:

- Image
- Wishlist
- Product name
- Rating if available
- Price
- Original price
- Discount
- Stock state
- Add to cart
- Quick view on desktop if appropriate

Do not overcrowd the card.

---

## Section 6 — Promotional editorial banner

Create a premium full-width banner.

Example:

"YOUR EVERYDAY SPARKLE"

"Pieces made to complement every mood."

CTA: "SHOP JEWELRY"

Use a soft editorial image.

---

## Section 7 — Best sellers

Heading:

"LOVED BY MINI STREET GIRLS"

Show actual best sellers calculated from order data.

Do not hard-code "best sellers."

---

## Section 8 — Offers

Create an eye-catching but premium promotional section.

Heading:

"THE CUTEST DEALS ARE HERE"

Show active offers.

Optional countdown for time-limited campaigns.

Countdown must use actual offer start/end times.

---

## Section 9 — Why Mini Street

Four cards:

- Carefully Selected
- Beautiful Details
- Secure Packaging
- Made to Gift

Keep iconography elegant.

---

## Section 10 — Social/Instagram

Heading:

"FOLLOW OUR LITTLE STREET"

Handle:

@mini_street.co

Use real connected social content only if an integration is configured. Otherwise use curated brand images/placeholders without pretending they are live Instagram posts.

---

## Section 11 — Testimonials

Show customer reviews.

Only show actual approved reviews.

If no reviews exist, display a polished empty/brand statement rather than fake customer quotes.

---

## Section 12 — Newsletter

"JOIN THE MINI STREET CLUB"

"Be first to know about new arrivals, special offers and little surprises."

Email field + button.

---

# 9. SHOP PAGE

Purpose: product discovery.

Layout:

Desktop:

Sidebar filters + product grid.

Mobile:

Top filter/sort controls + filter drawer.

Filters:

- Category
- Price range
- Availability
- Discount
- Rating
- New arrivals
- Best sellers

Sort:

- Featured
- Newest
- Price low to high
- Price high to low
- Best selling
- Highest rated

Pagination or infinite loading must be implemented correctly.

URL query parameters should represent filters for shareability and SEO.

Example:

```text
/shop?category=bracelets&sort=price-low
```

---

# 10. CATEGORY PAGE

Every category should have:

- Category hero/banner
- Category title
- Description
- Product count
- Filters
- Sort
- Product grid
- Related categories

Examples:

```text
/ shop / bracelets
/ shop / earrings
/ shop / watches
```

Admin controls:

- Category name
- Slug
- Description
- Image
- SEO metadata
- Display order
- Active/inactive

---

# 11. PRODUCT CARD

Product card should be one of the most polished reusable components.

Structure:

```text
[Wishlist]
[Product image]

NEW / SALE / BESTSELLER badge

Product Name
★★★★★

Rs. 1,299
Rs. 1,599   19% OFF

[ADD TO CART]
```

On mobile:

- Keep the card compact
- Use touch-friendly controls
- Do not rely only on hover

If sold out:

- Image gets subtle treatment
- "SOLD OUT"
- Add-to-cart disabled
- Optional "Notify me"

---

# 12. PRODUCT DETAIL PAGE

Desktop:

Left:
- Image gallery
- Thumbnails
- Zoom

Right:
- Product title
- Rating
- Price
- Discount
- Stock status
- Quantity selector
- Add to cart
- Buy now
- Wishlist
- Delivery information
- Returns information

Below:

### Description
### Details
### Shipping
### Returns
### Reviews
### Related products
### Recently viewed

Product gallery should support:

- Multiple images
- Optional video
- Zoom
- Mobile swipe

Do not show broken images or layout shifts.

---

# 13. CART PAGE

Show:

- Products
- Image
- Name
- Quantity
- Unit price
- Discount
- Remove
- Save for later

Order summary:

- Subtotal
- Discount
- Coupon
- Shipping
- Total

Shipping threshold should be configurable.

Coupon field:

- Validate server-side
- Show meaningful errors
- Prevent expired/invalid coupon use

---

# 14. CHECKOUT PAGE

Checkout should be frictionless.

Sections:

### Contact
- Full name
- Email
- Phone

### Shipping
- Address
- City
- Province
- Postal code
- Optional delivery notes

### Payment
Initial production method:

- Cash on Delivery

Architecture must allow future:

- Card
- Easypaisa
- JazzCash
- Bank transfer
- Other gateways

### Order summary

Show final amount clearly.

Before order creation:

- Validate inventory
- Recalculate prices server-side
- Revalidate discounts
- Prevent client-side price manipulation

---

# 15. ORDER SUCCESS PAGE

Immediately after successful order:

Large confirmation state.

"ORDER PLACED SUCCESSFULLY 💗"

Show:

- Order ID
- Tracking ID
- Total
- Estimated delivery
- Customer email
- Main products

Buttons:

- TRACK ORDER
- CONTINUE SHOPPING
- DOWNLOAD INVOICE if available

---

# 16. ORDER TRACKING EXPERIENCE

This is a signature Mini Street feature.

Tracking page:

```text
TRACK YOUR ORDER

[ Enter Order / Tracking ID ]
[ Track Order ]
```

Result page:

### Header

"Your Mini Street order"

Tracking ID:

`MS-2026-000184`

### Timeline

1. Order Placed
2. Order Confirmed
3. Processing
4. Packed
5. Shipped
6. Out for Delivery
7. Delivered

Each event:

- Icon
- Date
- Time
- Status
- Description

Current state should have a subtle animated highlight.

Use Framer Motion carefully.

Example description:

"Your little treasures are packed and ready to leave us."

Admin controls the actual event history.

Never fabricate tracking events.

Optional fields:

- Courier
- Courier tracking number
- Estimated delivery
- Delivery notes

---

# 17. WISHLIST

Allow users to:

- Add/remove products
- Move to cart
- Remove all
- See sold-out state

Guests may use local persistence.

Logged-in users should have server persistence.

---

# 18. CUSTOMER ACCOUNT

Optional account creation.

Dashboard:

- Profile
- Orders
- Order details
- Saved addresses
- Wishlist
- Email preferences

Customer should NOT need an account to purchase.

---

# 19. ABOUT PAGE

Design as a brand story rather than a generic text page.

Sections:

- Hero
- Mini Street story
- Brand philosophy
- What we believe
- Product selection
- Packaging
- CTA to shop

Use editorial imagery.

Suggested heading:

"Little treasures. Big feelings."

Do not invent business history or claims. Use only information provided by the owner.

---

# 20. CONTACT PAGE

Include:

- Contact form
- Email
- Phone/WhatsApp if configured
- Social links
- Business hours if configured
- FAQ link

Contact form fields:

- Name
- Email
- Order number optional
- Subject
- Message

Protect against spam.

---

# 21. FAQ PAGE

Create categories:

### Orders
### Shipping
### Payments
### Returns
### Products
### Tracking

Admin must be able to add/edit/remove FAQs.

---

# 22. ADMIN PANEL — DESIGN PRINCIPLES

Admin is a professional business dashboard.

It must NOT look like the customer storefront.

Use:

- Clean sidebar
- Compact header
- Data tables
- Cards
- Charts
- Filters
- Search
- Drawers/modals
- Toast notifications
- Confirmation dialogs

Theme can subtly use Mini Street pink as an accent.

---

# 23. ADMIN SIDEBAR

```text
Mini Street Admin

Dashboard

CATALOG
Products
Categories
Inventory

SALES
Orders
Customers
Discounts
Coupons
Offers

ENGAGEMENT
Reviews
Emails

ANALYTICS
Sales Analytics
Product Analytics

DOCUMENTS
Invoices

SYSTEM
Users & Roles
Settings
```

Mobile admin should use a drawer.

---

# 24. ADMIN DASHBOARD

Top cards:

- Today's revenue
- Orders today
- Pending orders
- Products sold
- Low stock products

Charts:

### Revenue over time
### Orders over time
### Sales by category
### Order status distribution
### Top products

Date filters:

- Today
- 7 days
- 30 days
- Month
- Year
- Custom

All analytics must be database-driven.

---

# 25. ADMIN PRODUCT MANAGEMENT

Table columns:

- Product image
- Product
- SKU
- Category
- Price
- Sale price
- Stock
- Status
- Created
- Actions

Actions:

- View
- Edit
- Duplicate
- Archive
- Delete where safe

Bulk actions:

- Activate
- Deactivate
- Delete
- Change category
- Export

Do not permanently delete products that are referenced by historical orders unless the database design safely supports it. Prefer archival/soft deletion.

---

# 26. ADD PRODUCT PAGE

Fields:

### Basic
- Product name
- Slug
- SKU
- Description

### Pricing
- Price
- Sale price
- Cost price (admin-only if used)
- Tax configuration if needed

### Inventory
- Stock quantity
- Low-stock threshold
- Track inventory
- Allow backorder

### Category
- Category
- Tags

### Media
- Main image
- Additional images
- Optional product video

### Merchandising
- New arrival
- Featured
- Best seller should normally be computed, not manually claimed
- Badge

### SEO
- SEO title
- Meta description
- OG image

Include robust validation.

---

# 27. CATEGORY MANAGEMENT

Admin can:

- Create
- Edit
- Archive
- Reorder
- Upload category image
- Set description
- Set SEO metadata

Prevent deletion if products/orders depend on the category unless reassignment is handled.

---

# 28. INVENTORY

Inventory dashboard:

- Total stock
- Low stock
- Out of stock
- Inventory value if cost price exists

Product inventory row:

```text
Product
SKU
Current stock
Reserved stock
Available stock
Low-stock threshold
Status
```

When an order is created:

- Reserve/decrease inventory safely
- Prevent overselling under concurrent requests

When an order is cancelled/returned according to business rules:

- Restore stock where appropriate

---

# 29. ORDER ADMIN PAGE

Orders table:

- Order ID
- Date
- Customer
- Amount
- Payment
- Status
- Tracking
- Actions

Filters:

- Date
- Status
- Payment
- City
- Amount
- Customer
- Courier

Search:

- Order ID
- Tracking ID
- Name
- Phone
- Email

---

# 30. ORDER DETAIL ADMIN PAGE

Show:

### Customer
### Shipping
### Products
### Pricing
### Payment
### Timeline
### Tracking
### Internal notes
### Invoice

Actions:

- Confirm
- Process
- Pack
- Ship
- Out for delivery
- Deliver
- Cancel
- Return
- Refund

Status transitions must be validated.

Create tracking event when appropriate.

Admin can manually add a tracking event with:

- Status
- Date/time
- Description
- Optional courier information

---

# 31. DISCOUNTS / OFFERS

Admin should support:

### Product discount
### Category discount
### Store-wide discount
### Fixed amount
### Percentage
### Start/end time
### Minimum order
### Maximum discount
### Usage limit

Prevent overlapping promotions from producing unintended pricing.

Always calculate final pricing server-side.

---

# 32. COUPONS

Fields:

- Code
- Discount type
- Amount/percentage
- Minimum order
- Maximum discount
- Usage limit
- Per-customer limit
- Start date
- End date
- Active/inactive
- Eligible products/categories

Show usage analytics.

---

# 33. REVIEWS ADMIN

Statuses:

- Pending
- Approved
- Rejected

Admin can:

- Approve
- Reject
- Delete
- Feature

Never display unapproved reviews publicly.

---

# 34. CUSTOMER MANAGEMENT

Customer table:

- Name
- Email
- Phone
- Orders
- Total spent
- Last order
- Account status

Customer detail:

- Profile
- Order history
- Addresses
- Reviews
- Notes

Do not expose sensitive information unnecessarily.

---

# 35. ANALYTICS

Analytics should include:

### Revenue
### Orders
### Average order value
### Units sold
### Conversion-ready metrics if traffic analytics is connected
### Top products
### Top categories
### Discounts used
### Cancellation rate
### Return rate
### Customer repeat rate

Date filters must affect every relevant visualization.

Export:

- CSV
- PDF summary if practical

---

# 36. INVOICE SYSTEM

Create a professional invoice template using the Mini Street logo.

Invoice contains:

- Logo
- Store name
- Store contact
- Invoice number
- Order number
- Date
- Customer details
- Shipping details
- Product table
- Quantity
- Unit price
- Discount
- Shipping
- Total
- Payment method
- Footer note

Actions:

- Preview
- Print
- Download PDF
- Email invoice

Invoice numbers must be unique.

---

# 37. EMAIL SYSTEM

Create reusable branded email templates.

Templates:

1. Order received
2. Order confirmed
3. Order packed
4. Order shipped
5. Out for delivery
6. Delivered
7. Cancelled
8. Returned/refunded
9. Password reset
10. Contact form notification
11. Newsletter confirmation if used

Customer email:

Warm, concise, branded.

Admin email:

Operational and information-rich.

All email templates should be responsive.

---

# 38. EMAIL EXAMPLE

Subject:

`Your Mini Street order MS-2026-000184 is confirmed 💗`

Body:

- Mini Street logo
- Greeting
- Order summary
- Total
- Tracking button
- Support information
- Footer

Never put secrets in email URLs.

Use secure signed/tokenized links where required.

---

# 39. SEO

Implement:

- Metadata
- OpenGraph
- Twitter/X metadata where useful
- Canonical URLs
- Sitemap
- robots.txt
- Product structured data
- Breadcrumb structured data
- Organization/website structured data

Every product needs unique metadata.

Every category needs unique metadata.

Do not generate meaningless keyword spam.

---

# 40. PERFORMANCE

Target a high-quality Core Web Vitals result.

Use:

- Next.js Image
- Proper image sizing
- Lazy loading below the fold
- Server components where appropriate
- Minimized client JavaScript
- Efficient database queries
- Pagination
- Caching where safe
- Avoid unnecessary global state

Do not load large animation libraries unnecessarily.

---

# 41. ACCESSIBILITY

Target WCAG-minded implementation.

Ensure:

- Keyboard navigation
- Focus states
- Labels
- Accessible dialogs
- Accessible dropdowns
- Accessible buttons
- Alt text
- Good color contrast
- Reduced motion preference

If the user has `prefers-reduced-motion`, reduce decorative animations.

---

# 42. SECURITY

Implement:

- Secure authentication
- Server-side authorization
- Password hashing
- Zod validation
- Rate limiting
- Secure cookies
- CSRF protection where applicable
- Input sanitization
- SQL injection prevention via Prisma
- Safe file uploads
- Image validation
- Maximum upload size
- Admin audit logging
- Secure environment variables

Never expose:

- Database URL
- API keys
- Email secrets
- Auth secrets
- Payment secrets

to client components.

---

# 43. DATABASE MODEL REQUIREMENTS

Create normalized production-ready models approximately equivalent to:

```text
User
Role
Permission
Category
Product
ProductImage
ProductVariant (future-ready)
Inventory
InventoryMovement
Customer
Address
Order
OrderItem
OrderStatusHistory
TrackingEvent
Coupon
Discount
Offer
Review
Wishlist
WishlistItem
Invoice
EmailLog
NewsletterSubscriber
SiteSetting
AuditLog
```

Add timestamps to relevant records:

- createdAt
- updatedAt

Use IDs suitable for public exposure. Prefer opaque IDs/UUIDs where appropriate.

Order IDs should have a human-friendly public reference such as:

`MS-2026-000184`

Tracking IDs should be unique.

---

# 44. ORDER INTEGRITY

This is critical.

Order creation must be transactional.

When a customer clicks "Place Order":

1. Validate customer information.
2. Load products from database.
3. Verify products are active.
4. Verify inventory.
5. Recalculate prices.
6. Validate discount/coupon.
7. Calculate shipping.
8. Calculate final total.
9. Create order.
10. Create order items using price snapshots.
11. Update inventory safely.
12. Create initial tracking event.
13. Create invoice record.
14. Queue/send confirmation emails.
15. Return order/tracking information.

Never trust price values sent by the browser.

---

# 45. PRICE SNAPSHOTS

Order items must store historical values.

For example:

```text
productNameSnapshot
skuSnapshot
unitPrice
discountAmount
quantity
finalPrice
```

If the product price changes later, historical orders must remain correct.

---

# 46. ERROR HANDLING

Every major workflow needs useful errors.

Examples:

- Product unavailable
- Out of stock
- Coupon expired
- Invalid coupon
- Checkout failed
- Network error
- Unauthorized admin action
- Invoice generation failure
- Email failure

Errors must not reveal database internals.

---

# 47. LOADING / EMPTY / ERROR STATES

Design all three.

Examples:

### Loading
Use elegant skeletons.

### Empty
"Nothing here yet."

### Error
"Something went wrong. Please try again."

Avoid raw browser error messages.

---

# 48. IMAGE DIRECTION

The brand should use high-quality product imagery.

## Product image standard

Preferred:

- 4:5 portrait or square
- Clean background
- Consistent lighting
- Product centered
- Enough whitespace
- No watermark unless intentionally branded
- High resolution

## Hero image standard

- 16:9 or wide
- Editorial
- Cream/pastel palette
- Jewelry/accessories as visual focus
- Negative space for text
- No embedded text

---

# 49. HERO IMAGE PROMPTS

Use these prompts if an image generation tool is available.

## Hero 01 — Signature Jewelry

> Premium editorial jewelry campaign for a feminine Pakistani/South Asian accessories boutique named Mini Street, delicate gold and silver earrings, rings, bracelets and necklaces arranged on luxurious warm cream fabric, blush pink silk accents, subtle pastel teal details, tiny elegant sparkles, dreamy soft studio lighting, sophisticated fashion magazine composition, realistic high-end product photography, clean negative space on the left for website typography, warm cream background, no people, no text, no logo, no watermark, photorealistic.

## Hero 02 — Pink Jewelry Editorial

> Luxury feminine jewelry editorial, elegant bracelets and rings displayed on soft blush pink satin and warm ivory surface, subtle pearl details, refined feminine styling, soft diffused studio light, delicate shadows, premium e-commerce campaign photography, modern South Asian fashion boutique aesthetic, clean composition with negative space, realistic textures, no text, no logo, no watermark.

## Hero 03 — Accessories Lifestyle

> Premium feminine accessories campaign for a modern South Asian boutique, elegant young woman's hands wearing delicate rings, bracelet and watch, sophisticated neutral outfit, soft warm cream studio background, blush pink accents, tasteful jewelry close-up, editorial fashion photography, refined and classy, natural skin texture, no visible face identity requirement, no text, no logo, no watermark.

## Hero 04 — Combo Sets

> Luxury gift-style jewelry flat lay, coordinated bracelet, necklace, earrings and ring combo set beautifully arranged in an elegant cream gift presentation, blush pink ribbon, subtle gold accents, soft pastel details, feminine premium boutique aesthetic, photorealistic product photography, soft natural shadows, sophisticated composition, no text, no logo, no watermark.

## Category images

Generate separate consistent visuals for:

- Earrings
- Bracelets
- Necklaces
- Rings
- Watches
- Handchains
- Handcuffs
- Combo Sets

Maintain the same lighting, background and photographic language across all categories.

---

# 50. IMAGE USAGE RULES

Never use an AI-generated hero image as if it were a real Mini Street product.

Product photos supplied by the business must be used for actual products.

Generated images may be used for:

- Hero
- Editorial banners
- Category backgrounds
- Decorative lifestyle sections

Do not invent product specifications using AI.

---

# 51. MICRO-ANIMATIONS

Use Framer Motion selectively.

Recommended:

- Hero entrance
- Product card hover
- Image zoom
- Wishlist heart
- Add-to-cart feedback
- Cart drawer
- Modal transitions
- Order tracking timeline
- Section reveal

Avoid:

- Constant floating objects
- Excessive parallax
- Long loading animations
- Distracting text effects
- Animations that slow checkout

Animation timing generally 150–500ms.

Use easing that feels natural.

---

# 52. PREMIUM DETAILS

Add polished touches:

- Mini Street sparkle icon
- Subtle gradient highlights
- Soft hover borders
- Elegant dividers
- Smooth cart drawer
- Sticky mobile checkout summary where useful
- Recently viewed products
- Quick view
- Back-to-top
- Breadcrumbs
- Toast notifications
- Image lightbox
- Share product
- Copy tracking ID button

---

# 53. ADMIN NOTIFICATIONS

Admin dashboard should notify about:

- New order
- Low stock
- Out-of-stock product
- Pending review
- Contact inquiry

Use notification center.

---

# 54. AUDIT LOG

Record important admin actions:

- Product created
- Product edited
- Product deleted/archived
- Order status changed
- Discount changed
- Coupon created
- Admin settings changed
- User role changed

Store:

- Actor
- Action
- Entity
- Timestamp
- Relevant metadata

---

# 55. ROLE-BASED ACCESS

Roles:

### OWNER
Full access.

### ADMIN
Most management functions.

### ORDER_MANAGER
Orders/tracking/customers.

### INVENTORY_MANAGER
Products/inventory.

### SUPPORT
Orders/customer support/reviews.

Enforce permissions server-side.

---

# 56. RESPONSIVE BREAKPOINTS

Design for:

- 320px+
- 375px+
- 425px+
- 768px
- 1024px
- 1280px
- 1440px+
- Large desktop

Do not simply shrink desktop UI.

Mobile must be deliberately designed.

---

# 57. MOBILE CHECKOUT

The checkout must be exceptionally simple on mobile.

Use:

- Large inputs
- Clear labels
- Proper keyboard types
- Sticky order total/CTA where appropriate
- Minimal distractions
- No unnecessary popups

---

# 58. MOBILE PRODUCT PAGE

Prioritize:

1. Product image
2. Product name
3. Price
4. Rating
5. Stock
6. Quantity
7. Add to cart
8. Buy now
9. Description
10. Delivery
11. Reviews

Use a sticky bottom action bar if it improves usability.

---

# 59. ADMIN MOBILE

Admin should remain usable on phone:

- Collapsible sidebar
- Responsive tables
- Card/table hybrid
- Bottom action bar where useful
- Drawer filters
- Horizontally scrollable tables only where unavoidable

---

# 60. SEED DATA

Create development seed data only.

Seed:

- All eight categories
- Sample products
- Sample customers
- Sample orders
- Sample reviews

Clearly label seed/demo data.

Never ship demo data as real production customer information.

---

# 61. ENVIRONMENT VARIABLES

Create `.env.example`.

Expected variables should be documented, for example:

```env
DATABASE_URL=

AUTH_SECRET=

NEXT_PUBLIC_APP_URL=

GMAIL_USER=
GMAIL_APP_PASSWORD=
ORDER_NOTIFICATION_EMAIL=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Future payment provider keys
```

Do not put real secrets in source control.

---

# 62. ADMIN FIRST-LOGIN

Provide a secure setup process.

Do not hard-code:

```text
admin/admin
```

Do not create a universal default password.

The first owner account should be created securely through setup or environment-controlled initialization.

---

# 63. DATABASE MIGRATIONS

Use proper Prisma migrations.

Never rely on `db push` as the only production migration process.

Document:

- Local setup
- Migration
- Seed
- Production deployment

---

# 64. TESTING

Implement tests for critical logic.

At minimum test:

### Pricing
- Regular price
- Sale price
- Coupon
- Shipping
- Total

### Inventory
- Successful purchase
- Insufficient stock
- Concurrent purchase protection

### Orders
- Creation
- Status transition
- Tracking event

### Authorization
- Admin access
- Role restrictions
- Customer restrictions

### UI
- Checkout
- Product page
- Cart

---

# 65. END-TO-END ACCEPTANCE TEST

Before declaring complete, verify this complete flow:

```text
Customer visits homepage
        ↓
Opens category
        ↓
Filters products
        ↓
Opens product
        ↓
Adds product to cart
        ↓
Changes quantity
        ↓
Applies coupon
        ↓
Checks out
        ↓
Order is created
        ↓
Inventory changes
        ↓
Tracking ID generated
        ↓
Customer sees success
        ↓
Customer receives email
        ↓
Admin receives email
        ↓
Admin sees order
        ↓
Admin changes status
        ↓
Tracking timeline updates
        ↓
Customer sees updated timeline
        ↓
Admin generates invoice
        ↓
Invoice downloads/prints
```

Every step must actually work.

---

# 66. DESIGN QA CHECKLIST

Before final delivery inspect:

- Is the logo correctly displayed?
- Does the site feel like Mini Street?
- Is it premium?
- Is it feminine without being childish?
- Is spacing consistent?
- Are typography sizes consistent?
- Are buttons consistent?
- Are cards consistent?
- Are images high quality?
- Are mobile layouts polished?
- Are loading states polished?
- Are error states polished?
- Are empty states polished?
- Are animations subtle?
- Are colors consistent?

---

# 67. FUNCTIONAL QA CHECKLIST

Verify:

- Product CRUD
- Category CRUD
- Inventory
- Cart
- Checkout
- Order creation
- Order tracking
- Order status updates
- Coupons
- Discounts
- Reviews
- Customers
- Analytics
- Invoice PDF
- Emails
- Authentication
- Role permissions
- Settings

---

# 68. SEO QA

Verify:

- Sitemap exists
- Robots exists
- Product metadata
- Category metadata
- Canonicals
- OpenGraph
- Structured data
- No accidental `noindex`
- Good page titles
- Good descriptions
- Clean URLs

---

# 69. PERFORMANCE QA

Check:

- Image optimization
- No massive JS bundle
- No unnecessary client components
- No obvious N+1 database queries
- No layout shifts
- No unoptimized giant images
- Fast initial page render

---

# 70. PROJECT QUALITY RULE

Do not stop after making the visual frontend.

The project is incomplete until:

- Database works
- Admin works
- Checkout works
- Orders work
- Tracking works
- Invoice works
- Emails are wired
- Security is implemented
- Responsive design works
- Error handling exists
- Production setup is documented

---

# 71. DEVELOPMENT ORDER

Build in this order:

## Phase 1 — Foundation

- Inspect repository
- Establish architecture
- Configure TypeScript
- Configure Tailwind
- Establish design tokens
- Install dependencies
- Configure database
- Configure Prisma
- Create schema
- Create migrations

## Phase 2 — Design system

Build:

- Buttons
- Inputs
- Cards
- Modal
- Drawer
- Toast
- Tabs
- Badges
- Skeletons
- Breadcrumbs
- Product card
- Header
- Footer

## Phase 3 — Storefront

Build:

- Homepage
- Shop
- Categories
- Product page
- Search
- Wishlist
- Cart
- Checkout

## Phase 4 — Orders

Build:

- Order creation
- Inventory
- Tracking
- Success page
- Tracking page

## Phase 5 — Admin

Build:

- Authentication
- Dashboard
- Products
- Categories
- Inventory
- Orders
- Customers
- Discounts
- Coupons
- Reviews
- Analytics
- Invoices
- Settings

## Phase 6 — Communications

- Email templates
- Order emails
- Admin notifications
- Contact form

## Phase 7 — Quality

- Security
- SEO
- Accessibility
- Performance
- Testing
- Error states

## Phase 8 — Deployment

- Environment documentation
- Production migration
- Seed instructions
- Deployment instructions

---

# 72. DO NOT ASK FOR DESIGN APPROVAL AT EVERY STEP

Make professional decisions independently based on this specification.

Only ask the owner when information is genuinely required, such as:

- Actual business address
- Phone
- Email
- Shipping rates
- Return policy
- Payment gateway credentials
- Production database credentials
- Real product photos

Use configurable settings rather than blocking development.

---

# 73. PLACEHOLDER BUSINESS INFORMATION

If actual business information is unavailable, use clearly marked configuration placeholders:

```text
STORE_EMAIL
STORE_PHONE
STORE_ADDRESS
WHATSAPP_NUMBER
INSTAGRAM_URL
FACEBOOK_URL
```

Do not invent real addresses or phone numbers.

---

# 74. CONTENT RULES

Do not invent:

- Product materials
- Product dimensions
- Delivery guarantees
- Return guarantees
- Business history
- Customer reviews
- Certifications
- Quality claims

Use placeholders or configurable content until the owner supplies real information.

---

# 75. ADMIN CONTENT MANAGEMENT

Where practical, allow owner to manage:

- Announcement bar
- Homepage promotional banners
- Hero title/subtitle
- Hero CTA
- Featured categories
- Promotional sections
- Store contact details
- Social links
- Shipping information
- FAQ
- Policies
- Footer content

Do not require code changes for normal business content.

---

# 76. FUTURE-READY ARCHITECTURE

Do not implement future features prematurely, but make the architecture extensible for:

- Online payments
- Courier API
- WhatsApp order notifications
- Customer loyalty points
- Referral codes
- Gift cards
- Product variants
- Abandoned cart
- Advanced customer segmentation
- Multi-admin teams
- Marketing campaigns
- Product bundles
- Inventory purchase orders
- Multi-location inventory

---

# 77. WHATSAPP-READY DESIGN

Because this is a social-commerce brand, make room for a future WhatsApp integration.

Potential future actions:

- WhatsApp support
- WhatsApp order notification
- WhatsApp tracking
- Click-to-chat

Do not hard-code an unverified phone number.

---

# 78. SOCIAL-COMMERCE EXPERIENCE

Instagram/Facebook users should be able to land directly on product pages.

Product URLs must be shareable.

Every product page should have:

- Share button
- Copy link
- Social preview metadata
- Attractive OpenGraph image

---

# 79. PRODUCT URL REQUIREMENT

Use human-readable slugs:

```text
/product/golden-heart-bracelet
```

not database IDs.

Ensure slug uniqueness.

If slug changes, consider redirect handling where practical.

---

# 80. FINAL DEFINITION OF DONE

The project is considered COMPLETE only when:

### Customer

- [ ] Homepage complete
- [ ] Shop complete
- [ ] Category pages complete
- [ ] Product pages complete
- [ ] Search complete
- [ ] Filters complete
- [ ] Cart complete
- [ ] Checkout complete
- [ ] Wishlist complete
- [ ] Tracking complete
- [ ] Account optional
- [ ] Reviews complete
- [ ] Contact complete
- [ ] FAQ complete
- [ ] Policies complete

### Admin

- [ ] Login
- [ ] Dashboard
- [ ] Products
- [ ] Categories
- [ ] Inventory
- [ ] Orders
- [ ] Tracking
- [ ] Customers
- [ ] Discounts
- [ ] Coupons
- [ ] Offers
- [ ] Reviews
- [ ] Analytics
- [ ] Invoices
- [ ] Emails
- [ ] Settings
- [ ] Roles
- [ ] Audit log

### Backend

- [ ] Database
- [ ] Validation
- [ ] Authorization
- [ ] Order transaction
- [ ] Inventory protection
- [ ] Email integration
- [ ] PDF generation
- [ ] Error handling
- [ ] Logging

### Quality

- [ ] Responsive
- [ ] Accessible
- [ ] SEO-ready
- [ ] Fast
- [ ] Secure
- [ ] Tested
- [ ] Production deployment documented

---

# 81. FINAL AGENT INSTRUCTION

Start by inspecting the existing repository and all available assets.

If the supplied Mini Street logo is available, inspect it carefully and use it as the visual source of truth.

Then create a clean implementation plan internally and execute it.

Do not build a generic e-commerce template.

Build:

> **MINI STREET — Adorably Enchanting Treasures**

as a distinctive, premium, feminine, modern jewelry/accessories e-commerce brand.

The customer experience should feel polished enough that a visitor coming from Instagram would immediately trust the store and comfortably place an order.

The owner experience should feel like a professional business management system.

Prioritize:

1. Real functionality
2. Excellent UX
3. Brand consistency
4. Mobile experience
5. Security
6. Performance
7. Maintainability
8. Scalability
9. SEO
10. Visual polish

When finished, provide:

- Exact setup commands
- Required environment variables
- Database migration commands
- Seed commands
- Local development commands
- Production deployment instructions
- Admin setup instructions
- Email configuration instructions
- Image storage configuration instructions
- A concise list of any credentials/information the owner still needs to supply

Do not claim production readiness until the critical end-to-end flow has actually been verified.


# 82. VISUAL PAGE BLUEPRINTS — REQUIRED IMPLEMENTATION REFERENCE

The following ASCII structures are **layout references**, not literal UI. Convert them into a polished responsive design matching the Mini Street design system.

## 82.1 CUSTOMER SITE — GLOBAL STRUCTURE

```text
┌──────────────────────────────────────────────────────────────────┐
│ ANNOUNCEMENT BAR                                                 │
│ ✨ New treasures just arrived • Free delivery over Rs. ____      │
├──────────────────────────────────────────────────────────────────┤
│ LOGO       SHOP   CATEGORIES   NEW ARRIVALS   OFFERS     🔍 ♡ 🛒 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                         PAGE CONTENT                             │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ NEWSLETTER / MINI STREET CLUB                                    │
├──────────────────────────────────────────────────────────────────┤
│ FOOTER                                                           │
│ Shop | Categories | Customer Care | About | Social              │
└──────────────────────────────────────────────────────────────────┘
```

On mobile:

```text
┌─────────────────────────────┐
│ ☰      MINI STREET     ♡ 🛒│
├─────────────────────────────┤
│                             │
│       PAGE CONTENT          │
│                             │
├─────────────────────────────┤
│ Newsletter                  │
├─────────────────────────────┤
│ Footer accordion            │
└─────────────────────────────┘
```

---

# 83. HOMEPAGE WIREFRAME

```text
┌───────────────────────────────────────────────────────────────┐
│ ANNOUNCEMENT BAR                                              │
├───────────────────────────────────────────────────────────────┤
│ LOGO | SHOP | CATEGORIES | NEW | OFFERS | SEARCH | ♡ | CART │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│                    HERO IMAGE / EDITORIAL                     │
│                                                               │
│             ADORABLY ENCHANTING TREASURES                     │
│       Jewelry & accessories for every little moment           │
│                                                               │
│              [ SHOP NOW ]  [ NEW ARRIVALS ]                   │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│                         SHOP BY CATEGORY                      │
│                                                               │
│ [EARRINGS] [BRACELETS] [NECKLACES] [RINGS]                    │
│ [WATCHES]  [HANDCHAINS] [HANDCUFFS] [COMBO SETS]              │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│                         NEW ARRIVALS                           │
│                                                               │
│ [ PRODUCT ] [ PRODUCT ] [ PRODUCT ] [ PRODUCT ]               │
│                                                               │
│                         [ VIEW ALL ]                           │
├───────────────────────────────────────────────────────────────┤
│                  EDITORIAL PROMOTIONAL BANNER                 │
│                                                               │
│                    YOUR EVERYDAY SPARKLE                      │
│                    [ SHOP JEWELRY ]                           │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│                       BEST SELLERS                             │
│ [ PRODUCT ] [ PRODUCT ] [ PRODUCT ] [ PRODUCT ]               │
├───────────────────────────────────────────────────────────────┤
│                          OFFERS                                │
│                                                               │
│          LIMITED TIME • XX% OFF • COUNTDOWN                   │
│                         [ SHOP OFFER ]                         │
├───────────────────────────────────────────────────────────────┤
│                       WHY MINI STREET                          │
│                                                               │
│  ✦ Carefully Selected   ✦ Beautiful Details                   │
│  ✦ Secure Packaging    ✦ Made to Gift                        │
├───────────────────────────────────────────────────────────────┤
│                    FOLLOW OUR LITTLE STREET                    │
│                         @mini_street.co                        │
│                                                               │
│ [ IMG ] [ IMG ] [ IMG ] [ IMG ] [ IMG ]                       │
├───────────────────────────────────────────────────────────────┤
│                       CUSTOMER LOVE                            │
│                    [ REVIEW ] [ REVIEW ]                       │
├───────────────────────────────────────────────────────────────┤
│                    JOIN MINI STREET CLUB                       │
│             [ EMAIL ] [ JOIN ]                                 │
├───────────────────────────────────────────────────────────────┤
│                           FOOTER                               │
└───────────────────────────────────────────────────────────────┘
```

---

# 84. SHOP PAGE WIREFRAME

```text
┌───────────────────────────────────────────────────────────────┐
│ HEADER                                                        │
├───────────────────────────────────────────────────────────────┤
│ Home / Shop                                                   │
│                                                               │
│                         SHOP ALL                              │
│       Discover all Mini Street treasures                      │
├───────────────────────┬───────────────────────────────────────┤
│ FILTERS               │ SORT: Featured ▼                      │
│                       ├───────────────────────────────────────┤
│ Category              │                                       │
│ □ Earrings            │ [ PRODUCT ] [ PRODUCT ] [ PRODUCT ]   │
│ □ Bracelets           │                                       │
│ □ Rings               │ [ PRODUCT ] [ PRODUCT ] [ PRODUCT ]   │
│ □ Watches             │                                       │
│                       │ [ PRODUCT ] [ PRODUCT ] [ PRODUCT ]   │
│ Price                 │                                       │
│ ───────────────       │                                       │
│                       │                                       │
│ Availability          │                                       │
│ □ In stock            │                                       │
│ □ Sale                │                                       │
└───────────────────────┴───────────────────────────────────────┘
```

Mobile:

```text
┌─────────────────────────────┐
│ SHOP                        │
│ 48 treasures                │
│ [ FILTER ] [ SORT ]         │
├─────────────────────────────┤
│ [ PRODUCT ] [ PRODUCT ]     │
│ [ PRODUCT ] [ PRODUCT ]     │
│ [ PRODUCT ] [ PRODUCT ]     │
└─────────────────────────────┘
```

---

# 85. CATEGORY PAGE WIREFRAME

```text
┌───────────────────────────────────────────────────────────────┐
│ CATEGORY HERO IMAGE                                           │
│                                                               │
│                         BRACELETS                             │
│         Delicate pieces for every little moment               │
├───────────────────────────────────────────────────────────────┤
│ Breadcrumbs                                                    │
│ 12 Products                       FILTER    SORT               │
├───────────────────────────────────────────────────────────────┤
│ [ PRODUCT ] [ PRODUCT ] [ PRODUCT ] [ PRODUCT ]               │
│ [ PRODUCT ] [ PRODUCT ] [ PRODUCT ] [ PRODUCT ]               │
│ [ PRODUCT ] [ PRODUCT ] [ PRODUCT ] [ PRODUCT ]               │
└───────────────────────────────────────────────────────────────┘
```

The same component architecture must support all eight categories.

---

# 86. PRODUCT DETAIL WIREFRAME

```text
┌───────────────────────────────────────────────────────────────┐
│ HEADER                                                        │
├───────────────────────────────────────────────────────────────┤
│ Home / Bracelets / Product                                    │
├──────────────────────────────┬────────────────────────────────┤
│                              │                                │
│                              │ PRODUCT NAME                   │
│       LARGE PRODUCT          │ ★★★★★ (12 reviews)            │
│           IMAGE              │                                │
│                              │ Rs. 1,299                      │
│                              │ Rs. 1,599   19% OFF            │
│                              │                                │
│ [thumbnail][thumbnail]       │ ● In Stock                     │
│ [thumbnail][thumbnail]       │                                │
│                              │ Quantity  [-] 1 [+]            │
│                              │                                │
│                              │ [ ADD TO CART ]                 │
│                              │ [ BUY NOW ]                     │
│                              │                                │
│                              │ ♡ Add to Wishlist               │
│                              │                                │
│                              │ 🚚 Delivery information          │
│                              │ ↩ Returns information            │
├──────────────────────────────┴────────────────────────────────┤
│ DESCRIPTION                                                   │
├───────────────────────────────────────────────────────────────┤
│ DETAILS                                                       │
├───────────────────────────────────────────────────────────────┤
│ SHIPPING & RETURNS                                            │
├───────────────────────────────────────────────────────────────┤
│ CUSTOMER REVIEWS                                              │
├───────────────────────────────────────────────────────────────┤
│ YOU MAY ALSO LIKE                                             │
│ [ PRODUCT ] [ PRODUCT ] [ PRODUCT ] [ PRODUCT ]               │
└───────────────────────────────────────────────────────────────┘
```

Mobile:

```text
┌─────────────────────────────┐
│ ← Product              ♡    │
├─────────────────────────────┤
│                             │
│      PRODUCT IMAGE          │
│                             │
│  • • • •                    │
├─────────────────────────────┤
│ Product Name                │
│ ★★★★★ 12 reviews           │
│ Rs. 1,299                   │
│ Rs. 1,599  19% OFF          │
│                             │
│ ● In Stock                  │
│ Quantity [-] 1 [+]          │
│                             │
│ Description                 │
│ Shipping                    │
│ Returns                     │
│ Reviews                     │
├─────────────────────────────┤
│ [ ADD TO CART ] [ BUY NOW ]│
└─────────────────────────────┘
```

---

# 87. CART WIREFRAME

```text
┌───────────────────────────────────────────────────────────────┐
│ YOUR CART                                                     │
├──────────────────────────────────┬────────────────────────────┤
│ PRODUCT                          │ ORDER SUMMARY               │
│                                  │                             │
│ [IMG] Product Name               │ Subtotal      Rs. 3,597    │
│       [-] 1 [+]                 │ Discount      -Rs. 300     │
│       Rs. 1,299                  │ Shipping      Rs. 200      │
│                                  │ ─────────────────           │
│ [IMG] Product Name               │ TOTAL         Rs. 3,497    │
│       [-] 2 [+]                 │                             │
│       Rs. 2,298                  │ Coupon                        │
│                                  │ [ CODE ] [ APPLY ]         │
│                                  │                             │
│                                  │ [ CHECKOUT ]                │
└──────────────────────────────────┴────────────────────────────┘
```

---

# 88. CHECKOUT WIREFRAME

```text
┌───────────────────────────────────────────────────────────────┐
│ MINI STREET LOGO                                              │
├─────────────────────────────────────┬─────────────────────────┤
│ CHECKOUT                            │ ORDER SUMMARY            │
│                                     │                         │
│ 1. CONTACT                          │ Product x 1              │
│ Name                                │ Rs. 1,299                │
│ Email                               │                         │
│ Phone                               │ Product x 2              │
│                                     │ Rs. 2,298                │
│ 2. SHIPPING                         │                         │
│ Address                             │ Subtotal                 │
│ City                                │ Discount                 │
│ Province                            │ Shipping                 │
│ Postal Code                         │ TOTAL                    │
│ Delivery Notes                      │                         │
│                                     │                         │
│ 3. PAYMENT                          │                         │
│ ○ Cash on Delivery                 │                         │
│                                     │                         │
│ [ PLACE ORDER ]                     │                         │
└─────────────────────────────────────┴─────────────────────────┘
```

---

# 89. ORDER SUCCESS WIREFRAME

```text
┌───────────────────────────────────────────────────────────────┐
│                         ✓                                     │
│                 ORDER PLACED SUCCESSFULLY                     │
│                                                               │
│              Thank you for shopping with us 💗                │
│                                                               │
│ Order ID: MS-2026-000184                                     │
│ Tracking ID: MS-2026-000184                                  │
│ Total: Rs. 3,497                                              │
│                                                               │
│ [ TRACK MY ORDER ]   [ CONTINUE SHOPPING ]                    │
│                                                               │
│              Estimated delivery: ______                       │
└───────────────────────────────────────────────────────────────┘
```

---

# 90. TRACKING PAGE WIREFRAME

```text
┌───────────────────────────────────────────────────────────────┐
│                       TRACK YOUR ORDER                        │
│                                                               │
│              [ MS-2026-000184 ] [ TRACK ]                    │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ ORDER MS-2026-000184                                          │
│                                                               │
│ ✓ Order Placed                                                │
│ │  08 Oct • 7:32 PM                                           │
│ │  Your order has been received.                              │
│ │                                                             │
│ ✓ Order Confirmed                                              │
│ │  08 Oct • 7:35 PM                                           │
│ │                                                             │
│ ● Packed                                                       │
│ │  Your treasures are carefully packed.                       │
│ │                                                             │
│ ○ Shipped                                                      │
│ │                                                             │
│ ○ Out for Delivery                                             │
│ │                                                             │
│ ○ Delivered                                                    │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│ PRODUCTS                                                       │
│ [IMG] Product × 1                                             │
│                                                               │
│ DELIVERY                                                      │
│ Address                                                       │
│ Estimated delivery                                           │
└───────────────────────────────────────────────────────────────┘
```

---

# 91. ABOUT PAGE WIREFRAME

```text
┌───────────────────────────────────────────────────────────────┐
│ HERO IMAGE                                                     │
│                                                               │
│                 LITTLE TREASURES.                             │
│                    BIG FEELINGS.                              │
├───────────────────────────────────────────────────────────────┤
│ OUR STORY                                                      │
│ Editorial image + brand story                                 │
├───────────────────────────────────────────────────────────────┤
│ WHAT WE BELIEVE                                               │
│ 3–4 brand principles                                           │
├───────────────────────────────────────────────────────────────┤
│ OUR LITTLE DETAILS                                            │
│ Product selection / packaging / customer experience            │
├───────────────────────────────────────────────────────────────┤
│                    [ SHOP MINI STREET ]                        │
└───────────────────────────────────────────────────────────────┘
```

---

# 92. CONTACT PAGE WIREFRAME

```text
┌───────────────────────────────────────────────────────────────┐
│ GET IN TOUCH                                                   │
│ We're here to help.                                           │
├───────────────────────────────┬───────────────────────────────┤
│ CONTACT FORM                  │ CONTACT DETAILS               │
│ Name                          │ Email                         │
│ Email                         │ Phone                         │
│ Order #                       │ Instagram                     │
│ Subject                       │ Facebook                      │
│ Message                       │                               │
│ [ SEND MESSAGE ]              │ Support hours                 │
└───────────────────────────────┴───────────────────────────────┘
```

---

# 93. FAQ PAGE WIREFRAME

```text
┌───────────────────────────────────────────────────────────────┐
│ FREQUENTLY ASKED QUESTIONS                                    │
│                                                               │
│ [ Search FAQs... ]                                             │
├───────────────────────────────────────────────────────────────┤
│ ORDERS                                                        │
│ ▸ How do I place an order?                                    │
│ ▸ Can I modify my order?                                      │
│                                                               │
│ SHIPPING                                                      │
│ ▸ How long does delivery take?                                │
│ ▸ How can I track my order?                                   │
│                                                               │
│ RETURNS                                                       │
│ ▸ What is the return policy?                                  │
└───────────────────────────────────────────────────────────────┘
```

---

# 94. ADMIN GLOBAL STRUCTURE

```text
┌──────────────────────────────────────────────────────────────────┐
│ MINI STREET ADMIN                         🔔   OWNER   ⚙         │
├───────────────────┬──────────────────────────────────────────────┤
│ SIDEBAR           │                                              │
│                   │                  PAGE CONTENT                 │
│ Dashboard         │                                              │
│                   │                                              │
│ CATALOG           │                                              │
│ Products          │                                              │
│ Categories        │                                              │
│ Inventory         │                                              │
│                   │                                              │
│ SALES             │                                              │
│ Orders            │                                              │
│ Customers         │                                              │
│ Discounts         │                                              │
│ Coupons           │                                              │
│ Offers            │                                              │
│                   │                                              │
│ ENGAGEMENT        │                                              │
│ Reviews           │                                              │
│ Emails            │                                              │
│                   │                                              │
│ ANALYTICS         │                                              │
│ Analytics         │                                              │
│                   │                                              │
│ DOCUMENTS         │                                              │
│ Invoices          │                                              │
│                   │                                              │
│ SYSTEM            │                                              │
│ Users & Roles     │                                              │
│ Settings          │                                              │
└───────────────────┴──────────────────────────────────────────────┘
```

---

# 95. ADMIN DASHBOARD WIREFRAME

```text
┌──────────────────────────────────────────────────────────────────┐
│ Dashboard                                      Date: [30 Days ▼]│
├────────────┬────────────┬────────────┬──────────────────────────┤
│ REVENUE    │ ORDERS     │ SOLD       │ PENDING                  │
│ Rs. 48,250 │ 37         │ 81         │ 14                       │
├────────────┴────────────┴────────────┴──────────────────────────┤
│                                                                  │
│ REVENUE OVER TIME                                                │
│                                                                  │
│        ╭────╮                                                    │
│    ╭───╯    ╰───╮                                                │
│ ───╯            ╰────                                            │
│                                                                  │
├────────────────────────────────┬─────────────────────────────────┤
│ SALES BY CATEGORY              │ ORDER STATUS                    │
│                                │                                 │
│ Earrings    ████████           │ Delivered     45%               │
│ Bracelets   ██████             │ Processing    20%               │
│ Rings       ████               │ Shipped       20%               │
│ Watches     ███                │ Cancelled     15%               │
├────────────────────────────────┴─────────────────────────────────┤
│ TOP PRODUCTS                                                     │
│ #1 Product                       127 sold                         │
│ #2 Product                        98 sold                         │
│ #3 Product                        83 sold                         │
└──────────────────────────────────────────────────────────────────┘
```

---

# 96. ADMIN PRODUCTS WIREFRAME

```text
┌──────────────────────────────────────────────────────────────────┐
│ PRODUCTS                                      [ + ADD PRODUCT ]  │
├──────────────────────────────────────────────────────────────────┤
│ Search products...  Category ▼  Status ▼  Stock ▼                │
├──────┬───────────────┬──────┬────────┬────────┬────────┬────────┤
│ IMG  │ PRODUCT       │ SKU  │ PRICE  │ STOCK  │ STATUS │ ACTION │
├──────┼───────────────┼──────┼────────┼────────┼────────┼────────┤
│ IMG  │ Heart Ring    │ R001 │ 1299   │ 27     │ Active │ •••    │
│ IMG  │ Pearl Earring │ E002 │ 999    │ 0      │ Sold   │ •••    │
│ IMG  │ Rose Watch    │ W003 │ 2499   │ 8      │ Low    │ •••    │
└──────┴───────────────┴──────┴────────┴────────┴────────┴────────┘
```

---

# 97. ADMIN ADD PRODUCT WIREFRAME

```text
┌──────────────────────────────────────────────────────────────────┐
│ ADD PRODUCT                                  [ SAVE DRAFT ]      │
├───────────────────────────────────┬──────────────────────────────┤
│ BASIC INFORMATION                 │ PRODUCT PREVIEW              │
│                                   │                              │
│ Product Name                      │ [IMAGE]                      │
│ Slug                              │ Product Name                 │
│ SKU                               │ Rs. 1,299                    │
│ Description                       │                              │
│                                   │                              │
│ CATEGORY                          │                              │
│ Category ▼                        │                              │
│ Tags                              │                              │
├───────────────────────────────────┴──────────────────────────────┤
│ PRICING                                                           │
│ Price | Sale Price | Cost Price                                   │
├──────────────────────────────────────────────────────────────────┤
│ INVENTORY                                                          │
│ Stock | Low Stock Threshold | Track Inventory                     │
├──────────────────────────────────────────────────────────────────┤
│ MEDIA                                                              │
│ [ + Upload Images ]                                               │
├──────────────────────────────────────────────────────────────────┤
│ MERCHANDISING                                                      │
│ □ New Arrival   □ Featured   □ Active                             │
├──────────────────────────────────────────────────────────────────┤
│ SEO                                                                │
│ SEO Title                                                          │
│ Meta Description                                                   │
├──────────────────────────────────────────────────────────────────┤
│ [ CANCEL ]                                  [ SAVE PRODUCT ]       │
└──────────────────────────────────────────────────────────────────┘
```

---

# 98. ADMIN ORDERS WIREFRAME

```text
┌──────────────────────────────────────────────────────────────────┐
│ ORDERS                                                            │
├──────────────────────────────────────────────────────────────────┤
│ Search...  Status ▼  Payment ▼  Date ▼  City ▼                  │
├────────────┬────────────┬──────────┬────────┬──────────┬─────────┤
│ ORDER      │ CUSTOMER   │ DATE     │ TOTAL  │ STATUS   │ ACTION  │
├────────────┼────────────┼──────────┼────────┼──────────┼─────────┤
│ MS-000184  │ Sarah      │ Oct 08   │ 3497   │ Packed   │ View    │
│ MS-000183  │ Ayesha     │ Oct 08   │ 2199   │ Shipped  │ View    │
│ MS-000182  │ Hira       │ Oct 07   │ 1299   │ Delivered│ View    │
└────────────┴────────────┴──────────┴────────┴──────────┴─────────┘
```

---

# 99. ADMIN ORDER DETAIL WIREFRAME

```text
┌──────────────────────────────────────────────────────────────────┐
│ ORDER MS-2026-000184                      [ PRINT ] [ INVOICE ]  │
├───────────────────────────────┬──────────────────────────────────┤
│ CUSTOMER                      │ ORDER SUMMARY                    │
│ Sarah                         │ Heart Bracelet ×2                │
│ Phone                         │ Pearl Earrings ×1                │
│ Email                         │                                  │
│                               │ Subtotal                         │
│ SHIPPING                      │ Discount                         │
│ Address                       │ Shipping                         │
│ City                          │ TOTAL                            │
├───────────────────────────────┴──────────────────────────────────┤
│ ORDER TIMELINE                                                    │
│ ✓ Placed → ✓ Confirmed → ● Packed → ○ Shipped → ○ Delivered     │
├──────────────────────────────────────────────────────────────────┤
│ TRACKING                                                          │
│ Courier: ________   Tracking No: ________                         │
│ [ UPDATE TRACKING ]                                               │
├──────────────────────────────────────────────────────────────────┤
│ STATUS                                                            │
│ [ PROCESSING ▼ ]                                                  │
│ [ SAVE STATUS ]                                                   │
├──────────────────────────────────────────────────────────────────┤
│ INTERNAL NOTES                                                    │
│ [..............................................................]  │
└──────────────────────────────────────────────────────────────────┘
```

---

# 100. ADMIN ANALYTICS WIREFRAME

```text
┌──────────────────────────────────────────────────────────────────┐
│ SALES ANALYTICS                              [ EXPORT ]          │
│ Date: [Custom Range]                                             │
├────────────┬────────────┬────────────┬──────────────────────────┤
│ REVENUE    │ ORDERS     │ AOV        │ UNITS SOLD               │
│ Rs. ____   │ ____       │ Rs. ____   │ ____                     │
├────────────┴────────────┴────────────┴──────────────────────────┤
│ REVENUE                                                          │
│                                                                  │
│                 CHART                                            │
├────────────────────────────────┬─────────────────────────────────┤
│ SALES BY CATEGORY              │ TOP PRODUCTS                    │
│                                │                                 │
│ Chart                          │ 1. Product — 127                │
│                                │ 2. Product — 98                 │
│                                │ 3. Product — 83                 │
├────────────────────────────────┴─────────────────────────────────┤
│ ORDER STATUS / DISCOUNTS / RETURNS / CUSTOMER METRICS            │
└──────────────────────────────────────────────────────────────────┘
```

---

# 101. ADMIN INVOICE PREVIEW WIREFRAME

```text
┌──────────────────────────────────────────────────────────────────┐
│ INVOICE PREVIEW                         [ PRINT ] [ DOWNLOAD PDF ]│
├──────────────────────────────────────────────────────────────────┤
│                        MINI STREET                               │
│                Adorably Enchanting Treasures                    │
│                                                                  │
│ Invoice: INV-2026-000184        Date: 08 Oct 2026                │
│ Order: MS-2026-000184                                           │
│                                                                  │
│ BILL TO                        SHIP TO                            │
│ Customer Name                  Customer Name                      │
│ Email                          Address                            │
│ Phone                          City                               │
│                                                                  │
│ PRODUCT              QTY      PRICE      DISCOUNT      TOTAL     │
│ Heart Bracelet       2        1299       100           2398     │
│ Pearl Earrings       1        999        0             999      │
│                                                                  │
│                                      SUBTOTAL     Rs. 3397       │
│                                      DISCOUNT     Rs. 100        │
│                                      SHIPPING     Rs. 200        │
│                                      TOTAL        Rs. 3497       │
│                                                                  │
│                 Thank you for shopping with Mini Street 💗       │
└──────────────────────────────────────────────────────────────────┘
```

---

# 102. PAGE-BY-PAGE DESIGN ACCEPTANCE RULE

For EVERY page in this project, the agent must implement:

1. Desktop layout
2. Tablet layout
3. Mobile layout
4. Loading state
5. Empty state
6. Error state
7. Success state where applicable
8. Hover/focus states
9. Responsive navigation
10. Accessibility
11. SEO metadata where applicable
12. Correct server/client boundary
13. Real database integration where applicable

Do not consider a page complete merely because the default success state looks good.

---

# 103. PROJECT ROOT STRUCTURE — REQUIRED TARGET ARCHITECTURE

Use this as the preferred target structure.

```text
mini-street/
│
├── AGENT.md
├── README.md
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
├── components.json
│
├── .env.example
├── .gitignore
│
├── app/
│   │
│   ├── (store)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   │
│   │   ├── shop/
│   │   │   ├── page.tsx
│   │   │   └── [category]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── product/
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── search/
│   │   │   └── page.tsx
│   │   │
│   │   ├── new-arrivals/
│   │   │   └── page.tsx
│   │   │
│   │   ├── best-sellers/
│   │   │   └── page.tsx
│   │   │
│   │   ├── offers/
│   │   │   └── page.tsx
│   │   │
│   │   ├── cart/
│   │   │   └── page.tsx
│   │   │
│   │   ├── checkout/
│   │   │   └── page.tsx
│   │   │
│   │   ├── order-success/
│   │   │   └── [orderId]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── track-order/
│   │   │   ├── page.tsx
│   │   │   └── [trackingId]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── wishlist/
│   │   │   └── page.tsx
│   │   │
│   │   ├── about/
│   │   │   └── page.tsx
│   │   │
│   │   ├── contact/
│   │   │   └── page.tsx
│   │   │
│   │   ├── faq/
│   │   │   └── page.tsx
│   │   │
│   │   ├── shipping-policy/
│   │   │   └── page.tsx
│   │   │
│   │   ├── return-policy/
│   │   │   └── page.tsx
│   │   │
│   │   ├── privacy-policy/
│   │   │   └── page.tsx
│   │   │
│   │   └── terms/
│   │       └── page.tsx
│   │
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   │
│   ├── account/
│   │   ├── page.tsx
│   │   ├── orders/
│   │   ├── profile/
│   │   └── wishlist/
│   │
│   ├── admin/
│   │   ├── login/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── products/
│   │   ├── categories/
│   │   ├── inventory/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── discounts/
│   │   ├── coupons/
│   │   ├── offers/
│   │   ├── reviews/
│   │   ├── analytics/
│   │   ├── invoices/
│   │   ├── emails/
│   │   ├── users/
│   │   └── settings/
│   │
│   ├── api/
│   │   ├── auth/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── tracking/
│   │   ├── coupons/
│   │   ├── reviews/
│   │   ├── uploads/
│   │   ├── invoices/
│   │   ├── emails/
│   │   └── webhooks/
│   │
│   ├── sitemap.ts
│   ├── robots.ts
│   ├── not-found.tsx
│   ├── error.tsx
│   └── loading.tsx
│
├── components/
│   │
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── drawer.tsx
│   │   ├── dropdown.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   ├── badge.tsx
│   │   ├── skeleton.tsx
│   │   └── ...
│   │
│   ├── layout/
│   │   ├── announcement-bar.tsx
│   │   ├── site-header.tsx
│   │   ├── mobile-header.tsx
│   │   ├── site-footer.tsx
│   │   └── breadcrumbs.tsx
│   │
│   ├── home/
│   │   ├── hero.tsx
│   │   ├── category-showcase.tsx
│   │   ├── new-arrivals.tsx
│   │   ├── editorial-banner.tsx
│   │   ├── best-sellers.tsx
│   │   ├── offers-section.tsx
│   │   ├── why-mini-street.tsx
│   │   ├── social-section.tsx
│   │   ├── testimonials.tsx
│   │   └── newsletter.tsx
│   │
│   ├── product/
│   │   ├── product-card.tsx
│   │   ├── product-grid.tsx
│   │   ├── product-gallery.tsx
│   │   ├── product-info.tsx
│   │   ├── product-actions.tsx
│   │   ├── quantity-selector.tsx
│   │   ├── product-reviews.tsx
│   │   └── related-products.tsx
│   │
│   ├── cart/
│   │   ├── cart-item.tsx
│   │   ├── cart-summary.tsx
│   │   ├── coupon-form.tsx
│   │   └── cart-drawer.tsx
│   │
│   ├── checkout/
│   │   ├── checkout-form.tsx
│   │   ├── customer-form.tsx
│   │   ├── shipping-form.tsx
│   │   ├── payment-method.tsx
│   │   └── order-summary.tsx
│   │
│   ├── tracking/
│   │   ├── tracking-search.tsx
│   │   ├── tracking-timeline.tsx
│   │   └── tracking-event.tsx
│   │
│   ├── admin/
│   │   ├── admin-sidebar.tsx
│   │   ├── admin-header.tsx
│   │   ├── stat-card.tsx
│   │   ├── data-table.tsx
│   │   ├── sales-chart.tsx
│   │   ├── order-status-chart.tsx
│   │   ├── category-chart.tsx
│   │   ├── product-form.tsx
│   │   ├── category-form.tsx
│   │   ├── order-status-control.tsx
│   │   ├── tracking-editor.tsx
│   │   ├── invoice-preview.tsx
│   │   └── audit-log.tsx
│   │
│   └── providers/
│       ├── auth-provider.tsx
│       ├── cart-provider.tsx
│       └── toast-provider.tsx
│
├── lib/
│   ├── auth/
│   │   ├── config.ts
│   │   ├── permissions.ts
│   │   └── session.ts
│   │
│   ├── db/
│   │   ├── prisma.ts
│   │   └── queries/
│   │
│   ├── email/
│   │   ├── client.ts
│   │   ├── templates/
│   │   └── send.ts
│   │
│   ├── invoice/
│   │   ├── generate.ts
│   │   └── template.tsx
│   │
│   ├── pricing/
│   │   ├── calculate.ts
│   │   ├── discounts.ts
│   │   └── shipping.ts
│   │
│   ├── validation/
│   │   ├── product.ts
│   │   ├── checkout.ts
│   │   ├── order.ts
│   │   └── coupon.ts
│   │
│   ├── storage/
│   │   └── uploads.ts
│   │
│   ├── analytics/
│   │   └── queries.ts
│   │
│   ├── security/
│   │   ├── rate-limit.ts
│   │   └── audit.ts
│   │
│   ├── utils.ts
│   └── constants.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── emails/
│   ├── order-received.tsx
│   ├── order-confirmed.tsx
│   ├── order-packed.tsx
│   ├── order-shipped.tsx
│   ├── order-out-for-delivery.tsx
│   ├── order-delivered.tsx
│   ├── order-cancelled.tsx
│   └── password-reset.tsx
│
├── public/
│   ├── brand/
│   │   ├── logo.svg
│   │   ├── logo-mark.svg
│   │   └── favicon.ico
│   ├── images/
│   │   ├── hero/
│   │   ├── categories/
│   │   └── editorial/
│   └── icons/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── docs/
    ├── setup.md
    ├── deployment.md
    ├── database.md
    ├── email.md
    └── admin-guide.md
```

The agent may adapt this structure when a framework/library requires it, but must preserve the architectural separation of:

- UI
- business logic
- database
- authentication
- validation
- email
- invoices
- storage
- analytics
- security

Do not create one enormous component or one enormous API file.

---

# 104. PAGE → COMPONENT → DATA MAP

The agent must keep a clear relationship between pages, reusable components, and data.

```text
HOME
 ├── Hero
 ├── Categories
 ├── New Arrivals
 ├── Editorial
 ├── Best Sellers
 ├── Offers
 ├── Why Mini Street
 ├── Social
 ├── Reviews
 └── Newsletter

SHOP
 ├── Filters
 ├── Sort
 └── Product Grid
       └── Product Card

PRODUCT
 ├── Gallery
 ├── Product Info
 ├── Quantity
 ├── Cart Actions
 ├── Description
 ├── Reviews
 └── Related Products

CART
 ├── Cart Items
 ├── Coupon
 └── Summary

CHECKOUT
 ├── Customer Form
 ├── Shipping Form
 ├── Payment
 └── Order Summary

TRACKING
 ├── Tracking Search
 ├── Current Status
 └── Timeline

ADMIN DASHBOARD
 ├── Stats
 ├── Revenue Chart
 ├── Order Chart
 ├── Category Chart
 └── Top Products

ADMIN PRODUCT
 ├── Product Form
 ├── Image Manager
 ├── Pricing
 ├── Inventory
 └── SEO

ADMIN ORDER
 ├── Customer
 ├── Products
 ├── Totals
 ├── Status
 ├── Tracking
 ├── Timeline
 └── Invoice
```

---

# 105. DESIGN REFERENCE RULES

When choosing visual references, use major e-commerce sites only for UX patterns such as:

- Product discovery
- Search
- Filtering
- Product card hierarchy
- Cart behavior
- Checkout flow
- Order tracking

Do NOT reproduce another company's:

- Logo
- Brand identity
- Exact layout
- Exact copy
- Exact colors
- Exact components
- Copyrighted imagery

Mini Street must remain an original brand.

---

# 106. REQUIRED DESIGN REVIEW BEFORE CODING

Before implementing each major page, internally establish:

```text
PAGE
 ↓
Purpose
 ↓
Primary user action
 ↓
Information hierarchy
 ↓
Desktop composition
 ↓
Mobile composition
 ↓
Components
 ↓
Database data
 ↓
Loading state
 ↓
Empty state
 ↓
Error state
 ↓
Accessibility
 ↓
SEO
```

Then implement.

Do not blindly copy the ASCII diagrams. They are structural references to preserve information hierarchy.

---

# 107. REQUIRED IMAGE ASSET ORGANIZATION

When real assets are provided:

```text
public/
└── brand/
    ├── logo.svg
    ├── logo-light.svg
    └── favicon.svg

public/
└── images/
    ├── hero/
    ├── categories/
    ├── editorial/
    └── placeholders/
```

Actual product images should preferably come from the configured image storage provider.

Use `next/image` or equivalent optimized image loading.

---

# 108. REQUIRED AI IMAGE ASSET LIST

If generated assets are required, create the following set consistently:

```text
Hero:
01-signature-jewelry
02-pink-jewelry-editorial
03-accessories-lifestyle
04-combo-set-editorial

Categories:
01-earrings
02-bracelets
03-necklaces
04-rings
05-watches
06-handchains
07-handcuffs
08-combo-sets

Editorial:
01-everyday-sparkle
02-gift-moment
03-mini-street-details
```

All assets must share:

- Same visual world
- Same lighting language
- Same cream/pastel palette
- Premium photography quality
- No embedded text
- No fake brand logo
- No watermark

---

# 109. FINAL AGENT STARTUP PROTOCOL

When the AI agent starts work, it MUST follow this sequence:

```text
STEP 1
Read AGENT.md completely.

STEP 2
Inspect repository structure.

STEP 3
Inspect package.json and existing dependencies.

STEP 4
Inspect all existing source files.

STEP 5
Inspect supplied Mini Street logo/assets.

STEP 6
Identify what already exists and what is missing.

STEP 7
Create a short implementation plan.

STEP 8
Implement foundation/design system.

STEP 9
Implement database/schema.

STEP 10
Implement customer storefront.

STEP 11
Implement cart/checkout/order system.

STEP 12
Implement tracking.

STEP 13
Implement admin.

STEP 14
Implement invoices/emails.

STEP 15
Implement security/SEO/accessibility.

STEP 16
Run lint/typecheck/tests/build.

STEP 17
Fix all errors.

STEP 18
Perform end-to-end acceptance testing.

STEP 19
Only then report completion.
```

If the repository is empty, initialize the project using the architecture specified in this document.

If the repository already contains an application, do NOT delete it blindly. Reuse compatible components and migrate carefully.

---

# 110. IMPORTANT — DO NOT TURN THE WIREFRAMES INTO A LOW-FIDELITY SITE

The ASCII wireframes above define:

- Information hierarchy
- Section ordering
- Major component placement
- Required functionality

They do NOT mean:

- Plain boxes
- Basic Bootstrap styling
- Generic cards
- Default Tailwind colors
- Unstyled tables
- No animations

The final UI must still look like a polished premium fashion/jewelry e-commerce website.

Think:

> "Luxury boutique meets modern high-conversion e-commerce."

Not:

> "Admin template with pink colors."
