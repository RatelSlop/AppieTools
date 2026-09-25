import { AhProductCard, AhSearchResult, PrintLabelItem } from '../types';

/**
 * Searches for Albert Heijn products using the API proxy with auto-retry and AbortSignal.
 */
export async function searchAhProducts(
  query: string,
  page = 0,
  size = 20,
  retryCount = 0,
  signal?: AbortSignal
): Promise<AhSearchResult> {
  if (!query.trim()) {
    return { products: [], page: { size, totalElements: 0, totalPages: 0, number: 0 } };
  }

  try {
    const res = await fetch(
      `/api/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`,
      { signal }
    );

    // If forbidden, unauthorized or rate limited, auto-retry up to 2 times after exponential delay
    if ((res.status === 401 || res.status === 403 || res.status === 429) && retryCount < 2) {
      await new Promise((r) => setTimeout(r, (retryCount + 1) * 600));
      return searchAhProducts(query, page, size, retryCount + 1, signal);
    }

    if (!res.ok) {
      try {
        const errJson = (await res.json()) as { error?: string };
        if (errJson?.error) {
          throw new Error(errJson.error);
        }
      } catch (parseErr) {
        if (parseErr instanceof Error && !parseErr.message.startsWith('Zoekopdracht mislukt')) {
          throw parseErr;
        }
      }
      throw new Error(`Albert Heijn reageert tijdelijk niet (${res.status}). Probeer het over een ogenblik opnieuw.`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();

    if (data.error && (!data.products || data.products.length === 0)) {
      if (retryCount < 2 && (data.error.includes('403') || data.error.includes('401') || data.error.includes('429'))) {
        await new Promise((r) => setTimeout(r, (retryCount + 1) * 700));
        return searchAhProducts(query, page, size, retryCount + 1, signal);
      }
      throw new Error(data.error);
    }

    // In some AH responses, products are in `cards` or `products`
    let products: AhProductCard[] = [];
    if (Array.isArray(data.products)) {
      products = data.products;
    } else if (Array.isArray(data.cards)) {
      products = data.cards
        .filter((c: { type?: string }) => c.type === 'product')
        .flatMap((c: { products?: AhProductCard[] }) => c.products || []);
    }

    return {
      products,
      page: data.page || {
        size,
        totalElements: products.length,
        totalPages: Math.ceil(products.length / size),
        number: page,
      },
    };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    console.error('Fout bij zoeken naar AH producten:', err);
    throw err;
  }
}

/**
 * Fetches product detail to extract the official 13-digit EAN (GTIN) with auto-retry.
 */
export async function getProductGtin(webshopId: number, isRetry = false): Promise<string | null> {
  try {
    const res = await fetch(`/api/product/${webshopId}`);

    if ((res.status === 401 || res.status === 403) && !isRetry) {
      await new Promise((r) => setTimeout(r, 600));
      return getProductGtin(webshopId, true);
    }

    if (!res.ok) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();

    if (data.extractedGtin) {
      return data.extractedGtin;
    }

    if (data.tradeItem?.gtin) {
      let g = String(data.tradeItem.gtin);
      if (g.length === 14 && g.startsWith('0')) {
        g = g.substring(1);
      }
      return g;
    }

    return null;
  } catch (err) {
    console.warn(`Kon GTIN niet ophalen voor product ${webshopId}:`, err);
    return null;
  }
}

/**
 * Converts an AH product card into a PrintLabelItem ready for the print queue.
 */
export async function createLabelFromProduct(product: AhProductCard): Promise<PrintLabelItem> {
  // Fetch official GTIN
  const gtin = await getProductGtin(product.webshopId);

  // If GTIN is not found in detail, generate a fallback or pseudo-EAN based on webshopId
  const barcode = gtin || String(product.webshopId).padStart(13, '0');

  // Find suitable product image
  const imgUrl = product.images?.[0]?.url || '';

  return {
    id: `ah-${product.webshopId}-${Date.now()}`,
    productId: product.webshopId,
    title: product.title,
    salesUnitSize: product.salesUnitSize || '',
    articleNumber: String(product.hqId || product.webshopId),
    barcode,
    price: product.currentPrice ?? product.priceBeforeBonus ?? null,
    quantity: 1,
    imageUrl: imgUrl,
  };
}
