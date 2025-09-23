import { useQuery, keepPreviousData } from '@tanstack/react-query';
import http from '../api/http';

type OrdersResponse = {
  items: any[];
  page: number;
  pages: number;
  total: number;
};

export function useCreatorOrders({ status = 'paid', page = 1, limit = 20, q = '' } = {}) {
  return useQuery<OrdersResponse>({
    queryKey: ['creator-orders', { status, page, limit, q }],
    queryFn: async () => {
      const { data } = await http.get<OrdersResponse>('/api/creator/orders', {
        params: { status, page, limit, q },
      });
      return data;
    },
    // früher: keepPreviousData: true,
    placeholderData: keepPreviousData, // <- v5-way
    staleTime: 30_000,
  });
}