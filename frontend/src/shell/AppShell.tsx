import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import AvatarMenu from "../components/AvatarMenu";

export default function AppShell() {
    const { user } = useAuth();
    const nav = useNavigate();

 const brandTo = user
    ? user.role === "creator"
      ? "/creator"
      : "/market"
    : "/";


return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <Link to={brandTo} className="font-semibold tracking-tight">
            {import.meta.env.VITE_APP_NAME || "NFT Hub"}
          </Link>

          <nav className="flex items-center gap-3 text-sm">
            {!user ? (
              <>
                <Link className="hover:underline" to="/login">
                  Login
                </Link>
                <button
                  onClick={() => nav("/register")}
                  className="inline-flex items-center rounded-md border px-3 py-1.5 hover:bg-gray-50"
                >
                  Registrieren
                </button>
              </>
            ) : (
              <>
                <Link to="/market" className="hover:underline">
                  Market
                </Link>
                <AvatarMenu />
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Outlet />
        </div>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-gray-500">
          © {new Date().getFullYear()} NFT Hub
        </div>
      </footer>
    </div>
  );
}
