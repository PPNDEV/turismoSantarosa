import { FaBus, FaPlane, FaShip } from "react-icons/fa";
import { useContent } from "../context/useContent";
import { useLanguage } from "../context/useLanguage";

const ICONS = {
  bus: FaBus,
  ship: FaShip,
  plane: FaPlane,
};

function splitItems(itemsText) {
  return String(itemsText || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ComoLlegar() {
  const { t } = useLanguage();
  const { comoLlegar, comoLlegarIntro } = useContent();

  const defaultCards = [
    {
      id: "terrestre",
      icono: "bus",
      titulo: t("comoLlegar.terrestrial.title"),
      descripcion: t("comoLlegar.terrestrial.description"),
      itemsText: [
        t("comoLlegar.terrestrial.item1"),
        t("comoLlegar.terrestrial.item2"),
        t("comoLlegar.terrestrial.item3"),
        t("comoLlegar.terrestrial.item4"),
        t("comoLlegar.terrestrial.item5"),
      ].join("\n"),
      order: 0,
    },
    {
      id: "maritimo",
      icono: "ship",
      titulo: t("comoLlegar.maritime.title"),
      descripcion: t("comoLlegar.maritime.description"),
      itemsText: [
        t("comoLlegar.maritime.item1"),
        t("comoLlegar.maritime.item2"),
        t("comoLlegar.maritime.item3"),
        t("comoLlegar.maritime.item4"),
        t("comoLlegar.maritime.item5"),
      ].join("\n"),
      order: 1,
    },
    {
      id: "aereo",
      icono: "plane",
      titulo: t("comoLlegar.air.title"),
      descripcion: t("comoLlegar.air.description"),
      itemsText: [
        t("comoLlegar.air.item1"),
        t("comoLlegar.air.item2"),
        t("comoLlegar.air.item3"),
        t("comoLlegar.air.item4"),
      ].join("\n"),
      order: 2,
    },
  ];

  const cards = comoLlegar.length > 0 ? comoLlegar : defaultCards;
  const intro = comoLlegarIntro[0] || {
    tituloInicio: t("comoLlegar.titleStart"),
    tituloAcento: t("comoLlegar.titleAccent"),
    signo: "?",
    subtitulo: t("comoLlegar.subtitle"),
  };

  return (
    <section id="como-llegar" className="section-white">
      <div className="container">
        <div className="section-header reveal">
          <h2 className="section-title">
            {intro.tituloInicio}{" "}
            <span className="accent">{intro.tituloAcento}</span>
            {intro.signo}
          </h2>
          <p className="section-subtitle">{intro.subtitulo}</p>
        </div>
        <div className="como-llegar-grid">
          {cards
            .filter((card) => card.activo !== false)
            .map((card) => {
              const Icon = ICONS[card.icono] || FaBus;
              const items = splitItems(card.itemsText);

              return (
                <div key={card.id} className="transport-card reveal">
                  <div className="transport-icon">
                    <Icon aria-hidden="true" />
                  </div>
                  <h3>{card.titulo}</h3>
                  <p>{card.descripcion}</p>
                  <ul className="transport-list">
                    {items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}
