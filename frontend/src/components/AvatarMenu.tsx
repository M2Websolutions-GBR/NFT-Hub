import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";

export default function AvatarMenu() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const avatarUrl = (user as any)?.avatarUrl as string | undefined;
  const initials =
    (user?.username || user?.email || "?")
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  // close on outside click / escape
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toDashboard = user?.role === "creator" ? "/creator" : "/dashboard";

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-black/20"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profil"
            className="w-9 h-9 rounded-full object-cover border"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-700 border grid place-items-center text-xs font-medium">
            {initials}
          </div>
        )}
        <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden>
          <path d="M5.5 7.5l4.5 4.5 4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-lg border bg-white shadow-lg overflow-hidden z-20"
        >
          <div className="px-3 py-2 border-b">
            <div className="text-sm font-medium line-clamp-1">
              {user?.username || user?.email}
            </div>
            {user?.role && <div className="text-xs text-gray-500">Rolle: {user.role}</div>}
          </div>

          <div className="py-1">
            <Link
              to="/profile"
              role="menuitem"
              className="block px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              Profil
            </Link>

            <Link
              to={toDashboard}
              role="menuitem"
              className="block px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              Dashboard
            </Link>

            <button
              role="menuitem"
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => {
                setOpen(false);
                logout();
                nav("/");
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
