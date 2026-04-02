"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    useNewsCategories,
    useCreateNewsCategory,
    useUpdateNewsCategory,
    useDeleteNewsCategory,
    type NewsCategory,
} from "@/hooks/api";
import { newsCategorySchema, type NewsCategoryFormData } from "@/lib/validations";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { generateSlug } from "@/lib/utils";

export default function NewsCategoryManagement() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<NewsCategory | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<NewsCategory | null>(null);

    const { data: response, isLoading } = useNewsCategories({ page: 1, limit: 100 });
    const categories = (response?.data || []) as NewsCategory[];

    const createCategory = useCreateNewsCategory();
    const updateCategory = useUpdateNewsCategory();
    const deleteCategory = useDeleteNewsCategory();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<NewsCategoryFormData>({
        resolver: zodResolver(newsCategorySchema),
        defaultValues: {
            categoryKey: "",
            categoryName: "",
            slug: "",
            description: "",
            displayOrder: 0,
            status: "active",
        },
    });

    const categoryName = watch("categoryName");

    useEffect(() => {
        if (categoryName && !editingCategory) {
            setValue("slug", generateSlug(categoryName));
            setValue("categoryKey", generateSlug(categoryName).toUpperCase().replace(/-/g, "_"));
        }
    }, [categoryName, setValue, editingCategory]);

    const openCreateModal = () => {
        setEditingCategory(null);
        reset({
            categoryKey: "",
            categoryName: "",
            slug: "",
            description: "",
            displayOrder: categories.length,
            status: "active",
        });
        setIsModalOpen(true);
    };

    const openEditModal = (category: NewsCategory) => {
        setEditingCategory(category);
        reset({
            categoryKey: category.categoryKey,
            categoryName: category.categoryName,
            slug: category.slug,
            description: category.description || "",
            displayOrder: category.displayOrder,
            status: category.status as "active" | "inactive",
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        reset();
    };

    const onSubmit = async (data: NewsCategoryFormData) => {
        try {
            if (editingCategory) {
                await updateCategory.mutateAsync({ id: editingCategory.id, data });
            } else {
                await createCategory.mutateAsync(data);
            }
            closeModal();
        } catch (error) {
            console.error("Submit error:", error);
        }
    };

    const openDeleteDialog = (category: NewsCategory) => {
        setDeletingCategory(category);
        setIsDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setIsDeleteDialogOpen(false);
        setDeletingCategory(null);
    };

    const handleConfirmDelete = async () => {
        if (!deletingCategory) return;
        try {
            await deleteCategory.mutateAsync(deletingCategory.id);
            closeDeleteDialog();
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Danh mục tin tức</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Quản lý danh mục để phân loại tin tức
                    </p>
                </div>
                <Button variant="primary" size="smm" onClick={openCreateModal}>
                    <Plus className="mr-2 h-5 w-5" />
                    Thêm danh mục
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                    </div>
                ) : categories.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center text-gray-500">
                        <p>Chưa có danh mục nào</p>
                        <p className="text-sm">Hãy tạo danh mục đầu tiên!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Mã
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Tên danh mục
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Slug
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Số tin tức
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Thứ tự
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                {categories
                                    .sort((a, b) => a.displayOrder - b.displayOrder)
                                    .map((category) => (
                                        <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                {category.categoryKey}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {category.categoryName}
                                                </div>
                                                {category.description && (
                                                    <div className="text-sm text-gray-500">{category.description}</div>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {category.slug}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {category._count?.news || 0}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {category.displayOrder}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                <Badge color={category.status === "active" ? "green" : "gray"}>
                                                    {category.status === "active" ? "Hoạt động" : "Không hoạt động"}
                                                </Badge>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(category)}
                                                        className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900"
                                                        title="Sửa"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteDialog(category)}
                                                        className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                                                        title="Xóa"
                                                        disabled={(category._count?.news || 0) > 0}
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
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center px-4">
                        <div className="fixed inset-0 bg-black opacity-30" onClick={closeModal}></div>
                        <div className="relative z-50 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                                {editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}
                            </h2>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Tên danh mục *
                                    </label>
                                    <input
                                        {...register("categoryName")}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                        placeholder="Ví dụ: Hướng dẫn"
                                    />
                                    {errors.categoryName && (
                                        <p className="mt-1 text-xs text-red-600">{errors.categoryName.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Mã danh mục *
                                        </label>
                                        <input
                                            {...register("categoryKey")}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                            placeholder="HUONG_DAN"
                                        />
                                        {errors.categoryKey && (
                                            <p className="mt-1 text-xs text-red-600">{errors.categoryKey.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Slug *
                                        </label>
                                        <input
                                            {...register("slug")}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                            placeholder="huong-dan"
                                        />
                                        {errors.slug && (
                                            <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Mô tả
                                    </label>
                                    <textarea
                                        {...register("description")}
                                        rows={3}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                        placeholder="Mô tả ngắn về danh mục này"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Thứ tự hiển thị
                                        </label>
                                        <input
                                            type="number"
                                            {...register("displayOrder", { valueAsNumber: true })}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Trạng thái
                                        </label>
                                        <select
                                            {...register("status")}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                        >
                                            <option value="active">Hoạt động</option>
                                            <option value="inactive">Không hoạt động</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={closeModal}>
                                        Hủy
                                    </Button>
                                    <Button type="submit" variant="primary" disabled={isSubmitting}>
                                        {isSubmitting ? "Đang lưu..." : editingCategory ? "Cập nhật" : "Tạo mới"}
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
                title="Xóa danh mục"
                message={`Bạn có chắc chắn muốn xóa danh mục "${deletingCategory?.categoryName}"?`}
                confirmText="Xóa"
                cancelText="Hủy"
            />
        </div>
    );
}
