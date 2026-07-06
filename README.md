# Farm & Family — Full-Stack Farm-to-Consumer Platform

A working full-stack scaffold for the Farm & Family D2C agricultural e-commerce ecosystem: real backend API + a complete multi-page frontend, wired together end to end.

## What's included

**Backend** (`/backend`) — Node.js + Express REST API
- Auth (JWT) for customers, farmers, wholesale buyers, admins
- Products, categories, farm-fresh-today, search & filters
- **Traceability API** — every product has a `/trace` endpoint (what a QR code would resolve to): farm, farmer, cultivation method, harvest timeline
- Farmer profiles + a farmer self-service dashboard (orders, earnings, low-stock alerts)
- Cart, checkout & order placement with stock decrement and status tracking
- Wholesale portal: bulk pricing tiers + inquiry form
- AI nutrition assistant & natural-language search (rule-based out of the box; automatically upgrades to real Claude if you set `ANTHROPIC_API_KEY`)
- Simple recommendation engine based on past order categories
- Newsletter / harvest-notification signup
- Zero native dependencies — data persists to a JSON file (`backend/data/db.json`), so it installs and runs anywhere instantly. Swap `db.js` for a real database later without touching route code.

**Frontend** (`/frontend`) — plain HTML/CSS/JS (no build step required)
- Home, Shop (with filters/search/sort), Product detail, Traceability/QR-landing page, Farmer directory + profiles, Cart, Checkout, Login/Register, Account & order tracking, Wholesale portal, Farmer dashboard, Admin overview, About
- Brand system: forest green + turmeric gold + natural beige, Fraunces/Work Sans/IBM Plex Mono type, and a signature "Harvest Passport" component (the stamped traceability card) reused across product cards, product pages, and the QR trace page

## Running it

```bash
cd backend
npm install
npm run seed      # generates backend/data/db.json (also runs automatically on first `npm start`)
npm start         # -> http://localhost:4000
```

The Express server serves the frontend as static files too, so opening `http://localhost:4000` gives you the whole site — no separate frontend server needed.

To enable real AI-generated nutrition-assistant answers, set an environment variable before starting:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm start
```
Without it, the assistant still works using a transparent rule-based matcher.

## Demo accounts
Create your own via `register.html` (role: customer / farmer / wholesale). There's also a basic `admin.html` — register with role `admin` via a direct API call if you want to see it:
```bash
curl -X POST http://localhost:4000/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@farmandfamily.in","password":"password123","role":"admin"}'
```

## What's scaffolded vs. production-ready
This is a genuine working MVP covering the platform's core differentiators (traceability, farm-fresh-today, farmer marketplace, wholesale, AI assistant). For a production launch you'd still want to add: a real database (Postgres/Mongo), payment gateway integration (Razorpay/Stripe), real QR code generation & printing, image uploads, an actual logistics/cold-chain integration, and production-grade auth (refresh tokens, email verification, rate limiting on auth routes).

## Project structure
```
farm-and-family/
├── backend/
│   ├── server.js          # Express app entry point
│   ├── db.js               # JSON-file datastore wrapper
│   ├── middleware/auth.js
│   ├── routes/             # auth, products, categories, farmers, cart, orders, wholesale, ai, newsletter
│   └── data/seed.js        # seed data (farmers, products, traceability timelines)
└── frontend/
    ├── index.html, shop.html, product.html, trace.html, farmers.html, farmer.html,
    │   cart.html, checkout.html, login.html, register.html, account.html,
    │   wholesale.html, about.html, farmer-dashboard.html, admin.html
    ├── css/main.css
    └── js/api.js, auth.js, layout.js, render.js
```
