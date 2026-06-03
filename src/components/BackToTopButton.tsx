import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Плавающая кнопка «Наверх» — появляется после прокрутки >400px.
 * Лёгкая, без сторонних зависимостей, не мешает мобильному нижнему меню.
 */
const BackToTopButton = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      aria-label="Наверх"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="back-to-top fixed right-4 bottom-20 sm:bottom-6 z-50 h-11 w-11 rounded-full flex items-center justify-center hover-scale animate-fade-in"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
};

export default BackToTopButton;
