import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Category, CategoryTree, ApiResponse, PaginationParams } from "@/types";
import { toast } from "react-hot-toast";
import { CategoryFormData, FilterCategoriesData } from "@/lib/validations";

// Query Keys
export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (params?: PaginationParams) => [...categoryKeys.lists(), params] as const,
  tree: () => [...categoryKeys.all, "tree"] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: number) => [...categoryKeys.details(), id] as const,
  stats: () => [...categoryKeys.all, "stats"] as const,
};

// Get Categories List
export function useCategories(params?: FilterCategoriesData & PaginationParams) {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Category[]>>("/categories", {
        params,
      });
      return response;
    },
  }) ;
} 

// Get Category Tree (hierarchical structure)
export function useCategoryTree() {
  return useQuery({
    queryKey: categoryKeys.tree(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<CategoryTree[]>>("/categories/tree");
      return response;
    },
  });
}

// Get Single Category by ID
export function useCategory(id: number, enabled = true) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
      return response.data;
    },
    enabled: enabled && !!id,
  });
}

// Get Category Statistics
export interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
  rootCategories: number;
  totalProducts: number;
  topCategories: Array<{
    id: number;
    categoryName: string;
    productCount: number;
  }>;
}

export function useCategoryStats() {
  return useQuery({
    queryKey: categoryKeys.stats(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<CategoryStats>>("/categories/stats/overview");
      return response.data;
    },
  });
}

// Create Category Mutation
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await api.post<ApiResponse<Category>>("/categories", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      toast.success("Tạo danh mục thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Tạo danh mục thất bại!");
    },
  });
}

// Update Category Mutation
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CategoryFormData> }) => {
      const response = await api.put<ApiResponse<Category>>(`/categories/${id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(variables.id) });
      toast.success("Cập nhật danh mục thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Cập nhật danh mục thất bại!");
    },
  });
}

// Delete Category Mutation
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<void>>(`/categories/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.tree() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.stats() });
      toast.success("Xóa danh mục thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Xóa danh mục thất bại!");
    },
  });
}
