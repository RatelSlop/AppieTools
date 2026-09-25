import React, { useState } from 'react';
import { PrintLabelItem, SheetTemplate } from '../../types';
import { ProductLabel } from './ProductLabel';
import { Eye, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface A4SheetPreviewProps {
  queue: PrintLabelItem[];
  template: SheetTemplate;
  showCutLines: boolean;
  showProductImage: boolean;
  startOffset: number;
}

export const A4SheetPreview: React.FC<A4SheetPreviewProps> = ({
  queue,
  template,
  showCutLines,
  showProductImage,
  startOffset,
}) => {
  const [zoom, setZoom] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      const fitZoom = (window.innerWidth - 40) / 794;
      return Math.max(0.35, Math.min(0.65, Math.round(fitZoom * 100) / 100));
    }
    return 0.75;
  });

  // Flatten items by quantity
  const flattenedLabels: PrintLabelItem[] = [];
  queue.forEach((item) => {
    for (let i = 0; i < item.quantity; i++) {
      flattenedLabels.push(item);
    }
  });

  // Calculate pages
  const itemsPerPage = template.labelsPerPage;
  const pages: (PrintLabelItem | null)[][] = [];

  let currentSlot = 0;
  let currentPage: (PrintLabelItem | null)[] = [];

  // Pad first page with startOffset nulls
  for (let i = 0; i < startOffset; i++) {
    currentPage.push(null);
    currentSlot++;
    if (currentSlot === itemsPerPage) {
      pages.push(currentPage);
      currentPage = [];
      currentSlot = 0;
    }
  }

  // Fill labels
  flattenedLabels.forEach((label) => {
    currentPage.push(label);
    currentSlot++;
    if (currentSlot === itemsPerPage) {
      pages.push(currentPage);
      currentPage = [];
      currentSlot = 0;
    }
  });

  // If items remaining on last page, pad with nulls to complete sheet
  if (currentPage.length > 0) {
    while (currentPage.length < itemsPerPage) {
      currentPage.push(null);
    }
    pages.push(currentPage);
  }

  // If queue is completely empty and no offset, show at least 1 empty demo page
  if (pages.length === 0) {
    pages.push(new Array(itemsPerPage).fill(null));
  }

  return (
    <>
      <div className="no-print bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-5 mb-8 transition-colors">
      {/* Header with zoom controls */}
      <div className="no-print flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-ah-blue" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            A4 Vel Voorbeeld ({pages.length} {pages.length === 1 ? 'pagina' : 'pagina\'s'})
          </h3>
        </div>

        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-700/60 p-1 rounded-xl text-xs">
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
            className="p-1 rounded text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-600 transition-colors"
            title="Uitzoomen"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono font-medium text-gray-700 dark:text-gray-300 min-w-[42px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(1.2, z + 0.1))}
            className="p-1 rounded text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-600 transition-colors"
            title="Inzoomen"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(0.75)}
            className="p-1 rounded text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-600 transition-colors ml-1"
            title="Reset naar 75%"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pages Container (Screen Mode) */}
      <div className="no-print my-6 flex flex-col items-center gap-8 overflow-x-auto py-2">
        {pages.map((pageItems, pageIdx) => (
          <div
            key={pageIdx}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              width: '210mm',
              height: '297mm',
              marginBottom: `${(zoom - 1) * 297 * 3.78}px`, // Adjust container height compensation
            }}
            className="relative bg-white text-black shadow-2xl rounded-sm border border-gray-300 box-border p-0 transition-transform"
          >
            {/* Sheet Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${template.columns}, ${template.labelWidthMm}mm)`,
                gridTemplateRows: `repeat(${template.rows}, ${template.labelHeightMm}mm)`,
                columnGap: `${template.gapHorizontalMm}mm`,
                rowGap: `${template.gapVerticalMm}mm`,
                paddingTop: `${template.marginTopMm}mm`,
                paddingBottom: `${template.marginBottomMm}mm`,
                paddingLeft: `${template.marginLeftMm}mm`,
                paddingRight: `${template.marginRightMm}mm`,
                width: '210mm',
                height: '297mm',
                boxSizing: 'border-box',
              }}
            >
              {pageItems.map((item, slotIdx) => (
                <div key={slotIdx} className="box-border flex items-center justify-center">
                  {item ? (
                    <ProductLabel
                      item={item}
                      widthMm={template.labelWidthMm}
                      heightMm={template.labelHeightMm}
                      showCutLines={showCutLines}
                      showProductImage={showProductImage}
                    />
                  ) : (
                    <div
                      style={{
                        width: `${template.labelWidthMm}mm`,
                        height: `${template.labelHeightMm}mm`,
                      }}
                      className="border border-dashed border-gray-200 flex items-center justify-center text-[10px] text-gray-300 font-mono"
                    >
                      {slotIdx < startOffset && pageIdx === 0 ? 'Overgeslagen' : 'Leeg vak'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Page number badge */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-400">
              Pagina {pageIdx + 1} van {pages.length}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Pages Container (Print Mode: Pure Millimeters) */}
    <div className="print-only">
      {pages.map((pageItems, pageIdx) => (
        <div
          key={pageIdx}
          className="print-page-container"
          style={{
            width: '210mm',
            height: '297mm',
            display: 'grid',
            gridTemplateColumns: `repeat(${template.columns}, ${template.labelWidthMm}mm)`,
            gridTemplateRows: `repeat(${template.rows}, ${template.labelHeightMm}mm)`,
            columnGap: `${template.gapHorizontalMm}mm`,
            rowGap: `${template.gapVerticalMm}mm`,
            paddingTop: `${template.marginTopMm}mm`,
            paddingBottom: `${template.marginBottomMm}mm`,
            paddingLeft: `${template.marginLeftMm}mm`,
            paddingRight: `${template.marginRightMm}mm`,
            boxSizing: 'border-box',
          }}
        >
          {pageItems.map((item, slotIdx) => (
            <div key={slotIdx} className="box-border">
              {item ? (
                <ProductLabel
                  item={item}
                  widthMm={template.labelWidthMm}
                  heightMm={template.labelHeightMm}
                  showCutLines={showCutLines}
                  showProductImage={showProductImage}
                  isPrintMode={true}
                />
              ) : (
                <div
                  style={{
                    width: `${template.labelWidthMm}mm`,
                    height: `${template.labelHeightMm}mm`,
                  }}
                  className={showCutLines ? 'border border-dashed border-gray-200' : ''}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  </>
);
};
