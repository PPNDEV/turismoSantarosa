import { FaBus, FaPlane, FaShip } from "react-icons/fa";
import { useLanguage } from "../context/useLanguage";

export default function ComoLlegar() {
  const { t } = useLanguage();

  const terrestreItems = [
    t("comoLlegar.terrestrial.item1"),
    t("comoLlegar.terrestrial.item2"),
    t("comoLlegar.terrestrial.item3"),
    t("comoLlegar.terrestrial.item4"),
    t("comoLlegar.terrestrial.item5"),
  ];

  const maritimoItems = [
    t("comoLlegar.maritime.item1"),
    t("comoLlegar.maritime.item2"),
    t("comoLlegar.maritime.item3"),
    t("comoLlegar.maritime.item4"),
    t("comoLlegar.maritime.item5"),
  ];

  const aereoItems = [
    t("comoLlegar.air.item1"),
    t("comoLlegar.air.item2"),
    t("comoLlegar.air.item3"),
    t("comoLlegar.air.item4"),
  ];

  return (
    <section id="como-llegar" className="section-white">
      <div className="container">
        <div className="section-header reveal">
          <h2 className="section-title">
            {t("comoLlegar.titleStart")}{" "}
            <span className="accent">{t("comoLlegar.titleAccent")}</span>?
          </h2>
          <p className="section-subtitle">{t("comoLlegar.subtitle")}</p>
        </div>
        <div className="como-llegar-grid">
          <div className="transport-card reveal">
            <div className="transport-icon">
              <FaBus aria-hidden="true" />
            </div>
            <h3>{t("comoLlegar.terrestrial.title")}</h3>
            <p>{t("comoLlegar.terrestrial.description")}</p>
            <ul className="transport-list">
              {terrestreItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="transport-card reveal">
            <div className="transport-icon">
              <FaShip aria-hidden="true" />
            </div>
            <h3>{t("comoLlegar.maritime.title")}</h3>
            <p>{t("comoLlegar.maritime.description")}</p>
            <ul className="transport-list">
              {maritimoItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="transport-card reveal">
            <div className="transport-icon">
              <FaPlane aria-hidden="true" />
            </div>
            <h3>{t("comoLlegar.air.title")}</h3>
            <p>{t("comoLlegar.air.description")}</p>
            <ul className="transport-list">
              {aereoItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
