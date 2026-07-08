import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If "/login" returns 401 (wrong password/email), that is NOT an expired
    // session - it's a normal login form response, and should not trigger a
    // redirect (which would wipe the error message via a page reload).
    const isLoginRequest = error.config?.url?.includes("/login");

    if (typeof window !== "undefined" && error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
    if (data?.errors) {
      return Object.values(data.errors).flat().join(" ");
    }
    if (data?.message) return data.message;

    // No response at all reached the server (as opposed to a 4xx/5xx) -
    // most commonly means the device has no internet connection right now.
    if (!error.response && typeof navigator !== "undefined" && !navigator.onLine) {
      return "You're offline. This action needs an internet connection.";
    }
  }
  return "An unexpected error occurred. Please try again.";
}

/**
 * If the request was made with responseType:"blob" (e.g. downloading a
 * CSV/PDF), the error response itself also comes back as a Blob - this reads
 * it as JSON to get the real error message instead of just a generic one.
 */
export async function blobErrorMessage(error: unknown): Promise<string> {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const text = await error.response.data.text();
      const data = JSON.parse(text) as { message?: string };
      if (data?.message) return data.message;
    } catch {
      // ignore - falls through to generic message below
    }
  }
  return apiErrorMessage(error);
}
