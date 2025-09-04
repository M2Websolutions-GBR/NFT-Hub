import { create } from "zustand";
import { persist } from "zustand/middleware";
import httpAuth from "../api/httpAuth";
import { getAvatarSign, uploadToCloudinary } from "../lib/avatar";



type Role = "admin" | "creator" | "buyer" | string;
type Patch = { username?: string; profileInfo?: string; avatarUrl?: string };



export type User = {
  id: string;
  _id: string;
  email: string;
  username?: string;
  role?: Role;
  isSubscribed?: boolean;
  profileInfo?: string;
  avatarUrl?: string
};

type State = {
  token: string | null;
  user: User | null;
  setAuth: (t: string, u?: User) => void;
  fetchMe: () => Promise<User | null>;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    username: string,
    role?: Role,
    profileInfo?: string,
    avatarUrl?: string
  ) => Promise<void>; // 👈 jetzt konsistent zur Implementierung
  updateProfile: (patch: Patch) => Promise<void>; // neu
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
          const { data } = await httpAuth.get("/api/auth/me");
          set({ user: data });
          return data;
        } catch {
          set({ user: null, token: null });
          return null;
        }
      },

      login: async (email, password) => {
        const { data } = await httpAuth.post("/api/auth/login", { email, password });
        set({ token: data.token });
        await get().fetchMe();
      },

      register: async (
        email: string,
        password: string,
        username: string,
        role: Role = "buyer",
        profileInfo?: string
      ) => {
        const payload: Record<string, unknown> = { email, password, username, role };
        if (profileInfo?.trim()) payload.profileInfo = profileInfo.trim();

        const { data } = await httpAuth.post("/api/auth/register", payload);
        set({ token: data.token });
        await get().fetchMe();
      },
      updateProfile: async (patch: Patch) => {
  const { data } = await httpAuth.patch("/me", patch);
  const prev = get().user || null;
  set({ user: { ...(prev || {} as User), ...data } });
},

updateAvatar: async (file: File) => {
  const sig = await getAvatarSign("profile");        // Unterordner avatars/<uid>/profile
  const up  = await uploadToCloudinary(file, sig);   // liefert secure_url
  await get().updateProfile({ avatarUrl: up.secure_url });
},

      logout: () => set({ token: null, user: null }),
    }),
    { name: "nft-hub-auth" }
  )
);

export const useAuth = () => useAuthState((s) => s);
