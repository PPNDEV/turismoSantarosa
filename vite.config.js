import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const functionsProjectId =
    env.VITE_FIREBASE_FUNCTIONS_PROJECT_ID ||
    env.VITE_FIREBASE_PROJECT_ID ||
    "promoweapp";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: `http://127.0.0.1:5001/${functionsProjectId}/us-central1`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/visits$/, "/countVisit"),
        },
      },
    },
  };
});
