# Architecture & Setup Guide

## Table of Contents

1. [Workspace Overview](#workspace-overview)
2. [Technology Stack](#technology-stack)
3. [Folder Structure](#folder-structure)
4. [Root-Level Configuration Files](#root-level-configuration-files)
5. [Shared Library (`libs/shared`)](#shared-library-libsshared)
6. [Microfrontend Applications](#microfrontend-applications)
7. [Entry Files & Application Bootstrap](#entry-files--application-bootstrap)
8. [State Management Architecture](#state-management-architecture)
9. [Styling Architecture](#styling-architecture)
10. [Development & Build Commands](#development--build-commands)

---

## Workspace Overview

This is a **monorepo-based microfrontend e-commerce workspace** managed with **NPM Workspaces** and **Nx**. The workspace contains three independent React microfrontend applications and one shared library, all written in TypeScript.

The monorepo pattern was chosen to allow:
- Atomic commits across multiple apps and the shared library
- Shared TypeScript type checking at build time
- A single CI/CD pipeline governing all apps
- Consistent tooling (ESLint, Prettier, Jest) across every package

```
Monorepo Root (react-microfrontend-workspace)
├── libs/shared          ← Shared library: components, hooks, context, types
├── apps/customer-app    ← Microfrontend: customer shopping experience
├── apps/admin-dashboard ← Microfrontend: admin management panel
└── apps/product-catalog ← Microfrontend: product listing and filtering
```

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| UI Framework | React | 19.0.0 | Component rendering |
| Language | TypeScript | ~5.9.2 | Static typing across entire codebase |
| Build Tool | Vite | ^7.0.0 | Fast HMR dev server and production bundling |
| Styling | Tailwind CSS | 3.4.3 | Utility-first CSS |
| State Management | Context API + Hooks | — | Cart and product state shared via shared lib |
| Monorepo Tooling | Nx | Latest | Task orchestration, dependency graph, caching |
| Package Manager | npm Workspaces | — | Single `node_modules`, workspace-aware installs |
| Test Runner | Jest + ts-jest | ^30.x | Unit and component testing |
| Test DOM | jest-environment-jsdom | ^30.x | DOM simulation for React component tests |
| Test Utilities | @testing-library/react | ^16.x | React component testing helpers |
| Linter | ESLint + @nx/eslint-plugin | ^9.x | Code quality enforcement |
| Formatter | Prettier | ~3.6.2 | Consistent code style |
| Git Hooks | Husky + lint-staged | ^9.x / ^16.x | Pre-commit quality gates |
| Commit Linting | @commitlint/cli | ^20.x | Enforce conventional commit messages |

---

## Folder Structure

```
react-microfrontend-workspace/
│
├── .github/
│   └── workflows/
│       ├── build-deploy.yml          # CI/CD: build + deploy on push to main
│       └── pr-checks.yml             # CI/CD: typecheck + lint + test on PRs
│
├── .husky/
│   ├── pre-commit                    # Runs lint-staged before every commit
│   └── commit-msg                    # Runs commitlint on commit message
│
├── libs/
│   └── shared/                       # Shared library package
│       ├── src/
│       │   ├── index.ts              # Barrel export — public API of the library
│       │   ├── types/
│       │   │   └── index.ts          # Product, CartItem, Order, User interfaces
│       │   ├── context/
│       │   │   ├── CartContext.tsx   # Cart state: add/remove/update/totals
│       │   │   ├── ProductContext.tsx # Product catalog state: search/filter
│       │   │   └── index.ts
│       │   ├── hooks/
│       │   │   ├── useCart.ts        # Consumes CartContext
│       │   │   ├── useProducts.ts    # Consumes ProductContext
│       │   │   └── index.ts
│       │   └── components/
│       │       ├── ProductCard.tsx   # Reusable product display card
│       │       ├── CartSummary.tsx   # Order summary with totals
│       │       └── index.ts
│       ├── package.json              # Package name: @react-microfrontend-workspace/shared
│       ├── tsconfig.json             # TypeScript config for the library
│       └── tsconfig.app.json         # Build-time TypeScript config
│
├── apps/
│   │
│   ├── customer-app/                 # Microfrontend: Customer Shopping (Port 4200)
│   │   ├── src/
│   │   │   ├── main.tsx              # React root + context provider wrapping
│   │   │   ├── index.tsx             # Vite HTML injection point
│   │   │   ├── CustomerApp.tsx       # Root component: page switching (Shop/Cart)
│   │   │   ├── components/
│   │   │   │   ├── Header.tsx        # Navigation bar + cart item badge
│   │   │   │   └── ProductGrid.tsx   # Product listing with search and filters
│   │   │   ├── pages/
│   │   │   │   └── CartPage.tsx      # Cart management page
│   │   │   └── styles/
│   │   │       └── globals.css
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── tsconfig.app.json
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   └── package.json
│   │
│   ├── admin-dashboard/              # Microfrontend: Admin Panel (Port 4201)
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── index.tsx
│   │   │   ├── AdminDashboard.tsx    # Multi-tab dashboard (Overview/Products/Orders/Settings)
│   │   │   └── styles/
│   │   │       └── globals.css
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── tsconfig.app.json
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   └── package.json
│   │
│   └── product-catalog/              # Microfrontend: Product Catalog (Port 4202)
│       ├── src/
│       │   ├── main.tsx
│       │   ├── index.tsx
│       │   ├── ProductCatalog.tsx    # Catalog grid with category filtering
│       │   └── styles/
│       │       └── globals.css
│       ├── index.html
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── tsconfig.app.json
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       └── package.json
│
├── package.json                      # Root: workspace config, shared devDependencies, scripts
├── tsconfig.base.json                # Base TypeScript config inherited by all packages
├── tsconfig.json                     # Root TypeScript project references
├── nx.json                           # Nx workspace configuration
├── eslint.config.mjs                 # Root ESLint flat config
├── commitlint.config.js              # Conventional commit rules
├── jest.config.js                    # Root Jest config covering all packages
├── test-setup.ts                     # Jest global setup (imports @testing-library/jest-dom)
└── README.md                         # Project overview and quick-start
```

---

## Root-Level Configuration Files

### `package.json`

**What it does:** Defines the NPM workspace, all shared `devDependencies`, and root-level scripts.

**Why it exists:** In an NPM Workspace monorepo, the root `package.json` is the single source of truth for tooling. All packages under `libs/*` and `apps/*` can access root `devDependencies` without installing them individually. This keeps the dependency tree flat and avoids version conflicts.

**Key sections:**

```jsonc
{
  "name": "@react-microfrontend-workspace/source",
  "workspaces": ["libs/*", "apps/*"],   // Declares all workspace packages
  "scripts": {
    "dev:customer": "npm run dev -w apps/customer-app",
    "dev:admin":    "npm run dev -w apps/admin-dashboard",
    "dev:catalog":  "npm run dev -w apps/product-catalog",
    "build":        "npm run build:customer && npm run build:admin && npm run build:catalog",
    "lint":         "eslint . --ext .ts,.tsx,.js,.jsx",
    "test":         "jest",
    "test:watch":   "jest --watch",
    "test:coverage":"jest --coverage"
  }
}
```

The `-w` flag targets a specific workspace package. Dependencies like `typescript`, `eslint`, `jest`, `prettier`, and `husky` are all declared here at the root so every app shares the same version.

---

### `tsconfig.base.json`

**What it does:** Defines the shared TypeScript compiler options inherited by every `tsconfig.json` in the workspace.

**Why it exists:** Prevents duplicating/drifting compiler settings across 4+ packages. All tsconfigfiles `extend` this base.

**Key options and their purpose:**

```jsonc
{
  "compilerOptions": {
    "composite": true,           // Required for TypeScript project references
    "declarationMap": true,      // Emit .d.ts.map for IDE go-to-definition across packages
    "emitDeclarationOnly": true, // libs/shared emits only type declarations, not JS (Vite handles JS)
    "isolatedModules": true,     // Each file transpilable independently (required for Vite/ts-jest)
    "jsx": "react-jsx",          // Use the new JSX transform (no `import React` needed)
    "module": "esnext",          // ESM output — Vite tree-shakes it
    "moduleResolution": "bundler", // Resolves like Vite/webpack, supports package.json exports
    "strict": true,              // Enables all strict type checks
    "target": "es2022",          // Modern JS output; Vite handles further transpilation for older browsers
    "customConditions": ["@react-microfrontend-workspace/source"]  // Nx workspace condition
  }
}
```

---

### `tsconfig.json` (root)

**What it does:** Defines TypeScript **project references** — the graph of which packages reference which.

**Why it exists:** TypeScript project references allow `tsc --build` to compile in dependency order and cache results. It also means editor tooling understands cross-package type navigation.

```jsonc
{
  "references": [
    { "path": "./libs/shared" },
    { "path": "./apps/customer-app" },
    { "path": "./apps/admin-dashboard" },
    { "path": "./apps/product-catalog" }
  ]
}
```

---

### `nx.json`

**What it does:** Configures the Nx task runner, plugins, and pipeline caching behaviour.

**Why it exists:** Nx adds smart task orchestration on top of NPM Workspaces. It understands which projects are affected by a change, caches task outputs, and runs only what is necessary.

**Key sections:**

- **`plugins`** — Registers Nx plugins:
  - `@nx/js/typescript` — Powers `typecheck` and `build` targets for TypeScript projects
  - `@nx/vite/plugin` — Autodiscovers Vite `build`, `dev`, `preview` targets from `vite.config.ts`
  - `@nx/eslint/plugin` — Autodiscovers `lint` target from `eslint.config.mjs`
  - `@nx/react/router-plugin` — React Router integration for apps
  - `@nx/vitest` — Vitest test target discovery (retained in config but Jest is active test runner)

- **`namedInputs`** — Defines file glob patterns (`default`, `production`) used to fingerprint task inputs for caching. The `production` input excludes test files and spec configs so a test-only change does not invalidate the production build cache.

- **`targetDefaults.test.dependsOn`** — Ensures `build` of dependencies runs before `test`.

---

### `eslint.config.mjs`

**What it does:** Defines all ESLint rules for the monorepo using the new **flat config** format.

**Why it exists:** A single root ESLint config governs every `.ts`, `.tsx`, `.js`, and `.jsx` file across all packages — no per-app `.eslintrc` files needed.

**Key rules:**

- Extends `@nx/eslint-plugin` presets for base, TypeScript, and JavaScript rules
- `@nx/enforce-module-boundaries` — Prevents cross-cutting imports that violate the monorepo dependency graph (e.g., one app importing internals of another app)
- Ignores `dist/`, `build/`, and Vite timestamp cache files

---

### `commitlint.config.js`

**What it does:** Enforces the **Conventional Commits** specification on every commit message.

**Why it exists:** Consistent commit messages enable automated changelog generation, semantic versioning, and clear git history.

**Allowed types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `revert`

**Format:** `type(optional-scope): lowercase subject` — no trailing period.

**Examples:**
```
feat(customer-app): add product search filter
fix(shared): prevent negative cart quantity
test(shared): add useCart hook unit tests
chore: update jest to v30
```

---

### `jest.config.js`

**What it does:** Root Jest configuration that runs all tests across `libs/` and `apps/`.

**Why it exists:** A single Jest config at the root means `npm test` from the workspace root discovers and runs every `*.spec.ts(x)` file in one pass, with correct module resolution for the shared library alias.

**Key configuration:**

```js
module.exports = {
  testEnvironment: 'jsdom',           // Simulates browser DOM for React component tests
  roots: ['<rootDir>/libs', '<rootDir>/apps'],
  testMatch: ['**/*.spec.ts', '**/*.spec.tsx'],
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { ... }]  // Transpiles TS/TSX via ts-jest
  },
  setupFilesAfterEnv: ['<rootDir>/test-setup.ts'],  // Loads jest-dom matchers
  moduleNameMapper: {
    // Resolves the shared lib package name to its source entry point
    '^@react-microfrontend-workspace/shared$': '<rootDir>/libs/shared/src/index.ts'
  }
};
```

The `moduleNameMapper` is critical — it redirects the `@react-microfrontend-workspace/shared` package import to the TypeScript source rather than a compiled dist folder, allowing tests to run without a prior build step.

---

### `test-setup.ts`

**What it does:** Imported before every test suite. Adds `@testing-library/jest-dom` custom matchers to Jest.

**Why it exists:** Enables assertions like `expect(element).toBeInTheDocument()`, `toBeDisabled()`, `toHaveTextContent()`, etc., which are not part of Jest's built-in matchers.

---

## Shared Library (`libs/shared`)

The shared library is the foundation of the monorepo. It is imported by all three apps via the NPM workspace package name `@react-microfrontend-workspace/shared`.

### Package Identity

```json
{ "name": "@react-microfrontend-workspace/shared" }
```

NPM Workspaces resolves this name to `libs/shared/src/index.ts` at development time — no build step required for the shared lib to be consumed.

### Public API (`src/index.ts`)

The barrel file is the **only** import surface for consumers. All exports are explicitly listed here. Apps should never deep-import into the shared library internals.

```ts
// What apps import:
import { useCart, useProducts, ProductCard, CartSummary, CartProvider, ProductProvider } 
  from '@react-microfrontend-workspace/shared';
```

### `types/index.ts` — Shared Type Definitions

Defines the core domain types used across the entire codebase:

| Type | Purpose |
|---|---|
| `Product` | `{ id, name, description, price, category, stock, rating, reviewCount, image }` |
| `CartItem` | `{ productId: string; quantity: number; price: number }` — note: `productId`, not `product.id` |
| `Order` | Order record with line items and status |
| `User` | User profile shape |

These interfaces act as the **contract** between all microfrontend apps — any change here affects the entire system.

### `context/` — State Management

| File | Provider | Exposes |
|---|---|---|
| `CartContext.tsx` | `CartProvider` | Cart items array, `addToCart`, `removeFromCart`, `updateQuantity`, `getTotalPrice`, `getTotalItems` |
| `ProductContext.tsx` | `ProductProvider` | Products array, loading/error state, `searchTerm`, `setSearchTerm`, `selectedCategory`, `setSelectedCategory`, `filteredProducts`, `fetchProducts` |

Each context is consumed via its corresponding custom hook (never directly).

### `hooks/` — Context Consumers

| Hook | Returns | Error if used outside |
|---|---|---|
| `useCart()` | All cart state and actions from `CartContext` | Throws if used outside `CartProvider` |
| `useProducts()` | All product state and actions from `ProductContext` | Throws if used outside `ProductProvider` |

### `components/` — Reusable UI Components

| Component | Props | Responsibility |
|---|---|---|
| `ProductCard` | `product`, `onAddToCart`, `quantity`, `onQuantityChange` | Renders a single product; displays rating, stock badge, add-to-cart |
| `CartSummary` | `onCheckout` | Renders cart item list, subtotals, shipping, and order total |

---

## Microfrontend Applications

Each app under `apps/` is an independent Vite + React application with its own `package.json`, `vite.config.ts`, and TypeScript config. All three follow the same structure.

### App Configuration Files

#### `vite.config.ts`

**What it does:** Configures the Vite dev server and production build for the specific app.

**Key settings:**
```ts
export default defineConfig({
  plugins: [react()],
  root: import.meta.dirname,     // App directory is the Vite root
  cacheDir: '../../node_modules/.vite/apps/<app-name>',  // Shared Vite cache at root
  server: { port: 4200 },        // Unique port per app (4200 / 4201 / 4202)
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }  // @/* → ./src/*
  }
});
```

Note: `vite` is declared in each app's `package.json` at `^7.0.0` to match the root version, ensuring npm does not install a duplicate local `vite` in each app's `node_modules`.

#### `tsconfig.json` (per app)

Each app's tsconfig extends `../../tsconfig.base.json` and adds:
- `"types": ["vite/client", "@types/jest", "@testing-library/jest-dom", "node"]` — explicitly lists all required type packages so the TypeScript server understands browser globals, Vite client types, Jest globals, and Node's `require` (used in Jest mock factories)
- App-specific `paths` alias: `"@/*": ["./src/*"]`

#### `tsconfig.app.json` (per app)

Extends the app's `tsconfig.json`. Used specifically for the production build output (`outDir: ./dist`). Scoped to `src/**/*.ts(x)` only — excludes test files from the build.

#### `tailwind.config.js` and `postcss.config.js`

Standard Tailwind CSS configuration per app. PostCSS runs Tailwind and Autoprefixer on all CSS files during Vite's build pipeline.

---

### Customer App (`apps/customer-app`, Port 4200)

The primary customer-facing shopping experience.

**Responsibility:** Product browsing, search, category filtering, cart management.

**Component tree:**
```
main.tsx
└── ProductProvider + CartProvider
    └── CustomerApp.tsx         ← Page routing state (shop / cart)
        ├── Header.tsx           ← Navigation, search bar, cart badge count
        ├── ProductGrid.tsx      ← Grid of ProductCard components with filter bar
        └── CartPage.tsx         ← Cart items via CartSummary, checkout button
```

---

### Admin Dashboard (`apps/admin-dashboard`, Port 4201)

The internal management interface for administrators.

**Responsibility:** Business metrics overview, product CRUD, order tracking, store configuration.

**Component tree:**
```
main.tsx
└── ProductProvider
    └── AdminDashboard.tsx      ← Tab navigation (Overview / Products / Orders / Settings)
        ├── Overview tab         ← KPI stat cards
        ├── Products tab         ← Product table with Add/Edit/Delete actions
        ├── Orders tab           ← Order list with status tracking
        └── Settings tab         ← Store name, currency, notification toggles
```

---

### Product Catalog (`apps/product-catalog`, Port 4202)

A focused read-only product browsing view.

**Responsibility:** Display all products in a grid with category-based filtering.

**Component tree:**
```
main.tsx
└── ProductProvider
    └── ProductCatalog.tsx      ← Category filter bar + product grid
        └── ProductCard (per product)
```

---

## Entry Files & Application Bootstrap

Every app follows the same two-file bootstrap pattern:

### `index.tsx`

**Why it exists:** Vite injects this file into `index.html` as the JavaScript entry point. It contains only the single DOM mount call:

```tsx
import { createRoot } from 'react-dom/client';
import App from './main';

createRoot(document.getElementById('root')!).render(<App />);
```

### `main.tsx`

**Why it exists:** Wraps the root component with all required context providers. Separating the provider tree from `index.tsx` makes the app easier to test — test files import from `main.tsx` directly and can override providers.

```tsx
export default function App() {
  return (
    <ProductProvider>
      <CartProvider>
        <CustomerApp />
      </CartProvider>
    </ProductProvider>
  );
}
```

### `index.html`

Standard Vite HTML entry. Contains `<div id="root"></div>` where React mounts, and a `<script type="module" src="/src/index.tsx">` tag that Vite processes.

---

## State Management Architecture

State is managed with React's **Context API** in the shared library and consumed via custom hooks in individual app components. There is no global store (Redux / Zustand) in the current architecture.

```
ProductProvider (wraps the app)
    └── ProductContext (products[], loading, searchTerm, selectedCategory)
            ↑ consumed by
            useProducts() hook
            ↑ used in
            ProductGrid, ProductCatalog, AdminDashboard

CartProvider (wraps the app)
    └── CartContext (items[], addToCart, removeFromCart, getTotalPrice)
            ↑ consumed by
            useCart() hook
            ↑ used in
            Header (badge count), CartPage, CustomerApp
```

**Data flow — adding to cart:**
```
User clicks "Add to Cart" on ProductCard
    → ProductCard calls onAddToCart(product)
    → Parent calls addToCart() from useCart()
    → CartContext updates items[] state
    → Header re-renders: shows updated badge count
    → CartSummary re-renders: shows updated line items
```

---

## Styling Architecture

All apps use **Tailwind CSS 3.4.3** with utility classes applied directly in JSX. No CSS modules or CSS-in-JS libraries are used.

- `postcss.config.js` — Runs Tailwind and Autoprefixer via PostCSS during build
- `tailwind.config.js` — Per-app Tailwind config (`content` paths point to `src/**/*.{tsx,ts}`)
- `styles/globals.css` — Imports Tailwind base, components, and utilities layers via `@tailwind` directives

---

## Development & Build Commands

### Development

```bash
npm run dev:customer    # Start customer-app dev server → http://localhost:4200
npm run dev:admin       # Start admin-dashboard dev server → http://localhost:4201
npm run dev:catalog     # Start product-catalog dev server → http://localhost:4202
```

### Production Build

```bash
npm run build           # Build all three apps sequentially
npm run build:customer  # Build customer-app → apps/customer-app/dist/
npm run build:admin     # Build admin-dashboard → apps/admin-dashboard/dist/
npm run build:catalog   # Build product-catalog → apps/product-catalog/dist/
```

### Code Quality

```bash
npm run lint            # ESLint across the entire monorepo
npm run format          # Prettier format all files
npm run type-check      # tsc --noEmit — full type check without emitting
```

### Testing

```bash
npm test                # Run all 5 test suites (49 tests)
npm run test:watch      # Jest watch mode
npm run test:coverage   # Generate coverage report
```

### Installation

```bash
# Prerequisites: Node.js >= 18.x, npm >= 9.x

npm install             # Install all workspace dependencies (single node_modules at root)
```
