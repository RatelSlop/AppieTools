import React, { useState, useEffect } from 'react';
import { ActiveTab, PrintLabelItem } from './types';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { LabelPrinter } from './components/label-printer/LabelPrinter';
import { BarcodeGenerator } from './components/barcode-generator/BarcodeGenerator';
import { CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('label-printer');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appietools_dark_mode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [queue, setQueue] = useState<PrintLabelItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('appietools_queue');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Kon opgeslagen wachtrij niet laden:', e);
      }
    }
    // Default initial sample item: Calvé Pindakaas
    return [
      {
        id: 'initial-sample',
        productId: 220739,
        title: 'Calvé Pindakaas pot',
        salesUnitSize: '650 g',
        articleNumber: '815481',
        barcode: '8711200431632',
        price: 4.75,
        quantity: 2,
        imageUrl:
          'https://static.ah.nl/dam/product/AHI_785967786a644c715479363636747867756e4b487841?revLabel=1&rendition=200x200_WEBP&fileType=binary',
      },
    ];
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('appietools_dark_mode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem('appietools_queue', JSON.stringify(queue));
    } catch (e) {
      console.warn('Kon wachtrij niet opslaan:', e);
    }
  }, [queue]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddLabel = (newLabel: PrintLabelItem) => {
    setQueue((prev) => {
      const existing = prev.find((item) => item.barcode === newLabel.barcode);
      if (existing) {
        showToast(`Aantal van "${newLabel.title}" verhoogd naar ${existing.quantity + 1}`);
        return prev.map((item) =>
          item.barcode === newLabel.barcode
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        showToast(`"${newLabel.title}" toegevoegd aan printwachtrij!`);
        return [newLabel, ...prev];
      }
    });
  };

  const totalQueueCount = queue.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        queueCount={totalQueueCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'label-printer' ? (
          <LabelPrinter
            queue={queue}
            setQueue={setQueue}
            onAddLabel={handleAddLabel}
          />
        ) : (
          <BarcodeGenerator
            onAddToQueue={(label) => {
              handleAddLabel(label);
              showToast('Barcode toegevoegd aan de printwachtrij!');
            }}
          />
        )}
      </main>

      <Footer />

      {/* Notification Toast */}
      {toastMessage && (
        <div className="no-print fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-2xl animate-bounce-subtle text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
