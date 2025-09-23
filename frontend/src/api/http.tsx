import axios from "axios";
import { useAuthState } from "../store/auth";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BFF_URL || "/",
  withCredentials: true,
  headers: { Accept: "application/json" },
});

http.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  const token = useAuthState.getState().token;
  if (token) (config.headers as any).Authorization = `Bearer ${token}`;
  // eigene Request-ID für Korrelationslogs
  const rid = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  (config.headers as any)["x-request-id"] = rid;
  (config as any)._rid = rid;

  console.log("[http→]", (config.method || "get").toUpperCase(), config.baseURL + (config.url || ""), {
    params: config.params,
    hasAuthHeader: Boolean((config.headers as any).Authorization),
    rid,
  });
  return config;
});

http.interceptors.response.use(
  (res) => {
    const rid = (res.config as any)._rid || res.headers["x-request-id"];
    console.log("[http←]", res.status, res.config.url, { rid, serverRid: res.headers["x-request-id"] });
    return res;
  },
  (err) => {
    const r = err?.response;
    const rid = (err?.config as any)?._rid;
    console.error("[http←] ERROR", r?.status, r?.config?.url, { rid, serverRid: r?.headers?.["x-request-id"], data: r?.data });
    return Promise.reject(err);
  }
);

export default http;
