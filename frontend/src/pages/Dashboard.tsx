import { useAuth } from "../store/auth";

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="rounded-lg border p-4">
        <div className="text-sm text-gray-600">Eingeloggt als</div>
        <div className="text-lg font-medium">{user?.username}</div>
        <div className="text-sm text-gray-600">Rolle: {user?.role ?? "—"}</div>
        <div className="text-sm text-gray-600">Abo aktiv: {user?.isSubscribed ? "Ja" : "Nein"}</div>
      </div>
    </div>
  );
}
