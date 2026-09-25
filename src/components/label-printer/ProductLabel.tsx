import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { PrintLabelItem } from '../../types';

interface ProductLabelProps {
  item: PrintLabelItem;
  widthMm: number;
  heightMm: number;
  showCutLines: boolean;
  isPrintMode?: boolean;
}

export const ProductLabel: React.FC<ProductLabelProps> = ({
  item,
  widthMm,
  heightMm,
  showCutLines,
  isPrintMode = false,
}) => {
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!barcodeRef.current || !item.barcode) return;

    try {
      const cleanBarcode = item.barcode.replace(/\D/g, '');
      const format = cleanBarcode.length === 8 ? 'EAN8' : 'EAN13';

      JsBarcode(barcodeRef.current, cleanBarcode, {
        format,
        width: 1.4,
        height: 28,
        displayValue: true,
        fontSize: 10,
        font: 'monospace',
        textMargin: 1,
        margin: 2,
        background: '#ffffff',
        lineColor: '#000000',
      });
    } catch (e) {
      console.warn('JsBarcode render error for code:', item.barcode, e);
    }
  }, [item.barcode]);

  return (
    <div
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
      }}
      className={`relative box-border bg-white text-black overflow-hidden flex flex-col justify-between p-1.5 transition-shadow ${
        showCutLines ? 'border border-dashed border-gray-400' : 'border border-transparent'
      } ${!isPrintMode ? 'hover:shadow-md' : ''}`}
    >
      {/* Top Header: Title & Size */}
      <div className="w-full flex items-start justify-between gap-1 leading-tight">
        <div className="flex-1 min-w-0 pr-1">
          <p className="font-bold text-xs tracking-tight line-clamp-2 text-gray-900 leading-snug">
            {item.title}
          </p>
        </div>

        {item.salesUnitSize && (
          <span className="shrink-0 text-[10px] font-semibold text-gray-700 bg-gray-100 px-1 py-0.5 rounded">
            {item.salesUnitSize}
          </span>
        )}
      </div>

      {/* Center: Scannable Barcode */}
      <div className="flex-1 flex flex-col items-center justify-center my-0.5 overflow-hidden">
        <svg
          ref={barcodeRef}
          className="max-w-full max-h-full object-contain"
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>

      {/* Bottom Info: AH Article Number & Optional Price */}
      <div className="w-full flex items-center justify-between text-[9px] text-gray-600 font-mono pt-0.5 border-t border-gray-100">
        <span>Art. {item.articleNumber || item.productId || '---'}</span>
        {item.price !== null && item.price !== undefined && (
          <span className="font-sans font-bold text-[10px] text-gray-900">
            €{Number(item.price).toFixed(2).replace('.', ',')}
          </span>
        )}
      </div>
    </div>
  );
};
