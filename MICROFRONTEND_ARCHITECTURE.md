# Microfrontend Architecture

## Table of Contents

1. [What is a Microfrontend?](#what-is-a-microfrontend)
2. [Why Microfrontends for This E-Commerce Project](#why-microfrontends-for-this-e-commerce-project)
3. [Architecture Pattern Used in This Project](#architecture-pattern-used-in-this-project)
4. [Application Roles and Responsibilities](#application-roles-and-responsibilities)
5. [How Apps Are Built and Bundled](#how-apps-are-built-and-bundled)
6. [Shared Dependencies](#shared-dependencies)
7. [Communication Between Apps](#communication-between-apps)
8. [Routing Strategy](#routing-strategy)
9. [Current Architecture vs Pure Module Federation](#current-architecture-vs-pure-module-federation)
10. [Module Federation — How It Works (Future Path)](#module-federation--how-it-works-future-path)
11. [Deployment Independence](#deployment-independence)
12. [Challenges and Design Decisions](#challenges-and-design-decisions)
13. [Benefits Summary](#benefits-summary)
14. [Future Evolution Roadmap](#future-evolution-roadmap)

---

## What is a Microfrontend?

A **microfrontend** is an architectural style where a frontend application is decomposed into smaller, independently owned and deployable pieces, each responsible for a distinct business domain or user-facing capability.

The term draws directly from **microservices** on the backend — instead of one large monolithic frontend bundle, you have multiple smaller frontend applications that compose to form the complete user experience.

**Core principles:**

| Principle | Meaning |
|---|---|
| Independent deployability | Each microfrontend can be built, tested, and deployed without touching others |
| Domain ownership | Each app is owned end-to-end by a single team — from UI to deployment |
| Technology agnostic | Different apps can (in theory) use different frameworks or versions |
| Isolated failure | A failure in one MFE does not crash the rest of the application |
| Loose coupling | Apps share only well-defined contracts (types, events, APIs) |

**Real-world analogy — a shopping mall:**
- The **entire mall** = your complete e-commerce platform as the user experiences it
- **Individual stores** = individual microfrontend apps (customer shop, admin panel, product catalog)
- **Standardised storefronts** = shared contracts — TypeScript interfaces, shared components
- **Common infrastructure** = shared library providing common utilities and state hooks

Each store operates independently, can be renovated without closing the others, and follows the mall's uniform standards.

---

## Why Microfrontends for This E-Commerce Project

An e-commerce platform is a natural fit for the microfrontend pattern because it has **distinct user audiences with completely different needs:**

| Audience | App | Key Concerns |
|---|---|---|
| Customers | `customer-app` | Fast page loads, cart persistence, search UX, mobile responsiveness |
| Administrators | `admin-dashboard` | Data tables, CRUD operations, metrics, bulk actions |
| Catalogue service | `product-catalog` | Read-heavy product display, category navigation, high SEO value |

**Without microfrontends** (monolith), all three domains are bundled together. A change to the admin order table triggers a full re-deploy of the customer shopping experience. Teams working on different domains block each other.

**With microfrontends**, each app can:
- Be released independently on its own schedule
- Be maintained by a dedicated team without merge conflicts
- Scale independently (the product catalog may need CDN edge caching, admin does not)
- Be individually optimised for its user audience

---

## Architecture Pattern Used in This Project

This project implements the **Monorepo Shared Library Microfrontend** pattern — sometimes called the **Import-based composition** model.

```
                     ┌──────────────────────────────────┐
                     │  @react-microfrontend-workspace/  │
                     │         shared  (libs/shared)     │
                     │                                   │
                     │  • TypeScript types               │
                     │  • CartContext + CartProvider      │
                     │  • ProductContext + ProductProvider│
                     │  • useCart() hook                 │
                     │  • useProducts() hook             │
                     │  • ProductCard component          │
                     │  • CartSummary component          │
                     └──────────────┬───────────────────┘
                                    │  npm workspace import
              ┌─────────────────────┼────────────────────┐
              │                     │                    │
    ┌─────────▼──────┐  ┌───────────▼───────┐  ┌────────▼──────────┐
    │  customer-app  │  │  admin-dashboard  │  │  product-catalog  │
    │  Port 4200     │  │  Port 4201        │  │  Port 4202        │
    │                │  │                  │  │                   │
    │  Shopping       │  │  Admin panel      │  │  Product listing  │
    │  Cart mgmt      │  │  CRUD + metrics   │  │  Category filter  │
    │  Search/filter  │  │  Order tracking   │  │  Read-only view   │
    └────────────────┘  └──────────────────┘  └───────────────────┘

    Each app:
    ✅ Has its own Vite build
    ✅ Runs on its own port
    ✅ Can be deployed independently
    ✅ Is tested independently
    ✅ Can be developed independently
```

**The key characteristic:** The shared library is consumed at **build time** via NPM Workspaces (not at runtime via Module Federation). When an app builds, the shared library source code is bundled into that app's output.

---

## Application Roles and Responsibilities

### Shell / Host Concept in This Project

This architecture does not have a single explicit **shell/host** application that orchestrates all others. Instead, each app is **complete and standalone** — it wraps itself in the necessary providers and renders independently. This is intentional at the current scale.

In a future Module Federation upgrade, `customer-app` would become the primary shell for the customer-facing experience, and `admin-dashboard` would become the shell for the admin experience.

### App Role Mapping

| App | Type | Business Domain | Runs Standalone? | Shared Lib Needed? |
|---|---|---|---|---|
| `customer-app` | Full Feature App | Customer shopping journey | ✅ Yes | ✅ Yes |
| `admin-dashboard` | Full Feature App | Store administration | ✅ Yes | ✅ Yes (useProducts) |
| `product-catalog` | Feature App | Product display and discovery | ✅ Yes | ✅ Yes |
| `libs/shared` | Shared Library | Cross-cutting state + UI | ❌ Not deployed | — |

### `customer-app` — Customer Shopping Experience

**Port:** 4200  
**Users:** Shoppers  
**Business responsibility:** The entire customer purchase journey

What it handles:
- Browse products with search and category filtering (`ProductGrid`)
- View individual product details via `ProductCard`
- Manage shopping cart — add, remove, update quantities
- View order summary and proceed to checkout (`CartPage`)
- Navigation between Shop and Cart views (`Header`)

Dependencies on shared lib:
- `ProductProvider` → `useProducts()` → products data
- `CartProvider` → `useCart()` → cart items, totals, actions
- `ProductCard` → renders each product
- `CartSummary` → renders cart items

---

### `admin-dashboard` — Store Administration Panel

**Port:** 4201  
**Users:** Store administrators and operations staff  
**Business responsibility:** Managing the store — products, orders, settings

What it handles:
- **Overview tab:** KPI stat cards (total products, orders, revenue, customers)
- **Products tab:** Product management table with Add / Edit / Delete actions
- **Orders tab:** Order list with status indicators
- **Settings tab:** Store configuration (name, currency, notification preferences)

Dependencies on shared lib:
- `ProductProvider` → `useProducts()` → products data for the product table

Notable: Admin Dashboard does **not** use `CartProvider` — it has no cart functionality.

---

### `product-catalog` — Product Catalogue Viewer

**Port:** 4202  
**Users:** Shoppers (alternate product discovery surface) / API consumers  
**Business responsibility:** Read-only, filtered product display

What it handles:
- Display all products in a responsive grid
- Filter products by category via a button group
- Show product details, ratings, and stock status via `ProductCard`

In a microservices architecture, this app would typically be the "frontend" for a Product Service backend. It has no cart functionality and no write operations.

---

## How Apps Are Built and Bundled

Each app is built independently using **Vite 7**. Vite processes:

1. TypeScript compilation via the `@vitejs/plugin-react` plugin (using esbuild under the hood for speed)
2. Tailwind CSS via PostCSS
3. Tree-shaking of unused code — including unused exports from `libs/shared`
4. Code splitting (vendor chunk for React, app chunk for business code)
5. Asset hashing for long-term cache invalidation

**Build outputs:**
```
apps/customer-app/dist/
├── index.html
├── assets/
│   ├── index-[hash].js       ← App bundle (includes shared lib code)
│   ├── vendor-[hash].js      ← React + react-dom chunk
│   └── index-[hash].css      ← Compiled Tailwind CSS
```

Each app's `dist/` is entirely self-contained — it includes everything needed to run, including the bundled shared library code. There is no runtime dependency on any other app's dist folder.

**Shared library is bundled into each app** at build time. This means:
- If `libs/shared` is updated, each dependent app must be rebuilt and redeployed to pick up the change
- There is no shared code duplication problem at runtime (each app gets exactly what it uses, tree-shaken)
- Bundle sizes stay optimised per app

---

## Shared Dependencies

The shared library (`libs/shared`) provides the following to all consuming apps:

### Types (structural contracts)

```ts
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  rating: number;
  reviewCount: number;
  image?: string;
}

interface CartItem {
  productId: string;    // ← Note: productId, not product.id
  quantity: number;
  price: number;
}
```

TypeScript enforces these shapes across all apps. Violating the contract fails compilation.

### State (Context Providers)

| Provider | State it holds | Who wraps it |
|---|---|---|
| `ProductProvider` | Products array, loading, error, search term, selected category | All 3 apps (in `main.tsx`) |
| `CartProvider` | Cart items, totals | `customer-app` only |

### Hooks (Context consumers)

| Hook | Returns |
|---|---|
| `useProducts()` | `{ products, filteredProducts, loading, error, searchTerm, setSearchTerm, selectedCategory, setSelectedCategory }` |
| `useCart()` | `{ items, addToCart, removeFromCart, updateQuantity, getTotalPrice, getTotalItems }` |

### Components

| Component | Used by |
|---|---|
| `ProductCard` | `customer-app` (ProductGrid), `product-catalog` (ProductCatalog) |
| `CartSummary` | `customer-app` (CartPage) |

---

## Communication Between Apps

In the current architecture, the three apps **do not communicate with each other at runtime**. Each app manages its own state internally, seeded from the shared `ProductContext` mock data.

**Intra-app communication** (within a single app) happens exclusively through the Context API:

```
User action (e.g. click "Add to Cart")
    → Component calls addToCart() from useCart()
    → CartContext state updates
    → All consumers of CartContext re-render
    → Header badge updates
    → CartSummary updates
```

**Cross-app communication** would be required if, for example, the admin dashboard needed to update product stock and have the customer app reflect that change in real time. Options for this at scale:

| Mechanism | Use Case |
|---|---|
| Shared backend API | Both apps read from same REST/GraphQL service — preferred |
| Browser-level events (`CustomEvent`) | Loose runtime coupling without a framework |
| Module Federation shared state | Single Redux/Zustand store federated across MFEs |
| URL / query params | Navigation state passed between apps via deep links |

---

## Routing Strategy

Each app manages its **own internal routing** independently. There is no cross-app router.

### Current Routing (No Router Library)

All three apps use a simple **state-based page switch** within a single React component tree. There is no React Router or similar library in the current implementation.

**`customer-app` example:**
```tsx
// CustomerApp.tsx
const [currentPage, setCurrentPage] = useState<'shop' | 'cart'>('shop');

return (
  <>
    <Header onCartClick={() => setCurrentPage('cart')} />
    {currentPage === 'shop' ? <ProductGrid /> : <CartPage />}
  </>
);
```

**Why:** At the current scale, each app has only 2–3 views. A full router adds configuration overhead with no meaningful benefit. The architecture supports adding React Router later without structural changes.

### Future Routing with React Router

For apps with deeper navigation trees, each app would add React Router independently:

```tsx
// Each app owns its own <Routes>
<Routes>
  <Route path="/"          element={<ShopPage />} />
  <Route path="/cart"      element={<CartPage />} />
  <Route path="/product/:id" element={<ProductDetailPage />} />
</Routes>
```

In a Module Federation setup, the host app's router would delegate sub-paths to remote applications, each managing their own route segments.

---

## Current Architecture vs Pure Module Federation

Understanding the distinction between the current pattern and a full Module Federation implementation is important for planning the next phase of the platform.

### Current: Monorepo Shared Library (Build-time composition)

```
Build time:
    Shared lib source → inlined into each app's bundle

Runtime:
    customer-app/dist  ← self-contained bundle
    admin-dashboard/dist ← self-contained bundle
    product-catalog/dist ← self-contained bundle
    (no runtime dependencies between apps)
```

**Characteristics:**
- ✅ Simple — no Webpack Module Federation config
- ✅ Strongly typed — TypeScript checks span the entire monorepo
- ✅ Fast builds — Vite is highly optimised for this model
- ✅ Easy debugging — no dynamic loading, no runtime resolution failures
- ❌ Shared lib changes require rebuilding all consuming apps
- ❌ Apps cannot load each other's components at runtime

### Future: Module Federation (Runtime composition)

```
Build time:
    Each app is built and deployed independently
    admin-dashboard exposes AdminDashboard component via remoteEntry.js

Runtime:
    Host app (port 5000) loads
        → fetches admin/remoteEntry.js from http://localhost:4201
        → dynamically imports AdminDashboard component
        → renders it inside the host's layout
```

**Module Federation config example:**
```js
// Host (shell) app vite.config.ts — using @originjs/vite-plugin-federation
federation({
  name: 'host',
  remotes: {
    adminApp:   'admin@http://localhost:4201/assets/remoteEntry.js',
    catalogApp: 'catalog@http://localhost:4202/assets/remoteEntry.js',
  },
  shared: ['react', 'react-dom']
})

// admin-dashboard vite.config.ts
federation({
  name: 'admin',
  filename: 'remoteEntry.js',
  exposes: {
    './AdminDashboard': './src/AdminDashboard.tsx',
  },
  shared: ['react', 'react-dom']
})
```

**When to upgrade to Module Federation:**

| Signal | Description |
|---|---|
| Multiple teams | Two or more teams need to deploy the same app independently with zero coordination |
| Runtime plugin system | Admin needs to load a new reporting widget without redeploying the shell |
| Third-party micro-apps | An external vendor provides a pre-built MFE to embed |
| Partial page updates | A product widget needs to update in the shell without a full page reload |
| Different framework versions | One team needs React 19 while another stays on React 18 |

---

## Deployment Independence

Each app is independently deployable because each app's `dist/` folder is a complete, standalone static site. No app's runtime depends on another app's files being present.

**Independent deployment model:**

```
CI/CD Pipeline (per app or per monorepo — see CI_CD_AND_PRECOMMIT.md)
        │
        ├─► Build customer-app/dist  → Deploy to cdn.example.com/customer/
        │
        ├─► Build admin-dashboard/dist → Deploy to admin.example.com/
        │
        └─► Build product-catalog/dist → Deploy to cdn.example.com/catalog/
```

**Three deployment topology options:**

**Option 1: Path-based on a single domain**
```
https://example.com/shop     → serves customer-app/dist
https://example.com/admin    → serves admin-dashboard/dist
https://example.com/catalog  → serves product-catalog/dist
```

**Option 2: Subdomain per app**
```
https://shop.example.com     → serves customer-app/dist
https://admin.example.com    → serves admin-dashboard/dist
https://catalog.example.com  → serves product-catalog/dist
```

**Option 3: Separate CDN buckets per app**
```
cdn-us-east-1.example.com/customer/  → customer-app
cdn-us-east-1.example.com/admin/     → admin-dashboard
cdn-us-east-1.example.com/catalog/   → product-catalog
```

Each option supports rolling deployments of individual apps without any downtime for others. A new version of `admin-dashboard` can go live while `customer-app` and `product-catalog` continue serving their current versions.

---

## Challenges and Design Decisions

### Challenge 1: Shared State Across Apps

**Problem:** The customer view and the admin view conceptually share the same product catalogue and orders. How should state be consistent?

**Current solution:** Both apps have their own `ProductProvider` instances initialised with the same mock data. They are currently independent.

**Production solution:** Both apps would fetch from the same backend API (REST or GraphQL). Product Provider would call `GET /api/products`. Cart state would be persisted via `POST /api/cart` and a user session.

---

### Challenge 2: Consistent Visual Design

**Problem:** Three separately deployed apps must look like one cohesive product to users.

**Current solution:** Tailwind CSS with identical configuration files per app, and shared `ProductCard` / `CartSummary` components bundled from `libs/shared`.

**Production solution:** Elevate the Tailwind config to a shared package (`libs/design-tokens`) and ensure all apps extend from it. Shared components library grows to include `Button`, `Input`, `Modal`, `Toast`, etc.

---

### Challenge 3: Shared TypeScript Types at Scale

**Problem:** When types change in `libs/shared`, all apps must be updated and redeployed.

**Current solution:** The monorepo structure means TypeScript catches breakages immediately — any incompatible change fails compilation workspace-wide.

**Production solution (Module Federation):** Types are published as a separate `@ecommerce/types` npm package with semantic versioning. Each app explicitly declares the version it consumes, allowing gradual migration.

---

### Challenge 4: Testing Isolation

**Problem:** Component tests in `apps/*` that import from `@react-microfrontend-workspace/shared` need the shared lib to be resolvable without building it first.

**Solution:** `jest.config.js` at root uses `moduleNameMapper` to redirect the package name to the TypeScript source:
```js
moduleNameMapper: {
  '^@react-microfrontend-workspace/shared$': '<rootDir>/libs/shared/src/index.ts'
}
```
Apps mock the shared library's hooks and components to test their own logic in isolation.

---

## Benefits Summary

| Benefit | Detail |
|---|---|
| **Team independence** | Each app can be owned, developed, and deployed by a separate team without coordination overhead |
| **Deployment flexibility** | Ship a customer-facing feature without touching the admin panel |
| **Separation of concerns** | Customer UX concerns never leak into admin architecture decisions |
| **Scalable codebase** | Apps grow independently; adding a new MFE (e.g., checkout) doesn't require touching existing apps |
| **Isolated testing** | Each app's test suite runs and passes independently |
| **Technology evolution** | Individual apps can upgrade dependencies (e.g., migrate to React 19 one at a time) |
| **Fault isolation** | A runtime error in the admin dashboard does not break the customer shopping experience |

---

## Future Evolution Roadmap

```
Phase 1 (Current)
├── NPM Workspaces monorepo
├── Three independent Vite apps
├── Shared library via build-time import
└── Independent deployment of dist/ folders

Phase 2 (Near-term)
├── Add real backend API (replace mock data in ProductContext)
├── Add React Router to customer-app and admin-dashboard
├── Extract design tokens to libs/design-tokens
├── Add Redux Toolkit or Zustand to shared lib for richer state
└── Add E2E tests with Cypress per app

Phase 3 (Full Module Federation)
├── Add vite-plugin-federation to each app
├── Designate customer-app as the primary shell
├── Expose AdminDashboard and ProductCatalog as remotes
├── Enable runtime loading of remote apps in the shell
├── Separate CI/CD pipeline per remote app
└── Implement shared dependency versioning strategy
```
