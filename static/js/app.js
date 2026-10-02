let menuItems = [], cart = {}, draftQty = {}, selectedCategory = 'All';

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.category-btn').forEach(btn => btn.addEventListener('click', () => {
    selectedCategory = btn.dataset.category;
    document.querySelectorAll('.category-btn').forEach(x => {
      x.classList.remove('active', 'btn-dark'); x.classList.add('btn-outline-dark');
    });
    btn.classList.add('active', 'btn-dark'); btn.classList.remove('btn-outline-dark');
    renderMenu();
  }));
  loadMenu();
  setInterval(loadMenu, 30000);
});

async function loadMenu() {
  try {
    const r = await fetch('/api/menu', { cache: 'no-store' });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Could not load menu');
    menuItems = d.items || [];
    document.getElementById('menuStatus').textContent = `Serving now: ${d.meal || 'All-day items'} • IST ${d.updated}`;
    renderMenu();
    renderCart();
  } catch (e) {
    showAlert('Could not load the menu. Please refresh.', 'danger');
  }
}

function renderMenu() {
  const m = document.getElementById('menu');
  const items = selectedCategory === 'All' ? menuItems : menuItems.filter(x => x.category === selectedCategory);
  if (!items.length) {
    m.innerHTML = `<div class="col-12"><div class="empty-box"><div class="fs-2 mb-2">🍽️</div><strong>No ${selectedCategory === 'All' ? 'food' : selectedCategory.toLowerCase() + ' food'} available right now.</strong><div class="small mt-1">Check the serving time or try another category.</div></div></div>`;
    return;
  }
  m.innerHTML = items.map(i => {
    const cartQ = Number(cart[i.id] || 0);
    const q = Number(draftQty[i.id] || cartQ || 1);
    const selected = cartQ > 0;
    const max = Number(i.stock || 0);
    const availableNow = !!i.available_now && max > 0;
    return `<div class="col-12 col-sm-6 col-xl-4">
      <div class="food-card h-100 ${selected ? 'selected-food' : ''}">
        <div class="d-flex justify-content-between gap-2 align-items-start">
          <div class="food-icon">${esc(i.icon)}</div>
          <span class="badge ${max <= 5 ? 'text-bg-danger' : 'text-bg-success'}">${max} left</span>
        </div>
        <div class="food-name">${esc(i.name)}</div>
        <div class="food-category">${esc(i.category)} • ${esc(i.start_time)}–${esc(i.end_time)}</div>
        <div class="small mt-1 ${availableNow ? 'text-success' : 'text-muted'}">${max < 1 ? 'Out of stock' : (availableNow ? 'Available now' : 'Not available now')}</div>
        <div class="d-flex justify-content-between align-items-center mt-3"><strong class="food-price">₹${Number(i.price).toFixed(2)}</strong></div>
        <div class="food-add-row mt-3">
          <div class="quick-qty" aria-label="Choose quantity">
            <button type="button" class="btn btn-outline-dark qty-btn" onclick="changeCardDraft(${i.id}, -1)" ${q <= 1 ? 'disabled' : ''}>−</button>
            <span id="cardQty_${i.id}">${q}</span>
            <button type="button" class="btn btn-outline-dark qty-btn" onclick="changeCardDraft(${i.id}, 1)" ${q >= max || !availableNow ? 'disabled' : ''}>+</button>
          </div>
          <button class="btn ${selected ? 'btn-success' : 'btn-dark'} flex-grow-1" onclick="addSelectedToCart(${i.id})" ${max < 1 || !availableNow ? 'disabled' : ''}>${selected ? '✓ In Cart • ' + cartQ : (availableNow ? `Add ${q} to Cart` : `Available ${i.start_time}–${i.end_time}`)}</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function changeCardDraft(id, delta) {
  const item = menuItems.find(x => x.id === id); if (!item) return;
  const current = Number(draftQty[id] || cart[id] || 1);
  let next = current + delta;
  if (next < 1) next = 1;
  if (next > item.stock) { showAlert(`Only ${item.stock} of ${item.name} is available.`, 'warning'); return; }
  draftQty[id] = next;
  renderMenu();
}

function addSelectedToCart(id) {
  const item = menuItems.find(x => x.id === id); if (!item) return;
  const qty = Math.max(1, Math.min(Number(draftQty[id] || cart[id] || 1), Number(item.stock || 0)));
  if (!qty) { showAlert(`${item.name} is out of stock.`, 'warning'); return; }
  cart[id] = qty; draftQty[id] = qty;
  renderMenu(); renderCart();
  showAlert(`${item.name} × ${qty} added to your cart.`, 'success');
}

// Kept for compatibility with existing buttons/links.
function addToCart(id) { addSelectedToCart(id); }

function changeQty(id, delta) {
  const item = menuItems.find(x => x.id === Number(id)); if (!item) return;
  const current = Number(cart[id] || 0), next = current + delta;
  if (next < 0) return;
  if (next > item.stock) { showAlert(`Only ${item.stock} of ${item.name} is available.`, 'warning'); return; }
  if (next === 0) delete cart[id]; else cart[id] = next;
  renderMenu(); renderCart();
}

function removeFromCart(id) { delete cart[id]; delete draftQty[id]; renderMenu(); renderCart(); }

function renderCart() {
  const box = document.getElementById('cart'), ids = Object.keys(cart);
  let itemCount = 0, total = 0;
  ids.forEach(id => itemCount += Number(cart[id] || 0));
  document.getElementById('cartSliderTitle').textContent = itemCount ? `Selected Items (${itemCount})` : 'Selected Items';
  document.getElementById('cartSliderSummary').textContent = itemCount ? `${ids.length} food item${ids.length > 1 ? 's' : ''} • Tap to view cart` : 'No items selected • Tap to open';
  document.getElementById('cartCountLabel').textContent = itemCount ? `${itemCount} item${itemCount > 1 ? 's' : ''} selected` : 'No items selected';
  const badge = document.getElementById('topCartBadge');
  if (badge) { badge.textContent = itemCount; badge.classList.toggle('is-empty', itemCount === 0); }
  if (!ids.length) {
    box.innerHTML = '<div class="empty-cart"><div class="fs-2 mb-2">🛒</div><strong>No items selected</strong><div class="small text-muted">Choose a quantity and tap Add to Cart.</div></div>';
    document.getElementById('cartTotal').textContent = '₹0';
    document.getElementById('cartSliderTotal').textContent = '₹0';
    document.getElementById('placeOrderBtn').disabled = true;
    return;
  }
  document.getElementById('placeOrderBtn').disabled = false;
  box.innerHTML = ids.map(id => {
    const item = menuItems.find(x => x.id === Number(id)); if (!item) return '';
    const qty = Number(cart[id]), amount = Number(item.price) * qty; total += amount;
    return `<div class="cart-line selected-cart-item">
      <div class="selected-food-icon">${esc(item.icon)}</div>
      <div class="flex-grow-1"><strong>${esc(item.name)}</strong><div class="small text-muted">₹${Number(item.price).toFixed(2)} each</div>
      <div class="quantity-control mt-2 justify-content-start"><button class="btn btn-sm btn-outline-dark" onclick="changeQty(${item.id},-1)">−</button><span>${qty}</span><button class="btn btn-sm btn-dark" onclick="changeQty(${item.id},1)">+</button><button class="btn btn-sm btn-link text-danger" onclick="removeFromCart(${item.id})">Remove</button></div></div>
      <div class="text-end"><strong>₹${amount.toFixed(2)}</strong></div>
    </div>`;
  }).join('');
  document.getElementById('cartTotal').textContent = `₹${total.toFixed(2)}`;
  document.getElementById('cartSliderTotal').textContent = `₹${total.toFixed(2)}`;
}

function openCart() { renderCart(); }

async function placeOrder() {
  const ids = Object.keys(cart), name = document.getElementById('customerName').value.trim(), contact = document.getElementById('contactNumber').value.trim(), table = document.getElementById('tableRoom').value.trim(), note = document.getElementById('note').value.trim(), btn = document.getElementById('placeOrderBtn');
  if (!ids.length) return showAlert('Please select at least one food item.', 'warning');
  if (!name) return showAlert('Please enter your name.', 'warning');
  if (!contact) return showAlert('Please enter your contact number.', 'warning');
  const digits = contact.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return showAlert('Please enter a valid contact number (10-15 digits).', 'warning');
  if (!table) return showAlert('Please enter your table or room number.', 'warning');
  btn.disabled = true; btn.textContent = 'Placing Order...';
  try {
    const r = await fetch('/api/orders', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name, contact_number:contact, table_room:table, note, items:ids.map(id => ({product_id:Number(id), quantity:Number(cart[id])}))}) });
    const d = await r.json(); if (!r.ok) throw Error(d.error || 'Could not place order.');
    document.getElementById('successText').textContent = `Your Order #${d.order_id} has been received by the canteen. Total: ₹${Number(d.total).toFixed(2)}.`;
    clearCartAndFields();
    const oc = document.getElementById('cartOffcanvas'), inst = bootstrap.Offcanvas.getInstance(oc); if (inst) inst.hide();
    new bootstrap.Modal(document.getElementById('successModal')).show(); await loadMenu();
  } catch (e) { showAlert(e.message, 'danger'); await loadMenu(); }
  finally { btn.textContent = 'Place Order'; renderCart(); }
}

function clearCartAndFields() { cart = {}; draftQty = {}; document.getElementById('customerName').value=''; document.getElementById('contactNumber').value=''; document.getElementById('tableRoom').value=''; document.getElementById('note').value=''; renderMenu(); renderCart(); }
function showAlert(m,t) { document.getElementById('alertBox').innerHTML=`<div class="alert alert-${t} alert-dismissible fade show">${esc(m)}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`; }
function esc(v) { return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function escapeHtml(v) { return esc(v); }
