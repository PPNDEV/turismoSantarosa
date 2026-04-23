import {
  FaBinoculars,
  FaCamera,
  FaFish,
  FaLeaf,
  FaTheaterMasks,
  FaTree,
  FaUmbrellaBeach,
  FaUtensils,
} from "react-icons/fa";
import { useLanguage } from "../context/useLanguage";

export default function QueHacer() {
  const { t } = useLanguage();

  const actividades = [
    {
      icon: FaUmbrellaBeach,
      name: t("queHacer.activities.beach.name"),
      desc: t("queHacer.activities.beach.desc"),
    },
    {
      icon: FaBinoculars,
      name: t("queHacer.activities.nature.name"),
      desc: t("queHacer.activities.nature.desc"),
    },
    {
      icon: FaUtensils,
      name: t("queHacer.activities.gastronomy.name"),
      desc: t("queHacer.activities.gastronomy.desc"),
    },
    {
      icon: FaFish,
      name: t("queHacer.activities.fishing.name"),
      desc: t("queHacer.activities.fishing.desc"),
    },
    {
      icon: FaLeaf,
      name: t("queHacer.activities.ecotourism.name"),
      desc: t("queHacer.activities.ecotourism.desc"),
    },
    {
      icon: FaTheaterMasks,
      name: t("queHacer.activities.culture.name"),
      desc: t("queHacer.activities.culture.desc"),
    },
    {
      icon: FaTree,
      name: t("queHacer.activities.mangrove.name"),
      desc: t("queHacer.activities.mangrove.desc"),
    },
    {
      icon: FaCamera,
      name: t("queHacer.activities.photo.name"),
      desc: t("queHacer.activities.photo.desc"),
    },
  ];

  return (
    <section style={{ background: "var(--gray-50)" }}>
      <div className="container">
        <div className="section-header reveal">
          <h2 className="section-title">
            {t("queHacer.titleStart")}{" "}
            <span className="accent">{t("queHacer.titleAccent")}</span>{" "}
            {t("queHacer.titleEnd")}
          </h2>
          <p className="section-subtitle">{t("queHacer.subtitle")}</p>
        </div>
        <div className="que-hacer-grid">
          {actividades.map((act, i) => (
            <div key={i} className="actividad-card reveal">
              <span className="actividad-icon">
                <act.icon aria-hidden="true" />
              </span>
              <div className="actividad-name">{act.name}</div>
              <div className="actividad-desc">{act.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
