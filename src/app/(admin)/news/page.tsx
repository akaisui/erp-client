"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    useNews,
    useCreateNews,
    useUpdateNews,
    useDeleteNews,
    usePublishNews,
    useArchiveNews,
    useNewsCategories,
    type News,
} from "@/hooks/api";
import { newsSchema, type NewsFormData } from "@/lib/validations";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/tables/Pagination";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import VideoUpload from "@/components/news/VideoUpload";
import { Plus, Edit, Trash2, CheckCircle, Archive, Loader2 } from "lucide-react";
import { generateSlug } from "@/lib/utils";

export default function NewsManagementPage() {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"draft" | "published" | "archived" | "all">("all");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingNews, setEditingNews] = useState<News | null>(null);
    const [deletingNews, setDeletingNews] = useState<News | null>(null);

    const { data: response, isLoading } = useNews({
        page,
        limit,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
    });

    const { data: categoriesResponse } = useNewsCategories({ page: 1, limit: 100 });

    const categories = categoriesResponse?.data || [];
    const newsList = response?.data || [];
    const paginationMeta = response?.meta;

    const createNews = useCreateNews();
    const updateNews = useUpdateNews();
    const deleteNews = useDeleteNews();
    const publishNews = usePublishNews();
    const archiveNews = useArchiveNews();

    const [activeTab, setActiveTab] = React.useState<'basic' | 'media'>('basic');

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<NewsFormData>({
        resolver: zodResolver(newsSchema),
        defaultValues: {
            title: "",
            slug: "",
            excerpt: "",
            content: "",
            contentType: "article",
            categoryId: 0,
            status: "draft",
            isFeatured: false,
        },
    });

    const title = watch("title");

    React.useEffect(() => {
        if (title) {
            setValue("slug", generateSlug(title));
        }
    }, [title, setValue]);

    const openCreateModal = () => {
        setEditingNews(null);
        reset({
            title: "",
            slug: "",
            excerpt: "",
            content: "",
            contentType: "article",
            categoryId: categories[0]?.id || 0,
            status: "draft",
            isFeatured: false,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (news: News) => {
        setEditingNews(news);
        reset({
            title: news.title,
            slug: news.slug,
            excerpt: news.excerpt || "",
            content: news.content,
            contentType: news.contentType,
            featuredImage: news.featuredImage,
            videoFile: news.videoFile || "",
            videoThumbnail: news.videoThumbnail || "",
            videoDuration: news.videoDuration,
            categoryId: news.categoryId,
            status: news.status,
            isFeatured: news.isFeatured,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingNews(null);
        reset();
    };

    const onSubmit = async (data: NewsFormData) => {
        try {
            if (editingNews) {
                await updateNews.mutateAsync({ id: editingNews.id, data });
            } else {
                await createNews.mutateAsync(data);
            }
            closeModal();
        } catch (error) {
            console.error("Submit error:", error);
        }
    };

    const openDeleteDialog = (news: News) => {
        setDeletingNews(news);
        setIsDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setIsDeleteDialogOpen(false);
        setDeletingNews(null);
    };

    const handleConfirmDelete = async () => {
        if (!deletingNews) return;
        try {
            await deleteNews.mutateAsync(deletingNews.id);
            closeDeleteDialog();
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const handlePublish = async (id: number) => {
        await publishNews.mutateAsync(id);
    };

    const handleArchive = async (id: number) => {
        await archiveNews.mutateAsync(id);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Tin tức</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Quản lý tin tức và video trong hệ thống
                    </p>
                </div>
                <Button variant="primary" size="smm" onClick={openCreateModal}>
                    <Plus className="mr-2 h-5 w-5" />
                    Thêm tin tức
                </Button>
            </div>

            {/* Filters */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tìm kiếm
                        </label>
                        <input
                            type="text"
                            placeholder="Tiêu đề tin tức..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Trạng thái
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="all">Tất cả</option>
                            <option value="draft">Nháp</option>
                            <option value="published">Đã xuất bản</option>
                            <option value="archived">Lưu trữ</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Hiển thị
                        </label>
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                            }}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        >
                            <option value={10}>10 / trang</option>
                            <option value={20}>20 / trang</option>
                            <option value={50}>50 / trang</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                    </div>
                ) : newsList.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center text-gray-500">
                        <p>Không có tin tức nào</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Tiêu đề
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Danh mục
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Lượt xem
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                {newsList.map((news) => (
                                    <tr key={news.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {news.title}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{news.slug}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {news.category.categoryName}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                                            <Badge
                                                color={
                                                    news.status === "published"
                                                        ? "green"
                                                        : news.status === "draft"
                                                            ? "yellow"
                                                            : "gray"
                                                }
                                            >
                                                {news.status === "published"
                                                    ? "Đã xuất bản"
                                                    : news.status === "draft"
                                                        ? "Nháp"
                                                        : "Lưu trữ"}
                                            </Badge>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {news.viewCount.toLocaleString()}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(news)}
                                                    className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900"
                                                    title="Sửa"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                {news.status === "draft" && (
                                                    <button
                                                        onClick={() => handlePublish(news.id)}
                                                        className="rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900"
                                                        title="Xuất bản"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {news.status === "published" && (
                                                    <button
                                                        onClick={() => handleArchive(news.id)}
                                                        className="rounded p-1 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900"
                                                        title="Lưu trữ"
                                                    >
                                                        <Archive className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openDeleteDialog(news)}
                                                    className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {paginationMeta && paginationMeta.totalPages > 1 && (
                    <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                        <Pagination
                            currentPage={page}
                            totalPages={paginationMeta.totalPages}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center px-4">
                        <div className="fixed inset-0 bg-black opacity-30" onClick={closeModal}></div>
                        <div className="relative z-50 w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                                {editingNews ? "Sửa tin tức" : "Thêm tin tức mới"}
                            </h2>

                            <form onSubmit={handleSubmit(onSubmit)}>
                                {/* Tabs */}
                                <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                                    <nav className="-mb-px flex space-x-8">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('basic')}
                                            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${activeTab === 'basic'
                                                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                                }`}
                                        >
                                            📝 Thông tin cơ bản
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('media')}
                                            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${activeTab === 'media'
                                                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                                }`}
                                        >
                                            🎨 Media & Hình ảnh
                                        </button>
                                    </nav>
                                </div>

                                {/* Tab Content */}
                                <div className="space-y-4">
                                    {/* Basic Info Tab */}
                                    {activeTab === 'basic' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Tiêu đề *
                                                </label>
                                                <input
                                                    {...register("title")}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                                />
                                                {errors.title && (
                                                    <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Slug
                                                </label>
                                                <input
                                                    {...register("slug")}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Danh mục *
                                                </label>
                                                <select
                                                    {...register("categoryId", { valueAsNumber: true })}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                                >
                                                    {categories.map((cat) => (
                                                        <option key={cat.id} value={cat.id}>
                                                            {cat.categoryName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Tóm tắt
                                                </label>
                                                <textarea
                                                    {...register("excerpt")}
                                                    rows={3}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                                    placeholder="Mô tả ngắn gọn về bài viết..."
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Nội dung *
                                                </label>
                                                <textarea
                                                    {...register("content")}
                                                    rows={8}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                                    placeholder="Nội dung chi tiết..."
                                                />
                                                {errors.content && (
                                                    <p className="mt-1 text-xs text-red-600">{errors.content.message}</p>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Trạng thái
                                                    </label>
                                                    <select
                                                        {...register("status")}
                                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                                    >
                                                        <option value="draft">Nháp</option>
                                                        <option value="published">Xuất bản</option>
                                                        <option value="archived">Lưu trữ</option>
                                                    </select>
                                                </div>

                                                <div className="flex items-center pt-6">
                                                    <input
                                                        type="checkbox"
                                                        {...register("isFeatured")}
                                                        className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                                    />
                                                    <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                                        Tin nổi bật
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Media Tab */}
                                    {activeTab === 'media' && (
                                        <div className="space-y-4">
                                            {/* Featured Image Upload */}
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    🖼️ Ảnh đại diện
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                setValue("featuredImage", reader.result as string);
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                                />
                                                {watch("featuredImage") && (
                                                    <div className="mt-2">
                                                        <img
                                                            src={watch("featuredImage")}
                                                            alt="Preview"
                                                            className="h-40 w-auto rounded-lg object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Ảnh này sẽ hiển thị trong danh sách tin tức và đầu bài viết
                                                </p>
                                            </div>

                                            {/* Video Upload */}
                                            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                                <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    🎥 Video (Tùy chọn)
                                                </h3>
                                                <VideoUpload
                                                    onVideoUploaded={(path) => setValue("videoFile", path)}
                                                    onThumbnailUploaded={(path) => setValue("videoThumbnail", path)}
                                                    currentVideo={editingNews?.videoFile}
                                                    currentThumbnail={editingNews?.videoThumbnail}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                                    <Button type="button" variant="outline" onClick={closeModal}>
                                        Hủy
                                    </Button>
                                    <Button type="submit" variant="primary" disabled={isSubmitting}>
                                        {isSubmitting ? "Đang lưu..." : editingNews ? "Cập nhật" : "Tạo mới"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={closeDeleteDialog}
                onConfirm={handleConfirmDelete}
                title="Xóa tin tức"
                message={`Bạn có chắc chắn muốn xóa tin tức "${deletingNews?.title}"?`}
                confirmText="Xóa"
                cancelText="Hủy"
            />
        </div>
    );
}
