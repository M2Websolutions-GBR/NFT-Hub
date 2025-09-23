// Typ erlaubt User-ähnliche Objekte, null oder undefined
export type SubLike =
  | {
      isSubscribed?: boolean;
      subscriptionExpires?: string | Date | null;
      isSuspended?: boolean;
    }
  | null
  | undefined;

// Hilfsfunktion: konvertiert string/Date zu Millisekunden
function toMillis(d?: string | Date | null): number | null {
  if (!d) return null;
  if (d instanceof Date) return d.getTime();
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : null;
}

// true, wenn aktiv (abonniert, nicht gesperrt, Ablaufdatum in Zukunft)
export function isCreatorActive(user: SubLike): boolean {
  if (!user) return false;
  if (user.isSuspended) return false;
  if (!user.isSubscribed) return false;
  const exp = toMillis(user.subscriptionExpires);
  return !!exp && Date.now() < exp;
}

// Status in Textform
export function creatorStatus(
  user: SubLike
): "active" | "expired" | "none" | "suspended" {
  if (!user) return "none";
  if (user.isSuspended) return "suspended";
  if (!user.isSubscribed) return "none";
  if (!user.subscriptionExpires) return "none";
  return isCreatorActive(user) ? "active" : "expired";
}

// Datum schön formatiert
export function fmtDate(d?: string | Date | null): string {
  const ms = toMillis(d);
  return ms ? new Date(ms).toLocaleString() : "—";
}
