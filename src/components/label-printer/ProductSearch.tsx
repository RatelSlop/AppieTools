import React, { useState, useRef } from 'react';
import { Search, Loader2, Plus, Sparkles, X, AlertCircle } from 'lucide-react';
import { AhProductCard, PrintLabelItem } from '../../types';
import { searchAhProducts, createLabelFromProduct } from '../../services/ahApi';

interface ProductSearchProps {
  onAddLabel: (label: PrintLabelItem) => void;
}

const QUICK_SEARCH_EXAMPLES = [
  'Calvé Pindakaas',
  'AH Halfvolle melk',
  'AH Zaanse mayonaise',
  'AH Scharreleieren',
  'Coca-Cola Regular',
  'Robijn Wasmiddel',
];

export const ProductSearch: React.FC<ProductSearchProps> = ({ onAddLabel }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [results, setResults] = useState<AhProductCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceTimeout = useRef<number | null>(null);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setIsLoading(false);
      setHasSearched(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await searchAhProducts(searchTerm, 0, 16);
      setResults(response.products || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Er is een fout opgetreden bij het zoeken.';
      setError(msg);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceTimeout.current) {
      window.clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = window.setTimeout(() => {
      performSearch(val);
    }, 400);
  };

  const handleAdd = async (product: AhProductCard) => {
    setAddingId(product.webshopId);
    try {
      const label = await createLabelFromProduct(product);
      onAddLabel(label);
    } catch (e) {
      console.error('Fout bij toevoegen van productlabel:', e);
    } finally {
      setAddingId(null);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setError(null);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-5 mb-5 sm:mb-6 transition-colors">
      <div className="mb-3 sm:mb-4">
        <label htmlFor="ah-search-input" className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
          Albert Heijn Product Zoeken
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            {isLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-ah-blue" /> : <Search className="w-4 h-4 sm:w-5 sm:h-5" />}
          </div>
          <input
            id="ah-search-input"
            type="text"
            value={query}
            onChange={handleInputChange}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Typ een productnaam, merk, artikelnummer of streepjescode..."
            className="w-full pl-10 sm:pl-11 pr-10 py-2.5 sm:py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ah-blue focus:border-transparent text-xs sm:text-sm transition-all shadow-inner"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick suggestions if no query */}
      {!query && (
        <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mr-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-ah-blue" />
            <span className="hidden sm:inline">Suggesties:</span>
          </span>
          {QUICK_SEARCH_EXAMPLES.map((example) => (
            <button
              key={example}
              onClick={() => {
                setQuery(example);
                performSearch(example);
              }}
              className="text-[11px] sm:text-xs px-2.5 py-1 rounded-full bg-gray-100 hover:bg-ah-blueLight hover:text-ah-blueDark dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600 transition-colors shrink-0 whitespace-nowrap"
            >
              {example}
            </button>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => performSearch(query)}
            className="ml-auto underline font-medium hover:text-red-800"
          >
            Opnieuw proberen
          </button>
        </div>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3 text-xs text-gray-500 dark:text-gray-400">
            <span>Gevonden producten: {results.length}</span>
            <span>Klik op toevoegen om in de printwachtrij te plaatsen</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {results.map((product) => {
              const isAdding = addingId === product.webshopId;
              const imageUrl = product.images?.[0]?.url;
              const price = product.currentPrice ?? product.priceBeforeBonus;

              return (
                <div
                  key={product.webshopId}
                  className="group relative flex flex-col justify-between p-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-ah-blue dark:hover:border-ah-blue bg-white dark:bg-slate-900 transition-all shadow-sm hover:shadow"
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 shrink-0 bg-gray-50 dark:bg-slate-800 rounded-lg p-1 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-slate-750">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.title}
                          className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal"
                          loading="lazy"
                        />
                      ) : (
                        <div className="text-[10px] text-gray-400">Geen foto</div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                        {product.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {product.salesUnitSize || 'Per stuk'}
                      </p>
                      {price !== undefined && price !== null && (
                        <p className="text-xs font-bold text-gray-900 dark:text-white mt-1">
                          €{Number(price).toFixed(2).replace('.', ',')}
                          {product.isBonus && (
                            <span className="ml-1.5 text-[10px] font-semibold text-ah-orange">
                              Bonus
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Add button */}
                  <button
                    onClick={() => handleAdd(product)}
                    disabled={isAdding}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-ah-blue hover:bg-ah-blueDark text-white shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Barcode ophalen...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Voeg toe aan wachtrij</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No results message */}
      {hasSearched && !isLoading && results.length === 0 && !error && (
        <div className="mt-4 p-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Geen producten gevonden voor <span className="font-semibold text-gray-700 dark:text-gray-300">"{query}"</span>. Probeer een andere term of voeg een handmatig label toe.
        </div>
      )}
    </div>
  );
};
