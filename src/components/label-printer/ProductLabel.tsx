import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { PrintLabelItem } from '../../types';

interface ProductLabelProps {
  item: PrintLabelItem;
  widthMm: number;
  heightMm: number;
  showCutLines: boolean;
  showProductImage?: boolean;
  isPrintMode?: boolean;
}

function formatDateDutch(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return iso;
}

export const ProductLabel: React.FC<ProductLabelProps> = ({
  item,
  widthMm,
  heightMm,
  showCutLines,
  showProductImage = true,
  isPrintMode = false,
}) => {
  const barcodeRef = useRef<SVGSVGElement | null>(null);
  const hasImage = Boolean(showProductImage && item.imageUrl);

  useEffect(() => {
    if (!barcodeRef.current || !item.barcode) return;

    try {
      const cleanBarcode = item.barcode.replace(/\D/g, '');
      const format = cleanBarcode.length === 8 ? 'EAN8' : 'EAN13';

      JsBarcode(barcodeRef.current, cleanBarcode, {
        format,
        width: 1.35,
        height: hasImage ? 20 : 27,
        displayValue: true,
        fontSize: 9.5,
        font: 'monospace',
        textMargin: 1,
        margin: 1,
        background: '#ffffff',
        lineColor: '#000000',
      });
    } catch (e) {
      console.warn('JsBarcode render error for code:', item.barcode, e);
    }
  }, [item.barcode, hasImage]);

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
      {/* Top Header: Image, Title & Size */}
      <div className="w-full flex items-start gap-1.5 leading-tight">
        {hasImage && (
          <div className="w-[12mm] h-[12mm] shrink-0 bg-white rounded flex items-center justify-center overflow-hidden border border-gray-200 p-0.5">
            <img
              src={item.imageUrl}
              alt=""
              crossOrigin="anonymous"
              className="max-h-full max-w-full object-contain mix-blend-multiply"
              loading="eager"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className="font-bold text-[10.5px] tracking-tight line-clamp-2 text-gray-900 leading-snug">
              {item.title}
            </p>
            {item.salesUnitSize && (
              <span className="shrink-0 text-[8.5px] font-semibold text-gray-700 bg-gray-100 px-1 py-0.2 rounded">
                {item.salesUnitSize}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center: Scannable Barcode */}
      <div className="flex-1 flex flex-col items-center justify-center my-0.5 overflow-hidden">
        <svg
          ref={barcodeRef}
          className="max-w-full max-h-full object-contain"
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>

      {/* Bottom Info: AH Article Number, Optional THT & Optional Price */}
      <div className="w-full flex items-center justify-between text-[8px] text-gray-600 font-mono pt-0.5 border-t border-gray-150 gap-1">
        <span className="truncate max-w-[35%]">Art. {item.articleNumber || item.productId || '---'}</span>

        {item.expiryDate && (
          <span className="font-sans font-bold text-[8.5px] text-gray-900 bg-amber-100/80 border border-amber-300 px-1 py-0.2 rounded shrink-0">
            {item.expiryType || 'THT'}: {formatDateDutch(item.expiryDate)}
          </span>
        )}

        {item.price !== null && item.price !== undefined && (
          <span className="font-sans font-bold text-[9.5px] text-gray-900 shrink-0">
            €{Number(item.price).toFixed(2).replace('.', ',')}
          </span>
        )}
      </div>
    </div>
  );
};
