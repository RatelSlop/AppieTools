import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, Flashlight, RefreshCw, AlertCircle, CheckCircle2, Volume2, VolumeX } from 'lucide-react';
import { playBarcodeBeep } from '../../services/soundUtils';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      cleanupScanner();
      setLastScanned(null);
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      startScanner();
    }, 250);

    return () => {
      clearTimeout(timer);
      cleanupScanner();
    };
  }, [isOpen]);

  const cleanupScanner = async () => {
    if (scannerRef.current && !isStoppingRef.current) {
      isStoppingRef.current = true;
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Fout bij stoppen scanner:', err);
      } finally {
        scannerRef.current = null;
        isStoppingRef.current = false;
        setIsScanning(false);
      }
    }
  };

  const startScanner = async () => {
    setError(null);
    setIsScanning(true);

    try {
      const elementId = 'reader-video-container';
      const container = document.getElementById(elementId);
      if (!container) return;

      const html5QrCode = new Html5Qrcode(elementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.ITF,
        ],
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      });

      scannerRef.current = html5QrCode;

      const config = {
        fps: 20,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          // Generous scanning area so both horizontal and vertical barcodes on bottles fit easily
          const width = Math.floor(Math.min(viewfinderWidth * 0.90, 360));
          const height = Math.floor(Math.min(viewfinderHeight * 0.65, 260));
          return { width, height };
        },
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          // Clean barcode string
          const cleaned = decodedText.trim();
          if (cleaned && cleaned !== lastScanned) {
            setLastScanned(cleaned);

            if (soundEnabled) {
              playBarcodeBeep();
            }

            if ('vibrate' in navigator) {
              try {
                navigator.vibrate(60);
              } catch {
                // Ignore vibration failure
              }
            }

            onScan(cleaned);
          }
        },
        () => {
          // QR code parse error / frame without barcode - ignore continuous scanning noise
        }
      );

      // Check if torch / flashlight is supported
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const capabilities = (html5QrCode as any).getRunningTrackCapabilities?.();
        if (capabilities && 'torch' in capabilities) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: unknown) {
      console.error('Camera fout:', err);
      setIsScanning(false);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setError('Cameratoegang is geweigerd. Geef je browser toestemming om de camera te gebruiken.');
      } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFoundError')) {
        setError('Geen geschikte camera gevonden op dit apparaat.');
      } else {
        setError(`Kon camera niet starten: ${msg}`);
      }
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      const nextTorch = !torchOn;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (scannerRef.current as any).applyVideoConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn('Zaklamp schakelen mislukt:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-ah-blueLight dark:bg-slate-800 text-ah-blue">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Streepjescode Scannen
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Richt de camera op de streepjescode van een product
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              title={soundEnabled ? 'Geluid dempen' : 'Geluid inschakelen'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-ah-blue" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-xl transition-colors ${
                  torchOn
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
                title="Zaklamp aan/uit"
              >
                <Flashlight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Viewport Area */}
        <div className="relative bg-black flex-1 min-h-[320px] max-h-[420px] flex items-center justify-center overflow-hidden">
          <div id="reader-video-container" className="w-full h-full overflow-hidden" />

          {/* Visual Barcode Target Overlay */}
          {isScanning && !error && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              <div className="relative w-72 sm:w-80 h-44 sm:h-52 border-2 border-ah-blue/70 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.50)]">
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-ah-blue rounded-tl" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-ah-blue rounded-tr" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-ah-blue rounded-bl" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-ah-blue rounded-br" />

                {/* Animated horizontal scanning beam */}
                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-ah-blue to-transparent animate-pulse-slow top-1/2 -translate-y-1/2 shadow-[0_0_14px_#00A1E4]" />
              </div>
              <span className="mt-3 px-3.5 py-1.5 rounded-full bg-black/75 text-white/95 text-xs backdrop-blur-sm text-center shadow-lg max-w-[90%]">
                Plaats streepjescode in het kader (draai flessen bij verticale codes)
              </span>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gray-900/90 text-white">
              <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
              <p className="text-sm font-medium mb-4 max-w-xs">{error}</p>
              <button
                type="button"
                onClick={startScanner}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ah-blue hover:bg-ah-blueDark text-white text-xs font-semibold shadow-md transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Camera opnieuw proberen</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer with Last Scanned Feedback */}
        <div className="px-5 py-3.5 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          {lastScanned ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="truncate">
                Gescand: <strong className="font-mono">{lastScanned}</strong> (wordt gezocht...)
              </span>
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">
              Ondersteunt EAN-13, EAN-8 en verpakkingscodes
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 font-semibold transition-colors shrink-0"
          >
            Klaar
          </button>
        </div>
      </div>
    </div>
  );
};
