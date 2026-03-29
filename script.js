const products = [
  {
    id: 1,
    name: "SET - Draped twist bikini",
    price: 185,
    image: "image 1.jpg",
    description: "Sculpted high-waist silhouette and fluid wrap sarong.",
    tags: ["Best Seller", "Resort Edit"]
  },
  {
    id: 2,
    name: "SET - One-shoulder cutout monokini",
    price: 210,
    image: "image 2.jpg",
    description: "A metal ring detail and a sheer mesh sarong.",
    tags: ["Client Favorite", "Premium Fit"]
  },
  {
    id: 3,
    name: "Classic spaghetti strap one-piece",
    price: 168,
    image: "image 3.jpg",
    description: "A center starfish detail and a draped side-slit sarong.",
    tags: ["Editorial Look", "Tailored Shape"]
  },
  {
    id: 4,
    name: "Asymmetric one-shoulder swimsuit",
    price: 195,
    image: "image 4.jpg",
    description: "Contoured bodice and elongated draped sarong.",
    tags: ["Sport Luxury", "Concierge Pick"]
  }
];

let cart = JSON.parse(localStorage.getItem("cart")) || [];
cart = cart.map((item) => ({
  ...item,
  selectedForCheckout: item.selectedForCheckout !== false
}));
let latestReceipt = JSON.parse(localStorage.getItem("latestReceipt")) || null;
let orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
let currentOrderTab = "active";

function persistCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCart();
}

function persistOrderHistory() {
  localStorage.setItem("orderHistory", JSON.stringify(orderHistory));
}

function upsertOrderHistory(order) {
  const existingIndex = orderHistory.findIndex((entry) => entry.transactionId === order.transactionId);
  if (existingIndex >= 0) {
    orderHistory[existingIndex] = order;
  } else {
    orderHistory.unshift(order);
  }
  persistOrderHistory();
}

function showCartFeedback(productId, message) {
  const feedback = document.getElementById(`cartFeedback-${productId}`);
  if (!feedback) {
    return;
  }

  feedback.textContent = message;
  window.clearTimeout(feedback.dismissTimer);
  feedback.dismissTimer = window.setTimeout(() => {
    feedback.textContent = "";
  }, 2200);
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getCheckoutItems() {
  return cart.filter((item) => item.selectedForCheckout);
}

function getCheckoutTotal() {
  return getCheckoutItems().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function createReceiptId() {
  return `SWA-${Date.now().toString().slice(-8)}`;
}

function formatReceiptDate(dateString) {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getHistoryStatusLabel(status, reviewConfirmedAt) {
  if (status === "cancelled") {
    return "Cancelled";
  }

  if (status === "completed") {
    return reviewConfirmedAt ? "Thank You" : "Review";
  }

  return "Order";
}

function getActiveOrderDetails() {
  const checkoutItems = getCheckoutItems();
  if (checkoutItems.length > 0) {
    return {
      mode: "pending",
      id: "Pending confirmation",
      createdAt: new Date().toISOString(),
      status: "Awaiting payment",
      items: checkoutItems,
      total: getCheckoutTotal()
    };
  }

  if (latestReceipt && latestReceipt.items && latestReceipt.items.length > 0) {
    return {
      mode: "paid",
      id: latestReceipt.id,
      createdAt: latestReceipt.createdAt,
      status: "Paid",
      items: latestReceipt.items,
      total: Number(latestReceipt.total)
    };
  }

  return null;
}

function renderProducts() {
  const priceGrid = document.getElementById("priceGrid");
  if (!priceGrid) {
    return;
  }

  priceGrid.innerHTML = "";

  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "price-card";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="card-image" />
      <div class="card-copy">
        <div class="card-meta">
          <h3>${product.name}</h3>
<p class="price">₱${product.price}</p>
        </div>
        <p class="card-description">${product.description}</p>
        <div class="product-tags">
          ${product.tags.map((tag) => `<span>${tag}</span>`).join("")}
        </div>
        <button class="add-to-cart" type="button" onclick="addToCart(${product.id})">Add to Cart</button>
        <p class="cart-feedback" id="cartFeedback-${product.id}" aria-live="polite"></p>
      </div>
    `;
    priceGrid.appendChild(card);
  });
}

function updateCart() {
  const cartBadge = document.getElementById("cartBadge");
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartBadge) {
    cartBadge.textContent = count;
  }
}

function addToCart(id) {
  const product = products.find((item) => item.id === id);
  if (!product) {
    return;
  }

  const existing = cart.find((item) => item.id === id);
  if (existing) {
    existing.quantity += 1;
    existing.selectedForCheckout = true;
  } else {
    cart.push({ ...product, quantity: 1, selectedForCheckout: true });
  }

  persistCart();
  showCartFeedback(id, "1 item added to cart.");
}

function goToCollection() {
  window.location.href = "index.html#collection";
}

function viewCart() {
  window.location.href = "cart.html";
}

function openOrderDetails() {
  const modal = document.getElementById("orderDetailsModal");
  if (!modal) {
    window.location.href = "payment.html";
    return;
  }

  modal.style.display = "block";
  setOrderTab(currentOrderTab);
}

function closeOrderDetails() {
  const modal = document.getElementById("orderDetailsModal");
  if (!modal) {
    return;
  }

  modal.style.display = "none";
}

function setOrderTab(tab) {
  currentOrderTab = tab;

  const tabs = Array.from(document.querySelectorAll("#orderDetailsModal .order-tab"));
  tabs.forEach((button) => button.classList.remove("active"));

  const tabIndex = tab === "active" ? 0 : tab === "cancelled" ? 1 : 2;
  if (tabs[tabIndex]) {
    tabs[tabIndex].classList.add("active");
  }

  renderOrderDetails();
}

function goToCheckout() {
  if (cart.length === 0) {
    return;
  }

  window.location.href = "payment.html";
}

function proceedToPayment() {
  if (getCheckoutItems().length === 0) {
    return;
  }

  window.location.href = "payment.html";
}

function notifyCustomRequest() {
  window.location.href = "contact.html";
}

function confirmPayment() {
  const checkoutItems = getCheckoutItems();
  if (checkoutItems.length === 0) {
    return;
  }

  const receiptId = createReceiptId();
  latestReceipt = {
    id: receiptId,
    transactionId: receiptId,
    createdAt: new Date().toISOString(),
    items: checkoutItems,
    total: getCheckoutTotal(),
    status: "active"
  };

  localStorage.setItem("latestReceipt", JSON.stringify(latestReceipt));
  upsertOrderHistory({ ...latestReceipt });
  cart = cart.filter((item) => !item.selectedForCheckout);
  persistCart();
  window.location.href = "consultation.html";
}

function viewReceiptFromHistory(transactionId) {
  const order = orderHistory.find((entry) => entry.transactionId === transactionId);
  if (!order) {
    return;
  }

  latestReceipt = { ...order, id: order.id || order.transactionId };
  localStorage.setItem("latestReceipt", JSON.stringify(latestReceipt));
  window.location.href = "consultation.html";
}

function cancelOrderFromHistory(transactionId) {
  const order = orderHistory.find((entry) => entry.transactionId === transactionId);
  if (!order) {
    return;
  }

  order.status = "cancelled";
  order.cancelledAt = new Date().toISOString();
  upsertOrderHistory({ ...order });
  renderOrderDetails();
}

function markOrderDelivered(transactionId) {
  const order = orderHistory.find((entry) => entry.transactionId === transactionId);
  if (!order) {
    return;
  }

  order.status = "completed";
  order.completedAt = new Date().toISOString();
  upsertOrderHistory({ ...order });
  renderOrderDetails();
}

function confirmOrderReview(transactionId) {
  const order = orderHistory.find((entry) => entry.transactionId === transactionId);
  if (!order) {
    return;
  }

  order.reviewConfirmedAt = new Date().toISOString();
  upsertOrderHistory({ ...order });
  renderOrderDetails();
}

function removeOrderFromHistory(transactionId) {
  orderHistory = orderHistory.filter((entry) => entry.transactionId !== transactionId);
  persistOrderHistory();
  renderOrderDetails();
}

function renderOrderDetails() {
  const listElement = document.getElementById("orderDetailsList");
  if (!listElement) {
    return;
  }

  const filteredOrders = orderHistory.filter((entry) => entry.status === currentOrderTab);

  if (filteredOrders.length === 0) {
    listElement.innerHTML = `
      <div class="order-history-empty">
        No ${currentOrderTab === "active" ? "orders" : currentOrderTab === "completed" ? "review" : "cancelled"} transactions yet.
      </div>
    `;
    return;
  }

  listElement.innerHTML = filteredOrders
    .map((order) => {
      const total = Number(order.total || 0).toFixed(2);
      const statusLabel = getHistoryStatusLabel(order.status, order.reviewConfirmedAt);

      return `
        <article class="order-history-item">
          <div class="order-history-top">
            <div>
              <div class="order-history-id">Transaction: <strong>${order.transactionId}</strong></div>
              <div class="order-history-meta">
                <span>${formatReceiptDate(order.createdAt)}</span>
                <span>•</span>
                <span>$${total}</span>
                <span>•</span>
                <span>${order.items.length} item${order.items.length > 1 ? "s" : ""}</span>
              </div>
            </div>
            <span class="order-badge ${order.status}">${statusLabel}</span>
          </div>
          <div class="order-history-actions">
            <button class="secondary" type="button" onclick="viewReceiptFromHistory('${order.transactionId}')">View Receipt</button>
            ${order.status === "active" ? `<button class="secondary" type="button" onclick="cancelOrderFromHistory('${order.transactionId}')">Cancel</button>` : ""}
            ${order.status === "active" ? `<button class="secondary" type="button" onclick="markOrderDelivered('${order.transactionId}')">Mark Delivered</button>` : ""}
            ${order.status === "completed" && !order.reviewConfirmedAt ? `<button class="secondary" type="button" onclick="confirmOrderReview('${order.transactionId}')">Confirm</button>` : ""}
            ${order.status === "cancelled" ? `<button class="secondary danger" type="button" onclick="removeOrderFromHistory('${order.transactionId}')">Remove</button>` : ""}
          </div>
        </article>
      `;
    })
    .join("");
}

function changeQuantity(id, delta) {
  const item = cart.find((entry) => entry.id === id);
  if (!item) {
    return;
  }

  item.quantity += delta;

  if (item.quantity <= 0) {
    cart = cart.filter((entry) => entry.id !== id);
  }

  persistCart();
  renderCartPage();
  renderPaymentSummary();
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  persistCart();
  renderCartPage();
  renderPaymentSummary();
}

function toggleCheckoutItem(id) {
  const item = cart.find((entry) => entry.id === id);
  if (!item) {
    return;
  }

  item.selectedForCheckout = !item.selectedForCheckout;
  persistCart();
  renderCartPage();
  renderPaymentSummary();
}

function renderCartPage() {
  const cartPageContent = document.getElementById("cartPageContent");
  if (!cartPageContent) {
    return;
  }

  if (cart.length === 0) {
    cartPageContent.innerHTML = `
      <div class="empty-state">
        <h2>Your cart is currently empty.</h2>
        <p>Add a piece from the collection to continue to order details.</p>
      </div>
    `;
    return;
  }

  const itemsMarkup = cart
    .map(
      (item) => `
        <article class="cart-line-item">
          <div class="cart-line-main">
            <label class="checkout-toggle">
              <input
                type="checkbox"
                ${item.selectedForCheckout ? "checked" : ""}
                onchange="toggleCheckoutItem(${item.id})"
              />
              <span>Select item</span>
            </label>
            <img src="${item.image}" alt="${item.name}" class="card-image cart-line-image" />
            <div>
              <h3>${item.name}</h3>
              <p>Quantity: ${item.quantity}</p>
            </div>
          </div>
          <div class="cart-line-actions">
            <div class="quantity-controls">
              <button class="secondary small-button" type="button" onclick="changeQuantity(${item.id}, -1)">-</button>
              <span>${item.quantity}</span>
              <button class="secondary small-button" type="button" onclick="changeQuantity(${item.id}, 1)">+</button>
            </div>
            <strong>₱${(item.price * item.quantity).toFixed(2)}</strong>
            <button class="secondary-link small-button" type="button" onclick="removeFromCart(${item.id})">Remove</button>
          </div>
        </article>
      `
    )
    .join("");

  const total = getCheckoutTotal();

  cartPageContent.innerHTML = `
    <div class="cart-list">${itemsMarkup}</div>
    <div class="cart-total-row">
      <span>Selected Total</span>
₱${total.toFixed(2)}
    </div>
  `;
}

function renderPaymentSummary() {
  const paymentSummary = document.getElementById("paymentSummary");
  const confirmPaymentButton = document.getElementById("confirmPaymentButton");
  if (!paymentSummary) {
    return;
  }

  const orderDetails = getActiveOrderDetails();

  if (!orderDetails) {
    paymentSummary.innerHTML = `
      <div class="empty-state">
        <h2>No order details available yet.</h2>
        <p>Add products to your cart, select them for checkout, and your order details will appear here.</p>
      </div>
    `;
    if (confirmPaymentButton) {
      confirmPaymentButton.disabled = true;
    }
    return;
  }

  const paymentLines = orderDetails.items
    .map(
      (item) => `
        <article class="order-item-card">
          <div class="cart-line-main">
            <img src="${item.image}" alt="${item.name}" class="card-image cart-line-image" />
            <div class="order-item-copy">
              <h3>${item.name}</h3>
              <p>Quantity: ${item.quantity}</p>
              <p>₱${item.price.toFixed(2)} each</p>
            </div>
          </div>
          <strong class="order-item-price">₱${(item.price * item.quantity).toFixed(2)}</strong>
        </article>
      `
    )
    .join("");

  paymentSummary.innerHTML = `
    <section class="order-detail-card">
      <div class="order-detail-top">
        <div>
          <span class="order-status-badge ${orderDetails.mode === "paid" ? "paid" : "pending"}">${orderDetails.status}</span>
          <h2>${orderDetails.mode === "paid" ? "Latest Order Details" : "Ready for Checkout"}</h2>
        </div>
        <div class="order-detail-meta">
          <p><strong>Order ID:</strong> ${orderDetails.id}</p>
          <p><strong>Date:</strong> ${formatReceiptDate(orderDetails.createdAt)}</p>
        </div>
      </div>
      <div class="order-detail-section">
        <div class="order-section-heading">
          <h3>Items</h3>
          <span>${orderDetails.items.length} item${orderDetails.items.length > 1 ? "s" : ""}</span>
        </div>
        <div class="cart-list">${paymentLines}</div>
      </div>
      <div class="order-detail-section">
        <div class="order-section-heading">
          <h3>Payment Summary</h3>
          <span>${orderDetails.mode === "paid" ? "Completed" : "Pending"}</span>
        </div>
        <div class="order-summary-grid">
          <div class="order-summary-row">
            <span>Items Total</span>
            <strong>₱${orderDetails.total.toFixed(2)}</strong>
          </div>
          <div class="order-summary-row">
            <span>Payment Status</span>
            <strong>${orderDetails.status}</strong>
          </div>
          <div class="order-summary-row order-summary-total">
            <span>Total</span>
            <strong>₱${orderDetails.total.toFixed(2)}</strong>
          </div>
        </div>
      </div>
    </section>
  `;

  if (confirmPaymentButton) {
    confirmPaymentButton.disabled = orderDetails.mode !== "pending";
    confirmPaymentButton.textContent = orderDetails.mode === "pending" ? "Confirm Payment" : "Payment Confirmed";
  }
}

function renderReceiptPage() {
  const receiptContent = document.getElementById("receiptContent");
  if (!receiptContent) {
    return;
  }

  if (!latestReceipt || !latestReceipt.items || latestReceipt.items.length === 0) {
    receiptContent.innerHTML = `
      <div class="empty-state">
        <h2>No receipt available yet.</h2>
        <p>Confirm a payment from the payment page to generate a receipt here.</p>
      </div>
    `;
    return;
  }

  const receiptItems = latestReceipt.items
    .map(
      (item) => `
        <article class="receipt-line-item">
          <div class="cart-line-main">
            <img src="${item.image}" alt="${item.name}" class="card-image cart-line-image" />
            <div>
              <h3>${item.name}</h3>
              <p>Quantity: ${item.quantity}</p>
            </div>
          </div>
          <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
        </article>
      `
    )
    .join("");

  receiptContent.innerHTML = `
    <div class="receipt-header">
      <div>
        <p class="eyebrow">Receipt Number</p>
        <h2>${latestReceipt.id}</h2>
      </div>
      <div class="receipt-meta">
        <p><strong>Status:</strong> Payment confirmed</p>
        <p><strong>Date:</strong> ${formatReceiptDate(latestReceipt.createdAt)}</p>
      </div>
    </div>
    <div class="cart-list">${receiptItems}</div>
    <div class="cart-total-row receipt-total-row">
      <span>Receipt Total</span>
      <strong>$${Number(latestReceipt.total).toFixed(2)}</strong>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderCartPage();
  renderPaymentSummary();
  renderReceiptPage();
  renderOrderDetails();
  updateCart();
});
