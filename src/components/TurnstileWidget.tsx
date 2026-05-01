import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: any) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

interface Props {
  siteKey?: string;
  onVerify: (token: string) => void;
  theme?: "light" | "dark" | "auto";
}

/**
 * CloudFlare Turnstile — невидимая/видимая капча, работает в РФ (без geo-блокировок Google reCAPTCHA).
 * Если siteKey не задан — компонент молча скипается (dev-режим).
 */
const TurnstileWidget = ({ siteKey, onVerify, theme = "auto" }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey) {
      // Без ключа сразу пропускаем
      onVerify("dev-skip");
      return;
    }

    const SCRIPT_ID = "cf-turnstile-script";
    const renderWidget = () => {
      if (!ref.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        theme,
        callback: (token: string) => onVerify(token),
      });
    };

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    } else {
      renderWidget();
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) return null;
  return <div ref={ref} className="my-2" />;
};

export default TurnstileWidget;
