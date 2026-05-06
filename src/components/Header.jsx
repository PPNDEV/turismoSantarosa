import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaChevronDown,
  FaYoutube,
  FaXTwitter,
} from "react-icons/fa6";
import { FaCog, FaLock } from "react-icons/fa";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/useLanguage";

const navLinks = [
  { key: "home", to: "/" },
  { key: "gastronomy", to: "/gastronomia" },
  { key: "lodging", to: "/hospedaje" },
  { key: "transport", to: "/transporte" },
  { key: "events", to: "/eventos" },
  { key: "floraFauna", to: "/flora-fauna" },
  { key: "activities", to: "/actividades" },
  { key: "gallery", to: "/galeria" },
];

const crestSrc = `${import.meta.env.BASE_URL}escudo-vector-02-247x300.png`;

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

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { user, logout } = useAuth();
  const { availableLanguages, language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const languageMenuRef = useRef(null);
  const isHome = location.pathname === "/";
  const currentLocation = `${location.pathname}${location.hash}`;

  const activeLanguage = useMemo(
    () =>
      availableLanguages.find(
        (languageOption) => languageOption.code === language,
      ) || availableLanguages[0],
    [availableLanguages, language],
  );

  useEffect(() => {
    const onScroll = () => {
      setHidden(window.scrollY > 20);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(event.target)
      ) {
        setLanguageMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <>
      {/* Barra redes sociales flotante */}
      <div className="floating-social" aria-label={t("header.socialLabel")}>
        {socialLinks.map(({ label, href, icon, className }) => (
          <a
            key={label}
            className={`float-social-btn ${className}`}
            href={href}
            target="_blank"
            rel="noreferrer"
            title={label}
            aria-label={label}
          >
            {createElement(icon)}
          </a>
        ))}
      </div>

      <header
        className={`header ${hidden ? "header-hidden" : isHome ? "header-home" : "header-page"}`}
      >
        <div className="header-inner">
          {/* Logo */}
          <Link to="/" className="logo">
            <div className="logo-icon">
              <img
                src={crestSrc}
                alt={t("header.logoAlt")}
                className="logo-image"
                decoding="async"
                fetchPriority="high"
              />
            </div>
            <div className="logo-text">
              <div className="logo-title">{t("header.logoTitle")}</div>
              <div className="logo-subtitle">{t("header.logoSubtitle")}</div>
            </div>
          </Link>

          {/* Nav */}
          <nav className={`nav ${menuOpen ? "open" : ""}`}>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link ${
                  link.to === "/"
                    ? location.pathname === "/" && !location.hash
                      ? "active"
                      : ""
                    : currentLocation === link.to
                      ? "active"
                      : ""
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {t(`header.nav.${link.key}`)}
              </Link>
            ))}
          </nav>

          {/* Acciones */}
          <div className="header-actions">
            <div className="language-picker" ref={languageMenuRef}>
              <button
                type="button"
                className="language-picker-trigger"
                aria-label={t("header.languageSwitcherAria")}
                aria-expanded={languageMenuOpen}
                aria-haspopup="menu"
                onClick={() => setLanguageMenuOpen((current) => !current)}
              >
                <span className="language-picker-label">IDIOMA</span>
                <span className="language-picker-value">
                  <img
                    src={activeLanguage?.flagIcon}
                    alt=""
                    aria-hidden="true"
                    className="language-picker-flag"
                    decoding="async"
                  />
                  <span>{activeLanguage?.label}</span>
                </span>
                <FaChevronDown
                  className="language-picker-chevron"
                  aria-hidden="true"
                />
              </button>

              <div
                className={`language-picker-menu ${languageMenuOpen ? "open" : ""}`}
                role="menu"
                aria-label={t("header.languageSwitcherAria")}
              >
                {availableLanguages.map((languageOption) => (
                  <button
                    key={languageOption.code}
                    type="button"
                    className={`language-picker-item ${language === languageOption.code ? "active" : ""}`}
                    onClick={() => {
                      setLanguage(languageOption.code);
                      setLanguageMenuOpen(false);
                    }}
                    role="menuitemradio"
                    aria-checked={language === languageOption.code}
                  >
                    <img
                      src={languageOption.flagIcon}
                      alt=""
                      aria-hidden="true"
                      className="language-picker-item-flag"
                      decoding="async"
                    />
                    <span>{languageOption.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {user ? (
              <>
                <Link to="/admin" className="nav-link admin-link">
                  <FaCog className="inline-icon" aria-hidden="true" />
                  {t("header.admin")}
                </Link>
                <button onClick={logout} className="btn btn-outline btn-outline-light">
                  {t("header.logout")}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="nav-link nav-link-muted"
              >
                <FaLock className="inline-icon" aria-hidden="true" />
                {t("header.admin")}
              </Link>
            )}
            <button
              className="hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={t("header.menu")}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
