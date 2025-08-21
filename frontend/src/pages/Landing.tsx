import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import http from "../api/http";

type NFT = {
  _id: string;
  title: string;
  price: number;           // in € (falls Cents -> unten anpassen)
  imageUrl: string;
  isSoldOut: boolean;
  editionCount: number;
  editionLimit: number;
  // creatorUsername?: string; // nur anzeigen, wenn euer Service das liefert
};

export default function Landing() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["nfts", "landing"],
    // ⚠️ Falls dein NFT-Service nicht /api/nfts sondern "/" bedient, ändere die URL entsprechend.
    queryFn: async () =>
      (await http.get<NFT[]>("http://localhost:3002/api/nft", {
        params: { onlyAvailable: true, limit: 6 },
      })).data,
  });

  // Serverseitig gefiltert (onlyAvailable=true). Fallback: clientseitig absichern.
  const featured = (data ?? [])
    .filter((n) => !n.isSoldOut && n.editionCount < n.editionLimit)
    .slice(0, 6);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-16">
        <h1 className="text-4xl font-bold mb-4">Willkommen bei NFT Hub</h1>
        <p className="text-gray-600 mb-8">
          Entdecke verfügbare Drops und sammle einzigartige Werke.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/register" className="px-6 py-3 rounded-md bg-black text-white hover:opacity-90">
            Jetzt registrieren
          </Link>
          <Link to="/market" className="px-6 py-3 rounded-md border hover:bg-gray-50">
            Zum Marktplatz
          </Link>
        </div>
      </section>

      {/* Featured / Available */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl font-semibold">Jetzt verfügbar</h2>
          <Link to="/market" className="text-sm underline">Alle ansehen</Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
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
        ) : isError ? (
          <p className="text-red-600">Konnte verfügbare NFTs nicht laden.</p>
        ) : featured.length === 0 ? (
          <p className="text-gray-600">Derzeit keine verfügbaren NFTs.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {featured.map((nft) => (
              <article key={nft._id} className="border rounded-lg overflow-hidden">
                <div className="aspect-[4/3] bg-gray-100">
                  {nft.imageUrl ? (
                    <img src={nft.imageUrl} alt={nft.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">kein Bild</div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-medium line-clamp-1">{nft.title}</h3>
                  <div className="text-sm text-gray-600">
                    {/* Wenn Preis in Cents kommt: {(nft.price / 100).toFixed(2)} € */}
                    {typeof nft.price === "number" ? `${nft.price.toFixed(2)} €` : "—"}
                  </div>
                  {/* Optional, nur wenn vorhanden
                  {nft.creatorUsername && (
                    <div className="text-xs text-gray-500">von {nft.creatorUsername}</div>
                  )} */}
                  <div className="pt-2">
                    <Link to={`/nfts/${nft._id}`} className="text-sm underline">
                      Details
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
