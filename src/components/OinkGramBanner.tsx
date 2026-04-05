import { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";

const OinkGramBanner = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("oinkgram_banner_dismissed");
    if (dismissed) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("oinkgram_banner_dismissed", "1");
    }, 50000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem("oinkgram_banner_dismissed", "1");
  };

  if (!visible) return null;

  return (
    <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white px-4 py-3 text-center">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <div className="text-xs sm:text-sm font-medium leading-tight">
          <span className="font-bold">OinkGram</span> — Национальный Мессенджер Казахстана и РФ 🇰🇿🇷🇺
          <span className="hidden sm:inline"> · Общайтесь удобно и безопасно!</span>
        </div>
        <a
          href="https://voracious-connect-world-now.base44.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1 bg-white text-purple-700 rounded text-xs font-semibold hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          Перейти <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-4 text-white/80 hover:text-white"
        aria-label="Закрыть"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="text-[9px] text-white/60 mt-1 leading-tight">
        Реклама. ТОО «Oink Tech Ltd Co» (ООО «Oink Russia»). Erid: 2VtzqvBMz7R
      </div>
    </div>
  );
};

export default OinkGramBanner;
