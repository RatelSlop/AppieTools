interface Env {}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAhToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const res = await fetch('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Appie/8.22.1',
    },
    body: JSON.stringify({ clientId: 'appie' }),
  });

  if (!res.ok) {
    throw new Error(`Failed to obtain AH auth token: ${res.statusText}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  return cachedToken;
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

  try {
    const token = await getAhToken();
    const targetUrl = `https://api.ah.nl/mobile-services/product/detail/v4/fir/${encodeURIComponent(productId)}`;

    const ahRes = await fetch(targetUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Appie/8.22.1',
        'X-Application': 'AHWEBSHOP',
      },
    });

    if (!ahRes.ok) {
      return new Response(
        JSON.stringify({ error: `AH API returned status ${ahRes.status}` }),
        { status: ahRes.status, headers: corsHeaders }
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
      // Remove leading zeros if it's 14 digits GTIN-14 to get standard 13-digit EAN
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
          'Cache-Control': 'public, max-age=86400', // cache 24h for details
        },
      }
    );
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
