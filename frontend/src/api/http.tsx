// src/api/httpBff.ts
import axios from "axios";
import { useAuthState } from "../store/auth";
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BFF_URL || "http://localhost:3010",
  timeout: 10000,
});
http.interceptors.request.use((config) => {
  const token = useAuthState.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default http;

