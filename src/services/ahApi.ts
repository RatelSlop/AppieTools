import { AhProductCard, AhSearchResult, PrintLabelItem } from '../types';

/**
 * Searches for Albert Heijn products using the API proxy.
 */
export async function searchAhProducts(query: string, page = 0, size = 20): Promise<AhSearchResult> {
  if (!query.trim()) {
    return { products: [], page: { size, totalElements: 0, totalPages: 0, number: 0 } };
  }

  try {
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`);
    if (!res.ok) {
      throw new Error(`Zoekopdracht mislukt (status: ${res.status})`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();

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
    console.error('Fout bij zoeken naar AH producten:', err);
    throw err;
  }
}

/**
 * Fetches product detail to extract the official 13-digit EAN (GTIN).
 */
export async function getProductGtin(webshopId: number): Promise<string | null> {
  try {
    const res = await fetch(`/api/product/${webshopId}`);
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
