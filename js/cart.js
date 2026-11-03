/**
 * Meridian Wholesale & Supply Co.
 * Shopping Cart & Checkout Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const cartContainer = document.getElementById('cart-container');
  const cartSubtotalEl = document.getElementById('cart-subtotal');
  const cartFreightEl = document.getElementById('cart-freight');
  const cartTaxEl = document.getElementById('cart-tax');
  const cartTotalEl = document.getElementById('cart-total');
  const checkoutModal = document.getElementById('checkout-modal');
  const btnProceedCheckout = document.getElementById('btn-proceed-checkout');
  const btnCloseCheckout = document.getElementById('btn-close-checkout');
  const checkoutForm = document.getElementById('wholesale-checkout-form');
  const confirmationModal = document.getElementById('order-confirmation-modal');
  const btnCloseConfirmation = document.getElementById('btn-close-confirmation');

  function renderCart() {
    if (!cartContainer) return;
    const cart = CartStore.getCart();

    if (cart.length === 0) {
      cartContainer.innerHTML = `
        <div class="empty-catalog-state" style="grid-column: 1 / -1; margin-top: 1rem;">
          <div class="empty-state-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <h3 class="empty-catalog-title">Your Wholesale Cart is Empty</h3>
          <p class="empty-catalog-message">
            Browse our commercial wholesale catalog to request bulk case quantities and tiered commercial pricing.
          </p>
          <a href="products.html" class="btn btn-primary">
            Explore Wholesale Catalog
          </a>
        </div>
      `;

      if (btnProceedCheckout) btnProceedCheckout.disabled = true;
      updateTotals(0);
      return;
    }

    if (btnProceedCheckout) btnProceedCheckout.disabled = false;

    // Render Table
    let tableHtml = `
      <div class="cart-table-card">
        <div class="table-responsive">
          <table class="cart-table">
            <thead>
              <tr>
                <th>Product Description</th>
                <th>Case Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
    `;

    cart.forEach(item => {
      const lineSubtotal = (item.price || 0) * (item.quantity || 1);
      tableHtml += `
        <tr data-id="${item.id}">
          <td>
            <div class="cart-product-cell">
              <div class="cart-thumbnail">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='assets/images/cat_commercial_kitchen.jpg';">
              </div>
              <div>
                <div class="cart-item-name">
                  <a href="product-details.html?id=${item.id}">${item.name}</a>
                </div>
                <div class="cart-item-sku">SKU: ${item.sku} · ${item.caseQuantity || 1} units/case</div>
              </div>
            </div>
          </td>
          <td>
            <span class="tabular-nums font-semibold">${formatCurrency(item.price)}</span>
          </td>
          <td>
            <div class="quantity-stepper">
              <button type="button" class="stepper-btn btn-cart-dec" data-id="${item.id}">-</button>
              <input type="number" class="stepper-input cart-qty-input" data-id="${item.id}" value="${item.quantity}" min="1">
              <button type="button" class="stepper-btn btn-cart-inc" data-id="${item.id}">+</button>
            </div>
          </td>
          <td>
            <span class="tabular-nums font-bold text-slate-900">${formatCurrency(lineSubtotal)}</span>
          </td>
          <td>
            <button type="button" class="btn-remove-item text-slate-400 hover:text-red-600 transition-colors" data-id="${item.id}" title="Remove item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </td>
        </tr>
      `;
    });

    tableHtml += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    cartContainer.innerHTML = tableHtml;

    // Attach row events
    cartContainer.querySelectorAll('.btn-cart-dec').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = cart.find(i => i.id === id);
        if (item) {
          CartStore.updateQuantity(id, item.quantity - 1);
          renderCart();
        }
      });
    });

    cartContainer.querySelectorAll('.btn-cart-inc').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = cart.find(i => i.id === id);
        if (item) {
          CartStore.updateQuantity(id, item.quantity + 1);
          renderCart();
        }
      });
    });

    cartContainer.querySelectorAll('.cart-qty-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = input.getAttribute('data-id');
        const val = parseInt(e.target.value, 10);
        CartStore.updateQuantity(id, val);
        renderCart();
      });
    });

    cartContainer.querySelectorAll('.btn-remove-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        CartStore.removeFromCart(id);
        renderCart();
      });
    });

    updateTotals(CartStore.getSubtotal());
  }

  function updateTotals(subtotal) {
    // Freight: Free above $1,500, flat $120 LTL pallet shipping otherwise
    const freight = subtotal > 1500 ? 0 : (subtotal > 0 ? 120 : 0);
    // Tax: 0% wholesale resale exemption with valid certificate (standard B2B practice)
    const tax = 0;
    const total = subtotal + freight + tax;

    if (cartSubtotalEl) cartSubtotalEl.textContent = formatCurrency(subtotal);
    if (cartFreightEl) {
      cartFreightEl.textContent = freight === 0 && subtotal > 0 ? 'FREE Freight (> $1,500)' : formatCurrency(freight);
    }
    if (cartTaxEl) cartTaxEl.textContent = '$0.00 (Tax Exempt Resale)';
    if (cartTotalEl) cartTotalEl.textContent = formatCurrency(total);
  }

  // Checkout Modal Handlers
  if (btnProceedCheckout) {
    btnProceedCheckout.addEventListener('click', () => {
      if (CartStore.getCart().length === 0) {
        showToast('Your wholesale cart is empty', 'warning');
        return;
      }
      if (checkoutModal) checkoutModal.classList.add('open');
    });
  }

  if (btnCloseCheckout && checkoutModal) {
    btnCloseCheckout.addEventListener('click', () => {
      checkoutModal.classList.remove('open');
    });
  }

  // Handle Checkout Form Submission (Mock B2B Order Flow)
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const companyName = document.getElementById('checkout-company').value;
      const poNumber = document.getElementById('checkout-po').value || 'PO-' + Math.floor(10000 + Math.random() * 90000);
      const subtotal = CartStore.getSubtotal();
      const freight = subtotal > 1500 ? 0 : 120;
      const total = subtotal + freight;

      // Close checkout modal
      if (checkoutModal) checkoutModal.classList.remove('open');

      // Populate confirmation modal
      const confPo = document.getElementById('conf-po-number');
      const confCompany = document.getElementById('conf-company-name');
      const confTotal = document.getElementById('conf-total-amount');

      if (confPo) confPo.textContent = poNumber;
      if (confCompany) confCompany.textContent = companyName;
      if (confTotal) confTotal.textContent = formatCurrency(total);

      // Clear cart
      CartStore.clearCart();
      renderCart();

      // Show confirmation
      if (confirmationModal) confirmationModal.classList.add('open');
    });
  }

  if (btnCloseConfirmation && confirmationModal) {
    btnCloseConfirmation.addEventListener('click', () => {
      confirmationModal.classList.remove('open');
      window.location.href = 'products.html';
    });
  }

  // Boot
  renderCart();
});
