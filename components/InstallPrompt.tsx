import React, { useEffect, useState } from 'react';
import { Download, Smartphone, Share } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isInStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Capture install prompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      });
    }
  };

  if (isStandalone) return null; // Don't show if already installed

  // iOS Instructions
  if (isIOS) {
    return (
      <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden group shadow-sm">
         <div className="absolute top-0 right-0 p-4 opacity-10">
             <Smartphone className="w-24 h-24" />
         </div>
         <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 relative z-10">Install ClassLog</h3>
         <p className="text-slate-500 mb-4 text-sm relative z-10">
             To install on iOS: Tap <span className="inline-flex items-center justify-center p-1 bg-slate-200 dark:bg-slate-700 rounded mx-1"><Share className="w-3 h-3" /></span> and select <br/> 
             <span className="font-bold text-slate-800 dark:text-slate-200">"Add to Home Screen"</span>
         </p>
      </div>
    );
  }

  // Android/Desktop Button
  if (deferredPrompt) {
    return (
      <div className="p-6 rounded-3xl bg-gradient-to-br from-accent-purple/10 to-indigo-500/10 border border-accent-purple/20 relative overflow-hidden group shadow-sm">
         <div className="flex justify-between items-center relative z-10">
             <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Install App</h3>
                <p className="text-slate-500 text-xs">Add to Home Screen for offline access</p>
             </div>
             <button 
                onClick={handleInstallClick}
                className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95"
             >
                <Download className="w-4 h-4" /> Install
             </button>
         </div>
      </div>
    );
  }

  return null;
};