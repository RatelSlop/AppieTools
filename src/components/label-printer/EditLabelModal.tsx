import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { PrintLabelItem, ExpiryType } from '../../types';
import { validateBarcode, formatEanDisplay } from '../../services/barcodeUtils';
import { Check, AlertTriangle, Calendar } from 'lucide-react';

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
  const [imageUrl, setImageUrl] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryType, setExpiryType] = useState<ExpiryType>('THT');

  useEffect(() => {
    if (label) {
      setTitle(label.title);
      setSalesUnitSize(label.salesUnitSize);
      setArticleNumber(label.articleNumber);
      setBarcode(label.barcode);
      setPrice(label.price !== null && label.price !== undefined ? String(label.price) : '');
      setImageUrl(label.imageUrl || '');
      setHasExpiry(!!label.expiryDate);
      setExpiryDate(label.expiryDate || '');
      setExpiryType(label.expiryType || 'THT');
    }
  }, [label]);

  if (!label) return null;

  const setOffsetDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const iso = d.toISOString().split('T')[0];
    setExpiryDate(iso);
    setHasExpiry(true);
  };

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
      imageUrl: imageUrl.trim() || undefined,
      expiryDate: hasExpiry && expiryDate ? expiryDate : undefined,
      expiryType: hasExpiry && expiryDate ? expiryType : undefined,
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
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              autoCorrect="off"
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
              inputMode="decimal"
              placeholder="bijv. 4.75"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ah-blue focus:outline-none"
            />
          </div>
        </div>

        {/* Product Image URL */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Productfoto URL (optioneel)
          </label>
          <div className="flex items-center gap-2">
            {imageUrl ? (
              <div className="w-10 h-10 shrink-0 rounded-lg bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 p-1 flex items-center justify-center overflow-hidden">
                <img
                  src={imageUrl}
                  alt=""
                  className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal"
                />
              </div>
            ) : null}
            <input
              type="url"
              placeholder="https://static.ah.nl/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ah-blue focus:outline-none"
            />
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                title="Afbeelding verwijderen"
              >
                Verwijder
              </button>
            )}
          </div>
        </div>

        {/* Houdbaarheid / THT Section */}
        <div className="p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-800/50 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hasExpiry}
                onChange={(e) => {
                  setHasExpiry(e.target.checked);
                  if (e.target.checked && !expiryDate) {
                    setOffsetDate(7); // Default +1 week
                  }
                }}
                className="w-4 h-4 rounded text-ah-blue focus:ring-ah-blue border-gray-300 dark:border-slate-600"
              />
              <Calendar className="w-3.5 h-3.5 text-ah-blue" />
              <span>Houdbaarheidsdatum (THT) toevoegen</span>
            </label>
            {hasExpiry && (
              <span className="text-[11px] text-gray-400">Wordt op sticker geprint</span>
            )}
          </div>

          {hasExpiry && (
            <div className="space-y-2 pt-1 border-t border-gray-200/60 dark:border-slate-700">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Label type
                  </label>
                  <select
                    value={expiryType}
                    onChange={(e) => setExpiryType(e.target.value as ExpiryType)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ah-blue focus:outline-none"
                  >
                    <option value="THT">THT (Ten minste houdbaar tot)</option>
                    <option value="TGT">TGT (Te gebruiken tot)</option>
                    <option value="Ingevroren op">Ingevroren op</option>
                    <option value="Geopend op">Geopend op</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Datum
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ah-blue focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Date Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-gray-400 mr-0.5">Snel:</span>
                {[
                  { label: '+3d', days: 3 },
                  { label: '+1w', days: 7 },
                  { label: '+2w', days: 14 },
                  { label: '+1m', days: 30 },
                  { label: '+3m', days: 90 },
                  { label: '+6m', days: 180 },
                  { label: '+1j', days: 365 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setOffsetDate(preset.days)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 hover:bg-ah-blueLight hover:text-ah-blueDark dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
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
