import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import httpNft from "../api/httpnft"; // <— Dateiname beachten!
import { useAuth } from "../store/auth";

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

export default function CreatorDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Avatar-URL sicher lesen (Store-User evtl. ohne Typfeld)
  const avatarUrl = (user as any)?.avatarUrl as string | undefined;

  // ---- eigene NFTs laden ----
  const { data: myNfts, isLoading } = useQuery({
    queryKey: ["creator-nfts"],
    queryFn: async () => {
      const { data } = await httpNft.get<NFT[]>("/api/nft/mine"); // ✅ relativ gegen VITE_API_NFT_URL
      return data;
    },
  });

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
  const { register, handleSubmit, reset, formState: { isSubmitting } } =
    useForm<UploadForm>({ defaultValues: { title: "", description: "", price: 0, editionLimit: 1 } });

  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    return () => { if (filePreview) URL.revokeObjectURL(filePreview); };
  }, [filePreview]);

  const createNft = useMutation({
    mutationFn: async (formData: FormData) => {
      // ✅ korrekt: POST /upload (multipart/form-data)
      const { data } = await httpNft.post<NFT>("api/nft/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creator-nfts"] });
    }
  });

  const onSubmit = async (v: UploadForm) => {
    setErr(null); setOk(null);
    try {
      const file = v.image?.[0];
      if (!file) throw new Error("Bitte ein Bild auswählen.");
      if (!file.type.startsWith("image/")) throw new Error("Nur Bilddateien erlaubt.");
      if (file.size > 8 * 1024 * 1024) throw new Error("Max. 8 MB");

      // Falls Backend Cents erwartet:
      // const priceCents = Math.round(Number(v.price) * 100);

      const fd = new FormData();
      fd.append("title", v.title.trim());
      if (v.description?.trim()) fd.append("description", v.description.trim());
      fd.append("price", String(v.price));               // oder String(priceCents)
      fd.append("editionLimit", String(v.editionLimit));
      fd.append("image", file);                          // Feldname MUSS "image" sein!

      await createNft.mutateAsync(fd);

      setOk("NFT erstellt.");
      reset({ title: "", description: "", price: 0, editionLimit: 1, image: undefined as any });
      if (filePreview) URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Upload fehlgeschlagen");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Profile Header */}
      <section className="rounded-2xl border bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border">?</div>
            )}
            <div>
              <h1 className="text-xl font-semibold">
                {user?.username || user?.email || "Creator"}
              </h1>
              <p className="text-sm text-gray-600 max-w-prose">
                {user?.profileInfo || "Beschreibe dich und deine Werke auf deiner Profilseite."}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                document.getElementById("nft-upload-form")?.scrollIntoView({ behavior: "smooth" })
              }
              className="inline-flex items-center rounded-md bg-black text-white px-3 py-1.5 hover:opacity-90"
            >
              + NFT hochladen
            </button>

            <Link to="/profile" className="inline-flex items-center rounded-md border px-3 py-1.5 hover:bg-gray-50">
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
      </section>

      {/* Main Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload */}
        <div className="lg:col-span-1 rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Neues NFT erstellen</h2>

          <form id="nft-upload-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <label className="block">
              <span className="block text-sm mb-1">Titel</span>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
                placeholder="z. B. Neon Dreams"
                {...register("title", { required: true })}
              />
            </label>

            <label className="block">
              <span className="block text-sm mb-1">Beschreibung (optional)</span>
              <textarea
                className="w-full min-h-[100px] rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
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
                  className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
                  placeholder="0.00"
                  {...register("price", { valueAsNumber: true })}
                />
              </label>
              <label className="block">
                <span className="block text-sm mb-1">Edition Limit</span>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black/20"
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
          </form>
        </div>

        {/* Meine NFTs */}
        <div className="lg:col-span-2 rounded-2xl border bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Meine NFTs</h2>
            <Link to="/market" className="text-sm underline">Zum Marktplatz</Link>
          </div>

          {isLoading ? (
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
                const available = Math.max(limit - sold, 0);
                return (
                  <article key={nft._id} className="border rounded-lg overflow-hidden">
                    <div className="aspect-[4/3] bg-gray-100">
                      <img src={nft.imageUrl} alt={nft.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-medium line-clamp-1">{nft.title}</h3>
                      <div className="text-sm text-gray-600">
                        {nft.price.toFixed(2)} €
                        {/* Falls Preis als Cents: (nft.price/100).toFixed(2) + " €" */}
                      </div>
                      <div className="text-xs text-gray-500">
                        {sold}/{limit} verkauft • {available} verfügbar
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
