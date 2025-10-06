// src/api/httpauth.ts
import axios from "axios";
import { useAuthState } from "../store/auth";

// Einheitliche Basis: Proxy -> /api
const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/+$/, "");
const BASE_URL = `${API_BASE}/auth`; // => "/api/auth"

const httpAuth = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true,           // ✅ falls ihr Cookies (Refresh/CSRF) nutzt
  headers: { Accept: "application/json" },
});

// REQUEST LOG + Auth-Header
httpAuth.interceptors.request.use((config) => {
  const token = useAuthState.getState().token;
  config.headers = config.headers ?? {};
  if (token) (config.headers as any).Authorization = `Bearer ${token}`;

  const path = String(config.url || "");
  const url = `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  console.groupCollapsed(
    `%c[AUTH] ➜ ${String(config.method || "get").toUpperCase()} ${url}`,
    "color:#0ea5e9"
  );
  console.debug("withCredentials:", config.withCredentials);
  console.debug("params:", config.params);
  console.debug("data:", config.data);
  console.groupEnd();
  return config;
});

// RESPONSE LOG
httpAuth.interceptors.response.use(
  (res) => {
    const path = String(res.config.url || "");
    const url = `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
    console.groupCollapsed(
      `%c[AUTH] ← ${res.status} ${String(res.config.method || "get").toUpperCase()} ${url}`,
      "color:#22c55e"
    );
    console.debug("data:", res.data);
    console.groupEnd();
    return res;
  },
  (err) => {
    const cfg: any = err?.config || {};
    const path = String(cfg.url || "");
    const url = `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
    const status = err?.response?.status ?? "ERR";
    console.groupCollapsed(
      `%c[AUTH] ✖ ${status} ${String(cfg.method || "").toUpperCase()} ${url}`,
      "color:#ef4444"
    );
    console.debug("params:", cfg.params);
    console.debug("data:", cfg.data);
    console.debug("error.response?.data:", err?.response?.data);
    console.debug("error.message:", err?.message);
    console.groupEnd();
    return Promise.reject(err);
  }
);

export default httpAuth;
