interface Env {}

// Cache token in worker memory between requests
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

const USER_AGENT = 'Appie/8.81.1 (nl.ah.appie; Android 14)';

async function getAhToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && cachedToken && now < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const res = await fetch('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    },
    body: JSON.stringify({ clientId: 'appie' }),
  });

  if (!res.ok) {
    cachedToken = null;
    tokenExpiresAt = 0;
    throw new Error(`Failed to obtain AH auth token: ${res.statusText}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  // Cache for at most 15 minutes (900 seconds) to avoid stale tokens
  const ttlSeconds = Math.min(data.expires_in || 900, 900);
  tokenExpiresAt = Date.now() + ttlSeconds * 1000;
  return cachedToken;
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

  const targetUrl = `https://api.ah.nl/mobile-services/product/search/v2?query=${encodeURIComponent(query)}&size=${size}&page=${page}`;

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

    // If token is rejected (401 or 403), force refresh and retry once automatically
    if (ahRes.status === 401 || ahRes.status === 403) {
      console.warn(`AH API returned ${ahRes.status}, refreshing token and retrying...`);
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
      return new Response(
        JSON.stringify({
          error: `AH API returned status ${ahRes.status}`,
          status: ahRes.status,
        }),
        { status: ahRes.status, headers: corsHeaders }
      );
    }

    const ahData = await ahRes.text();
    return new Response(ahData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=180', // cache 3 mins
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: corsHeaders,
    });
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
