import { useEffect } from "react";
import Header from "../components/Header";
import HeroCarousel from "../components/HeroCarousel";
import ComoLlegar from "../components/ComoLlegar";
import QueHacer from "../components/QueHacer";
import Destinos from "../components/Destinos";
import Eventos from "../components/Eventos";
import Generalidades from "../components/Generalidades";
import Galeria from "../components/Galeria";
import Footer from "../components/Footer";
import MascotasFlotantes from "../components/MascotasFlotantes";
import { useLanguage } from "../context/useLanguage";

export default function Home() {
  const { t } = useLanguage();

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      document
        .querySelectorAll(".reveal")
        .forEach((el) => el.classList.add("visible"));
      return undefined;
    }

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

    const observed = new WeakSet();
    const observeRevealElements = (root = document) => {
      root.querySelectorAll(".reveal").forEach((el) => {
        if (!observed.has(el)) {
          observed.add(el);
          observer.observe(el);
        }
      });
    };

    observeRevealElements();

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;

          if (node.matches(".reveal") && !observed.has(node)) {
            observed.add(node);
            observer.observe(node);
          }

          observeRevealElements(node);
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
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
      </main>
      <Footer />
      <MascotasFlotantes />
    </>
  );
}
