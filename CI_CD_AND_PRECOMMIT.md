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

**Purpose:** Run quality checks only on the projects actually affected by the PR changes. Library changes automatically cascade to dependent apps. This workflow is a mandatory status check — PRs cannot be merged unless it passes.

**Key features:**
- **`nrwl/nx-set-shas@v4`** — Derives `NX_BASE` (last successful CI SHA) and `NX_HEAD` (current HEAD). Nx uses these to compute exactly which projects changed.
- **`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true`** — Suppresses the GitHub Actions Node.js 20 deprecation warning. All action runners use Node.js 24.
- **Nx computation cache** — The `.nx/cache` directory is restored/saved via `actions/cache@v4`, keyed on `package-lock.json` hash + commit SHA.
- **Single job** — Lint, typecheck, and test all run in one job sequentially with `--parallel=3` within each Nx command.

```
on:
  pull_request:
    branches: [main, develop]

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true
  NX_DAEMON: 'false'

jobs:
  pr-checks:
    runs-on: ubuntu-latest

    steps:
      1. actions/checkout@v4 (fetch-depth: 0 — full history for SHA comparison)
      2. actions/setup-node@v4 (Node.js 24, npm cache)
      3. actions/cache@v4 (.nx/cache — restore Nx computation cache)
      4. npm ci
      5. nrwl/nx-set-shas@v4 ← Sets NX_BASE and NX_HEAD env vars
      6. Log: npx nx show projects --affected --target=lint
      7. npx nx affected --target=lint --parallel=3
      8. npx nx affected --target=typecheck --parallel=3
      9. npx nx affected --target=test --parallel=3
```

**Effect on a PR that only touches `admin-dashboard`:**
```
nx affected --target=lint    → runs lint on admin-dashboard only
nx affected --target=typecheck → runs typecheck on admin-dashboard only
nx affected --target=test    → runs tests for admin-dashboard only

Customer-app and product-catalog: skipped entirely
```

**Effect on a PR that touches `libs/shared`:**
```
nx affected → all three apps + shared are affected (dependency graph cascade)
All four projects: lint + typecheck + test
```

---

### Workflow 2 — Build and Deploy (`build-deploy.yml`)

**Trigger:** Push to `main` **only**. PR checks are already handled by `pr-checks.yml` — there is no duplication.

**Purpose:** Detect which apps were affected by the push, build only those apps independently in parallel, and deploy each independently.

**Key design: Three-job pipeline with matrix strategy**

```
on:
  push:
    branches: [main]  # ONLY main — not develop, not PRs

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true
  NX_DAEMON: 'false'

jobs:

  ┌───────────────────────────────────────────────────────────────┐
  │ Job 1: detect-affected                                        │
  │ Outputs: apps (JSON array), has-affected (bool)               │
  │                                                               │
  │  1. checkout (fetch-depth: 0)                                 │
  │  2. setup-node (Node 24 + npm cache)                          │
  │  3. restore .nx/cache                                         │
  │  4. npm ci                                                    │
  │  5. nrwl/nx-set-shas@v4 (derives NX_BASE, NX_HEAD)           │
  │  6. npx nx show projects --affected --target=build            │
  │  7. Shell script: build JSON matrix of affected apps          │
  │     e.g. [{"app":"customer-app","dist":"apps/customer-app/dist"}, ...]  │
  │  8. Output: apps=$APPS  has-affected=true/false               │
  └──────────────────────┬─────────────────────────────────────────┘
                         │ if has-affected == true
                         │ matrix = fromJson(apps)
           ┌────────────┴─────────────┐
           │                           │
  ┌───────┴─────────────┐  ┌───────┴─────────────┐
  │ Job 2: build (matrix) │  │ (waits for build) │
  │ One runner per app    │  └──────────────────┘
  │                       │           │
  │  1. checkout          │  ┌───────┴─────────────┐
  │  2. setup-node        │  │ Job 3: deploy (matrix)│
  │  3. restore .nx/cache │  │ One runner per app    │
  │  4. npm ci            │  │                       │
  │  5. npx nx build $app │  │  1. Download artifact  │
  │  6. Upload artifact   │  │     dist-$app          │
  │  dist-$app            │  │  2. Deploy $app        │
  └─────────────────────┘  └─────────────────────┘
```

**Critical design decisions:**
- `fail-fast: false` on both matrix jobs — if `admin-dashboard` build fails, `customer-app` still deploys
- Each app uploads its **own separate artifact** (`dist-customer-app`, `dist-admin-dashboard`, etc.) — not a single combined archive
- The deploy job downloads only **its own app's artifact** — true independent deployment
- Apps not in the matrix are never touched

### When Each Workflow Runs

| Event | PR Checks (affected) | Build (affected matrix) | Deploy (affected matrix) |
|---|---|---|---|
| PR opened (feature → develop) | ✅ | ❌ | ❌ |
| New commit pushed to open PR | ✅ | ❌ | ❌ |
| PR merged to `develop` | ❌ | ❌ | ❌ |
| PR opened (develop → main) | ✅ | ❌ | ❌ |
| PR merged to `main` | ❌ | ✅ affected only | ✅ affected only |
| Direct push to `main` | ❌ | ✅ affected only | ✅ affected only |

### `npm ci` vs `npm install`

All CI workflows use `npm ci` (not `npm install`):

- `npm ci` installs **exactly** what is in `package-lock.json` — no resolution, no version range evaluation
- Fails if `package-lock.json` is out of sync with `package.json`
- Deletes `node_modules` before installing — completely reproducible
- Faster in CI because it skips dependency resolution

### Node.js Version

All CI workflows use **Node.js 24** via `actions/setup-node@v4`:

```yaml
uses: actions/setup-node@v4
with:
  node-version: '24'
  cache: 'npm'
```

The workspace-level env var `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` suppresses the GitHub Actions runner deprecation warning that appears when third-party actions internally reference older Node.js runtime versions.

### npm Cache and Nx Cache in CI

```yaml
# npm package cache (keyed on package-lock.json)
uses: actions/setup-node@v4
with:
  node-version: '24'
  cache: 'npm'

# Nx computation cache (keyed on package-lock.json hash + commit SHA)
uses: actions/cache@v4
with:
  path: .nx/cache
  key: ${{ runner.os }}-nx-${{ hashFiles('package-lock.json') }}-${{ github.sha }}
  restore-keys: |
    ${{ runner.os }}-nx-${{ hashFiles('package-lock.json') }}-
    ${{ runner.os }}-nx-
```

**npm cache:** GitHub Actions caches the npm package registry download cache keyed on the `package-lock.json` hash. When the lockfile has not changed, `npm ci` restores from cache instead of downloading all packages.

**Nx computation cache:** Nx stores task output hashes in `.nx/cache`. Between CI runs on the same lockfile, previously computed build/lint/test results are restored. A project whose inputs have not changed since the last push will have its test/lint results served from cache — the command is not re-executed.

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

Each app in the affected matrix uploads its own **separate artifact**, not a single combined archive. This is fundamental to independent deployment:

```yaml
# In the build matrix job (runs once per affected app)
- uses: actions/upload-artifact@v4
  with:
    name: dist-${{ matrix.app }}    # e.g. dist-customer-app, dist-admin-dashboard
    path: ${{ matrix.dist }}        # e.g. apps/customer-app/dist
    if-no-files-found: error
    retention-days: 7

# In the deploy matrix job (runs once per affected app)
- uses: actions/download-artifact@v4
  with:
    name: dist-${{ matrix.app }}    # Downloads only this app's artifact
    path: dist
```

**Why separate artifacts matter:** The deploy job for `customer-app` downloads `dist-customer-app` and deploys it. It never sees `admin-dashboard`'s files. If `admin-dashboard`'s build failed, `customer-app` is still deployed successfully (`fail-fast: false`).

Artifacts are retained for 7 days. For rollback, download a prior run's artifact and re-deploy manually.

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
    → pr-checks.yml: lint + typecheck + test on affected projects only
    → Optionally: deploy to a preview/staging URL for review
    → PR approved and merged to main
    → build-deploy.yml triggers: builds and deploys only affected apps
```

Review apps (ephemeral per-PR deployments) are not configured in the current workflows but can be added with Netlify, Vercel, or AWS Amplify.

#### Model 2: Production Deploy (On Merge to `main`)

This is the current active model:

```
feature branch → main (via PR)
    → pr-checks.yml must pass on the PR (affected projects only)
    → On merge: build-deploy.yml triggers
        → detect-affected: builds JSON matrix of changed apps
        → build matrix: builds only affected apps (parallel runners)
        → deploy matrix: deploys only affected apps (parallel runners)
        → Unaffected apps: not touched, continue serving current version
```

### Deploying Apps Individually

The `build:affected` script and the CI matrix mean only changed apps are ever built or deployed. For manual targeted deployments:

```bash
# Build and deploy only the admin dashboard (e.g., hotfix)
npm run build:admin
# → upload apps/admin-dashboard/dist/ to your CDN only

# See which projects would be affected from current changes
npm run build:affected  # nx affected --target=build
npm run test:affected   # nx affected --target=test
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
