import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import App from "./App";
import "./index.css";
import "./i18n";
import { initGlobalErrorHandlers } from "@/lib/errorReporting";
import { initPwaInstallListeners, registerServiceWorkerEarly } from "@/lib/pwa";

config.autoAddCss = false;

initGlobalErrorHandlers();
initPwaInstallListeners();

const scheduleIdle =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? (cb: () => void) => window.requestIdleCallback(() => cb(), { timeout: 2500 })
    : (cb: () => void) => window.setTimeout(cb, 1);

scheduleIdle(() => {
  void registerServiceWorkerEarly();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
