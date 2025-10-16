// src/api/nft.ts
import httpNft from "./httpnft";

export type NFT = {
  _id: string;
  title: string;
  imageUrl: string;
  price: number;
  createdAt: string;
};

export async function getNFTById(id: string) {
  const { data } = await httpNft.get<NFT>(`/${encodeURIComponent(id)}`);
  return data;
}

export async function getByIds(ids: string[]) {
  const uniq = [...new Set(ids)].filter(Boolean);
  if (!uniq.length) return [];
  const results = await Promise.allSettled(uniq.map(getNFTById));
  return results
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<NFT>).value);
}
