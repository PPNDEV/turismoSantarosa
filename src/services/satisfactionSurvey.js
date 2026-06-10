const SURVEY_API_URL = import.meta.env.VITE_SURVEY_API_URL || "/api/survey";
const SESSION_KEY = "visitSantaRosaSurveySession";

function getSurveySessionId() {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    const nextId =
      window.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(SESSION_KEY, nextId);
    return nextId;
  } catch {
    return "";
  }
}

async function postSurvey(payload) {
  const response = await fetch(SURVEY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error || "request-failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function submitSurveyDirect(formData) {
  return postSurvey({
    action: "submit",
    session_id: getSurveySessionId(),
    ...formData,
  });
}
