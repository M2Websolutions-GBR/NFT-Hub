// src/pages/Market.tsx
import { useQuery } from "@tanstack/react-query";
import http from "../api/http";
import { Link } from "react-router-dom";

type NFT = {
  _id: string;
  title: string;
  price: number;       // falls Cents ⇒ unten /100
  imageUrl?: string;
  creatorUsername?: string;
};

export default function Market() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["nfts"],
    queryFn: async () => (await http.get<NFT[]>("http://localhost:3002/api/nft")).data,
  });

  if (isLoading) return <div>lade NFTs…</div>;
  if (isError)   return <div className="text-red-600">Konnte NFTs nicht laden.</div>;
  if (!data?.length) return <div>Keine NFTs verfügbar.</div>;

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Marktplatz</h1>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
        {data.map((nft) => (
          <article key={nft._id} className="border rounded-lg overflow-hidden">
            <div className="aspect-[4/3] bg-gray-100">
              {nft.imageUrl
                ? <img src={nft.imageUrl} alt={nft.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-gray-400">kein Bild</div>}
            </div>
            <div className="p-4 space-y-2">
              <h2 className="font-medium line-clamp-1">{nft.title}</h2>
              <div className="text-sm text-gray-600">
                {/* falls Preis in Cents: (nft.price/100).toFixed(2) */}
                {typeof nft.price === "number" ? `${nft.price.toFixed(2)} €` : "—"}
              </div>
              {nft.creatorUsername && (
                <div className="text-xs text-gray-500">von {nft.creatorUsername}</div>
              )}
              <div className="pt-2">
                <Link to={`http://localhost:3002/api/nft/${nft._id}`} className="text-sm underline">Details</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
