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
    // "/login" ikitoa 401 (password/email si sahihi), hiyo SIYO session
    // iliyokwisha - ni sehemu ya kawaida ya majibu ya login form, isisababishe
    // redirect (ambayo ingefuta ujumbe wa error mara moja kwa page reload).
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
  }
  return "Hitilafu isiyotarajiwa imetokea. Jaribu tena.";
}

/**
 * Kama request ilifanywa na responseType:"blob" (mfano kupakua CSV/PDF), error
 * response yenyewe pia inarudi ikiwa Blob - hii inaisoma kama JSON ili kupata
 * ujumbe halisi wa error badala ya ujumbe wa jumla tu.
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
