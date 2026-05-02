import { useEffect } from "react";
import Header from "../components/Header";
import HeroCarousel from "../components/HeroCarousel";
import ComoLlegar from "../components/ComoLlegar";
import QueHacer from "../components/QueHacer";
import Destinos from "../components/Destinos";
import Eventos from "../components/Eventos";
import Generalidades from "../components/Generalidades";
import Galeria from "../components/Galeria";
import Blog from "../components/Blog";
import Footer from "../components/Footer";
import MascotasFlotantes from "../components/MascotasFlotantes";
import { useLanguage } from "../context/useLanguage";

export default function Home() {
  const { t } = useLanguage();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Header />
      <main>
        <HeroCarousel />
        {/* Stats rápidos */}
        <div className="quick-stats">
          <div className="container">
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">4</span>
                <div className="stat-label">{t("home.stats.islands")}</div>
              </div>
              <div className="stat-item">
                <span className="stat-number">70K</span>
                <div className="stat-label">{t("home.stats.population")}</div>
              </div>
              <div className="stat-item">
                <span className="stat-number">32°C</span>
                <div className="stat-label">{t("home.stats.temperature")}</div>
              </div>
              <div className="stat-item">
                <span className="stat-number">12</span>
                <div className="stat-label">{t("home.stats.yearlyEvents")}</div>
              </div>
              <div className="stat-item">
                <span className="stat-number">1861</span>
                <div className="stat-label">{t("home.stats.foundation")}</div>
              </div>
            </div>
          </div>
        </div>
        <ComoLlegar />
        <QueHacer />
        <Destinos />
        <Eventos />
        <Generalidades />
        <Galeria />
        <Blog />
      </main>
      <Footer />
      <MascotasFlotantes />
    </>
  );
}
