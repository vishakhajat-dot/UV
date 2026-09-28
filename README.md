# Mahalaxmi Auto Agency — Website

A full website for Mahalaxmi Auto Agency (Pune) with a product catalog, cart & order/quote
checkout, WhatsApp/email/call contact links, automatic PDF bill generation, and an admin panel
to manage products and orders.

Stack: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma + PostgreSQL (Neon).

## Running locally

```bash
npm install
npm run db:push     # creates the local SQLite database from prisma/schema.prisma
npm run db:seed      # loads sample categories & products
npm run dev
```

Open http://localhost:3000 for the storefront, and http://localhost:3000/admin/login for the
admin panel.

Default admin login is set via `ADMIN_USERNAME` / `ADMIN_PASSWORD` in your local `.env` file
(not committed to this repo). Change these to a strong, unique password before going live.

## What's included

- **Home / About / Contact** pages with the real business details (address, phone, email,
  distributed brands, embedded Google Map, click-to-call, mailto and WhatsApp deep links).
- **Product catalog** with category filter + search, product detail pages, and an
  "ask about this product on WhatsApp" link on every product.
- **Cart & Checkout** (client-side cart, no payment gateway per your choice) — customers fill in
  their delivery/shop details and preferred payment method (Cash on Delivery / Bank Transfer /
  UPI on delivery / Pay at pickup), and submit an order request.
- **Order confirmation page** with a "Confirm Order on WhatsApp" button (pre-filled message with
  the order summary) and a **downloadable/printable PDF bill** for every order.
- **Admin panel** (`/admin`) protected by a login — manage products (add/edit/delete, stock,
  pricing, featured flag) and view/manage orders (update status, mark paid/unpaid, message the
  customer on WhatsApp, download the bill).

## Billing & shop management (admin)

The admin panel (`/admin`) also works as a Vyapar-style billing app:

- **Bills** (`/admin/billing`): GST tax invoices numbered `MAA/2026-27/0001` per financial year.
  CGST + SGST for Maharashtra customers, IGST for other states, rates with or without GST, per-item
  discount, round-off, amount in words, part payments. The PDF prints the logo, agency name, owner
  name and email, GSTIN, bank/UPI details and terms. Cancelling a bill keeps its number (marked
  CANCELLED) and returns the stock. Website orders have a **Create GST Bill** button.
- **Customers**: saved automatically from bills (by phone number) or added by hand, with total
  billed, balance due and a WhatsApp payment reminder.
- **Items**: selling price, purchase/cost price (admin only, never sent to the storefront), HSN
  code, GST rate, low-stock alert level and photo upload (resized in the browser, stored in the
  database, served from `/api/products/<id>/image`).
- **Stock**: stock in (purchases, which update the weighted-average cost), corrections, full
  movement history, stock value and low/out-of-stock lists. Bills reduce stock automatically.
- **Expenses** and **Profit & Loss**: sales before GST, cost of goods sold, gross and net profit,
  item-wise profit and a GST summary (CGST/SGST/IGST, B2B vs B2C) for any date range.
- **Settings**: everything printed on bills (GSTIN, name on bill, bank details, bill number prefix,
  terms), editable without a redeploy.

## Editing your real product catalog

The seed data (`prisma/seed.js`) includes placeholder products per brand/category with estimated
prices — **update prices and details from the Admin → Products panel** once the site is running,
or edit `prisma/seed.js` and re-run `npm run db:seed`.

## Environment variables (`.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Database connection string (`file:./dev.db` for local SQLite) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin panel login |
| `AUTH_SECRET` | Random secret used to sign admin login sessions — change this before going live |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp number in international format, no `+` or spaces (e.g. `919209351647`) |
| `NEXT_PUBLIC_PHONE_PRIMARY` / `_SECONDARY` | Click-to-call numbers |
| `NEXT_PUBLIC_EMAIL` | Contact email |
| `NEXT_PUBLIC_ADDRESS` | Shown in the footer, contact page and on the map |
| `INVOICE_OWNER_NAME` | Optional. Default name printed on bills until it is set in Admin → Settings (defaults to Utkarsh Chavan) |

## Deploying (when you're ready)

This app is deploy-ready for **Vercel** (free tier):

1. Push this folder to a GitHub repository.
2. Import it in Vercel.
3. **Important:** SQLite files don't persist on serverless hosting. Before deploying, create a
   free Postgres database (e.g. [Neon](https://neon.tech) or [Supabase](https://supabase.com)),
   then in `prisma/schema.prisma` change:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   and set `DATABASE_URL` in Vercel's environment variables to your Postgres connection string.
4. Set all the `.env` variables above in Vercel's project settings (use a strong random
   `AUTH_SECRET` and a real admin password).
5. After the first deploy, run `npx prisma db push` and `npx prisma db seed` locally pointed at
   the production `DATABASE_URL` (or via Vercel's CLI) to create tables and initial data.
6. Point your domain at the Vercel project.

## Notes

- No online payment gateway is integrated (per your choice) — checkout collects an order request
  and generates a bill; payment is coordinated directly with the customer (cash, bank transfer,
  UPI, or pay at pickup).
- The site is fully responsive and works well on mobile browsers; customers can also
  "Add to Home Screen" on most phones for quicker access, even without a dedicated app.
