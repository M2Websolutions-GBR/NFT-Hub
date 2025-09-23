import { Navigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import Dashboard from "../pages/Dashboard";

export default function DashboardGate() {
  const { user } = useAuth();
  const role = String(user?.role || "").toLowerCase();

  if (role === "admin")   return <Navigate to="/admin" replace />;
  if (role === "creator") return <Navigate to="/creator" replace />;
  if (role === "buyer")   return <Navigate to="/buyer" replace />;

  // Fallback: unbekannte Rolle → generisches Dashboard
  return <Dashboard />;
}
