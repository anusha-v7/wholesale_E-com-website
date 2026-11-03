/**
 * Meridian Wholesale & Supply Co.
 * Product Catalog Filtering & Grid Controller
 * Implements combined Search, Multi-Criteria Category Filtering, Min/Max Price Bounds, and Sorting
 */

document.addEventListener('DOMContentLoaded', () => {
  const productsGrid = document.getElementById('products-grid');
  const productCountText = document.getElementById('product-count-text');
  const categoryFiltersList = document.getElementById('category-filters-list');
  const searchInput = document.getElementById('catalog-search-input');
  const sortSelect = document.getElementById('catalog-sort-select');
  
  // Price Controls
  const priceMinInput = document.getElementById('price-min-input');
  const priceMaxInput = document.getElementById('price-max-input');
  const priceSlider = document.getElementById('price-range-slider');
  const priceMinDisplay = document.getElementById('price-min-display');
  const priceMaxDisplay = document.getElementById('price-max-display');
  
  const clearFiltersBtn = document.getElementById('clear-filters-btn');
  const mobileFilterToggle = document.getElementById('mobile-filter-toggle');
  const catalogSidebar = document.getElementById('catalog-sidebar');

  // Filter State
  const state = {
    search: '',
    category: 'all',
    minPrice: 0,
    maxPrice: 1000,
    sortBy: 'default'
  };

  // Read URL query parameters (e.g. ?search=cookware or ?category=Commercial Kitchen)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('search')) {
    state.search = urlParams.get('search');
    if (searchInput) searchInput.value = state.search;
  }
  if (urlParams.has('category')) {
    state.category = urlParams.get('category');
  }

  // Combined Search & Filter Execution
  function getFilteredProducts() {
    let products = ProductStore.getProducts();

    // 1. Search Filter (by Name, Category, SKU, and relevant Description keywords)
    if (state.search && state.search.trim() !== '') {
      const q = state.search.trim().toLowerCase();
      products = products.filter(p => {
        const nameMatch = p.name && p.name.toLowerCase().includes(q);
        const skuMatch = p.sku && p.sku.toLowerCase().includes(q);
        const catMatch = p.category && p.category.toLowerCase().includes(q);
        const descMatch = p.description && p.description.toLowerCase().includes(q);
        return nameMatch || skuMatch || catMatch || descMatch;
      });
    }

    // 2. Category Filter (supports "all" or specific category)
    if (state.category && state.category.toLowerCase() !== 'all') {
      products = products.filter(p => 
        p.category && p.category.toLowerCase() === state.category.toLowerCase()
      );
    }

    // 3. Price Filter (both Min Price and Max Price bounds)
    products = products.filter(p => {
      const price = p.price || 0;
      return price >= state.minPrice && price <= state.maxPrice;
    });

    // 4. Sorting
    switch (state.sortBy) {
      case 'price-asc':
        products.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-desc':
        products.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'name-asc':
        products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'newest':
        products.sort((a, b) => {
          const da = new Date(a.dateAdded || 0).getTime();
          const db = new Date(b.dateAdded || 0).getTime();
          return db - da;
        });
        break;
      case 'default':
      default:
        // Default order
        break;
    }

    return products;
  }

  // Render Product Cards
  function renderProducts() {
    if (!productsGrid) return;
    const allProducts = ProductStore.getProducts();
    const filtered = getFilteredProducts();

    // INITIAL EMPTY CATALOG STATE: Requirement
    // "Initially, the product catalog must be empty. Do not automatically insert sample, random, or fake products.
    // Display a professional empty catalog state with a message such as 'No products available yet. Check back soon.'"
    if (allProducts.length === 0) {
      productsGrid.innerHTML = `
        <div class="empty-catalog-state">
          <div class="empty-state-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
          <h3 class="empty-catalog-title">No products available yet. Check back soon.</h3>
          <p class="empty-catalog-message">
            Our wholesale catalog is currently being prepared. Store owners can log in to the administrative dashboard to add and manage product inventory.
          </p>
          <div class="empty-state-actions">
            <a href="admin/dashboard.html" class="btn btn-primary">
              Go to Owner Dashboard
            </a>
            <button type="button" id="btn-load-demo-catalog" class="btn btn-secondary">
              Load Demo Wholesale Catalog
            </button>
          </div>
        </div>
      `;

      if (productCountText) {
        productCountText.innerHTML = `Showing <strong>0</strong> wholesale products`;
      }

      const loadDemoBtn = document.getElementById('btn-load-demo-catalog');
      if (loadDemoBtn) {
        loadDemoBtn.addEventListener('click', () => {
          ProductStore.seedSampleCatalog();
          renderCategoryFilters();
          renderProducts();
          showToast('Sample wholesale inventory catalog loaded!', 'success');
        });
      }
      return;
    }

    // NO MATCHING FILTER RESULTS STATE
    if (filtered.length === 0) {
      productsGrid.innerHTML = `
        <div class="empty-catalog-state">
          <div class="empty-state-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h3 class="empty-catalog-title">No Matching Wholesale Items</h3>
          <p class="empty-catalog-message">
            We could not find any products matching your search term "${escapeHtml(state.search || '')}" in category "${escapeHtml(state.category)}" within the price range of ${formatCurrency(state.minPrice)} – ${formatCurrency(state.maxPrice)}.
          </p>
          <button type="button" id="btn-reset-filters" class="btn btn-secondary">
            Clear All Active Filters
          </button>
        </div>
      `;

      if (productCountText) {
        productCountText.innerHTML = `Showing <strong>0</strong> of <strong>${allProducts.length}</strong> wholesale products`;
      }

      const resetBtn = document.getElementById('btn-reset-filters');
      if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
      }
      return;
    }

    // POPULATE MATCHING PRODUCTS
    if (productCountText) {
      productCountText.innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${allProducts.length}</strong> wholesale products`;
    }

    productsGrid.innerHTML = filtered.map(product => {
      return `
        <article class="product-card" data-id="${product.id}">
          <div class="product-card-image">
            <img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.src='assets/images/cat_commercial_kitchen.jpg';">
          </div>
          <div class="product-card-body">
            <div class="product-card-meta">
              <span class="product-card-category">${escapeHtml(product.category)}</span>
              <span class="product-card-sku">${escapeHtml(product.sku)}</span>
            </div>
            <h4 class="product-card-title">
              <a href="product-details.html?id=${product.id}">${escapeHtml(product.name)}</a>
            </h4>
            <p class="product-card-desc">${escapeHtml(product.description || '')}</p>
            
            <div class="product-card-pricing">
              <div class="product-price-block">
                <span class="product-price-label">Wholesale Case Price</span>
                <span class="product-card-price">${formatCurrency(product.price)}</span>
              </div>
              <div class="product-unit-info">
                <span>${product.caseQuantity || 1} units/case</span><br>
                <span class="text-xs text-slate-500">MOQ: ${product.moq || 1} cases</span>
              </div>
            </div>

            <div class="product-card-actions">
              <a href="product-details.html?id=${product.id}" class="btn btn-secondary btn-sm">
                View Details
              </a>
              <button type="button" class="btn btn-dark btn-sm btn-quick-add" data-id="${product.id}">
                Add to Cart
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Attach quick Add to Cart handlers
    productsGrid.querySelectorAll('.btn-quick-add').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const id = button.getAttribute('data-id');
        const prod = ProductStore.getProductById(id);
        if (prod) {
          CartStore.addToCart(prod, prod.moq || 1);
        }
      });
    });
  }

  // Render Category Sidebar with Dynamic SKU Counts
  function renderCategoryFilters() {
    if (!categoryFiltersList) return;
    const allProducts = ProductStore.getProducts();

    const categoryCounts = allProducts.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});

    const baseCategories = ['all', 'Commercial Kitchen', 'Industrial Hardware', 'Eco Packaging', 'Facility Equipment'];
    // Include any custom categories added by admin
    allProducts.forEach(p => {
      if (p.category && !baseCategories.includes(p.category)) {
        baseCategories.push(p.category);
      }
    });

    categoryFiltersList.innerHTML = baseCategories.map(cat => {
      const isAll = cat.toLowerCase() === 'all';
      const count = isAll ? allProducts.length : (categoryCounts[cat] || 0);
      const label = isAll ? 'All Categories' : cat;
      const isActive = (state.category.toLowerCase() === cat.toLowerCase());

      return `
        <li class="filter-category-item">
          <button type="button" class="${isActive ? 'active' : ''}" data-category="${cat}">
            <span>${label}</span>
            <span class="category-count">${count}</span>
          </button>
        </li>
      `;
    }).join('');

    // Attach click handlers
    categoryFiltersList.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        state.category = btn.getAttribute('data-category');
        renderCategoryFilters();
        renderProducts();
      });
    });
  }

  // Reset Filters to Default
  function resetFilters() {
    state.search = '';
    state.category = 'all';
    state.minPrice = 0;
    state.maxPrice = 1000;
    state.sortBy = 'default';

    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'default';
    if (priceMinInput) priceMinInput.value = 0;
    if (priceMaxInput) priceMaxInput.value = 1000;
    if (priceSlider) priceSlider.value = 1000;
    if (priceMinDisplay) priceMinDisplay.textContent = '$0.00';
    if (priceMaxDisplay) priceMaxDisplay.textContent = '$1,000.00';

    renderCategoryFilters();
    renderProducts();
    showToast('Filters reset', 'info');
  }

  // Helper to escape HTML characters
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // Event Listeners: Dynamic Search
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.search = e.target.value;
      renderProducts();
    });
  }

  // Event Listeners: Sorting
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderProducts();
    });
  }

  // Event Listeners: Price Min Input
  if (priceMinInput) {
    priceMinInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      state.minPrice = isNaN(val) || val < 0 ? 0 : val;
      if (priceMinDisplay) priceMinDisplay.textContent = formatCurrency(state.minPrice);
      renderProducts();
    });
  }

  // Event Listeners: Price Max Input
  if (priceMaxInput) {
    priceMaxInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      state.maxPrice = isNaN(val) ? 1000 : val;
      if (priceSlider) priceSlider.value = Math.min(state.maxPrice, 1000);
      if (priceMaxDisplay) priceMaxDisplay.textContent = formatCurrency(state.maxPrice);
      renderProducts();
    });
  }

  // Event Listeners: Price Slider (controls Max Price)
  if (priceSlider) {
    priceSlider.addEventListener('input', (e) => {
      state.maxPrice = parseFloat(e.target.value);
      if (priceMaxInput) priceMaxInput.value = state.maxPrice;
      if (priceMaxDisplay) priceMaxDisplay.textContent = formatCurrency(state.maxPrice);
      renderProducts();
    });
  }

  // Clear Filters Button
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', resetFilters);
  }

  // Mobile Filter Drawer Toggle
  if (mobileFilterToggle && catalogSidebar) {
    mobileFilterToggle.addEventListener('click', () => {
      catalogSidebar.classList.toggle('mobile-open');
      mobileFilterToggle.textContent = catalogSidebar.classList.contains('mobile-open') 
        ? 'Hide Filters' 
        : 'Filter Products';
    });
  }

  // Storage Synchronization: Refresh grid if products updated in another tab/window
  window.addEventListener('meridian:products-updated', () => {
    renderCategoryFilters();
    renderProducts();
  });

  // Initial Boot
  renderCategoryFilters();
  renderProducts();
});
