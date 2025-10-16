// src/pages/Market.tsx
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import httpNft from "../api/httpnft";

type NFT = {
    _id: string;
    title: string;
    price: number; // falls Cents ⇒ unten /100
    imageUrl?: string;
    creatorUsername?: string;
    isSoldOut?: boolean;
    editionCount?: number;
    editionLimit?: number;
};

export default function Market() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["nfts"],
        queryFn: async () =>
            (await httpNft.get<NFT[]>("/")).data,
    });

    if (isLoading) return <div>lade NFTs…</div>;
    if (isError) return <div className="text-red-600">Konnte NFTs nicht laden.</div>;
    if (!data?.length) return <div>Keine NFTs verfügbar.</div>;

    return (
        <section className="space-y-6">
            <h1 className="text-2xl font-semibold">Marktplatz</h1>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
                {data.map((nft) => {
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
                                <h2 className="font-medium line-clamp-1">{nft.title}</h2>

                                <div className="text-sm text-gray-600">
                                    {/* falls Preis in Cents: (nft.price/100).toFixed(2) */}
                                    {typeof nft.price === "number" ? `${nft.price.toFixed(2)} €` : "—"}
                                </div>

                                <div className="text-xs text-gray-500">
                                    {sold}/{limit || "∞"} verkauft
                                </div>

                                {Boolean((nft as any).creatorUsername) && (
                                    <div className="text-xs text-gray-500">
                                        von {(nft as any).creatorUsername}
                                    </div>
                                )}

                                <div className="pt-2">
                                    {/* App-interner Link statt direkter Service-Link */}
                                    <Link
                                        to="/details"
                                        state={{ id: nft._id }}        // ← ID per Route-State
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
        </section>
    );
}
