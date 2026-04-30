const PROVIDERS = {
  turnstile: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
  hcaptcha: "https://hcaptcha.com/siteverify",
};

function normalizeProvider(rawProvider) {
  const provider = String(rawProvider || "").trim().toLowerCase();
  if (provider === "hcaptcha") {
    return "hcaptcha";
  }
  return "turnstile";
}

async function verifyCaptcha({ token, secret, provider, remoteip, logger }) {
  if (!secret) {
    return { ok: false, error: "missing-secret" };
  }

  const normalizedProvider = normalizeProvider(provider);
  const endpoint = PROVIDERS[normalizedProvider];
  if (!endpoint) {
    return { ok: false, error: "invalid-provider" };
  }

  const params = new URLSearchParams();
  params.set("secret", secret);
  params.set("response", token || "");
  if (remoteip) {
    params.set("remoteip", remoteip);
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json();
    if (data?.success) {
      return { ok: true };
    }

    return { ok: false, error: "verification-failed", details: data };
  } catch (error) {
    logger?.warn("captcha verification failed", error);
    return { ok: false, error: "verification-error" };
  }
}

module.exports = {
  normalizeProvider,
  verifyCaptcha,
};
