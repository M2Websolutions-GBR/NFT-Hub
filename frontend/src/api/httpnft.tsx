import axios from "axios";
import { useAuthState } from "../store/auth"; // ggf. Pfad anpassen

const httpNft = axios.create({
  baseURL: import.meta.env.VITE_API_NFT_URL || "http://localhost:3002",
  timeout: 15000,
});

httpNft.interceptors.request.use((config) => {
  const token = useAuthState.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default httpNft;
