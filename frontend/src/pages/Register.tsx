import { useForm } from "react-hook-form";
import { useAuth } from "../store/auth";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";

type FormValues = { email: string; password: string; username: string, profileInfo?: string };

export default function Register() {
  const { register: registerUser } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  // role aus ?role=creator|buyer (default buyer)
  const role = useMemo(() => {
    const r = (params.get("role") || "buyer").toLowerCase();
    return r === "creator" ? "creator" : "buyer";
  }, [params]);

  const { register, handleSubmit, formState: { isSubmitting } } =
    useForm<FormValues>({ defaultValues: { email: "", password: "", username: "", profileInfo: "" } });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await registerUser(values.email, values.password, values.username, role, values.profileInfo);
      nav("/dashboard", { replace: true });
    } catch (e: any) {
      setError(e?.response?.data?.message || "Registrierung fehlgeschlagen");
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Registrieren</h1>
      <p className="text-sm mb-6">
        {role === "creator"
          ? "Du registrierst dich als Creator. Du kannst später NFTs erstellen und verkaufen."
          : "Standard-Registrierung als Käufer. Du kannst später jederzeit Creator werden."}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Username */}
        <label className="block">
          <span className="block text-sm mb-1">Username</span>
          <input
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
            type="text"
            placeholder="deinusername"
            {...register("username", { required: true, minLength: 3 })}
          />
        </label>

        {/* Email */}
        <label className="block">
          <span className="block text-sm mb-1">Email</span>
          <input
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
            type="email"
            placeholder="you@example.com"
            {...register("email", { required: true })}
          />
        </label>

        {/* Passwort */}
        <label className="block">
          <span className="block text-sm mb-1">Passwort</span>
          <input
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
            type="password"
            placeholder="Mind. 6 Zeichen"
            {...register("password", { required: true, minLength: 6 })}
          />
        </label>

        {/* Hidden role preview / debug (optional) */}
        <input type="hidden" value={role} readOnly />

        {error && <p className="text-sm text-red-600">{error}</p>}

        
        {/* Profilinfo (optional) */}
        <label className="block">
          <span className="block text-sm mb-1">Profilinfo (optional)</span>
          <textarea
            className="w-full min-h-[96px] rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
            placeholder="Schreib kurz etwas über dich, Skills, Style, Projekte …"
            maxLength={800}
            {...register("profileInfo")}
          />
          <span className="block text-xs text-gray-500 mt-1">
            Max. 800 Zeichen. Du kannst das später auf deiner Profilseite ändern.
          </span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}


        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center rounded-md bg-black text-white px-4 py-2 hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? "Bitte warten…" : (role === "creator" ? "Als Creator registrieren" : "Registrieren")}
        </button>
      </form>

      <p className="text-sm mt-4">
        Schon dabei? <Link to="/login" className="underline">Zum Login</Link>
      </p>
    </div>
  );
}
