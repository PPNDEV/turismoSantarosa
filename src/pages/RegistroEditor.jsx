import { useState } from "react";
import { Link } from "react-router-dom";
import { FaCheckCircle, FaStore } from "react-icons/fa";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { solicitarCuentaEditor } from "../services/editorAccount";

const ISLANDS = ["Jambelí", "Costa Rica", "San Gregorio", "Santa Clara"];
const CATEGORIES = [
  { value: "gastronomia", label: "Gastronomía / Restaurante" },
  { value: "hospedajes", label: "Hospedaje" },
  { value: "actividades", label: "Actividades turísticas" },
  { value: "eventos", label: "Eventos" },
  { value: "transporte", label: "Transporte fluvial" },
  { value: "floraFauna", label: "Naturaleza / Flora y fauna" },
  { value: "otro", label: "Otro" },
];

const emptyForm = {
  nombre: "",
  email: "",
  password: "",
  ruc: "",
  negocio: "",
  isla: "Jambelí",
  categoria: "gastronomia",
  telefono: "",
};

const ERROR_MESSAGES = {
  "already-exists": "Ya existe una cuenta con ese correo electrónico.",
};

export default function RegistroEditor() {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const update = (key, value) => {
    setError("");
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    const ruc = form.ruc.replace(/\D/g, "");
    if (!form.nombre.trim() || !form.negocio.trim()) {
      setError("Ingresa tu nombre y el nombre de tu negocio.");
      return;
    }
    if (ruc.length !== 13) {
      setError("El RUC debe tener 13 dígitos.");
      return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      await solicitarCuentaEditor({
        nombre: form.nombre.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        ruc,
        negocio: form.negocio.trim(),
        isla: form.isla,
        categoria: form.categoria,
        telefono: form.telefono.trim(),
      });
      setDone(true);
      setForm(emptyForm);
    } catch (err) {
      const code = String(err?.message || "").trim();
      setError(
        ERROR_MESSAGES[code] ||
          err?.message ||
          "No se pudo enviar la solicitud. Verifica tus datos e inténtalo de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="page-shell">
        <div className="page-banner">
          <h1 className="page-banner-title">
            <FaStore className="inline-icon" aria-hidden="true" />
            Registro de editores
          </h1>
        </div>

        <main className="container reviews-page">
          <section className="reviews-form-card">
            <div className="reviews-form-copy">
              <span className="badge badge-ocean">Comerciantes locales</span>
              <h2>Solicita tu acceso de editor</h2>
              {done ? (
                <p>
                  ¡Solicitud enviada! El GAD Municipal validará tu RUC. Cuando se
                  apruebe, podrás iniciar sesión y publicar la información de tu
                  negocio. Mientras tanto, tu cuenta queda en revisión.
                </p>
              ) : (
                <p>
                  Registra tu negocio del Archipiélago de Jambelí. Tu cuenta se
                  crea en modo revisión: podrás publicar una vez que el
                  administrador valide tu RUC.
                </p>
              )}
            </div>

            {done ? (
              <div className="reviews-form-status">
                <FaCheckCircle className="inline-icon" aria-hidden="true" />
                <span>
                  Ya puedes <Link to="/login">iniciar sesión</Link> con tu
                  correo. Verás un aviso de cuenta en revisión hasta la
                  aprobación.
                </span>
              </div>
            ) : (
              <form className="reviews-form" onSubmit={submit}>
                <label>
                  <span>Nombre y apellido</span>
                  <input
                    value={form.nombre}
                    onChange={(e) => update("nombre", e.target.value)}
                    placeholder="Tu nombre completo"
                    maxLength={120}
                    autoComplete="name"
                  />
                </label>

                <label>
                  <span>Nombre del negocio</span>
                  <input
                    value={form.negocio}
                    onChange={(e) => update("negocio", e.target.value)}
                    placeholder="Ej: Hostería Brisa Jambelí"
                    maxLength={160}
                  />
                </label>

                <label>
                  <span>RUC (13 dígitos)</span>
                  <input
                    value={form.ruc}
                    onChange={(e) =>
                      update("ruc", e.target.value.replace(/\D/g, "").slice(0, 13))
                    }
                    placeholder="0790000000001"
                    inputMode="numeric"
                    maxLength={13}
                  />
                </label>

                <div className="reviews-form-row">
                  <label className="reviews-target-field">
                    <span>Isla</span>
                    <select
                      value={form.isla}
                      onChange={(e) => update("isla", e.target.value)}
                    >
                      {ISLANDS.map((isla) => (
                        <option key={isla} value={isla}>
                          {isla}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="reviews-target-field">
                    <span>Categoría</span>
                    <select
                      value={form.categoria}
                      onChange={(e) => update("categoria", e.target.value)}
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  <span>Teléfono / contacto (opcional)</span>
                  <input
                    value={form.telefono}
                    onChange={(e) => update("telefono", e.target.value)}
                    placeholder="+593 ..."
                    maxLength={40}
                    inputMode="tel"
                  />
                </label>

                <label>
                  <span>Correo electrónico</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    autoComplete="email"
                  />
                </label>

                <label>
                  <span>Contraseña</span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                  />
                </label>

                {error && (
                  <p className="reviews-form-status" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Enviando..." : "Enviar solicitud"}
                </button>

                <p className="reviews-form-hint">
                  ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
                </p>
              </form>
            )}
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}
