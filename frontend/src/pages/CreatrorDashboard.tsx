// src/pages/CreatorDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import httpNft from "../api/httpnft"; // <— Dateiname beachten!
import http from "../api/http";
import { useAuth } from "../store/auth";

// Neu: Abo-UI
import CreatorBadge from "../components/CreatorBadge";
import { CreatorActions } from "../components/CreatorActions";
import { isCreatorActive } from "../lib/Subscription";

type NFT = {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  imagePublicId: string;
  price: number;
  isSoldOut: boolean;
  editionLimit: number;
  editionCount: number;
  soldCount?: number;
  createdAt: string;
};

type UploadForm = {
  title: string;
  description?: string;
  price: number;
  editionLimit: number;
  image: FileList; // muss "image" heißen (multer.single('image'))
};

// Orders + Formatter
type CreatorOrder = {
  id: string;
  nftId: string;
  amount?: number;       // 👈 neu: wir erwarten 'amount' aus Payment (Cents)
  price?: number;
  currency?: string;
  status: "paid" | "refunded" | "failed" | "pending" | string;
  createdAt: string;
  buyerEmail?: string;
  buyerName?: string;    // 👈 falls BFF das liefert
  nftTitle?: string;
  nftImage?: string;
};

type OrdersResponse = { items: CreatorOrder[]; page: number; pages: number; total: number };

const formatEuroFromCents = (cents?: number, currency = "EUR") => {
  const n = typeof cents === "number" ? cents : 0;
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(n / 100);
};
const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

export default function CreatorDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const avatarUrl = (user as any)?.avatarUrl as string | undefined;
  const creatorActive = isCreatorActive(user);

  // ---- eigene NFTs laden ----
  const { data: myNfts, isLoading } = useQuery({
    queryKey: ["creator-nfts", user?._id],
    enabled: !!user, // nur wenn eingeloggt
    queryFn: async () => {
      const { data } = await httpNft.get<NFT[]>("/api/nft/mine");
      return data;
    },
  });
  const myNftIds = useMemo(() => {
    return new Set((myNfts ?? []).map(n => String(n._id)));
  }, [myNfts]);

  // ---- Stats berechnen ----
  const stats = useMemo(() => {
    const list = myNfts ?? [];
    const total = list.length;
    const sold = list.reduce((acc, n) => acc + (n.soldCount ?? n.editionCount ?? 0), 0);
    const supply = list.reduce((acc, n) => acc + (n.editionLimit ?? 0), 0);
    const available = Math.max(supply - sold, 0);
    return { total, sold, supply, available };
  }, [myNfts]);

  // ---- Upload Formular ----
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<UploadForm>({
    defaultValues: { title: "", description: "", price: 0, editionLimit: 1 },
  });

  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const createNft = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await httpNft.post<NFT>("/api/nft/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creator-nfts", user?._id] });
    },
  });

  const onSubmit = async (v: UploadForm) => {
    setErr(null);
    setOk(null);
    try {
      if (!creatorActive) {
        throw new Error("Creator-Abo nötig, um NFTs hochzuladen.");
      }

      const file = v.image?.[0];
      if (!file) throw new Error("Bitte ein Bild auswählen.");
      if (!file.type.startsWith("image/")) throw new Error("Nur Bilddateien erlaubt.");
      if (file.size > 8 * 1024 * 1024) throw new Error("Max. 8 MB");

      const fd = new FormData();
      fd.append("title", v.title.trim());
      if (v.description?.trim()) fd.append("description", v.description.trim());
      fd.append("price", String(v.price)); // oder Cents: Math.round(price*100)
      fd.append("editionLimit", String(v.editionLimit));
      fd.append("image", file); // Feldname MUSS "image" sein!

      await createNft.mutateAsync(fd);

      setOk("NFT erstellt.");
      reset({ title: "", description: "", price: 0, editionLimit: 1, image: undefined as any });
      if (filePreview) URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Upload fehlgeschlagen");
    }
  };

  // ---- Orders: State & Query ----
  const [orderStatus, setOrderStatus] = useState<"paid" | "refunded" | "all">("paid");
  const [orderPage, setOrderPage] = useState(1);
  const [orderLimit] = useState(12);
  const [orderQ, setOrderQ] = useState("");

  const {
    data: orderData,
    isLoading: ordersLoading,
    isError: ordersError,
    isFetching: ordersFetching,
  } = useQuery({
    queryKey: ["creator-orders", { orderStatus, orderPage, orderLimit, orderQ }],
    queryFn: async (): Promise<OrdersResponse> => {
      const { data } = await http.get<OrdersResponse>("/api/creator/orders", {
        params: { status: orderStatus, page: orderPage, limit: orderLimit, q: orderQ },
      });
      return data;
    },
    staleTime: 30_000,
  });

  // 🔹 Nur Orders behalten, deren nftId zu meinen NFTs gehört
  const filteredOrders = useMemo(() => {
    const items = orderData?.items ?? [];
    // solange myNfts noch lädt, NICHT filtern, damit die Liste nicht „flackert“
    if (!myNfts) return items;
    return items.filter(o => myNftIds.has(String(o.nftId)));
  }, [orderData?.items, myNfts, myNftIds]);


  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Profile / Header */}
      <section className="rounded-2xl border bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover border"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border">
                ?
              </div>
            )}
            <div>
              <h1 className="text-xl font-semibold">
                {user?.username || user?.email || "Creator"}
              </h1>
              <p className="text-sm text-gray-600 max-w-prose">
                {user?.profileInfo || "Beschreibe dich und deine Werke auf deiner Profilseite."}
              </p>
              <div className="mt-2">
                <CreatorBadge user={user} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CreatorActions user={user} />
            <Link
              to="/profile"
              className="inline-flex items-center rounded-md border px-3 py-1.5 hover:bg-gray-50"
            >
              Profil bearbeiten
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">NFTs</div>
            <div className="text-lg font-medium">{stats.total}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">Gesamt Supply</div>
            <div className="text-lg font-medium">{stats.supply}</div>
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

        {!creatorActive && (
          <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <b>Creator-Abo benötigt.</b> Lade erst dein Abo, um NFTs hochzuladen und zu verwalten.
          </div>
        )}
      </section>

      {/* Main Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload */}
        <div className="lg:col-span-1 rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Neues NFT erstellen</h2>

          <form id="nft-upload-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <fieldset disabled={!creatorActive} className="space-y-4">
              <label className="block">
                <span className="block text-sm mb-1">Titel</span>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20 disabled:bg-gray-50"
                  placeholder="z. B. Neon Dreams"
                  {...register("title", { required: true })}
                />
              </label>

              <label className="block">
                <span className="block text-sm mb-1">Beschreibung (optional)</span>
                <textarea
                  className="w-full min-h-[100px] rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20 disabled:bg-gray-50"
                  placeholder="Worum geht's in diesem Piece?"
                  {...register("description")}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-sm mb-1">Preis</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20 disabled:bg-gray-50"
                    placeholder="0.00"
                    {...register("price", { valueAsNumber: true })}
                  />
                </label>
                <label className="block">
                  <span className="block text-sm mb-1">Edition Limit</span>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20 disabled:bg-gray-50"
                    placeholder="1"
                    {...register("editionLimit", { valueAsNumber: true })}
                  />
                </label>
              </div>

              <label className="block">
                <span className="block text-sm mb-1">Artwork (Bild)</span>
                <input
                  type="file"
                  accept="image/*"
                  {...register("image", { required: true })}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (filePreview) URL.revokeObjectURL(filePreview);
                      setFilePreview(URL.createObjectURL(f));
                    } else {
                      if (filePreview) URL.revokeObjectURL(filePreview);
                      setFilePreview(null);
                    }
                  }}
                />
              </label>

              {filePreview && (
                <div className="aspect-[4/3] bg-gray-100 rounded-md overflow-hidden">
                  <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              {err && <p className="text-sm text-red-600">{err}</p>}
              {ok && <p className="text-sm text-green-700">{ok}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center rounded-md bg-black text-white px-4 py-2 hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting ? "Erstelle…" : "Erstellen"}
              </button>
            </fieldset>

            {!creatorActive && (
              <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                Dieses Formular ist gesperrt. <span className="font-medium">Werde Creator</span>, um NFTs hochzuladen.
                <div className="mt-2">
                  <CreatorActions user={user} />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Meine NFTs */}
        <div className="lg:col-span-2 rounded-2xl border bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Meine NFTs</h2>
            <Link to="/market" className="text-sm underline">
              Zum Marktplatz
            </Link>
          </div>

          {!creatorActive ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-800">
              Deine Werke siehst du hier, sobald dein Creator-Abo aktiv ist.
            </div>
          ) : isLoading ? (
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
          ) : !myNfts?.length ? (
            <p className="text-gray-600">Du hast noch keine NFTs erstellt.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(myNfts || []).map((nft) => {
                const sold = nft.soldCount ?? nft.editionCount ?? 0;
                const limit = nft.editionLimit ?? 0;
                const isSold = Boolean(nft.isSoldOut) || (limit > 0 && sold >= limit);

                return (
                  <article
                    key={nft._id}
                    className={`relative border rounded-lg overflow-hidden ${isSold ? "opacity-60 grayscale" : ""}`}
                  >
                    <div className="aspect-[4/3] bg-gray-100 relative">
                      <img src={nft.imageUrl} alt={nft.title} className="w-full h-full object-cover" />

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
                        {nft.price.toFixed(2)} €
                        {/* Falls Cents: {(nft.price / 100).toFixed(2)} € */}
                      </div>
                      <div className="text-xs text-gray-500">{sold}/{limit || "∞"} verkauft</div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Meine Verkäufe / Orders */}
        <section className="lg:col-span-3 rounded-2xl border bg-white p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Meine Verkäufe</h2>
              <p className="text-sm text-gray-600">
                Zeigt deine Orders (Status: {orderStatus}){ordersFetching ? " …lädt" : ""}.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={orderQ}
                onChange={(e) => {
                  setOrderQ(e.target.value);
                  setOrderPage(1);
                }}
                placeholder="Suche (NFT-ID, Käufer, Status…)"
                className="w-full sm:w-64 rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
              />
              <select
                value={orderStatus}
                onChange={(e) => {
                  setOrderStatus(e.target.value as any);
                  setOrderPage(1);
                }}
                className="rounded-md border px-3 py-2"
              >
                <option value="paid">Bezahlt</option>
                <option value="refunded">Refunded</option>
                <option value="all">Alle</option>
              </select>
            </div>
          </div>

          {ordersLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          ) : ordersError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Konnte Orders nicht laden.
            </div>
          ) : (filteredOrders.length ?? 0) === 0 ? (
            <p className="text-gray-600">Noch keine Verkäufe deiner NFTs auf dieser Seite gefunden.</p>
          ) : (
            <>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredOrders.map((o) => {
                  const cents = typeof o.amount === "number" ? o.amount
                    : typeof o.price === "number" ? o.price : 0;
                  const currency = (o.currency || "EUR").toUpperCase();
                  return (
                    <li key={o.id} className="rounded-lg border overflow-hidden">
                      <div className="flex gap-3 p-3">
                        <div className="h-16 w-16 shrink-0 rounded-md overflow-hidden bg-gray-100 grid place-items-center text-xs text-gray-500">
                          {o.nftImage ? (
                            <img src={o.nftImage} alt={o.nftTitle ?? o.nftId} className="h-full w-full object-cover" />
                          ) : (
                            "NFT"
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{o.nftTitle ?? `NFT #${o.nftId}`}</div>
                          <div className="text-xs text-gray-600">{formatDateTime(o.createdAt)}</div>
                          <div className="mt-1 text-sm">
                            {formatEuroFromCents(cents, currency)}
                            {o.status !== "paid" && (
                              <span className="ml-2 rounded bg-yellow-500/20 px-1.5 py-0.5 text-xs uppercase">
                                {o.status}
                              </span>
                            )}
                          </div>
                          {(o.buyerName || o.buyerEmail || (o as any).buyerId) && (
                            <div className="text-xs text-gray-500 truncate">
                              Gekauft von: {o.buyerName || o.buyerEmail || `User ${String((o as any).buyerId || "").slice(0, 6)}…`}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Seite {orderData?.page ?? orderPage} / {orderData?.pages ?? 1}
                </span>
                <div className="flex gap-2">
                  <button
                    className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                    onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                    disabled={(orderData?.page ?? orderPage) <= 1}
                  >
                    Zurück
                  </button>
                  <button
                    className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                    onClick={() => setOrderPage((p) => p + 1)}
                    disabled={(orderData?.page ?? orderPage) >= (orderData?.pages ?? 1)}
                  >
                    Weiter
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </section>
    </div>
  );
}
