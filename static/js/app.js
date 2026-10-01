let menuItems=[],cart={},selectedCategory='All';document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('.category-btn').forEach(b=>b.addEventListener('click',()=>{selectedCategory=b.dataset.category;document.querySelectorAll('.category-btn').forEach(x=>{x.classList.remove('active','btn-dark');x.classList.add('btn-outline-dark')});b.classList.add('active','btn-dark');b.classList.remove('btn-outline-dark');renderMenu()}));loadMenu();setInterval(loadMenu,30000)});async function loadMenu(){try{let r=await fetch('/api/menu',{cache:'no-store'}),d=await r.json();menuItems=d.items||[];document.getElementById('menuStatus').textContent=`Menu: ${d.meal||'All-day items'} • Updated ${d.updated}`;renderMenu();renderCart()}catch(e){showAlert('Could not load the menu. Please refresh.','danger')}}function renderMenu(){let m=document.getElementById('menu'),items=selectedCategory==='All'?menuItems:menuItems.filter(x=>x.category===selectedCategory);if(!items.length){m.innerHTML='<div class="col-12"><div class="empty-box">No food available in this category right now.</div></div>';return}m.innerHTML=items.map(i=>{let q=cart[i.id]||0;return `<div class="col-sm-6 col-xl-4"><div class="food-card h-100"><div class="food-icon">${esc(i.icon)}</div><div class="food-name">${esc(i.name)}</div><div class="food-category">${esc(i.category)}</div><div class="d-flex justify-content-between align-items-center mt-2"><strong>₹${Number(i.price).toFixed(2)}</strong><span class="badge ${i.stock<=5?'text-bg-danger':'text-bg-success'}">${i.stock} left</span></div><div class="quantity-control mt-3"><button class="btn btn-sm btn-outline-dark" onclick="changeQty(${i.id},-1)">−</button><span>${q}</span><button class="btn btn-sm btn-dark" onclick="changeQty(${i.id},1)">+</button></div></div></div>`}).join('')}function addToCart(id) {
  const item = menuItems.find(x => x.id === id);
  if (!item) return;
  if (item.stock < 1) {
    showAlert(`${item.name} is out of stock.`, 'warning');
    return;
  }
  if (!cart[id]) cart[id] = 1;
  renderMenu();
  renderCart();
  showAlert(`${item.name} added to your cart.`, 'success');
  document.getElementById('cart').scrollIntoView({behavior:'smooth', block:'center'});
}

function changeQty(id, delta) {
  const item = menuItems.find(x => x.id === id);
  if (!item) return;
  const current = cart[id] || 0;
  const next = current + delta;
  if (next < 0) return;
  if (next > item.stock) {
    showAlert(`Only ${item.stock} of ${item.name} is available.`, 'warning');
    return;
  }
  if (next === 0) delete cart[id];
  else cart[id] = next;
  renderMenu();
  renderCart();
}

function renderCart() {
  const box = document.getElementById('cart');
  const ids = Object.keys(cart);
  if (!ids.length) {
    box.innerHTML = '<div class="empty-cart"><div class="fs-2 mb-2">🛒</div><strong>No items selected</strong><div class="small text-muted">Tap Add to Cart on any food item.</div></div>';
    document.getElementById('cartTotal').textContent = '₹0';
    document.getElementById('placeOrderBtn').disabled = true;
    return;
  }
  document.getElementById('placeOrderBtn').disabled = false;
  let total = 0;
  box.innerHTML = ids.map(id => {
    const item = menuItems.find(x => x.id === Number(id));
    if (!item) return '';
    const qty = cart[id];
    const amount = Number(item.price) * qty;
    total += amount;
    return `<div class="cart-line selected-cart-item">
      <div class="selected-food-icon">${escapeHtml(item.icon)}</div>
      <div class="flex-grow-1">
        <strong>${escapeHtml(item.name)}</strong>
        <div class="small text-muted">₹${Number(item.price).toFixed(2)} each</div>
        <div class="quantity-control mt-2 justify-content-start">
          <button class="btn btn-sm btn-outline-dark" onclick="changeQty(${item.id}, -1)">−</button>
          <span>${qty}</span>
          <button class="btn btn-sm btn-dark" onclick="changeQty(${item.id}, 1)">+</button>
          <button class="btn btn-sm btn-link text-danger" onclick="removeFromCart(${item.id})">Remove</button>
        </div>
      </div>
      <div class="text-end"><strong>₹${amount.toFixed(2)}</strong></div>
    </div>`;
  }).join('');
  document.getElementById('cartTotal').textContent = `₹${total.toFixed(2)}`;
}

function removeFromCart(id) {
  delete cart[id];
  renderMenu();
  renderCart();
}

async function placeOrder(){let ids=Object.keys(cart),name=document.getElementById('customerName').value.trim(),table=document.getElementById('tableRoom').value.trim(),note=document.getElementById('note').value.trim(),btn=document.getElementById('placeOrderBtn');if(!ids.length)return showAlert('Please select at least one food item.','warning');if(!name)return showAlert('Please enter your name.','warning');if(!table)return showAlert('Please enter your table or room number.','warning');btn.disabled=true;btn.textContent='Placing Order...';try{let r=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,table_room:table,note,items:ids.map(id=>({product_id:Number(id),quantity:Number(cart[id])}))})}),d=await r.json();if(!r.ok)throw Error(d.error||'Could not place order.');document.getElementById('successText').textContent=`Your Order #${d.order_id} has been received by the canteen. Total: ₹${Number(d.total).toFixed(2)}.`;clearCartAndFields();new bootstrap.Modal(document.getElementById('successModal')).show();await loadMenu()}catch(e){showAlert(e.message,'danger');await loadMenu()}finally{btn.disabled=false;btn.textContent='Place Order'}}function clearCartAndFields(){cart={};document.getElementById('customerName').value='';document.getElementById('tableRoom').value='';document.getElementById('note').value='';renderMenu();renderCart()}function showAlert(m,t){document.getElementById('alertBox').innerHTML=`<div class="alert alert-${t} alert-dismissible fade show">${esc(m)}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`}function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
