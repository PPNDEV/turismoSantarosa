import { useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaEnvelope,
  FaExclamationCircle,
  FaLock,
  FaMobileAlt,
  FaPaperPlane,
  FaRedo,
  FaStar,
} from "react-icons/fa";
import {
  sendSurveyOtp,
  verifySurveyOtp,
} from "../services/satisfactionSurvey";

const initialForm = {
  country: "",
  city: "",
  visitor_type: "nacional",
  usability_rating: 0,
  design_rating: 0,
  information_rating: 0,
  found_information: "",
  comment: "",
  verification_method: "email",
  contact: "",
};

const visitorTypes = [
  { value: "local", label: "Local" },
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
  "invalid-contact": "Ingresa un correo o telefono valido para recibir el codigo.",
  "duplicate-response": "Ya existe una respuesta registrada con ese contacto.",
  "otp-invalid": "El codigo ingresado no coincide. Intentalo nuevamente.",
  "otp-expired": "El codigo expiro. Solicita uno nuevo para continuar.",
  "rate-limited": "Hemos recibido muchos intentos. Espera unos minutos.",
  internal: "No pudimos procesar la encuesta. Intenta nuevamente.",
};

function RatingInput({ label, value, onChange }) {
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
          >
            <FaStar aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusMessage({ type, children }) {
  if (!children) return null;

  const Icon = type === "success" ? FaCheckCircle : FaExclamationCircle;
  return (
    <div className={`survey-status survey-status-${type}`} role="status">
      <Icon className="inline-icon" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export default function SatisfactionSurvey() {
  const [form, setForm] = useState(initialForm);
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [step, setStep] = useState("form");
  const [message, setMessage] = useState("");
  const [debugOtp, setDebugOtp] = useState("");

  const isBusy = step === "sending" || step === "verifying";
  const contactLabel =
    form.verification_method === "email"
      ? "Correo electronico"
      : "WhatsApp / telefono";

  const isFormComplete = useMemo(
    () =>
      form.country.trim() &&
      form.city.trim() &&
      form.visitor_type &&
      form.usability_rating > 0 &&
      form.design_rating > 0 &&
      form.information_rating > 0 &&
      form.found_information &&
      form.contact.trim(),
    [form],
  );

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
  };

  const showError = (error) => {
    const code = error?.data?.error || error?.message;
    if (error?.data?.state === "duplicada" || code === "duplicate-response") {
      setStep("duplicate");
      setMessage(errorMessages["duplicate-response"]);
      return;
    }

    setMessage(errorMessages[code] || "Ocurrio un error. Intenta nuevamente.");
  };

  const handleSendCode = async (event) => {
    event.preventDefault();

    if (!isFormComplete) {
      setMessage("Completa los campos obligatorios antes de enviar el codigo.");
      return;
    }

    setStep("sending");
    setMessage("");
    setDebugOtp("");

    try {
      const data = await sendSurveyOtp(form);
      setChallengeId(data.challengeId);
      setDebugOtp(data.debugOtp || "");
      setStep("code_sent");
      setMessage("Codigo enviado. Revisalo e ingresalo para registrar tu respuesta.");
    } catch (error) {
      setStep("form");
      showError(error);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      setMessage("Ingresa el codigo de 6 digitos.");
      return;
    }

    setStep("verifying");
    setMessage("");

    try {
      await verifySurveyOtp({ challengeId, otp });
      setStep("registered");
      setMessage("Gracias. Tu respuesta fue registrada correctamente.");
    } catch (error) {
      if (error?.data?.state === "duplicada") {
        showError(error);
        return;
      }
      setStep("code_sent");
      showError(error);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setOtp("");
    setChallengeId("");
    setDebugOtp("");
    setStep("form");
    setMessage("");
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
              <FaLock className="inline-icon" aria-hidden="true" />
              <p>
                Usaremos tu correo o numero unicamente para validar que la
                respuesta sea unica. No solicitamos cedula ni documentos
                personales.
              </p>
            </div>
          </div>

          <form className="survey-form" onSubmit={handleSendCode}>
            <div className="survey-form-grid">
              <label>
                <span>Pais de residencia</span>
                <input
                  type="text"
                  value={form.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  placeholder="Ej. Ecuador"
                  required
                  disabled={step !== "form"}
                />
              </label>

              <label>
                <span>Ciudad o provincia</span>
                <input
                  type="text"
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  placeholder="Ej. El Oro"
                  required
                  disabled={step !== "form"}
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
                    disabled={step !== "form"}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="survey-ratings">
              <RatingInput
                label="Facilidad de uso"
                value={form.usability_rating}
                onChange={(value) => updateField("usability_rating", value)}
              />
              <RatingInput
                label="Diseno visual"
                value={form.design_rating}
                onChange={(value) => updateField("design_rating", value)}
              />
              <RatingInput
                label="Informacion turistica"
                value={form.information_rating}
                onChange={(value) => updateField("information_rating", value)}
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
                    disabled={step !== "form"}
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
                disabled={step !== "form"}
              />
            </label>

            <div className="survey-form-grid">
              <label>
                <span>Metodo de verificacion</span>
                <select
                  value={form.verification_method}
                  onChange={(event) =>
                    updateField("verification_method", event.target.value)
                  }
                  disabled={step !== "form"}
                >
                  <option value="email">Correo electronico</option>
                  <option value="phone">WhatsApp / telefono</option>
                </select>
              </label>

              <label>
                <span>{contactLabel}</span>
                <input
                  type={form.verification_method === "email" ? "email" : "tel"}
                  value={form.contact}
                  onChange={(event) => updateField("contact", event.target.value)}
                  placeholder={
                    form.verification_method === "email"
                      ? "nombre@correo.com"
                      : "+593999999999"
                  }
                  required
                  disabled={step !== "form"}
                />
              </label>
            </div>

            {step === "code_sent" || step === "verifying" ? (
              <div className="survey-otp-box">
                <label>
                  <span>Codigo OTP</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength="6"
                    value={otp}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    disabled={step === "verifying"}
                  />
                </label>
                {debugOtp && (
                  <p className="survey-debug-code">
                    Codigo de prueba: <strong>{debugOtp}</strong>
                  </p>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleVerify}
                  disabled={step === "verifying"}
                >
                  <FaCheckCircle className="inline-icon" aria-hidden="true" />
                  {step === "verifying" ? "Verificando..." : "Verificar codigo"}
                </button>
              </div>
            ) : null}

            {step === "registered" ? (
              <StatusMessage type="success">{message}</StatusMessage>
            ) : step === "duplicate" ? (
              <StatusMessage type="error">{message}</StatusMessage>
            ) : (
              <StatusMessage type={message.includes("Codigo enviado") ? "success" : "error"}>
                {message}
              </StatusMessage>
            )}

            <div className="survey-actions">
              {step === "form" || step === "sending" ? (
                <button
                  type="submit"
                  className="btn btn-gold"
                  disabled={isBusy || !isFormComplete}
                >
                  {form.verification_method === "email" ? (
                    <FaEnvelope className="inline-icon" aria-hidden="true" />
                  ) : (
                    <FaMobileAlt className="inline-icon" aria-hidden="true" />
                  )}
                  {step === "sending" ? "Enviando..." : "Enviar codigo"}
                </button>
              ) : null}

              {step === "registered" || step === "duplicate" ? (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={resetForm}
                >
                  <FaRedo className="inline-icon" aria-hidden="true" />
                  Nueva encuesta
                </button>
              ) : null}

              {step === "code_sent" ? (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleSendCode}
                >
                  <FaPaperPlane className="inline-icon" aria-hidden="true" />
                  Reenviar codigo
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
