interface Env {}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;
let pendingTokenPromise: Promise<string> | null = null;

const USER_AGENT = 'Appie/8.22.3';

async function getAhToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && cachedToken && now < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  // Check Cloudflare edge cache across isolates in this datacenter
  const cacheKey = new Request('https://appietools.hooijmaijers.me/ah-internal-token');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfCache = typeof caches !== 'undefined' && (caches as any).default ? (caches as any).default : null;

  if (!forceRefresh && cfCache) {
    try {
      const match = await cfCache.match(cacheKey);
      if (match) {
        const text = await match.text();
          const tokenStr = text.trim();
          cachedToken = tokenStr;
          tokenExpiresAt = Date.now() + 43200 * 1000;
          return tokenStr;
      }
    } catch (e) {
      console.warn('Cache match error:', e);
    }
  }

  // Deduplicate concurrent token requests in the same worker isolate
  if (pendingTokenPromise) {
    return pendingTokenPromise;
  }

  pendingTokenPromise = (async () => {
    try {
      const doFetch = async () => {
        return await fetch('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': USER_AGENT,
            'Accept': 'application/json',
          },
          body: JSON.stringify({ clientId: 'appie' }),
        });
      };

      let res = await doFetch();

      // If rate-limited or error, wait 400ms and retry once
      if (!res.ok) {
        await new Promise((r) => setTimeout(r, 400));
        res = await doFetch();
      }

      if (res.ok) {
        const data = (await res.json()) as { access_token?: string; expires_in?: number };
        if (data?.access_token) {
          cachedToken = data.access_token;
          const ttlSeconds = (data.expires_in && data.expires_in > 3600) ? Math.min(data.expires_in, 86400) : 43200;
          tokenExpiresAt = Date.now() + ttlSeconds * 1000;

          // Store in Cloudflare Cache API for other isolates
          if (cfCache) {
            try {
              const cacheRes = new Response(data.access_token, {
                headers: {
                  'Cache-Control': `public, max-age=${ttlSeconds}`,
                },
              });
              await cfCache.put(cacheKey, cacheRes);
            } catch (cacheErr) {
              console.warn('Cache put error:', cacheErr);
            }
          }

          return cachedToken;
        }
      }
      console.warn(`AH token endpoint responded with status ${res.status}`);
    } catch (err) {
      console.warn('Network error while requesting AH token:', err);
    } finally {
      pendingTokenPromise = null;
    }

    if (cachedToken) {
      return cachedToken;
    }

    throw new Error('Albert Heijn authenticatieservice is tijdelijk niet bereikbaar.');
  })();

  return pendingTokenPromise;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const productId = context.params.id as string;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (!productId) {
    return new Response(JSON.stringify({ error: 'Missing product ID' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const targetUrl = `https://api.ah.nl/mobile-services/product/detail/v4/fir/${encodeURIComponent(productId)}`;

  try {
    let token = await getAhToken(false);

    let ahRes = await fetch(targetUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': USER_AGENT,
        'X-Application': 'AHWEBSHOP',
        'Accept': 'application/json',
      },
    });

    // If rate-limited (429/403) or token rejected (401), back off and retry
    if (ahRes.status === 401 || ahRes.status === 403 || ahRes.status === 429) {
      if (ahRes.status === 401) {
        token = await getAhToken(true);
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }

      ahRes = await fetch(targetUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': USER_AGENT,
          'X-Application': 'AHWEBSHOP',
          'Accept': 'application/json',
        },
      });

      if (ahRes.status === 403) {
        token = await getAhToken(true);
        await new Promise((r) => setTimeout(r, 300));
        ahRes = await fetch(targetUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': USER_AGENT,
            'X-Application': 'AHWEBSHOP',
            'Accept': 'application/json',
          },
        });
      }
    }

    if (!ahRes.ok) {
      console.warn(`AH product detail returned status ${ahRes.status} for ${productId}`);
      return new Response(
        JSON.stringify({
          error: `Product detail niet beschikbaar (${ahRes.status})`,
          extractedGtin: null,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    const ahData = (await ahRes.json()) as {
      productId?: number;
      productCard?: Record<string, unknown>;
      tradeItem?: {
        gtin?: string;
        gln?: string;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };

    // Extract GTIN/EAN cleanly
    let gtin: string | null = null;
    if (ahData.tradeItem?.gtin) {
      gtin = String(ahData.tradeItem.gtin);
      if (gtin.length === 14 && gtin.startsWith('0')) {
        gtin = gtin.substring(1);
      }
    }

    return new Response(
      JSON.stringify({
        ...ahData,
        extractedGtin: gtin,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=86400, s-maxage=86400', // cache 24h on Cloudflare edge
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Onbekende fout';
    return new Response(
      JSON.stringify({
        error: `Fout bij ophalen product: ${message}`,
        extractedGtin: null,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  }
};

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
