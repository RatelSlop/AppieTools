import React, { useState } from 'react';
import { BarcodeType, PrintLabelItem } from '../../types';
import { BarcodePreview } from './BarcodePreview';
import {
  calculateEan13CheckDigit,
  calculateEan8CheckDigit,
  validateBarcode,
  formatEanDisplay,
} from '../../services/barcodeUtils';
import { Calculator, Wand2, Sparkles, Check, AlertTriangle, Sliders } from 'lucide-react';

interface BarcodeGeneratorProps {
  onAddToQueue: (label: PrintLabelItem) => void;
}

const BARCODE_EXAMPLES = [
  { name: 'Calvé Pindakaas (EAN-13)', code: '8711200431632', type: 'EAN13' as BarcodeType },
  { name: 'Coca-Cola 330ml (EAN-13)', code: '5449000000996', type: 'EAN13' as BarcodeType },
  { name: 'Red Bull 250ml (EAN-13)', code: '9002490100070', type: 'EAN13' as BarcodeType },
  { name: 'Voorbeeld EAN-8', code: '96385074', type: 'EAN8' as BarcodeType },
];

export const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({ onAddToQueue }) => {
  const [type, setType] = useState<BarcodeType>('EAN13');
  const [code, setCode] = useState('8711200431632');
  const [labelText, setLabelText] = useState('Calvé Pindakaas pot');
  const [barWidth, setBarWidth] = useState(2);
  const [barHeight, setBarHeight] = useState(60);
  const [displayValue, setDisplayValue] = useState(true);

  const cleanCode = code.replace(/\D/g, '');
  const validation = validateBarcode(cleanCode, type);

  const handleTypeChange = (newType: BarcodeType) => {
    setType(newType);
    if (newType === 'EAN13' && cleanCode.length === 8) {
      setCode('8711200431632');
    } else if (newType === 'EAN8' && cleanCode.length === 13) {
      setCode('96385074');
    }
  };

  const handleAutoCalculate = () => {
    if (type === 'EAN13') {
      const first12 = cleanCode.padEnd(12, '0').slice(0, 12);
      const check = calculateEan13CheckDigit(first12);
      setCode(first12 + check);
    } else {
      const first7 = cleanCode.padEnd(7, '0').slice(0, 7);
      const check = calculateEan8CheckDigit(first7);
      setCode(first7 + check);
    }
  };

  const handleGenerateRandom = () => {
    if (type === 'EAN13') {
      // Generate 87 (Dutch GS1 prefix) + 10 random digits + check digit
      let digits = '87';
      for (let i = 0; i < 10; i++) {
        digits += Math.floor(Math.random() * 10);
      }
      const check = calculateEan13CheckDigit(digits);
      setCode(digits + check);
    } else {
      let digits = '';
      for (let i = 0; i < 7; i++) {
        digits += Math.floor(Math.random() * 10);
      }
      const check = calculateEan8CheckDigit(digits);
      setCode(digits + check);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Configuration Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-700 mb-5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-ah-blue" />
              <span>Barcode Instellingen</span>
            </h3>

            {/* Random generator button */}
            <button
              onClick={handleGenerateRandom}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ah-blue bg-ah-blueLight hover:bg-ah-blue/20 dark:bg-slate-700 dark:text-ah-blue transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Willekeurige code</span>
            </button>
          </div>

          {/* Barcode Type Switcher */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Barcode Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('EAN13')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                  type === 'EAN13'
                    ? 'border-ah-blue bg-ah-blueLight text-ah-blueDark dark:bg-slate-700 dark:text-ah-blue shadow-sm'
                    : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-900'
                }`}
              >
                EAN-13 (13 cijfers - Standaard)
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('EAN8')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                  type === 'EAN8'
                    ? 'border-ah-blue bg-ah-blueLight text-ah-blueDark dark:bg-slate-700 dark:text-ah-blue shadow-sm'
                    : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-900'
                }`}
              >
                EAN-8 (8 cijfers - Compact)
              </button>
            </div>
          </div>

          {/* Code Input */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="barcode-digits" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Streepjescode Cijfers ({type === 'EAN13' ? '12 of 13 cijfers' : '7 of 8 cijfers'})
              </label>
              <span className="text-xs font-mono text-gray-400">
                {cleanCode.length} / {type === 'EAN13' ? 13 : 8}
              </span>
            </div>

            <div className="flex gap-2">
              <input
                id="barcode-digits"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={type === 'EAN13' ? 'bijv. 8711200431632' : 'bijv. 96385074'}
                maxLength={type === 'EAN13' ? 14 : 9}
                className="flex-1 px-3 py-2.5 text-sm font-mono rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ah-blue focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAutoCalculate}
                className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 transition-colors"
                title="Automatisch controlegetal berekenen"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Check-digit</span>
              </button>
            </div>

            {/* Validation alert */}
            <div className="mt-2 text-xs">
              {validation.isValid ? (
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>Geldig GS1 controlegetal ({formatEanDisplay(cleanCode)})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{validation.errorMessage}</span>
                  {validation.expectedCheckDigit !== undefined && (
                    <button
                      type="button"
                      onClick={() => {
                        const prefix =
                          type === 'EAN13' ? cleanCode.slice(0, 12) : cleanCode.slice(0, 7);
                        setCode(prefix + validation.expectedCheckDigit);
                      }}
                      className="ml-1 underline font-bold hover:text-amber-700"
                    >
                      Herstel naar {validation.expectedCheckDigit}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Optional Label Text */}
          <div className="mb-4">
            <label htmlFor="label-title-input" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Optionele Labeltekst (Boven barcode)
            </label>
            <input
              id="label-title-input"
              type="text"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              placeholder="bijv. Calvé Pindakaas of Voorraadpot"
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ah-blue focus:outline-none"
            />
          </div>

          {/* Sizing & Appearance */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
            <div>
              <label htmlFor="bar-width-input" className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Lijndikte ({barWidth}px)
              </label>
              <input
                id="bar-width-input"
                type="range"
                min={1}
                max={4}
                step={0.5}
                value={barWidth}
                onChange={(e) => setBarWidth(parseFloat(e.target.value))}
                className="w-full accent-ah-blue"
              />
            </div>

            <div>
              <label htmlFor="bar-height-input" className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Hoogte ({barHeight}px)
              </label>
              <input
                id="bar-height-input"
                type="range"
                min={30}
                max={120}
                step={5}
                value={barHeight}
                onChange={(e) => setBarHeight(parseInt(e.target.value))}
                className="w-full accent-ah-blue"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Tekst onder code
              </label>
              <button
                type="button"
                onClick={() => setDisplayValue(!displayValue)}
                className={`w-full py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                  displayValue
                    ? 'border-ah-blue bg-ah-blueLight text-ah-blueDark dark:bg-slate-700 dark:text-ah-blue'
                    : 'border-gray-300 dark:border-slate-600 text-gray-500'
                }`}
              >
                {displayValue ? 'Zichtbaar' : 'Verborgen'}
              </button>
            </div>
          </div>

          {/* Quick Examples */}
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-700">
            <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-ah-blue" />
              Voorbeelden:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {BARCODE_EXAMPLES.map((ex) => (
                <button
                  key={ex.code}
                  onClick={() => {
                    setType(ex.type);
                    setCode(ex.code);
                    setLabelText(ex.name.replace(/ \(EAN-\d+\)/, ''));
                  }}
                  className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-ah-blueLight hover:text-ah-blueDark dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  {ex.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Preview & Exports */}
        <BarcodePreview
          code={code}
          type={type}
          labelText={labelText}
          barWidth={barWidth}
          barHeight={barHeight}
          displayValue={displayValue}
          onAddToQueue={onAddToQueue}
        />
      </div>
    </div>
  );
};
