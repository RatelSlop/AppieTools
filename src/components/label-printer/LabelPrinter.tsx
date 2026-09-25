import React, { useState } from 'react';
import { PrintLabelItem, SheetTemplate } from '../../types';
import { DEFAULT_TEMPLATE } from '../../services/printTemplates';
import { ProductSearch } from './ProductSearch';
import { PrintQueue } from './PrintQueue';
import { SheetConfigurator } from './SheetConfigurator';
import { A4SheetPreview } from './A4SheetPreview';
import { EditLabelModal } from './EditLabelModal';

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

  const handlePrint = () => {
    window.print();
  };

  const totalLabels = queue.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
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
        />

        {/* 3. A4 & Vel Configurator */}
        <SheetConfigurator
          selectedTemplate={template}
          onSelectTemplate={setTemplate}
          showCutLines={showCutLines}
          onToggleCutLines={setShowCutLines}
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
        startOffset={startOffset}
      />

      {/* Bewerk Modal */}
      <EditLabelModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        label={editingItem}
        onSave={handleSaveEditedItem}
      />
    </div>
  );
};
