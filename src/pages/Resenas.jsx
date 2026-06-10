import { useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaCommentDots,
  FaMapMarkerAlt,
  FaStar,
} from "react-icons/fa";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useContent } from "../context/useContent";
import { db } from "../services/firebase";

const REVIEW_TYPES = {
  isla: "Isla",
  establecimiento: "Establecimiento",
  atractivo: "Atractivo turistico",
};

const DEFAULT_ISLANDS = ["Jambeli", "Costa Rica", "San Gregorio", "Santa Clara"];

function Stars({ value, interactive = false, onChange }) {
  return (
    <span className={`review-stars ${interactive ? "is-interactive" : ""}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        if (!interactive) {
          return (
            <FaStar
              key={star}
              className={active ? "is-active" : ""}
              aria-hidden="true"
            />
          );
        }

        return (
          <button
            key={star}
            type="button"
            className={active ? "is-active" : ""}
            onClick={() => onChange(star)}
            aria-label={`${star} estrellas`}
          >
            <FaStar aria-hidden="true" />
          </button>
        );
      })}
    </span>
  );
}

function cleanText(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isValidCedula(value) {
  const cedula = String(value || "").replace(/\D/g, "");
  if (!/^\d{10}$/.test(cedula)) return false;

  const province = Number(cedula.slice(0, 2));
  const thirdDigit = Number(cedula[2]);
  if (province < 1 || province > 24 || thirdDigit > 5) return false;

  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const total = coefficients.reduce((sum, coefficient, index) => {
    const product = Number(cedula[index]) * coefficient;
    return sum + (product >= 10 ? product - 9 : product);
  }, 0);
  const verifier = total % 10 === 0 ? 0 : 10 - (total % 10);

  return verifier === Number(cedula[9]);
}

export default function ResenasPage() {
  const {
    gastronomia = [],
    hospedajes = [],
    actividades = [],
  } = useContent();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewFilter, setReviewFilter] = useState("todos");
  const [form, setForm] = useState({
    nombre: "",
    cedula: "",
    tipoObjetivo: "isla",
    objetivoId: "isla-jambeli",
    calificacion: 5,
    opinion: "",
  });

  const targets = useMemo(() => {
    const islands = [
      ...new Set(
        [
          ...DEFAULT_ISLANDS,
          ...(Array.isArray(gastronomia)
            ? gastronomia.map((item) => item.isla)
            : []),
          ...(Array.isArray(hospedajes)
            ? hospedajes.map((item) => item.isla)
            : []),
          ...(Array.isArray(actividades)
            ? actividades.map((item) => item.isla)
            : []),
        ]
          .filter(Boolean)
          .map((item) => cleanText(item, 80)),
      ),
    ].map((isla) => ({
      id: `isla-${isla.toLowerCase().replace(/\s+/g, "-")}`,
      nombre: isla,
      isla,
      tipoObjetivo: "isla",
    }));

    const safeGastronomia = Array.isArray(gastronomia) ? gastronomia : [];
    const safeHospedajes = Array.isArray(hospedajes) ? hospedajes : [];
    const safeActividades = Array.isArray(actividades) ? actividades : [];

    const establecimientos = [...safeGastronomia, ...safeHospedajes].map((item) => ({
      id: item.id,
      nombre: item.nombre,
      isla: item.isla || item.ubicacion || "Santa Rosa",
      tipoObjetivo: "establecimiento",
    }));

    const atractivos = [...safeActividades].map((item) => ({
      id: item.id,
      nombre: item.nombre,
      isla: item.isla || "Santa Rosa",
      tipoObjetivo: "atractivo",
    }));

    return [...islands, ...establecimientos, ...atractivos].filter(
      (item) => item.id && item.nombre,
    );
  }, [actividades, gastronomia, hospedajes]);

  const targetOptions = targets.filter(
    (target) => target.tipoObjetivo === form.tipoObjetivo,
  );
  const selectedTarget =
    targetOptions.find((target) => target.id === form.objetivoId) ||
    targetOptions[0];
  const filteredReviews =
    reviewFilter === "todos"
      ? reviews
      : reviews.filter((review) => review.tipoObjetivo === reviewFilter);

  const selectReviewType = (tipoObjetivo) => {
    const nextTarget = targets.find(
      (target) => target.tipoObjetivo === tipoObjetivo,
    );
    setStatus("");
    setForm((current) => ({
      ...current,
      tipoObjetivo,
      objetivoId: nextTarget?.id || "",
    }));
  };

  useEffect(() => {
    let mounted = true;

    async function loadReviews() {
      const q = query(
        collection(db, "resenas_turisticas"),
        where("estado", "==", "aprobada"),
      );
      const snapshot = await getDocs(q);
      const nextReviews = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .sort((a, b) => {
          const aDate = a.fecha?.toMillis?.() || 0;
          const bDate = b.fecha?.toMillis?.() || 0;
          return bDate - aDate;
        });

      if (mounted) {
        setReviews(nextReviews);
        setLoading(false);
      }
    }

    void loadReviews().catch(() => {
      if (mounted) {
        setReviews([]);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const updateForm = (key, value) => {
    setStatus("");
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submitReview = async (event) => {
    event.preventDefault();
    const nombre = cleanText(form.nombre, 80);
    const cedula = String(form.cedula || "").replace(/\D/g, "");
    const opinion = cleanText(form.opinion, 600);

    if (!nombre || !isValidCedula(cedula) || opinion.length < 10 || !selectedTarget) {
      setStatus("Completa tu nombre real, cedula valida y una opinion mas detallada.");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "resenas_turisticas"), {
        nombre,
        cedula,
        tipoObjetivo: form.tipoObjetivo,
        objetivoId: selectedTarget.id,
        objetivoNombre: cleanText(selectedTarget.nombre, 120),
        isla: cleanText(selectedTarget.isla, 80),
        calificacion: Number(form.calificacion),
        opinion,
        estado: "pendiente",
        fecha: serverTimestamp(),
      });

      setForm((current) => ({
        ...current,
        nombre: "",
        cedula: "",
        calificacion: 5,
        opinion: "",
      }));
      setStatus("Gracias. Tu resena quedo pendiente de aprobacion.");
    } catch {
      setStatus("No se pudo enviar la resena. Intentalo nuevamente.");
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
            <FaCommentDots className="inline-icon" aria-hidden="true" />
            Reseñas turisticas
          </h1>
        </div>

        <main className="container reviews-page">
          <section className="reviews-form-card">
            <div className="reviews-form-copy">
              <span className="badge badge-ocean">Opinion visitante</span>
              <h2>Comparte tu experiencia</h2>
              <p>
                Tu comentario se publica cuando el administrador lo aprueba.
              </p>
            </div>

            <form className="reviews-form" onSubmit={submitReview}>
              <label>
                <span>Nombre</span>
                <input
                  value={form.nombre}
                  onChange={(event) => updateForm("nombre", event.target.value)}
                  placeholder="Nombre y apellido"
                  maxLength={80}
                />
              </label>

              <label>
                <span>Cedula</span>
                <input
                  value={form.cedula}
                  onChange={(event) =>
                    updateForm(
                      "cedula",
                      event.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  placeholder="10 digitos"
                  inputMode="numeric"
                  maxLength={10}
                />
              </label>

              <div className="reviews-type-field">
                <span>Resena por</span>
                <div className="reviews-type-options">
                  {Object.entries(REVIEW_TYPES).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={form.tipoObjetivo === value ? "active" : ""}
                      onClick={() => selectReviewType(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="reviews-form-row">
                <label className="reviews-target-field">
                  <span>{REVIEW_TYPES[form.tipoObjetivo]}</span>
                  <select
                    value={selectedTarget?.id || ""}
                    onChange={(event) =>
                      updateForm("objetivoId", event.target.value)
                    }
                  >
                    {targetOptions.map((target) => (
                      <option key={`${target.tipoObjetivo}-${target.id}`} value={target.id}>
                        {target.nombre}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                <span>Calificacion</span>
                <Stars
                  value={form.calificacion}
                  interactive
                  onChange={(value) => updateForm("calificacion", value)}
                />
              </label>

              <label>
                <span>Opinion</span>
                <textarea
                  value={form.opinion}
                  onChange={(event) => updateForm("opinion", event.target.value)}
                  placeholder="Cuenta que te gusto, que recomiendas o como fue tu visita."
                  maxLength={600}
                  rows={5}
                />
              </label>

              {status && (
                <p className="reviews-form-status">
                  <FaCheckCircle className="inline-icon" aria-hidden="true" />
                  {status}
                </p>
              )}

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Enviando..." : "Enviar resena"}
              </button>
            </form>
          </section>

          <section className="reviews-list-section">
            <div className="reviews-list-header">
              <div>
                <h2>Reseñas aprobadas</h2>
                <span>{filteredReviews.length} publicadas</span>
              </div>
              <div className="reviews-list-filters" aria-label="Filtrar reseñas">
                <button
                  type="button"
                  className={reviewFilter === "todos" ? "active" : ""}
                  onClick={() => setReviewFilter("todos")}
                >
                  Todas
                </button>
                {Object.entries(REVIEW_TYPES).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={reviewFilter === value ? "active" : ""}
                    onClick={() => setReviewFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="eventos-empty">Cargando reseñas...</div>
            ) : reviews.length === 0 ? (
              <div className="eventos-empty">
                Aun no hay reseñas aprobadas para mostrar.
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="eventos-empty">
                No hay reseñas aprobadas en esta categoria.
              </div>
            ) : (
              <div className="reviews-grid">
                {filteredReviews.map((review) => (
                  <article key={review.id} className="review-card">
                    <div className="review-card-top">
                      <Stars value={review.calificacion || 0} />
                      <span>{REVIEW_TYPES[review.tipoObjetivo] || "Resena"}</span>
                    </div>
                    <h3>{review.objetivoNombre}</h3>
                    <p>{review.opinion}</p>
                    <div className="review-card-footer">
                      <strong>{review.nombre}</strong>
                      <span>
                        <FaMapMarkerAlt className="inline-icon" aria-hidden="true" />
                        {review.isla || "Santa Rosa"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}
