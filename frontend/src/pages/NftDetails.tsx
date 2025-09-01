// src/pages/NftDetails.tsx
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useMemo, useRef, useState } from "react";
import { useNftDetail } from "../hooks/useNftDetail";
import { useQuery } from "@tanstack/react-query";
import httpAuth from "../api/httpAuth";

// ----------------- Utils -----------------
const toNumber = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const formatPrice = (v: unknown) => {
  const n = toNumber(v, NaN);
  return Number.isFinite(n) ? `${n.toFixed(2)} €` : "—";
};

// ----------------- Hover Magnifier -----------------
function ImageMagnifier({
  src,
  zoom = 2.0,
  lensSize = 160,
}: {
  src: string;
  zoom?: number;
  lensSize?: number;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  return (
    <div
      ref={wrapRef}
      className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100 rounded-lg"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onMouseMove={(e) => {
        const rect = wrapRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setPos({ x, y });
      }}
    >
      <img
        src={src}
        alt="Artwork"
        className="w-full h-full object-cover select-none"
        draggable={false}
      />

      {show && (
        <div
          className="pointer-events-none absolute rounded-full border-2 border-white shadow-lg"
          style={{
            width: lensSize,
            height: lensSize,
            left: pos.x - lensSize / 2,
            top: pos.y - lensSize / 2,
            backgroundImage: `url(${src})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${zoom * 100}% ${zoom * 100}%`,
            backgroundPosition: `${((pos.x || 0) / (wrapRef.current?.clientWidth || 1)) * 100
              }% ${((pos.y || 0) / (wrapRef.current?.clientHeight || 1)) * 100
              }%`,
          }}
        />
      )}
    </div>
  );
}

// ----------------- Page -----------------
export default function NftDetails() {
  const loc = useLocation();
  const [query] = useSearchParams();

  // ID aus state oder ?id=
  const id = (loc.state as any)?.id || query.get("id");

  const { data, isLoading, isError, error } = useNftDetail(id || undefined);
  const nft = data?.nft;
  const creatorFromDetail = data?.creator;

  const { data: creatorHydrated } = useQuery({
    enabled: !!nft?.creatorId && !creatorFromDetail?.avatarUrl, // nur wenn nötig
    queryKey: ["creator-hydrate", nft?.creatorId],
    queryFn: async () => (await httpAuth.get(`/api/auth/user/${nft!.creatorId}`)).data,
    staleTime: 5 * 60 * 1000,
  });

  const creator = creatorHydrated ?? creatorFromDetail;
  console.log("[NftDetails] creator (final) =", creator);

  // Debug
  console.log("[NftDetails] id =", id);
  console.log("[NftDetails] nft =", nft);
  console.log("[NftDetails] creator =", creator);
  console.log("[NftDetails] isLoading =", isLoading, "isError =", isError, "error =", error);

  if (!id) {
    return (
      <div className="py-16 text-center text-red-600">
        Keine NFT-ID übergeben. Öffne diese Seite über „Details“.
      </div>
    );
  }

  const stats = useMemo(() => {
    if (!nft) return { sold: 0, limit: 0, available: 0, isSold: false };
    const sold = toNumber(nft.soldCount ?? nft.editionCount, 0);
    const limit = toNumber(nft.editionLimit, 0);
    const available = Math.max((limit || 0) - (sold || 0), 0);
    const isSold = Boolean(nft.isSoldOut) || (limit > 0 && sold >= limit);
    return { sold, limit, available, isSold };
  }, [nft]);

  if (isLoading) return <div className="py-16 text-center">Lade NFT…</div>;
  if (isError || !nft) {
    console.error("[NftDetails] Fehler oder kein NFT", error);
    return <div className="py-16 text-center text-red-600">NFT nicht gefunden.</div>;
  }

  return (
    <section className="max-w-5xl mx-auto space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Bild + Zoom */}
        <div>
          <ImageMagnifier src={nft.imageUrl} zoom={2.2} lensSize={180} />
          {stats.isSold && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-600 text-white text-xs px-3 py-1">
              <span className="inline-block w-2 h-2 rounded-full bg-white/80" /> Verkauft
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{nft.title}</h1>
            <p className="text-sm text-gray-500">
              Erstellt am {new Date(nft.createdAt).toLocaleDateString()}
            </p>
          </div>

          {nft.description && (
            <p className="text-gray-700 whitespace-pre-wrap">{nft.description}</p>
          )}

          {/* Pricing / Availability */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Preis</div>
              <div className="text-lg font-medium">{formatPrice(nft.price)}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Verkauft</div>
              <div className="text-lg font-medium">
                {stats.sold}/{stats.limit || "∞"}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Verfügbar</div>
              <div className="text-lg font-medium">{stats.available}</div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            {!stats.isSold ? (
              <button className="inline-flex items-center rounded-md bg-black text-white px-4 py-2 hover:opacity-90">
                Kaufen
              </button>
            ) : (
              <button
                disabled
                className="inline-flex items-center rounded-md bg-gray-200 text-gray-500 px-4 py-2 cursor-not-allowed"
              >
                Nicht verfügbar
              </button>
            )}
            <Link to="/market" className="text-sm underline">
              Zurück zum Markt
            </Link>
          </div>

          {/* Creator Card (mit Debug) */}
          {creator && (
            <div className="rounded-2xl border p-4 flex items-center gap-4">
              {creator.avatarUrl ? (
                <img
                  src={creator.avatarUrl}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover border"
                />
              ) : null}

              {/* Fallback-Initialen (sichtbar, wenn kein avatarUrl oder Bildfehler) */}
              <div
                style={{ display: creator.avatarUrl ? "none" : "grid" }}
                className="w-14 h-14 rounded-full bg-gray-200 border place-items-center text-sm text-gray-600"
                title={creator.avatarUrl ? creator.avatarUrl : "Kein Avatar gesetzt"}
              >
                {(creator.username || creator.email || "?").slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1">
                <div className="font-medium">
                  {creator.username || creator.email || "Creator"}
                </div>
                {creator.profileInfo && (
                  <div className="text-sm text-gray-600 line-clamp-2">
                    {creator.profileInfo}
                  </div>
                )}
              </div>

              {/* Hinweis: Falls /creator dein internes Dashboard ist, lieber /creators/:id für öffentliche Profile nutzen */}
              <Link to={`/creator/${nft.creatorId}`} className="text-sm underline">
                Profil ansehen
              </Link>

            </div>
          )}
        </div>
      </div>
    </section>
  );
}
