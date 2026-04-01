# WealthOS UI

A React-based wealth management dashboard for tracking stock holdings, dividends, credit cards, loans, insurance policies, real estate, retirement plans, and fixed income (bonds, T-bills, fixed deposits).

## Getting Started

```bash
npm install
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

## Changelog

### Mobile Responsiveness

- Made the entire site **mobile-friendly** following mobile UX best practices
- **Sidebar**: Hidden on mobile (≤768px), replaced with a hamburger menu (☰) that opens a slide-in overlay with backdrop. Tapping a nav item auto-closes the sidebar
- **Summary card grids**: 4-col → 2-col on tablet (≤768px) → 1-col on phone (≤480px)
- **Table → Card list on mobile**: All 6 asset screens (Credit Cards, Loans, Insurance, Real Estate, Retirement, Bonds) replace their grid tables with simplified **touch-friendly card list items** on mobile
  - Each card shows: icon, title, subtitle, key value, status badge
  - No horizontal scrolling — all content fits within the viewport
  - Tapping a card opens the full-width detail drawer
  - Uses `useIsMobile()` hook with window resize listener for responsive detection
  - Reusable `MobileListItem` component shared across all screens
- **Postings tabs → Card entries on mobile**: All 7 postings sections (CC, Loans, Insurance, Real Estate, Retirement, Bonds, Manage Stocks) replace the 5-column ledger table with vertical **card-style journal entries** on mobile
  - Each entry shows: date header with days-ago, description, DR line (green) with account + amount, CR line (red) with account + amount
  - Reusable `MobilePostingsList` component shared across all postings tabs
- **Stocks & Shares mobile cards**: Holdings stock table replaced with simplified card list (ticker, name, shares, value, P&L). Cash accounts currency breakdown also uses mobile cards. Dividends stat cards stack to single column. Manage Stocks history table uses mobile transaction cards.
- **Drawer overlays**: Full viewport width on mobile (100vw instead of 960px)
- **Filter toolbars**: Wrap naturally on mobile
- **Page headers**: Stack vertically (title above button) on mobile
- **Top bar**: Search bar expands on tablet, non-essential elements (live status, account selector) hidden on mobile
- **Breakpoints**: 768px (tablet), 480px (phone)

### Bonds & T-Bills — New Protection Tab

- Added a **Bonds & T-Bills** tab under Protection in the sidebar navigation
- **Full-width scrollable layout** matching all other asset screens:
  - **Page header** with "Fixed Income Portfolio" title and "+ Add Holding" button
  - **4-column summary cards**: Total Market Value, Unrealised P&L, Total Income Received, Avg Yield to Maturity
  - **Holdings by Product Type** breakdown bar with coloured progress indicators
  - **Search bar** + status pills + product type dropdown filter + sortable columns
  - **Holdings table**: Full-width grid rows showing Name/Issuer, Type, Value (face + current), Coupon/Yield, Maturity (days remaining), P&L, Status
- **6 product types** (Singapore-focused):
  - **Singapore Savings Bonds (SSB)** — 10-year step-up, redeemable with no penalty, max $200K
  - **SGS Bonds** — Semi-annual coupon, tradeable on SGX, AAA-rated
  - **T-Bills** — 6M and 1Y zero-coupon, discount pricing, non-competitive/competitive bids
  - **Corporate Bonds** — SGX-listed (Astrea, CapitaLand, etc.), credit-rated
  - **Bond ETFs** — ABF SG Bond (A35), Nikko AM SGD IG Corp Bond, with units/NAV tracking
  - **Fixed Deposits** — Bank FDs with auto-renewal and SDIC insurance flags
- **Slide-in drawer overlay** (960px) with pill tabs:
  - **Overview**: Holding Details (product type, issuer, credit rating, coupon, YTM, frequency, tenure, dates, currency, SDIC/auto-renewal), Financial Summary (face/purchase/current value, P&L, units), Notes
  - **Transactions**: Summary strip (Total Income, Capital Deployed, count), transaction list with type icons (Purchase, Sale, Coupon, Distribution, Interest, Redemption), "+ Record Transaction" button
  - **Postings**: Double-entry ledger (Purchase → Dr Bond Cr Cash, Coupon → Dr Cash Cr Income, Redemption → Dr Cash Cr Bond)
- **Record Transaction modal**: Dynamic types per product (T-bills: Purchase/Redemption; Bond ETFs: Purchase/Sale/Distribution; Bonds: Purchase/Sale/Coupon/Redemption; FDs: Purchase/Redemption/Interest)
- **Mock data**: 7 holdings (SSB, SGS 10Y, 2 T-bills incl. 1 matured, Astrea 8 corporate bond, ABF SG Bond ETF, DBS 12M FD) with transaction histories

### Retirement — New Protection Tab

- Added a **Retirement** tab under Protection in the sidebar navigation
- **Full-width scrollable layout** matching Insurance/Loans/CC/Real Estate design:
  - **Page header** with "Retirement Portfolio" title and "+ Add Plan" button
  - **4-column summary cards**: Total Retirement Assets, Projected Monthly Income, Annual Contributions, Plans In Payout
  - **Retirement Assets by Plan Type** breakdown bar with coloured progress indicators per type
  - **Search bar** ("Search plan name, provider, account no…") with status pills and plan type dropdown filter
  - **Sortable plan table**: Full-width grid rows showing Plan/Provider, Type, Balance, Monthly Payout, Contribution, Payout Age, Status
- **Slide-in drawer overlay** (960px) for plan detail with 3 tabs:
  - **Overview**: Quick stats header (Balance, Monthly Payout, Death Benefit/Surrender Value), Plan Details key-value section, Financial Summary section, Notes
  - **Transactions**: Summary strip (Total Inflows / Total Outflows / Net Flow), "+ Record Transaction" button, transaction list with type icons and inflow/outflow colour coding
    - **Plans in payout** (CPF LIFE, mature plans): record **Payouts** and **Withdrawals** (money OUT, shown as negative/red, reduces plan balance)
    - **Plans accumulating** (SRS, insurance, cash reserves): record **Premiums**, **Top-Ups**, **Contributions** (money IN, shown as positive/green, increases plan balance)
    - **Passive income**: record **Interest** credited and **Coupons** received (increases plan balance)
    - Transaction types are dynamically determined by plan type and status
  - **Postings**: Double-entry ledger table (PTA compliant) with Dr/Cr columns
    - Payout/Withdrawal: Dr Cash (receive money) / Cr Plan (reduce value)
    - Premium: Dr Expense / Cr Cash or SRS (money out)
    - Top-Up/Contribution: Dr Plan (increase value) / Cr Cash (money out)
    - Interest/Coupon: Dr Plan (value grows) / Cr Income (income recognised)
    - Accounting legend explaining debit/credit flows
- **Record Transaction modal** with:
  - Dynamic type selector based on plan type (Payout, Premium, Top-Up, Contribution, Interest, Coupon, Withdrawal)
  - Pre-fills amounts (e.g., monthly payout amount for CPF LIFE)
  - Inflow/outflow summary indicator
  - Method, reference, notes fields
  - Auto-updates plan balance on save
  - Edit button to modify plan
- **Add/Edit Plan modal** with dynamic fields based on plan type:
  - **CPF LIFE**: Payout plan (Basic/Standard/Escalating), retirement sum tier (BRS/FRS/ERS), payout start age (65-70)
  - **SRS Account**: Cash vs invested balance split, contribution limits
  - **Retirement Income Plans**: Monthly payout (guaranteed + projected), premium payment term, payout period, death benefit, surrender value
  - **Legacy / Endowment Plans**: Annual coupons (guaranteed + projected), accumulated coupons, death benefit
  - **Cash Reserve**: Balance, interest rate, liquid status
  - **CPF Balances**: OA/SA/MA balance breakdown, monthly contribution split
- **Mock data**: 7 sample plans covering all types:
  - CPF LIFE Standard Plan (FRS $198,800, est. $1,520/mo)
  - DBS SRS Account ($86,400 balance, $62K invested, $24K cash)
  - NTUC Gro Retire Flex (guaranteed $620/mo + projected $850/mo)
  - Manulife Wealth Builder (2% guaranteed coupon, $120K death benefit)
  - Retirement Buffer OCBC 360 ($42K liquid savings)
  - CPF OA + SA ($185K combined, OA $98K + SA $87K)
  - AIA Retirement Saver III (SRS-funded, lifetime payout)

### All Screens — Sortable Table Columns & Search Bars

- Added **sortable column headers** to all 4 asset screen tables (Credit Cards, Loans, Insurance, Real Estate)
- Clicking a column header sorts by that column; clicking again reverses direction
- Sort indicators: ⇅ (unsorted), ▲ (ascending), ▼ (descending)
- Reusable `SortHeader` component and `useSortState` hook shared across all screens
- Sortable columns per screen:
  - **Credit Cards**: Card/Bank, Network, Balance/Limit, Utilisation, Due Date, Status
  - **Loans**: Loan/Lender, Type, Outstanding, Monthly, Rate, Next Due, Status
  - **Insurance**: Policy/Plan, Type, Sum Assured, Premium/yr, Cash Value, Renewal, Status
  - **Real Estate**: Property, Type/Tenure, Valuation, Loan/Equity, Rental, Status
- Added **search bars** to Credit Cards ("Search card name, bank, last 4…") and Loans ("Search lender, loan type, account no…") filter toolbars, matching the existing Insurance search bar pattern

### Real Estate — Redesigned to Full-Width Layout

- Replaced the old left-right split panel layout with a **full-width scrollable page** matching Insurance, Loans, and Credit Cards
- **4-column summary cards**: Total Valuation, Total Equity, Outstanding Loans, Monthly Rental
- **Portfolio Value by Country** breakdown bar with per-country progress indicators and flag icons
- **Filter toolbar**: Search bar, country pills with flags, purpose dropdown, result count
- **Property table**: Full-width grid rows showing Property (flag + name + address), Type/Tenure, Valuation (with gain/loss), Loan/Equity, Rental income, Status badge (with insured dot indicator)
- Table rows show sold properties dimmed with "Sold" badge
- **Slide-in drawer overlay** (960px) for property detail — replaces the old fixed right panel
- All four asset screens (Credit Cards, Loans, Insurance, Real Estate) now share a consistent layout pattern

### Credit Cards — Redesigned to Full-Width Layout

- Replaced the old left-right split panel layout with a **full-width scrollable page** matching Insurance and Loans
- **4-column summary cards**: Total Debt, Credit Limit, Available Credit, Due This Week
- **Credit Utilisation by Bank** breakdown bar with per-bank progress indicators
- **Due alert banners**: Full-width warning banners for cards due this week with View buttons
- **Cards/Accounts tab toggle** with type filter pills (All, Credit, Commercial, Debit)
- **Cards table**: Full-width grid rows showing Card/Bank, Network, Balance/Limit, Utilisation bar, Due Date, Status
- **Accounts table**: Full-width grid rows showing Account/Bank, Type, Balance, Linked Cards
- **Slide-in drawer overlay** (960px) for card detail — replaces the old fixed right panel
- All three Banking/Protection screens (Credit Cards, Loans, Insurance) now share a consistent layout pattern

### Loans — New Banking Tab

- Added a **Loans** tab under Banking in the sidebar navigation
- **Full-width scrollable layout** matching Insurance tab design:
  - **Page header** with "Loan Portfolio" title and "+ Add Loan" button
  - **4-column summary cards**: Total Outstanding, Monthly Outflow, Total Repaid, Overdue Payments
  - **Outstanding by Loan Type** breakdown bar with per-type progress indicators
  - **Payment reminder alert banners** (full-width) for overdue and upcoming due payments with View buttons
  - **Filter toolbar** with status pills (All, Active, Completed, Overdue) and type pills
  - **Loan table**: Full-width grid rows showing Loan/Lender, Type, Outstanding, Monthly, Rate, Next Due, Status with overdue dot indicators
- **Slide-in drawer overlay** (960px) for loan detail with pill tabs:
  - **Overview**: Payment due alerts, repayment progress gauge, monthly payment / months remaining stats, interest vs principal breakdown bar chart, loan details key-value list, payment reminder settings display
  - **Repayments**: Transaction-list style with "+ Add Repayment" button, principal/interest/fees badges per row
  - **Postings**: Double-entry ledger table (PTA compliant) with Dr/Cr columns and accounting legend
- **Add/Edit Loan modal** with fields for type, lender, principal, rate, tenure, dates, purpose, status, next payment due, and reminder toggle (7/14/30/60 day options)
- **Repayment modal** with 3 payment types:
  - **Monthly**: Pre-fills monthly installment amount
  - **Partial**: Custom partial payment amount
  - **Full**: Pre-fills outstanding balance for full settlement
  - Auto-calculates principal (amount minus interest minus fees)
  - Summary section showing payment breakdown and new outstanding balance
- **Mock data**: 6 sample loans (Car Loan, 2 Personal Loans, Education Loan, Renovation Loan, Business Term Loan) with repayment histories — no mortgage loans
- **Payment reminders**: `reminderEnabled`, `reminderDays`, `nextPaymentDue` fields on each loan with visual indicators in listing and drawer

### Real Estate — Mark Property as Sold

- Added a **Sold** button in the property detail header (beside the Edit button)
- Clicking Sold opens a modal prompting for **sold price**, **sold date**, and **buyer name**
- Once a property is marked as sold:
  - The **Edit** button is hidden — overview information can no longer be modified
  - The **Add Loan Contract** button is hidden — no new loan contracts can be added
  - A red **SOLD** badge appears next to the property name in the detail view
  - The property listing card displays a red **Sold** status badge in place of the purpose badge
