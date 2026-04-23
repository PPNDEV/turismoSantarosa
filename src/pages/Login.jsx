import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaExclamationTriangle,
  FaUserShield,
  FaLock,
  FaEnvelope,
  FaCheckCircle,
} from "react-icons/fa";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/useLanguage";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
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

  const demoUsers = [
    {
      email: "admin@santarosa.ec",
      password: "admin123",
      role: "Administrador",
    },
    { email: "editor@santarosa.ec", password: "editor123", role: "Editor" },
    {
      email: "visualizador@santarosa.ec",
      password: "viewer123",
      role: "Visualizador",
    },
  ];

  const fillDemoCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo-icon">
              <FaUserShield aria-hidden="true" />
            </div>
            <h1>{t("login.title")}</h1>
            <p className="login-subtitle">{t("login.subtitle")}</p>
          </div>

          {error && (
            <div className="login-error">
              <FaExclamationTriangle
                className="inline-icon"
                aria-hidden="true"
              />
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-login"
              disabled={loading}
            >
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

          <div className="login-divider">
            <span>{t("login.or")}</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowDemo(!showDemo)}
            disabled={loading}
          >
            {showDemo ? "Ocultar" : "Ver"} credenciales de demo
          </button>

          {showDemo && (
            <div className="demo-credentials">
              <p className="demo-title">Usuarios de prueba disponibles:</p>
              {demoUsers.map((user, idx) => (
                <div key={idx} className="demo-user">
                  <div className="demo-info">
                    <p>
                      <strong>{user.role}</strong>
                    </p>
                    <p className="demo-email">{user.email}</p>
                    <p className="demo-pass">Pass: {user.password}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() =>
                      fillDemoCredentials(user.email, user.password)
                    }
                    disabled={loading}
                  >
                    <FaCheckCircle /> Usar
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="login-info">
            💡 <strong>Nota:</strong> El login está configurado para funcionar
            con Firebase Auth. Si Firebase está en modo anónimo, se usarán
            credenciales locales.
          </p>
        </div>

        <div className="login-info-panel">
          <h3>🔐 Centro de Administración</h3>
          <ul>
            <li>
              <FaCheckCircle /> Gestión de contenidos CMS
            </li>
            <li>
              <FaCheckCircle /> Usuarios y roles
            </li>
            <li>
              <FaCheckCircle /> Analytics y visitantes
            </li>
            <li>
              <FaCheckCircle /> Autenticación segura con Firebase
            </li>
            <li>
              <FaCheckCircle /> Datos sincronizados en Firestore
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
