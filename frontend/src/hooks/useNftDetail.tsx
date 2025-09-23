// src/hooks/useNftDetail.ts
import { useQuery } from "@tanstack/react-query";
import http from "../api/http";

type Nft = {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  price: number;
  creatorId: string;
  isSoldOut?: boolean;
  editionLimit?: number;
  editionCount?: number;
  soldCount?: number;
  createdAt: string;
};
type Creator = {
  _id: string;
  username?: string;
  email: string;
  avatarUrl?: string;
  profileInfo?: string;
  role?: string;
};
type NftDetailResponse = { nft: Nft; creator: Creator };

export function useNftDetail(id?: string) {
  return useQuery({
    queryKey: ["nft-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await http.get<NftDetailResponse>(
        `http://localhost:3002/api/nft/${id}`
      );
      console.log("[useNftDetail] Response:", data);
      return data;
    },
    retry: false,
  });
}
