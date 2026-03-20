# React Micro-Frontend Ecommerce Workspace

A production-ready monorepo for building scalable ecommerce applications using micro-frontends architecture with React 19, Vite, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run customer app
npm run dev:customer     # http://localhost:4200

# Run admin dashboard
npm run dev:admin        # http://localhost:4201

# Run product catalog
npm run dev:catalog      # http://localhost:4202

# Build all apps
npm run build

# Code quality
npm run lint
npm run format
```

## 📦 Micro-Frontend Structure

- **🛍️ Customer App** - Shopping interface with cart management
- **👑 Admin Dashboard** - Product and order management
- **📋 Product Catalog** - Product listing and filtering
- **📚 Shared Library** - Context API, hooks, and components

## 🏗️ Architecture

```
libs/
  └── shared/              # Shared context, hooks, components, types

apps/
  ├── customer-app/        # Customer shopping experience
  ├── admin-dashboard/     # Admin management interface  
  └── product-catalog/     # Product catalog service

.github/
  └── workflows/           # GitHub Actions CI/CD
```

## 📝 Features

✅ Multiple independent micro-frontend applications  
✅ Shared state management with Context API + Hooks  
✅ TypeScript for type safety  
✅ Tailwind CSS for styling  
✅ Vite for fast development and builds  
✅ GitHub Actions for automated CI/CD  
✅ NPM Workspaces for monorepo management  
✅ Production-ready ecommerce components  

## 🔄 State Management

Uses **React Context API** with custom hooks for lightweight, maintainable state:

```tsx
// Cart management
const { items, addToCart, removeFromCart, getTotalPrice } = useCart();

// Product management
const { products, loading, searchProducts, filterByCategory } = useProducts();
```

## 📱 Included Components

- **ProductCard** - Reusable product display component
- **CartSummary** - Order summary display
- **Header** - Navigation and cart badge
- **ProductGrid** - Filtered product listing

## 🔧 Development

```bash
# Run specific app in dev mode
npm run dev:customer      # Port 4200
npm run dev:admin         # Port 4201
npm run dev:catalog       # Port 4202

# Build specific app
npm run build:customer
npm run build:admin
npm run build:catalog

# Code quality checks
npm run lint              # ESLint
npm run format            # Prettier
```

## 🚀 Deployment

### Build artifacts
```bash
npm run build

# Outputs:
# - apps/customer-app/dist
# - apps/admin-dashboard/dist
# - apps/product-catalog/dist
```

### GitHub Actions
Automatic CI/CD on push to `main` or `develop`:
- ✅ Dependency installation
- ✅ Code linting
- ✅ All apps built
- ✅ Artifacts uploaded
- ✅ Production deployment

## 📚 Documentation

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation including:
- Complete project structure
- State management patterns
- Component library usage
- Adding new micro-frontend apps
- Performance optimization
- Troubleshooting guide

## 🛠️ Technologies

- React 19 - Modern UI framework
- Vite 5 - Next-generation build tool
- TypeScript 5.9 - Type-safe JavaScript
- Tailwind CSS 3.4 - Utility-first styling
- Node.js 18+ - JavaScript runtime

## 📄 License

MIT License

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/getting-started/tutorials/react-monorepo-tutorial?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
