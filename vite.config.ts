import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Dev proxy plugin for Albert Heijn API during local development
function ahDevProxyPlugin(): Plugin {
  let cachedToken: string | null = null;
  let tokenExpiresAt = 0;
  let pendingTokenPromise: Promise<string> | null = null;

  async function getAhToken(): Promise<string> {
    const now = Date.now();
    if (cachedToken && now < tokenExpiresAt - 60000) {
      return cachedToken;
    }

    if (pendingTokenPromise) {
      return pendingTokenPromise;
    }

    pendingTokenPromise = (async () => {
      try {
        const res = await fetch('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Appie/8.22.3',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ clientId: 'appie' }),
        });

        if (res.ok) {
          const data = (await res.json()) as { access_token?: string; expires_in?: number };
          if (data?.access_token) {
            cachedToken = data.access_token;
            const ttlSeconds = (data.expires_in && data.expires_in > 3600) ? data.expires_in : 86400;
            tokenExpiresAt = Date.now() + ttlSeconds * 1000;
            return cachedToken;
          }
        }
      } catch (err) {
        console.warn('Dev proxy: error fetching token, using fallback:', err);
      } finally {
        pendingTokenPromise = null;
      }
      return cachedToken || FALLBACK_TOKEN;
    })();

    return pendingTokenPromise;
  }

  return {
    name: 'ah-dev-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        try {
          const url = new URL(req.url, 'http://localhost');

          if (url.pathname === '/api/search') {
            const query = url.searchParams.get('query') || '';
            const size = url.searchParams.get('size') || '24';
            const page = url.searchParams.get('page') || '0';

            const token = await getAhToken();
            const trimmed = query.trim();

            if (/^\d{8,14}$/.test(trimmed)) {
              try {
                const gtinRes = await fetch(`https://api.ah.nl/mobile-services/product/search/v1/gtin/${trimmed}`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'User-Agent': 'Appie/8.22.3',
                    'X-Application': 'AHWEBSHOP',
                    'Accept': 'application/json',
                  },
                });
                if (gtinRes.ok) {
                  const product = await gtinRes.json();
                  if (product && product.webshopId) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      products: [product],
                      page: { totalElements: 1, totalPages: 1, size: 1, number: 0 },
                    }));
                    return;
                  }
                }
              } catch (e) {
                console.warn('Dev proxy GTIN lookup failed:', e);
              }
            }

            const targetUrl = `https://api.ah.nl/mobile-services/product/search/v2?query=${encodeURIComponent(query)}&size=${size}&page=${page}`;

            const ahRes = await fetch(targetUrl, {
              headers: {
                Authorization: `Bearer ${token}`,
                'User-Agent': 'Appie/8.22.3',
                'X-Application': 'AHWEBSHOP',
                'Accept': 'application/json',
              },
            });

            const ahData = await ahRes.json();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(ahData));
            return;
          }

          if (url.pathname.startsWith('/api/product/')) {
            const parts = url.pathname.split('/');
            const productId = parts[parts.length - 1];

            const token = await getAhToken();
            const targetUrl = `https://api.ah.nl/mobile-services/product/detail/v4/fir/${encodeURIComponent(productId)}`;

            const ahRes = await fetch(targetUrl, {
              headers: {
                Authorization: `Bearer ${token}`,
                'User-Agent': 'Appie/8.22.1',
                'X-Application': 'AHWEBSHOP',
              },
            });

            const ahData = await ahRes.json();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(ahData));
            return;
          }

          next();
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: message }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ahDevProxyPlugin()],
  server: {
    port: 3000,
  },
});
