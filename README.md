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

- **Live price cards** with lightweight SVG sparklines and percentage changes
- **Advanced interactive charts** powered by TradingView Lightweight Charts
  - Candlestick, line, and area chart modes (switchable via toolbar)
  - Volume histogram pane with green/red directional coloring
  - Technical indicators — SMA 20, SMA 50, EMA 12, Bollinger Bands
  - Crosshair OHLCV legend that follows your cursor
  - Gradient area fills for intraday views
- **Selectable time ranges** — 1D, 5D, 1M, 3M, 6M, 1Y, 5Y
- **Category filters** — view all assets or filter by type
- **Auto-refresh** — crypto every 30s, stocks/commodities every 60s
- **Error boundaries** and offline detection
- **Dark theme** with a refined, minimal UI

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 · Vite 7 · TypeScript |
| Styling | Tailwind CSS 4 |
| Charts | TradingView Lightweight Charts · Custom SVG sparklines |
| Data Fetching | TanStack Query (React Query) |
| Market Data | Yahoo Finance (stocks, commodities) · CoinGecko (crypto) |
| Production Server | Hono (with in-memory API caching) |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (with Vite proxy)
npm run dev

# Build for production
npm run build

# Run production server (Hono — includes API proxy + caching)
npm run build:server
npm start
```

> **Note:** Requires Node.js 20.19+ or 22.12+. In dev mode, Vite proxies API calls. In production, the Hono server handles proxying with in-memory caching (60s Yahoo, 30s CoinGecko).

## Project Structure

```
src/
├── api/            # Yahoo Finance & CoinGecko API clients
├── components/     # React components (Dashboard, PriceChart, AssetCard, etc.)
│   ├── PriceChart  # Advanced chart with candle/line/area, volume, indicators
│   ├── SvgSparkline # Lightweight SVG sparklines for asset cards
│   ├── ErrorBoundary # Graceful error handling with retry
│   └── ConnectionStatus # Offline detection banner
├── config/         # Asset definitions & configuration
├── hooks/          # TanStack Query data hooks
├── types/          # TypeScript interfaces
└── utils/          # Formatting helpers & technical indicators (SMA, EMA, BB)
server/
├── index.ts        # Hono production server with API proxy + caching
└── cache.ts        # In-memory TTL cache
```

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable, production-ready |
| `develop` | Integration & testing |
| `feature/*` | Feature branches |

## License

Personal project — not intended for redistribution.
