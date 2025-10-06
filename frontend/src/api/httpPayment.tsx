// src/api/httpPayment.ts
import axios, { AxiosError } from "axios";
import { useAuthState } from "../store/auth";

const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/+$/, "");

// ---- Clients ----
const paymentHttp = axios.create({
  baseURL: `${API_BASE}/payment`,     // -> /api/payment
  withCredentials: true,              // falls ihr Cookies/CSRF nutzt
  timeout: 15000,
  headers: { Accept: "application/json" },
});

const ordersHttp = axios.create({
  baseURL: `${API_BASE}/payment/orders`,      // -> /api/orders
  withCredentials: true,
  timeout: 15000,
  headers: { Accept: "application/json" },
});

// ---- Interceptors (Auth + Logging) ----
function attachInterceptors(inst: typeof paymentHttp, tag: string) {
  inst.interceptors.request.use((config) => {
    const token = useAuthState.getState().token;
    config.headers = config.headers ?? {};
    if (token) (config.headers as any).Authorization = `Bearer ${token}`;

    // Logging
    const path = String(config.url || "");
    const url = `${config.baseURL}${path.startsWith("/") ? "" : "/"}${path}`;
    const p = config.params ? ` params:${JSON.stringify(config.params)}` : "";
    let body = "";
    if (config.data && !(config.data instanceof FormData)) {
      try { body = ` body:${JSON.stringify(config.data)}`; } catch { body = " body:[unserializable]"; }
    }
    console.log(`[%c${tag}%c→] ${String(config.method || "get").toUpperCase()} ${url}${p}${body}`, "color:#0ea5e9", "color:inherit");
    return config;
  });

  inst.interceptors.response.use(
    (res) => {
      const path = String(res.config.url || "");
      const url = `${res.config.baseURL}${path.startsWith("/") ? "" : "/"}${path}`;
      console.log(`[%c${tag}%c←] ${res.status} ${url}`, "color:#22c55e", "color:inherit");
      return res;
    },
    (error: AxiosError<any>) => {
      const cfg: any = error.config || {};
      const path = String(cfg.url || "");
      const url = `${cfg.baseURL || ""}${path.startsWith("/") ? "" : "/"}${path}`;
      const status = error.response?.status ?? "ERR";
      console.error(`[%c${tag}%c×] ${status} ${url}`, "color:#ef4444", "color:inherit", error.response?.data || error.message);
      return Promise.reject(error);
    }
  );
}

attachInterceptors(paymentHttp, "Pay");
attachInterceptors(ordersHttp, "Orders");

// ---- API-Funktionen ----

// Stripe Checkout (Creator-Abo)
export async function createCreatorCheckoutSession() {
  // ergibt: POST /api/payment/create-subscription-session
  const { data } = await paymentHttp.post<{ url: string }>("/create-subscription-session");
  return data;
}

// Stripe Customer Portal (Abo verwalten/kündigen)
export async function createCreatorPortalSession() {
  // ergibt: POST /api/payment/creator/portal-session
  const { data } = await paymentHttp.post<{ url: string }>("/creator/portal-session");
  return data;
}

// Orders
export type Order = {
  _id: string;
  nftId: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "refunded" | "void";
  createdAt: string;
};

export async function getMyOrders() {
  // ergibt: GET /api/orders/mine
  const { data } = await ordersHttp.get<Order[]>("/mine");
  return data;
}

export default paymentHttp;
