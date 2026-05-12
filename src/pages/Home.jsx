import { useEffect, useMemo, useRef, useState } from "react";
import Header from "../components/Header";
import HeroCarousel from "../components/HeroCarousel";
import QueHacer from "../components/QueHacer";
import MapaGeoreferencial from "../components/MapaGeoreferencial";
import Eventos from "../components/Eventos";
import Generalidades from "../components/Generalidades";
import Galeria from "../components/Galeria";
import SatisfactionSurvey from "../components/SatisfactionSurvey";
import Footer from "../components/Footer";
import MascotasFlotantes from "../components/MascotasFlotantes";
import { useContent } from "../context/useContent";
import { useLanguage } from "../context/useLanguage";
import { subscribeVisitMetrics } from "../services/visitCounter";

function formatMetric(value) {
  return new Intl.NumberFormat("es-EC").format(Number(value || 0));
}

function AnimatedStatNumber({ value, suffix = "" }) {
  const numericValue = Number(value || 0);
  const [displayValue, setDisplayValue] = useState(numericValue);
  const displayValueRef = useRef(numericValue);

  useEffect(() => {
    const startValue = displayValueRef.current;
    const difference = numericValue - startValue;
    const duration = 700;
    const startedAt = performance.now();
    let frameId;

    if (difference === 0) return undefined;

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + difference * eased;
      displayValueRef.current = nextValue;
      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [numericValue]);

  return (
    <span className="stat-number">
      {formatMetric(Math.round(displayValue))}
      {suffix}
    </span>
  );
}

function PublicVisitCounter() {
  const [metrics, setMetrics] = useState({
    totalPageViews: 0,
    totalSessions: 0,
  });

  useEffect(() => {
    const unsubscribe = subscribeVisitMetrics(setMetrics, () => {});
    return () => unsubscribe();
  }, []);

  return (
    <div className="stat-item visit-counter-card" aria-label="Contador de visitantes">
      <AnimatedStatNumber value={metrics.totalPageViews} />
      <div className="stat-label">Visitas</div>
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();
  const { eventos = [] } = useContent();
  const stats = useMemo(() => {
    const activeEvents = Array.isArray(eventos)
      ? eventos.filter((evento) => evento.activo !== false)
      : [];

    return {
      islands: 4,
      yearlyEvents: Math.max(activeEvents.length, 12),
    };
  }, [eventos]);

  return (
    <>
      <Header />
      <main>
        <HeroCarousel />
        <div className="quick-stats">
          <div className="container">
            <div className="stats-grid">
              <div className="stat-item">
                <AnimatedStatNumber value={stats.islands} />
                <div className="stat-label">{t("home.stats.islands")}</div>
              </div>
              <div className="stat-item">
                <AnimatedStatNumber value={70} suffix="K" />
                <div className="stat-label">{t("home.stats.population")}</div>
              </div>
              <div className="stat-item">
                <AnimatedStatNumber value={32} suffix="°C" />
                <div className="stat-label">{t("home.stats.temperature")}</div>
              </div>
              <div className="stat-item">
                <AnimatedStatNumber value={stats.yearlyEvents} />
                <div className="stat-label">{t("home.stats.yearlyEvents")}</div>
              </div>
              <div className="stat-item">
                <AnimatedStatNumber value={1861} />
                <div className="stat-label">{t("home.stats.foundation")}</div>
              </div>
              <PublicVisitCounter />
            </div>
          </div>
        </div>
        <QueHacer />
        <MapaGeoreferencial />
        <Eventos />
        <Generalidades />
        <Galeria />
        <SatisfactionSurvey />
      </main>
      <Footer />
      <MascotasFlotantes />
    </>
  );
}
