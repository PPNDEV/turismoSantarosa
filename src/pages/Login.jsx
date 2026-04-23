import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaExclamationTriangle, FaUserShield } from "react-icons/fa";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/useLanguage";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    } catch {
      setError(t("login.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span>
            <FaUserShield aria-hidden="true" />
          </span>
          <h2>{t("login.title")}</h2>
          <p>{t("login.subtitle")}</p>
        </div>

        {error && (
          <div className="login-error">
            <FaExclamationTriangle className="inline-icon" aria-hidden="true" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t("login.emailLabel")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@santarosa.ec"
              required
            />
          </div>
          <div className="form-group">
            <label>{t("login.passwordLabel")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={loading}
          >
            {loading ? t("login.loading") : `${t("login.enterButton")} →`}
          </button>
        </form>

        <p className="login-hint">{t("login.hint")}</p>
      </div>
    </div>
  );
}
