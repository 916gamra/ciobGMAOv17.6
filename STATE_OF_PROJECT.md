# State of the Project: BDR Nexus (GMAO v17.6)
**Date:** August 10, 2026
**Target Audience:** Engineering, Maintenance & Operations Teams

This document provides a comprehensive technical analysis of BDR Nexus (GMAO v17.6) as of August 2026. 

## 💡 Recent Updates (August 2026 - Phase 1 Industrial Kernel Release)
* **Phase 1 Domain Kernel Execution (ISO 14224 / ISO 55001 / IEC 60300-3-10 Compliant):**
  - **Asset Hierarchy & Digital Twin:** Implemented Plant, Functional Location (`FL-HYD-01`), and full Asset Lifecycle States (`DESIGN`, `PROCURED`, `INSTALLED`, `COMMISSIONED`, `OPERATING`, `STANDBY`, `MAINTENANCE`, `DECOMMISSIONED`, `DISPOSED`). Added Installed Component assemblies with health index tracking.
  - **Condition Monitoring & Meter Engine:** Built Meter and MeterReading entities supporting `RUNNING_HOURS`, `CYCLES`, `PRESSURE`, `TEMPERATURE`, `VIBRATION`, and `CUSTOM` types with automatic machine running hours sync.
  - **Precision Downtime & True MTTR Engine:** Separated Work Orders and Downtime Events to measure exact response, diagnostic, pure repair time (True MTTR), and total downtime.
  - **ISO 14224 Failure Taxonomy:** Integrated structured failure recording (`Symptom` → `FailureMode` → `FailureMechanism` → `CauseCategory` → `ConsequenceCategory` → `ActionTaken` → `VerificationResult`).
  - **Material Reservations & Transaction Ledger:** Added atomic Stock Reservations for active Work Orders and a single-source-of-truth `StockTransactionLedger` (`RECEIPT`, `ISSUE`, `RETURN`, `TRANSFER`, `ADJUSTMENT`, `RESERVATION`, `UNRESERVATION`, `SCRAP`, `CONSUMPTION`).
  - **Validation & Persistence:** Upgraded Dexie Database to Schema Version 27 and added Zod schemas in `src/core/schemas.ts` and domain services (`AssetDomainService`, `WorkOrderKernelService`).
---

## 1. Tech Stack & Environmental Matrix

---

## 1. Tech Stack & Environmental Matrix

*   **Core UI:** React 18/19 with TypeScript, bundled via Vite.
*   **State Management:** 
    *   **Zustand:** Powering the OS-like window management (`useTabStore`) and Portal navigation (`useOsStore`).
    *   **Dexie.js:** Version 10 schema. Local-first, high-performance IndexedDB wrapper with reactive queries (`useLiveQuery`).
*   **Visual Engine:** Tailwind CSS v4 with the **"Titan" Design System**.
    *   Industrial dark theme with neon accentuation (Cyan, Emerald, Rose, Amber).
    *   Custom utility classes for physical UI components (`.titan-card`, `.titan-input`, `.titan-label`).
*   **Motion Matrix:** `motion/react` for system-level transitions and interactive animations.

---

## 2. Directory Architecture (FSD/Titan Hybrid)

```text
src/
├── app/                  # OS Shell & Global Kernel
│   ├── DesktopLayout.tsx # Main window manager & Security Guard
│   ├── layout/           # Global UI (Launchpad, Dock, Sidebar)
│   └── store/            # Kernel state (useOsStore, useTabStore, useAuthStore)
├── core/                 # System Backbone
│   ├── db.ts             # Dexie v10 Hub (Audit, PM, PDR, Users)
│   ├── permissions.ts    # Centralized RBAC logic (ADMIN_ROLES, hasPortalAccess)
│   └── schemas.ts        # Zod validation matrix
├── features/             # Logical Portals (Engines)
│   ├── auth/             # Login Matrix & Identity Verification
│   ├── pdr-engine/       # Spare Parts, Stock & Requisition
│   ├── preventive/       # Shield Ops (PM Schedules, Checklists, Work Orders)
│   ├── factory/          # Topological Map (Machines, Sectors, Personnel)
│   └── system/           # Configuration, Audit Trail, User Management
└── shared/               # Universal Modules
    ├── components/       # Titan UI Primitives
    └── hooks/            # useNotifications, useAuditTrail, etc.
```

---

## 3. Data Integrity & Security (Audit Shield)

The application implements a strict **Zero-Trust** approach for administrative actions.

### Audit Trail Matrix
Every destructive or configuration-level event is logged in the `auditLogs` table via the `useAuditTrail` hook.
*   **Attributes Captured:** User ID, Name, Action Type, Entity ID, Severity (INFO/WARNING/CRITICAL), and Payload Details.
*   **Encapsulation:** All PM and System actions (e.g., purging DB, updating RBAC, creating schedules) trigger an audit pulse.

### Permission Guard (RBAC)
A centralized guard system (`permissions.ts`) controls access based on roles:
*   **Founders:** Absolute DNA clearance. Undeleatable and possess global override.
*   **Admins/Managers:** Authorized for System Config and high-level management.
*   **Technicians/Engineers:** Operational clearance only (PDR & Preventive).
*   **Enforcement:** Real-time gatekeeping in `DesktopLayout` and `LaunchpadView`.

---

## 4. Feature Portals: Current Progress

### ✅ PDR Engine (Operational)
*   **Hiearachy:** Family -> Template -> Blueprint. Absolute SKU collision prevention.
*   **Inventory:** Multi-warehouse stock tracking with movement auditing.

### ✅ Shield Ops / Preventive Maintenance (FOCUSED)
*   **Checklists:** Recursive task lists with criticality flags.
*   **Tactical Schedules:** Machine-based frequency engine with auto-due calculations.
*   **Deployment Queue:** Real-time Work Order terminal for technicians.
*   **Excel Sync:** Hub for importing/exporting PM master data with backup integrity.

### ✅ System Configuration (Titan Polish)
*   **RBAC Node:** Detailed user management with portal-specific toggles.
*   **Neural Core Backup:** High-speed serialization for DB snapshots (Export/Import).
*   **Policy Matrix:** Configuration for session timeouts and developer debug layers.

---

## 5. Visual Identity: The "Titan" Aesthetic

The UI has been unified under the **Titan Design System**:
*   **Color Palette:** Carbon Black (`#050508`) surfaces with high-visibility neon accents.
*   **Typography:** Italicized, heavy tracking-tighter headers for an aggressive industrial feel.
*   **Card Design:** `.titan-card` utilizes subtle inner glows and sharp border definition instead of soft shadows.
*   **Interactivity:** Hover-states trigger scale pulses and accent-color glows, providing positive tactile feedback.

---

## 6. Next Engineering Steps
1.  **Stock-PM Synchronization:** Wire PM Work Orders to consume stock items from the Inventory automatically upon completion.
2.  **Machine Telemetry:** Integration of IoT/Sensor data into the Preventive Dashboard for predictive alerts.
3.  **Global Search Logic:** A "Spotlight" search to jump between Blueprints, Technicians, and Work Orders across the entire OS.
