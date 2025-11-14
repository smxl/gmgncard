import { useEffect, useRef } from 'react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  siteKey?: string;
}

export const TurnstileWidget = ({ onVerify, siteKey }: TurnstileWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key =
      siteKey ?? (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ?? '1x00000000000000000000AA';

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) return;
      window.turnstile.render(containerRef.current, {
        sitekey: key,
        callback: onVerify
      });
    };

    if (window.turnstile) {
      renderWidget();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = renderWidget;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [onVerify, siteKey]);

  return <div className="turnstile-widget" ref={containerRef} />;
};
