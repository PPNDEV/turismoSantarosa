import { createElement, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaXTwitter,
} from "react-icons/fa6";
import {
  FaCheckCircle,
  FaClock,
  FaEnvelope,
  FaHeart,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaPhoneAlt,
} from "react-icons/fa";
import { useLanguage } from "../context/useLanguage";

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/municipiosr/",
    icon: FaFacebookF,
    background: "#1877F2",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/channel/UCgaGV99aMfrmnThzoO1dqJg",
    icon: FaYoutube,
    background: "#FF0000",
  },
  {
    label: "X",
    href: "https://twitter.com/municipiosr",
    icon: FaXTwitter,
    background: "#111827",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/gad_santarosa_ec/",
    icon: FaInstagram,
    background:
      "linear-gradient(135deg, #f58529 0%, #dd2a7b 42%, #8134af 72%, #515bd4 100%)",
  },
];

const crestSrc = `${import.meta.env.BASE_URL}escudo-vector-02-247x300.png`;

export default function Footer() {
  const [form, setForm] = useState({ nombre: "", email: "", mensaje: "" });
  const [sent, setSent] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = (e) => {
    e.preventDefault();
    // En producción: guardar en Firestore
    setSent(true);
    setForm({ nombre: "", email: "", mensaje: "" });
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="logo" style={{ marginBottom: "1rem" }}>
              <div className="logo-icon">
                <img
                  src={crestSrc}
                  alt={t("header.logoAlt")}
                  className="logo-image"
                />
              </div>
              <div className="logo-text">
                <div className="logo-title">{t("header.logoTitle")}</div>
                <div className="logo-subtitle">{t("header.logoSubtitle")}</div>
              </div>
            </div>
            <p>{t("footer.brandDescription")}</p>
            <div className="footer-social">
              {socialLinks.map(({ label, href, icon, background }) => (
                <a
                  key={label}
                  href={href}
                  className="social-btn"
                  title={label}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                  style={{ background }}
                >
                  {createElement(icon)}
                </a>
              ))}
            </div>
          </div>

          {/* Links rápidos */}
          <div>
            <h4>{t("footer.discoverTitle")}</h4>
            <ul className="footer-links">
              <li>
                <Link to="/destinos">{t("footer.links.destinations")}</Link>
              </li>
              <li>
                <Link to="/eventos">{t("footer.links.events")}</Link>
              </li>
              <li>
                <Link to="/informacion">{t("footer.links.touristInfo")}</Link>
              </li>
              <li>
                <Link to="/galeria">{t("footer.links.gallery")}</Link>
              </li>
              <li>
                <Link to="/blog">{t("footer.links.blog")}</Link>
              </li>
              <li>
                <Link to="/#como-llegar">{t("footer.links.howToGet")}</Link>
              </li>
              <li>
                <Link to="/actividades">{t("footer.links.activities")}</Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4>{t("footer.contactTitle")}</h4>
            <div className="footer-contact-item">
              <FaMapMarkerAlt className="inline-icon" aria-hidden="true" />
              {t("footer.contact.location")}
            </div>
            <div className="footer-contact-item">
              <FaPhoneAlt className="inline-icon" aria-hidden="true" />
              {t("footer.contact.phone")}
            </div>
            <div className="footer-contact-item">
              <FaEnvelope className="inline-icon" aria-hidden="true" />
              {t("footer.contact.email")}
            </div>
            <div className="footer-contact-item">
              <FaClock className="inline-icon" aria-hidden="true" />
              {t("footer.contact.schedule")}
            </div>
          </div>

          {/* Formulario */}
          <div>
            <h4>{t("footer.writeUsTitle")}</h4>
            {sent ? (
              <div
                style={{
                  background: "rgba(10,126,164,0.2)",
                  border: "1px solid var(--ocean)",
                  borderRadius: "8px",
                  padding: "1rem",
                  color: "white",
                  fontSize: "0.88rem",
                }}
              >
                <FaCheckCircle className="inline-icon" aria-hidden="true" />
                {t("footer.messageSent")}
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder={t("footer.form.namePlaceholder")}
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder={t("footer.form.emailPlaceholder")}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <textarea
                  placeholder={t("footer.form.messagePlaceholder")}
                  value={form.mensaje}
                  onChange={(e) =>
                    setForm({ ...form, mensaje: e.target.value })
                  }
                  required
                />
                <button
                  type="submit"
                  className="btn btn-gold"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <FaPaperPlane className="inline-icon" aria-hidden="true" />
                  {t("footer.sendMessage")}
                </button>
              </form>
            )}
          </div>
        </div>

        <hr className="footer-divider" />
        <div className="footer-bottom">
          <span>{t("footer.bottomCopyright")}</span>
          <span>
            {t("footer.madeWith")}{" "}
            <FaHeart className="inline-icon" aria-hidden="true" />{" "}
            {t("footer.byTourismOffice")}
          </span>
        </div>
      </div>
    </footer>
  );
}
