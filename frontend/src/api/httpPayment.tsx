// src/api/httpPayment.ts
import axios, { AxiosError } from "axios";
import { useAuthState } from "../store/auth";

// Basis-URL: direkt zum Payment-Service ODER über den BFF.
// Setze in .env: VITE_PAYMENT_API="http://localhost:3003/api"
// Fallback: VITE_BFF_API="http://localhost:3010/api"
// const BASE_URL =
//   import.meta.env.VITE_API_PAYMENT_URL ||
//   (import.meta.env.VITE_API_BFF_URL
//     ? `${import.meta.env.VITE_API_BFF_URL}` // z.B. "/api/payment" vom BFF bereits im Pfad kapseln
//     : "/api");

const httpPayment = axios.create({
  baseURL: import.meta.env.VITE_API_PAYMENT_URL,
  withCredentials: false,
  // timeout optional, Stripe-Calls/Weiterleitungen sind schnell genug:
  timeout: 15000,
});

// Request-Interceptor: Auth + Logging
httpPayment.interceptors.request.use((config) => {
  const token = useAuthState.getState().token;
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  // Konsolen-Logging (deaktivierbar, wenn zu laut)
  const p = config.params ? ` params: ${JSON.stringify(config.params)}` : "";
  // kleine, sichere Preview vom Body (ohne Files)
  let bodyPreview = "";
  if (config.data && !(config.data instanceof FormData)) {
    try {
      bodyPreview = ` body: ${JSON.stringify(config.data)}`;
    } catch {
      bodyPreview = " body: [unserializable]";
    }
  }
  console.log(`[httpPay→] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}${p}${bodyPreview}`);
  return config;
});

// Response-Interceptor: Logging + einfache Fehlerbehandlung
httpPayment.interceptors.response.use(
  (res) => {
    console.log(`[httpPay←] ${res.status} ${res.config.url}`);
    return res;
  },
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const data = error.response?.data;
    console.error(`[httpPay×] ${status} ${url}`, data || error.message);

    // Optional: bei 401/403 → Logout/Redirect (hier nur Beispiel)
    // if (status === 401 || status === 403) {
    //   useAuthState.getState().logout?.();
    //   window.location.href = "/login";
    // }

    return Promise.reject(error);
  }
);

export default httpPayment;
