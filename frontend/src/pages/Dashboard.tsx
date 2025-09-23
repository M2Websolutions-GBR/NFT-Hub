import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyOrders } from "../api/httpPayment";
import { getByIds } from "../api/nft";
import type { Order } from "../api/httpPayment";
// import type { NFT } from "../api/nft";
import { Link } from "react-router-dom";
import { useAuth } from "../store/auth";
// type Enriched = Order & { nft?: NFT };

type Tab = "paid" | "pending" | "all";

function StatusBadge({ s }: { s: Order["status"] }) {
  const map: Record<Order["status"], string> = {
    paid: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    pending: "bg-amber-100 text-amber-800 ring-amber-200",
    failed: "bg-rose-100 text-rose-700 ring-rose-200",
    refunded: "bg-sky-100 text-sky-700 ring-sky-200",
    void: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ${map[s]}`}>
      {s}
    </span>
  );
}



function SegmentedTabs({
  value,
  onChange,
  counts,
}: {
  value: Tab;
  onChange: (t: Tab) => void;
  counts: { paid: number; pending: number; all: number };
}) {
  const base = "flex-1 inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm ring-1";
  const active = "bg-black text-white ring-black";
  const inactive = "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50";
  return (
    <div className="inline-grid grid-cols-3 gap-1 rounded-md p-1 ring-1 ring-zinc-200 bg-zinc-50">
      <button
        className={`${base} ${value === "paid" ? active : inactive}`}
        onClick={() => onChange("paid")}
      >
        Bezahlt <span className="ml-1 opacity-70">({counts.paid})</span>
      </button>
      <button
        className={`${base} ${value === "pending" ? active : inactive}`}
        onClick={() => onChange("pending")}
      >
        Ausstehend <span className="ml-1 opacity-70">({counts.pending})</span>
      </button>
      <button
        className={`${base} ${value === "all" ? active : inactive}`}
        onClick={() => onChange("all")}
      >
        Alle <span className="ml-1 opacity-70">({counts.all})</span>
      </button>
    </div>
  );
}

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("paid"); // Standard: nur bezahlte anzeigen

  // Orders laden
  const ordersQ = useQuery({ queryKey: ["orders-mine"], queryFn: getMyOrders });

  // NFT-IDs sammeln
  const nftIds = useMemo(
    () => [...new Set((ordersQ.data ?? []).map((o) => o.nftId))],
    [ordersQ.data]
  );

  // NFTs laden (Batch)
  const nftsQ = useQuery({
    queryKey: ["nft-batch", nftIds],
    enabled: nftIds.length > 0,
    queryFn: () => getByIds(nftIds),
  });

  

  // Orders + NFTs zusammenführen
 const enriched = useMemo(() => {
  const map = new Map<string, any>();

  (nftsQ.data ?? []).forEach((row: any) => {
    // falls Wrapper mit { nft, creator } -> inneres nft nehmen
    const doc = row?.nft ?? row;
    if (doc?._id) {
      map.set(String(doc._id), doc);
    }
  });

  return (ordersQ.data ?? []).map((o) => ({
    ...o,
    nft: map.get(String(o.nftId)), // -> echtes NFT-Objekt
  }));
}, [ordersQ.data, nftsQ.data]);

  // Counts & gefilterte Liste
  const counts = useMemo(() => {
    const all = enriched.length;
    const paid = enriched.filter((o) => o.status === "paid").length;
    const pending = enriched.filter((o) => o.status === "pending").length;
    return { all, paid, pending };
  }, [enriched]);

  const filtered = useMemo(() => {
    if (tab === "all") return enriched;
    if (tab === "paid") return enriched.filter((o) => o.status === "paid");
    return enriched.filter((o) => o.status === "pending");
  }, [enriched, tab]);

  useEffect(() => {
  if (ordersQ.isSuccess) {
    console.log("[BuyerDashboard] ordersQ.data", ordersQ.data);
  }
}, [ordersQ.isSuccess, ordersQ.data]);

useEffect(() => {
  if (nftsQ.isSuccess) {
    console.log("[BuyerDashboard] nftsQ.data", nftsQ.data);
  }
}, [nftsQ.isSuccess, nftsQ.data]);

useEffect(() => {
  if (enriched.length) {
    console.log("[BuyerDashboard] enriched (Order→NFT)", enriched.map(e => ({
      orderId: e._id,
      nftId: e.nftId,
      hasNFT: !!e.nft,
      imageUrl: e.nft?.imageUrl,
      imagePublicId: (e.nft as any)?.imagePublicId,
      title: e.nft?.title,
    })));
  }
}, [enriched]);

  const loading = ordersQ.isLoading || (nftIds.length > 0 && nftsQ.isLoading);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <section className="rounded-2xl border bg-white p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Avatar"
                className="h-14 w-14 rounded-full object-cover ring-1 ring-zinc-200"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-zinc-100 ring-1 ring-zinc-200" />
            )}
            <div>
              <div className="text-sm text-gray-600">Eingeloggt als</div>
              <div className="text-lg font-semibold">
                {user?.username || user?.email || "User"}
              </div>
              <div className="text-sm text-gray-600">Rolle: {user?.role ?? "—"}</div>
            </div>
          </div>
          <Link
            to="/market"
            className="inline-flex items-center rounded-md border px-3 py-1.5 hover:bg-gray-50"
          >
            Zum Marktplatz
          </Link>
        </div>
      </section>

      {/* Orders mit Tabs */}
      <section className="rounded-2xl border bg-white p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="text-lg font-semibold">Meine Käufe</h2>

          <div className="flex items-center gap-3">
            <SegmentedTabs
              value={tab}
              onChange={setTab}
              counts={{ paid: counts.paid, pending: counts.pending, all: counts.all }}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-lg overflow-hidden">
                <div className="aspect-[4/3] bg-gray-100 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 animate-pulse rounded w-2/3" />
                  <div className="h-3 bg-gray-100 animate-pulse rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-md border border-zinc-200 p-6 text-center text-zinc-600">
            {tab === "paid"
              ? "Du hast noch keine bezahlten Käufe."
              : tab === "pending"
                ? "Aktuell keine ausstehenden Käufe."
                : "Du hast noch keine Käufe getätigt."}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((o) => {
              const n = o.nft;
              return (
                <article
                  key={o._id}
                  className="border rounded-lg overflow-hidden hover:shadow transition-shadow"
                >
                  <div className="aspect-[4/3] bg-gray-100">
                    {n?.imageUrl ? (
                      <img
                        src={n.imageUrl}
                        alt={n.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        kein Bild
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium line-clamp-1">{n?.title || "NFT"}</h3>
                      <StatusBadge s={o.status} />
                    </div>
                    <div className="text-sm text-gray-600">
                      {(o.amount ?? 0).toFixed(2)} €
                    </div>
                    <div className="text-xs text-gray-500">
                      gekauft am {new Date(o.createdAt).toLocaleString()}
                    </div>

                    {o.status === "paid" && (
                      <div className="pt-1">
                        <Link
                          to="/details"
                          state={{ id: o.nftId }}  // oder: state={{ id: n?._id }}
                          className="text-sm underline"
                        >
                          Details
                        </Link>
                      </div>
                    )}

                    {o.status === "pending" && (
                      <div className="pt-1 text-xs text-amber-700">
                        Zahlung wird verarbeitet. Aktualisiere später oder prüfe deine E-Mails.
                      </div>
                    )}
                  </div>
                </article>

              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}