"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    usePromotions,
    useCancelPromotion,
    useRefreshPromotions,
} from "@/hooks/api/usePromotions";
import type { PromotionType, ApplicableTo, ApiResponse, Promotion } from "@/types";
import PromotionStatus, {
    PromotionTypeBadge,
    DiscountValueDisplay,
    DateRangeDisplay,
    UsageProgressBar,
} from "@/components/promotions/PromotionStatus";
import Button from "@/components/ui/button/Button";
import { Can } from "@/components/auth/Can";
import { SearchBar } from "@/components/ui/SearchBar";
import { SimpleDatePicker } from "@/components/form/SimpleDatePicker";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import CancelModal from "@/components/ui/modal/CancelModal";
import {
    Plus,
    Ban,
    TrendingUp,
    RefreshCw,
    Download,
    X,
    EyeIcon,
    MoreVertical,
    Activity,
} from "lucide-react";
import { useDebounce } from "@/hooks";
import * as XLSX from "xlsx";
import Pagination from "@/components/tables/Pagination";

export default function ActivePromotionsPage() {
    const router = useRouter();

    // Filters & Pagination - MẶC ĐỊNH LÀ "active"
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 400);
    const [promotionTypeFilter, setPromotionTypeFilter] = useState<PromotionType | "all">("all");
    const [applicableToFilter, setApplicableToFilter] = useState<ApplicableTo | "all">("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

    // Modal states
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedPromotion, setSelectedPromotion] = useState<{ id: number; name: string } | null>(null);

    // Mutations
    const cancelPromotion = useCancelPromotion();
    const refreshPromotions = useRefreshPromotions();

    // Data Fetching - FIX CỨNG status: "active"
    const { data: promotionWrapper, isLoading } = usePromotions({
        page,
        limit,
        status: "active", // Luôn luôn lọc theo trạng thái đang hoạt động
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(promotionTypeFilter !== "all" && { promotionType: promotionTypeFilter }),
        ...(applicableToFilter !== "all" && { applicableTo: applicableToFilter }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
    });

    const data = promotionWrapper as unknown as ApiResponse<Promotion[]>;
    const promotions = data?.data || [];
    const paginationMeta = data?.meta;

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, promotionTypeFilter, applicableToFilter, fromDate, toDate]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    // Handlers
    const handleCancel = (id: number, name: string) => {
        setSelectedPromotion({ id, name });
        setShowCancelModal(true);
    };

    const handleConfirmCancel = async (reason: string) => {
        if (selectedPromotion) {
            await cancelPromotion.mutateAsync({ id: selectedPromotion.id, data: { reason } });
            setShowCancelModal(false);
            setSelectedPromotion(null);
        }
    };

    const handleResetFilters = () => {
        setSearchTerm("");
        setPromotionTypeFilter("all");
        setApplicableToFilter("all");
        setFromDate("");
        setToDate("");
    };

    const handleExport = () => {
        // Giữ nguyên logic export của bạn...
        const exportData = promotions.map((promo: any) => ({
            "Mã": promo.promotionCode,
            "Tên": promo.promotionName,
            "Đã dùng": promo.usageCount,
            "Trạng thái": "Đang hoạt động"
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Khuyến mãi active");
        XLSX.writeFile(workbook, `khuyenmai_active_${new Date().getTime()}.xlsx`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                        <Activity className="h-6 w-6" />
                        Khuyến Mãi Đang Hoạt Động
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Theo dõi các chương trình đang được áp dụng trực tiếp
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="ssmm"
                        onClick={() => refreshPromotions.mutateAsync()}
                        isLoading={refreshPromotions.isPending}
                    >
                        <RefreshCw className="h-5 w-5" />
                        Làm Mới
                    </Button>

                    <Can permission="create_promotion">
                        <Button
                            variant="primary"
                            size="ssmm"
                            onClick={() => router.push("/promotions/create")}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Tạo Khuyến Mãi
                        </Button>
                    </Can>
                </div>
            </div>

            {/* Thanh Trạng Thái Dashboard Nhanh (Thay cho 4 Card thống kê cũ) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-green-100 bg-green-50 p-4 dark:border-green-900/20 dark:bg-green-900/10">
                    <div className="text-sm font-medium text-green-600">Tổng chương trình chạy</div>
                    <div className="text-2xl font-bold text-green-700">{paginationMeta?.total || 0}</div>
                </div>
                {/* Bạn có thể thêm các card nhỏ khác ở đây */}
            </div>

            <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Tìm mã hoặc tên chương trình đang chạy..."
            />

            {/* Filters Area */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
                    {/* Loại bỏ Status Filter vì chúng ta đã gán cứng active */}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Loại</label>
                        <select
                            value={promotionTypeFilter}
                            onChange={(e) => setPromotionTypeFilter(e.target.value as any)}
                            className="block w-full rounded-lg border border-gray-300 bg-white py-1.5 px-3 text-sm focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="all">Tất cả loại</option>
                            <option value="percent_discount">Giảm %</option>
                            <option value="fixed_discount">Giảm cố định</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Đối tượng</label>
                        <select
                            value={applicableToFilter}
                            onChange={(e) => setApplicableToFilter(e.target.value as any)}
                            className="block w-full rounded-lg border border-gray-300 bg-white py-1.5 px-3 text-sm focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="all">Tất cả đối tượng</option>
                            <option value="specific_product">Sản phẩm cụ thể</option>
                            <option value="customer_group">Nhóm khách hàng</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Từ ngày</label>
                        <SimpleDatePicker value={fromDate} onChange={setFromDate} />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Đến ngày</label>
                        <SimpleDatePicker value={toDate} onChange={setToDate} />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Hiển thị</label>
                        <select
                            value={limit}
                            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                            className="block w-full rounded-lg border border-gray-300 bg-white py-1.5 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        >
                            <option value={20}>20 / trang</option>
                            <option value={50}>50 / trang</option>
                        </select>
                    </div>
                </div>

                {/* Active Filter Badges */}
                {(searchTerm || promotionTypeFilter !== "all") && (
                    <div className="mt-4 flex gap-2">
                        <button onClick={handleResetFilters} className="text-xs text-blue-600 underline">Xóa bộ lọc</button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Mã & Tên</th>
                            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Loại</th>
                            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Giảm giá</th>
                            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Thời gian</th>
                            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Sử dụng</th>
                            <th className="px-3 py-3 text-right text-xs font-medium uppercase text-gray-500">Thao tác</th>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-10">Đang tải...</TableCell></TableRow>
                        ) : promotions.map((promotion: any) => (
                            <TableRow key={promotion.id}>
                                <TableCell className="px-3 py-4">
                                    <div className="font-bold text-gray-900 dark:text-white">{promotion.promotionCode}</div>
                                    <div className="text-sm text-gray-500">{promotion.promotionName}</div>
                                </TableCell>
                                <TableCell className="px-3 py-4">
                                    <PromotionTypeBadge promotionType={promotion.promotionType} size="sm" />
                                </TableCell>
                                <TableCell className="px-3 py-4">
                                    <DiscountValueDisplay promotion={promotion} size="sm" />
                                </TableCell>
                                <TableCell className="px-3 py-4">
                                    <DateRangeDisplay startDate={promotion.startDate} endDate={promotion.endDate} size="sm" />
                                </TableCell>
                                <TableCell className="px-3 py-4 w-48">
                                    <UsageProgressBar usageCount={promotion.usageCount} quantityLimit={promotion.quantityLimit} size="sm" />
                                </TableCell>
                                <TableCell className="px-3 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            onClick={() => router.push(`/promotions/${promotion.id}`)}
                                            variant="normal" size="normal" className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                            <EyeIcon className="h-4 w-4" />
                                        </Button>
                                        <div className="relative">
                                            <Button
                                                onClick={() => setOpenDropdownId(openDropdownId === promotion.id ? null : promotion.id)}
                                                variant="normal" size="normal" className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                            <Dropdown isOpen={openDropdownId === promotion.id} onClose={() => setOpenDropdownId(null)}>
                                                <Can permission="cancel_promotion">
                                                    <DropdownItem onClick={() => handleCancel(promotion.id, promotion.promotionName)} className="text-orange-600!">
                                                        <Ban className="h-4 w-4 mr-2" /> Hủy chương trình
                                                    </DropdownItem>
                                                </Can>
                                            </Dropdown>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {paginationMeta && paginationMeta.totalPages > 1 && (
                <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-900 rounded-lg border">
                    <span className="text-sm text-gray-500">Tổng cộng: {paginationMeta.total}</span>
                    <Pagination
                        currentPage={paginationMeta.page}
                        totalPages={paginationMeta.totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}

            {/* Cancel Modal */}
            <CancelModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleConfirmCancel}
                title="Hủy chương trình"
                message={`Bạn muốn dừng chương trình "${selectedPromotion?.name}" ngay lập tức?`}
                isLoading={cancelPromotion.isPending}
            />
        </div>
    );
}