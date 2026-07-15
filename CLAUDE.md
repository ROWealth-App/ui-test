# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WealthOS UI — a React 19 wealth management dashboard for tracking a multi-asset portfolio: stocks, bonds, crypto, VC/PE, business ventures, collectibles, retirement plans, real estate, loans, insurance, credit cards, and cash accounts. Currently a prototype with all data mocked inline (no backend API calls).

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — Production build (verification gate — must show `✓ built`)
- `npm run lint` — ESLint (flat config, v9+)
- `npm run preview` — Preview production build

No test framework is configured. Verify changes with `npx vite build` (must succeed) and, where possible, browser checks at `localhost:5173` (chrome-devtools MCP).

## Architecture

**Single-file application**: Nearly all code lives in `src/App.jsx` (~18,000+ lines). This includes screen components, the detail-page shell, modals, reusable primitives, mock data, and utilities.

**Routing — hash-based (no library)**: `parseHash(hash)` / `buildHash(route)` (near `src/App.jsx:895`) produce a structured route `{screen, parentId, entityId, tab}`. `App()` derives `route` from `window.location.hash` via a `hashchange` effect, and a single `navigate(next)` primitive only ever sets `window.location.hash` — so browser back/forward, refresh-restore, and deep-linking all work for free. `const page = route.screen` is kept as an alias so layout/title code is untouched.
- `TWO_LEVEL = new Set(["stocks","crypto"])` — these use a `screen/parentId/entityId/tab` URL shape (account→holding, wallet→coin); all other screens use `screen/entityId/tab`.
- `KNOWN_TABS` whitelists valid tab segments.
- URLs look like `#/bonds/BD001/transactions`, `#/stocks/BR001/1/manage`, `#/crypto/WL001/CR001/postings`.
- Screen keys: `stocks`, `bonds`, `crypto`, `retirement`, `privateequity` (VC/PE), `partnerships` (business ventures), `collectibles`, `realestate`, `loans`, `insurance`, `creditcards`, `cashaccounts`, `dashboard`, `workflows`, `export`, `import`, plus the stock `dividends` sub-view. (Note: the VC/PE screen key is `privateequity`, not `pe`; business ventures is `partnerships`.)

**State management**: All state is in the top-level `App()` component using `useState` hooks, passed down via props. No Context API or external state library. Persistent settings (base currency, export history) use `localStorage`.

**Styling**: Inline styles using a design-tokens object `T` (colors, spacing, radii). `index.css` holds only a few shared row-hover rules (`.hov-row`, `.hov-group`); `App.css` is effectively unused — visual styling is via the `T` object and inline `style` props.

**Data**: All data is hardcoded in mock constants (`HOLDINGS_INIT`, `BONDS_INIT`, `CRYPTO_INIT`, `RETIREMENT_INIT`, `PE_INIT`, `BP_INIT`, `COL_INIT`, `LOANS_INIT`, `POLICIES_INIT`, `CC_CARDS_INIT`, `CC_ACCOUNTS_INIT`, `CC_TRANSACTIONS_INIT`, `CASH_ACCOUNTS_INIT`, `WORKFLOWS_INIT`, `FUNDS_INIT`, `ORGS_INIT`; real-estate `properties` are seeded inline in `App()`). No `fetch` calls or async data loading. **Note**: HMR preserves `useState`, so changes to seed-data constants require a hard reload (`reload` with `ignoreCache: true`) to take effect.

**Charts**: Recharts (Bar, Area, Line, Pie) wrapped in `ResponsiveContainer`. `CompactStockChart` and `CompactCryptoChart` render the holding/coin Chart tab.

## Detail-page pattern (full-page, URL-addressable)

Clicking an asset row navigates to a **full page** (not an overlay drawer — the drawers were converted to pages). Every detail page renders through the shared `DetailPage` shell (`src/App.jsx:940`): props `{icon, iconBg, title, subtitle, badges, stats, tabs, activeTab, onTab, onBack, headerActions, children}` — a ← Back button, a rounded header card with a stat grid, pill tabs, and inset children. A bad id renders `NotFound`.

Standard tab set: **Overview · Transactions · Postings · Audit · Manage** (with module-specific extras like Stocks/Crypto **Chart**, Stocks **Dividends**, Loans/Real-Estate **Repayments**). The tab id for the audit log is `audit` (it was historically `history`; some non-audit "Transactions" tabs on the Stocks-account and Crypto-wallet levels still use the `history` id internally).

The **Manage** tab uses the shared `FieldUpdatePanel` primitive (action pills + current/new comparison + audit-driven history table) for inline field updates. **Record vs Manage split**: transactions (Buy/Sell/Dividend/Transfer/Coupon/etc.) are recorded via a **Record Transaction** modal opened from the Transactions tab; Manage is for value/field updates only (e.g. Update Price). Don't reintroduce transaction-recording into Manage.

## Listing-table convention

All list views use `capCols(frString)` (content-capped `minmax` columns, column-count-aware, budgeted toward `CAP_TARGET`) instead of equal `fr` units — this avoids "rivers of whitespace" on wide screens. Headers (`SortHeader`, `gridCols={capCols("…")}`) and rows (`gridTemplateColumns:capCols("…"), columnGap:24`) must use the same fr string. Header alignment matches content: text columns left, numeric/currency/status columns right. When adding a column or a new list, wrap the template in `capCols()` for both header and rows — don't reintroduce raw `fr` templates.

## Audit log

Entity edits go through `logAudit(entityType, entityId, action, before, after, label, opts)` (built from `makeAuditLogger`). `AuditLogPanel` renders entries with a diff. Every entity type (stock, bond, crypto, fund, pe, venture, collectible, retirement, loan, property, creditcard, account, insurance, organization, workflow) is editable with audit logging.

- **`opts.effectiveDate`** (7th param, additive — ~80 positional call sites are unaffected) records the date a change *takes effect*, as distinct from `ts`, the machine time it was recorded. `effDate(e)` reads it with a fallback to `ts`. `priceDate`/`navDate`/`valuationDate` are on the `diffEntities` ignore-list so mirrored dates stay out of `changes`.
- **`logAudit.remove(id)`** is the only mutation of the otherwise append-only log. It is used solely by the price-history delete, which then logs a replacement `delete-price-update` entry — so the trail is never actually broken.
- `ACTION_META` maps each action to its badge label + colour. Add an arm here for any new action, or it silently renders as a blue "UPDATED".

## Value updates (price / NAV / field)

All five update flows (Stocks, Bonds, Crypto, VC/PE, and the shared `FieldUpdatePanel`) share one pattern:
- An **Effective Date** input on the form, passed as `opts.effectiveDate`.
- The shared **`PriceHistoryTable`** — sorted by *effective* date, so a back-dated entry slots into the past and row 0 (badged **CURRENT**) is genuinely the update in force.
- **Delete with revert**: deleting the *latest* entry reverts the entity to the previous value; deleting a *superseded* entry removes only the log row and leaves the current value alone (a later update already overwrote it). Guard reverts with `Number.isFinite(before)` — seeded `AL_SEED_*` entries carry synthetic values.

## Transactions

- Every transaction row carries `TxRowActions` (✏️ edit / 🗑 delete); each module's `*TxModalInner` / action panel supports an edit mode (prefill + replace by id).
- The Transactions tab toolbar is `TxToolbar` (search + filter chips + a Record action).
- **Money-flow**: `FlowBanner` + `classifyTxFlow` render a 3-state MONEY IN / MONEY OUT / NO CASH FLOW badge in every Record-Transaction modal.
- **RECORD toggle**: `RecordOnlyToggle` ("Record only — no cash flow") is wired into the record modals of the modules with genuine in-kind/non-cash events — **Crypto, Stocks, Bonds, Retirement, VC/PE**. Ticking it overrides `FlowBanner` to NO CASH FLOW, tags the tx `recordOnly:true`, and suppresses cash-account side-effects. (Collectibles/Real-Estate/Business-Ventures are revaluation flows that already post no cash, so they intentionally don't have the toggle.)

## Postings

Double-entry journal-entry generation for PTA-style export (CSV + Ledger). Crypto self-transfers are asset-to-asset at cost basis (no gain/income); airdrops are income at FMV; gas fees are a network-fee expense.

Each module still renders its own inline postings block (12 of them). The **export** path, however, goes through two shared tables — use them for anything new:
- **`A`** — the one place PTA account strings are built (`A.brokerage`, `A.fund`, `A.property`, `A.income(...)`, …). Hand-rolling account strings is how `Assets:Collectible:` and `Assets:Collectibles:` once drifted apart for the same asset.
- **`POSTING_RULES`** — Dr/Cr direction keyed by **transaction type** (not by tab), resolved via `resolvePosting()` against the roles each row supplies (`asset` / `cash` / `income` / `expense` / `liability` / `equity`). Keys may be scoped `"tab:Type"` where a word means different things in different tabs (a credit-card `Purchase` is Dr expense / Cr liability; a collectible `Purchase` is Dr asset / Cr cash). A rule of `null` means the type posts nothing (e.g. `Valuation Update`).

**Adding a transaction type?** Add it to the flow sets (`TX_FLOW_IN`/`OUT`/`INFO`) *and* to `POSTING_RULES`, *and* to the module's inline postings if/else. The inline blocks **silently skip** any type they don't match — no error, just zero journal rows.

## Modules with non-obvious shapes

- **Real Estate** — `tenants[]` is the source of truth; the flat `isRented`/`monthlyRent`/`tenantName`/`leaseStart`/`leaseEnd` fields are a **derived mirror** kept in step by `tenantMirror()`. Every writer to `tenants` must pass through it. Properties predating the array lazy-migrate via `reTenants()`.
  `propertyTransactions[]` (rent, MCST, tax, repairs, deposits) is deliberately **separate from `loanRepayments[]`** — the latter feeds the amortisation maths (`contractId`, `cashAmount`/`cpfAmount`, per-contract ordering for `paysBefore`), the Repayments sub-tab and the import target. **Do not merge them**; they are merged on the read side only. Synthetic tax/MCST postings are suppressed once real `propertyTransactions` exist, to avoid double-counting.
- **Insurance** — `payouts[]` (money *out of* the policy) is separate from `premiumTransactions[]` (money *into* it, which bumps `totalPremPaid` and books Dr Expense). A payout's `source` decides its credit leg: drawn from the fund/cash value it is a *return of asset*; otherwise it is *income*. `linkedAssetType` + `linkedAssetId` (two fields — PE ids are strings, cash-account ids are numbers) link a policy to a PE fund or cash account.
- **VC/PE** — `peAggregateDelta()` is the single table of which aggregate each tx type moves; add / edit (reverse-then-reapply) / delete all route through it. `Additional Investment` is *new* money and lifts **both** `commitment` and `calledCapital`, unlike a `Capital Call`, which draws down existing unfunded commitment.
- **Investment Funds** (`funds`) — the only module with both units and a per-unit price, so the Ledger commodity-lot branch works on it. Market value / book cost / P&L are **derived** (`fundMarketValue()` etc.), never stored.
- **Organizations** (`organizations`) — a registry of entities you control. An org holds no cash of its own (its money lives on the linked Business Venture), so it has **no transactions/postings tabs and no Export/Import wiring**. `addToPortfolio()` is hard-gated on `portfolioEligible` and cross-links org ↔ venture.

## Adding a new screen

⚠️ **`FULL_WIDTH_SCREENS`** (next to `NAV`) decides which layout a screen renders in. A screen missing from that set renders in the **wrong layout with no error at all**. Add the screen to: `NAV`, `subtitles`, `FULL_WIDTH_SCREENS`, `renderScreen()`, and `App()` state — plus `EXPORT_TABS`/`gatherTransactions` and `IMPORT_TARGETS` if it has a transaction ledger.

## Import / Export

- **Export** (`ExportScreen`, `#/export`): tab checkboxes + date filter + Ledger/CSV format, live preview, Blob download. **12 tabs** (adds Investment Funds, Real Estate, Insurance, Retirement). Direction comes from `POSTING_RULES` (see Postings). The Ledger output carries real PTA metadata — `Payee | Narration`, tags (`; :tab:type:`), typed pairs (`; tab:`, `; entity:`, `; txid:`, `; ref:`, `; status:`, `; note:`) and `commodity`/`account` declarations so it is `ledger --strict` clean. CSV gains `payee, tags, ref, status, entity_id`. **Cash Accounts is excluded** — no tx ledger, and its card spending already exports under `creditcards` (including it would double-count). A **History** tab lists past exports (persisted to `localStorage` `wealthos.exportHistory` — populated only after a download).
- **Import** (`ImportScreen`, `#/import`): Firefly III–style 3-step wizard (upload/paste + delimiter/header → column-role mapping with auto-guess → preview → import). `IMPORT_TARGETS` covers **all 11 tabs with a transaction ledger**: flat commit (Stocks → `transactions`, Credit Cards → `ccTransactions`) and nested commit (Bonds/Crypto/Retirement/VC-PE/Business-Ventures/Collectibles `.transactions`, Real Estate `.loanRepayments`, Loans `.repayments`, Insurance `.claims`) via the generic `appendNested(setter, txField, idPfx, build)` helper. Each target has a sample CSV and a required entity picker. **Cash Accounts is excluded** — it has no per-account transaction ledger in the prototype.

## Workflows (Firefly III rule-engine parity)

`WorkflowsScreen` (`#/workflows`) models Firefly III rules:
- `WORKFLOW_CONDITION_FIELDS` — full Firefly trigger catalog (content, amount, type, accounts, metadata, has-X existence, date fields) + WealthOS entity fields; `WORKFLOW_CONDITION_OPS` are typed (operators filtered per field type: text/amount/choice/date/bool); the modal value input adapts (choice→select, amount→number, date→date, bool→none).
- `WORKFLOW_ACTION_KINDS` — full Firefly action catalog (set/clear category & budget; add/remove/clear tags; set/append/prepend description & notes; set source/dest, swap, source/dest→cash; convert withdrawal/deposit/transfer; link subscription/piggy-bank; delete) grouped via `WORKFLOW_ACTION_GROUPS` — plus WealthOS **Notify** extensions (reminder/push/email/task/record/log).
- **Rule groups** (`group` field per workflow) — the card list renders under 📁 group headers; the modal has a rule-group datalist input. Match ALL/ANY (strict/non-strict) and stop-processing are supported.
- **WealthOS extensions beyond Firefly**: event/time triggers (`WORKFLOW_TRIGGER_KINDS`: due-date, balance threshold, price move, schedule) and Notify actions. There is no live rule-execution engine — runs are mocked counts (no real transaction stream).

## Key primitives & utilities

- **Shell/layout**: `DetailPage`, `NotFound`, `Card`, `Badge`, `Label`, `Input` (supports `prefix`, fixed `height:38`), `Sel`, `Toast`
- **Lists**: `capCols`, `SortHeader`
- **Transactions**: `TxToolbar`, `TxRowActions`, `FlowBanner` + `classifyTxFlow`, `RecordOnlyToggle`
- **Manage**: `FieldUpdatePanel`
- **Progressive disclosure**: `MoreOptions`
- **Alerts**: `DismissibleAlert` — a pass-through wrapper adding a "Dismiss for today ✕" button; hidden only while `localStorage` `wealthos.dismissedAlerts[id] === today`, so it auto-resurfaces at midnight. ⚠️ Dismissal uses the **real** clock — several alert *triggers* pin a demo date (`new Date("2026-03-10")`), and keying dismissal off that would make it permanent. Ids are stable (`pe.unfunded`, `loan.due.${id}`), never index-based.
- **Value updates**: `PriceHistoryTable` (effective-date sorted, CURRENT badge, delete-with-revert)
- **Currency**: `fmtCompact`; `BASE_CURRENCY` + `CURRENCY_SYMBOLS`; `toSGD` / `FX`
- **Pickers**: `PickerWithOther` (bank/broker/wallet with "Other…" fallback)
- **Audit**: `makeAuditLogger`, `logAudit`, `AuditLogPanel`
- **Charts**: `CompactStockChart`, `CompactCryptoChart`

## Tech Stack

- React 19 + Vite 7 (JavaScript, no TypeScript)
- Recharts for data visualization
- ESLint 9 flat config (React hooks/refresh). Lint baseline is ~72 advisory problems (React-compiler `static-components`/`memoization`/`purity` advisories + the intentional `window.location.hash` assignment for hash routing) — no runtime bugs.

## Project status (as of 2026-07-14)

This prototype is built feature-by-feature against several enhancement backlogs, then reviewed module-by-module. Current state:

- **Backlogs complete**: the 21-point enhancement checklist, the 17-point enhancement pass, the 2026-06-15 full-page-routing & feature backlog, and the **2026-07-12 15-item backlog** are all done.
- **The 2026-07-12 backlog** delivered, in three phases: (1) clearer audit-delete text, the VC/PE rates group, dismissible alerts; (2) effective-dated value updates with delete-and-revert across all five update flows; (3) VC/PE additional investments, insurance payouts + asset link, Real Estate tenants + a real property ledger, the Investment Funds module, the Organizations registry, and the PTA export rewrite.
- **Module test review (T-series)**: T1 routing, T2 standardized tabs/actions, T3 VC/PE, T4 Business Ventures, T5 Collectibles, T6 Real Estate, T7 Loans, T8 Insurance, T9 Credit Cards, T11 Stocks, T12 Crypto, T13 Retirement — **all passed**. **T10 Cash Accounts** is intentionally on hold (do not modify it unless asked). The non-asset screens (Dashboard, Export, Import, Workflows) and the two new modules (Investment Funds, Organizations) have not yet had a dedicated review pass.
- **Working style**: the user tests in their own browser and reports pass/fail; fixes are verified with `npx vite build` (`✓ built`) and chrome-devtools screenshots. Commits go directly to `main` (solo prototype). `dist/` is tracked — rebuild before committing.
