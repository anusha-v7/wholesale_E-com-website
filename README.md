# MY INTERNSHIP PROJECT AT AUSPIFY 

# Meridian Wholesale & Supply Co. — Commercial E-Commerce Platform

A complete, production-grade, responsive wholesale e-commerce interface designed for commercial B2B procurement, equipment distribution, and bulk supplies.

Developed as an advanced frontend development internship submission, this application adheres to enterprise UI/UX standards, semantic HTML5, modern CSS3, modular Vanilla JavaScript, client-side persistence (LocalStorage + IndexedDB), and complete owner catalog administration.

---

## 🔑 Demo Admin Credentials

To test the Owner/Admin Portal and product inventory management:

- **Portal URL**: `/admin/login.html` (or click "Admin" in top navigation)
- **Admin Email**: `admin@meridian.com`
- **Password**: `admin2026`
- **Fast Testing**: A **"Fill Demo Credentials"** button is provided on the login page for instant one-click testing.
- **Show/Hide Password**: Click the eye toggle icon next to the password input.

> **Architecture Disclaimer**: This frontend prototype implements client-side session authentication designed to mimic enterprise auth workflows. In a full-stack production deployment, this layer connects to backend OAuth2/JWT session endpoints without altering any frontend UI components.

---

## 🌟 Key Features Implemented

### 1. Dynamic Product Management System
- **Dynamic Catalog Loading**: Products load dynamically from persistent browser storage rather than being hardcoded in HTML.
- **Initial Clean Empty State**: On first launch, the product catalog is **completely empty** by default (no random fake products). It displays a professional empty catalog state: *"No products available yet. Check back soon."*
- **Product Schema**: Each product record includes:
  - `id`: Unique identifier (e.g., `prod-1793706823153-481`)
  - `name`: Product title
  - `description`: Wholesale specifications, certifications, and technical notes
  - `price`: Wholesale case price
  - `unitPrice`: Calculated per-unit cost
  - `category`: Wholesale division
  - `caseQuantity`: Pack size / units per case
  - `moq`: Minimum Order Quantity
  - `stock`: Current warehouse inventory level
  - `leadTime`: Dispatch timeframe
  - `image`: Image URL or IndexedDB image reference
  - `dateAdded`: ISO creation timestamp for chronological sorting and recent product tracking
- **Capacity**: Engineered to handle 100+ wholesale items smoothly without layout distortion or performance degradation.

### 2. Dual-Layer Storage Engine (IndexedDB + LocalStorage)
- **LocalStorage**: Used for product metadata, shopping cart items, and demo admin session state.
- **IndexedDB (`MeridianWholesaleDB`)**: Specifically dedicated to storing high-resolution product image files uploaded from the user's device via `FileReader`. This prevents the common 5MB LocalStorage quota exhaustion limitation when managing large catalogs.
- **Resilience**: Graceful fallbacks ensure missing or corrupt records do not break page rendering.

### 3. Admin Authentication & Route Protection
- **Login Portal (`admin/login.html`)**:
  - Email and password input validation.
  - Interactive **show/hide password toggle**.
  - Informative error messaging for invalid credentials.
  - Session preservation with remember me support.
- **Route Protection**: Unauthenticated access to `admin/dashboard.html` automatically triggers an authorization alert and redirects back to `admin/login.html?redirect=dashboard.html`.
- **Session Logout**: Securely clears the session and returns the user to the login portal.

### 4. Owner / Admin Dashboard (`admin/dashboard.html`)
- **Key Performance Indicators (KPIs)**:
  - Total Products count.
  - Active Divisions count.
  - In-Stock items count.
  - Calculated Total Inventory Value ($).
- **Products by Category Breakdown**: Visual progress distribution widget showing SKU counts and percentages per division.
- **Recently Added Products**: Overview card highlighting the latest additions sorted by `dateAdded`.
- **Add Product Modal**:
  - Live product image file upload via HTML5 `FileReader` with instant preview.
  - Optional image URL / asset path support.
  - Auto-generated or custom SKU code.
  - Case price, MOQ, units per case, inventory stock, and lead time.
  - Strict input validation preventing zero or empty submissions.
- **Edit Product Modal**: Loads existing product data into the form, allows field updates and image replacement, and saves changes without creating duplicate items.
- **Delete Product**: Accessible confirmation modal preventing accidental deletions; immediately purges records from storage and updates the catalog.
- **Manage Products Table**: Real-time keyword search and category dropdown filters.
- **Testing Shortcuts**:
  - *"Load Sample Catalog"*: Seeds 8 verified B2B commercial products for rapid grading and demonstration.
  - *"Reset to Empty State"*: Clears the catalog to immediately re-verify the initial empty state requirement.

### 5. Customer Product Catalog (`products.html`)
- **Dynamic Grid Layout**: Seamlessly transitions from 3 columns (desktop) to 2 (tablet) and 1 (mobile).
- **Interactive Search**: Real-time keyword matching across product title, SKU, category, and technical description as the user types.
- **Category Filter Sidebar**: Allows switching between All Categories, Commercial Kitchen, Industrial Hardware, Eco Packaging, and Facility Equipment with dynamic live product counts.
- **Min & Max Price Filters**: Dual input fields (Min $ and Max $) plus an interactive range slider that update results in real time.
- **Multi-Criteria Sorting**:
  - Price: Low to High
  - Price: High to Low
  - Name: A to Z
  - Newest First (using `dateAdded`)
- **Combined Filtering**: Search keywords, category selection, price ranges, and sorting operate in unison.
- **Live Match Counter**: Shows "Showing X of Y wholesale products".
- **Clear Filters Option**: Instantly resets all search and filter parameters.

### 6. Product Details Page (`product-details.html`)
- **Accurate Product Lookup**: Loads exact product data using the URL parameter `?id=...`.
- **Back to Products**: Prominent link to return to the catalog.
- **Large Gallery & Specs**: High-resolution image view with packaging dimensions, weight, and certifications.
- **Tiered Volume Pricing Matrix**: Live calculation table displaying volume brackets (e.g., 1-9 cases, 10-24 cases, 25+ cases) with automated savings percentages.
- **Quantity Selector**: Stepper controls enforcing Minimum Order Quantity (MOQ) and positive integers.
- **Contiguous Purchase Action**: Single click adds specified case quantity to cart with live toast feedback.
- **Related Products**: Displays up to 3 cross-sell products strictly from the same wholesale category.

### 7. Wholesale Quote & Shopping Cart (`cart.html`)
- **Itemized Overview**: Thumbnail, SKU, title, units per case, unit price, quantity stepper, and line item subtotal.
- **Duplicate Prevention**: Adding an existing item increments its quantity rather than creating a duplicate row.
- **Quantity Adjuster**: Allows incrementing, decrementing, or manually entering valid quantities; zero or negative input prompts item removal.
- **Real-Time Global Header Badge**: Displays current item count across all pages simultaneously.
- **Commercial Freight Rules**: Free scheduled LTL pallet freight on orders exceeding $1,500 ($120 standard LTL freight otherwise).
- **Tax Exemption**: Wholesale B2B resale exemption ($0.00 tax with valid resale certificate).
- **Purchase Order Checkout Modal**:
  - Enterprise fields: Company Name, EIN / Resale Certificate #, PO Number, Receiving Facility Dock Type (Raised Dock, Liftgate, Jobsite), Payment Terms (Net 30, Wire Transfer, Corporate Card).
  - Clear frontend prototype notice explaining live payment processing simulation.
- **Order Confirmation Receipt**: Generates a simulated Purchase Order number (PO-#) with order total and clears the cart upon completion.

---

## 📁 Project Folder Structure

```
ecommerce-website/
├── index.html                   # Storefront Homepage
├── products.html                # Wholesale Product Catalog with Search & Filters
├── product-details.html         # Individual Product Detail View & Tier Pricing
├── cart.html                    # Shopping Cart with LTL Freight & PO Checkout
├── README.md                    # Project Documentation & Architecture
├── admin/
│   ├── login.html               # Owner / Admin Authentication Portal
│   └── dashboard.html           # Owner Inventory Management & Product CRUD
├── css/
│   ├── style.css                # Primary Design System, CSS Variables, Typography
│   ├── responsive.css           # Mobile Drawers, Touch Targets & Adaptive Grids
│   └── admin.css                # Dashboard KPIs, Modals & Data Tables
├── js/
│   ├── main.js                  # Shared Store Engine (ProductStore, ImageDB, CartStore, AuthStore)
│   ├── products.js              # Catalog Controller (Search, Category & Price Filters)
│   ├── cart.js                  # Shopping Cart & Checkout Purchase Order Simulation
│   └── admin.js                 # Admin Auth, Inventory CRUD & Category Breakdown
└── assets/
    └── images/                  # High-Resolution Commercial Product & Facility Photography
        ├── hero_wholesale.jpg
        ├── cat_commercial_kitchen.jpg
        ├── cat_industrial_hardware.jpg
        ├── cat_packaging_supplies.jpg
        └── cat_facility_equipment.jpg
```

---

## 🚀 How to Run the Project Locally

### Option 1: Standalone Static Server (Zero Build Tooling Required)
All pages, stylesheets, scripts, and image assets use standard relative paths. You can run the website with any static file server:

```bash
# Navigate to the project directory
cd ecommerce-website

# Using Python 3 built-in HTTP server:
python3 -m http.server 8000

# Or using Node http-server / serve:
npx serve .
```
Then open `http://localhost:8000` in your web browser.

### Option 2: Vite Development Server
If using the development tooling environment:
```bash
npm install
npm run dev
# The server will run on http://localhost:3000
```

### Production Build
```bash
npm run build
```

---

## ⚠️ Known Limitations of Frontend-Only Implementation

1. **Client-Side Authentication**: Because this is a frontend prototype without a live backend server, user credentials and session tokens are evaluated in client JavaScript (`AuthStore`). In a production commercial release, authentication is delegated to secure server-side HTTP-only cookies, OAuth 2.0, or JSON Web Tokens (JWT).
2. **Local Browser Storage Scope**: Products added or edited by the owner are saved in the user's browser `LocalStorage` and `IndexedDB`. Data is persisted across page reloads and browser sessions on the same machine, but is not synchronized across different computers without a shared cloud database (e.g., PostgreSQL / Firebase).
3. **Simulated Payment Gateway**: The checkout system simulates enterprise B2B Purchase Order submission (generating PO numbers, tax exemption records, and freight bills) rather than processing live credit cards or commercial wire transfers through Stripe/Authorize.net.
