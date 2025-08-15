import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAuth } from "../store/auth";
import { useLocation, useNavigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, token, fetchMe } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    (async () => {
      if (!token) {
        nav("/login", { replace: true, state: { from: loc.pathname } });
        return;
      }
      if (!user) {
        await fetchMe().catch(() => {
          nav("/login", { replace: true, state: { from: loc.pathname } });
        });
      }
    })();
  }, [token]);

  if (!token || !user) {
    return (
      <div className="text-center text-gray-600">Lade…</div>
    );
  }
  return <>{children}</>;
}
