# CI/CD and Pre-Commit Guide

## Table of Contents

1. [Overview](#overview)
2. [Pre-Commit Hooks](#pre-commit-hooks)
3. [Commit Message Convention](#commit-message-convention)
4. [Testing Strategy](#testing-strategy)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Build Process](#build-process)
7. [Deployment Strategy](#deployment-strategy)
8. [Git Workflow](#git-workflow)
9. [Versioning and Release Strategy](#versioning-and-release-strategy)

---

## Overview

This project enforces code quality at three gates:

```
┌──────────────────────────────────────────────────────────────────┐
│  Gate 1: Pre-commit (local machine)                              │
│  Runs automatically on every git commit                          │
│  Format → Lint → Type check → Tests → Commit message lint       │
└─────────────────────────────┬────────────────────────────────────┘
                              │ commit pushed
┌─────────────────────────────▼────────────────────────────────────┐
│  Gate 2: PR Checks CI (GitHub Actions — pr-checks.yml)           │
│  Runs on every pull request to main or develop                   │
│  Type check → Lint (zero warnings) → Full test suite            │
└─────────────────────────────┬────────────────────────────────────┘
                              │ PR merged to main
┌─────────────────────────────▼────────────────────────────────────┐
│  Gate 3: Build & Deploy CI (GitHub Actions — build-deploy.yml)   │
│  Runs on push to main or develop                                 │
│  Lint → Build all apps → Upload artifacts → Deploy              │
└──────────────────────────────────────────────────────────────────┘
```

No code reaches production without passing all three gates.

---

## Pre-Commit Hooks

Pre-commit hooks are managed by **Husky** and **lint-staged**. They run automatically when a developer executes `git commit`. If any check fails, the commit is blocked and the developer must fix the issue before retrying.

### Installed Tools

| Tool | Version | Role |
|---|---|---|
| `husky` | ^9.1.7 | Git hook manager — wires lint-staged and commitlint into git lifecycle |
| `lint-staged` | ^16.4.0 | Runs linters only on staged (changed) files — keeps pre-commit fast |
| `@commitlint/cli` | ^20.5.0 | Validates the commit message format |
| `@commitlint/config-conventional` | ^20.5.0 | Conventional Commits ruleset |
| `eslint` | ^9.8.0 | Static analysis and code quality |
| `prettier` | ~3.6.2 | Code formatter |
| `typescript` | ~5.9.2 | Type checker (`tsc --noEmit`) |
| `jest` | ^30.3.0 | Test runner |

### Configuration Files

| File | Purpose |
|---|---|
| `.husky/pre-commit` | Shell script executed before every commit — invokes `lint-staged` |
| `.husky/commit-msg` | Shell script executed after message is typed — invokes `commitlint` |
| `.lintstagedrc.json` | Declares which linters run against which file patterns |
| `commitlint.config.js` | Defines allowed commit types, casing rules, and format requirements |

### Full Pre-Commit Execution Flow

```
Developer runs: git commit -m "feat: add search filter"

Step 1 — Format with Prettier (via lint-staged)
   ├─ Target: *.{ts,tsx,js,jsx,json,css,md}
   ├─ Action: Reformat code in place
   ├─ Staged: Re-stages formatted files automatically
   └─ Result: Always continues (Prettier does not block)

Step 2 — Lint with ESLint (via lint-staged)
   ├─ Target: *.{ts,tsx,js,jsx} (staged files only)
   ├─ Action: eslint --fix on changed files
   ├─ Auto-fixes: Minor style issues are fixed automatically
   ├─ If unfixable errors remain → ❌ COMMIT BLOCKED
   └─ Developer must resolve errors and re-commit

Step 3 — Type check (tsc --noEmit)
   ├─ Target: Entire workspace
   ├─ Action: Full TypeScript compilation check (no emit)
   ├─ If type errors exist → ❌ COMMIT BLOCKED
   └─ Developer must fix type errors

Step 4 — Run tests (Jest)
   ├─ Target: Changed test files (or related test files via --findRelatedTests)
   ├─ Action: jest --passWithNoTests --findRelatedTests <staged-files>
   ├─ If any test fails → ❌ COMMIT BLOCKED
   └─ Developer must fix failing tests

Step 5 — Validate commit message (commitlint)
   ├─ Target: The commit message typed by the developer
   ├─ Action: commitlint --edit
   ├─ Format required: type(optional-scope): lowercase subject
   ├─ If message does not conform → ❌ COMMIT BLOCKED
   └─ Developer must rewrite commit message

✅ All checks passed — commit is recorded
```

### Why Each Check Exists

**Prettier** — Eliminates formatting debates in code review. Code style is never a discussion point; the formatter decides.

**ESLint** — Catches bugs (unused variables, missing deps in hooks), enforces best practices (`@nx/enforce-module-boundaries` prevents cross-cutting imports between apps), and maintains consistent code patterns.

**TypeScript type check** — The most critical gate. A passing type check means the entire monorepo's type graph is consistent. No `any` surprise, no wrong property names, no mismatched function signatures between apps and the shared lib.

**Jest tests** — Prevents regressions from being committed. Only tests related to changed files run at commit time to keep the hook fast.

**Commitlint** — Enforces a consistent, machine-readable git history. Consistent commit messages enable automated changelog generation and clear audit trails.

---

## Commit Message Convention

This project follows the **Conventional Commits** specification enforced by `commitlint.config.js`.

### Format

```
type(optional-scope): lowercase subject

optional body (after blank line)

optional footer
```

### Allowed Types

| Type | When to Use |
|---|---|
| `feat` | New feature visible to users |
| `fix` | Bug fix |
| `docs` | Documentation only changes |
| `style` | Code formatting, whitespace — no logic change |
| `refactor` | Code restructure — no feature change, no bug fix |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Dependency updates, build config changes |
| `ci` | CI/CD workflow changes |
| `revert` | Reverting a previous commit |

### Rules

- Type must be lowercase
- Subject must be lowercase (e.g., `add search filter`, not `Add Search Filter`)
- No trailing period on subject
- Blank line required between subject and body

### Valid Examples

```bash
feat: add product search to customer app
fix(shared): prevent negative quantity in cart
test(shared): add useCart hook unit tests
refactor(admin-dashboard): simplify tab navigation state
chore: upgrade jest to v30
ci: add test step to pr-checks workflow
docs: update architecture setup guide
feat(customer-app): add category filter persistence

# With body
feat(shared): add CartSummary component

Renders cart items with per-item subtotals, shipping estimate,
and total price. Used by customer-app CartPage.
```

### Invalid Examples (Rejected by commitlint)

```bash
add new feature              # ❌ Missing type
FEAT: add search             # ❌ Type must be lowercase
feat: Add Search Filter      # ❌ Subject must be lowercase
feat: add search filter.     # ❌ No trailing period
fix                          # ❌ Empty subject
```

---

## Testing Strategy

### Test Stack

| Tool | Purpose |
|---|---|
| `jest` ^30.3.0 | Test runner and assertion library |
| `ts-jest` | Transpiles TypeScript for Jest without a separate build step |
| `jest-environment-jsdom` | Simulates a browser DOM environment for React component tests |
| `@testing-library/react` ^16.x | Renders components and provides querying utilities |
| `@testing-library/jest-dom` ^6.x | Custom matchers: `toBeInTheDocument`, `toBeDisabled`, etc. |

### Test File Locations

```
libs/shared/src/
├── components/
│   └── ProductCard.spec.tsx    ← Component rendering, interaction, props
└── hooks/
    └── useCart.spec.tsx        ← Hook logic with CartProvider wrapper

apps/customer-app/src/
└── CustomerApp.spec.tsx        ← Full app render: search, cart, navigation

apps/admin-dashboard/src/
└── AdminDashboard.spec.tsx     ← Tab switching, stats, product table

apps/product-catalog/src/
└── ProductCatalog.spec.tsx     ← Category filtering, product grid render
```

### Running Tests

```bash
# Run all 5 test suites (49 tests)
npm test

# Watch mode — re-runs on file change
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run a specific file
npx jest CustomerApp.spec.tsx

# Run tests matching a pattern
npx jest --testPathPattern="shared"
```

### Coverage Targets

```
libs/shared/         → 90%+ (used by all apps — highest risk area)
apps/customer-app/   → 70%+
apps/admin-dashboard/→ 70%+
apps/product-catalog/→ 70%+
```

### Testing Approach by Layer

**Shared lib (`libs/shared`)** — Unit tested directly. `useCart.spec.tsx` uses `renderHook` with a real `CartProvider` to test hook behaviour. `ProductCard.spec.tsx` renders the component and tests interactions.

**App components** — The shared lib is fully mocked in app-level tests. `jest.mock('@react-microfrontend-workspace/shared', ...)` replaces hooks and components with controlled stubs. This isolates app logic from shared lib implementation details.

```ts
// Pattern used in all app-level spec files
jest.mock('@react-microfrontend-workspace/shared', () => ({
  useProducts: jest.fn(),
  useCart:     jest.fn(),
  ProductCard: ({ product }: { product: { name: string } }) =>
    React.createElement('div', { 'data-testid': 'product-card' }, product.name),
  CartSummary: ({ onCheckout }: { onCheckout: () => void }) =>
    React.createElement('button', { onClick: onCheckout }, 'Checkout'),
}));
```

---

## CI/CD Pipeline

Two GitHub Actions workflows handle all CI/CD automation.

### Workflow 1 — PR Checks (`pr-checks.yml`)

**Trigger:** Every pull request targeting `main` or `develop`.

**Purpose:** Enforce quality gates before any code lands on an integration branch. This workflow is a mandatory status check — PRs cannot be merged unless it passes.

```
on:
  pull_request:
    branches: [main, develop]
```

**Jobs:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Job: typecheck                                                  │
│ Runner: ubuntu-latest, Node 18.x                               │
│                                                                 │
│  1. actions/checkout@v4          ← Checkout PR branch          │
│  2. actions/setup-node@v4        ← Install Node 18 + npm cache │
│  3. npm ci                       ← Clean install from lockfile  │
│  4. npx tsc --noEmit             ← Full workspace type check    │
│  5. npm run lint -- --max-warnings 0  ← Lint, zero tolerance   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Job: test                                                       │
│ Runner: ubuntu-latest, Node 18.x                               │
│                                                                 │
│  1. actions/checkout@v4                                         │
│  2. actions/setup-node@v4                                       │
│  3. npm ci                                                      │
│  4. npm test                     ← Run all 5 test suites       │
└─────────────────────────────────────────────────────────────────┘
```

**Why two separate jobs:** `typecheck` and `test` run in parallel on GitHub's runners, reducing total PR feedback time. A type error does not block test results from reporting.

**`--max-warnings 0`:** The lint step treats any ESLint warning as an error in CI. This enforces a clean codebase — lint warnings are not deferred to later.

---

### Workflow 2 — Build and Deploy (`build-deploy.yml`)

**Triggers:**
- `push` to `main` — Runs build **and** deploy jobs
- `push` to `develop` — Runs build job only
- `pull_request` to `main` or `develop` — Runs build job (validates the build can succeed)

```
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

**Jobs:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Job: build                                                      │
│ Runner: ubuntu-latest, Node 18.x                               │
│                                                                 │
│  1. actions/checkout@v4                                         │
│  2. actions/setup-node@v4          ← Uses npm cache for speed  │
│  3. npm ci                         ← Reproducible install      │
│  4. npm run lint                   ← Lint check                │
│  5. npm run build:customer         ← Build customer-app/dist   │
│  6. npm run build:admin            ← Build admin-dashboard/dist│
│  7. npm run build:catalog          ← Build product-catalog/dist│
│  8. actions/upload-artifact@v4     ← Store all 3 dist folders  │
│     (retained for 30 days)         ← Available to deploy job   │
└─────────────────────────────────────────────────────────────────┘
                    │
                    │  needs: build
                    │  only on: push to main
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ Job: deploy                                                     │
│ Condition: github.ref == 'refs/heads/main'                     │
│            && github.event_name == 'push'                      │
│                                                                 │
│  1. actions/checkout@v4                                         │
│  2. actions/download-artifact@v4   ← Retrieve built artifacts  │
│  3. Deploy customer-app            ← (CDN/hosting deployment)  │
│  4. Deploy admin-dashboard         ← (CDN/hosting deployment)  │
│  5. Deploy product-catalog         ← (CDN/hosting deployment)  │
└─────────────────────────────────────────────────────────────────┘
```

### When Each Workflow Runs

| Event | PR Checks | Build Job | Deploy Job |
|---|---|---|---|
| PR opened (feature → develop) | ✅ | ✅ (build validation) | ❌ |
| New commit pushed to open PR | ✅ | ✅ | ❌ |
| PR merged to `develop` | ❌ | ✅ | ❌ |
| PR opened (develop → main) | ✅ | ✅ | ❌ |
| PR merged to `main` | ❌ | ✅ | ✅ |
| Direct push to `main` | ❌ (no PR) | ✅ | ✅ |

### `npm ci` vs `npm install`

All CI workflows use `npm ci` (not `npm install`):

- `npm ci` installs **exactly** what is in `package-lock.json` — no resolution, no version range evaluation
- Fails if `package-lock.json` is out of sync with `package.json`
- Deletes `node_modules` before installing — completely reproducible
- Faster in CI because it skips dependency resolution

### npm Cache in CI

```yaml
uses: actions/setup-node@v4
with:
  node-version: '18.x'
  cache: 'npm'
```

GitHub Actions caches the npm package cache keyed on `package-lock.json` hash. When the lockfile has not changed, `npm ci` restores cached packages instead of downloading from the registry. This significantly reduces CI run time.

<!-- FUTURE: SonarQube / SonarCloud integration can be added here as a step in pr-checks.yml
     to report code coverage, duplications, and code smell metrics.
     Example step:
     - name: SonarCloud Scan
       uses: SonarSource/sonarcloud-github-action@master
       env:
         GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
         SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
-->

---

## Build Process

### Per-App Build Steps (Vite)

```
For each of the three apps:

1. Resolve imports
   ├─ @react-microfrontend-workspace/shared → libs/shared/src/index.ts (via npm workspace)
   ├─ @/* path alias → ./src/*
   └─ node_modules resolved from root

2. TypeScript compilation
   ├─ esbuild (internal to Vite) transpiles TS/TSX → JS
   └─ No type checking — that is handled separately by tsc --noEmit

3. CSS processing
   ├─ PostCSS runs Tailwind, generating only the utility classes used
   ├─ Autoprefixer adds vendor prefixes for browser compatibility
   └─ CSS is extracted to a separate .css file in dist/assets/

4. Bundling and optimisation
   ├─ Tree-shaking removes unused exports from shared lib and node_modules
   ├─ Code splitting: React + react-dom → vendor-[hash].js
   ├─ App code → index-[hash].js
   ├─ All assets get content-hash filenames for cache invalidation
   └─ Source maps generated for production debugging

5. Output
   apps/<app-name>/dist/
   ├─ index.html                      (HTML entry with hashed script/style references)
   └─ assets/
       ├─ index-[hash].js             (app bundle)
       ├─ vendor-[hash].js            (react, react-dom)
       └─ index-[hash].css            (compiled CSS)
```

### Build Artifact Storage

The `build-deploy.yml` workflow uploads all three `dist/` folders as a single artifact named `build-artifacts`:

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: build-artifacts
    path: |
      apps/customer-app/dist
      apps/admin-dashboard/dist
      apps/product-catalog/dist
    retention-days: 30
```

Artifacts are retained for 30 days, enabling rollback to any previous build by downloading a prior artifact.

---

## Deployment Strategy

### Core Principle: Independent Deployability

Each app's `dist/` folder is a complete, self-contained static site. The three apps share no runtime files and can be deployed to entirely independent infrastructure.

```
Monorepo (single git repo)
       │
       ├─ apps/customer-app/dist/    → CDN bucket / hosting A
       ├─ apps/admin-dashboard/dist/ → CDN bucket / hosting B (restricted access)
       └─ apps/product-catalog/dist/ → CDN bucket / hosting C
```

An update to `admin-dashboard` deploys **only** the admin dist folder. The customer app and product catalog continue serving their existing deployed versions without interruption.

### Deployment Models

#### Model 1: Feature Branch Deploy (Per PR)

```
feat/search-filter branch
    → PR created
    → pr-checks.yml validates: type check + lint + tests
    → build-deploy.yml builds all apps
    → Optionally: deploy to a preview/staging URL for review
    → PR approved and merged
```

Review apps (ephemeral per-PR deployments) are not configured in the current workflows but can be added with hosting platforms like Vercel, Netlify, or AWS Amplify.

#### Model 2: Staging Deploy (On Merge to `develop`)

```
feature branch → develop
    → build-deploy.yml runs build job
    → All three apps are built and artifacts uploaded
    → Deploy job does NOT run (only main triggers deploy)
    ← Can be extended to deploy to a staging environment
```

#### Model 3: Production Deploy (On Merge to `main`)

```
develop → main (via PR)
    → pr-checks.yml must pass on the PR
    → On merge: build-deploy.yml runs both jobs
    → Build job: builds all 3 apps, uploads artifacts
    → Deploy job (needs: build): downloads artifacts, deploys each app
```

### Deploying Apps Individually

The build scripts allow building individual apps, enabling targeted deployments:

```bash
# Deploy only the admin dashboard (e.g., hotfix to admin without touching customer app)
npm run build:admin
# → upload apps/admin-dashboard/dist/ to your CDN only
```

In CI, this can be implemented with Nx affected commands (future enhancement):

```bash
# Only build apps affected by changes in the PR
npx nx affected --target=build
```

### Deployment Infrastructure Options

| Platform | Suitability | Notes |
|---|---|---|
| **Vercel** | High | Native monorepo support, per-app project, preview deploys per PR |
| **Netlify** | High | Per-app site config, branch deploys, form handling |
| **AWS S3 + CloudFront** | High | Maximum control, CDN edge caching, custom domains |
| **GitHub Pages** | Low | No path-based routing for SPA without custom 404 config |
| **Azure Static Web Apps** | Medium | Good monorepo support, integrated auth |

For all SPA deployments: configure the hosting to serve `index.html` for all routes (the `/*` fallback), since React apps handle client-side routing.

---

## Git Workflow

### Branch Strategy

```
main          ← Production branch. Protected. Direct pushes not allowed.
  └─ develop  ← Integration branch. All feature PRs target here.
       └─ feature/search-filter  ← Developer's working branch
       └─ fix/cart-quantity-bug
       └─ chore/upgrade-jest
```

### Developer Workflow

```bash
# 1. Start new work from develop
git checkout develop
git pull origin develop
git checkout -b feat/add-search-filter

# 2. Develop and commit (hooks validate each commit)
git add .
git commit -m "feat(customer-app): add search filter to product grid"

# 3. Push and open PR to develop
git push origin feat/add-search-filter
# → Open PR on GitHub targeting: develop

# 4. PR Checks run automatically (pr-checks.yml)
# → Type check passes
# → Lint passes
# → Tests pass

# 5. PR approved → Merge to develop
# → build-deploy.yml runs build job

# 6. When develop is ready for release → PR from develop to main
# → All PR checks run on the develop → main PR
# → On merge: full build + deploy runs
```

### Branch Protection Rules (Recommended GitHub Configuration)

For `main`:
- Require PR before merging
- Require `PR Checks` workflow to pass
- Require at least 1 approving review
- Dismiss stale reviews on new commits
- Do not allow force pushes

For `develop`:
- Require PR before merging
- Require `PR Checks` workflow to pass

---

## Versioning and Release Strategy

### Current: Implicit Versioning

All apps share the same monorepo and the root `package.json` version (`1.0.0`). There is no per-app versioning in the current setup. All apps are effectively versioned together by the git commit SHA.

### Recommended: Commit-Based Versioning

Use **git tags** on `main` to mark releases:

```bash
# After merging to main
git tag v1.2.0
git push origin v1.2.0
```

The CI deploy workflow can be extended to tag-triggered deploys:

```yaml
on:
  push:
    tags:
      - 'v*'
```

### Future: Semantic Release Automation

With `semantic-release` or `changesets`, the Conventional Commit messages written by developers can automatically:

1. Determine the next version number (`feat` → minor, `fix` → patch)
2. Generate a `CHANGELOG.md` entry
3. Tag the release in git
4. Trigger the deploy workflow

This creates a fully automated release pipeline driven entirely by commit messages — no manual version bumping required.

### Per-App Versioning (Module Federation Phase)

When the project migrates to Module Federation with independently deployed remotes, each app will need independent versioning:

```
customer-app      v2.1.0
admin-dashboard   v1.8.3
product-catalog   v1.3.0
libs/shared       v3.0.0
```

The shared library version becomes especially important — it becomes a published npm package with a semantic version, and apps declare their minimum compatible version via their `package.json`.
