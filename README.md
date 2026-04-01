# WealthOS UI

A React-based wealth management dashboard for tracking stock holdings, dividends, credit cards, insurance policies, and real estate.

## Getting Started

```bash
npm install
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

## Changelog

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
