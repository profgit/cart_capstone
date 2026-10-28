/* =========================================================================
   Mini Store — Capstone Reference Implementation
   Web Development I

   This file satisfies every requirement in the capstone spec, and its
   structure already satisfies the graduate "separating rendering concerns"
   extension: loadProducts(), renderProducts(), and renderCartSummary() are
   three independent functions. Adding an item to the cart calls only
   renderCartSummary() — it never re-fetches and never re-runs
   renderProducts().
   ========================================================================= */

/* ---- Demo overrides -----------------------------------------------------
   The real API has no idea which products WE want to mark on sale or out
   of stock for this demo. These ids were chosen after inspecting a real
   response from https://dummyjson.com/products — open that URL yourself
   to see the ids currently available. */
const demoOverrides = {
  1: { onSale: true, salePrice: 89.99 },
  4: { inStock: false },
  7: { onSale: true, salePrice: 15.99 },
  14: { inStock: false },
};

let products = [];           // the fetched + merged catalog
let currentCategory = "all";
let currentSort = "default";

/* ---- The cart: state + the only methods allowed to change it ---------- */
const cart = {
  items: [], // each entry: { id, name, price, quantity }

  addItem(product) {
    const existing = this.items.find((i) => i.id === product.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: effectivePrice(product),
        quantity: 1,
      });
    }
    this.render();
  },

  decreaseItem(id) {
    const existing = this.items.find((i) => i.id === id);
    if (!existing) {
      console.warn(`decreaseItem: no cart entry found for id ${id}`);
      return;
    }
    existing.quantity--;
    if (existing.quantity <= 0) {
      this.items = this.items.filter((i) => i.id !== id);
    }
    this.render();
  },

  removeItem(id) {
    this.items = this.items.filter((i) => i.id !== id);
    this.render();
  },

  getTotal() {
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  getItemCount() {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  },

  render() {
    renderCartSummary(this.items, this.getTotal(), this.getItemCount());
  },
};

/* ---- DOM references ----------------------------------------------------- */
const productGrid = document.querySelector("#product-grid");
const statusMessage = document.querySelector("#status-message");
const categoryFilter = document.querySelector("#category-filter");
const sortSelect = document.querySelector("#sort-select");
const cartItemsEl = document.querySelector("#cart-items");
const cartTotalEl = document.querySelector("#cart-total");
const cartCountEl = document.querySelector("#cart-count");
const checkoutForm = document.querySelector("#checkout-form");
const checkoutMessage = document.querySelector("#checkout-message");

/* ---- Part 1: fetch, merge, and hand off to rendering -------------------- */
async function loadProducts() {
  statusMessage.textContent = "Loading products…";
  productGrid.innerHTML = "";

  try {
    const response = await fetch("https://dummyjson.com/products");
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    // This API wraps its array inside a "products" property (alongside
    // pagination info: total, skip, limit), rather than returning a bare
    // array directly — hence .products rather than using the body as-is.
    const data = await response.json();
    const raw = data.products;

    products = raw.map((item) => {
      const overrides = demoOverrides[item.id] || {};
      return {
        id: item.id,
        name: item.title,
        price: item.price,
        category: item.category,
        inStock: true,
        onSale: false,
        ...overrides,
      };
    });

    populateCategoryFilter(products);
    statusMessage.textContent = "";
    renderProducts(getVisibleProducts());
  } catch (error) {
    // Deliberately trigger this in DevTools: Network panel → Offline → reload.
    console.error("loadProducts failed:", error);
    statusMessage.textContent =
      "Couldn't load products right now. Please check your connection and try again.";
  }
}

function populateCategoryFilter(list) {
  const categories = [...new Set(list.map((p) => p.category))];
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    categoryFilter.appendChild(option);
  });
}

function effectivePrice(product) {
  return product.onSale ? product.salePrice : product.price;
}

function getVisibleProducts() {
  let list = [...products];

  if (currentCategory !== "all") {
    list = list.filter((p) => p.category === currentCategory);
  }

  if (currentSort === "asc") {
    list = [...list].sort((a, b) => effectivePrice(a) - effectivePrice(b));
  } else if (currentSort === "desc") {
    list = [...list].sort((a, b) => effectivePrice(b) - effectivePrice(a));
  }

  return list;
}

/* ---- Rendering: products (independent of cart rendering) ---------------- */
function renderProducts(list) {
  productGrid.innerHTML = "";

  if (list.length === 0) {
    productGrid.innerHTML = "<p>No products match this filter.</p>";
    return;
  }

  list.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    let badgeHtml = "";
    if (product.onSale) {
      badgeHtml = `<span class="badge badge-sale">Sale</span>`;
    } else if (!product.inStock) {
      badgeHtml = `<span class="badge badge-stock">Out of Stock</span>`;
    }

    const priceHtml = product.onSale
      ? `<span class="price-original">$${product.price.toFixed(2)}</span>` +
        `<span class="price-sale">$${product.salePrice.toFixed(2)}</span>`
      : `<span class="price">$${product.price.toFixed(2)}</span>`;

    card.innerHTML = `
      ${badgeHtml}
      <h3 class="product-name">${escapeHtml(product.name)}</h3>
      <p class="product-category">${escapeHtml(product.category)}</p>
      <p class="product-price">${priceHtml}</p>
      <button class="add-to-cart-btn" data-id="${product.id}" ${product.inStock ? "" : "disabled"}>
        ${product.inStock ? "Add to Cart" : "Out of Stock"}
      </button>
    `;

    productGrid.appendChild(card);
  });
}

/* ---- Rendering: cart summary (independent of product rendering) -------- */
function renderCartSummary(items, total, count) {
  cartItemsEl.innerHTML = "";

  if (items.length === 0) {
    cartItemsEl.innerHTML = `<li class="cart-empty">Your cart is empty.</li>`;
  } else {
    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "cart-item";
      li.innerHTML = `
        <span>${escapeHtml(item.name)} &times; ${item.quantity}</span>
        <span>$${(item.price * item.quantity).toFixed(2)}</span>
        <button class="qty-btn" data-action="decrease" data-id="${item.id}" aria-label="Decrease quantity">&minus;</button>
        <button class="qty-btn" data-action="remove" data-id="${item.id}" aria-label="Remove item">&times;</button>
      `;
      cartItemsEl.appendChild(li);
    });
  }

  cartTotalEl.textContent = total.toFixed(2);
  cartCountEl.textContent = count;
}

/* A minimal safeguard against product/category text breaking the markup. */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---- Event wiring --------------------------------------------------------
   Event delegation: one listener per container, not one per card/button. */
productGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".add-to-cart-btn");
  if (!button) return;

  const id = Number(button.dataset.id);
  const product = products.find((p) => p.id === id);
  if (!product) {
    console.warn(`Add to Cart clicked, but product ${id} was not found.`);
    return;
  }
  cart.addItem(product);
});

cartItemsEl.addEventListener("click", (event) => {
  const button = event.target.closest(".qty-btn");
  if (!button) return;

  const id = Number(button.dataset.id);
  if (button.dataset.action === "decrease") {
    cart.decreaseItem(id);
  } else if (button.dataset.action === "remove") {
    cart.removeItem(id);
  }
});

categoryFilter.addEventListener("change", (event) => {
  currentCategory = event.target.value;
  renderProducts(getVisibleProducts()); // does NOT re-fetch, does NOT touch the cart
});

sortSelect.addEventListener("change", (event) => {
  currentSort = event.target.value;
  renderProducts(getVisibleProducts());
});

checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (cart.items.length === 0) {
    checkoutMessage.textContent = "Your cart is empty — add something before checking out.";
    checkoutMessage.className = "checkout-message checkout-error";
    return;
  }

  if (!checkoutForm.checkValidity()) {
    checkoutMessage.textContent = "Please fill in all required fields with valid information.";
    checkoutMessage.className = "checkout-message checkout-error";
    return;
  }

  const total = cart.getTotal().toFixed(2);
  const count = cart.getItemCount();
  checkoutMessage.textContent = `Thanks! Your order of ${count} item(s) totaling $${total} has been placed.`;
  checkoutMessage.className = "checkout-message checkout-success";

  cart.items = [];
  cart.render();
  checkoutForm.reset();
});

document.querySelector("#cart-toggle").addEventListener("click", () => {
  document.querySelector("#cart-panel").scrollIntoView({ behavior: "smooth" });
});

/* ---- Kick things off ----------------------------------------------------- */
loadProducts();
cart.render();
