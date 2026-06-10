import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaEnvelope,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaLock,
} from "react-icons/fa";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/useLanguage";

const crestSrc = `${import.meta.env.BASE_URL}escudo-santa-rosa.png`;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(err.message || t("login.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <button
        type="button"
        className="login-back-button"
        onClick={() => navigate("/")}
        aria-label="Regresar a la pagina principal"
      >
        <FaArrowLeft aria-hidden="true" />
      </button>

      <div className="login-glass">
        <div className="login-glass__brand">
          <img
            src={crestSrc}
            alt="Escudo de Santa Rosa"
            className="login-glass__crest"
            width="104"
            height="104"
            loading="eager"
          />
          <span className="login-glass__brand-name">Santa Rosa</span>
          <span className="login-glass__brand-sub">El Oro · Ecuador</span>
        </div>

        <div className="login-glass__header">
          <span className="login-eyebrow">
            <FaLock aria-hidden="true" />
            {t("login.eyebrow")}
          </span>
          <h1>{t("login.title")}</h1>
          <p className="login-subtitle">{t("login.brandTagline")}</p>
        </div>

        {error && (
          <div className="login-error">
            <FaExclamationTriangle className="inline-icon" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">{t("login.emailLabel")}</label>
            <div className="input-wrapper">
              <FaEnvelope className="input-icon" aria-hidden="true" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@santarosa.ec"
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">{t("login.passwordLabel")}</label>
            <div className="input-wrapper">
              <FaLock className="input-icon" aria-hidden="true" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={loading}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <FaEyeSlash aria-hidden="true" />
                ) : (
                  <FaEye aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                {t("login.loading")}
              </>
            ) : (
              <>{t("login.enterButton")} →</>
            )}
          </button>
        </form>

        <p className="login-register-hint">
          ¿Eres un comerciante local?{" "}
          <Link to="/registro-editor">Solicita una cuenta de editor</Link>
        </p>
      </div>

      <p className="login-footer">{t("footer.bottomCopyright")}</p>
    </div>
  );
}
