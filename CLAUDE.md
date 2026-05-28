# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WealthOS UI — a React 19 wealth management dashboard for tracking a multi-asset portfolio: stocks, bonds, crypto, VC/PE, business ventures, collectibles, retirement plans, real estate, loans, insurance, credit cards, and cash accounts. Currently a prototype with all data mocked inline (no backend API calls).

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — Production build
- `npm run lint` — ESLint (flat config, v9+)
- `npm run preview` — Preview production build

No test framework is configured.

## Architecture

**Single-file application**: Nearly all code lives in `src/App.jsx` (~18,000 lines). This includes screen components, drawers, modals, reusable primitives, mock data, and utilities.

**Routing**: Client-side state-based via `useState("...")` and a `renderScreen()` switch. No React Router. Screens include: `holdings` (stocks), `bonds`, `crypto`, `retirement`, `pe` (VC/PE), `bp` (business ventures), `collectibles`, `realestate`, `loans`, `insurance`, `creditcards`, `cashaccounts`, `dashboard`, `workflows`, `export`, plus stock detail pages (`chart`, `dividends`, `news`, `ai`, `manage`, `import`).

**State management**: All state is in the top-level `App()` component using `useState` hooks, passed down via props. No Context API or external state library. Persistent settings (base currency, etc.) use `localStorage`.

**Styling**: Inline styles using a design tokens object `T` (colors, spacing, radii). The CSS files (`App.css`, `index.css`) are effectively unused — all visual styling is done through the `T` object and inline `style` props.

**Data**: All data is hardcoded in mock constants (`HOLDINGS_INIT`, `BOND_INIT`, `CRYPTO_INIT`, `RETIREMENT_INIT`, `PE_INIT`, `BP_INIT`, `COL_INIT`, `RE_INIT`, `LOANS_INIT`, `POLICIES_INIT`, `CC_CARDS_INIT`, `CC_ACCOUNTS_INIT`, `CC_TRANSACTIONS_INIT`, etc.). No `fetch` calls or async data loading.

**Charts**: Recharts library (Bar, Area, Line, Pie) wrapped in `ResponsiveContainer`.

## Drawer pattern

Every asset detail click opens a right-side drawer (originating from the credit-card pattern). Drawers share a consistent tab layout — typically `Overview · Transactions · Postings · History · Manage` (variations per module). The Manage tab uses the shared `FieldUpdatePanel` primitive (action pills + current/new comparison + audit-driven history table) for inline field updates with full audit trail.

## Audit log

Entity edits go through `logAudit(entityType, entityId, action, before, after, label)` (built from `makeAuditLogger`). The `AuditLogPanel` component renders entries with diff. Every entity type (stock, bond, crypto, pe, venture, collectible, retirement, loan, property, creditcard, account, insurance) is editable with audit logging.

## Key primitives & utilities

- **Layout**: `Card`, `Badge`, `Label`, `Input`, `Sel` (select), `Toast`
- **Progressive disclosure**: `MoreOptions` (collapsible section for non-mandatory fields)
- **Currency**: `fmtCompact()` formatter; `BASE_CURRENCY` + `CURRENCY_SYMBOLS` map; per-currency conversion via `toSGD()`
- **Transaction money-flow**: `FlowBanner` + `classifyTxFlow` — 3-state IN / OUT / NO CASH FLOW badging used in every Record-Transaction modal
- **Field updates**: `FieldUpdatePanel` — reusable Manage-tab action panel (Retirement / RE / Loan / CC / BP)
- **Pickers**: `PickerWithOther` (bank/broker/wallet picker with custom "Other…" fallback)
- **Audit**: `makeAuditLogger`, `logAudit`, `AuditLogPanel`
- **Postings**: double-entry journal entry generation for PTA-style export (CSV + Ledger format)

## Tech Stack

- React 19 + Vite 7 (JavaScript, no TypeScript)
- Recharts for data visualization
- ESLint 9 flat config with React hooks/refresh plugins
