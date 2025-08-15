import { create } from "zustand";
import { persist } from "zustand/middleware";
import http from "../api/http";

type Role = "admin" | "creator" | "buyer" | string;

export type User = {
  id: string;
  email: string;
  username?: string
  role?: Role;
  isSubscribed?: boolean;
};

type State = {
  token: string | null;
  user: User | null;
  setAuth: (t: string, u?: User) => void;
  fetchMe: () => Promise<User | null>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>; // <— neu
  logout: () => void;
};

export const useAuthState = create<State>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (t, u) => set({ token: t, user: u ?? get().user }),
      fetchMe: async () => {
        try {
          const { data } = await http.get("http://localhost:3001/api/auth/me"); // anpassen, falls anders
          set({ user: data });
          return data;
        } catch {
          set({ user: null, token: null });
          return null;
        }
      },
      login: async (email, password) => {
        const { data } = await http.post("http://localhost:3001/api/auth/login", { email, password }); // { token }
        set({ token: data.token });
        await get().fetchMe();
      },
      register: async (email, password, username) => {
        const { data } = await http.post("http://localhost:3001/api/auth/register", { email, password, username }); // { token }
        set({ token: data.token });
        await get().fetchMe();
      },
      logout: () => set({ token: null, user: null }),
    }),
    { name: "nft-hub-auth" }
  )
);

export const useAuth = () => useAuthState((s) => s);
