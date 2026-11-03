/**
 * Meridian Wholesale & Supply Co.
 * Core JavaScript Engine & Shared State Architecture
 * Provides: ProductStore, ImageDB (IndexedDB), CartStore, AuthStore, Toast Engine, Utilities
 */

// Storage Keys
const STORAGE_KEYS = {
  PRODUCTS: 'meridian_wholesale_products',
  CART: 'meridian_wholesale_cart',
  ADMIN_AUTH: 'meridian_admin_session'
};

// IndexedDB Image Store (Avoids LocalStorage 5MB quota exhaustion for 100+ product images)
const ImageDB = {
  dbName: 'MeridianWholesaleDB',
  storeName: 'product_images',
  dbPromise: null,

  init() {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB is not supported in this browser. Falling back to memory/storage.');
        resolve(null);
        return;
      }
      try {
        const request = indexedDB.open(this.dbName, 1);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => {
          console.warn('IndexedDB open error, fallback:', e);
          resolve(null);
        };
      } catch (err) {
        console.warn('IndexedDB init exception:', err);
        resolve(null);
      }
    });
    return this.dbPromise;
  },

  async saveImage(id, dataUrl) {
    if (!dataUrl || !id) return false;
    const db = await this.init();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.put(dataUrl, id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  },

  async getImage(id) {
    if (!id) return null;
    const db = await this.init();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  },

  async deleteImage(id) {
    if (!id) return false;
    const db = await this.init();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }
};

// Seed Wholesale Catalog Data (Available on-demand via Admin Dashboard for testing/demo)
const SAMPLE_WHOLESALE_CATALOG = [
  {
    id: 'prod-001',
    sku: 'CK-SS-904',
    name: 'Pro-Grade Tri-Ply Stainless Steel Cookware Master Set (12-Piece)',
    category: 'Commercial Kitchen',
    price: 349.00,
    unitPrice: 29.08,
    caseQuantity: 12,
    moq: 2,
    stock: 85,
    leadTime: '1-2 Business Days',
    image: 'assets/images/cat_commercial_kitchen.jpg',
    description: 'Commercial foodservice culinary master set crafted from 18/10 restaurant-grade stainless steel with impact-bonded aluminum encapsulation. Engineered for high-volume commercial kitchens, induction ready, NSF certified.',
    dateAdded: '2026-10-15T08:30:00.000Z',
    specs: {
      material: '18/10 Stainless Steel & Heavy Aluminum Core',
      caseWeight: '38.4 lbs',
      certifications: 'NSF Certified, Dishwasher Safe',
      packaging: 'Reinforced 5-Ply Corrugated Master Carton'
    },
    tiers: [
      { min: 2, max: 9, price: 349.00 },
      { min: 10, max: 24, price: 319.00 },
      { min: 25, max: 999, price: 289.00 }
    ]
  },
  {
    id: 'prod-002',
    sku: 'CK-KN-500',
    name: 'High-Carbon German Steel Chef & Prep Cutlery Case (6 Knives/Case)',
    category: 'Commercial Kitchen',
    price: 189.50,
    unitPrice: 31.58,
    caseQuantity: 6,
    moq: 3,
    stock: 140,
    leadTime: '1-2 Business Days',
    image: 'assets/images/cat_commercial_kitchen.jpg',
    description: 'Forged German X50CrMoV15 stainless steel utility and chef knives with ergonomic textured grip handles designed for continuous line prep. Razor sharp taper-ground edges.',
    dateAdded: '2026-10-18T10:15:00.000Z',
    specs: {
      material: 'German High-Carbon X50CrMoV15 Steel',
      caseWeight: '9.2 lbs',
      certifications: 'NSF Listed Sanitation Standard',
      packaging: 'Individual Blade Guards in Foam Tray Case'
    },
    tiers: [
      { min: 3, max: 14, price: 189.50 },
      { min: 15, max: 49, price: 172.00 },
      { min: 50, max: 999, price: 155.00 }
    ]
  },
  {
    id: 'prod-003',
    sku: 'IH-TW-420',
    name: 'Industrial Heavy-Duty Reversible Ratchet & Torque Wrench Set',
    category: 'Industrial Hardware',
    price: 420.00,
    unitPrice: 105.00,
    caseQuantity: 4,
    moq: 2,
    stock: 64,
    leadTime: '2-3 Business Days',
    image: 'assets/images/cat_industrial_hardware.jpg',
    description: 'Precision calibrated 72-tooth chrome vanadium drive mechanisms designed for industrial plant assembly, automotive fleet servicing, and structural fabrication.',
    dateAdded: '2026-10-20T14:45:00.000Z',
    specs: {
      material: 'Drop-Forged Chrome Vanadium (Cr-V)',
      caseWeight: '46.0 lbs',
      certifications: 'ASME B107.300-2010 Calibrated',
      packaging: 'Molded Impact Cases in Master Shipping Crate'
    },
    tiers: [
      { min: 2, max: 9, price: 420.00 },
      { min: 10, max: 29, price: 385.00 },
      { min: 30, max: 999, price: 350.00 }
    ]
  },
  {
    id: 'prod-004',
    sku: 'IH-BF-1000',
    name: 'Grade 8 Heavy Hex Structural Fasteners & Brass Washers Bulk Pack (1,000 Pcs)',
    category: 'Industrial Hardware',
    price: 215.00,
    unitPrice: 0.21,
    caseQuantity: 1000,
    moq: 5,
    stock: 220,
    leadTime: 'Same Day Dispatch',
    image: 'assets/images/cat_industrial_hardware.jpg',
    description: 'High-tensile zinc plated and solid brass structural hardware fasteners. Heat treated for vibration-proof machinery assembly and high-load architectural frameworks.',
    dateAdded: '2026-10-22T09:20:00.000Z',
    specs: {
      material: 'Grade 8 High-Strength Alloy & Solid C360 Brass',
      caseWeight: '52.5 lbs',
      certifications: 'ASTM A325 / SAE J429 Compliant',
      packaging: 'Heavy-Duty Steel-Banded Corrugated Bin'
    },
    tiers: [
      { min: 5, max: 19, price: 215.00 },
      { min: 20, max: 49, price: 195.00 },
      { min: 50, max: 999, price: 175.00 }
    ]
  },
  {
    id: 'prod-005',
    sku: 'EP-BX-250',
    name: 'Reinforced Kraft Corrugated Shipping Cartons 16x12x8 (Bundle of 50)',
    category: 'Eco Packaging',
    price: 88.50,
    unitPrice: 1.77,
    caseQuantity: 50,
    moq: 5,
    stock: 450,
    leadTime: 'Same Day Dispatch',
    image: 'assets/images/cat_packaging_supplies.jpg',
    description: '100% recycled 200# / ECT-32 test single-wall kraft corrugated shipping boxes. Flat-packed bundles engineered for maximum stacking strength and pallet optimization.',
    dateAdded: '2026-10-25T11:00:00.000Z',
    specs: {
      material: '100% Post-Consumer Recycled Kraft Corrugate',
      caseWeight: '32.0 lbs',
      certifications: 'FSC Certified Recycled, Edge Crush Tested',
      packaging: 'Banded Pallet-Ready Shrunk Bundle'
    },
    tiers: [
      { min: 5, max: 24, price: 88.50 },
      { min: 25, max: 99, price: 79.00 },
      { min: 100, max: 999, price: 68.00 }
    ]
  },
  {
    id: 'prod-006',
    sku: 'EP-TP-36',
    name: 'Biodegradable Water-Activated Reinforced Gummed Packing Tape (36 Rolls)',
    category: 'Eco Packaging',
    price: 154.00,
    unitPrice: 4.27,
    caseQuantity: 36,
    moq: 2,
    stock: 180,
    leadTime: '1-2 Business Days',
    image: 'assets/images/cat_packaging_supplies.jpg',
    description: 'Heavy duty fiberglass reinforced kraft tape creating a permanent tamper-evident bond with cartons. Resistant to extreme heat, cold, and humidity.',
    dateAdded: '2026-10-28T16:30:00.000Z',
    specs: {
      material: 'Virgin Kraft Paper with Natural Starch Adhesive',
      caseWeight: '41.2 lbs',
      certifications: '100% Compostable & Curbside Recyclable',
      packaging: 'Moisture-Barrier Carton Packaging'
    },
    tiers: [
      { min: 2, max: 9, price: 154.00 },
      { min: 10, max: 29, price: 138.00 },
      { min: 30, max: 999, price: 122.00 }
    ]
  },
  {
    id: 'prod-007',
    sku: 'FE-DS-100',
    name: 'Commercial Touchless Automatic Hand Hygiene Dispenser Station (Pack of 4)',
    category: 'Facility Equipment',
    price: 295.00,
    unitPrice: 73.75,
    caseQuantity: 4,
    moq: 2,
    stock: 75,
    leadTime: '1-2 Business Days',
    image: 'assets/images/cat_facility_equipment.jpg',
    description: 'Brushed stainless steel touchless infrared hygiene dispensing units with wall-mount plates and drip trays. Accepts liquid gel or foam sanitizer cartridges.',
    dateAdded: '2026-10-29T13:10:00.000Z',
    specs: {
      material: 'Brushed 304 Stainless Steel & ABS Composite',
      caseWeight: '22.0 lbs',
      certifications: 'ADA Compliant, CE Certified',
      packaging: '4 Individually Boxed Units in Master Crate'
    },
    tiers: [
      { min: 2, max: 7, price: 295.00 },
      { min: 8, max: 19, price: 265.00 },
      { min: 20, max: 999, price: 235.00 }
    ]
  },
  {
    id: 'prod-008',
    sku: 'FE-MP-35',
    name: 'Industrial Heavy Duty Dual-Bucket Mopping Cart with Wringer System',
    category: 'Facility Equipment',
    price: 165.00,
    unitPrice: 165.00,
    caseQuantity: 1,
    moq: 2,
    stock: 50,
    leadTime: '2-3 Business Days',
    image: 'assets/images/cat_facility_equipment.jpg',
    description: 'Commercial sanitary trolley featuring separate clean/dirty solution chambers, high-efficiency downpress wringer, and non-marking quiet caster wheels.',
    dateAdded: '2026-11-01T09:40:00.000Z',
    specs: {
      material: 'Polypropylene Chemical Resistant Resin & Steel Handle',
      caseWeight: '26.8 lbs',
      certifications: 'OSHA Compliant Sanitation Equipment',
      packaging: 'Semi-Knocked-Down Flat Master Box'
    },
    tiers: [
      { min: 2, max: 5, price: 165.00 },
      { min: 6, max: 15, price: 148.00 },
      { min: 16, max: 999, price: 132.00 }
    ]
  }
];

// Product Store API (Clean Reusable CRUD Operations)
const ProductStore = {
  getProducts() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error reading products from storage:', e);
      return [];
    }
  },

  saveProducts(products) {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      window.dispatchEvent(new CustomEvent('meridian:products-updated', { detail: { products } }));
      return true;
    } catch (e) {
      console.error('Error saving products to localStorage:', e);
      // If quota exceeded, alert gracefully
      if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
        showToast('Storage quota exceeded. Large image stored in IndexedDB.', 'warning');
      }
      return false;
    }
  },

  getProductById(id) {
    if (!id) return null;
    const products = this.getProducts();
    return products.find(p => String(p.id) === String(id)) || null;
  },

  addProduct(productData) {
    const products = this.getProducts();
    const newId = 'prod-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const dateAdded = new Date().toISOString();

    const price = parseFloat(productData.price) || 0;
    const moq = parseInt(productData.moq, 10) || 1;
    const caseQty = parseInt(productData.caseQuantity, 10) || 1;
    const unitPrice = parseFloat(productData.unitPrice) || (price / caseQty);

    // If image is a large data URL, save in IndexedDB
    let imageRef = productData.image || 'assets/images/cat_commercial_kitchen.jpg';
    if (imageRef.startsWith('data:')) {
      ImageDB.saveImage(newId, imageRef);
    }

    const newProduct = {
      id: newId,
      sku: productData.sku ? productData.sku.trim().toUpperCase() : 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      name: productData.name.trim(),
      category: productData.category || 'Commercial Goods',
      price: price,
      unitPrice: Number(unitPrice.toFixed(2)),
      caseQuantity: caseQty,
      moq: moq,
      stock: parseInt(productData.stock, 10) || 0,
      leadTime: productData.leadTime ? productData.leadTime.trim() : '1-2 Business Days',
      image: imageRef,
      description: productData.description ? productData.description.trim() : '',
      dateAdded: dateAdded,
      specs: productData.specs || {
        material: 'Commercial Specification Grade',
        caseWeight: '28.0 lbs',
        certifications: 'Standard Commercial Compliance',
        packaging: 'Master Shipping Crate'
      },
      tiers: productData.tiers || [
        { min: moq, max: 9, price: price },
        { min: 10, max: 24, price: Number((price * 0.92).toFixed(2)) },
        { min: 25, max: 999, price: Number((price * 0.85).toFixed(2)) }
      ]
    };

    products.unshift(newProduct);
    this.saveProducts(products);
    return newProduct;
  },

  updateProduct(id, updatedFields) {
    const products = this.getProducts();
    const idx = products.findIndex(p => String(p.id) === String(id));
    if (idx === -1) return null;

    const existing = products[idx];
    let imageRef = updatedFields.image !== undefined ? updatedFields.image : existing.image;

    if (imageRef && imageRef.startsWith('data:')) {
      ImageDB.saveImage(id, imageRef);
    }

    const price = updatedFields.price !== undefined ? parseFloat(updatedFields.price) : existing.price;
    const caseQty = updatedFields.caseQuantity !== undefined ? parseInt(updatedFields.caseQuantity, 10) : existing.caseQuantity;
    const unitPrice = updatedFields.unitPrice !== undefined ? parseFloat(updatedFields.unitPrice) : (price / caseQty);
    const moq = updatedFields.moq !== undefined ? parseInt(updatedFields.moq, 10) : existing.moq;

    products[idx] = {
      ...existing,
      ...updatedFields,
      price: price,
      unitPrice: Number(unitPrice.toFixed(2)),
      caseQuantity: caseQty,
      moq: moq,
      image: imageRef,
      dateModified: new Date().toISOString()
    };

    this.saveProducts(products);
    return products[idx];
  },

  deleteProduct(id) {
    const products = this.getProducts();
    const filtered = products.filter(p => String(p.id) !== String(id));
    this.saveProducts(filtered);
    ImageDB.deleteImage(id);
    return true;
  },

  seedSampleCatalog() {
    this.saveProducts(SAMPLE_WHOLESALE_CATALOG);
    return SAMPLE_WHOLESALE_CATALOG;
  },

  clearCatalog() {
    this.saveProducts([]);
    return true;
  }
};

// Cart Store API (Persistent State, Calculations, Validation)
const CartStore = {
  getCart() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CART);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error reading cart:', e);
      return [];
    }
  },

  saveCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
      this.updateHeaderBadge();
      window.dispatchEvent(new CustomEvent('meridian:cart-updated', { detail: { cart } }));
      return true;
    } catch (e) {
      console.error('Error saving cart:', e);
      return false;
    }
  },

  addToCart(product, quantity = 1) {
    if (!product || !product.id) return [];
    const cart = this.getCart();
    const minMoq = product.moq || 1;
    let qtyToAdd = parseInt(quantity, 10);
    if (isNaN(qtyToAdd) || qtyToAdd < minMoq) {
      qtyToAdd = minMoq;
    }

    const existingIndex = cart.findIndex(item => String(item.id) === String(product.id));

    if (existingIndex > -1) {
      cart[existingIndex].quantity += qtyToAdd;
    } else {
      cart.push({
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        price: product.price,
        caseQuantity: product.caseQuantity || 1,
        moq: minMoq,
        image: product.image,
        quantity: qtyToAdd
      });
    }

    this.saveCart(cart);
    showToast(`Added ${qtyToAdd} case${qtyToAdd > 1 ? 's' : ''} of "${product.name.slice(0, 30)}..." to cart`, 'success');
    return cart;
  },

  updateQuantity(productId, quantity) {
    const cart = this.getCart();
    const idx = cart.findIndex(i => String(i.id) === String(productId));
    if (idx === -1) return cart;

    const newQ = parseInt(quantity, 10);
    if (isNaN(newQ) || newQ <= 0) {
      return this.removeFromCart(productId);
    }

    cart[idx].quantity = newQ;
    this.saveCart(cart);
    return cart;
  },

  removeFromCart(productId) {
    const cart = this.getCart().filter(item => String(item.id) !== String(productId));
    this.saveCart(cart);
    showToast('Item removed from wholesale cart', 'warning');
    return cart;
  },

  clearCart() {
    this.saveCart([]);
    return [];
  },

  getCount() {
    return this.getCart().reduce((sum, item) => sum + (item.quantity || 0), 0);
  },

  getSubtotal() {
    return this.getCart().reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
  },

  updateHeaderBadge() {
    const count = this.getCount();
    document.querySelectorAll('.cart-count-badge').forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    });
  }
};

// Admin Authentication Store (Frontend Demo Security Architecture)
const AuthStore = {
  DEMO_CREDENTIALS: {
    email: 'admin@meridian.com',
    password: 'admin2026'
  },

  isAuthenticated() {
    try {
      const session = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
      if (!session) return false;
      const data = JSON.parse(session);
      return !!(data && data.authenticated && data.email);
    } catch (e) {
      return false;
    }
  },

  login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (cleanEmail === this.DEMO_CREDENTIALS.email && cleanPass === this.DEMO_CREDENTIALS.password) {
      const sessionData = {
        authenticated: true,
        email: cleanEmail,
        role: 'Wholesale Store Administrator',
        loginTime: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, JSON.stringify(sessionData));
      return { success: true };
    }

    return {
      success: false,
      message: 'Invalid administrator credentials. For this demo prototype, use: admin@meridian.com / admin2026'
    };
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    return true;
  },

  getUser() {
    try {
      const session = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
      return session ? JSON.parse(session) : null;
    } catch (e) {
      return null;
    }
  }
};

// Toast Notification Engine
function showToast(message, type = 'info') {
  let container = document.getElementById('global-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'global-toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 300ms ease, transform 300ms ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3400);
}

// Utility: Format Currency
function formatCurrency(num) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(num || 0);
}

// Utility: Format Date
function formatDate(isoString) {
  if (!isoString) return 'Recent';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return 'Recent';
  }
}

// Global UI Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  // Sync Cart Badge
  CartStore.updateHeaderBadge();

  // Mobile Nav Drawer Setup
  const menuBtn = document.querySelector('.mobile-menu-toggle');
  const drawer = document.querySelector('.mobile-nav-drawer');
  const overlay = document.querySelector('.mobile-nav-overlay');
  const closeBtn = document.querySelector('.mobile-drawer-close');

  function openMobileMenu() {
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (menuBtn) menuBtn.addEventListener('click', openMobileMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMobileMenu);
  if (overlay) overlay.addEventListener('click', closeMobileMenu);

  // Global Header Search Listener
  const headerSearchForms = document.querySelectorAll('.header-search-form');
  headerSearchForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      const query = input ? input.value.trim() : '';
      const targetUrl = window.location.pathname.includes('/admin/') 
        ? '../products.html' 
        : 'products.html';
      window.location.href = `${targetUrl}?search=${encodeURIComponent(query)}`;
    });
  });
});
