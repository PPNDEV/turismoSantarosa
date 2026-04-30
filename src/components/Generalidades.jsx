import {
  FaClock,
  FaDollarSign,
  FaFlag,
  FaLanguage,
  FaMap,
  FaMountain,
  FaThermometerHalf,
  FaUsers,
} from "react-icons/fa";
import { useLanguage } from "../context/useLanguage";

export default function Generalidades() {
  const { t } = useLanguage();

  const datos = [
    { icon: FaMountain, label: t("generalidades.altitude"), value: "6 msnm" },
    { icon: FaUsers, label: t("generalidades.population"), value: "~70.000" },
    { icon: FaMap, label: t("generalidades.province"), value: "El Oro" },
    { icon: FaDollarSign, label: t("generalidades.currency"), value: "USD" },
    {
      icon: FaThermometerHalf,
      label: t("generalidades.temperature"),
      value: "24–32 °C",
    },
    { icon: FaClock, label: t("generalidades.timeZone"), value: "UTC−5" },
    {
      icon: FaLanguage,
      label: t("generalidades.language"),
      value: t("generalidades.languageValue"),
    },
    {
      icon: FaFlag,
      label: t("generalidades.country"),
      value: t("generalidades.countryValue"),
    },
  ];

  return (
    <div className="generalidades-banner">
      <div className="container">
        <div className="section-header reveal">
          <h2 className="section-title section-title-light">
            {t("generalidades.titleStart")}{" "}
            <span className="accent-gold">
              {t("generalidades.titleAccent")}
            </span>
          </h2>
          <p className="section-subtitle section-subtitle-muted">
            {t("generalidades.subtitle")}
          </p>
        </div>
        <div className="generalidades-grid">
          {datos.map((d, i) => (
            <div key={i} className="general-card reveal">
              <div className="general-icon">
                <d.icon aria-hidden="true" />
              </div>
              <div className="general-value">{d.value}</div>
              <div className="general-label">{d.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
