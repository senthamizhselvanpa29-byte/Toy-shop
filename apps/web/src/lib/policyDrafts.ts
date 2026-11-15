// Suggested text for the shop's policy pages. The owner can change every word in
// Owner area → Settings → Policy pages; until then these are shown.
//
// Words in {curly brackets} are filled in from the shop's settings, so the pages
// stay right when the owner changes their phone number, return days, etc.
// Formatting: "## " starts a heading, "- " a bullet point, **bold**, and an
// empty line starts a new paragraph.

export const PAGE_SLUGS = ["contact", "privacy", "terms", "refunds", "shipping"] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];
export const POLICY_SLUGS = ["privacy", "terms", "refunds", "shipping"] as const;

export function isPageSlug(value: string): value is PageSlug {
  return (PAGE_SLUGS as readonly string[]).includes(value);
}

export const PLACEHOLDERS = [
  { key: "shop_name", label: "Shop name" },
  { key: "legal_name", label: "Business name on invoices" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "whatsapp", label: "WhatsApp number" },
  { key: "address", label: "Address" },
  { key: "state", label: "State" },
  { key: "grievance_officer", label: "Grievance officer" },
  { key: "return_days", label: "Days for returns" },
  { key: "delivery_fee", label: "Delivery fee" },
  { key: "free_delivery_above", label: "Free delivery from" },
] as const;
export type PlaceholderKey = (typeof PLACEHOLDERS)[number]["key"];

export const PAGE_DRAFTS: Record<PageSlug, { title: string; body: string }> = {
  contact: {
    title: "Contact us",
    body: `We're happy to help with orders, delivery, returns or choosing the right toy. Message us on WhatsApp, call or email — we usually reply within one working day.`,
  },
  privacy: {
    title: "Privacy policy",
    body: `This policy explains what information {legal_name} ("we") collects when you use the {shop_name} website, and how we use and protect it.

## What we collect
- **Account details:** your email address or mobile number, used to log in.
- **Order details:** your name, phone number, delivery address and the toys you order.
- **Payment details:** online payments are handled by Razorpay. We never see or store your card, UPI or bank details.
- **Basic website data:** small files in your browser (cookies and local storage) that keep you logged in and remember your cart and language.

## How we use it
- To deliver your order and keep you updated about it.
- To answer your questions, returns and refunds.
- To keep proper accounts and invoices, as the law requires.

We do not sell your information, and we do not send you advertising without your permission.

## Who we share it with
Only what is needed to run the shop: delivery partners (your name, phone and address), Razorpay (to take payments) and the companies that host this website and its database. All of them must keep your information safe.

## How long we keep it
Order and invoice records are kept for as long as Indian tax laws require (usually 8 years). You can ask us to delete your account at any time; we then remove everything we don't have to keep.

## Your choices
You can see and change your details in My account. To get a copy of your information, correct it or delete it, contact us at {email}.

## Children
Our toys are for children, but our website is for parents and adults. Children should not create accounts or place orders.

## Grievance officer
If you have a concern about your information, contact our grievance officer, {grievance_officer}, at {email} or {phone}. We reply within 48 hours and resolve complaints within one month.

## Changes
If we change this policy, the new version will appear on this page.`,
  },
  terms: {
    title: "Terms & conditions",
    body: `These terms apply when you shop at {shop_name}, run by {legal_name}, {address}. By placing an order you agree to them.

## Who can order
You must be 18 or older to place an order. Children may use the toys, but parents or guardians place the orders.

## Toys and prices
- Prices are in Indian Rupees (₹) and include all taxes that apply.
- We try to show every toy correctly. Colours can look slightly different on screens, and photos are for illustration.
- Age suggestions are a guide. Please read the safety notes on the box and supervise young children, especially with small parts, balloons and batteries.

## Orders
- Your order is confirmed when you receive the order confirmation on this website.
- We may cancel an order if a toy is out of stock or a price was shown wrongly. If you have already paid, you get a full refund.

## Payment
Pay online through Razorpay (UPI, cards, net banking, wallets) or, where offered, cash on delivery.

## Delivery, cancellations and returns
See our Shipping & delivery and Cancellation & refunds pages.

## Our responsibility
We are responsible for delivering the toys you ordered in good condition. We are not responsible for delays caused by events outside our control, such as natural disasters or strikes.

## Law
These terms follow the laws of India. Any dispute will be handled by the courts of {state}.

## Contact
Questions? Email {email} or call {phone}.`,
  },
  refunds: {
    title: "Cancellation & refunds",
    body: `## Cancelling an order
You can cancel an order yourself in **My orders** until we start packing it. Once it has been packed or shipped, please contact us.

## Returns
If a toy arrives damaged, faulty or is not what you ordered, you can ask for a return within **{return_days} days** of delivery:
- Go to **My orders**, open the order and tap **Request a return**, telling us what went wrong.
- Keep the toy unused, with its box, tags and any free gifts.
- If something arrived broken, please send us photos within 48 hours of delivery.

We arrange the pickup, or tell you where to send the toy.

## Refunds
- **Paid online:** the money goes back to the same card, UPI or bank account, usually within 5–7 working days after we approve the return or cancellation.
- **Cash on delivery:** we refund by UPI or bank transfer to an account you give us.
- Delivery charges are refunded when the mistake was ours.

## Questions
Email {email}, call {phone} or message us on WhatsApp at {whatsapp}.`,
  },
  shipping: {
    title: "Shipping & delivery",
    body: `## Where we deliver
We deliver across India.

## Delivery charges
- Delivery costs {delivery_fee} per order.
- Orders of {free_delivery_above} or more are delivered free.

## How long it takes
- We pack orders within 1–2 working days.
- Delivery usually takes 3–7 working days after that, depending on your pincode.
- You can follow your order's progress in **My orders**.

## Cash on delivery
Cash on delivery is available for orders up to the limit shown at checkout. Please keep the exact amount ready.

## If something goes wrong
If your parcel is late, opened or damaged when it arrives, contact us at {email} or {phone}. Please check the parcel before accepting it.`,
  },
};

// Replaces {shop_name}, {phone}, … with the shop's details.
export function fillPlaceholders(text: string, values: Partial<Record<PlaceholderKey, string>>): string {
  return text.replace(/\{([a-z_]+)\}/g, (match, key: string) =>
    key in values ? (values[key as PlaceholderKey] ?? "") : match,
  );
}

// Placeholders the text uses whose value is still empty (for the owner's warning).
export function emptyPlaceholders(text: string, values: Partial<Record<PlaceholderKey, string>>): PlaceholderKey[] {
  const used = new Set([...text.matchAll(/\{([a-z_]+)\}/g)].map((m) => m[1]));
  return PLACEHOLDERS.map((p) => p.key).filter((key) => used.has(key) && !values[key]?.trim());
}
