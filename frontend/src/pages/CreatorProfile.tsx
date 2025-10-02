// src/pages/CreatorProfile.tsx
import { useMemo, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import httpAuth from "../api/httpAuth";
import httpNft from "../api/httpnft";
import { useAuth } from "../store/auth";

type Creator = {
  _id: string;
  username?: string;
  email: string;
  avatarUrl?: string;
  profileInfo?: string;
  role?: string;
};

type NFT = {
  _id: string;
  title: string;
  imageUrl: string;
  price: number; // falls Cents -> Anzeige anpassen
  isSoldOut?: boolean;
  editionLimit?: number;
  editionCount?: number;
  soldCount?: number;
  createdAt: string;
  // optional creatorId (wird im Client-Fallback-Filter genutzt)
  creatorId?: string;
};

type ProfileData = { creator: Creator; nfts: NFT[] };

export default function CreatorProfile() {
  const { id: creatorId } = useParams<{ id: string }>();
  const loc = useLocation();
  const [filter, setFilter] = useState<"all" | "available" | "sold">("all");

  // Auth + Owner-Check
  const { user } = useAuth();
  const userId = (user as any)?._id ?? (user as any)?.id; // robust für beide Varianten
  const isOwner = userId && creatorId && String(userId) === String(creatorId);

  // Rename-States + Mutation
  const qc = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState<string>("");

  const renameNft = useMutation({
    mutationFn: async (vars: { id: string; title: string }) => {
      return httpNft.put(`/${vars.id}`, { title: vars.title.trim() });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creator-profile", creatorId] });
      setEditId(null);
      setNewTitle("");
    },
  });

  console.log("[CreatorProfile] pathname =", loc.pathname, "creatorId =", creatorId);

  // Daten laden (Creator + NFTs)
  const { data, isLoading, isError, error } = useQuery({
    enabled: !!creatorId,
    queryKey: ["creator-profile", creatorId],
    queryFn: async (): Promise<ProfileData> => {
      const [creatorRes, nftsRes] = await Promise.all([
        httpAuth.get<Creator>(`/api/auth/user/${creatorId}`),
        httpNft.get<NFT[]>(`/`, { params: { creatorId } }),
      ]);
      const nftsRaw = nftsRes.data ?? [];
      // Client-Fallback-Filter (falls Service creatorId-Filter ignoriert)
      const nfts = nftsRaw.filter((n) => {
        const cid = (n as any).creatorId;
        return cid ? String(cid) === String(creatorId) : true;
      });

      console.log(
        "[CreatorProfile] NFTs vom Service:",
        nftsRaw.length,
        "→ nach Filter:",
        nfts.length
      );

      return { creator: creatorRes.data, nfts };
    },
    retry: false,
  });

  // Stats IMMER berechnen (Hook-Reihenfolge wahren), defensiv
  const stats = useMemo(() => {
    const list = data?.nfts ?? [];
    const total = list.length;
    const sold = list.reduce(
      (acc, n) => acc + (n.soldCount ?? n.editionCount ?? 0),
      0
    );
    const limit = list.reduce((acc, n) => acc + (n.editionLimit ?? 0), 0);
    const available = Math.max(limit - sold, 0);
    return { total, sold, limit, available };
  }, [data]);

  // Gefilterte Liste (auch als Hook, ohne conditional)
  const filtered = useMemo(() => {
    const list = data?.nfts ?? [];
    return list.filter((n) => {
      const sold = n.soldCount ?? n.editionCount ?? 0;
      const limit = n.editionLimit ?? 0;
      const isSold = Boolean(n.isSoldOut) || (limit > 0 && sold >= limit);
      if (filter === "available") return !isSold;
      if (filter === "sold") return isSold;
      return true; // "all"
    });
  }, [data, filter]);

  // Rückgaben
  if (!creatorId) {
    return (
      <div className="py-16 text-center text-red-600">
        Kein Creator angegeben.
      </div>
    );
  }
  if (isLoading) return <div className="py-16 text-center">Lade Profil…</div>;
  if (isError || !data) {
    console.error("[CreatorProfile] Fehler:", error);
    return (
      <div className="py-16 text-center text-red-600">
        Profil konnte nicht geladen werden.
      </div>
    );
  }

  const { creator } = data;

  return (
    <section className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <header className="rounded-2xl border bg-white p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-4">
          {creator.avatarUrl ? (
            <img
              src={creator.avatarUrl}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover border"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 border grid place-items-center text-sm text-gray-600">
              {(creator.username || creator.email || "?")
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold">
              {creator.username || creator.email}
            </h1>
            {creator.role && (
              <p className="text-xs text-gray-500">Rolle: {creator.role}</p>
            )}
            {creator.profileInfo && (
              <p className="text-sm text-gray-600 mt-1 max-w-prose whitespace-pre-wrap">
                {creator.profileInfo}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">NFTs</div>
            <div className="text-lg font-medium">{stats.total}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">Gesamt Supply</div>
            <div className="text-lg font-medium">{stats.limit}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">Verkauft</div>
            <div className="text-lg font-medium">{stats.sold}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">Verfügbar</div>
            <div className="text-lg font-medium">{stats.available}</div>
          </div>
        </div>
      </header>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-md border ${
            filter === "all" ? "bg-black text-white border-black" : "hover:bg-gray-50"
          }`}
        >
          Alle
        </button>
        <button
          onClick={() => setFilter("available")}
          className={`px-3 py-1.5 rounded-md border ${
            filter === "available" ? "bg-black text-white border-black" : "hover:bg-gray-50"
          }`}
        >
          Verfügbar
        </button>
        <button
          onClick={() => setFilter("sold")}
          className={`px-3 py-1.5 rounded-md border ${
            filter === "sold" ? "bg-black text-white border-black" : "hover:bg-gray-50"
          }`}
        >
          Verkauft
        </button>
      </div>

      {/* Grid */}
      {!filtered.length ? (
        <p className="text-gray-600">Keine NFTs in dieser Ansicht.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((nft) => {
            const sold = nft.soldCount ?? nft.editionCount ?? 0;
            const limit = nft.editionLimit ?? 0;
            const isSold =
              Boolean(nft.isSoldOut) || (limit > 0 && sold >= limit);

            return (
              <article
                key={nft._id}
                className={`relative border rounded-lg overflow-hidden ${
                  isSold ? "opacity-60 grayscale" : ""
                }`}
              >
                <div className="aspect-[4/3] bg-gray-100 relative">
                  <img
                    src={nft.imageUrl}
                    alt={nft.title}
                    className="w-full h-full object-cover"
                  />
                  {isSold && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-lg font-semibold uppercase tracking-wider">
                        Verkauft
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-medium line-clamp-1">{nft.title}</h3>
                  <div className="text-sm text-gray-600">
                    {/* Falls Preis Cents sind: {(nft.price/100).toFixed(2)} € */}
                    {typeof nft.price === "number"
                      ? `${nft.price.toFixed(2)} €`
                      : "—"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {sold}/{limit || "∞"} verkauft
                  </div>

                  {/* Actions: Details + (nur Owner) Umbenennen */}
                  <div className="pt-2 flex items-center gap-3">
                    <Link
                      to="/details"
                      state={{ id: nft._id }}
                      className="text-sm underline"
                    >
                      Details
                    </Link>

                    {isOwner && (
                      <>
                        {editId === nft._id ? (
                          <form
                            className="flex items-center gap-2"
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!newTitle.trim()) return;
                              renameNft.mutate({
                                id: nft._id,
                                title: newTitle,
                              });
                            }}
                          >
                            <input
                              className="text-sm border rounded px-2 py-1"
                              value={newTitle}
                              onChange={(e) => setNewTitle(e.target.value)}
                              disabled={renameNft.isPending}
                            />
                            <button
                              type="submit"
                              disabled={
                                renameNft.isPending || !newTitle.trim()
                              }
                              className="text-sm inline-flex items-center rounded-md bg-black text-white px-2 py-1 disabled:opacity-60"
                              title="Speichern"
                            >
                              Speichern
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditId(null);
                                setNewTitle("");
                              }}
                              className="text-sm underline"
                              disabled={renameNft.isPending}
                            >
                              Abbrechen
                            </button>
                          </form>
                        ) : (
                          <button
                            type="button"
                            className="text-sm underline"
                            onClick={() => {
                              setEditId(nft._id);
                              setNewTitle(nft.title);
                            }}
                          >
                            Umbenennen
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Optionaler Status */}
                  {renameNft.isError && editId === nft._id && (
                    <div className="text-xs text-red-600 mt-1">
                      {(renameNft.error as any)?.response?.data?.message ??
                        "Speichern fehlgeschlagen"}
                    </div>
                  )}
                  {renameNft.isSuccess && editId === null && (
                    <div className="text-xs text-green-700 mt-1">Gespeichert.</div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
