import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { PrintLabelItem } from '../../types';
import { validateBarcode, formatEanDisplay } from '../../services/barcodeUtils';
import { Check, AlertTriangle } from 'lucide-react';

interface EditLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  label: PrintLabelItem | null;
  onSave: (updated: PrintLabelItem) => void;
}

export const EditLabelModal: React.FC<EditLabelModalProps> = ({
  isOpen,
  onClose,
  label,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [salesUnitSize, setSalesUnitSize] = useState('');
  const [articleNumber, setArticleNumber] = useState('');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState<string>('');

  useEffect(() => {
    if (label) {
      setTitle(label.title);
      setSalesUnitSize(label.salesUnitSize);
      setArticleNumber(label.articleNumber);
      setBarcode(label.barcode);
      setPrice(label.price !== null && label.price !== undefined ? String(label.price) : '');
    }
  }, [label]);

  if (!label) return null;

  const cleanBarcode = barcode.replace(/\D/g, '');
  const barcodeType = cleanBarcode.length <= 8 ? 'EAN8' : 'EAN13';
  const validation = validateBarcode(cleanBarcode, barcodeType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...label,
      title: title.trim(),
      salesUnitSize: salesUnitSize.trim(),
      articleNumber: articleNumber.trim(),
      barcode: cleanBarcode,
      price: price ? parseFloat(price.replace(',', '.')) : null,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Productlabel Aanpassen">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Productnaam / Omschrijving
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ah-blue focus:outline-none"
          />
        </div>

        {/* Sales Unit & Article Number */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Inhoud / Gewicht
            </label>
            <input
              type="text"
              placeholder="bijv. 650 g of 1L"
              value={salesUnitSize}
              onChange={(e) => setSalesUnitSize(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ah-blue focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Artikelnummer
            </label>
            <input
              type="text"
              placeholder="bijv. 815481"
              value={articleNumber}
              onChange={(e) => setArticleNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ah-blue focus:outline-none"
            />
          </div>
        </div>

        {/* Barcode & Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              EAN Streepjescode
            </label>
            <input
              type="text"
              required
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="13 of 8 cijfers"
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ah-blue focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Prijs (€, optioneel)
            </label>
            <input
              type="text"
              placeholder="bijv. 4.75"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ah-blue focus:outline-none"
            />
          </div>
        </div>

        {/* Validation feedback */}
        <div className="text-xs">
          {validation.isValid ? (
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              <span>Geldige barcode: {formatEanDisplay(cleanBarcode)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{validation.errorMessage}</span>
              {validation.expectedCheckDigit !== undefined && (
                <button
                  type="button"
                  onClick={() => {
                    const prefix = cleanBarcode.length >= 12 ? cleanBarcode.slice(0, 12) : cleanBarcode.slice(0, 7);
                    setBarcode(prefix + validation.expectedCheckDigit);
                  }}
                  className="ml-1 underline font-semibold hover:text-amber-700"
                >
                  Herstel check-digit
                </button>
              )}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            Annuleren
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-ah-blue hover:bg-ah-blueDark text-white shadow-sm transition-colors"
          >
            Opslaan
          </button>
        </div>
      </form>
    </Modal>
  );
};
