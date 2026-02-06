# 📊 Albert Dashboard

A lightweight, real-time investment dashboard for tracking stocks, crypto, and commodities. Built for personal use.

## Tracked Assets

| Category | Assets |
|---|---|
| **Stocks** | Alphabet (GOOGL) · Nvidia (NVDA) · Tesla (TSLA) · Apple (AAPL) |
| **Crypto** | Bitcoin (BTC) · Ethereum (ETH) |
| **Commodities** | Gold (XAU) · Silver (XAG) |
| **Index** | S&P 500 (SPY) |

## Features

- **Live price cards** with sparkline charts and percentage changes
- **Interactive candlestick/line charts** powered by TradingView Lightweight Charts
- **Selectable time ranges** — 1D, 5D, 1M, 3M, 6M, 1Y, 5Y
- **Category filters** — view all assets or filter by type
- **Auto-refresh** — crypto every 30s, stocks/commodities every 60s
- **Dark theme** with a clean, minimal UI

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 · Vite 7 · TypeScript |
| Styling | Tailwind CSS 4 |
| Charts | TradingView Lightweight Charts |
| Data Fetching | TanStack Query (React Query) |
| Market Data | Yahoo Finance (stocks, commodities) · CoinGecko (crypto) |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

> **Note:** Requires Node.js 20.19+ or 22.12+. Market data is fetched via Vite's dev proxy — the proxy configuration is for development only.

## Project Structure

```
src/
├── api/            # Yahoo Finance & CoinGecko API clients
├── components/     # React components (Dashboard, PriceChart, AssetCard, etc.)
├── config/         # Asset definitions & configuration
├── hooks/          # TanStack Query data hooks
├── types/          # TypeScript interfaces
└── utils/          # Formatting helpers
```

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable, production-ready |
| `develop` | Integration & testing |
| `feature/*` | Feature branches |

## License

Personal project — not intended for redistribution.
