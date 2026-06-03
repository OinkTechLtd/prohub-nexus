import { useEffect } from "react";

/**
 * Принудительно красит фон html/body цветом страницы (для тёмных оболочек
 * Code Forum/подфорумов), чтобы не появлялась белая полоса сверху или снизу
 * при overscroll/safe-area.
 */
export const usePageBackground = (color: string | undefined | null) => {
  useEffect(() => {
    if (!color) return;
    const prevHtml = document.documentElement.style.background;
    const prevBody = document.body.style.background;
    document.documentElement.style.background = color;
    document.body.style.background = color;
    return () => {
      document.documentElement.style.background = prevHtml;
      document.body.style.background = prevBody;
    };
  }, [color]);
};

export default usePageBackground;
