import { useForm } from "react-hook-form";
import { useAuth } from "../store/auth";
import { useState, useEffect } from "react";
import http from "../api/http"; // <- zentraler Client (baseURL=/api)

type FormValues = {
  username?: string;
  profileInfo?: string;
  avatarUrl?: string;
};

type CloudSig = {
  timestamp: number;
  folder: string;
  signature: string;
  api_key: string;
  cloud_name: string;
  // optional: upload_preset?: string;
};

export default function ProfileEdit() {
  const { user, updateProfile, fetchMe } = useAuth() as any;

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({ defaultValues: { username: "", profileInfo: "" } });

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Avatar-States
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      reset({
        username: user.username || "",
        profileInfo: user.profileInfo || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setSaved(false);
    try {
      const patch: FormValues = {};
      if (typeof values.username === "string") patch.username = values.username.trim();
      if (typeof values.profileInfo === "string") patch.profileInfo = values.profileInfo.trim();
      await updateProfile(patch);
      await fetchMe();
      setSaved(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Speichern fehlgeschlagen");
    }
  };

  // --- Avatar Upload Flow (fix: nutzt /api + http client) ---
  async function getAvatarSign(sub?: string): Promise<CloudSig> {
      const qs = sub ? `?sub=${encodeURIComponent(sub)}` : "";
    // Wir rufen den Auth-Service über Nginx an:
    // Nginx: /api/auth/ -> server-auth
    // Route (Server): POST /api/auth/profile/avatar/sign
    const { data } = await http.post<CloudSig>(
      
      `/profile/avatar/sign${qs}`,
      sub ? { sub } : {}
    );
    return data;
  }

  async function uploadToCloudinary(file: File, sig: CloudSig) {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.api_key);
    form.append("timestamp", String(sig.timestamp));
    form.append("folder", sig.folder);
    form.append("signature", sig.signature);
    // Falls ihr signierte Uploads mit preset nutzt:
    // if (sig.upload_preset) form.append("upload_preset", sig.upload_preset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Cloudinary-Upload fehlgeschlagen${text ? `: ${text}` : ""}`);
    }
    return res.json() as Promise<{ secure_url: string; public_id: string }>;
  }

  const onAvatarUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);
    setError(null);
    try {
      // Basic-Validierung
      if (!/^image\//.test(file.type)) {
        throw new Error("Bitte ein Bild auswählen (PNG/JPG/WebP).");
      }
      const maxMB = 8;
      if (file.size > maxMB * 1024 * 1024) {
        throw new Error(`Datei ist zu groß. Max. ${maxMB} MB.`);
      }

      // Signatur holen & Upload durchführen
      const sig = await getAvatarSign("profile"); // Zielordner z. B. avatars/<userId>/profile
      const up = await uploadToCloudinary(file, sig);

      // Profil updaten
      await updateProfile({ avatarUrl: up.secure_url });
      await fetchMe();
      setFile(null);
      setUploadMsg("Avatar aktualisiert.");
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Avatar-Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-2">Profil bearbeiten</h1>
      <p className="text-sm text-gray-600 mb-6">
        Passe deinen Anzeigenamen und deine Profilinfo an. Diese Infos erscheinen im Dashboard / bei NFTs.
      </p>

      {/* Avatar-Bereich */}
      <div className="flex items-center gap-4 mb-8">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover border"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border">
            ?
          </div>
        )}

        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            disabled={!file || uploading}
            onClick={onAvatarUpload}
            className="inline-flex items-center rounded-md bg-black text-white px-3 py-1.5 disabled:opacity-50"
          >
            {uploading ? "Lade hoch…" : "Avatar hochladen"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Username */}
        <label className="block">
          <span className="block text-sm mb-1">Username</span>
          <input
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
            type="text"
            placeholder="deinusername"
            {...register("username")}
          />
        </label>

        {/* Profilinfo */}
        <label className="block">
          <span className="block text-sm mb-1">Profilinfo</span>
          <textarea
            className="w-full min-h-[120px] rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
            placeholder="Schreib kurz etwas über dich, Skills, Projekte …"
            maxLength={800}
            {...register("profileInfo")}
          />
          <span className="block text-xs text-gray-500 mt-1">Max. 800 Zeichen.</span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-700">Gespeichert.</p>}
        {uploadMsg && <p className="text-sm text-green-700">{uploadMsg}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-md bg-black text-white px-4 py-2 hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? "Speichere…" : "Speichern"}
          </button>
        </div>
      </form>
    </div>
  );
}
