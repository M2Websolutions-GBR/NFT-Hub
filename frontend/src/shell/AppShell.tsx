import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";

export default function AppShell() {
    const { user, logout } = useAuth();
    const nav = useNavigate();

    return (
        <div className="min-h-dvh flex flex-col">
            <header className="border-b bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 sticky top-0 z-10">
                <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
                    <Link to={user ? "/market" : "/"} className="font-semibold tracking-tight">
                        {import.meta.env.VITE_APP_NAME || "NFT Hub"}
                    </Link>
                    <nav className="flex items-center gap-3 text-sm">
                        {!user ? (
                            <>
                                <Link className="hover:underline" to="/login">Login</Link>
                                <button
                                    onClick={() => nav("/register")}
                                    className="inline-flex items-center rounded-md border px-3 py-1.5 hover:bg-gray-50"
                                >
                                    Registrieren
                                </button>
                            </>
                        ) : (
                            <>
                                <span className="text-gray-600">Hi, {user.username}</span>
                                <button
                                    onClick={() => nav("/dashboard")}
                                    className="inline-flex items-center rounded-md px-3 py-1.5 hover:bg-gray-50"
                                >
                                    Dashboard
                                </button>

                                {/* Zahnrad */}
                                <button
                                    onClick={() => nav("/profile")}
                                    className="inline-flex items-center rounded-md px-3 py-1.5 hover:bg-gray-50"
                                    title="Profil bearbeiten"
                                >
                                    {/* simple inline SVG Icon */}
                                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="mr-1">
                                        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" fill="currentColor" />
                                        <path d="M19.4 13a7.8 7.8 0 0 0 .06-2l2.02-1.57-1.5-2.6-2.42.7a7.9 7.9 0 0 0-1.72-1l-.36-2.47h-3l-.36 2.47c-.6.22-1.18.53-1.72.9l-2.42-.7-1.5 2.6L4.54 11a7.8 7.8 0 0 0 0 2l-2.02 1.57 1.5 2.6 2.42-.7c.54.37 1.12.68 1.72.9l.36 2.47h3l.36-2.47c.6-.22 1.18-.53 1.72-.9l2.42.7 1.5-2.6L19.4 13z" fill="currentColor" opacity=".6" />
                                    </svg>
                                    Einstellungen
                                </button>


                                <button
                                    onClick={logout}
                                    className="inline-flex items-center rounded-md border px-3 py-1.5 hover:bg-gray-50"
                                >
                                    Logout
                                </button>
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
