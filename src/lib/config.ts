// Configuration for different environments
export const getApiBaseUrl = (): string => {
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    // Server-side: use relative URLs
    return "";
  }

  // Client-side: determine the correct base URL
  const hostname = window.location.hostname;

  // Local development
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:4321/careers-portal-kv";
  }

  // Webflow Canvas environment
  if (
    hostname.includes("webflow.io") ||
    hostname.includes("canvas.webflow.com")
  ) {
    return "https://webflow-about-1c3d6c3166e82678aba90676e.webflow.io/careers-portal-kv";
  }

  // Production deployment
  if (hostname.includes("webflow-about-1c3d6c3166e82678aba90676e.webflow.io")) {
    return "https://webflow-about-1c3d6c3166e82678aba90676e.webflow.io/careers-portal-kv";
  }

  // Fallback: use current origin
  return window.location.origin + "/careers-portal-kv";
};

export const API_ENDPOINTS = {
  greenhouse: (ghSlug: string = "webflow") =>
    `${getApiBaseUrl()}/api/greenhouse?ghSlug=${encodeURIComponent(ghSlug)}`,
  jobs: (ghSlug: string = "webflow") =>
    `${getApiBaseUrl()}/api/jobs?ghSlug=${encodeURIComponent(ghSlug)}`,
  questions: (ghSlug: string, jobId: string) =>
    `${getApiBaseUrl()}/api/questions?ghSlug=${encodeURIComponent(
      ghSlug
    )}&jobId=${encodeURIComponent(jobId)}`,
  cache: {
    warm: () => `${getApiBaseUrl()}/api/cache/warm-initial`,
    status: (ghSlug: string = "webflow") =>
      `${getApiBaseUrl()}/api/cache/status?ghSlug=${encodeURIComponent(
        ghSlug
      )}`,
  },
};
