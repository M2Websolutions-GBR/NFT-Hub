import { useState } from "react";
import {createCreatorCheckoutSession, createCreatorPortalSession} from "../api/httpPayment";
import { isCreatorActive } from "../lib/Subscription";

export function CreatorActions({ user }: { user?: any }) {
  const [busy, setBusy] = useState<"checkout" | "portal" | null>(null);

  const active = isCreatorActive(user);
  const suspended = !!user?.isSuspended;

  async function toCheckout() {
    try {
      setBusy("checkout");
      const { url } = await createCreatorCheckoutSession();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert("Checkout konnte nicht gestartet werden.");
    } finally {
      setBusy(null);
    }
  }

  async function toPortal() {
    try {
      setBusy("portal");
      const { url } = await createCreatorPortalSession();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert("Portal konnte nicht geöffnet werden.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {active ? (
        <button
          onClick={toPortal}
          disabled={busy !== null || suspended}
          className="rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-zinc-200 hover:bg-zinc-50 disabled:opacity-50"
        >
          {busy === "portal" ? "Öffne…" : "Abo verwalten"}
        </button>
      ) : (
        <button
          onClick={toCheckout}
          disabled={busy !== null || suspended}
          className="rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-zinc-200 hover:bg-zinc-50 disabled:opacity-50"
        >
          {busy === "checkout" ? "Weiterleiten…" : "Creator werden"}
        </button>
      )}
    </div>
  );
}
