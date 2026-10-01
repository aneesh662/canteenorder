let products = [];
let cart = JSON.parse(localStorage.getItem("canteenCart") || "{}");
let selectedCategory = "All";
let searchText = "";

const $ = id => document.getElementById(id);
const money = n => `₹${Number(n || 0).toFixed(0)}`;

async function loadMenu() {
  try {
    const response = await fetch("/api/menu", {cache: "no-store"});
    if (!response.ok) throw new Error("Menu request failed");
    const data = await response.json();
    products = data.items || [];

    if (data.meal === "Breakfast") $("menuTitle").textContent = "🌅 Breakfast Menu";
    else if (data.meal === "Lunch") $("menuTitle").textContent = "☀️ Lunch Menu";
    else if (data.meal === "Dinner") $("menuTitle").textContent = "🌙 Dinner Menu";
    else $("menuTitle").textContent = "🍽️ Canteen Menu";

    $("menuTime").textContent = `Updated ${data.updated} · ${products.length} item(s) available`;

    const validIds = new Set(products.map(p => String(p.id)));
    Object.keys(cart).forEach(id => {
      if (!validIds.has(String(id))) delete cart[id];
    });
    saveCart();

    renderCategories(data.meal);
    renderItems();
    renderCart();
  } catch (error) {
    $("menuTime").textContent = "Unable to load menu. Please refresh.";
  }
}

function renderCategories(meal) {
  const cats = ["All", "Drinks", "Snacks"];
  if (meal) cats.push(meal);
  if (!cats.includes(selectedCategory)) selectedCategory = "All";

  $("categoryChips").innerHTML = cats.map(c =>
    `<button class="category-chip ${selectedCategory === c ? "active" : ""}" data-cat="${c}">${c}</button>`
  ).join("");

  document.querySelectorAll(".category-chip").forEach(btn => {
    btn.onclick = () => {
      selectedCategory = btn.dataset.cat;
      renderCategories(meal);
      renderItems();
    };
  });
}

function renderItems() {
  const filtered = products.filter(p =>
    (selectedCategory === "All" || p.category === selectedCategory) &&
    (!searchText || p.name.toLowerCase().includes(searchText.toLowerCase()))
  );

  $("itemsGrid").innerHTML = filtered.map(p => {
    const qty = Number(cart[p.id] || 0);
    return `<div class="col-6 col-md-4 col-lg-3">
      <div class="food-card">
        <div class="food-icon">${escapeHtml(p.icon || "🍽️")}</div>
        <div class="food-name">${escapeHtml(p.name)}</div>
        <div class="food-price">${money(p.price)}</div>
        <div class="mt-3">
          ${qty === 0
            ? `<button class="btn btn-dark w-100 add-btn" onclick="addToCart(${p.id})">+ Add</button>`
            : `<div class="qty-control">
                <button onclick="changeQty(${p.id}, -1)">−</button>
                <span>${qty}</span>
                <button onclick="changeQty(${p.id}, 1)">+</button>
              </div>`}
        </div>
      </div>
    </div>`;
  }).join("");

  $("emptyState").classList.toggle("d-none", filtered.length !== 0);
}

function addToCart(id) {
  cart[id] = Number(cart[id] || 0) + 1;
  saveCart();
  renderItems();
  renderCart();
}

function changeQty(id, delta) {
  const next = Number(cart[id] || 0) + delta;
  if (next <= 0) delete cart[id];
  else cart[id] = next;
  saveCart();
  renderItems();
  renderCart();
}

function saveCart() {
  localStorage.setItem("canteenCart", JSON.stringify(cart));
}

function renderCart() {
  let total = 0, count = 0, rows = [];

  Object.entries(cart).forEach(([id, qty]) => {
    const p = products.find(x => String(x.id) === String(id));
    if (!p) return;
    const amount = p.price * qty;
    total += amount;
    count += qty;
    rows.push({p, qty, amount});
  });

  $("cartItems").innerHTML = rows.length
    ? rows.map(({p,qty,amount}) => `
      <div class="cart-line">
        <div><strong>${escapeHtml(p.name)}</strong><br><small>${money(p.price)} × ${qty}</small></div>
        <div class="text-end"><strong>${money(amount)}</strong><br>
        <button class="btn btn-sm btn-link text-danger p-0" onclick="changeQty(${p.id}, -${qty})">Remove</button></div>
      </div>`).join("")
    : `<div class="text-center text-muted py-4">Your cart is empty.</div>`;

  $("cartTotal").textContent = total.toFixed(0);
  $("cartBadge").textContent = count;
  $("floatingCount").textContent = count;
  $("floatingTotal").textContent = total.toFixed(0);
}

function clearCartAndFields() {
  cart = {};
  saveCart();
  $("customerName").value = "";
  $("tableRoom").value = "";
  $("orderNote").value = "";
  renderItems();
  renderCart();
}

async function sendWhatsApp() {
  const rows = [];
  let total = 0;

  Object.entries(cart).forEach(([id, qty]) => {
    const p = products.find(x => String(x.id) === String(id));
    if (!p) return;
    const amount = p.price * qty;
    total += amount;
    rows.push({p, qty, amount});
  });

  if (!rows.length) {
    alert("Please add at least one item.");
    return;
  }

  const name = $("customerName").value.trim();
  const table = $("tableRoom").value.trim();
  const note = $("orderNote").value.trim();

  // Save the order in SQLite first. Stock is deducted only when admin confirms it.
  let orderData;
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        name,
        table_room: table,
        note,
        items: rows.map(({p, qty}) => ({product_id: p.id, quantity: qty}))
      })
    });
    orderData = await response.json();
    if (!response.ok) throw new Error(orderData.error || "Could not save order.");
  } catch (error) {
    alert(error.message);
    await loadMenu();
    return;
  }

  let msg = "🍽️ CANTEEN ORDER\n";
  msg += "━━━━━━━━━━━━━━━━\n";
  msg += `🧾 Order #: ${orderData.order_id}\n`;
  msg += `👤 Name: ${name || "-"}\n`;
  msg += `🪑 Table/Room: ${table || "-"}\n\n`;
  msg += "Items:\n";
  rows.forEach(({p, qty, amount}) => {
    msg += `• ${p.name} × ${qty} = ${money(amount)}\n`;
  });
  msg += `\n💰 TOTAL: ${money(total)}\n`;
  msg += `\n📝 Note: ${note || "-"}\n\n`;
  msg += "Thank you.";

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank", "noopener,noreferrer");
  clearCartAndFields();
  await loadMenu();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

$("searchInput").addEventListener("input", e => {
  searchText = e.target.value.trim();
  renderItems();
});
$("clearCart").addEventListener("click", clearCartAndFields);
$("sendWhatsapp").addEventListener("click", sendWhatsApp);

loadMenu();
setInterval(loadMenu, 30000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) loadMenu();
});
