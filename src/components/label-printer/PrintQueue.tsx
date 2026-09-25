import React from 'react';
import { PrintLabelItem } from '../../types';
import { Trash2, Edit2, Plus, Minus, PlusCircle, Layers, FileText } from 'lucide-react';
import { formatEanDisplay } from '../../services/barcodeUtils';

interface PrintQueueProps {
  queue: PrintLabelItem[];
  labelsPerPage: number;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onEditItem: (item: PrintLabelItem) => void;
  onClearQueue: () => void;
  onAddManualLabel: () => void;
}

export const PrintQueue: React.FC<PrintQueueProps> = ({
  queue,
  labelsPerPage,
  onUpdateQuantity,
  onRemoveItem,
  onEditItem,
  onClearQueue,
  onAddManualLabel,
}) => {
  const totalLabels = queue.reduce((sum, item) => sum + item.quantity, 0);
  const totalPages = Math.ceil(totalLabels / labelsPerPage) || 1;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-5 mb-5 sm:mb-6 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-gray-100 dark:border-slate-700 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-ah-blueLight dark:bg-ah-blue/20 text-ah-blue flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Printwachtrij
              <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full font-semibold bg-ah-blue text-white">
                {totalLabels} {totalLabels === 1 ? 'label' : 'labels'}
              </span>
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
              {totalLabels === 0
                ? 'Nog geen labels toegevoegd'
                : `Past op ${totalPages} A4-${totalPages === 1 ? 'vel' : 'vellen'} (${labelsPerPage} per pagina)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onAddManualLabel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-medium text-ah-blue bg-ah-blueLight hover:bg-ah-blue/20 dark:bg-slate-700 dark:text-ah-blue transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Handmatig label</span>
          </button>

          {queue.length > 0 && (
            <button
              onClick={onClearQueue}
              className="flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Wissen</span>
            </button>
          )}
        </div>
      </div>

      {queue.length === 0 ? (
        <div className="py-8 text-center">
          <FileText className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            De wachtrij is leeg
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 max-w-sm mx-auto mt-1">
            Zoek hierboven een Albert Heijn product of voeg een handmatig label toe om het A4-stickervel te vullen.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-slate-700/60 mt-2">
          {queue.map((item) => (
            <div
              key={item.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-gray-50/50 dark:hover:bg-slate-750 px-2 rounded-xl transition-colors"
            >
              {/* Product Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-10 h-10 object-contain rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shrink-0 p-0.5"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-mono text-gray-400 shrink-0">
                    EAN
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {item.title}
                    </h4>
                    {item.salesUnitSize && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                        ({item.salesUnitSize})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                    <span>EAN: {formatEanDisplay(item.barcode)}</span>
                    <span>Art: {item.articleNumber || item.productId || '---'}</span>
                  </div>
                </div>
              </div>

              {/* Quantity Controls & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                {/* Quantity */}
                <div className="flex items-center border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                  <button
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    className="p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    title="Verlaag aantal"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-gray-900 dark:text-white min-w-[28px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    className="p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    title="Verhoog aantal"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Edit */}
                <button
                  onClick={() => onEditItem(item)}
                  className="p-2 text-gray-400 hover:text-ah-blue hover:bg-ah-blueLight dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="Label bewerken"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Remove */}
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                  title="Verwijder uit wachtrij"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
