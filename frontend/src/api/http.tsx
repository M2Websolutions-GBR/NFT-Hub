import axios from "axios";
import { useAuthState } from "../store/auth"; // Achtung: nur wenn Datei nicht zirkulär importiert!

const http = axios.create({
  baseURL: import.meta.env.VITE_API_AUTH_URL,
  timeout: 10000,
});

http.interceptors.request.use((config) => {
  const token = useAuthState.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default http;
