import React, { useState, useEffect } from 'react';
import Button from './Button';
import Card from './Card';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // Periksa apakah user pernah klik 'Nanti' dalam 24 jam terakhir
    const dismissedAt = localStorage.getItem('installBannerDismissedAt');
    if (dismissedAt) {
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissedAt, 10) < oneDay) {
        return; // Jangan tampilkan banner
      }
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // If app is already installed or standalone, don't show
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    } else {
      // DEBUG: Force show banner after 2 seconds so you can see the UI
      setTimeout(() => {
        setIsVisible(true);
      }, 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Browser didn't fire the event (maybe already installed, or not supported)
      setIsError(true);
      setTimeout(() => setIsError(false), 3000);
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('installBannerDismissedAt', Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <Card className="bg-[#B4D976] max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 !p-4 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <h4 className="font-['Archivo_Black'] uppercase text-lg">Install Aplikasi</h4>
          <p className="font-['Space_Mono'] text-sm">
            {isError 
              ? "Browser Anda belum mengizinkan instalasi (atau aplikasi sudah diinstal)."
              : "Install Kalkulator SE-2026 untuk akses offline yang lebih cepat."}
          </p>
        </div>
        <div className="flex space-x-2 w-full md:w-auto">
          <Button onClick={handleInstallClick} className="flex-1 md:flex-none">Install</Button>
          <Button variant="secondary" onClick={handleDismiss} className="flex-1 md:flex-none">Nanti</Button>
        </div>
      </Card>
    </div>
  );
}
