import axios from "axios";
import { useAuthState } from "../store/auth";

const httpAuth = axios.create({
  baseURL: import.meta.env.VITE_API_AUTH_URL || "http://localhost:3001",
  timeout: 15000,
});

httpAuth.interceptors.request.use((config) => {
  const token = useAuthState.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  console.groupCollapsed(
    `%c[AUTH] ➜ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
    "color:#0ea5e9"
  );
  console.debug("params:", config.params);
  console.debug("data:", config.data);
  console.groupEnd();
  return config;
});

httpAuth.interceptors.response.use(
  (res) => {
    console.groupCollapsed(
      `%c[AUTH] ← ${res.status} ${res.config.method?.toUpperCase()} ${res.config.baseURL}${res.config.url}`,
      "color:#22c55e"
    );
    console.debug("data:", res.data);
    console.groupEnd();
    return res;
  },
  (err) => {
    const cfg = err?.config || {};
    const status = err?.response?.status;
    console.groupCollapsed(
      `%c[AUTH] ✖ ${status ?? "ERR"} ${cfg.method?.toUpperCase?.() || ""} ${cfg.baseURL || ""}${cfg.url || ""}`,
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
