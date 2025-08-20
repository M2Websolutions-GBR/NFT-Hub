// src/routes/HomeGate.tsx
import { useAuth } from "../store/auth";
import Landing from "../pages/Landing";
import Market from "../pages/Market";
export default function HomeGate() {
  const { user } = useAuth();
  return user ? <Market /> : <Landing />;
}
