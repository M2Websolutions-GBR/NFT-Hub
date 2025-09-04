// src/pages/CheckoutSuccess.tsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import http from "../api/http";

type Order = {
  _id: string;
  stripeSessionId: string;
  status: "pending" | "paid" | "failed" | "refunded" | "void";
  amount: number;
  nftId: string;
  buyerId: string;
  createdAt: string;
};

export default function CheckoutSuccess() {
  const [query] = useSearchParams();
  const sessionId = query.get("session_id") || "";
  const [order, setOrder] = useState<Order | null>(null);
  const [tries, setTries] = useState(0);
  const nav = useNavigate();

  useEffect(() => {
    let timer: any;

    const fetchOrder = async () => {
      try {
        const { data } = await http.get<Order>(`/api/payment/checkout/order-by-session/${sessionId}`);
        setOrder(data);

        if (data.status === "paid") {
          // 1–2s “Nice” Anzeige, dann Dashboard
          setTimeout(() => nav("/dashboard", { replace: true }), 1200);
        } else if (tries < 12) {
          // weiter pollen (max. ~12 * 1s = 12 Sekunden)
          timer = setTimeout(() => setTries((t) => t + 1), 1000);
        }
      } catch {
        // wenn 404 (Webhook noch nicht gelaufen), weiter pollen
        if (tries < 12) {
          timer = setTimeout(() => setTries((t) => t + 1), 1000);
        }
      }
    };

    if (sessionId) fetchOrder();
    return () => clearTimeout(timer);
  }, [sessionId, tries, nav]);

  if (!sessionId) {
    return (
      <div className="py-16 text-center text-red-600">
        Keine Session-ID erhalten.
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto text-center space-y-4 py-16">
      <h1 className="text-2xl font-semibold">Zahlung</h1>
      {!order ? (
        <p>Wir prüfen deine Zahlung …</p>
      ) : order.status === "paid" ? (
        <>
          <p className="text-green-700">✅ Zahlung bestätigt! 🎉</p>
          <p>Du wirst gleich zu deinem Dashboard weitergeleitet…</p>
        </>
      ) : order.status === "pending" ? (
        <p className="text-gray-600">Zahlung noch ausstehend …</p>
      ) : order.status === "failed" ? (
        <>
          <p className="text-red-600">Zahlung fehlgeschlagen.</p>
          <Link className="underline" to="/market">Zurück zum Marktplatz</Link>
        </>
      ) : (
        <>
          <p>Status: {order.status}</p>
          <Link className="underline" to="/market">Zurück zum Marktplatz</Link>
        </>
      )}
    </div>
  );
}


