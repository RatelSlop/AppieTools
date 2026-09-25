import React from 'react';
import { SheetTemplate } from '../../types';
import { SHEET_TEMPLATES } from '../../services/printTemplates';
import { Printer, Settings, Scissors, SkipForward } from 'lucide-react';

interface SheetConfiguratorProps {
  selectedTemplate: SheetTemplate;
  onSelectTemplate: (template: SheetTemplate) => void;
  showCutLines: boolean;
  onToggleCutLines: (show: boolean) => void;
  startOffset: number;
  onUpdateStartOffset: (offset: number) => void;
  onPrint: () => void;
  totalLabels: number;
}

export const SheetConfigurator: React.FC<SheetConfiguratorProps> = ({
  selectedTemplate,
  onSelectTemplate,
  showCutLines,
  onToggleCutLines,
  startOffset,
  onUpdateStartOffset,
  onPrint,
  totalLabels,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-5 mb-6 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ah-blueLight dark:bg-ah-blue/20 text-ah-blue flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              A4 Vel & Print Instellingen
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Kies het formaat van je stickervel of blanco A4
            </p>
          </div>
        </div>

        {/* Print Button */}
        <button
          onClick={onPrint}
          disabled={totalLabels === 0}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-ah-blue hover:bg-ah-blueDark text-white shadow-lg shadow-ah-blue/25 hover:shadow-ah-blue/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <Printer className="w-4 h-4" />
          <span>Afdrukken ({totalLabels} {totalLabels === 1 ? 'label' : 'labels'})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {/* Template Preset Selector */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Stickervel Indeling
          </label>
          <select
            value={selectedTemplate.id}
            onChange={(e) => {
              const tmpl = SHEET_TEMPLATES[e.target.value] || SHEET_TEMPLATES['avery-24'];
              onSelectTemplate(tmpl);
            }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ah-blue focus:outline-none"
          >
            {Object.values(SHEET_TEMPLATES).map((tmpl) => (
              <option key={tmpl.id} value={tmpl.id}>
                {tmpl.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            {selectedTemplate.description}
          </p>
        </div>

        {/* Cut Lines Toggle */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-gray-400" />
            <span>Kniplijnen</span>
          </label>
          <button
            type="button"
            onClick={() => onToggleCutLines(!showCutLines)}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl border transition-colors ${
              showCutLines
                ? 'border-ah-blue bg-ah-blueLight text-ah-blueDark dark:bg-slate-700 dark:text-ah-blue'
                : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-900'
            }`}
          >
            <span>{showCutLines ? 'Kniplijnen zichtbaar' : 'Geen kniplijnen'}</span>
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                showCutLines ? 'bg-ah-blue text-white' : 'bg-gray-200 dark:bg-slate-700 text-transparent'
              }`}
            >
              ✓
            </span>
          </button>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Handig voor blanco papier
          </p>
        </div>

        {/* Skip Used Stickers Offset */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            <SkipForward className="w-3.5 h-3.5 text-gray-400" />
            <span>Startpositie overslaan</span>
          </label>
          <input
            type="number"
            min={0}
            max={selectedTemplate.labelsPerPage - 1}
            value={startOffset}
            onChange={(e) => onUpdateStartOffset(Math.max(0, parseInt(e.target.value) || 0))}
            placeholder="0"
            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-ah-blue focus:outline-none"
          />
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Sla reeds gebruikte stickers over
          </p>
        </div>
      </div>
    </div>
  );
};
