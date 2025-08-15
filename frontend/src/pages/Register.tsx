import { useForm } from "react-hook-form";
import { useAuth } from "../store/auth";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

type FormValues = { email: string; password: string; username: string; };

export default function Register() {
  const { register: registerUser } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { isSubmitting } } =
    useForm<FormValues>({ defaultValues: { email: "", password: "", username: "" } });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await registerUser(values.email, values.password, values.username);
      nav("/dashboard", { replace: true });
    } catch (e: any) {
      setError(e?.response?.data?.message || "Registrierung fehlgeschlagen");
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Registrieren</h1>
      
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

        <label className="block">
          <span className="block text-sm mb-1">Email</span>
          <input
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
            type="email"
            placeholder="you@example.com"
            {...register("email", { required: true })}
          />
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Passwort</span>
          <input
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
            type="password"
            placeholder="Mind. 6 Zeichen"
            {...register("password", { required: true, minLength: 6 })}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center rounded-md bg-black text-white px-4 py-2 hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? "Bitte warten…" : "Registrieren"}
        </button>
      </form>
      <p className="text-sm mt-4">
        Schon dabei?{" "}
        <Link to="/login" className="underline">Zum Login</Link>
      </p>
    </div>
  );
}
