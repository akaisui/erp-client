import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { format, subDays } from 'date-fns';
import { StockCardResponse, UseStockCardOptions } from '@/types';

export const useStockCard = (
  warehouseId: number,
  productId: number,
  options?: UseStockCardOptions
) => {
  // Default: last 30 days
  const defaultEndDate = format(new Date(), 'yyyy-MM-dd');
  const defaultStartDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  const startDate = options?.startDate || defaultStartDate;
  const endDate = options?.endDate || defaultEndDate;

  return useQuery<StockCardResponse>({
    queryKey: ['stock-card', warehouseId, productId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);

      const response = await api.get(
        `/stock-transactions/card/${warehouseId}/${productId}?${params}`
      );
      return response.data;
    },
    enabled: !!warehouseId && !!productId,
  });
};
