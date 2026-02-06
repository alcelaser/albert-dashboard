import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { logger } from 'hono/logger';
import { cache } from './cache.js';

const app = new Hono();

app.use('*', logger());

// ─── API Proxy: Yahoo Finance ───────────────────────────────────────────────
app.get('/api/yahoo/*', async (c) => {
  const upstreamPath = c.req.path.replace('/api/yahoo', '');
  const query = c.req.query();
  const qs = new URLSearchParams(query).toString();
  const url = `https://query1.finance.yahoo.com${upstreamPath}${qs ? `?${qs}` : ''}`;

  const cacheKey = `yahoo:${upstreamPath}?${qs}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return c.json(cached);
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[yahoo] ${res.status} ${upstreamPath}: ${text.slice(0, 200)}`);
      return c.text(text, res.status as 400);
    }

    const data = await res.json();
    cache.set(cacheKey, data, 60); // cache 60s
    return c.json(data);
  } catch (err) {
    console.error(`[yahoo] Error:`, err);
    return c.text('Upstream error', 502);
  }
});

// ─── API Proxy: CoinGecko ───────────────────────────────────────────────────
app.get('/api/coingecko/*', async (c) => {
  const upstreamPath = c.req.path.replace('/api/coingecko', '');
  const query = c.req.query();
  const qs = new URLSearchParams(query).toString();
  const url = `https://api.coingecko.com${upstreamPath}${qs ? `?${qs}` : ''}`;

  const cacheKey = `coingecko:${upstreamPath}?${qs}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return c.json(cached);
  }

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      console.error(`[coingecko] ${res.status} ${upstreamPath}: ${text.slice(0, 200)}`);
      return c.text(text, res.status as 400);
    }

    const data = await res.json();
    cache.set(cacheKey, data, 30); // cache 30s (crypto moves fast)
    return c.json(data);
  } catch (err) {
    console.error(`[coingecko] Error:`, err);
    return c.text('Upstream error', 502);
  }
});

// ─── Static files (production build) ────────────────────────────────────────
app.use('/*', serveStatic({ root: './dist' }));

// SPA fallback — serve index.html for any non-API, non-static route
app.get('*', serveStatic({ root: './dist', path: 'index.html' }));

// ─── Start ──────────────────────────────────────────────────────────────────
const port = parseInt(process.env['PORT'] || '3000', 10);

serve({ fetch: app.fetch, port }, () => {
  console.log(`\n  📊 Albert Dashboard`);
  console.log(`  ➜  http://localhost:${port}\n`);
});
