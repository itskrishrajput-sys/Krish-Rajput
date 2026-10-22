import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface PWAInstallButtonProps {
  language?: 'hi' | 'en';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ language = 'en' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running inside installed standalone app, suppress
  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[11px] font-medium">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
        <span>{language === 'hi' ? 'ऐप इंस्टॉल है' : 'App Installed'}</span>
      </span>
    );
  }

  // Handle direct click
  const handleAction = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleAction}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all active:scale-[0.98] whitespace-nowrap"
        title="Install as Android / Mobile App"
      >
        <Smartphone className="w-3.5 h-3.5 animate-pulse" />
        <span>{language === 'hi' ? '📲 ऐप इंस्टॉल करें' : 'Install App'}</span>
      </button>

      {/* Guide Modal for iOS or manual install */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {language === 'hi' ? 'मोबाइल में ऐप कैसे इंस्टॉल करें' : 'Install App on Your Phone'}
                </h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-600">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <Share className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Step 1:</strong> Safari ब्राउज़र के नीचे स्थित <strong>Share (शेयर)</strong> बटन दबाएं।
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <PlusSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Step 2:</strong> नीचे स्क्रॉल करके <strong>"Add to Home Screen" (होम स्क्रीन में जोड़ें)</strong> पर टैप करें।
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-[10px]">
                      1
                    </div>
                    <p>
                      ब्राउज़र (Google Chrome) में ऊपर दाईं ओर दिए गए <strong>3 डॉट्स (⋮)</strong> पर क्लिक करें।
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-[10px]">
                      2
                    </div>
                    <p>
                      मेनू में <strong>"Install app"</strong> या <strong>"Add to Home screen" (होम स्क्रीन पर जोड़ें)</strong> चुनें।
                    </p>
                  </div>
                </>
              )}

              <div className="p-2 bg-blue-50 text-blue-800 rounded-lg text-[11px]">
                💡 इंस्टॉल होने के बाद यह ऐप आपके मोबाइल के होम स्क्रीन पर बिना किसी ब्राउज़र बार के एक असली Android App की तरह खुलेगा!
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition-colors"
            >
              समझ गया (Got It)
            </button>
          </div>
        </div>
      )}
    </>
  );
};
