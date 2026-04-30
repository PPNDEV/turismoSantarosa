import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useContent } from "../context/useContent";
import { useLanguage } from "../context/useLanguage";

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const { heroSlides } = useContent();
  const { t } = useLanguage();
  const activeIndex = heroSlides.length > 0 ? current % heroSlides.length : 0;

  const getTranslatedValue = (key, fallback) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const activeSlide = heroSlides[activeIndex]
    ? {
        ...heroSlides[activeIndex],
        tag: getTranslatedValue(
          `heroSlides.${heroSlides[activeIndex].id}.tag`,
          heroSlides[activeIndex].tag,
        ),
        title: getTranslatedValue(
          `heroSlides.${heroSlides[activeIndex].id}.title`,
          heroSlides[activeIndex].title,
        ),
        sub: getTranslatedValue(
          `heroSlides.${heroSlides[activeIndex].id}.sub`,
          heroSlides[activeIndex].sub,
        ),
        cta: getTranslatedValue(
          `heroSlides.${heroSlides[activeIndex].id}.cta`,
          heroSlides[activeIndex].cta,
        ),
      }
    : null;

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % heroSlides.length);
  }, [heroSlides.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + heroSlides.length) % heroSlides.length);
  }, [heroSlides.length]);

  useEffect(() => {
    const timer = setInterval(next, 5500);
    return () => clearInterval(timer);
  }, [next]);

  if (!heroSlides.length) {
    return <section className="hero" />;
  }

  return (
    <section className="hero">
      {heroSlides.map((slide, i) => (
        <div
          key={i}
          className={`hero-slide ${i === activeIndex ? "active" : ""}`}
        >
          <img
            src={slide.bg}
            alt=""
            aria-hidden="true"
            className="hero-slide-bg"
            loading={i === activeIndex ? "eager" : "lazy"}
            decoding="async"
          />
        </div>
      ))}
      <div className="hero-overlay" />

      <div className="hero-content">
        <p className="hero-tag">{activeSlide?.tag}</p>
        <h1 className="hero-title">{activeSlide?.title}</h1>
        <p className="hero-sub">{activeSlide?.sub}</p>
        <div className="hero-btns">
          <Link to={activeSlide?.ctaTo || "/destinos"} className="btn btn-gold">
            {activeSlide?.cta} →
          </Link>
          <Link to="/#como-llegar" className="btn btn-white">
            {t("hero.howToGetButton")}
          </Link>
        </div>
      </div>

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
