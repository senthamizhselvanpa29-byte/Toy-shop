# 🧸 Toy Shop — Project Plan

A child-themed, full e-commerce toy shop for India. **Web app first, then Android + iOS apps.**
Built together by the shop owner and Claude.

---

## ✅ Decisions

| Topic | Decision |
|---|---|
| Who adds products | **One owner account** only, with full access |
| Shop type | **Full e-commerce** — cart, checkout, payments, orders (like Flipkart/Amazon) |
| Country / payment | **India, ₹ INR, Razorpay** (UPI, cards, net banking, wallets) + Cash on Delivery |
| Products | Built with **demo toys**; the owner replaces them with real products from the admin panel |
| Languages | **Multi-language**, built so any language can be added |
| Tech | **Next.js + Supabase** (web), **React Native + Expo** (mobile) |
| Mobile | **Android + iOS** |

---

## 1. Users

- **👑 Owner** — one secure admin account. Manages products, images, categories, orders, stock, customers, coupons and settings.
- **🛒 Customers** — sign up with **mobile OTP** or email; browse, add to cart, pay, track orders.
- **👀 Visitors** — browse without logging in; log in at checkout.

Only the owner can reach the admin panel. This is enforced in the database (Row Level Security), not just hidden in the UI.

---

## 2. Features

### 👑 Owner Admin Panel
- **Products** — add, edit, delete, draft, duplicate, hide. Fields: name, description, price, MRP (crossed-out price), discount %, category, age group, brand, stock, SKU, **GST rate**, weight (for shipping), **BIS / ISI licence number** (required for toys in India)
- **Images** — drag & drop (camera in the mobile app), multiple per product, reorder, set cover, crop, automatic compression
- **Categories** — name, icon, colour
- **Orders** — new → packed → shipped → delivered / cancelled / returned; printable **GST invoice**
- **Stock** — low-stock alerts, automatic "Out of stock"
- **Coupons** — % or ₹ off, minimum order value, expiry date
- **Customers** — list and their orders
- **Dashboard** — today's sales, orders, top toys, low stock
- **Settings** — shop name, logo, address, GSTIN, delivery charges, free-delivery threshold, COD on/off

### Making "Add / Edit Product" easy ⭐
- Step-by-step form with big, friendly inputs
- Autosave while typing
- Live preview of the product card
- Smart defaults (₹ INR, stock = 1, status = draft)
- Friendly validation messages ("Oops! Please add a price 🙂")

### 🛒 Customer Shop
- Home: banners, categories, deals, new arrivals, best sellers
- Search with suggestions; filters (age, price, category, brand, rating) and sorting
- Product page: zoomable gallery, price + MRP + % off, age badge, description, **pincode delivery check**
- Cart, wishlist, saved addresses
- Checkout: address → delivery → **Razorpay** or **Cash on Delivery**
- Order tracking, cancel/return request, downloadable invoice
- Ratings & reviews (verified buyers only)
- Order notifications (email/SMS; push in the mobile app)

---

## 3. Languages 🌏

- **Interface text** — the setup supports any language. **Launch with English, Tamil and Hindi**, then add Telugu, Kannada, Malayalam, Bengali, Marathi and more step by step.
- **Product text** — the owner writes in one language; an **"Auto-translate" button** in the admin panel fills the others, which the owner can review and correct.
- Language switcher in the header; each customer's choice is remembered.
- Fonts that display all Indian scripts correctly.

---

## 4. Child Theme 🎨

- **Colours** — sunshine yellow, sky blue, bubblegum pink, mint green on a soft cream background
- **Fonts** — rounded, playful headings (Fredoka / Baloo 2, which support Tamil and Hindi) with a clean body font
- **Style** — bubbly rounded buttons, clouds and stars, wavy dividers
- **Mascot** — 🧸 "Toby the Teddy" in empty states, loaders and success screens
- **Delight** — confetti after a successful order 🎉, wiggle on "Add to cart"
- **Categories** — 🚗 Vehicles · 🧩 Puzzles · 🧸 Soft Toys · 🎨 Art & Craft · 📚 Learning · ⚽ Outdoor · 🎮 Electronic · 👶 Baby
- **Accessible** — playful look, but clear and readable for the parents who buy

---

## 5. Tech Stack

| Part | Tool |
|---|---|
| Web | Next.js + TypeScript + Tailwind CSS |
| Mobile | React Native + Expo (Android + iOS) |
| Database / login / images | Supabase (PostgreSQL, Auth with phone OTP, Storage) |
| Payments | Razorpay, verified on the server with webhooks |
| Shipping (later) | Shiprocket for courier tracking |
| Translations | next-intl (web) / i18next (mobile) |
| Hosting | Vercel (web), Expo EAS (app builds) |
| Testing | Vitest + Playwright |

**Repo layout**

```
toy-shop/
├── apps/
│   ├── web/        → Next.js web app
│   └── mobile/     → Expo app (later)
├── packages/
│   ├── shared/     → types, validation rules, translations
│   └── theme/      → colours, fonts, design tokens
└── docs/           → plan, style guide, decisions
```

---

## 6. Data Tables

`products` · `product_images` · `categories` · `customers` · `addresses` · `carts` · `wishlists` · `orders` · `order_items` · `payments` · `coupons` · `reviews` · `translations` · `shop_settings`

---

## 7. Indian Legal Requirements ⚖️

- **Pages Razorpay requires before it activates the account** — Privacy Policy, Terms & Conditions, Refund/Cancellation, Shipping Policy, Contact Us (drafts provided; to be checked by the owner)
- **GST** — GSTIN on invoices, GST per product
- **Toy safety** — toys sold in India need **BIS certification / ISI mark**; a field is stored per product
- **Seller details** — seller name, address and grievance officer contact shown on the site

---

## 8. Roadmap 🗺️

| # | Milestone | Result |
|---|---|---|
| 1 | Setup | Repo structure, theme, Supabase, deployment pipeline |
| 2 | Design system | Buttons, cards, forms, mascot, style-guide page |
| 3 | Owner login + admin layout | Secure single-owner panel |
| 4 | **Product management** ⭐ | Add/edit/delete products, images, categories |
| 5 | **Demo products** | About 30 sample toys across all categories |
| 6 | Storefront | Home, listing, search, filters, product page |
| 7 | Customer accounts | OTP login, addresses, wishlist |
| 8 | Cart + checkout + **Razorpay** + COD | Working payments (test mode first) |
| 9 | Orders | Admin order flow, invoices, customer tracking |
| 10 | Languages | English + Tamil + Hindi, auto-translate |
| 11 | Coupons, reviews, dashboard | Extra shop features |
| 12 | Testing, polish, legal pages | Ready to launch |
| 13 | **🚀 Web launch** | Live site; owner replaces demo products |
| 14 | Mobile app | Expo app for shoppers + owner admin with camera upload |
| 15 | **📱 Store release** | Google Play + Apple App Store |

Each milestone is a separate pull request, reviewed before moving on.

---

## 9. Needed From the Owner Later

- Razorpay account (PAN, bank account, GSTIN, website URL)
- Domain name (e.g. `yourtoyshop.in`)
- Google Play developer account (one-time ~$25) and Apple Developer account (~$99/year)
- Shop name and logo (placeholder used until then)
- Real product photos and details to replace the demo items
