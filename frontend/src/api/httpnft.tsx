import axios from "axios";
import { useAuthState } from "../store/auth";

const httpNft = axios.create({
  baseURL: import.meta.env.VITE_API_NFT_URL || "http://localhost:3002",
  timeout: 15000,
  withCredentials: false, // 🚫 wichtig: keine Cookies für NFT-Service
});

// REQUEST LOG
httpNft.interceptors.request.use((config) => {
  const token = useAuthState.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  console.groupCollapsed(
    `%c[NFT] ➜ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
    "color:#0ea5e9"
  );
  console.debug("withCredentials:", config.withCredentials); // 👈 sichtbar machen
  console.debug("params:", config.params);
  console.debug("data:", config.data);
  console.groupEnd();
  return config;
});

// RESPONSE LOG
httpNft.interceptors.response.use(
  (res) => {
    console.groupCollapsed(
      `%c[NFT] ← ${res.status} ${res.config.method?.toUpperCase()} ${res.config.baseURL}${res.config.url}`,
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
      `%c[NFT] ✖ ${status ?? "ERR"} ${cfg.method?.toUpperCase?.() || ""} ${cfg.baseURL || ""}${cfg.url || ""}`,
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


export default httpNft;
