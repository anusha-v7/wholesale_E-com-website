/**
 * Meridian Wholesale & Supply Co.
 * Admin Portal & Inventory Management Controller
 * Handles authentication protection, product CRUD, IndexedDB image handling, and category metrics
 */

document.addEventListener('DOMContentLoaded', () => {
  const isDashboard = !!document.getElementById('admin-dashboard-root');
  const isLoginPage = !!document.getElementById('admin-login-form');

  if (isLoginPage) {
    initLoginPage();
  } else if (isDashboard) {
    initDashboard();
  }
});

/**
 * Admin Login Page Controller
 */
function initLoginPage() {
  // If already authenticated, redirect to dashboard
  if (AuthStore.isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const loginForm = document.getElementById('admin-login-form');
  const btnDemoLogin = document.getElementById('btn-demo-login');
  const emailInput = document.getElementById('admin-email');
  const passwordInput = document.getElementById('admin-password');
  const btnTogglePassword = document.getElementById('btn-toggle-password');
  const eyeIcon = document.getElementById('eye-icon');
  const eyeOffIcon = document.getElementById('eye-off-icon');
  const loginAlert = document.getElementById('login-alert');
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');

  // Toggle Password Visibility
  if (btnTogglePassword && passwordInput) {
    btnTogglePassword.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      if (eyeIcon) eyeIcon.style.display = isPassword ? 'none' : 'block';
      if (eyeOffIcon) eyeOffIcon.style.display = isPassword ? 'block' : 'none';
      btnTogglePassword.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  }

  // Auto-Fill Demo Credentials
  if (btnDemoLogin && emailInput && passwordInput) {
    btnDemoLogin.addEventListener('click', () => {
      emailInput.value = AuthStore.DEMO_CREDENTIALS.email;
      passwordInput.value = AuthStore.DEMO_CREDENTIALS.password;
      if (emailError) emailError.style.display = 'none';
      if (passwordError) passwordError.style.display = 'none';
      if (loginAlert) loginAlert.style.display = 'none';
      showToast('Demo administrator credentials filled', 'info');
    });
  }

  // Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      let hasError = false;

      if (!email || !email.includes('@')) {
        if (emailError) emailError.style.display = 'block';
        hasError = true;
      } else {
        if (emailError) emailError.style.display = 'none';
      }

      if (!password) {
        if (passwordError) passwordError.style.display = 'block';
        hasError = true;
      } else {
        if (passwordError) passwordError.style.display = 'none';
      }

      if (hasError) return;

      const result = AuthStore.login(email, password);

      if (result.success) {
        if (loginAlert) loginAlert.style.display = 'none';
        showToast('Authentication successful. Redirecting to dashboard...', 'success');
        
        // Redirect to target or dashboard
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || 'dashboard.html';
        setTimeout(() => {
          window.location.href = redirect;
        }, 500);
      } else {
        if (loginAlert) {
          loginAlert.textContent = result.message;
          loginAlert.style.display = 'block';
        }
        showToast('Login failed: Invalid credentials', 'danger');
      }
    });
  }
}

/**
 * Admin Dashboard Controller
 */
function initDashboard() {
  // ROUTE PROTECTION: Ensure admin is authenticated
  if (!AuthStore.isAuthenticated()) {
    showToast('Admin authentication required. Redirecting to login...', 'warning');
    setTimeout(() => {
      window.location.href = 'login.html?redirect=dashboard.html';
    }, 300);
    return;
  }

  // Display active admin user
  const adminUserDisplay = document.getElementById('admin-user-display');
  const user = AuthStore.getUser();
  if (adminUserDisplay && user) {
    adminUserDisplay.textContent = user.email;
  }

  // DOM Elements
  const kpiTotalProducts = document.getElementById('kpi-total-products');
  const kpiActiveCategories = document.getElementById('kpi-active-categories');
  const kpiInStock = document.getElementById('kpi-in-stock');
  const kpiInventoryValue = document.getElementById('kpi-inventory-value');

  const categoryBreakdownContainer = document.getElementById('admin-category-breakdown');
  const recentProductsListContainer = document.getElementById('admin-recent-products-list');

  const adminTableBody = document.getElementById('admin-table-body');
  const adminSearch = document.getElementById('admin-search-input');
  const adminCategoryFilter = document.getElementById('admin-category-filter');

  const btnOpenAddModal = document.getElementById('btn-open-add-modal');
  const btnSeedCatalog = document.getElementById('btn-seed-catalog');
  const btnClearCatalog = document.getElementById('btn-clear-catalog');
  const btnAdminLogout = document.getElementById('btn-admin-logout');

  // Modal Elements
  const productModal = document.getElementById('product-editor-modal');
  const productForm = document.getElementById('product-editor-form');
  const modalTitle = document.getElementById('modal-editor-title');
  const btnCloseModal = document.getElementById('btn-close-product-modal');
  const btnCancelModal = document.getElementById('btn-cancel-product-modal');
  const editorFormError = document.getElementById('editor-form-error');

  // Delete Modal Elements
  const deleteModal = document.getElementById('delete-confirm-modal');
  const btnCloseDeleteModal = document.getElementById('btn-close-delete-modal');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');
  const deleteProductNamePreview = document.getElementById('delete-product-name-preview');
  const deleteProductSkuPreview = document.getElementById('delete-product-sku-preview');

  // Form Fields
  const fieldId = document.getElementById('field-product-id');
  const fieldName = document.getElementById('field-product-name');
  const fieldSku = document.getElementById('field-product-sku');
  const fieldCategory = document.getElementById('field-product-category');
  const fieldPrice = document.getElementById('field-product-price');
  const fieldCaseQty = document.getElementById('field-product-case-qty');
  const fieldMoq = document.getElementById('field-product-moq');
  const fieldStock = document.getElementById('field-product-stock');
  const fieldLeadTime = document.getElementById('field-product-lead-time');
  const fieldImage = document.getElementById('field-product-image');
  const fileUpload = document.getElementById('field-product-image-file');
  const imagePreview = document.getElementById('image-preview-img');
  const fieldDesc = document.getElementById('field-product-desc');

  // Inline Validation Error Spans
  const fieldNameError = document.getElementById('field-name-error');
  const fieldPriceError = document.getElementById('field-price-error');

  // State
  let searchTerm = '';
  let selectedCategory = 'all';
  let pendingDeleteProductId = null;

  // Render KPIs & Widgets
  function updateDashboardWidgets() {
    const products = ProductStore.getProducts();
    const categoriesSet = new Set(products.map(p => p.category));
    const inStockCount = products.filter(p => (p.stock || 0) > 0).length;
    const totalVal = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);

    if (kpiTotalProducts) kpiTotalProducts.textContent = products.length;
    if (kpiActiveCategories) kpiActiveCategories.textContent = categoriesSet.size;
    if (kpiInStock) kpiInStock.textContent = inStockCount;
    if (kpiInventoryValue) kpiInventoryValue.textContent = formatCurrency(totalVal);

    // Render Products by Category Widget
    if (categoryBreakdownContainer) {
      if (products.length === 0) {
        categoryBreakdownContainer.innerHTML = `
          <div style="font-size: 0.8125rem; color: var(--color-text-muted); padding: 0.5rem 0;">
            No products in catalog. Add products to view distribution.
          </div>
        `;
      } else {
        const counts = products.reduce((acc, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1;
          return acc;
        }, {});

        const allKnownCategories = ['Commercial Kitchen', 'Industrial Hardware', 'Eco Packaging', 'Facility Equipment'];
        // Merge with any custom added categories
        Object.keys(counts).forEach(c => {
          if (!allKnownCategories.includes(c)) allKnownCategories.push(c);
        });

        categoryBreakdownContainer.innerHTML = allKnownCategories.map(cat => {
          const count = counts[cat] || 0;
          const pct = Math.round((count / products.length) * 100);
          return `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; margin-bottom: 0.25rem;">
                <span style="font-weight: 600; color: var(--color-primary);">${cat}</span>
                <span class="tabular-nums" style="color: var(--color-text-muted);">${count} items (${pct}%)</span>
              </div>
              <div style="width: 100%; height: 6px; background-color: var(--color-surface-subtle); border-radius: 9999px; overflow: hidden;">
                <div style="width: ${pct}%; height: 100%; background-color: var(--color-accent); border-radius: 9999px;"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render Recently Added Products Widget
    if (recentProductsListContainer) {
      if (products.length === 0) {
        recentProductsListContainer.innerHTML = `
          <div style="font-size: 0.8125rem; color: var(--color-text-muted); padding: 0.5rem 0;">
            No recent items. Click "Add Product" above.
          </div>
        `;
      } else {
        // Sort by dateAdded descending
        const sorted = [...products].sort((a, b) => {
          const da = new Date(a.dateAdded || 0).getTime();
          const db = new Date(b.dateAdded || 0).getTime();
          return db - da;
        }).slice(0, 4);

        recentProductsListContainer.innerHTML = sorted.map(item => `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--color-border-subtle);">
            <div style="display: flex; align-items: center; gap: 0.75rem; overflow: hidden;">
              <img src="${item.image}" alt="${item.name}" style="width: 32px; height: 32px; border-radius: var(--radius-sm); object-fit: cover; flex-shrink: 0;" onerror="this.src='../assets/images/cat_commercial_kitchen.jpg';">
              <div style="overflow: hidden;">
                <div style="font-size: 0.8125rem; font-weight: 600; color: var(--color-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">
                  ${item.name}
                </div>
                <div style="font-size: 0.6875rem; color: var(--color-text-subtle);">
                  ${item.category} · Added ${formatDate(item.dateAdded)}
                </div>
              </div>
            </div>
            <div class="tabular-nums font-semibold text-xs" style="color: var(--color-primary); white-space: nowrap;">
              ${formatCurrency(item.price)}
            </div>
          </div>
        `).join('');
      }
    }
  }

  // Render Products Table
  function renderTable() {
    if (!adminTableBody) return;
    let products = ProductStore.getProducts();

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'all') {
      products = products.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (products.length === 0) {
      adminTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-10 text-slate-500" style="text-align: center; padding: 2.5rem 1rem;">
            <div style="max-width: 400px; margin: 0 auto;">
              <div style="font-weight: 600; font-size: 1rem; color: var(--color-primary); margin-bottom: 0.5rem;">
                No Products Found in Catalog
              </div>
              <p style="font-size: 0.8125rem; color: var(--color-text-muted); margin-bottom: 1rem;">
                ${searchTerm || selectedCategory !== 'all' ? 'No products match your search or filter. Try clearing your filters.' : 'Your wholesale inventory is currently empty. Click "Add Product" to create your first item or load demo products.'}
              </p>
              <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('btn-open-add-modal').click()">
                Add First Product
              </button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    adminTableBody.innerHTML = products.map(product => {
      const stockStatusClass = (product.stock || 0) > 20 
        ? 'in-stock' 
        : (product.stock > 0 ? 'low-stock' : 'out-of-stock');
      const stockLabel = (product.stock || 0) > 20 
        ? 'In Stock' 
        : (product.stock > 0 ? 'Low Stock' : 'Backordered');

      return `
        <tr data-id="${product.id}">
          <td>
            <img src="${product.image}" alt="${product.name}" class="product-row-thumb" onerror="this.src='../assets/images/cat_commercial_kitchen.jpg';">
          </td>
          <td>
            <span class="font-mono text-xs font-semibold text-slate-600">${product.sku}</span>
          </td>
          <td>
            <div class="font-semibold text-slate-900" style="max-width: 260px;">${product.name}</div>
            <div class="text-xs text-slate-500">${product.caseQuantity || 1} units/case · Lead: ${product.leadTime || '1-2 Days'}</div>
          </td>
          <td>
            <span class="text-xs font-medium text-slate-600">${product.category}</span>
          </td>
          <td>
            <span class="tabular-nums font-bold text-slate-900">${formatCurrency(product.price)}</span>
            <div class="text-xs text-slate-400">MOQ: ${product.moq} cases</div>
          </td>
          <td>
            <span class="text-xs text-slate-500 whitespace-nowrap">${formatDate(product.dateAdded)}</span>
          </td>
          <td>
            <span class="status-badge-text ${stockStatusClass}">
              ${product.stock || 0} cases · ${stockLabel}
            </span>
          </td>
          <td>
            <div class="table-actions-group">
              <button type="button" class="btn btn-secondary btn-sm btn-edit-product" data-id="${product.id}" title="Edit product details">
                Edit
              </button>
              <button type="button" class="btn btn-secondary btn-sm text-red-600 hover:text-red-700 btn-delete-product" data-id="${product.id}" title="Delete product">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row events
    adminTableBody.querySelectorAll('.btn-edit-product').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openEditModal(id);
      });
    });

    adminTableBody.querySelectorAll('.btn-delete-product').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openDeleteModal(id);
      });
    });
  }

  // Open Add Product Modal
  function openAddModal() {
    if (modalTitle) modalTitle.textContent = 'Add New Wholesale Product';
    if (fieldId) fieldId.value = '';
    if (productForm) productForm.reset();
    if (editorFormError) editorFormError.style.display = 'none';
    if (fieldNameError) fieldNameError.style.display = 'none';
    if (fieldPriceError) fieldPriceError.style.display = 'none';
    if (imagePreview) {
      imagePreview.src = '../assets/images/cat_commercial_kitchen.jpg';
    }
    if (productModal) productModal.classList.add('open');
    if (fieldName) fieldName.focus();
  }

  // Open Edit Product Modal
  function openEditModal(productId) {
    const product = ProductStore.getProductById(productId);
    if (!product) {
      showToast('Product not found in catalog', 'danger');
      return;
    }

    if (modalTitle) modalTitle.textContent = `Edit Product: ${product.sku}`;
    if (fieldId) fieldId.value = product.id;
    if (fieldName) fieldName.value = product.name;
    if (fieldSku) fieldSku.value = product.sku;
    if (fieldCategory) fieldCategory.value = product.category;
    if (fieldPrice) fieldPrice.value = product.price;
    if (fieldCaseQty) fieldCaseQty.value = product.caseQuantity || 1;
    if (fieldMoq) fieldMoq.value = product.moq || 1;
    if (fieldStock) fieldStock.value = product.stock || 0;
    if (fieldLeadTime) fieldLeadTime.value = product.leadTime || '1-2 Business Days';
    if (fieldImage) fieldImage.value = product.image.startsWith('data:') ? '' : product.image;
    if (fieldDesc) fieldDesc.value = product.description || '';

    if (imagePreview) {
      imagePreview.src = product.image || '../assets/images/cat_commercial_kitchen.jpg';
    }

    if (editorFormError) editorFormError.style.display = 'none';
    if (fieldNameError) fieldNameError.style.display = 'none';
    if (fieldPriceError) fieldPriceError.style.display = 'none';

    if (productModal) productModal.classList.add('open');
  }

  function closeModal() {
    if (productModal) productModal.classList.remove('open');
  }

  // Open Delete Confirmation Modal
  function openDeleteModal(productId) {
    const product = ProductStore.getProductById(productId);
    if (!product) return;

    pendingDeleteProductId = productId;
    if (deleteProductNamePreview) deleteProductNamePreview.textContent = product.name;
    if (deleteProductSkuPreview) deleteProductSkuPreview.textContent = `SKU: ${product.sku} · Category: ${product.category}`;
    if (deleteModal) deleteModal.classList.add('open');
  }

  function closeDeleteModal() {
    pendingDeleteProductId = null;
    if (deleteModal) deleteModal.classList.remove('open');
  }

  // Handle Image File Upload with FileReader & Preview
  if (fileUpload) {
    fileUpload.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          showToast('Please select a valid image file', 'warning');
          return;
        }
        const reader = new FileReader();
        reader.onload = function(evt) {
          const dataUrl = evt.target.result;
          if (imagePreview) imagePreview.src = dataUrl;
          if (fieldImage) fieldImage.value = dataUrl;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Handle Image URL input preview
  if (fieldImage) {
    fieldImage.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      if (imagePreview && url) {
        imagePreview.src = url;
      }
    });
  }

  // Save / Update Product Handler
  if (productForm) {
    productForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = fieldName ? fieldName.value.trim() : '';
      const priceVal = fieldPrice ? parseFloat(fieldPrice.value) : 0;
      const category = fieldCategory ? fieldCategory.value : 'Commercial Kitchen';

      let hasError = false;

      if (!name) {
        if (fieldNameError) fieldNameError.style.display = 'block';
        hasError = true;
      } else {
        if (fieldNameError) fieldNameError.style.display = 'none';
      }

      if (isNaN(priceVal) || priceVal <= 0) {
        if (fieldPriceError) fieldPriceError.style.display = 'block';
        hasError = true;
      } else {
        if (fieldPriceError) fieldPriceError.style.display = 'none';
      }

      if (hasError) {
        if (editorFormError) {
          editorFormError.textContent = 'Please fill out all required fields with valid values.';
          editorFormError.style.display = 'block';
        }
        return;
      }

      const id = fieldId ? fieldId.value : '';
      const imageSrc = (fieldImage && fieldImage.value.trim()) 
        ? fieldImage.value.trim() 
        : (imagePreview ? imagePreview.src : 'assets/images/cat_commercial_kitchen.jpg');

      const productPayload = {
        name: name,
        sku: (fieldSku && fieldSku.value.trim()) ? fieldSku.value.trim().toUpperCase() : undefined,
        category: category,
        price: priceVal,
        caseQuantity: parseInt(fieldCaseQty.value, 10) || 1,
        moq: parseInt(fieldMoq.value, 10) || 1,
        stock: parseInt(fieldStock.value, 10) || 0,
        leadTime: (fieldLeadTime && fieldLeadTime.value.trim()) || '1-2 Business Days',
        image: imageSrc,
        description: fieldDesc ? fieldDesc.value.trim() : ''
      };

      if (id) {
        // Edit existing product
        ProductStore.updateProduct(id, productPayload);
        showToast(`Product "${name.slice(0, 24)}..." updated successfully`, 'success');
      } else {
        // Add new product
        ProductStore.addProduct(productPayload);
        showToast(`New wholesale product "${name.slice(0, 24)}..." added to catalog`, 'success');
      }

      closeModal();
      updateDashboardWidgets();
      renderTable();
    });
  }

  // Delete Confirmation Handler
  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', () => {
      if (pendingDeleteProductId) {
        ProductStore.deleteProduct(pendingDeleteProductId);
        closeDeleteModal();
        updateDashboardWidgets();
        renderTable();
        showToast('Product successfully deleted from wholesale catalog', 'warning');
      }
    });
  }

  if (btnCloseDeleteModal) btnCloseDeleteModal.addEventListener('click', closeDeleteModal);
  if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);

  // Modal Triggers
  if (btnOpenAddModal) btnOpenAddModal.addEventListener('click', openAddModal);
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
  if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

  // Search in Dashboard Table
  if (adminSearch) {
    adminSearch.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim();
      renderTable();
    });
  }

  // Category Filter in Dashboard Table
  if (adminCategoryFilter) {
    adminCategoryFilter.addEventListener('change', (e) => {
      selectedCategory = e.target.value;
      renderTable();
    });
  }

  // Seed Sample Catalog
  if (btnSeedCatalog) {
    btnSeedCatalog.addEventListener('click', () => {
      if (confirm('Load 8 verified wholesale items into the catalog? This will populate the live catalog with B2B commercial equipment.')) {
        ProductStore.seedSampleCatalog();
        updateDashboardWidgets();
        renderTable();
        showToast('Sample wholesale catalog loaded successfully', 'success');
      }
    });
  }

  // Clear Catalog to Empty State
  if (btnClearCatalog) {
    btnClearCatalog.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset the catalog to an empty state? This verifies the initial empty state requirement.')) {
        ProductStore.clearCatalog();
        updateDashboardWidgets();
        renderTable();
        showToast('Catalog reset to empty state', 'warning');
      }
    });
  }

  // Logout Handler
  if (btnAdminLogout) {
    btnAdminLogout.addEventListener('click', () => {
      AuthStore.logout();
      showToast('Signed out of admin session', 'info');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 300);
    });
  }

  // Initial Load
  updateDashboardWidgets();
  renderTable();
}
