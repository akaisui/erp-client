import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type {
  Product,
  ProductImage,
  UpdateProductDto,
  ProductFilters,
  ApiResponse,
  PaginationParams,
  ProductStats,
  RawMaterialStats,
  PackagingStats,
} from "@/types";
import { toast } from "react-hot-toast";
import { type ProductFormData } from "@/lib/validations";
import { getLabelNameByType } from "@/lib/product";

// Query Keys
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters?: ProductFilters & PaginationParams) =>
    [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
  stats: () => [...productKeys.all, "stats"] as const,
};

// Get Products List với filters & pagination
export function useProducts(params?: ProductFilters & PaginationParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Product[]>>("/products", {
        params,
      });

      return response;
    },
  });
}

// Get Single Product by ID
export function useProduct(id: number, enabled = true) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
      return response;
    },
    enabled: enabled && !!id,
  });
}

export function useProductStats() {
  return useQuery({
    queryKey: productKeys.stats(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<ProductStats>>("/products/stats/overview");
      return response.data;
    },
  });
}

export function useRawMaterialStats() {
  return useQuery({
    queryKey: [...productKeys.stats(), "raw-material"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<RawMaterialStats>>("/products/stats/raw-materials");
      return response.data;
    },
  });
}

export function usePackagingStats() {
  return useQuery({
    queryKey: [...productKeys.stats(), "packaging"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PackagingStats>>("/products/stats/packaging");
      return response.data;
    },
  });
}

export function useGoodsStats() {
  return useQuery({
    queryKey: [...productKeys.stats(), "goods"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PackagingStats>>("/products/stats/goods");
      return response.data;
    },
  });
}

// Create Product Mutation
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await api.post<ApiResponse<Product>>("/products", data);
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      toast.success(`Tạo ${getLabelNameByType((response as any).productType)} thành công!`);
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Tạo thất bại!");
    },
  });
}

// Update Product Mutation
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateProductDto }) => {
      const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
      toast.success("Cập nhật sản phẩm thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Cập nhật sản phẩm thất bại!");
    },
  });
}

// Delete Product Mutation
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<void>>(`/products/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      toast.success("Xóa sản phẩm thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Xóa sản phẩm thất bại!");
    },
  });
}

// Toggle Product Status
export function useToggleProductStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newStatus }: { id: number; newStatus: "active" | "inactive" | "discontinued" }) => {
      const response = await api.put<ApiResponse<Product>>(
        `/products/${id}`,
        { status: newStatus }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Cập nhật trạng thái thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Cập nhật trạng thái thất bại!");
    },
  });
}

// Upload Product Images
// Max 5 images per product
export function useUploadProductImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      files,
      metadata
    }: {
      productId: number;
      files: File[];
      metadata?: Array<{
        imageType?: "thumbnail" | "gallery" | "main";
        altText?: string;
        isPrimary?: boolean;
        displayOrder?: number;
      }>;
    }) => {
      const formData = new FormData();

      // Append files
      files.forEach((file) => {
        formData.append("images", file);
      });

      // Append metadata if provided
      if (metadata) {
        formData.append("images", JSON.stringify(metadata));
      }

      const response = await api.post<ApiResponse<ProductImage[]>>(
        `/products/${productId}/images`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Tải ảnh lên thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Tải ảnh lên thất bại!");
    },
  });
}

// Delete Product Image
export function useDeleteProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, imageId }: { productId: number; imageId: number }) => {
      const response = await api.delete<ApiResponse<void>>(
        `/products/${productId}/images/${imageId}`
      );
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Xóa ảnh thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Xóa ảnh thất bại!");
    },
  });
}

// Set Primary Product Image
export function useSetPrimaryProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, imageId }: { productId: number; imageId: number }) => {
      const response = await api.patch<ApiResponse<ProductImage>>(
        `/products/${productId}/images/${imageId}/primary`
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Đặt ảnh chính thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Đặt ảnh chính thất bại!");
    },
  });
}

// Bulk Delete Products
export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: number[]) => {
      // Delete products sequentially
      const results = await Promise.allSettled(
        ids.map((id) => api.delete<ApiResponse<void>>(`/products/${id}`))
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return { successful, failed, total: ids.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });

      if (result.failed === 0) {
        toast.success(`Đã xóa ${result.successful} sản phẩm thành công!`);
      } else {
        toast.success(
          `Đã xóa ${result.successful}/${result.total} sản phẩm. ${result.failed} sản phẩm thất bại.`
        );
      }
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Xóa sản phẩm thất bại!");
    },
  });
}

// Bulk Update Product Status
export function useBulkUpdateProductStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, status }: { ids: number[]; status: "active" | "inactive" | "discontinued" }) => {
      // Update products sequentially
      const results = await Promise.allSettled(
        ids.map((id) =>
          api.patch<ApiResponse<Product>>(`/products/${id}`, { status })
        )
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return { successful, failed, total: ids.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });

      if (result.failed === 0) {
        toast.success(`Đã cập nhật ${result.successful} sản phẩm thành công!`);
      } else {
        toast.success(
          `Đã cập nhật ${result.successful}/${result.total} sản phẩm. ${result.failed} sản phẩm thất bại.`
        );
      }
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Cập nhật trạng thái thất bại!");
    },
  });
}

// Upload Product Videos
// Max 5 videos per product
export function useUploadProductVideos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      files,
      metadata
    }: {
      productId: number;
      files: File[];
      metadata?: Array<{
        videoType?: "demo" | "tutorial" | "review" | "unboxing" | "promotion" | "other";
        title?: string;
        isPrimary?: boolean;
        displayOrder?: number;
      }>;
    }) => {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("videos", file);
      });

      if (metadata) {
        formData.append("videos", JSON.stringify(metadata));
      }

      const response = await api.post<ApiResponse<any[]>>(
        `/products/${productId}/videos`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Tải video lên thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Tải video lên thất bại!");
    },
  });
}

// Delete Product Video
export function useDeleteProductVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, videoId }: { productId: number; videoId: number }) => {
      const response = await api.delete<ApiResponse<void>>(
        `/products/${productId}/videos/${videoId}`
      );
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Xóa video thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Xóa video thất bại!");
    },
  });
}

// Set Primary Product Video
export function useSetPrimaryProductVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, videoId }: { productId: number; videoId: number }) => {
      const response = await api.patch<ApiResponse<any>>(
        `/products/${productId}/videos/${videoId}/primary`
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Đặt video chính thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Đặt video chính thất bại!");
    },
  });
}
