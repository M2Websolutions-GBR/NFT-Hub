// src/pages/CheckoutCancel.tsx
import { Link } from "react-router-dom";

export default function CheckoutCancel() {
  return (
    <div className="max-w-xl mx-auto text-center space-y-4 py-16">
      <h1 className="text-2xl font-semibold">Bezahlung abgebrochen</h1>
      <p className="text-gray-600">Du kannst den Kauf jederzeit erneut starten.</p>
      <Link to="/market" className="underline">Zurück zum Marktplatz</Link>
    </div>
  );
}
