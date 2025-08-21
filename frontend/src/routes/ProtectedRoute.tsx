import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAuth } from "../store/auth";
import { Navigate, useLocation } from "react-router-dom";

type Role = "admin" | "creator" | "buyer" | (string & {});
type Props = {
  children: ReactNode;
  requireRole?: Role | Role[];
};

function hasRequiredRole(userRole?: string, required?: Role | Role[]) {
  if (!required) return true;
  const list = Array.isArray(required) ? required : [required];
  return !!userRole && list.includes(userRole as Role);
}

export default function ProtectedRoute({ children, requireRole }: Props) {
  const { user, token, fetchMe } = useAuth();
  const loc = useLocation();

  // Falls eingeloggt aber user noch nicht geladen → nachladen
  useEffect(() => {
    if (token && !user) {
      // Fehlerhandled im Store; bei invalidem Token wird state gecleart
      fetchMe().catch(() => {/* no-op: Redirect unten übernimmt */});
    }
  }, [token, user, fetchMe]);

  // Nicht eingeloggt → Login
  if (!token) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  // Token vorhanden, User noch am Laden
  if (!user) {
    return <div className="text-center text-gray-600">Lade…</div>;
  }

  // Rolle prüfen (falls gefordert)
  if (!hasRequiredRole(user.role, requireRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
