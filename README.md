# 🚢 BDR Nexus (GMAO v17.5 TITANIC OS)
**Next-Generation Industrial Operating System & Plant Asset Management**

![Version](https://img.shields.io/badge/version-17.5-cyan.svg)
![Architecture](https://img.shields.io/badge/architecture-Offline--First-emerald.svg)
![Aesthetic](https://img.shields.io/badge/aesthetic-Titan--Lux-rose.svg)
![Database](https://img.shields.io/badge/database-Dexie.js%20IndexedDB-amber.svg)

> *"An enterprise-grade, offline-first industrial software architecture designed to bridge the gap between harsh factory operations and high-precision software engineering."*

---

## 📖 Table of Contents
- [1. System Overview & Core Philosophy](#1-system-overview--core-philosophy)
- [2. The 4-Dimensional Data Paradigm & 999 Slots Rule](#2-the-4-dimensional-data-paradigm--999-slots-rule)
- [3. Technology Stack & Runtime Architecture](#3-technology-stack--runtime-architecture)
- [4. Core Engines & Feature Portals](#4-core-engines--feature-portals)
  - [4.1 PDR Engine (Spare Parts & Procurement)](#41-pdr-engine-spare-parts--procurement)
  - [4.2 Corrective Maintenance Engine (Emergency Suite)](#42-corrective-maintenance-engine-emergency-suite)
  - [4.3 Preventive Engine (ShieldOps Command Center)](#43-preventive-engine-shieldops-command-center)
  - [4.4 Organization & Engineering Lab](#44-organization--engineering-lab)
  - [4.5 System Security & Data Exchange Engine](#45-system-security--data-exchange-engine)
- [5. UI/UX Design Constitution & Titan Lux Theme](#5-uiux-design-constitution--titan-lux-theme)
- [6. Directory Structure](#6-directory-structure)
- [7. Security, Encryption & Telemetry](#7-security-encryption--telemetry)
- [8. Installation & Development Guide](#8-installation--development-guide)
- [9. Documentation Links](#9-documentation-links)

---

## 1. 🏛️ System Overview & Core Philosophy

**BDR Nexus (GMAO v17.5 TITANIC OS)** is an offline-first, local-first industrial Computerized Maintenance Management System (CMMS / GMAO). Designed specifically for harsh factory floors, high-volume production lines, and complex machinery maintenance, BDR Nexus provides zero-latency interactions and 100% operational resilience even during network blackouts.

### Core Architectural Pillars:
1. **Offline-First Resilience:** Powered by **Dexie.js (IndexedDB)**, all operational data resides locally in the browser/client, allowing instant reads, zero-latency filters, and offline work order execution.
2. **Domain-Driven Design (DDD):** Isolated domain engines (PDR, Corrective, Preventive, Organization, Security) ensure modular maintainability.
3. **Data Ironclad (Zod Validation at the Gates):** No unvalidated payload enters IndexedDB. Every user form, modal input, and Excel import passes strict Zod runtime type-checking.
4. **Sovereign Storekeeper & Maintenance Separation:** Clear boundary separation between spare parts physical inventory management (PDR Engine) and field technician maintenance operations.

---

## 2. 🔢 The 4-Dimensional Data Paradigm & 999 Slots Rule

To eliminate inventory duplicates and standardize technical datasheets across the plant, BDR Nexus enforces the **4-Dimensional Data Taxonomy**:

```text
[1. Template]  ─── Abstract Knowledge (Entity type & electrical/mechanical specs)
       │
       ▼
[2. Blueprint] ─── Datasheet & Brand Model (SKU, brand, technical reference in Catalog)
       │
       ▼
[3. Stock Item]─── Physical Instance in Warehouse (Location, Shelf, Quantity, Condition)
       │
       ▼
[4. Machine]   ─── Consumption Target (Physical machine or sub-assembly on factory floor)
```

### The 999 Slots Rule (Scalability Engine):
- Every newly defined **Template** mathematically pre-allocates **999 dormant slots** (`001` through `999`).
- **Zero DB Footprint:** Dormant slots consume zero IndexedDB storage until populated.
- **Strict Nomenclature:** Standardized naming format `[FAMILY_CODE]-[001-999]` (e.g., `ROB-001` for deep groove bearings).

---

## 3. 💻 Technology Stack & Runtime Architecture

### Client / Edge Layer
- **UI Framework:** React 19 + TypeScript + Vite.
- **Local Database:** Dexie.js (IndexedDB wrapper) with live queries (`useLiveQuery`).
- **Styling & Motion:** Tailwind CSS v4 + Framer Motion for fluid OS-like animations.
- **Icons & Visuals:** Lucide React icons + Recharts for analytical telemetry.
- **Data Virtualization:** `@tanstack/react-virtual` for ultra-fast rendering of thousands of inventory items.

### Backend & Hybrid Server Layer
- **Server Runtime:** Express server (`server.ts`) built with `esbuild` for CJS bundling.
- **Security Middlewares:** `helmet`, `bcryptjs` password hashing, Web Crypto API AES-GCM local storage encryption.
- **Excel Processing Engine:** `exceljs` for reading/writing `.xlsx` sheets and generating interactive data validation templates.

---

## 4. 🧩 Core Engines & Feature Portals

### 4.1 PDR Engine (Spare Parts & Procurement)
Dedicated portal for the **Storekeeper (Magasinier)**:
* **Stock Dashboard:** Real-time visibility into overall stock valuation, items under minimum threshold, and quick stock issue/receipt controls.
* **Blueprint Catalog:** Master engineering datasheet catalog containing technical specifications without raw stock quantities.
* **Stock History & Movements:** Ledger tracking every stock transaction (`IN`, `OUT`, `ADJ`), technician signatures, work order numbers, and destination machines.
* **Stock Reconciliation:** Physical audit workspace to resolve book vs. physical inventory discrepancies with audit trails.
* **Requisition Hub & Procurement:** Purchase order generation for depleted stock items with status approval workflow.

### 4.2 Corrective Maintenance Engine (Emergency Suite)
Dedicated suite for handling breakdowns and unexpected downtime:
* **Breakdown Log / Chamber of Surgery:** Emergency breakdown reporting, downtime tracking, technician dispatching, and spare part consumption logging.
* **Component Radar & Bad-Actor Analysis:** Root cause diagnostic tools measuring **MTTR** (Mean Time to Repair) and **MTBF** (Mean Time Between Failures), identifying Top-5 offending machine components.
* **Machine Components Catalog:** Structural overview of mechanical, electrical, hydraulic, and pneumatic assemblies installed on plant machinery.

### 4.3 Preventive Engine (ShieldOps Command Center)
Predictive and routine maintenance management:
* **Preventive Radar & Calendar:** Interactive task scheduling matrix (Daily, Weekly, Monthly, Quarterly) for preventive routines.
* **Machine Registry & Digital Twin:** Digital identity passport for each machine containing technical specs, sector mapping, assigned technician, and cumulative maintenance cost.
* **Task Catalog & Diagnostic Routines:** Standardized preventive checklists and inspection routines.

### 4.4 Organization & Engineering Lab
Plant topological hierarchy and engineering design:
* **5-Level Industrial Hierarchy:** `Plant -> Sectors (1-15) -> Machines -> Sub-systems / Sections -> Components -> PDR Spare Parts`.
* **Engineering Lab & Matrix:** Blueprint assembly matrix builder for mapping parts to machine blueprints.
* **Machine BOM Modal:** Bill of Materials (B.O.M) explorer for inspecting machine assembly trees.

### 4.5 System Security & Data Exchange Engine
Admin command center and data protection:
* **User Management & RBAC:** Granular role-based access control (Admin, Maintenance Engineer, Storekeeper, Field Technician).
* **Excel Hub:** Instant `.xlsx` data import/export with automatic pre-import safety backups.
* **Audit Logging & Performance Telemetry:** Execution time tracking for database queries, enforcing a `< 1000ms` performance boundary.

---

## 5. 🎨 UI/UX Design Constitution & Titan Lux Theme

BDR Nexus enforces a strict **UI/UX Design Constitution** to eliminate visual bloat ("Anti-Slop"):
* **Dark Titan Lux Aesthetic:** Industrial dark charcoal canvas (`#0B0F17`) with low-saturation neutrals and functional neon accents (Green = Safe/Complete, Amber = Warning/Threshold, Red = Critical/Breakdown, Cyan = Tech/Info).
* **Nested Radius Geometry Rule:**
  $$R_{inner} = R_{outer} - Padding$$
* **Typography:** Single-line badges (`white-space: nowrap`), high-contrast legibility passing WCAG AA standards ($4.5:1$ ratio minimum).

---

## 6. 📂 Directory Structure

```text
/CIOB_GMAO
├── /src
│   ├── /app               # Core OS Layout (Canvas, Sidebar, Taskbar, Navigation)
│   ├── /core              # Architecture Core (Database, Security, Schemas, Excel Engine)
│   │   ├── db.ts          # Dexie IndexedDB schema & table declarations
│   │   ├── security.ts    # Crypto utilities & bcrypt hashing
│   │   ├── logger.ts      # Structured logging & telemetry wrappers
│   │   └── /excel         # Excel Import/Export & Backup manager
│   ├── /docs              # Comprehensive System Philosophy & Documentation
│   │   └── PHILOSOPHY.md  # Architectural Constitution & UI/UX Laws
│   ├── /features          # Domain-Driven Modules
│   │   ├── /pdr-engine    # Spare parts catalog & stock inventory view
│   │   ├── /corrective    # Breakdown log, surgery chamber & component radar
│   │   ├── /preventive    # ShieldOps preventive calendar & task catalog
│   │   ├── /organization  # Engineering lab, sector map & machine registry
│   │   ├── /requisition   # Stock requisition hub
│   │   └── /system        # User admin, RBAC & excel backup hub
│   └── /shared            # Reusable UI components, hooks, modals & utils
├── PHILOSOPHY.md          # Architectural Philosophy & System Constitution
├── server.ts              # Hybrid Node/Express Server
├── package.json           # Dependencies and scripts
└── vite.config.ts         # Vite bundler configuration
```

---

## 7. 🛡️ Security, Encryption & Telemetry

- **Client Hashing:** PINs and passwords are encrypted using `bcryptjs`.
- **Local Storage Encryption:** Sensitive offline session tokens and local state slices are protected via the **Web Crypto API (AES-GCM)**.
- **Audit Logging:** Destructive operations (stock wipes, machine deletions, bulk imports) generate immutable audit trail records.
- **Performance Guards:** Custom `measureOperation` performance wrappers log query duration and issue system warnings if any database operation exceeds 1000ms.

---

## 8. 🚀 Installation & Development Guide

### Prerequisites
- Node.js v20.x or v22.x
- NPM / PNPM / Yarn

### Installation & Execution
1. Install dependencies:
   ```bash
   npm install
   ```
2. Launch Development Server (Express + Vite hybrid):
   ```bash
   npm run dev
   ```
3. Type Checking & Code Linting:
   ```bash
   npm run lint
   ```
4. Build Production Bundle:
   ```bash
   npm run build
   npm start
   ```

---

## 9. 📚 Documentation Links

For in-depth architectural details, engineering rules, and UI/UX design laws:
- 📖 [System Philosophy & Design Constitution (`/PHILOSOPHY.md`)](./PHILOSOPHY.md)
- 🏛️ [Internal Architectural Copy (`/src/docs/PHILOSOPHY.md`)](./src/docs/PHILOSOPHY.md)
- 🗺️ [Architectural Map (`/NEXUS_ARCH_MAP.md`)](./NEXUS_ARCH_MAP.md)

---
*Architected and Engineered for Industrial Excellence.* 🚢 BDR Nexus v17.5
