# 🏛 Architecture & Engineering Philosophy Notes

This document is dedicated to the core developers maintaining `CIOB GMAO v17.0`. It explains "Why" things are built the way they are, beyond just the "How."

## The "Windows OS" Metaphor
Why does the application look like a desktop OS instead of a standard web dashboard?
1. **Mental Mapping**: Industrial technicians are used to desktop software (like old ERPs or Windows applications). Giving them a floating window/tab interface makes them feel at home and lets them multitask (e.g., keeping an Inventory list open while filling out a Work Order on another tab).
2. **Implementation**: Achieved using `Zustand` (`useTabStore` in `/src/app/store.ts`). It creates a virtual window manager inside the DOM.

## Data Relationships (PDR Engine Philosophy)
We avoid flat "Parts List" approaches because they cause infinite SKU duplication and data chaos in factories.
Instead, we built a strict 3-Tier model:
- **Family (PdrFamily)**: E.g., `Bearings`. (The broadest category).
- **Template (PdrTemplate)**: E.g., `Roller Bearing 6200 series`. (The manufacturer design).
- **Blueprint (PdrBlueprint)**: E.g., `6205-2RS / Unit: Pcs / Min: 50`. (The exact physical specification you buy).
  
Only a **Blueprint** can have physical `Stock Items` in a warehouse. You don't buy a "Family", you buy a "Blueprint". This guarantees absolute precision in inventory valuation and requisition.

## The Security Kernel (Permission Matrix)
We transitioned from hardcoded role checks to a centralized clearance utility (`/src/core/permissions.ts`).
- **Identity-First**: Every portal access request is validated against the user's `role`, `isPrimary` status, and `allowedPortals` whitelist.
- **Fail-Safe Isolation**: If a user somehow bypasses the UI and attempts to mount a restricted Portal component, the `DesktopLayout` kernel catch-block will forcibly unmount the component and redirect them to the Home portal.
- **DNA Protection**: Account modifications for the "Primary Founder" are blocked at the code level, preventing accidental self-deletion or unauthorized lockout.

## Handling 100,000+ Rows in the Browser
Because the app is **Offline-First**, the client holds massive amounts of data inside IndexedDB.
If you render 10,000 blueprints into the DOM, the user's browser will crash.
- **Solution**: We use `@tanstack/react-virtual`. 
- **How it works**: Observe `PdrLibraryPage.tsx`. We only map a fixed amount of HTML DOM nodes (e.g., 10 nodes for the visible screen). As the user scrolls, we just swap the data inside those 10 nodes and adjust their CSS `transform: translateY()`.
- **Rule for future Devs**: NEVER map an array length > 50 without using the `useVirtualizer` hook.

## The Hybrid Sync Path (Future SQL Migration strategy)
Right now, `Dexie.js` is the master database. 
However, the codebase relies entirely on specific Service Hooks (`usePdrLibrary`, `useProcurementEngine`, etc.).
If tomorrow you hook up a PostgreSQL database:
1. You do not need to touch the UI components.
2. You only rewrite the underlying `db.transaction` inside the hook to `fetch('/api/...')` instead.
3. This is Dependency Injection / Hexagonal Architecture in practice.

## Security Posture
Even though it's client-side right now, we implemented:
- **Zod Data Validation** (`/src/core/schemas.ts`): To ensure dirty data from Excel imports or malicious inputs do not corrupt the DB schema.
- **Bcrypt Hashing** (`/src/core/security.ts`): To ensure that if an attacker dumps the LocalStorage/IndexedDB, they cannot steal user PINs.

Maintain this standard. Every new form MUST use a Zod schema before hitting the database.
