import { creatorStatus, fmtDate } from "../lib/Subscription";

export default function CreatorBadge({ user }: { user?: any }) {
  const status = creatorStatus(user);
  if (status === "none") return null;

  const cls =
    status === "active" ? "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/30" :
    status === "suspended" ? "bg-rose-500/15 text-rose-600 ring-1 ring-rose-500/30" :
    "bg-zinc-500/15 text-zinc-600 ring-1 ring-zinc-500/30";

  const info =
    status === "active" ? ` • bis ${fmtDate(user?.subscriptionExpires)}` :
    status === "suspended" ? "" : " • abgelaufen";

  const label =
    status === "active" ? "Creator aktiv" :
    status === "suspended" ? "Gesperrt" : "Creator inaktiv";

  return <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${cls}`}>{label}{info}</span>;
}
