// src/pages/NftDetails.tsx
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useNftDetail } from "../hooks/useNftDetail";
import { useQuery } from "@tanstack/react-query";
import httpAuth from "../api/httpAuth";
import httpPayment from "../api/httpPayment"
import { useAuth } from "../store/auth";




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
  zoom = 2.2,
  lensSize = 180,
  bleed = 24, // sichtbar über Bildkante hinaus (px)
}: {
  src: string;
  zoom?: number;
  lensSize?: number;
  bleed?: number;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const imgRef  = useRef<HTMLImageElement | null>(null);

  const [active, setActive] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0 }); // Wrapper-Koords
  const [dims, setDims] = useState({
    naturalW: 0, naturalH: 0,
    wrapW: 0, wrapH: 0,
    imgW: 0, imgH: 0,   // gerenderte Bildfläche
    offX: 0, offY: 0,   // Position der Bildfläche im Wrapper
  });

  const recompute = useCallback(() => {
    const wrap = wrapRef.current;
    const img  = imgRef.current;
    if (!wrap || !img) return;

    const { width: wrapW, height: wrapH } = wrap.getBoundingClientRect();
    const naturalW = img.naturalWidth || 0;
    const naturalH = img.naturalHeight || 0;

    const scale = Math.min(wrapW / naturalW, wrapH / naturalH);
    const imgW = naturalW * scale;
    const imgH = naturalH * scale;
    const offX = (wrapW - imgW) / 2;
    const offY = (wrapH - imgH) / 2;

    setDims({ naturalW, naturalH, wrapW, wrapH, imgW, imgH, offX, offY });
  }, []);

  useEffect(() => {
    recompute();
    const ro = new ResizeObserver(recompute);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [recompute]);

  // globales Tracking, damit Linse auch außerhalb weiterläuft
  useEffect(() => {
    if (!active) return;
    const onMove = (e: MouseEvent) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Tracking beendet erst außerhalb des erweiterten Rahmens
      if (x < -bleed || x > rect.width + bleed || y < -bleed || y > rect.height + bleed) {
        setActive(false);
        return;
      }
      setCursor({ x, y });
    };
    const stop = () => setActive(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("blur", stop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("blur", stop);
    };
  }, [active, bleed]);

  // Fokuspunkt in Bildkoordinaten (0..imgW / 0..imgH), am Rand geklemmt
  const focusX = Math.max(0, Math.min(dims.imgW, cursor.x - dims.offX));
  const focusY = Math.max(0, Math.min(dims.imgH, cursor.y - dims.offY));

  // Overlay deckt Bildfläche + Bleed → Linse bleibt etwas außerhalb sichtbar
  const overlayLeft = dims.offX - bleed;
  const overlayTop  = dims.offY - bleed;
  const overlayW    = dims.imgW + bleed * 2;
  const overlayH    = dims.imgH + bleed * 2;

  // Linse frei platzieren (keine Clamps), relativ zum Overlay
  const lensLeft = cursor.x - overlayLeft - lensSize / 2;
  const lensTop  = cursor.y - overlayTop  - lensSize / 2;

  // Hintergrund exakt zentrieren:
  // top-left der Textur so verschieben, dass (focusX,focusY) unter der Linsenmitte (L/2,L/2) liegt
  const bgW = dims.imgW * zoom;
  const bgH = dims.imgH * zoom;
  const bgPosXpx = (lensSize / 2) - (focusX * zoom);
  const bgPosYpx = (lensSize / 2) - (focusY * zoom);

  const aspectRatio =
    dims.naturalW && dims.naturalH ? `${dims.naturalW} / ${dims.naturalH}` : "4 / 3";

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden bg-gray-100 rounded-lg"
      style={{ aspectRatio }}
      onMouseEnter={() => setActive(true)}
    >
      <img
        ref={imgRef}
        src={src}
        alt="Artwork"
        className="w-full h-full object-contain select-none"
        draggable={false}
        onLoad={recompute}
      />

      {active && dims.imgW > 0 && dims.imgH > 0 && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: overlayLeft,
            top: overlayTop,
            width: overlayW,
            height: overlayH,
            overflow: "hidden", // schneidet die Linse nur knapp außerhalb ab
          }}
          // Mausbewegung im Wrapper initialisiert tracking; global bewegt weiter
          onMouseMove={(e) => {
            const rect = wrapRef.current?.getBoundingClientRect();
            if (!rect) return;
            setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }}
        >
          <div
            className="absolute rounded-full border-2 border-white shadow-lg"
            style={{
              width: lensSize,
              height: lensSize,
              left: lensLeft,
              top:  lensTop,
              backgroundImage: `url(${src})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${bgW}px ${bgH}px`,
              backgroundPosition: `${bgPosXpx}px ${bgPosYpx}px`, // ← pixelgenau!
            }}
          />
        </div>
      )}
    </div>
  );
}


// ----------------- Page -----------------
export default function NftDetails() {
  const loc = useLocation();
  const [query] = useSearchParams();
  const [buying, setBuying] = useState(false);

  // ID aus state oder ?id=
  const id = (loc.state as any)?.id || query.get("id");

  const { data, isLoading, isError, error } = useNftDetail(id || undefined);
  const nft = data?.nft;
  const creatorFromDetail = data?.creator;
  const { user } = useAuth();

  // Creator ggf. “hydraten”, wenn im Detail kein avatarUrl mitkam
  const { data: creatorHydrated } = useQuery({
    enabled: !!nft?.creatorId && !creatorFromDetail?.avatarUrl,
    queryKey: ["creator-hydrate", nft?.creatorId],
    queryFn: async () => (await httpAuth.get(`/api/auth/user/${nft!.creatorId}`)).data,
    staleTime: 5 * 60 * 1000,
  });

  const creator = creatorHydrated ?? creatorFromDetail;

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

  const handleBuy = async () => {
    if (!user?.id && !user?._id) {
      alert("Bitte einloggen, um zu kaufen.");
      return;
    }
    if (stats.isSold) {
      alert("Dieses NFT ist nicht mehr verfügbar.");
      return;
    }
    // Optional: Creator darf eigene NFTs nicht kaufen
    if ((user?.id || user?._id) === nft.creatorId) {
      alert("Du kannst dein eigenes NFT nicht kaufen.");
      return;
    }

    try {
      setBuying(true);

      // Passe den Pfad an DEINE Backend-Route an:
      // Wenn dein Backend /api/payment/create-checkout-session nutzt, dann:
      // const CHECKOUT_PATH = "/api/payment/create-checkout-session";
      const CHECKOUT_PATH = "/api/payment/create-checkout-session";

      const payload = {
        title: nft.title,
        price: nft.price,     // falls dein Backend Cents will: Math.round(nft.price * 100)
        nftId: nft._id,
        buyerId: user?.id || user?._id, // <- robust ermittelt
      };

      const res = await httpPayment.post(CHECKOUT_PATH, payload);
      if (res.data?.url) {
        window.location.href = res.data.url; // Weiterleitung zu Stripe
      } else {
        console.error("[NftDetails] Keine URL im Checkout-Response:", res.data);
        alert("Konnte Checkout-Session nicht erstellen.");
      }
    } catch (err: any) {
      console.error("[NftDetails] Kauf-Fehler:", err?.response?.data || err?.message);
      alert(err?.response?.data?.message || "Fehler beim Starten des Kaufprozesses");
    } finally {
      setBuying(false);
    }
  };


 return (
    <section className="max-w-5xl mx-auto space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Bild + Zoom */}
        <div>
          <ImageMagnifier src={nft.imageUrl} zoom={3.2} lensSize={120} />
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
              <button
                onClick={handleBuy}
                disabled={buying}
                className="inline-flex items-center rounded-md bg-black text-white px-4 py-2 hover:opacity-90 disabled:opacity-60"
              >
                {buying ? "Starte Kauf…" : "Kaufen"}
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

          {/* Creator Card */}
          {creator && (
            <div className="rounded-2xl border p-4 flex items-center gap-4">
              {creator.avatarUrl ? (
                <img
                  src={creator.avatarUrl}
                  alt="Creator"
                  className="w-14 h-14 rounded-full object-cover border"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-200 border grid place-items-center text-sm text-gray-600">
                  {(creator.username || creator.email || "?").slice(0, 2).toUpperCase()}
                </div>
              )}

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
