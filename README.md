# WealthOS UI

A React-based wealth management dashboard for tracking stock holdings, dividends, credit cards, loans, insurance policies, real estate, retirement plans, fixed income (bonds, T-bills, fixed deposits), cryptocurrencies, VC/PE investments, business partnership ventures, and collectibles.

## Getting Started

```bash
npm install
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

## Changelog

### Collectibles — New Private Assets Tab

- Added a **Collectibles** tab under **Private Assets** in the sidebar navigation
- **Full-width scrollable layout** matching the Insurance/Bonds/Crypto pattern:
  - **Page header** with "Collectibles Portfolio" title and "+ Add Item" button
  - **4-column summary cards**: Total Market Value, Unrealised P&L, Insurance Coverage %, Items Tracked
  - **Value by Category** breakdown bar (sorted by largest allocation)
  - **Under-insured alert banner** listing items whose current value exceeds insured amount
  - **Search bar** (name / brand / reference / category) with status pills and category dropdown filter
  - **Sortable item table**: Item / Brand (with ⚠ under-insured + ✓ authenticated badges), Category, Condition, Cost / Value, P&L, Storage, Status
- **12 categories** with distinct icons/colours:
  - **Watches** ⌚, **Art** 🎨, **Wine & Spirits** 🍷, **Classic Cars** 🏎️, **Jewellery** 💎, **Luxury Bags** 👜, **Sneakers & Streetwear** 👟, **Trading Cards** 🃏, **Coins & Stamps** 🪙, **Memorabilia** 🏆, **Antiques** 🏺, **Other** 📦
- **Slide-in drawer overlay** (960px) with pill tabs:
  - **Overview**: under-insured warning banner (when applicable), Item Details (brand, model/ref, serial, year, condition, authentication cert, provenance), Acquisition & Valuation (acquisition date/price/source, current market value with P&L %, last valuation date/source, lifetime holding costs), Storage & Insurance (location, specific storage, insured value, policy ref, coverage ratio), Notes
  - **Transactions**: Summary strip (Acquisition Cost / Holding Costs / Sale Proceeds), "+ Record Transaction" button, transaction list with type icons and colour-coded amounts
  - **Postings**: Double-entry ledger — Purchase → Dr Asset / Cr Cash; Sale → Dr Cash / Cr Asset; Expenses → Dr Expense:Collectibles:{Type} / Cr Cash
- **Record Transaction modal** with 9 transaction types: **Purchase**, **Sale**, **Valuation Update**, **Appraisal Fee**, **Insurance Premium**, **Maintenance**, **Storage Cost**, **Consignment Fee**, **Restoration**
  - Valuation Update auto-refreshes `currentValue`, `valuationDate`, `valuerSource`
  - Sale auto-flips status to "Sold" and books the proceeds as the final value
- **Add/Edit modal** with fields for category, brand/maker/artist, model/reference/medium, serial/edition no, year, condition, quantity, acquisition details, current valuation, storage, insured value, policy ref, authentication flag + cert reference, provenance, currency, status
- **Mock data**: 8 sample items (Rolex Submariner 126610LN, Hermès Birkin 30 Togo, original artwork "Quiet Harbor #7", Château Margaux 2015 6-bottle OCB, 1971 Porsche 911T, Pokémon Charizard Base Set PSA 10, AP Royal Oak 15500ST in consignment, Tiffany Solitaire 1.5ct)
- **SortHeader enhancement**: accepts optional 4th tuple item `colStyle` for per-column style overrides — used to add `paddingLeft: 20` on the Storage column to prevent the right-aligned P&L values from touching the left-aligned Storage labels

### Business Ventures — New Private Assets Tab

- Added a **Business Ventures** tab under **Private Assets** in the sidebar navigation
- **Full-width scrollable layout** matching the established pattern:
  - **Page header** with "Business Partnership Portfolio" title and "+ Add Venture" button
  - **4-column summary cards**: Total Market Value, Capital Deployed, Lifetime Income (distributions + drawings), YTD Income
  - **Value by Industry** breakdown bar (sorted by largest allocation)
  - **Unrealised gain/loss banner** (market value vs book value — green for gain, red for loss)
  - **Search bar** (business name / industry / role / UEN) + status pills + partnership type dropdown
  - **Sortable table**: Business / Role, Type, Stake %, Capital / Book, Market Value, Income, Status
- **6 partnership types** with distinct icons/colours:
  - **LLP** 🤝, **General Partnership** 👥, **Limited Partnership** 📋, **Private Limited (Pte Ltd)** 🏢, **Joint Venture** 🔗, **Sole Proprietorship** 👤
- **Slide-in drawer overlay** (960px) with pill tabs:
  - **Overview**: 4-stat KPI strip (Market Value, Capital Deployed, Lifetime Income, Total Return with %), Partnership Details (business name, type, industry, role, ownership % of N partners, UEN, country, currency, start / expiry dates), Your Position (capital contributed, partner loan outstanding, total capital deployed, book value, estimated market value, distributions received, salary / drawings, total income, total return with %), Business Performance at 100% (annual revenue, annual profit, profit margin, your share of profit), Notes
  - **Transactions**: Summary strip (Capital In / Income Received / Capital Out & Exits), transaction list with type icons and colour coding for inflow vs outflow
  - **Postings**: Double-entry ledger covering all transaction types — Capital Contribution → Dr Partnership Equity / Cr Cash; Partner Loan → Dr Loans Receivable / Cr Cash; Profit Distribution / Dividend → Dr Cash / Cr Income:Partnerships; Salary / Drawings → Dr Cash / Cr Income:Partnerships:PartnerDrawings; Capital Withdrawal / Exit → Dr Cash / Cr Partnership Equity
- **Record Transaction modal** with dynamic types per partnership type:
  - **Pte Ltd**: Capital Contribution, Dividend, Salary / Drawings, Partner Loan, Loan Repayment, Valuation Update, Exit / Buyout
  - **Non-Pte Ltd**: Capital Contribution, Profit Distribution, Salary / Drawings, Partner Loan, Loan Repayment, Capital Withdrawal, Valuation Update, Exit / Buyout
  - Auto-updates fields on save: Capital Contribution / Withdrawal → `capitalContributed`; Partner Loan / Loan Repayment → `partnerLoans`; Distribution / Dividend → `distributionsReceived`; Drawings → `salaryDrawings`; Valuation Update → `estimatedMarketValue`; Exit / Buyout → flips status to "Exited" and zeroes book/market value
- **Add/Edit modal** with fields for business name, partnership type, industry, role, ownership %, partner count, capital contributed, partner loans, book value, estimated market value, annual revenue / profit, start / expiry dates, UEN, country, currency, status, notes
- **Mock data**: 7 sample ventures (Sunset Café LLP managing partner at 40%, GreenTech Solutions Pte Ltd director at 25%, Urban Logistics JV silent partner at 20%, Two-Hearts Wedding Studio LLP exited via buyout, Axis Property Trust LP at 15%, Nova Coffee Roasters Pte Ltd angel at 8%, Harborfront E-comm dormant general partnership)

### VC/PE Investments — New Private Assets Tab

- Added a **VC/PE Investments** tab under a new **Private Assets** sidebar group
- **Full-width scrollable layout**:
  - **Page header** with "VC/PE Investment Portfolio" title and "+ Add Investment" button
  - **4-column summary cards**: Total NAV, Commitment / Called (with Unfunded subtext), Distributions Received (with DPI multiple), TVPI / Avg IRR
  - **NAV by Investment Type** breakdown bar
  - **Unfunded commitment warning banner** (⚠️ reminds user to reserve liquidity for capital calls)
  - **Search bar** (fund / GP / company / sector) + status pills + type dropdown
  - **Sortable table**: Investment / Manager (with vintage + sector subtext), Type, NAV (with ownership %), Commit / Called (with called %), Dist / TVPI, IRR, Status
- **5 investment types** with distinct icons/colours:
  - **VC Fund** 🚀, **PE Fund** 🏢, **Direct Equity** 📈, **SAFE / Convertible Note** 📝, **Secondary** 🔄
- **Slide-in drawer overlay** (960px) with pill tabs:
  - **Overview**: 4-stat KPI strip (NAV, TVPI, DPI, IRR), Capital Deployment progress bar with Commitment / Called / Unfunded split, Investment Details (type, GP/manager, vintage year, stage, sector, geography, ownership %, fund size, GP commit %, investment / exit dates, currency), Performance (Commitment, Called, Unfunded, Distributions, NAV, Total Value, TVPI, DPI, RVPI, IRR), Notes
  - **Transactions**: Summary strip (Total Called / Total Distributed / Management Fees), "+ Record Transaction" button, transaction list
  - **Postings**: Double-entry ledger — Capital Call → Dr Investment / Cr Cash; Distribution → Dr Cash / Cr Investment (return of capital); Income / Exit → Dr Cash / Cr Income:PrivateEquity; Management Fee → Dr Expense:PrivateEquity:ManagementFees / Cr Cash
- **Record Transaction modal** with 6 types: **Capital Call**, **Distribution**, **Income / Gain**, **Management Fee**, **Valuation Update**, **Exit / Realisation**
  - Auto-updates: Capital Call → `calledCapital`; Distribution → `distributionsReceived`; Valuation Update → `nav`; Exit / Realisation → distributes amount, zeroes NAV, flips to "Realised"
- **Add/Edit modal** with fields for type, fund name / company name, GP / manager, vintage / investment year, sector, geography, stage (Direct only), commitment, called capital, distributions, NAV, IRR, ownership % (Direct) or fund size (Funds), investment / exit dates, status, notes
- **Mock data**: 7 sample investments (Sequoia Capital SEA VI, KKR Asian Fund V, Carousell Pte Ltd direct secondary, Vertex Ventures SEA & India VI, Atomos AI SAFE, Stripe pre-IPO secondary via Forge Global, Blackstone Real Estate Asia III partially realised)

### Cryptocurrencies — New Crypto Wallet Tab

- Added a **Cryptocurrencies** tab under a new **Crypto Wallet** sidebar group
- **Full-width scrollable layout**:
  - **Page header** with "Crypto Portfolio" title and "+ Add Holding" button
  - **4-column summary cards**: Total Portfolio Value, Unrealised P&L (with return %), Yield Earned (staking + lending + airdrops), Avg Staking/Yield APY
  - **Allocation by Holding Type** breakdown bar
  - **Search bar** (symbol / name / wallet / chain) + status pills + holding type dropdown
  - **Sortable table**: Asset / Wallet, Type, Holdings (value + units), Avg / Current Price, APY (with protocol), P&L, Status
- **4 holding types** with distinct icons/colours:
  - **Spot Crypto** 🪙, **Stablecoin** 💵, **Staked** 🔒, **Lending / DeFi** 🌾
- **Multi-chain support**: Bitcoin, Ethereum, Solana, BNB Chain, Polygon, Arbitrum, Avalanche, Polkadot, Cosmos, Other
- **Wallet types**: Exchange, Hardware Wallet, Hot Wallet, Custody, DeFi Protocol
- **Slide-in drawer overlay** (960px) with pill tabs:
  - **Overview**: 3-stat KPI strip (Current Value, Holdings in units, Unrealised P&L with %), Holding Details (symbol/name, type, chain, wallet, wallet type, wallet address, protocol, yield/APY, first acquired), Financial Summary (quantity, avg cost, current price, cost basis, current value, unrealised P&L), Notes
  - **Transactions**: Summary strip (Total Income / Capital Deployed / Transaction count), "+ Record Transaction" button, transaction list with type icons
  - **Postings**: Double-entry ledger — Buy / Stake / Deposit → Dr Assets:Crypto:{Chain}:{Symbol} / Cr Cash; Sell / Unstake / Withdraw → Dr Cash / Cr Assets:Crypto; Staking Reward / Interest / Airdrop → Dr Assets:Crypto / Cr Income:Crypto
- **Record Transaction modal** with dynamic types per holding type:
  - **Spot Crypto**: Buy, Sell, Transfer In, Transfer Out, Airdrop, Fee
  - **Stablecoin**: Buy, Sell, Transfer In, Transfer Out, Interest
  - **Staked**: Stake, Unstake, Staking Reward, Transfer In, Transfer Out
  - **Lending / DeFi**: Deposit, Withdraw, Interest
  - Amount auto-computed from quantity × price; holding quantity auto-updates on save (increments for buys/transfers-in/rewards, decrements for sells/transfers-out/unstakes/fees)
- **Add/Edit modal** with fields for holding type, chain, symbol, name, wallet, wallet type, wallet address, quantity, avg cost, current price, staking yield / protocol (shown only for Staked and Lending types), acquisition date, currency, status, notes
- **Mock data**: 7 sample holdings (BTC on Ledger Nano X, ETH on MetaMask, USDC on Binance, USDT on Crypto.com Earn at 6.5% APY, ETH staked via Lido at 3.2% APY, SOL staked via Marinade at 7.1% APY, AVAX on Coinbase)

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
- **Stocks & Shares mobile optimisation**:
  - **Holdings**: Stock grid table → simplified card list (ticker, name, shares, value, P&L). Cash accounts currency rows → mobile cards with flag icons
  - **Stock Chart**: 8 stat cards (Open, 52W High, Market Cap, etc.) consolidated into a single **compact 2×4 grid** inside one card — reduces ~640px of scroll to ~240px
  - **Dividends**: 3 stat cards (Projected Income, YTD Received, Yield) consolidated into a **compact 2-column grid** inside one card
  - **Manage Stocks**: Holdings/Transactions tabs use mobile card lists; Postings tab uses mobile journal cards
- **Modals**: All modals across the app (Add Loan, Add Dividend, Add Plan, Add Holding, Add Policy, etc.) are responsive on mobile via global CSS rules
  - Fixed-width modals capped to `calc(100vw - 32px)` — no overflow or cut-off text
  - 3-column form grids inside modals automatically wrap to 2-column on mobile
  - All modals scrollable with `max-height: 90vh` and `overflow-y: auto`
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
