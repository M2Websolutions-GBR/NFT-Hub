// src/api/httpBff.ts
import axios from "axios";
import { useAuthState } from "../store/auth";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BFF_URL, // z. B. http://localhost:3000
});

http.interceptors.request.use((config) => {
  const token = useAuthState.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  console.log(`[httpBff→] ${config.method?.toUpperCase()} ${config.url}`);
  console.log("[httpBff→] hasAuthHeader:", Boolean(config.headers.Authorization));
  if (config.params) console.log("[httpBff→] params:", config.params);
  if (config.data) console.log("[httpBff→] body:", config.data);
  return config;
});

http.interceptors.response.use(
  (res) => {
    console.log(`[httpBff←] ${res.status} ${res.config.url}`);
    return res;
  },
  (err) => {
    const r = err.response;
    console.error(`[httpBff←] ERROR ${r?.status} ${r?.config?.url}`);
    console.error("[httpBff←] error data:", r?.data);
    return Promise.reject(err);
  }
);

export default http;
