import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// import http from "../api/http";
import httpNft from "../api/httpnft";

type NFT = {
    _id: string;
    title: string;
    price: number;           // in € (falls Cents -> unten anpassen)
    imageUrl: string;
    isSoldOut: boolean;
    editionCount: number;
    editionLimit: number;
};

export default function Landing() {
  const { data, isLoading, isError } = useQuery<NFT[], Error>({
    queryKey: ["nfts", "landing"],
    queryFn: async () => {
      const res = await httpNft.get<NFT[] | { items: NFT[] } | { data: NFT[] }>(
        "/",
        { params: { onlyAvailable: true, limit: 6 } }
      );
      const raw = res.data as NFT[] | { items: NFT[] } | { data: NFT[] };
      if (Array.isArray(raw)) return raw;
      if (Array.isArray((raw as any)?.items)) return (raw as any).items as NFT[];
      if (Array.isArray((raw as any)?.data))  return (raw as any).data  as NFT[];
      return [];
    },
  });

  // Serverseitig gefiltert (onlyAvailable=true). Fallback: clientseitig absichern.
  const list = data ?? [];
  const featured = list
    .filter((n) => !n.isSoldOut && (n.editionCount ?? 0) < (n.editionLimit ?? 0))
    .slice(0, 6);

    return (
        <div className="space-y-12">
            {/* Hero */}
            <section className="text-center py-16">
                <h1 className="text-4xl font-bold mb-4">Willkommen bei NFT Hub</h1>
                <p className="text-gray-600 mb-8">
                    Entdecke verfügbare Drops und sammle einzigartige Werke.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    {/* Normaler Register-Button (buyer default) */}
                    <Link
                        to="/register"
                        className="px-6 py-3 rounded-md bg-black text-white hover:opacity-90"
                    >
                        Jetzt registrieren
                    </Link>

                    {/* Neuer: Als Creator registrieren -> gleiche Seite mit Flag */}
                    <Link
                        to={{ pathname: "/register", search: "?role=creator" }}
                        className="px-6 py-3 rounded-md border hover:bg-gray-50"
                        aria-label="Als Creator registrieren"
                    >
                        Als Creator registrieren
                    </Link>

                    {/* Bestehender Marktplatz-Link bleibt */}
                    <Link
                        to="/market"
                        className="px-6 py-3 rounded-md border hover:bg-gray-50"
                    >
                        Zum Marktplatz
                    </Link>

                </div>
            </section>

            {/* Featured / Available */}
            <section className="max-w-6xl mx-auto px-4">
                <div className="flex items-end justify-between mb-6">
                    <h2 className="text-2xl font-semibold">Jetzt verfügbar</h2>
                    <Link to="/market" className="text-sm underline">
                        Alle ansehen
                    </Link>
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
                        {featured.map((nft) => {
                            const sold = (nft as any).soldCount ?? nft.editionCount ?? 0;
                            const limit = nft.editionLimit ?? 0;
                            const isSold = Boolean(nft.isSoldOut) || (limit > 0 && sold >= limit);

                            return (
                                <article
                                    key={nft._id}
                                    className={`relative border rounded-lg overflow-hidden ${isSold ? "opacity-60 grayscale" : ""
                                        }`}
                                >
                                    <div className="aspect-[4/3] bg-gray-100 relative">
                                        {nft.imageUrl ? (
                                            <img
                                                src={nft.imageUrl}
                                                alt={nft.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                kein Bild
                                            </div>
                                        )}

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
                                            {typeof nft.price === "number"
                                                ? `${nft.price.toFixed(2)} €`
                                                : "—"}
                                        </div>
                                        <div className="pt-2">
                                            <Link
                                                to="/details"
                                                state={{ id: nft._id }}
                                                className="text-sm underline"
                                            >
                                                Details
                                            </Link>

                                        </div>
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
