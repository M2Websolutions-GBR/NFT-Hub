import { Navigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import Dashboard from "../pages/Dashboard"; // dein altes, generisches Dashboard

export default function DashboardGate() {
  const { user } = useAuth();

  // Creator sehen das neue Dashboard
  if (user?.role === "creator") {
    return <Navigate to="/creator" replace />;
  }

  // alle anderen weiterhin das generische Dashboard
  return <Dashboard />;
}
