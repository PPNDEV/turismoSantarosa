import { useEffect, useMemo, useState } from "react";
import { FaBus, FaPlane, FaSave, FaShip } from "react-icons/fa";
import { useContent } from "../context/useContent";

const defaultCards = [
  {
    id: "terrestre",
    icono: "bus",
    titulo: "Conectividad Terrestre",
    descripcion:
      "Acceso desde las principales ciudades del Ecuador con multiples frecuencias diarias.",
    itemsText: [
      "Desde Guayaquil: 3h por la via Pasaje-Machala-Santa Rosa",
      "Desde Cuenca: 4h por la ruta Loja-Machala",
      "Desde Loja: 3.5h por la carretera panamericana",
      "Terminal Terrestre en el centro de la ciudad",
      "Operadoras: Rutas Orenses, TACsa, Panamericana",
    ].join("\n"),
    order: 0,
    activo: true,
  },
  {
    id: "maritimo",
    icono: "ship",
    titulo: "Conectividad Maritima",
    descripcion:
      "Acceso al Archipielago de Jambeli desde los puertos mas cercanos a Santa Rosa.",
    itemsText: [
      "Puerto Hualtaco -> Isla Jambeli: 30 min en lancha",
      "Puerto Bolivar -> Islas del archipielago: 45-60 min",
      "Salidas regulares desde las 7h00 hasta las 17h00",
      "Tarifas accesibles: desde $2 por trayecto",
      "Verificar condiciones climaticas antes de viajar",
    ].join("\n"),
    order: 1,
    activo: true,
  },
  {
    id: "aereo",
    icono: "plane",
    titulo: "Via Aerea",
    descripcion:
      "El aeropuerto mas cercano es el de Machala, a solo 20 minutos de Santa Rosa.",
    itemsText: [
      "Aeropuerto Santa Rosa (IATA: ETR) - vuelos regionales",
      "Aeropuerto Machala: vuelos desde Quito y Guayaquil",
      "LATAM y AeroPaul operan rutas nacionales",
      "Taxis y buses locales desde el aeropuerto",
    ].join("\n"),
    order: 2,
    activo: true,
  },
];

const iconOptions = [
  { value: "bus", label: "Bus", Icon: FaBus },
  { value: "ship", label: "Barco", Icon: FaShip },
  { value: "plane", label: "Avion", Icon: FaPlane },
];

const defaultIntro = {
  id: "main",
  tituloInicio: "Como",
  tituloAcento: "Llegar",
  signo: "?",
  subtitulo:
    "Santa Rosa, La Benemerita, te espera. Aqui todas las rutas para llegar.",
  tarjetasTitulo: "Tarjetas de conectividad",
};

function mergeCards(savedCards) {
  return defaultCards.map((card) => {
    const saved = savedCards.find((item) => item.id === card.id);
    return { ...card, ...saved };
  });
}

function hasDraftChanges(a, b) {
  return JSON.stringify(a) !== JSON.stringify(b);
}

export default function AdminComoLlegar({
  canEdit = true,
  onLivePreviewChange = () => {},
  onDirtyChange = () => {},
}) {
  const {
    comoLlegar,
    comoLlegarIntro,
    upsertComoLlegar,
    upsertComoLlegarIntro,
  } = useContent();
  const [drafts, setDrafts] = useState({});
  const [introDraft, setIntroDraft] = useState({});
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const baseCards = useMemo(() => mergeCards(comoLlegar), [comoLlegar]);
  const baseIntro = useMemo(
    () => ({ ...defaultIntro, ...(comoLlegarIntro[0] || {}) }),
    [comoLlegarIntro],
  );
  const intro = useMemo(
    () => ({ ...baseIntro, ...introDraft }),
    [baseIntro, introDraft],
  );
  const cards = useMemo(
    () =>
      baseCards.map((card) => ({
        ...card,
        ...(drafts[card.id] || {}),
      })),
    [baseCards, drafts],
  );

  useEffect(() => {
    onDirtyChange(
      hasDraftChanges(cards, baseCards) || hasDraftChanges(intro, baseIntro),
    );
  }, [cards, baseCards, intro, baseIntro, onDirtyChange]);

  useEffect(() => {
    onLivePreviewChange({
      section: "como-llegar",
      path: "/#como-llegar",
      image: null,
      badge: "Como llegar",
      title: "Tres tarjetas de rutas",
      subtitle: intro.subtitulo,
      body: "Edita el encabezado y las tres tarjetas de la pagina principal.",
      status: canEdit ? "Editable" : "Solo lectura",
    });

    return () => {
      onDirtyChange(false);
      onLivePreviewChange(null);
    };
  }, [canEdit, intro.subtitulo, onDirtyChange, onLivePreviewChange]);

  const updateIntro = (field, value) => {
    setIntroDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateCard = (id, field, value) => {
    setDrafts((previous) => ({
      ...previous,
      [id]: {
        ...(previous[id] || {}),
        [field]: value,
      },
    }));
  };

  const saveCard = async (card) => {
    if (!canEdit || savingId) return;

    const titulo = String(card.titulo || "").trim();
    const descripcion = String(card.descripcion || "").trim();
    const itemsText = String(card.itemsText || "").trim();

    if (!titulo || !descripcion || !itemsText) {
      setError("Completa titulo, descripcion e items antes de guardar.");
      return;
    }

    setSavingId(card.id);
    setError("");
    setMessage("");

    try {
      await upsertComoLlegar({
        ...card,
        titulo,
        descripcion,
        itemsText,
        id: card.id,
        activo: card.activo !== false,
      });
      setDrafts((previous) => {
        const nextDrafts = { ...previous };
        delete nextDrafts[card.id];
        return nextDrafts;
      });
      setMessage(`Tarjeta "${titulo}" guardada correctamente.`);
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar la tarjeta.");
    } finally {
      setSavingId("");
    }
  };

  const saveIntro = async () => {
    if (!canEdit || savingId) return;

    const tituloInicio = String(intro.tituloInicio || "").trim();
    const tituloAcento = String(intro.tituloAcento || "").trim();
    const signo = String(intro.signo || "").trim();
    const subtitulo = String(intro.subtitulo || "").trim();
    const tarjetasTitulo = String(intro.tarjetasTitulo || "").trim();

    if (!tituloInicio || !tituloAcento || !subtitulo || !tarjetasTitulo) {
      setError(
        "Completa titulo, palabra resaltada, subtitulo y titulo de tarjetas.",
      );
      return;
    }

    setSavingId("intro");
    setError("");
    setMessage("");

    try {
      await upsertComoLlegarIntro({
        id: "main",
        tituloInicio,
        tituloAcento,
        signo,
        subtitulo,
        tarjetasTitulo,
      });
      setIntroDraft({});
      setMessage("Encabezado guardado correctamente.");
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar el encabezado.");
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className="admin-table-card">
      <div className="admin-table-header">
        <h2>Como Llegar</h2>
      </div>

      {!canEdit && (
        <div className="admin-readonly-note">
          Modo visualizador: no puedes editar estas tarjetas.
        </div>
      )}

      {error && <div className="login-error">{error}</div>}
      {message && <div className="admin-success-note">{message}</div>}

      <div className="admin-route-intro">
        <div className="admin-route-intro-preview">
          <h3>
            {intro.tituloInicio}{" "}
            <span className="accent">{intro.tituloAcento}</span>
            {intro.signo}
          </h3>
          <p>{intro.subtitulo}</p>
        </div>

        <div className="admin-route-intro-grid">
          <div className="modal-field">
            <label>Titulo inicial</label>
            <input
              value={intro.tituloInicio}
              onChange={(event) =>
                updateIntro("tituloInicio", event.target.value)
              }
              disabled={!canEdit}
            />
          </div>
          <div className="modal-field">
            <label>Palabra resaltada</label>
            <input
              value={intro.tituloAcento}
              onChange={(event) =>
                updateIntro("tituloAcento", event.target.value)
              }
              disabled={!canEdit}
            />
          </div>
          <div className="modal-field">
            <label>Signo final</label>
            <input
              value={intro.signo}
              onChange={(event) => updateIntro("signo", event.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="modal-field">
          <label>Subtitulo</label>
          <textarea
            value={intro.subtitulo}
            onChange={(event) => updateIntro("subtitulo", event.target.value)}
            disabled={!canEdit}
          />
        </div>

        <div className="modal-field">
          <label>Titulo del bloque de tarjetas</label>
          <input
            value={intro.tarjetasTitulo}
            onChange={(event) =>
              updateIntro("tarjetasTitulo", event.target.value)
            }
            disabled={!canEdit}
          />
        </div>

        <div className="modal-actions">
          <button
            className="btn btn-primary"
            type="button"
            onClick={saveIntro}
            disabled={!canEdit || savingId === "intro"}
          >
            <FaSave className="inline-icon" aria-hidden="true" />
            {savingId === "intro" ? "Guardando..." : "Guardar encabezado"}
          </button>
        </div>
      </div>

      <div className="admin-table-subheader">
        <h3>
          {intro.tarjetasTitulo} ({cards.length})
        </h3>
      </div>

      <div className="admin-route-card-grid">
        {cards.map((card) => {
          const Icon =
            iconOptions.find((option) => option.value === card.icono)?.Icon ||
            FaBus;

          return (
            <article key={card.id} className="admin-route-card">
              <div className="admin-route-card-preview">
                <span className="transport-icon admin-route-icon">
                  <Icon aria-hidden="true" />
                </span>
                <div>
                  <h3>{card.titulo || "Titulo de la tarjeta"}</h3>
                  <p>{card.descripcion || "Descripcion de la tarjeta"}</p>
                </div>
              </div>

              <div className="modal-field">
                <label>Icono</label>
                <select
                  value={card.icono}
                  onChange={(event) =>
                    updateCard(card.id, "icono", event.target.value)
                  }
                  disabled={!canEdit}
                >
                  {iconOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-field">
                <label>Titulo</label>
                <input
                  type="text"
                  value={card.titulo}
                  onChange={(event) =>
                    updateCard(card.id, "titulo", event.target.value)
                  }
                  disabled={!canEdit}
                />
              </div>

              <div className="modal-field">
                <label>Descripcion</label>
                <textarea
                  value={card.descripcion}
                  onChange={(event) =>
                    updateCard(card.id, "descripcion", event.target.value)
                  }
                  disabled={!canEdit}
                />
              </div>

              <div className="modal-field">
                <label>Items de la lista, uno por linea</label>
                <textarea
                  value={card.itemsText}
                  onChange={(event) =>
                    updateCard(card.id, "itemsText", event.target.value)
                  }
                  disabled={!canEdit}
                  rows={6}
                />
              </div>

              <label className="modal-check-row">
                <input
                  type="checkbox"
                  checked={card.activo !== false}
                  onChange={(event) =>
                    updateCard(card.id, "activo", event.target.checked)
                  }
                  disabled={!canEdit}
                />
                <span>Mostrar esta tarjeta en la pagina principal</span>
              </label>

              <div className="modal-actions">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => saveCard(card)}
                  disabled={!canEdit || savingId === card.id}
                >
                  <FaSave className="inline-icon" aria-hidden="true" />
                  {savingId === card.id ? "Guardando..." : "Guardar tarjeta"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
