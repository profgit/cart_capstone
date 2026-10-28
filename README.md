# Capstone Reference Implementation — Mini Store

This is a complete, working reference build of the "Mini E-Commerce Storefront"
capstone. It satisfies every requirement in the capstone project document,
plus the graduate "Separating Rendering Concerns" extension by construction.

**Use this to:**
- Grade student submissions against a known-correct implementation
- Demo the finished product live in class before students start
- See one reasonable way to structure the cart object, the fetch/merge
  pattern, and the independent rendering functions

This is **one valid solution, not the only one.** Students may structure
their code differently and still fully satisfy the spec.

---

## If the Live API Is Ever Down

This project uses a free, third-party service with no published uptime guarantee. A `products-fallback.json` file is included in this folder, matching the real API's response shape (8 products, 3 categories, wrapped in a `products` property).

If needed, change one line inside `loadProducts()`:

```js
// Normal — the live API
const response = await fetch("https://dummyjson.com/products");
```

```js
// Temporary fallback
const response = await fetch("products-fallback.json");
```

## Running It (No Build Step, No Install Required)

This is plain HTML/CSS/JS — the same stack the whole course uses. There is
nothing to `npm install`.

**Recommended: serve it locally instead of double-clicking `index.html`.**
Opening the file directly (`file://...`) can cause the browser to block the
`fetch()` call in some browsers due to CORS restrictions on local files.
Any of the following work:

```
npx serve .
```
*(uses Node, already installed since Lab 1 — no global install needed)*

```
python3 -m http.server 8000
```

Or open the folder in VS Code and use the **Live Server** extension.

Then visit the printed local address (e.g. `http://localhost:3000` or
`http://localhost:8000`) in your browser.

**You need an internet connection.** This project fetches real data from
`https://dummyjson.com/products` on every load — that's the point.

---

## What To Test (Maps Directly to the Grading Checklist)

Walk through these in order — each one demonstrates a specific required
behavior that the others can't prove on their own.

| # | What to do | What you should see |
|---|---|---|
| 1 | Load the page | Briefly, "Loading products…", then a full grid of real products |
| 2 | Look at the grid | One product with a red **Sale** badge and struck-through original price; one product with a gray **Out of Stock** badge and a disabled button |
| 3 | Click **Add to Cart** on two different products | Cart count in the header updates immediately; cart panel lists both items with correct subtotals and a correct total |
| 4 | Click **Add to Cart** on the same product twice | Quantity increases to 2 — no duplicate row |
| 5 | Click the **−** button until an item's quantity hits 0 | That item disappears from the cart entirely |
| 6 | Remove all items | Cart panel shows "Your cart is empty." |
| 7 | Change the category dropdown | Grid updates instantly; open DevTools Console — no new network request fires (it's filtering the already-fetched data, not re-fetching) |
| 8 | Change the sort dropdown | Grid re-orders by price correctly |
| 9 | Click **Place Order** with an empty cart | Blocked, with a clear message — does not proceed |
| 10 | Add an item, then submit checkout with the email field empty or invalid | Blocked, with a validation message |
| 11 | Fill in all three checkout fields correctly and submit | Success message showing the correct item count and total; cart empties afterward |
| 12 | Resize the browser to a phone width (~375px) | Product grid becomes a single column; layout stays usable |

### Demoing the Error State Live (Good for Class)

This is the most convincing moment to show students, and it's easy to do live:

1. Open DevTools → **Network** tab
2. Change the throttling dropdown from "No throttling" to **Offline**
3. Reload the page
4. Point out the friendly error message appearing instead of a blank page or
   a raw red console error
5. Switch back to "No throttling" and reload again to restore normal behavior

This is the exact technique from Lab 10's graduate extension, reused here.

---

## Where Each Requirement Lives in the Code

| Requirement | Where to look |
|---|---|
| Fetch + merge with demo overrides | `script.js`, `loadProducts()` |
| Loading state | `script.js`, top of `loadProducts()` |
| Error state (tested via offline mode) | `script.js`, `catch` block in `loadProducts()` |
| Cart object (add/decrease/remove/total/count) | `script.js`, the `cart` object |
| Independent rendering (graduate extension) | `script.js` — `renderProducts()` and `renderCartSummary()` never call each other or `loadProducts()` |
| Filter/sort without re-fetching | `script.js`, `getVisibleProducts()` |
| Checkout validation | `script.js`, the `checkoutForm` submit handler |
| Semantic layout | `index.html` — `header`, `main`, `aside`, `footer` |
| Accessible form labels | `index.html` — every input/select has a matching `<label for>` |
| Flexbox product grid + responsive breakpoints | `styles.css`, `.product-grid` and the two `@media` blocks |
| Absolutely positioned badge | `styles.css`, `.product-card` (relative) and `.badge` (absolute) |
| Sticky header | `styles.css`, `.site-header` |

---

## Verified Before Delivery

- `script.js` passes a Node syntax check (`node --check script.js`) with no errors.
- The core cart logic (add, duplicate-add increments quantity, sale pricing,
  decrease-to-zero removal, direct removal, total/count math, and a
  defensive check against a nonexistent id) was extracted and run against
  14 automated assertions — all 14 passed.
- Every form control in `index.html` has a correctly matching `<label for>`.
- `styles.css` was checked for balanced braces and confirmed to include
  `box-sizing: border-box`, a `position: relative`/`position: absolute`
  pairing, a sticky header, five `:hover` states, and two responsive
  breakpoints.
- The API endpoint and response shape (a `products` array — alongside
  `total`, `skip`, `limit` pagination fields — of objects with `id`,
  `title`, `price`, `category`, `description`, `thumbnail`) were confirmed
  live before this was built against it.

**What was not (and could not be) tested here:** an actual live fetch inside
a real browser, since this was built in a sandboxed environment without
browser or live network access. Run it yourself using the instructions
above to confirm the live network behavior on your machine.

---

## Deploying This Reference to GitHub Pages (Optional)

If you'd like a live demo URL to show students instead of running it locally:

1. Push this folder to a new GitHub repository.
2. Go to the repository's **Settings → Pages**, set the source branch to `main`.
3. Wait for the build, then open the URL GitHub provides.

No configuration changes are needed — this project has no build step.

---

## Notes on Grading Student Submissions

- Students are free to structure their code differently than this
  reference. Grade against the **requirements in the capstone document**,
  not against this file's exact structure or naming.
- The one thing worth checking structurally, not just behaviorally: that
  students genuinely used `fetch()` against a real API rather than
  hard-coding a product array and simulating a fetch. Opening their
  `script.js` should show a real `await fetch(...)` call.
- This reference build is plain JavaScript throughout, matching the scope
  of this project (Labs 1–10) — no TypeScript or build step is expected.
