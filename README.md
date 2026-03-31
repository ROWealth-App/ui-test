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

### Real Estate — Mark Property as Sold

- Added a **Sold** button in the property detail header (beside the Edit button)
- Clicking Sold opens a modal prompting for **sold price**, **sold date**, and **buyer name**
- Once a property is marked as sold:
  - The **Edit** button is hidden — overview information can no longer be modified
  - The **Add Loan Contract** button is hidden — no new loan contracts can be added
  - A red **SOLD** badge appears next to the property name in the detail view
  - The property listing card displays a red **Sold** status badge in place of the purpose badge
