interface Env {}

// Known valid anonymous token as resilient fallback (AH anonymous tokens are valid for 7 days)
const FALLBACK_TOKEN = '399821673_9fd-45db-bc82-cae4043811ff';
let cachedToken: string = FALLBACK_TOKEN;
let tokenExpiresAt = Date.now() + 86400 * 1000 * 6; // Valid for ~6 days
let pendingTokenPromise: Promise<string> | null = null;

const USER_AGENT = 'Appie/8.22.3';

async function getAhToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && cachedToken && now < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  // Deduplicate concurrent token requests in the same worker
  if (pendingTokenPromise) {
    return pendingTokenPromise;
  }

  pendingTokenPromise = (async () => {
    try {
      const res = await fetch('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT,
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
      console.warn(`AH token endpoint responded with status ${res.status}. Falling back to cached token.`);
    } catch (err) {
      console.warn('Network error while requesting AH token. Falling back to cached token:', err);
    } finally {
      pendingTokenPromise = null;
    }

    return cachedToken || FALLBACK_TOKEN;
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

    // Only refresh token if AH specifically rejects with 401 Unauthorized (expired token)
    if (ahRes.status === 401) {
      console.warn(`AH API returned 401 for product ${productId}, refreshing token...`);
      token = await getAhToken(true);
      ahRes = await fetch(targetUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': USER_AGENT,
          'X-Application': 'AHWEBSHOP',
          'Accept': 'application/json',
        },
      });
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
    const message = error instanceof Error ? error.message : 'Unknown error';
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
