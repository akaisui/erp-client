import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { ApiResponse, PaginationParams } from "@/types";
import { toast } from "react-hot-toast";
import { NewsFormData, FilterNewsData, NewsCategoryFormData } from "@/lib/validations";

// Types
export interface News {
    id: number;
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    contentType: "article" | "video";
    featuredImage?: string;
    videoFile?: string;
    videoThumbnail?: string;
    videoDuration?: number;
    categoryId: number;
    authorId: number;
    status: "draft" | "published" | "archived";
    publishedAt?: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    isFeatured: boolean;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    createdAt: string;
    updatedAt: string;
    category: {
        id: number;
        categoryName: string;
        slug: string;
    };
    author: {
        id: number;
        fullName: string;
    };
    newsTagRelations?: Array<{
        tag: {
            id: number;
            tagName: string;
            slug: string;
        };
    }>;
}

export interface NewsCategory {
    id: number;
    categoryKey: string;
    categoryName: string;
    description?: string;
    slug: string;
    displayOrder: number;
    status: string;
    _count?: {
        news: number;
    };
}



// Query Keys
export const newsKeys = {
    all: ["news"] as const,
    lists: () => [...newsKeys.all, "list"] as const,
    list: (params?: FilterNewsData & PaginationParams) => [...newsKeys.lists(), params] as const,
    details: () => [...newsKeys.all, "detail"] as const,
    detail: (id: number) => [...newsKeys.details(), id] as const,
};

export const newsCategoryKeys = {
    all: ["news-categories"] as const,
    lists: () => [...newsCategoryKeys.all, "list"] as const,
    list: (params?: PaginationParams) => [...newsCategoryKeys.lists(), params] as const,
};



// ============================================================
// NEWS HOOKS
// ============================================================

export function useNews(params?: FilterNewsData & PaginationParams) {
    return useQuery({
        queryKey: newsKeys.list(params),
        queryFn: async () => {
            const response = await api.get<ApiResponse<News[]>>("/news/admin/all", {
                params,
            });
            return response;
        },
    });
}

export function useNewsDetail(id: number, enabled = true) {
    return useQuery({
        queryKey: newsKeys.detail(id),
        queryFn: async () => {
            const response = await api.get<ApiResponse<News>>(`/news/admin/${id}`);
            return response.data;
        },
        enabled: enabled && !!id,
    });
}

export function useCreateNews() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: NewsFormData) => {
            const response = await api.post<ApiResponse<News>>("/news/admin", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
            toast.success("Tạo tin tức thành công!");
        },
        onError: (error: any) => {
            toast.error(error?.error?.message || "Tạo tin tức thất bại!");
        },
    });
}

export function useUpdateNews() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<NewsFormData> }) => {
            const response = await api.put<ApiResponse<News>>(`/news/admin/${id}`, data);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: newsKeys.detail(variables.id) });
            toast.success("Cập nhật tin tức thành công!");
        },
        onError: (error: any) => {
            toast.error(error?.error?.message || "Cập nhật tin tức thất bại!");
        },
    });
}

export function useDeleteNews() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await api.delete<ApiResponse<void>>(`/news/admin/${id}`);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
            toast.success("Xóa tin tức thành công!");
        },
        onError: (error: any) => {
            toast.error(error?.error?.message || "Xóa tin tức thất bại!");
        },
    });
}

export function usePublishNews() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await api.post<ApiResponse<News>>(`/news/admin/${id}/publish`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
            toast.success("Xuất bản tin tức thành công!");
        },
        onError: (error: any) => {
            toast.error(error?.error?.message || "Xuất bản tin tức thất bại!");
        },
    });
}

export function useArchiveNews() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await api.post<ApiResponse<News>>(`/news/admin/${id}/archive`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
            toast.success("Lưu trữ tin tức thành công!");
        },
        onError: (error: any) => {
            toast.error(error?.error?.message || "Lưu trữ tin tức thất bại!");
        },
    });
}

// ============================================================
// NEWS CATEGORY HOOKS
// ============================================================

export function useNewsCategories(params?: PaginationParams) {
    return useQuery({
        queryKey: newsCategoryKeys.list(params),
        queryFn: async () => {
            const response = await api.get<ApiResponse<NewsCategory[]>>("/news-categories", {
                params,
            });
            return response;
        },
    });
}

export function useCreateNewsCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: NewsCategoryFormData) => {
            const response = await api.post<ApiResponse<NewsCategory>>("/news-categories/admin", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: newsCategoryKeys.lists() });
            toast.success("Tạo danh mục thành công!");
        },
        onError: (error: any) => {
            toast.error(error?.error?.message || "Tạo danh mục thất bại!");
        },
    });
}

export function useUpdateNewsCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<NewsCategoryFormData> }) => {
            const response = await api.put<ApiResponse<NewsCategory>>(`/news-categories/admin/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: newsCategoryKeys.lists() });
            toast.success("Cập nhật danh mục thành công!");
        },
        onError: (error: any) => {
            toast.error(error?.error?.message || "Cập nhật danh mục thất bại!");
        },
    });
}

export function useDeleteNewsCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await api.delete<ApiResponse<void>>(`/news-categories/admin/${id}`);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: newsCategoryKeys.lists() });
            toast.success("Xóa danh mục thành công!");
        },
        onError: (error: any) => {
            toast.error(error?.error?.message || "Xóa danh mục thất bại!");
        },
    });
}


