import React, { useState, useRef } from 'react';
import { Modal } from './Modal';
import { PrintLabelItem } from '../../types';
import { Copy, Check, Download, Upload, Link2, FileJson, AlertCircle } from 'lucide-react';

interface ShareQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: PrintLabelItem[];
  onImportQueue: (labels: PrintLabelItem[], mode: 'replace' | 'append') => void;
}

export const encodeQueueToShareUrl = (queue: PrintLabelItem[]): string => {
  try {
    // Keep payload compact by picking only necessary fields
    const compactQueue = queue.map((item) => ({
      i: item.id,
      t: item.title,
      b: item.barcode,
      q: item.quantity,
      s: item.salesUnitSize,
      a: item.articleNumber,
      p: item.price,
      u: item.imageUrl,
      ed: item.expiryDate,
      et: item.expiryType,
      db: item.dietaryBadges,
      ib: item.isBonus,
      bm: item.bonusMechanism,
    }));

    const jsonStr = JSON.stringify(compactQueue);
    // Base64 encode safely supporting UTF-8 characters
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#share=${base64}`;
  } catch (err) {
    console.warn('Encoding share URL failed:', err);
    return window.location.href;
  }
};

export const decodeShareUrlToQueue = (base64Str: string): PrintLabelItem[] | null => {
  try {
    const jsonStr = decodeURIComponent(escape(atob(base64Str)));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = JSON.parse(jsonStr) as any[];
    if (!Array.isArray(parsed)) return null;

    return parsed.map((item) => ({
      id: item.i || `shared-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: item.t || 'Product',
      barcode: item.b || '8711200431632',
      quantity: Number(item.q) || 1,
      salesUnitSize: item.s || '',
      articleNumber: item.a || '',
      price: item.p ?? null,
      imageUrl: item.u || undefined,
      expiryDate: item.ed || undefined,
      expiryType: item.et || undefined,
      dietaryBadges: item.db || undefined,
      isBonus: item.ib || undefined,
      bonusMechanism: item.bm || undefined,
    }));
  } catch (err) {
    console.warn('Decoding share URL failed:', err);
    return null;
  }
};

export const ShareQueueModal: React.FC<ShareQueueModalProps> = ({
  isOpen,
  onClose,
  queue,
  onImportQueue,
}) => {
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const shareUrl = encodeQueueToShareUrl(queue);
  const totalLabels = queue.reduce((sum, item) => sum + item.quantity, 0);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(queue, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `appietools-stickervel-${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = String(event.target?.result || '');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onImportQueue(parsed, 'replace');
          onClose();
        } else {
          setImportError('Het bestand bevat geen geldige printwachtrij.');
        }
      } catch (err) {
        setImportError('Kon het JSON bestand niet openen. Controleer het formaat.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Printwachtrij Delen & Exporteren">
      <div className="space-y-5 text-gray-900 dark:text-white">
        {/* Info summary */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 flex items-center justify-between text-xs">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              Wachtrij: {queue.length} unieke {queue.length === 1 ? 'artikel' : 'artikelen'}
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">
              In totaal {totalLabels} stickers geconfigureerd
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-ah-blue text-white">
            Klaar om te delen
          </span>
        </div>

        {/* 1. Direct Share URL */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
            <Link2 className="w-4 h-4 text-ah-blue" />
            <span>Deelbare Link</span>
          </label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Iedereen die deze link opent, krijgt direct exact dit stickervel in zijn of haar scherm te zien.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              onFocus={(e) => e.target.select()}
              className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-300 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-ah-blue hover:bg-ah-blueDark text-white'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Gekopieerd!' : 'Kopieer'}</span>
            </button>
          </div>
        </div>

        {/* 2. File Backup & Restore */}
        <div className="pt-3 border-t border-gray-100 dark:border-slate-700 space-y-3">
          <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
            <FileJson className="w-4 h-4 text-ah-blue" />
            <span>Bestand Back-up & Herstel</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Download JSON */}
            <button
              type="button"
              onClick={handleDownloadJson}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-750 text-xs font-semibold text-gray-800 dark:text-gray-200 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-ah-blue" />
              <span>Download als .JSON</span>
            </button>

            {/* Upload JSON */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-750 text-xs font-semibold text-gray-800 dark:text-gray-200 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Importeer .JSON bestand</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {importError && (
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}
        </div>

        {/* Modal Close Button */}
        <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </Modal>
  );
};
