import { useEffect, useRef, useState } from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaIdCard,
  FaInfoCircle,
  FaPaperPlane,
  FaRedo,
  FaStar,
} from "react-icons/fa";
import { submitSurveyDirect } from "../services/satisfactionSurvey";

const initialForm = {
  nombre: "",
  cedula: "",
  visitor_type: "nacional",
  country: "",
  province: "",
  usability_rating: 0,
  design_rating: 0,
  information_rating: 0,
  found_information: "",
  comment: "",
  phone: "",
  email: "",
};

const visitorTypes = [
  { value: "nacional", label: "Nacional" },
  { value: "extranjero", label: "Extranjero" },
];

const foundOptions = [
  { value: "si", label: "Si" },
  { value: "parcialmente", label: "Parcialmente" },
  { value: "no", label: "No" },
];

const errorMessages = {
  "invalid-survey": "Revisa los campos obligatorios de la encuesta.",
  "invalid-cedula":
    "El numero de cedula o documento no parece valido. Revisalo e intenta de nuevo.",
  "invalid-contact":
    "El celular o correo ingresado no es valido. Recuerda que son opcionales: puedes dejarlos vacios.",
  "duplicate-response":
    "Ya recibimos una encuesta con esta cedula, gracias por participar. Si escribiste mal el numero, corrigelo y vuelve a enviar tu respuesta.",
  "captcha-required": "Confirma el captcha antes de enviar tu respuesta.",
  "captcha-failed":
    "No pudimos validar el captcha. Intenta nuevamente en unos segundos.",
  "rate-limited": "Hemos recibido muchos intentos. Espera unos minutos.",
  internal: "No pudimos procesar la encuesta. Intenta nuevamente.",
};

const CAPTCHA_SITE_KEY = import.meta.env.VITE_CAPTCHA_SITE_KEY || "";
const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

function normalizeCedula(value) {
  return value.trim().toUpperCase().replace(/[\s.-]/g, "");
}

function isValidCedula(cedula, visitorType) {
  if (visitorType === "nacional") {
    return /^\d{10}$/.test(cedula);
  }
  return /^[A-Z0-9]{5,20}$/.test(cedula);
}

function RatingInput({ label, value, onChange, disabled }) {
  return (
    <div className="survey-rating-field">
      <span>{label}</span>
      <div className="survey-stars" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={star <= value ? "is-active" : ""}
            onClick={() => onChange(star)}
            aria-label={`${star} de 5`}
            aria-checked={star === value}
            role="radio"
            disabled={disabled}
          >
            <FaStar aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusMessage({ status }) {
  if (!status?.text) return null;

  const icons = {
    success: FaCheckCircle,
    info: FaInfoCircle,
    error: FaExclamationCircle,
  };
  const Icon = icons[status.type] || FaExclamationCircle;
  return (
    <div className={`survey-status survey-status-${status.type}`} role="status">
      <Icon className="inline-icon" aria-hidden="true" />
      <span>{status.text}</span>
    </div>
  );
}

export default function SatisfactionSurvey() {
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState("form");
  const [status, setStatus] = useState(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef(null);
  const captchaWidgetRef = useRef(null);

  const isBusy = step === "sending";
  const isLocked = step !== "form";

  useEffect(() => {
    if (!CAPTCHA_SITE_KEY) return undefined;

    let cancelled = false;
    const renderWidget = () => {
      if (cancelled || captchaWidgetRef.current !== null) return;
      if (!captchaRef.current || !window.turnstile) return;
      captchaWidgetRef.current = window.turnstile.render(captchaRef.current, {
        sitekey: CAPTCHA_SITE_KEY,
        callback: (token) => setCaptchaToken(token),
        "expired-callback": () => setCaptchaToken(""),
        "error-callback": () => setCaptchaToken(""),
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      let script = document.querySelector(`script[src="${TURNSTILE_SRC}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = TURNSTILE_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", renderWidget);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const resetCaptcha = () => {
    setCaptchaToken("");
    if (captchaWidgetRef.current !== null && window.turnstile) {
      window.turnstile.reset(captchaWidgetRef.current);
    }
  };
  const cedulaLabel =
    form.visitor_type === "extranjero" ? "Cedula o pasaporte" : "Cedula";

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setStatus(null);
  };

  const getValidationMessage = () => {
    const missing = [];
    if (!form.nombre.trim()) missing.push("nombre completo");
    if (!form.cedula.trim()) missing.push("cedula");
    if (!form.country.trim()) missing.push("pais de residencia");
    if (!form.province.trim()) missing.push("estado o provincia");
    if (
      form.usability_rating < 1 ||
      form.design_rating < 1 ||
      form.information_rating < 1
    ) {
      missing.push("las calificaciones con estrellas");
    }
    if (!form.found_information) {
      missing.push("si encontraste la informacion que buscabas");
    }

    if (missing.length > 0) {
      return `Te falta completar: ${missing.join(", ")}.`;
    }

    if (!isValidCedula(normalizeCedula(form.cedula), form.visitor_type)) {
      return errorMessages["invalid-cedula"];
    }

    const phone = form.phone.trim().replace(/[^\d+]/g, "");
    if (form.phone.trim() && !/^\+?\d{7,15}$/.test(phone)) {
      return "El celular ingresado no parece valido. Es opcional, puedes dejarlo vacio.";
    }

    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return "El correo ingresado no parece valido. Es opcional, puedes dejarlo vacio.";
    }

    if (CAPTCHA_SITE_KEY && !captchaToken) {
      return errorMessages["captcha-required"];
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isBusy) return;

    const validationMessage = getValidationMessage();
    if (validationMessage) {
      setStatus({ type: "error", text: validationMessage });
      return;
    }

    setStep("sending");
    setStatus(null);

    try {
      await submitSurveyDirect({
        ...form,
        cedula: normalizeCedula(form.cedula),
        ...(captchaToken ? { captchaToken } : {}),
      });
      setStep("registered");
      setStatus({
        type: "success",
        text: "Gracias. Tu respuesta fue registrada correctamente.",
      });
    } catch (error) {
      const code = error?.data?.error || error?.message;
      setStep("form");
      resetCaptcha();
      if (error?.data?.state === "duplicada" || code === "duplicate-response") {
        setStatus({ type: "info", text: errorMessages["duplicate-response"] });
        return;
      }
      setStatus({
        type: "error",
        text: errorMessages[code] || "Ocurrio un error. Intenta nuevamente.",
      });
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setStep("form");
    setStatus(null);
    resetCaptcha();
  };

  return (
    <section className="satisfaction-survey-section">
      <div className="container">
        <div className="section-header reveal">
          <h2 className="section-title">
            Cuentanos como fue <span className="accent">tu experiencia</span>
          </h2>
          <p className="section-subtitle">
            Tu opinion nos ayuda a mejorar la pagina turistica. La encuesta es
            breve y no requiere iniciar sesion.
          </p>
        </div>

        <div className="survey-panel reveal">
          <div className="survey-copy">
            <div className="survey-privacy">
              <FaIdCard className="inline-icon" aria-hidden="true" />
              <p>
                Solo te pedimos la cedula para evitar encuestas duplicadas y
                que cada opinion cuente una sola vez. Tu celular y correo son
                opcionales, y ningun dato se comparte ni se usa para otro fin.
              </p>
            </div>
          </div>

          <form className="survey-form" onSubmit={handleSubmit} noValidate>
            <div className="survey-form-grid">
              <label>
                <span>Nombre completo</span>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(event) => updateField("nombre", event.target.value)}
                  placeholder="Ej. Maria Perez"
                  disabled={isLocked}
                />
              </label>

              <label>
                <span>{cedulaLabel}</span>
                <input
                  type="text"
                  value={form.cedula}
                  onChange={(event) => updateField("cedula", event.target.value)}
                  placeholder={
                    form.visitor_type === "extranjero"
                      ? "Documento de identidad"
                      : "Ej. 0701234567"
                  }
                  disabled={isLocked}
                />
              </label>
            </div>

            <div className="survey-choice-group">
              <span>Tipo de visitante</span>
              <div className="survey-segmented">
                {visitorTypes.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={
                      form.visitor_type === option.value ? "is-active" : ""
                    }
                    onClick={() => updateField("visitor_type", option.value)}
                    disabled={isLocked}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="survey-form-grid">
              <label>
                <span>Pais de residencia</span>
                <input
                  type="text"
                  value={form.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  placeholder="Ej. Ecuador"
                  disabled={isLocked}
                />
              </label>

              <label>
                <span>Estado o provincia</span>
                <input
                  type="text"
                  value={form.province}
                  onChange={(event) =>
                    updateField("province", event.target.value)
                  }
                  placeholder="Ej. El Oro"
                  disabled={isLocked}
                />
              </label>
            </div>

            <div className="survey-ratings">
              <RatingInput
                label="Facilidad de uso"
                value={form.usability_rating}
                onChange={(value) => updateField("usability_rating", value)}
                disabled={isLocked}
              />
              <RatingInput
                label="Diseno visual"
                value={form.design_rating}
                onChange={(value) => updateField("design_rating", value)}
                disabled={isLocked}
              />
              <RatingInput
                label="Informacion turistica"
                value={form.information_rating}
                onChange={(value) => updateField("information_rating", value)}
                disabled={isLocked}
              />
            </div>

            <div className="survey-choice-group">
              <span>Encontraste la informacion que buscabas?</span>
              <div className="survey-segmented">
                {foundOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={
                      form.found_information === option.value ? "is-active" : ""
                    }
                    onClick={() =>
                      updateField("found_information", option.value)
                    }
                    disabled={isLocked}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <label>
              <span>Comentario opcional</span>
              <textarea
                value={form.comment}
                onChange={(event) => updateField("comment", event.target.value)}
                placeholder="Cuentanos que podriamos mejorar"
                rows="3"
                disabled={isLocked}
              />
            </label>

            <div className="survey-form-grid">
              <label>
                <span>Celular (opcional)</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="+593999999999"
                  disabled={isLocked}
                />
              </label>

              <label>
                <span>Correo electronico (opcional)</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="nombre@correo.com"
                  disabled={isLocked}
                />
              </label>
            </div>

            {CAPTCHA_SITE_KEY ? (
              <div ref={captchaRef} className="survey-captcha" />
            ) : null}

            <StatusMessage status={status} />

            <div className="survey-actions">
              {step !== "registered" ? (
                <button type="submit" className="btn btn-gold" disabled={isBusy}>
                  <FaPaperPlane className="inline-icon" aria-hidden="true" />
                  {step === "sending" ? "Enviando..." : "Enviar respuesta"}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={resetForm}
                >
                  <FaRedo className="inline-icon" aria-hidden="true" />
                  Nueva encuesta
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
