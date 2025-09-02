// src/pages/AdminDashboard.tsx
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "../api/http"; // ← baseURL = BFF! (VITE_BFF_API)



function toArray<T = any>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  // Häufige API-Formate
  if (data && typeof data === "object") {
    const anyData = data as any;
    if (Array.isArray(anyData.items)) return anyData.items as T[];
    if (Array.isArray(anyData.data)) return anyData.data as T[];
  }
  return [];
}

type NFT = {
  _id: string;
  title: string;
  imageUrl?: string;
  price: number;
  creatorId: string;
  creatorUsername?: string;
  isBlocked?: boolean;
  blockedReason?: string;
  isSoldOut?: boolean;
  editionLimit?: number;
  editionCount?: number;
  soldCount?: number;
  createdAt: string;
};

type User = {
  _id: string;
  email: string;
  username?: string;
  role?: string;
  isSuspended?: boolean;
  suspensionReason?: string;
  suspensionUntil?: string | null;
  avatarUrl?: string;
};

type Order = {
  _id: string;
  userId: string;
  userEmail?: string;
  nftId: string;
  nftTitle?: string;
  amount: number; // € oder Cents; ggf. anpassen
  status: "pending" | "paid" | "refunded" | "void";
  createdAt: string;
  refundedAt?: string;
  refundReason?: string;
  voidedAt?: string;
  voidReason?: string;
};

export default function AdminDashboard() {
  const [tab, setTab] = useState<"nft" | "user" | "orders">("nft");
  const [query, setQuery] = useState("");

  return (
    <section className="max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("nft")}
            className={`px-3 py-1.5 rounded-md border ${
              tab === "nft" ? "bg-black text-white border-black" : "hover:bg-gray-50"
            }`}
          >
            NFTs
          </button>
          <button
            onClick={() => setTab("user")}
            className={`px-3 py-1.5 rounded-md border ${
              tab === "user" ? "bg-black text-white border-black" : "hover:bg-gray-50"
            }`}
          >
            User
          </button>
          <button
            onClick={() => setTab("orders")}
            className={`px-3 py-1.5 rounded-md border ${
              tab === "orders" ? "bg-black text-white border-black" : "hover:bg-gray-50"
            }`}
          >
            Käufe
          </button>
        </div>
      </header>

      <div className="flex items-center gap-2">
        <input
          className="w-full max-w-md border rounded-md px-3 py-2"
          placeholder="Suchen (Titel, E-Mail, ID …)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {tab === "nft" && <NftAdminTable query={query} />}
      {tab === "user" && <UserAdminTable query={query} />}
      {tab === "orders" && <OrderAdminTable query={query} />}
    </section>
  );
}


/* -------------------- NFTs -------------------- */

type NftsResponse = NFT[] | { items: NFT[] } | { data: NFT[] };

export function NftAdminTable({ query }: { query: string }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState("Verstoß gegen Richtlinien");

  const { data, isLoading, isError, error } = useQuery<NftsResponse, Error>({
    queryKey: ["admin-nft", query],
    queryFn: async () => {
      const res = await http.get("/api/admin/nft", { params: { query } }); // plural
      console.log("[AdminDashboard] /api/admin/nft raw:", res.data, typeof res.data);
      return res.data as NftsResponse;
    },
    retry: 1,
  });

  // v5: Errors hier loggen (nicht in useQuery-Optionen)
  useEffect(() => {
    if (isError) {
      const anyErr = error as any;
      console.error(
        "[AdminDashboard] nfts error:",
        anyErr?.response?.status,
        anyErr?.response?.data ?? anyErr?.message
      );
    }
  }, [isError, error]);

  const list = toArray<NFT>(data);
  console.log("[AdminDashboard] nfts normalized length:", list.length);

  const block = useMutation({
    mutationFn: async (vars: { id: string; reason: string }) =>
      http.patch(`/api/admin/nft/${vars.id}/block`, { reason: vars.reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-nft"] }),
    onError: (e: unknown) => {
      const anyErr = e as any;
      console.error("[AdminDashboard] block error:", anyErr?.response?.status, anyErr?.response?.data);
    },
  });

  const unblock = useMutation({
    mutationFn: async (id: string) => http.patch(`/api/admin/nft/${id}/unblock`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-nft"] }),
    onError: (e: unknown) => {
      const anyErr = e as any;
      console.error("[AdminDashboard] unblock error:", anyErr?.response?.status, anyErr?.response?.data);
    },
  });

  if (isLoading) return <div>Lade NFTs…</div>;
  if (isError) {
    return (
      <div className="text-red-600">
        Konnte NFTs nicht laden.
        <pre className="mt-2 text-xs text-gray-600 overflow-auto">
          {JSON.stringify((error as any)?.response?.data ?? { message: (error as any)?.message }, null, 2)}
        </pre>
      </div>
    );
  }

  if (!Array.isArray(list)) {
    return (
      <div className="text-red-600">
        Unerwartete Antwortform (kein Array).
        <pre className="mt-2 text-xs text-gray-600 overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }

  if (list.length === 0) return <div>Keine NFTs gefunden.</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Block-Begründung:</label>
        <input
          className="border rounded px-2 py-1 text-sm"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Grund angeben…"
        />
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-3 py-2">NFT</th>
              <th className="text-left px-3 py-2">Preis</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Erstellt</th>
              <th className="text-left px-3 py-2">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {list.map((n) => (
              <tr key={n._id} className="border-t">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    {n.imageUrl ? (
                      <img src={n.imageUrl} alt="" className="w-12 h-12 object-cover rounded border" />
                    ) : (
                      <div className="w-12 h-12 rounded border bg-gray-100 grid place-items-center text-xs text-gray-500">—</div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate max-w-[220px]">{n.title}</div>
                      <div className="text-xs text-gray-500">ID: {n._id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2">{typeof n.price === "number" ? `${n.price.toFixed(2)} €` : "—"}</td>
                <td className="px-3 py-2">
                  {n.isBlocked ? (
                    <span className="inline-flex items-center rounded bg-red-100 text-red-700 px-2 py-0.5">Blockiert</span>
                  ) : (
                    <span className="inline-flex items-center rounded bg-green-100 text-green-700 px-2 py-0.5">Aktiv</span>
                  )}
                  {n.blockedReason && <div className="text-xs text-gray-500 mt-0.5">Grund: {n.blockedReason}</div>}
                </td>
                <td className="px-3 py-2">{n.createdAt ? new Date(n.createdAt).toLocaleString() : "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {!n.isBlocked ? (
                      <button
                        className="px-2 py-1 border rounded hover:bg-gray-50"
                        onClick={() => block.mutate({ id: n._id, reason })}
                        disabled={block.isPending}
                      >
                        {block.isPending ? "Blockiere…" : "Blockieren"}
                      </button>
                    ) : (
                      <button
                        className="px-2 py-1 border rounded hover:bg-gray-50"
                        onClick={() => unblock.mutate(n._id)}
                        disabled={unblock.isPending}
                      >
                        {unblock.isPending ? "Entsperre…" : "Entsperren"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------- Users -------------------- */

function UserAdminTable({ query }: { query: string }) {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-user", query],
    queryFn: async () => (await http.get<User[]>("/api/admin/user", { params: { query } })).data,
  });

  const suspend = useMutation({
    mutationFn: async (vars: { id: string; reason: string; until?: string }) =>
      http.patch(`/api/admin/user/${vars.id}/suspend`, {
        suspended: true,
        reason: vars.reason,
        until: vars.until,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-user"] }),
  });

  const unsuspend = useMutation({
    mutationFn: async (id: string) => http.patch(`/api/admin/user/${id}/unsuspend`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-user"] }),
  });

  if (isLoading) return <div>Lade User…</div>;
  if (isError) return <div className="text-red-600">Konnte User nicht laden.</div>;

  const list = data ?? [];
  return (
    <div className="border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">User</th>
            <th className="p-3 text-left">Rolle</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {list.map((u) => (
            <tr key={u._id} className="border-t">
              <td className="p-3">
                <div className="font-medium">{u.username || u.email}</div>
                <div className="text-xs text-gray-500">{u._id}</div>
              </td>
              <td className="p-3">{u.role || "—"}</td>
              <td className="p-3">
                {u.isSuspended ? (
                  <div className="flex flex-col">
                    <span className="inline-flex w-fit items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs">
                      Gesperrt
                    </span>
                    {u.suspensionReason && (
                      <span className="text-xs text-gray-500 mt-1">Grund: {u.suspensionReason}</span>
                    )}
                    {u.suspensionUntil && (
                      <span className="text-xs text-gray-500">Bis: {new Date(u.suspensionUntil).toLocaleString()}</span>
                    )}
                  </div>
                ) : (
                  <span className="inline-flex w-fit items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs">
                    Aktiv
                  </span>
                )}
              </td>
              <td className="p-3">
                <div className="flex gap-2">
                  {!u.isSuspended ? (
                    <button
                      className="text-red-600 underline"
                      onClick={() => {
                        const reason = window.prompt("Grund für Sperre:");
                        if (!reason) return;
                        const until = window.prompt("Bis wann? (ISO Datum, optional)");
                        suspend.mutate({ id: u._id, reason, until: until || undefined });
                      }}
                    >
                      Sperren
                    </button>
                  ) : (
                    <button className="underline" onClick={() => unsuspend.mutate(u._id)}>
                      Entsperren
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {!list.length && (
            <tr>
              <td colSpan={4} className="p-6 text-center text-gray-500">
                Keine Ergebnisse.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------- Orders -------------------- */

function OrderAdminTable({ query }: { query: string }) {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-orders", query],
    queryFn: async () => (await http.get<Order[]>("/api/admin/orders", { params: { query } })).data,
  });

  const refund = useMutation({
    mutationFn: async (vars: { id: string; reason?: string }) =>
      http.post(`/api/admin/orders/${vars.id}/refund`, { reason: vars.reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  const voidOrder = useMutation({
    mutationFn: async (vars: { id: string; reason?: string }) =>
      http.post(`/api/admin/orders/${vars.id}/void`, { reason: vars.reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  if (isLoading) return <div>Lade Käufe…</div>;
  if (isError) return <div className="text-red-600">Konnte Käufe nicht laden.</div>;

  const list = data ?? [];
  return (
    <div className="border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Order</th>
            <th className="p-3 text-left">User</th>
            <th className="p-3 text-left">NFT</th>
            <th className="p-3 text-left">Betrag</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {list.map((o) => (
            <tr key={o._id} className="border-t">
              <td className="p-3">
                <div className="font-medium">{o._id}</div>
                <div className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()}</div>
              </td>
              <td className="p-3">
                <div>{o.userEmail || o.userId}</div>
              </td>
              <td className="p-3">
                <div>{o.nftTitle || o.nftId}</div>
              </td>
              <td className="p-3">
                {/* falls Cents: (o.amount/100).toFixed(2) + " €" */}
                {typeof o.amount === "number" ? `${o.amount.toFixed(2)} €` : "—"}
              </td>
              <td className="p-3">
                {o.status === "paid" && (
                  <span className="inline-flex w-fit items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs">
                    Bezahlt
                  </span>
                )}
                {o.status === "refunded" && (
                  <span className="inline-flex w-fit items-center rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs">
                    Erstattet
                  </span>
                )}
                {o.status === "void" && (
                  <span className="inline-flex w-fit items-center rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs">
                    Storniert
                  </span>
                )}
                {o.status === "pending" && (
                  <span className="inline-flex w-fit items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs">
                    Offen
                  </span>
                )}
              </td>
              <td className="p-3">
                <div className="flex gap-2">
                  {o.status === "paid" && (
                    <>
                      <button
                        className="underline"
                        onClick={() => {
                          const reason = window.prompt("Refund-Grund (optional):");
                          refund.mutate({ id: o._id, reason: reason || undefined });
                        }}
                      >
                        Refund
                      </button>
                      <button
                        className="underline"
                        onClick={() => {
                          const reason = window.prompt("Void-Grund (optional):");
                          voidOrder.mutate({ id: o._id, reason: reason || undefined });
                        }}
                      >
                        Void
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {!list.length && (
            <tr>
              <td colSpan={6} className="p-6 text-center text-gray-500">
                Keine Ergebnisse.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
