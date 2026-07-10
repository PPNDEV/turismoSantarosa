import { useState, useEffect, useCallback } from "react";
import { useContent } from "../context/useContent";
import { useLanguage } from "../context/useLanguage";

const SLIDE_AUTO_ADVANCE_MS = 5000;

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [loadDeferredSlides, setLoadDeferredSlides] = useState(false);
  const { heroSlides } = useContent();
  const { t } = useLanguage();
  const activeIndex =
    heroSlides.length > 0 &&
    Number.isFinite(current) &&
    current < heroSlides.length
      ? current % heroSlides.length
      : 0;

  const next = useCallback(() => {
    setCurrent((c) => {
      if (heroSlides.length === 0) return 0;
      const base = Number.isFinite(c) ? c : 0;
      return (base + 1) % heroSlides.length;
    });
  }, [heroSlides.length]);

  const prev = useCallback(() => {
    setCurrent((c) => {
      if (heroSlides.length === 0) return 0;
      const base = Number.isFinite(c) ? c : 0;
      return (base - 1 + heroSlides.length) % heroSlides.length;
    });
  }, [heroSlides.length]);

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;
    const timer = window.setTimeout(next, SLIDE_AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [activeIndex, heroSlides.length, next]);

  useEffect(() => {
    const scheduleIdleLoad =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? window.requestIdleCallback
        : (callback) => window.setTimeout(callback, 2500);
    const cancelIdleLoad =
      typeof window !== "undefined" && "cancelIdleCallback" in window
        ? window.cancelIdleCallback
        : window.clearTimeout;

    const idleId = scheduleIdleLoad(() => setLoadDeferredSlides(true), {
      timeout: 3500,
    });

    return () => cancelIdleLoad(idleId);
  }, [heroSlides.length]);

  if (!heroSlides.length) {
    return <section className="hero" />;
  }

  return (
    <section className="hero">
      {heroSlides.map((slide, i) => (
        <div
          key={slide.id || i}
          className={`hero-slide ${i === activeIndex ? "active" : ""}`}
        >
          {(i === activeIndex || loadDeferredSlides) && (
            <img
              src={slide.bg}
              alt=""
              aria-hidden="true"
              className="hero-slide-bg"
              loading={i === activeIndex ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={i === activeIndex ? "high" : "low"}
              onLoad={() => {
                if (i === activeIndex) setLoadDeferredSlides(true);
              }}
            />
          )}
        </div>
      ))}

      {/* Flechas */}
      <button
        type="button"
        className="hero-arrow-btn hero-prev"
        onClick={prev}
        aria-label={t("hero.prevSlide")}
      >
        ‹
      </button>
      <button
        type="button"
        className="hero-arrow-btn hero-next"
        onClick={next}
        aria-label={t("hero.nextSlide")}
      >
        ›
      </button>

      {/* Dots */}
      <div className="hero-arrows">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`hero-dot ${i === activeIndex ? "active" : ""}`}
            onClick={() => setCurrent(i)}
            aria-label={`${t("hero.goToSlide")} ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
