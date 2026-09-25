import React from 'react';
import { ActiveTab } from '../../types';
import { Barcode, Printer, Moon, Sun, Github } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  queueCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  darkMode,
  onToggleDarkMode,
  queueCount,
}) => {
  return (
    <header className="no-print sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('label-printer')}>
            <div className="w-10 h-10 rounded-xl bg-ah-blue flex items-center justify-center text-white shadow-md shadow-ah-blue/20">
              <Barcode className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Appie<span className="text-ah-blue">Tools</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-ah-blueLight text-ah-blueDark dark:bg-ah-blue/20 dark:text-ah-blue">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                Productlabels & EAN Generator
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-gray-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => onTabChange('label-printer')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'label-printer'
                  ? 'bg-white dark:bg-slate-700 text-ah-blue shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Productlabel Printer</span>
              {queueCount > 0 && (
                <span className="ml-1.5 px-2 py-0.2 text-xs font-semibold rounded-full bg-ah-blue text-white">
                  {queueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('barcode-generator')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'barcode-generator'
                  ? 'bg-white dark:bg-slate-700 text-ah-blue shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Barcode className="w-4 h-4" />
              <span>EAN Barcode Generator</span>
            </button>
          </nav>

          {/* Right utilities */}
          <div className="flex items-center space-x-2">
            <a
              href="https://github.com/RatelSlop/AppieTools"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              title="GitHub Repository"
            >
              <Github className="w-5 h-5" />
            </a>

            <button
              onClick={onToggleDarkMode}
              aria-label="Schakel donkere modus in/uit"
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? 'Schakel over naar lichte modus' : 'Schakel over naar donkere modus'}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
