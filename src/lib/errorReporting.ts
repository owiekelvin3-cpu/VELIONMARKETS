interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  timestamp: string;
  userAgent: string;
}

const ERROR_LOG_KEY = "hls-last-error";

export function reportError(error: Error, componentStack?: string) {
  const report: ErrorReport = {
    message: error.message,
    stack: error.stack,
    componentStack,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };

  try {
    sessionStorage.setItem(ERROR_LOG_KEY, JSON.stringify(report));
  } catch {
    // ignore storage failures
  }

  if (import.meta.env.DEV) {
    console.error("[ErrorBoundary]", report);
  }

  // Hook for external services (Sentry, LogRocket, etc.)
  const endpoint = import.meta.env.VITE_ERROR_REPORTING_URL;
  if (endpoint && import.meta.env.PROD) {
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
      keepalive: true,
    }).catch(() => {});
  }
}

export function getLastError(): ErrorReport | null {
  try {
    const raw = sessionStorage.getItem(ERROR_LOG_KEY);
    return raw ? (JSON.parse(raw) as ErrorReport) : null;
  } catch {
    return null;
  }
}

export function initGlobalErrorHandlers() {
  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    reportError(error);
  });

  window.addEventListener("error", (event) => {
    if (event.error instanceof Error) {
      reportError(event.error);
    }
  });
}
