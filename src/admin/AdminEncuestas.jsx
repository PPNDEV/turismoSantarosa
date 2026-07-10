import { useCallback, useEffect, useState } from "react";
import {
  FaChartPie,
  FaFilePdf,
  FaStar,
  FaSyncAlt,
  FaTrash,
} from "react-icons/fa";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../services/firebase";

const PAGE_LIMIT = 50;

const visitorTypeLabels = {
  local: "Local",
  nacional: "Nacional",
  extranjero: "Extranjero",
};

const foundLabels = {
  si: "Si",
  parcialmente: "Parcialmente",
  no: "No",
};

function StarRating({ value }) {
  return (
    <span className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          className={`star-rating-icon ${star <= value ? "is-active" : ""}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function formatDate(date) {
  if (!date) return "-";
  return date.toLocaleDateString("es-EC", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function exportEncuestaPdf(encuesta) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const marginX = 18;
  let y = 22;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("Visit Santa Rosa", marginX, y);
  pdf.setFontSize(12);
  y += 7;
  pdf.text("Encuesta de Satisfaccion", marginX, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(
    `Generado: ${new Date().toLocaleString("es-EC")}`,
    pageWidth - marginX,
    y,
    { align: "right" },
  );
  y += 4;
  pdf.setDrawColor(180);
  pdf.line(marginX, y, pageWidth - marginX, y);
  y += 9;

  const writeField = (label, value) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(`${label}:`, marginX, y);
    pdf.setFont("helvetica", "normal");
    const lines = pdf.splitTextToSize(
      String(value || "-"),
      pageWidth - marginX * 2 - 52,
    );
    pdf.text(lines, marginX + 52, y);
    y += lines.length * 5.4 + 2.6;
  };

  writeField("Nombre", encuesta.nombre);
  writeField("Cedula / documento", encuesta.cedula);
  writeField(
    "Tipo de visitante",
    visitorTypeLabels[encuesta.visitorType] || encuesta.visitorType,
  );
  writeField("Pais de residencia", encuesta.country);
  writeField("Estado / provincia", encuesta.province);
  writeField("Celular", encuesta.phone);
  writeField("Correo electronico", encuesta.email);
  writeField("Fecha de registro", formatDate(encuesta.fecha));

  y += 3;
  pdf.setDrawColor(180);
  pdf.line(marginX, y, pageWidth - marginX, y);
  y += 9;

  writeField(
    "Facilidad de uso",
    encuesta.usabilityRating ? `${encuesta.usabilityRating} / 5` : "-",
  );
  writeField(
    "Diseno visual",
    encuesta.designRating ? `${encuesta.designRating} / 5` : "-",
  );
  writeField(
    "Informacion turistica",
    encuesta.informationRating ? `${encuesta.informationRating} / 5` : "-",
  );
  writeField(
    "Puntuacion general",
    encuesta.puntuacion ? `${encuesta.puntuacion} / 5` : "-",
  );
  writeField(
    "Encontro la informacion",
    foundLabels[encuesta.foundInformation] || encuesta.foundInformation,
  );
  writeField("Comentario", encuesta.comentarios || "Sin comentarios");

  pdf.setFontSize(8);
  pdf.setTextColor(120);
  pdf.text(`ID de encuesta: ${encuesta.id}`, marginX, 287);

  pdf.save(`encuesta-${encuesta.id}.pdf`);
}

export default function AdminEncuestas({
  onLivePreviewChange = () => {},
  onDirtyChange = () => {},
}) {
  const [encuestas, setEncuestas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEncuestas = useCallback(async () => {
    const q = query(
      collection(db, "encuestas_satisfaccion"),
      orderBy("fecha", "desc"),
      limit(PAGE_LIMIT),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        nombre: data.nombre || "",
        cedula: data.cedula || "",
        visitorType: data.visitor_type || "",
        country: data.country || "",
        province: data.province || data.city || "",
        phone: data.phone || "",
        email: data.email || "",
        usabilityRating: data.usability_rating || 0,
        designRating: data.design_rating || 0,
        informationRating: data.information_rating || 0,
        foundInformation: data.found_information || "",
        puntuacion: data.puntuacion || 0,
        comentarios: data.comentarios || data.comment || "",
        fecha: data.fecha?.toDate?.() || null,
      };
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    void fetchEncuestas()
      .then((nextEncuestas) => {
        if (isMounted) {
          setEncuestas(nextEncuestas);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fetchEncuestas]);

  const loadEncuestas = useCallback(async () => {
    setLoading(true);
    try {
      setEncuestas(await fetchEncuestas());
    } finally {
      setLoading(false);
    }
  }, [fetchEncuestas]);

  useEffect(
    () => () => {
      onDirtyChange(false);
      onLivePreviewChange(null);
    },
    [onDirtyChange, onLivePreviewChange],
  );

  const del = async (id) => {
    if (!confirm("Eliminar esta encuesta?")) {
      return;
    }

    try {
      const adminDeleteSurvey = httpsCallable(functions, "adminDeleteSurvey");
      await adminDeleteSurvey({ id });
      setEncuestas((current) =>
        current.filter((encuesta) => encuesta.id !== id),
      );
    } catch (error) {
      console.error("No se pudo eliminar la encuesta:", error);
      alert(
        error?.message ||
          "No se pudo eliminar la encuesta. Verifica tus permisos.",
      );
    }
  };

  const total = encuestas.length;
  const avg =
    total > 0
      ? (encuestas.reduce((sum, e) => sum + e.puntuacion, 0) / total).toFixed(1)
      : "0.0";
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: encuestas.filter((e) => e.puntuacion === star).length,
  }));

  return (
    <div>
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h2>
            <FaChartPie className="inline-icon" aria-hidden="true" />
            Encuestas de Satisfaccion ({total})
          </h2>
          <button
            type="button"
            className="btn btn-outline"
            onClick={loadEncuestas}
            disabled={loading}
          >
            <FaSyncAlt className="inline-icon" aria-hidden="true" />
            Actualizar
          </button>
        </div>

        <div className="admin-survey-summary">
          <div className="admin-survey-metric">
            <div className="admin-survey-value admin-survey-value-ocean">
              {avg}
            </div>
            <div className="admin-survey-label">
              Promedio
            </div>
            <StarRating value={Math.round(Number(avg))} />
          </div>
          <div className="admin-survey-metric">
            <div className="admin-survey-value admin-survey-value-gold">
              {total}
            </div>
            <div className="admin-survey-label">
              Total respuestas
            </div>
          </div>
          <div className="admin-survey-distribution">
            {distribution.map((d) => (
              <div key={d.star} className="admin-survey-dist-row">
                <span className="admin-survey-dist-star">
                  {d.star}*
                </span>
                <progress
                  className="admin-survey-progress"
                  value={d.count}
                  max={total || 1}
                />
                <span className="admin-survey-dist-count">
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {!loading && encuestas.length >= PAGE_LIMIT && (
          <p className="admin-inspector-muted admin-inspector-pad">
            Mostrando las {PAGE_LIMIT} encuestas mas recientes para reducir
            lecturas.
          </p>
        )}

        {loading ? (
          <div className="admin-loading-state">
            Cargando encuestas...
          </div>
        ) : encuestas.length === 0 ? (
          <div className="admin-loading-state">
            No hay encuestas de satisfaccion registradas.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Visitante</th>
                <th>Origen</th>
                <th>Puntuacion</th>
                <th>Comentarios</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {encuestas.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div>{e.nombre || <em>Sin nombre</em>}</div>
                    <small>{e.cedula || "Sin cedula"}</small>
                  </td>
                  <td>
                    <div>
                      {visitorTypeLabels[e.visitorType] || e.visitorType || "-"}
                    </div>
                    <small>
                      {[e.country, e.province].filter(Boolean).join(", ") ||
                        "-"}
                    </small>
                  </td>
                  <td>
                    <StarRating value={e.puntuacion} />
                  </td>
                  <td className="admin-comment-cell">
                    {e.comentarios || (
                      <em className="admin-comment-empty">
                        Sin comentarios
                      </em>
                    )}
                  </td>
                  <td>{formatDate(e.fecha)}</td>
                  <td>
                    <button
                      className="action-btn"
                      title="Exportar PDF"
                      onClick={() => exportEncuestaPdf(e)}
                    >
                      <FaFilePdf className="inline-icon" aria-hidden="true" />
                    </button>
                    <button
                      className="action-btn del-btn"
                      title="Eliminar"
                      onClick={() => del(e.id)}
                    >
                      <FaTrash className="inline-icon" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
