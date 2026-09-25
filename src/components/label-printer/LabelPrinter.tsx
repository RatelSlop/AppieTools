import React, { useState } from 'react';
import { PrintLabelItem, SheetTemplate } from '../../types';
import { DEFAULT_TEMPLATE } from '../../services/printTemplates';
import { ProductSearch } from './ProductSearch';
import { PrintQueue } from './PrintQueue';
import { SheetConfigurator } from './SheetConfigurator';
import { A4SheetPreview } from './A4SheetPreview';
import { EditLabelModal } from './EditLabelModal';
import { Printer } from 'lucide-react';

interface LabelPrinterProps {
  queue: PrintLabelItem[];
  setQueue: React.Dispatch<React.SetStateAction<PrintLabelItem[]>>;
  onAddLabel: (label: PrintLabelItem) => void;
}

export const LabelPrinter: React.FC<LabelPrinterProps> = ({
  queue,
  setQueue,
  onAddLabel,
}) => {
  const [template, setTemplate] = useState<SheetTemplate>(DEFAULT_TEMPLATE);
  const [showCutLines, setShowCutLines] = useState<boolean>(true);
  const [showProductImage, setShowProductImage] = useState<boolean>(true);
  const [startOffset, setStartOffset] = useState<number>(0);
  const [editingItem, setEditingItem] = useState<PrintLabelItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleUpdateQuantity = (id: string, delta: number) => {
    setQueue((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is PrintLabelItem => item !== null)
    );
  };

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearQueue = () => {
    if (window.confirm('Weet je zeker dat je alle labels uit de wachtrij wilt verwijderen?')) {
      setQueue([]);
    }
  };

  const handleEditItem = (item: PrintLabelItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedItem = (updated: PrintLabelItem) => {
    setQueue((prev) => {
      const exists = prev.some((i) => i.id === updated.id);
      if (exists) {
        return prev.map((item) => (item.id === updated.id ? updated : item));
      }
      return [updated, ...prev];
    });
  };

  const handleAddManualLabel = () => {
    const newManualItem: PrintLabelItem = {
      id: `manual-${Date.now()}`,
      title: 'Vervangend Albert Heijn Product',
      salesUnitSize: 'Stuk',
      articleNumber: '123456',
      barcode: '8711200431632',
      price: null,
      quantity: 1,
    };
    setEditingItem(newManualItem);
    setIsEditModalOpen(true);
  };

  const handleAddMultipleLabels = (newLabels: PrintLabelItem[]) => {
    setQueue((prev) => [...prev, ...newLabels]);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalLabels = queue.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-5 sm:space-y-6 pb-16 sm:pb-0">
      <div className="no-print space-y-6">
        {/* 1. AH Product Zoeken */}
        <ProductSearch onAddLabel={onAddLabel} />

        {/* 2. Printwachtrij */}
        <PrintQueue
          queue={queue}
          labelsPerPage={template.labelsPerPage}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onEditItem={handleEditItem}
          onClearQueue={handleClearQueue}
          onAddManualLabel={handleAddManualLabel}
          onAddMultipleLabels={handleAddMultipleLabels}
        />

        {/* 3. A4 & Vel Configurator */}
        <SheetConfigurator
          selectedTemplate={template}
          onSelectTemplate={setTemplate}
          showCutLines={showCutLines}
          onToggleCutLines={setShowCutLines}
          showProductImage={showProductImage}
          onToggleProductImage={setShowProductImage}
          startOffset={startOffset}
          onUpdateStartOffset={setStartOffset}
          onPrint={handlePrint}
          totalLabels={totalLabels}
        />
      </div>

      {/* 4. Live A4 Voorbeeld & Print weergave */}
      <A4SheetPreview
        queue={queue}
        template={template}
        showCutLines={showCutLines}
        showProductImage={showProductImage}
        startOffset={startOffset}
      />

      {/* Bewerk Modal */}
      <EditLabelModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        label={editingItem}
        onSave={handleSaveEditedItem}
      />

      {/* Mobile Floating Print Bar */}
      {totalLabels > 0 && (
        <div className="no-print sm:hidden fixed bottom-0 left-0 right-0 z-30 px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 shadow-2xl flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-gray-900 dark:text-white">
              {totalLabels} {totalLabels === 1 ? 'label' : 'labels'} gereed
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              A4 stickervel
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs bg-ah-blue hover:bg-ah-blueDark text-white shadow-md shadow-ah-blue/30 active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Afdrukken</span>
          </button>
        </div>
      )}
    </div>
  );
};
