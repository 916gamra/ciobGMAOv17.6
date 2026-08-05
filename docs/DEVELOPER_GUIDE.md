# 🛠️ BDR Nexus GMAO (v17.1) - Developer Architecture & Engineering Guide

## 📐 Architecture Overview & Core Stack
BDR Nexus is built as an offline-first, high-performance web platform designed for industrial maintenance and spare parts inventory (PDR).

### Core Stack Components:
- **Frontend Core:** React 18+, Vite, TypeScript, Tailwind CSS, Motion.
- **Client Persistence:** Dexie.js (IndexedDB wrappers) with custom Web Crypto (AES-GCM 256-bit key derivation) encryption layer.
- **Dependency Injection (IoC):** Custom TypeScript Decorator-driven DI container (`src/core/di`).
- **Performance Layer:**
  - `QueryCacheEngine`: In-memory query cache with TTL & tag invalidation.
  - `HeavyWorkerManager`: Web Worker offloader for non-blocking 60 FPS computation.
  - `PerformanceMonitor`: Real-time telemetry tracking FPS, DB query latency, and React component renders.
- **Security & Resilience:**
  - `CsrfShield`: Cryptographically generated Anti-CSRF double-submit tokens.
  - `RateLimiter`: Sliding Window request rate limiter protecting sensitive mutations.
  - `GlobalErrorHandler`: Uncaught exception and unhandled promise rejection listeners.

---

## 🏗️ Directory Structure & Module Boundaries
```
/src
 ├── app/               # Application shell, layout, global dock & OS tabs
 ├── core/              # System architecture, DB, security, cache, workers & monitoring
 │   ├── cache/         # QueryCacheService
 │   ├── db/            # Dexie schema, migrations, encryption & seeder
 │   ├── di/            # Dependency Injection container
 │   ├── errors/        # AppError & GlobalErrorHandler
 │   ├── logging/       # Structured AppLogger
 │   ├── monitoring/    # PerformanceMonitor & telemetry
 │   ├── security/      # RateLimiter & CsrfShield
 │   └── workers/       # HeavyWorkerManager (Offloaded math)
 ├── features/          # Domain-driven feature modules
 │   ├── pdr-engine/    # Storekeeper PDR inventory & blueprint management
 │   ├── factory/       # Industrial machinery & equipment tree
 │   ├── preventive/    # Preventive maintenance plans & execution
 │   ├── corrective/    # Corrective work orders & breakdown response
 │   └── settings/      # System configuration, security & performance telemetry
 └── shared/            # Reusable components (GlassCard, Modals, Buttons)
```

---

## ⚡ Performance Optimization Guide

### 1. In-Memory Query Caching:
```ts
import { QueryCache } from '@/core/cache/QueryCacheService';

const stockItems = await QueryCache.getOrFetch(
  'pdr_stock_active',
  () => db.stockItems.toArray(),
  30000, // TTL in ms
  ['pdr_stock'] // Invalidation tag
);
```

### 2. Offloading Heavy Computation:
```ts
import { WorkerManager } from '@/core/workers/workerManager';

const reconciliation = await WorkerManager.calculateStockReconciliation({
  inventoryItems,
  transactions
});
```

### 3. Component Performance Telemetry:
```ts
import { usePerformanceMonitor } from '@/core/monitoring/usePerformanceMonitor';

export function MyViewComponent() {
  usePerformanceMonitor('MyViewComponent');
  return <div>...</div>;
}
```

---

## 🛡️ Security Best Practices
- **Mutations:** Always guard data mutations using `CsrfShield.protectMutation(token)` and `RateLimiter.checkAndConsume(actionKey)`.
- **Sensitive Fields:** Never store plaintext sensitive fields; pass them through `encryptField()` before saving to Dexie.
