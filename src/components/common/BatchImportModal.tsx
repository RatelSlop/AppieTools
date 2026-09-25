import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, CheckCircle2, AlertTriangle, FileText, Plus, Sparkles } from 'lucide-react';
import { PrintLabelItem } from '../../types';
import { searchAhProducts, createLabelFromProduct } from '../../services/ahApi';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLabels: (labels: PrintLabelItem[]) => void;
}

interface BatchItemResult {
  query: string;
  status: 'pending' | 'success' | 'not_found' | 'error';
  label?: PrintLabelItem;
  error?: string;
}

const SAMPLE_BATCH_INPUT = `8711200431632
AH Halfvolle melk
8710400000000
Coca-Cola Regular 330ml
AH Zaanse mayonaise`;

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  onAddLabels,
}) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<BatchItemResult[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      setInputText(content);
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const handleStartImport = async () => {
    const lines = inputText
      .split(/[\r\n,;]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    setIsProcessing(true);
    setResults(lines.map((q) => ({ query: q, status: 'pending' })));

    const processedResults: BatchItemResult[] = [];
    const successfulLabels: PrintLabelItem[] = [];

    for (let i = 0; i < lines.length; i++) {
      setCurrentIndex(i + 1);
      const query = lines[i];

      try {
        // Small interval between requests to be gentle to the API proxy
        if (i > 0) {
          await new Promise((r) => setTimeout(r, 250));
        }

        const searchRes = await searchAhProducts(query, 0, 1);
        const product = searchRes.products?.[0];

        if (product) {
          const label = await createLabelFromProduct(product);
          successfulLabels.push(label);
          processedResults.push({
            query,
            status: 'success',
            label,
          });
        } else {
          processedResults.push({
            query,
            status: 'not_found',
            error: 'Geen product gevonden',
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Fout bij opzoeken';
        processedResults.push({
          query,
          status: 'error',
          error: msg,
        });
      }

      setResults([...processedResults]);
    }

    setIsProcessing(false);
  };

  const handleAddAllToQueue = () => {
    if (!results) return;
    const foundLabels = results
      .filter((r) => r.status === 'success' && r.label)
      .map((r) => r.label!);

    if (foundLabels.length > 0) {
      onAddLabels(foundLabels);
      handleClose();
    }
  };

  const handleClose = () => {
    setInputText('');
    setResults(null);
    setIsProcessing(false);
    onClose();
  };

  const linesCount = inputText
    .split(/[\r\n,;]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0).length;

  const successCount = results?.filter((r) => r.status === 'success').length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-ah-blueLight dark:bg-slate-800 text-ah-blue">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Batch Producten Importeren
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Voeg meerdere artikelen tegelijk toe aan de printwachtrij via een lijst of CSV
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isProcessing}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {!results ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="batch-input-textarea" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Plak barcodes of productnamen (1 per regel):
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInputText(SAMPLE_BATCH_INPUT)}
                      className="text-xs text-ah-blue hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Voorbeeld invoegen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Bestand (.csv/.txt)</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <textarea
                  id="batch-input-textarea"
                  rows={8}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Typ of plak hier streepjescodes of namen, bijv.:&#10;8711200431632&#10;Calvé Pindakaas&#10;8710400000000&#10;AH Halfvolle melk"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 font-mono text-xs focus:ring-2 focus:ring-ah-blue focus:outline-none transition-all resize-y"
                />

                <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Aantal herkende regels: <strong>{linesCount}</strong></span>
                  <span>Ondersteunt GTIN-13, EAN-8 en zoektermen</span>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Progress Bar */}
              {isProcessing && (
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                  <div className="flex items-center justify-between text-xs font-semibold text-ah-blue mb-2">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Artikelen opzoeken bij Albert Heijn...
                    </span>
                    <span>
                      {currentIndex} / {results.length}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-blue-200 dark:bg-blue-900 overflow-hidden">
                    <div
                      className="h-full bg-ah-blue transition-all duration-300"
                      style={{ width: `${(currentIndex / results.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Results List */}
              <div className="border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[360px] overflow-y-auto">
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {results.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.status === 'pending' && (
                          <Loader2 className="w-4 h-4 text-gray-400 animate-spin shrink-0" />
                        )}
                        {item.status === 'success' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                        {item.status === 'not_found' && (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        {item.status === 'error' && (
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}

                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {item.label ? item.label.title : item.query}
                          </p>
                          <p className="text-[11px] text-gray-400 font-mono">
                            {item.label ? `Barcode: ${item.label.barcode}` : `Zoekterm: "${item.query}"`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {item.status === 'success' && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            Gevonden
                          </span>
                        )}
                        {item.status === 'not_found' && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                            Niet gevonden
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                            Fout
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          {!results ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 font-semibold"
              >
                Annuleren
              </button>

              <button
                type="button"
                onClick={handleStartImport}
                disabled={linesCount === 0 || isProcessing}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-ah-blue hover:bg-ah-blueDark text-white font-semibold shadow-md transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Start Import ({linesCount} artikelen)</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setResults(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 font-semibold disabled:opacity-50"
              >
                Opnieuw invoeren
              </button>

              <button
                type="button"
                onClick={handleAddAllToQueue}
                disabled={isProcessing || successCount === 0}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Voeg {successCount} labels toe aan wachtrij</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
