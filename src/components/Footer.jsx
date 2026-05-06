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
import { useContent } from "../context/useContent";

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/municipiosr/",
    icon: FaFacebookF,
    className: "social-facebook",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/channel/UCgaGV99aMfrmnThzoO1dqJg",
    icon: FaYoutube,
    className: "social-youtube",
  },
  {
    label: "X",
    href: "https://twitter.com/municipiosr",
    icon: FaXTwitter,
    className: "social-x",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/gad_santarosa_ec/",
    icon: FaInstagram,
    className: "social-instagram",
  },
];

const crestSrc = `${import.meta.env.BASE_URL}escudo-vector-02-247x300.png`;

export default function Footer() {
  const [form, setForm] = useState({ nombre: "", email: "", mensaje: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const { t } = useLanguage();
  const { enviarMensajeContacto } = useContent();

  const normalizeText = (value) =>
    String(value || "")
      .replace(/\s+/g, " ")
      .trim();

  const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (sending) {
      return;
    }

    const nombre = normalizeText(form.nombre).slice(0, 80);
    const email = normalizeText(form.email).slice(0, 120);
    const mensaje = normalizeText(form.mensaje).slice(0, 1000);

    if (!nombre || !email || !mensaje) {
      setError("Completa todos los campos.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Correo invalido.");
      return;
    }

    setSending(true);
    try {
      await enviarMensajeContacto({
        remitente: nombre,
        correo: email,
        consulta_sugerencia: mensaje,
      });
      setSent(true);
      setForm({ nombre: "", email: "", mensaje: "" });
      setTimeout(() => setSent(false), 4000);
    } catch {
      setError("No se pudo enviar el mensaje. Intenta mas tarde.");
    } finally {
      setSending(false);
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="logo footer-logo">
              <div className="logo-icon">
                <img
                  src={crestSrc}
                  alt={t("header.logoAlt")}
                  className="logo-image"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="logo-text">
                <div className="logo-title">{t("header.logoTitle")}</div>
                <div className="logo-subtitle">{t("header.logoSubtitle")}</div>
              </div>
            </div>
            <p>{t("footer.brandDescription")}</p>
            <div className="footer-social">
              {socialLinks.map(({ label, href, icon, className }) => (
                <a
                  key={label}
                  href={href}
                  className={`social-btn ${className}`}
                  title={label}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
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
              <div className="footer-success">
                <FaCheckCircle className="inline-icon" aria-hidden="true" />
                {t("footer.messageSent")}
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                {error && (
                  <div
                    className="login-error form-error"
                    role="alert"
                    aria-live="polite"
                  >
                    {error}
                  </div>
                )}
                <input
                  type="text"
                  placeholder={t("footer.form.namePlaceholder")}
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  maxLength={80}
                  disabled={sending}
                />
                <input
                  type="email"
                  placeholder={t("footer.form.emailPlaceholder")}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  maxLength={120}
                  disabled={sending}
                />
                <textarea
                  placeholder={t("footer.form.messagePlaceholder")}
                  value={form.mensaje}
                  onChange={(e) =>
                    setForm({ ...form, mensaje: e.target.value })
                  }
                  required
                  maxLength={1000}
                  disabled={sending}
                />
                <button
                  type="submit"
                  className="btn btn-gold btn-full"
                  disabled={sending}
                >
                  <FaPaperPlane className="inline-icon" aria-hidden="true" />
                  {sending ? "Enviando..." : t("footer.sendMessage")}
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
