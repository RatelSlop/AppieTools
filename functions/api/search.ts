interface Env {}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;
let pendingTokenPromise: Promise<string> | null = null;

const USER_AGENT = 'Appie/9.46.0 Android/14-API34';

async function getAhToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && cachedToken && now < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  // Check Cloudflare edge cache across isolates in this datacenter
  const cacheKey = new Request('https://appietools.hooijmaijers.me/ah-internal-token');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfCache = typeof caches !== 'undefined' && (caches as any).default ? (caches as any).default : null;

  if (forceRefresh) {
    cachedToken = null;
    tokenExpiresAt = 0;
    if (cfCache) {
      try {
        await cfCache.delete(cacheKey);
      } catch (delErr) {
        console.warn('Cache delete error:', delErr);
      }
    }
  } else if (cfCache) {
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
            'Content-Type': 'application/json; charset=UTF-8',
            'User-Agent': USER_AGENT,
            'X-Application': 'AHWEBSHOP',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ clientId: 'appie' }),
        });
      };

      let res = await doFetch();

      // If rate-limited or error, wait 500ms and retry once
      if (!res.ok) {
        await new Promise((r) => setTimeout(r, 500));
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

    if (!forceRefresh && cachedToken) {
      return cachedToken;
    }

    throw new Error('Albert Heijn authenticatieservice is tijdelijk niet bereikbaar.');
  })();

  return pendingTokenPromise;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const query = url.searchParams.get('query') || '';
  const size = url.searchParams.get('size') || '24';
  const page = url.searchParams.get('page') || '0';

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (!query.trim()) {
    return new Response(JSON.stringify({ products: [], page: { totalElements: 0 } }), {
      headers: corsHeaders,
    });
  }

  try {
    let token = await getAhToken(false);
    const trimmed = query.trim();

    // If query is an 8-14 digit barcode/GTIN, try direct GTIN lookup first
    if (/^\d{8,14}$/.test(trimmed)) {
      try {
        const gtinUrl = `https://api.ah.nl/mobile-services/product/search/v1/gtin/${trimmed}`;
        let gtinRes = await fetch(gtinUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': USER_AGENT,
            'X-Application': 'AHWEBSHOP',
            'Accept': 'application/json',
          },
        });

        if (gtinRes.status === 401 || gtinRes.status === 403) {
          token = await getAhToken(true);
          gtinRes = await fetch(gtinUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
              'User-Agent': USER_AGENT,
              'X-Application': 'AHWEBSHOP',
              'Accept': 'application/json',
            },
          });
        }

        if (gtinRes.ok) {
          const product = (await gtinRes.json()) as Record<string, unknown>;
          if (product && product.webshopId) {
            return new Response(
              JSON.stringify({
                products: [{ ...product, scannedBarcode: trimmed }],
                page: { totalElements: 1, totalPages: 1, size: 1, number: 0 },
              }),
              {
                status: 200,
                headers: {
                  ...corsHeaders,
                  'Cache-Control': 'public, max-age=86400, s-maxage=86400',
                },
              }
            );
          }
        }
      } catch (gtinErr) {
        console.warn('GTIN direct lookup failed, falling back to text search:', gtinErr);
      }
    }

    const v2Url = `https://api.ah.nl/mobile-services/product/search/v2?query=${encodeURIComponent(query)}&size=${size}&page=${page}`;
    const v1Url = `https://api.ah.nl/mobile-services/product/search/v1?query=${encodeURIComponent(query)}&size=${size}&page=${page}`;

    const executeSearch = async (url: string, currentToken: string) => {
      return await fetch(url, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'User-Agent': USER_AGENT,
          'X-Application': 'AHWEBSHOP',
          'Accept': 'application/json',
        },
      });
    };

    let ahRes = await executeSearch(v2Url, token);

    // If rate-limited (429/403) or token rejected (401), force refresh token and retry
    if (ahRes.status === 401 || ahRes.status === 403 || ahRes.status === 429) {
      token = await getAhToken(true);
      await new Promise((r) => setTimeout(r, 400));
      ahRes = await executeSearch(v2Url, token);
    }

    // If still failing with 403 or error, try fallback to v1 search endpoint
    if (!ahRes.ok) {
      console.warn(`AH v2 search responded with ${ahRes.status}, falling back to v1...`);
      try {
        const v1Res = await executeSearch(v1Url, token);
        if (v1Res.ok) {
          ahRes = v1Res;
        }
      } catch (v1Err) {
        console.warn('v1 search fallback error:', v1Err);
      }
    }

    if (!ahRes.ok) {
      console.warn(`AH API search error status: ${ahRes.status}`);
      return new Response(
        JSON.stringify({
          products: [],
          page: { totalElements: 0, size: Number(size), number: Number(page) },
          error: `Albert Heijn reageert tijdelijk niet (${ahRes.status}). Probeer het zo nog eens.`,
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

    const ahJson = (await ahRes.json()) as {
      products?: Record<string, unknown>[];
      cards?: { products?: Record<string, unknown>[] }[];
      [key: string]: unknown;
    };

    let prods = ahJson.products || [];
    if (prods.length === 0 && Array.isArray(ahJson.cards)) {
      prods = ahJson.cards.flatMap((c) => c.products || []);
    }

    // If AH returned 0 products and query is a barcode, try OpenFoodFacts to resolve the product name!
    if (prods.length === 0 && /^\d{8,14}$/.test(trimmed)) {
      try {
        const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${trimmed}.json`, {
          headers: { 'User-Agent': 'AppieTools/1.0 (info@hooijmaijers.me)' },
        });
        if (offRes.ok) {
          const offJson = (await offRes.json()) as {
            status?: number;
            product?: { product_name?: string; brands?: string };
          };
          if (offJson.status === 1 && offJson.product) {
            const brand = offJson.product.brands?.split(',')[0]?.trim() || '';
            const name = offJson.product.product_name?.trim() || '';
            const searchTerms = [brand, name].filter(Boolean).join(' ');
            if (searchTerms.length > 2) {
              const fallbackUrl = `https://api.ah.nl/mobile-services/product/search/v2?query=${encodeURIComponent(searchTerms)}&size=${size}&page=${page}`;
              const offAhRes = await executeSearch(fallbackUrl, token);
              if (offAhRes.ok) {
                const offAhData = (await offAhRes.json()) as {
                  products?: Record<string, unknown>[];
                  cards?: { products?: Record<string, unknown>[] }[];
                  [key: string]: unknown;
                };
                let offProds = offAhData.products || [];
                if (offProds.length === 0 && Array.isArray(offAhData.cards)) {
                  offProds = offAhData.cards.flatMap((c) => c.products || []);
                }
                if (offProds.length > 0) {
                  return new Response(
                    JSON.stringify({
                      ...offAhData,
                      products: offProds.map((p) => ({ ...p, scannedBarcode: trimmed })),
                    }),
                    {
                      status: 200,
                      headers: {
                        ...corsHeaders,
                        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
                      },
                    }
                  );
                }
              }
            }
          }
        }
      } catch (offErr) {
        console.warn('OpenFoodFacts fallback lookup error:', offErr);
      }
    }

    if (prods.length > 0 && /^\d{8,14}$/.test(trimmed)) {
      ahJson.products = prods.map((p) => ({ ...p, scannedBarcode: trimmed }));
    }

    return new Response(JSON.stringify(ahJson), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=300, s-maxage=300', // cache 5 mins on Cloudflare edge
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Onbekende fout';
    console.error('Unhandled search handler error:', error);
    return new Response(
      JSON.stringify({
        products: [],
        page: { totalElements: 0 },
        error: message,
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
