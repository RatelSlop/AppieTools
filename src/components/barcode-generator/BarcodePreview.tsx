import React, { useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import { Download, Copy, Check, Plus, AlertTriangle } from 'lucide-react';
import { BarcodeType, PrintLabelItem } from '../../types';
import { validateBarcode } from '../../services/barcodeUtils';

interface BarcodePreviewProps {
  code: string;
  type: BarcodeType;
  labelText?: string;
  barWidth: number;
  barHeight: number;
  displayValue: boolean;
  onAddToQueue: (label: PrintLabelItem) => void;
}

export const BarcodePreview: React.FC<BarcodePreviewProps> = ({
  code,
  type,
  labelText,
  barWidth,
  barHeight,
  displayValue,
  onAddToQueue,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [added, setAdded] = React.useState(false);

  const cleanCode = code.replace(/\D/g, '');
  const validation = validateBarcode(cleanCode, type);

  useEffect(() => {
    if (!svgRef.current || !validation.isValid) return;

    try {
      JsBarcode(svgRef.current, cleanCode, {
        format: type,
        width: barWidth,
        height: barHeight,
        displayValue: displayValue,
        fontSize: 14,
        font: 'monospace',
        textMargin: 2,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000',
      });
    } catch (e) {
      console.warn('JsBarcode render error:', e);
    }
  }, [cleanCode, type, barWidth, barHeight, displayValue, validation.isValid]);

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `barcode-${cleanCode}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    if (!svgRef.current) return;

    const svgElement = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // High resolution scaling (2x)
    const scale = 2;
    const rect = svgElement.getBoundingClientRect();
    canvas.width = (rect.width || 300) * scale;
    canvas.height = (rect.height || 150) * scale;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const a = document.createElement('a');
        a.download = `barcode-${cleanCode}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTransferToQueue = () => {
    if (!validation.isValid) return;

    const newItem: PrintLabelItem = {
      id: `custom-barcode-${Date.now()}`,
      title: labelText || `Barcode ${type}`,
      salesUnitSize: 'Stuk',
      articleNumber: cleanCode.slice(-6),
      barcode: cleanCode,
      price: null,
      quantity: 1,
    };

    onAddToQueue(newItem);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 transition-colors">
      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
        Barcode Voorbeeld & Export
      </h3>

      {/* Preview Card */}
      <div className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[220px]">
        {validation.isValid ? (
          <div className="bg-white p-4 rounded-xl shadow-md flex flex-col items-center">
            {labelText && (
              <p className="text-xs font-bold text-gray-900 tracking-tight text-center mb-1 max-w-[280px] truncate">
                {labelText}
              </p>
            )}
            <svg ref={svgRef} className="max-w-full" />
          </div>
        ) : (
          <div className="text-center p-6 text-gray-400">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Ongeldige barcode
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-1">
              {validation.errorMessage || 'Voer een geldige EAN-code in'}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
        {/* Download PNG */}
        <button
          onClick={handleDownloadPng}
          disabled={!validation.isValid}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4 text-ah-blue" />
          <span>Download PNG</span>
        </button>

        {/* Download SVG */}
        <button
          onClick={handleDownloadSvg}
          disabled={!validation.isValid}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4 text-emerald-500" />
          <span>Download SVG</span>
        </button>

        {/* Copy */}
        <button
          onClick={handleCopy}
          disabled={!cleanCode}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Gekopieerd!' : 'Kopieer code'}</span>
        </button>

        {/* Add to Print Queue */}
        <button
          onClick={handleTransferToQueue}
          disabled={!validation.isValid}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-ah-blue hover:bg-ah-blueDark text-white shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{added ? 'Toegevoegd!' : 'Naar Printwachtrij'}</span>
        </button>
      </div>
    </div>
  );
};
