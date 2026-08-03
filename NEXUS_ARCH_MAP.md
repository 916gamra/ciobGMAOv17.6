# BDR Nexus v17.5-DOC (Sovereign Architectural Map)

This document represents the absolute authoritative blueprint and DNA ledger of **BDR Nexus (GMAO v17.5)**. It defines the schemas, structural patterns, interface topologies, and background logic of the industrial ecosystem.

---

## 🏛️ SECTION I: Database Schema & Relational DNA

BDR Nexus relies on a local-first **Dexie.js (IndexedDB)** architecture to handle massive datasets securely. This guarantees client-side resilience and performance under high-volume operations (100,000+ data rows).

### 1. The Strict Multi-Tier Taxonomy Matrix
We explicitly separate broad categories from specific units to avoid inventory duplicates:
*   **PdrFamily (The Genus):** Broad taxonomy classifications (e.g., *Bearings*, *Fuses*, *Pneumatic Cylinders*).
*   **PdrTemplate (The Design):** Conceptual commercial designs containing specifications (SKUs) but no brand/count (e.g., *Deep Groove Ball Bearing 6200 series*).
*   **PdrBlueprint (The Species):** Exact physical specifications purchased by the plant, acting as structural datasheets (e.g., *6205-2RS* with unit, minimum threshold).
*   **StockItem (The Physical Instance):** The concrete unit stored physically in a specific physical location. *A Blueprint can have multiple stock items across multiple locations.*

```text
[PdrFamily] 1 ─── 🌌 ───> N [PdrTemplate] 1 ─── 🌌 ───> N [PdrBlueprint] 1 ─── 🌌 ───> N [StockItem]
                                                                                        (Quantity resides HERE)
```

### 2. Physical & Diagnostic Assets Alignment
*   **Sector:** Represents physical factory sectors (1 to 15) with an assigned manager and active/dormant status.
*   **Technician:** Operational workforce mapped directly to a home Sector.
*   **MachineFamily:** Defines mechanical/process attributes of machine groups (e.g., *Rolling Mills*, *Inverters*).
*   **MachineTemplate:** Defines functional machine classes (Automatic, Hydraulic, Pneumatic, Manual, etc.).
*   **MachineBlueprint:** The physical manufacture datasheet (Siemens, 45 kW, Air cooled), referencing linked components.
*   **Machine (The Body):** Master unit on the factory floor with state controls (`Active`, `Standby`, `Maintenance`), mapped sector, serial number, and assigned maintenance leader.

### 3. Preventive Care & Unified Surgery Schema
The system models machine parts as modular diagnostic blocks:
*   **StandardComponent (The Organ):** Structural diagnostic blocks (e.g., *Hydraulic Motor*, *Piston Valve*) possessing an assigned family and criticality rating (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
*   **StandardAction (The Operation):** The exact action to perform (e.g., *Calibrate, Lubricate, Overhaul*), categorized by nature (`PREV`, `CORR`, or `BOTH`).
*   **TaskExecution (The Surgery Ledger):** Tracks history and live operations in the **Chamber of Surgery**. Recorded entries log:
    *   `machineId` (The physical target host body).
    *   `componentId` (The precise organ undergoing surgery).
    *   `actionId` (The operation verb).
    *   `serviceType` (`PREV` vs `CORR`).
    *   `durationMinutes` (Downtime).
    *   `notes` (Comprehensive diagnostic remarks).
    *   `componentCondition` (`EXCELLENT` | `WATCHFUL` | `CRITICAL`).

---

## 💻 SECTION II: UI/UX Topology & Interface Anatomy

The interface is modeled after a **Virtual Operating System Layout** to align with industrial visual familiarity, utilizing a system-wide window manager and high-density, rich-dark high-contrast layouts (**Italy Lux** accent limits).

### Active Portals & Views Compiled:
1.  **Dashboard Hub & Launchpad:** Multi-window environment controlling active applets.
2.  **PDR Engine (Stock Engine):** High-efficiency virtual list mapping spare parts cataloging, real-time inventory levels, multi-warehouse allocations, and supplier stock requisition workflows.
3.  **Shield Ops / Preventive Radar:** Highly responsive scheduling workspace for monthly sweeps, standard preventive routines, technician dispatcher grids, and live work order trackers.
4.  **Engineering Lab:** The central system config where administrators define standard machine structures, group operational checklists, manage Component-to-Action mapping, and manage standard component models.
5.  **Corrective Ward (The Emergency Suite):** Diagnostic terminal focusing on corrective maintenance telemetry, Bad-Actor analysis (Top 5 Offenders), mean-time-to-repair (MTTR) by component family, total loss of production metrics, and historical breakdown lifelines.
6.  **Staff & Sector Registries:** Topological layout assigning technicians and managers to corresponding plant zones.
7.  **Admin Command Center:** System-wide users and access control management based on user level clearances.

---

## ⚙️ SECTION III: Central Logical Engines & Algorithms

### 1. The Unified Service Entry Pipeline (Chamber of Surgery)
When technicians execute standard maintenance tasks:
1.  Target physical maquinaria is identified (`Machine`).
2.  A specific modular organ is designated (`StandardComponent`).
3.  The master action is loaded (`StandardAction`).
4.  The system determines the nature dynamically (`PREV` for preventive work vs. `CORR` for emergency breakdowns).
5.  Part consumption offsets the catalog's dynamic `inventory` level automatically, creating `StockMovement` files.

### 2. Machine Health & Readiness Index Score Logic
Every physical asset maps an operational index dynamically:
*   **Base Score:** Placed default at `100%`.
*   **Penalty - Missing Core Pillars:** If a machine lacks an assigned Technician, a mapped physical Sector, or an interactive Template Blueprint: **-40 points**.
*   **Penalty - Backlogger Overdue:** For every pending task that exceeded its scheduled window: **-15 points**.
*   **Output Score:** Scaled within the closed interval `[0%, 100%]`.

### 3. Evolutionary Data Capture Flags (Amber, Crimson, Emerald Neon Pulse)
*   🔴 **`RED` (Crimson - Emergency):** Flagged whenever missing core pillars occur, OR if any execution task is delayed by $\ge 30$ days.
*   🟡 **`GOLD` (Amber - Warning):** Triggered when the last service execution occurred between 25 and 29 days ago.
*   🔵 **`CYAN` (Neon Blue - Idle):** Standard system warning stating zero preventive care files have been linked to the asset yet.
*   🟢 **`GREEN` (Emerald - Stable):** Active surveillance, under active protective maintenance ($\le 24$ days since last service execution).

---

## 🔒 SECTION IV: Security & Integrity Controls

1.  **RBAC Architecture:** Controlled centrally via `/src/core/permissions.ts`, enforcing whitelist verification against authenticated worker sessions.
2.  **Anti-Self-Destruction System:** Hard locks primary system developers to prevent account deletion or self-access lockout.
3.  **Bcrypt-Layer Keys:** Uses encrypted local hashes to safeguard passwords and pins against local system attacks.
4.  **Audit Trail Logging:** All core settings modifications, warehouse adjustments, or user changes create global ledger events (`auditLogs`) indicating action, author, and severity (`INFO`, `WARNING`, `CRITICAL`).

---

## 🧪 SECTION V: Sovereign Dual-State Architecture (The Sandbox Multiverse)

To ensure the system remains pure and robust while allowing intensive and safe simulated testing, BDR Nexus v17.5 implements a perfect **Dual-State Engine**:

### 1. The Quantum Login Gate (Mode Switcher)
*   The front door to the system features an "Italy Lux" Glassmorphic toggle separating reality from simulation.
*   **Production Mode (`false`):** Secure, empty-by-default, pristine database reserved ONLY for real factory operations and official stock values.
*   **Sandbox Mode (`true`):** Immediate UI transformation enabling "Quick-Select Virtual Identity Panels". Allows one-click access into deeply pre-populated, highly relational simulated states. No password matrix required. The state is toggled via boolean flag `BDR_NEXUS_SANDBOX_MODE` stored in `localStorage`.

### 2. The Transparent Proxy Database (The Mirror)
We preserve 100% Shared UI & Logic constraints through a Native `Proxy` layered on top of the Dexie.js core (`/src/core/db.ts`). 
*   The system creates two isolated IndexedDB databases: `CIOB_GMAO_DB` (Reality) and `CIOB_GMAO_SANDBOX_DB` (Sandbox).
*   The global `db` export evaluates `BDR_NEXUS_SANDBOX_MODE`.
*   When running in `Sandbox`, the Proxy dynamically hijacks all read/write/transaction commands and reroutes them to the Sandbox database automatically. The application logic components (`useLiveQuery`, internal component renders, computation functions) are inherently unaware of this swap, achieving true architecture cohesion without structural duplication.

### 3. The Seed Engine Mutation Scripts
The `loginSandbox` API triggers a background simulation sequence (`checkAndSeedSandbox`) mapping a rich, progressive state:
*   **Physical Machines Split:** Simulated `DET-BELT` and `DET-HYD` variants, alongside `PRH-MEGA` heavy hydraulic presses.
*   **Stock Simulation:** Emulates low-stock thresholds to automatically illuminate inventory alert trackers.
*   **Workforce Activity:** Pre-loads assigned sectors, historical task executions, and active pending maintenance duties for `Nabil`, `Mhammed`, and `Ismaayl`.
