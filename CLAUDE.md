# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WealthOS UI — a React 19 wealth management dashboard for tracking stock holdings, dividends, credit cards, insurance policies, and real estate. Currently a prototype with all data mocked inline (no backend API calls).

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — Production build
- `npm run lint` — ESLint (flat config, v9+)
- `npm run preview` — Preview production build

No test framework is configured.

## Architecture

**Single-file application**: Nearly all code lives in `src/App.jsx` (~7000 lines). This includes screen components, modals, reusable primitives, mock data, and utilities.

**Routing**: Client-side state-based via `useState("holdings")` and a `renderScreen()` switch. No React Router. Pages: `holdings`, `chart`, `dividends`, `news`, `ai`, `manage`, `import`, `creditcards`, `insurance`, `realestate`.

**State management**: All state is in the top-level `App()` component using `useState` hooks, passed down via props. No Context API or external state library.

**Styling**: Inline styles using a design tokens object `T` (colors, spacing, radii). The CSS files (`App.css`, `index.css`) are effectively unused — all visual styling is done through the `T` object and inline `style` props.

**Data**: All data is hardcoded in mock constants (`HOLDINGS_INIT`, `CC_CARDS_INIT`, `CC_ACCOUNTS_INIT`, `CC_TRANSACTIONS_INIT`, etc.). No `fetch` calls or async data loading.

**Charts**: Recharts library (Bar, Area, Line, Pie) wrapped in `ResponsiveContainer`.

**Key patterns**:
- Reusable primitives: `Card`, `Badge`, `Label`, `Input`, `Sel` (select), `Toast`
- `fmtCompact()` utility for currency formatting
- Modal components for forms (dividends, credit cards, transactions, real estate, insurance)
- Sidebar navigation with grouped sections

## Tech Stack

- React 19 + Vite 7 (JavaScript, no TypeScript)
- Recharts for data visualization
- ESLint 9 flat config with React hooks/refresh plugins
