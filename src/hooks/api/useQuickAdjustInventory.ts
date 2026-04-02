import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QuickAdjustRequest, QuickAdjustResponse } from '@/types';

export const useQuickAdjustInventory = () => {
  const queryClient = useQueryClient();

  return useMutation<QuickAdjustResponse, any, QuickAdjustRequest>({
    mutationFn: async (data) => {
      const response = await api.post('/stock-transactions/quick-adjust', data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate inventory list queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      
      // Invalidate stock card if it's open
      queryClient.invalidateQueries({
        queryKey: ['stock-card', variables.warehouseId, variables.productId],
      });
    },
  });
};
