// src/pages/CheckoutSuccess.tsx
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../store/auth";
import { isCreatorActive } from "../lib/Subscription";

type Order = {
  _id: string;
  stripeSessionId: string;
  status: "pending" | "paid" | "failed" | "refunded" | "void";
  amount: number;
  nftId: string;
  buyerId: string;
  createdAt: string;
};

type Mode = "order" | "subscription";

export default function CheckoutSuccess() {
  const [query] = useSearchParams();
  const sessionId = query.get("session_id") || "";
  const hardType = (query.get("type") || "").toLowerCase(); // "subscription" | "order" | ""

  const nav = useNavigate();
  const { fetchMe } = useAuth();

  // initialen Modus bestimmen: wenn "?type=subscription", direkt Subscription
  const initialMode: Mode = hardType === "subscription" ? "subscription" : "order";
  const [mode, setMode] = useState<Mode>(initialMode);

  const [order, setOrder] = useState<Order | null>(null);

  const started = useRef(false);       // StrictMode-Schutz (kein Doppellauf)
  const tries = useRef(0);
  const MAX_TRIES = 20;
  const TICK_MS = 1000;

  useEffect(() => {
    if (!sessionId) return;
    if (started.current) return;
    started.current = true;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const pollSubscription = async () => {
      const me = await fetchMe();
      const active = isCreatorActive(me);
      if (active) {
        timer = setTimeout(() => nav("/creator", { replace: true }), 1000);
        return;
      }
      tries.current++;
      if (tries.current < MAX_TRIES) timer = setTimeout(pollSubscription, TICK_MS);
    };

    const tryOrderOnceThenMaybeSub = async () => {
      // Wenn Typ hart Subscription ist, überspringen wir Order komplett
      if (hardType === "subscription") {
        setMode("subscription");
        pollSubscription();
        return;
      }

      try {
        // EINMAL Order prüfen
        const { data } = await http.get<Order>(`/api/payment/checkout/order-by-session/${sessionId}`);
        setMode("order");
        setOrder(data);

        if (data.status === "paid") {
          timer = setTimeout(() => nav("/dashboard", { replace: true }), 1200);
          return;
        }

        // pending → noch kurz pollen (optional)
        tries.current++;
        if (tries.current < MAX_TRIES) {
          timer = setTimeout(tryOrderOnceThenMaybeSub, TICK_MS);
        }
      } catch (e: any) {
        // 404 → keine Order (Subscription-Fall) → auf Subscription-Modus schalten
        setMode("subscription");
        tries.current = 0;
        pollSubscription();
      }
    };

    // Start
    if (mode === "subscription") pollSubscription();
    else tryOrderOnceThenMaybeSub();

    return () => { if (timer) clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, mode, hardType, nav, fetchMe]);

  if (!sessionId) {
    return <div className="py-16 text-center text-red-600">Keine Session-ID erhalten.</div>;
  }

  return (
    <div className="max-w-xl mx-auto text-center space-y-4 py-16">
      <h1 className="text-2xl font-semibold">Zahlung</h1>

      {mode === "order" ? (
        <>
          {!order ? (
            <p>Wir prüfen deine Zahlung (Bestellung) …</p>
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
          <p className="text-xs text-gray-500">Modus: Bestellung</p>
        </>
      ) : (
        <>
          <p className="text-gray-600">Wir aktivieren dein Abo …</p>
          <p className="text-xs text-gray-500">Modus: Subscription</p>
        </>
      )}
    </div>
  );
}
