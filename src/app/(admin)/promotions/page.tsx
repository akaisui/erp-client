// "use client";

// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   usePromotions,
//   useApprovePromotion,
//   useCancelPromotion,
//   useDeletePromotion,
//   useRefreshPromotions,
// } from "@/hooks/api/usePromotions";
// import type { PromotionType, PromotionStatus as StatusType, ApplicableTo, ApiResponse, Promotion } from "@/types";
// import PromotionStatus, {
//   PromotionTypeBadge,
//   DiscountValueDisplay,
//   DateRangeDisplay,
//   UsageProgressBar,
// } from "@/components/promotions/PromotionStatus";  
// import Button from "@/components/ui/button/Button";
// import { Can } from "@/components/auth/Can";
// import { FinancialCard, ClassicCard } from "@/components/ui/card/StatCards";
// import { SearchBar } from "@/components/ui/SearchBar";
// import { SimpleDatePicker } from "@/components/form/SimpleDatePicker";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Dropdown } from "@/components/ui/dropdown/Dropdown";
// import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
// import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
// import CancelModal from "@/components/ui/modal/CancelModal";
// import {
//   Plus,
//   Search,
//   Filter,
//   CheckCircle,
//   Ban,
//   Trash2,
//   Edit,
//   Clock,
//   TrendingUp,
//   AlertTriangle,
//   RefreshCw,
//   Download,
//   XCircle,
//   X,
//   EyeIcon,
//   MoreVertical,
// } from "lucide-react";
// import { useDebounce } from "@/hooks";
// import * as XLSX from "xlsx";
// import Pagination from "@/components/tables/Pagination";

// export default function PromotionsPage() {
//   const router = useRouter();

//   // Filters & Pagination
//   const [page, setPage] = useState(1);
//   const [limit, setLimit] = useState(20);
//   const [searchTerm, setSearchTerm] = useState("");
//   const debouncedSearch = useDebounce(searchTerm, 400);
//   const [promotionTypeFilter, setPromotionTypeFilter] = useState<PromotionType | "all">("all");
//   const [statusFilter, setStatusFilter] = useState<StatusType | "all">("all");
//   const [applicableToFilter, setApplicableToFilter] = useState<ApplicableTo | "all">("all");
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

//   // Modal states
//   const [showApproveDialog, setShowApproveDialog] = useState(false);
//   const [showCancelModal, setShowCancelModal] = useState(false);
//   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
//   const [selectedPromotion, setSelectedPromotion] = useState<{ id: number; name: string } | null>(null);

//   // Mutations
//   const approvePromotion = useApprovePromotion();
//   const cancelPromotion = useCancelPromotion();
//   const deletePromotion = useDeletePromotion();
//   const refreshPromotions = useRefreshPromotions();

//   // Data Fetching
//   const { data: promotionWrapper, isLoading } = usePromotions({
//     page,
//     limit,
//     ...(debouncedSearch && { search: debouncedSearch }),
//     ...(promotionTypeFilter !== "all" && { promotionType: promotionTypeFilter }),
//     ...(statusFilter !== "all" && { status: statusFilter }),
//     ...(applicableToFilter !== "all" && { applicableTo: applicableToFilter }),
//     ...(fromDate && { fromDate }),
//     ...(toDate && { toDate }),
//   });

//   const data = promotionWrapper as unknown as ApiResponse<Promotion[]> & { statistics: any };
//   const promotions = data?.data || [];
//   const statistics = data?.statistics;
//   const paginationMeta = data?.meta;
//   const expiringPromotions = statistics?.expiringPromotions || 0;

//   useEffect(() => {
//     setPage(1);
//   }, [debouncedSearch, promotionTypeFilter, statusFilter, applicableToFilter, fromDate, toDate]);

//   const handlePageChange = (newPage: number) => {
//     setPage(newPage);
//   };

//   // Handlers
//   const handleApprove = (id: number, name: string) => {
//     setSelectedPromotion({ id, name });
//     setShowApproveDialog(true);
//   };

//   const handleConfirmApprove = async () => {
//     if (selectedPromotion) {
//       await approvePromotion.mutateAsync({ id: selectedPromotion.id });
//       setShowApproveDialog(false);
//       setSelectedPromotion(null);
//     }
//   };

//   const handleCancel = (id: number, name: string) => {
//     setSelectedPromotion({ id, name });
//     setShowCancelModal(true);
//   };

//   const handleConfirmCancel = async (reason: string) => {
//     if (selectedPromotion) {
//       await cancelPromotion.mutateAsync({ id: selectedPromotion.id, data: { reason } });
//       setShowCancelModal(false);
//       setSelectedPromotion(null);
//     }
//   };

//   const handleDelete = (id: number, name: string) => {
//     setSelectedPromotion({ id, name });
//     setShowDeleteDialog(true);
//   };

//   const handleConfirmDelete = async () => {
//     if (selectedPromotion) {
//       await deletePromotion.mutateAsync(selectedPromotion.id);
//       setShowDeleteDialog(false);
//       setSelectedPromotion(null);
//     }
//   };

//   const handleResetFilters = () => {
//     setSearchTerm("");
//     setPromotionTypeFilter("all");
//     setStatusFilter("all");
//     setApplicableToFilter("all");
//     setFromDate("");
//     setToDate("");
//   };

//   // Export to Excel
//   const handleExport = () => {
//     const exportData = promotions.map((promo: any) => ({
//       "Mã khuyến mãi": promo.promotionCode,
//       "Tên chương trình": promo.promotionName,
//       "Loại": promo.promotionType,
//       "Đối tượng": promo.applicableTo,
//       "Giá trị giảm": promo.discountValue || "—",
//       "Từ ngày": new Date(promo.startDate).toLocaleDateString("vi-VN"),
//       "Đến ngày": new Date(promo.endDate).toLocaleDateString("vi-VN"),
//       "Giới hạn sử dụng": promo.quantityLimit || "—",
//       "Đã sử dụng": promo.usageCount,
//       "Trạng thái": promo.status,
//       "Người tạo": promo.creator?.fullName || "—",
//       "Người duyệt": promo.approver?.fullName || "—",
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(exportData);
//     const columnWidths = [
//       { wch: 18 },
//       { wch: 25 },
//       { wch: 15 },
//       { wch: 15 },
//       { wch: 12 },
//       { wch: 12 },
//       { wch: 12 },
//       { wch: 15 },
//       { wch: 12 },
//       { wch: 12 },
//       { wch: 20 },
//       { wch: 20 },
//     ];
//     worksheet["!cols"] = columnWidths;

//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Khuyến mãi");

//     const fileName = `khuyenmai_${new Date().toISOString().split("T")[0]}.xlsx`;
//     XLSX.writeFile(workbook, fileName);
//   };

//   // Check if has active filters
//   const hasActiveFilters =
//     searchTerm !== "" ||
//     statusFilter !== "all" ||
//     promotionTypeFilter !== "all" ||
//     applicableToFilter !== "all" ||
//     fromDate !== "" ||
//     toDate !== "";

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
//             Chương Trình Khuyến Mãi
//           </h1>
//           <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
//             Quản lý các chương trình khuyến mãi và ưu đãi
//           </p>
//         </div>
//         <div className="flex items-center gap-3">
//           {/* Refresh Button */}
//           <Button
//             variant="outline"
//             size="ssmm"
//             onClick={() => refreshPromotions.mutateAsync()}
//             isLoading={refreshPromotions.isPending}
//             title="Làm mới dữ liệu từ server"
//           >
//             <RefreshCw className="h-5 w-5" />
//             Làm Mới
//           </Button>

//           {/* Export Button */}
//           <Can permission="export_reports">
//             <Button
//               variant="outline"
//               size="ssmm"
//               onClick={handleExport}
//             >
//               <Download className="h-5 w-5" />
//               Xuất Excel
//             </Button>
//           </Can>

//           {/* Create Button */}
//           <Can permission="create_promotion">
//             <Button
//               variant="primary"
//               size="ssmm"
//               onClick={() => router.push("/promotions/create")}
//             >
//               <Plus className="mr-2 h-4 w-4" />
//               Tạo Khuyến Mãi
//             </Button>
//           </Can>
//         </div>
//       </div>

//       {/* Statistics Cards */}
//       {statistics && (
//         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//           {/* Active Promotions - Financial Card (Actionable) */}
//           <FinancialCard
//             title="Đang chạy"
//             value={statistics.activePromotions}
//             icon={CheckCircle}
//             color="green"
//             description="Chương trình đang hoạt động"
//             onClick={() => setStatusFilter("active")}
//           />

//           {/* Pending Promotions - Financial Card (Actionable) */}
//           <FinancialCard
//             title="Chờ duyệt"
//             value={statistics.pendingPromotions}
//             icon={Clock}
//             color="yellow"
//             description="Cần xử lý gấp"
//             onClick={() => setStatusFilter("pending")}
//           />

//           {/* Expiring Soon - Financial Card (Actionable) */}
//           <FinancialCard
//             title="Sắp hết hạn"
//             value={expiringPromotions}
//             icon={AlertTriangle}
//             color="red"
//             description="3-7 ngày tới"
//             onClick={() => setStatusFilter("expired")}
//           />

//           {/* Usage Performance - Classic Card with breakdown */}
//           <ClassicCard
//             title="Hiệu suất sử dụng"
//             value={statistics.totalUsage || 0}
//             icon={TrendingUp}
//             color="blue"
//             description="Tổng lần sử dụng tháng này"
//             items={[
//               { label: "Đang chạy", value: statistics.activePromotions, color: "bg-green-100" },
//               { label: "Chờ duyệt", value: statistics.pendingPromotions, color: "bg-yellow-100" },
//               { label: "Sắp hết hạn", value: expiringPromotions, color: "bg-red-100" },
//             ]}
//           />
//         </div>
//       )}

//       {/* Search Bar */}
//       <SearchBar
//         value={searchTerm}
//         onChange={setSearchTerm}
//         placeholder="Tìm mã khuyến mãi, tên chương trình..."
//       />

//       {/* Filters */}
//       <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
//           {/* Status Filter */}
//           <div>
//             <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//               Trạng thái
//             </label>
//             <select
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value as any)}
//               className="block w-full rounded-lg border border-gray-300 bg-white py-1.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
//             >
//               <option value="all">Tất cả trạng thái</option>
//               <option value="pending">Chờ duyệt</option>
//               <option value="active">Đang hoạt động</option>
//               <option value="expired">Đã hết hạn</option>
//               <option value="cancelled">Đã hủy</option>
//             </select>
//           </div>

//           {/* Type Filter */}
//           <div>
//             <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//               Loại
//             </label>
//             <select
//               value={promotionTypeFilter}
//               onChange={(e) => setPromotionTypeFilter(e.target.value as any)}
//               className="block w-full rounded-lg border border-gray-300 bg-white py-1.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
//             >
//               <option value="all">Tất cả loại</option>
//               <option value="percent_discount">Giảm %</option>
//               <option value="fixed_discount">Giảm cố định</option>
//               <option value="buy_x_get_y">Mua X tặng Y</option>
//               <option value="gift">Quà tặng</option>
//             </select>
//           </div>

//           {/* Applicable To Filter */}
//           <div>
//             <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//               Đối tượng
//             </label>
//             <select
//               value={applicableToFilter}
//               onChange={(e) => setApplicableToFilter(e.target.value as any)}
//               className="block w-full rounded-lg border border-gray-300 bg-white py-1.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
//             >
//               <option value="all">Tất cả đối tượng</option>
//               <option value="all">Tất cả khách hàng</option>
//               <option value="category">Theo danh mục</option>
//               <option value="product_group">Theo nhóm sản phẩm</option>
//               <option value="specific_product">Sản phẩm cụ thể</option>
//               <option value="customer_group">Nhóm khách hàng</option>
//             </select>
//           </div>

//           {/* Từ ngày */}
//           <div>
//             <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//               Từ ngày
//             </label>
//             <SimpleDatePicker
//               value={fromDate}
//               onChange={(value) => setFromDate(value)}
//               placeholder="Chọn từ ngày"
//             />
//           </div>

//           {/* Đến ngày */}
//           <div>
//             <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//               Đến ngày
//             </label>
//             <SimpleDatePicker
//               value={toDate}
//               onChange={(value) => setToDate(value)}
//               placeholder="Chọn đến ngày"
//             />
//           </div>

//           {/* Items per page */}
//           <div>
//             <label
//               htmlFor="limit"
//               className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
//             >
//               Hiển thị
//             </label>
//             <select
//               id="limit"
//               value={limit}
//               onChange={(e) => {
//                 setLimit(Number(e.target.value));
//                 setPage(1);
//               }}
//               className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
//             >
//               <option value={10}>10 / trang</option>
//               <option value={20}>20 / trang</option>
//               <option value={50}>50 / trang</option>
//               <option value={100}>100 / trang</option>
//             </select>
//           </div>
//         </div>

//         {/* Active Filters */}
//         {hasActiveFilters && (
//           <div className="flex flex-wrap items-center gap-2 mt-4">
//             <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
//               Bộ lọc:
//             </span>

//             {searchTerm && (
//               <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
//                 🔍 "{searchTerm}"
//                 <button
//                   onClick={() => setSearchTerm("")}
//                   className="hover:text-blue-900 dark:hover:text-blue-300"
//                 >
//                   <X className="h-3 w-3" />
//                 </button>
//               </span>
//             )}

//             {statusFilter !== "all" && (
//               <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
//                 Trạng thái: {
//                   {
//                     pending: "Chờ duyệt",
//                     active: "Đang hoạt động",
//                     expired: "Đã hết hạn",
//                     cancelled: "Đã hủy",
//                   }[statusFilter as string]
//                 }
//                 <button
//                   onClick={() => setStatusFilter("all")}
//                   className="hover:text-yellow-900 dark:hover:text-yellow-300"
//                 >
//                   <X className="h-3 w-3" />
//                 </button>
//               </span>
//             )}

//             {promotionTypeFilter !== "all" && (
//               <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
//                 Loại: {
//                   {
//                     percent_discount: "Giảm %",
//                     fixed_discount: "Giảm cố định",
//                     buy_x_get_y: "Mua X tặng Y",
//                     gift: "Quà tặng",
//                   }[promotionTypeFilter as string]
//                 }
//                 <button
//                   onClick={() => setPromotionTypeFilter("all")}
//                   className="hover:text-purple-900 dark:hover:text-purple-300"
//                 >
//                   <X className="h-3 w-3" />
//                 </button>
//               </span>
//             )}

//             {applicableToFilter !== "all" && (
//               <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
//                 Đối tượng: {
//                   {
//                     category: "Theo danh mục",
//                     product_group: "Theo nhóm sản phẩm",
//                     specific_product: "Sản phẩm cụ thể",
//                     customer_group: "Nhóm khách hàng",
//                   }[applicableToFilter as string]
//                 }
//                 <button
//                   onClick={() => setApplicableToFilter("all")}
//                   className="hover:text-indigo-900 dark:hover:text-indigo-300"
//                 >
//                   <X className="h-3 w-3" />
//                 </button>
//               </span>
//             )}

//             {(fromDate || toDate) && (
//               <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
//                 📅 {fromDate && new Date(fromDate).toLocaleDateString("vi-VN")}
//                 {fromDate && toDate && " - "}
//                 {toDate && new Date(toDate).toLocaleDateString("vi-VN")}
//                 <button
//                   onClick={() => {
//                     setFromDate("");
//                     setToDate("");
//                   }}
//                   className="hover:text-green-900 dark:hover:text-green-300"
//                 >
//                   <X className="h-3 w-3" />
//                 </button>
//               </span>
//             )}

//             <button
//               onClick={handleResetFilters}
//               className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
//             >
//               <X className="h-3 w-3" />
//               Xóa tất cả
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Table */}
//       <div className="overflow-x-auto overflow-y-visible min-h-80 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
//         {isLoading ? (
//           <div className="flex h-64 items-center justify-center">
//             <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
//           </div>
//         ) : promotions.length === 0 ? (
//           <div className="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
//             <p className="text-sm">Không có chương trình khuyến mãi nào</p>
//           </div>
//         ) : (
//           <Table>
//             <TableHeader className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
//               <TableRow>
//                 <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
//                   Mã & Tên
//                 </th>
//                 <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
//                   Loại
//                 </th>
//                 <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
//                   Giảm giá
//                 </th>
//                 <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
//                   Thời gian
//                 </th>
//                 <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
//                   Sử dụng
//                 </th>
//                 <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
//                   Trạng thái
//                 </th>
//                 <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
//                   Thao tác
//                 </th>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {promotions.map((promotion: any) => (
//                 <TableRow
//                   key={promotion.id}
//                   className=""
//                 >
//                   <TableCell className="px-3 py-4">
//                     <div className="font-bold text-gray-900 dark:text-white">
//                       <button
//                         onClick={() => router.push(`/promotions/${promotion.id}`)}
//                         className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
//                       >
//                         {promotion.promotionCode}
//                       </button>
//                     </div>
//                     <div className="text-sm text-gray-500 dark:text-gray-400">
//                       {promotion.promotionName}
//                     </div>
//                   </TableCell>
//                   <TableCell className="px-3 py-4">
//                     <PromotionTypeBadge
//                       promotionType={promotion.promotionType}
//                       size="sm"
//                     />
//                   </TableCell>
//                   <TableCell className="px-3 py-4">
//                     <DiscountValueDisplay promotion={promotion} size="sm" />
//                   </TableCell>
//                   <TableCell className="px-3 py-4">
//                     <DateRangeDisplay
//                       startDate={promotion.startDate}
//                       endDate={promotion.endDate}
//                       isRecurring={promotion.isRecurring}
//                       size="sm"
//                     />
//                   </TableCell>
//                   <TableCell className="px-3 py-4">
//                     <UsageProgressBar
//                       usageCount={promotion.usageCount}
//                       quantityLimit={promotion.quantityLimit}
//                       size="sm"
//                     />
//                   </TableCell>
//                   <TableCell className="px-3 py-4">
//                     <PromotionStatus promotion={promotion} size="sm" />
//                   </TableCell>
//                   <TableCell className="px-3 py-4 text-right text-sm">
//                     <div className="relative flex items-center justify-end gap-1">
//                       {/* Quick View Button */}
//                       <Button
//                         onClick={() => router.push(`/promotions/${promotion.id}`)}
//                         variant="normal"
//                         size="normal"
//                         className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
//                         title="Xem chi tiết"
//                       >
//                         <EyeIcon className="h-4 w-4" />
//                       </Button>

//                       {/* Dropdown Menu */}
//                       <div className="relative">
//                         <Button
//                           onClick={() =>
//                             setOpenDropdownId(
//                               openDropdownId === promotion.id ? null : promotion.id
//                             )
//                           }
//                           variant="normal"
//                           size="normal"
//                           className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
//                           title="Thêm thao tác"
//                         >
//                           <MoreVertical className="h-4 w-4" />
//                         </Button>

//                         <Dropdown
//                           isOpen={openDropdownId === promotion.id}
//                           onClose={() => setOpenDropdownId(null)}
//                           className="w-48"
//                         >
//                           {/* Edit - Only for pending */}
//                           {promotion.status === "pending" && (
//                             <Can permission="update_promotion">
//                               <DropdownItem
//                                 onClick={() => {
//                                   router.push(`/promotions/${promotion.id}/edit`);
//                                   setOpenDropdownId(null);
//                                 }}
//                                 className="text-blue-600! hover:bg-blue-50! dark:text-blue-400! dark:hover:bg-blue-900/20!"
//                               >
//                                 <div className="flex items-center gap-2">
//                                   <Edit className="h-4 w-4" />
//                                   <span>Chỉnh sửa</span>
//                                 </div>
//                               </DropdownItem>
//                             </Can>
//                           )}

//                           {/* Approve - Only for pending */}
//                           {promotion.status === "pending" && (
//                             <Can permission="approve_promotion">
//                               <DropdownItem
//                                 onClick={() => {
//                                   handleApprove(promotion.id, promotion.promotionName);
//                                   setOpenDropdownId(null);
//                                 }}
//                                 className="text-green-600! hover:bg-green-50! dark:text-green-400! dark:hover:bg-green-900/20!"
//                               >
//                                 <div className="flex items-center gap-2">
//                                   <CheckCircle className="h-4 w-4" />
//                                   <span>Phê duyệt</span>
//                                 </div>
//                               </DropdownItem>
//                             </Can>
//                           )}

//                           {/* Cancel - For pending or active */}
//                           {(promotion.status === "pending" || promotion.status === "active") && (
//                             <Can permission="cancel_promotion">
//                               <DropdownItem
//                                 onClick={() => {
//                                   handleCancel(promotion.id, promotion.promotionName);
//                                   setOpenDropdownId(null);
//                                 }}
//                                 className="text-orange-600! hover:bg-orange-50! dark:text-orange-400! dark:hover:bg-orange-900/20!"
//                               >
//                                 <div className="flex items-center gap-2">
//                                   <Ban className="h-4 w-4" />
//                                   <span>Hủy</span>
//                                 </div>
//                               </DropdownItem>
//                             </Can>
//                           )}

//                           {/* Delete - Only for pending */}
//                           {promotion.status === "pending" && (
//                             <Can permission="delete_promotion">
//                               <DropdownItem
//                                 onClick={() => {
//                                   handleDelete(promotion.id, promotion.promotionName);
//                                   setOpenDropdownId(null);
//                                 }}
//                                 className="text-red-600! hover:bg-red-50! dark:text-red-400! dark:hover:bg-red-900/20!"
//                               >
//                                 <div className="flex items-center gap-2">
//                                   <Trash2 className="h-4 w-4" />
//                                   <span>Xóa</span>
//                                 </div>
//                               </DropdownItem>
//                             </Can>
//                           )}
//                         </Dropdown>
//                       </div>
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         )}
//       </div>

//       {/* Pagination */}
//       {paginationMeta && paginationMeta.total > 0 && (
//         <div className="mt-6 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
//           <div className="text-sm text-gray-700 dark:text-gray-300">
//             Hiển thị{" "}
//             <span className="font-medium">
//               {(paginationMeta.page - 1) * paginationMeta.limit + 1}
//             </span>{" "}
//             đến{" "}
//             <span className="font-medium">
//               {Math.min(
//                 paginationMeta.page * paginationMeta.limit,
//                 paginationMeta.total
//               )}
//             </span>{" "}
//             trong tổng số{" "}
//             <span className="font-medium">{paginationMeta.total}</span> khuyến mãi
//           </div>
//           {paginationMeta.totalPages > 1 && (
//             <Pagination
//               currentPage={paginationMeta.page}
//               totalPages={paginationMeta.totalPages}
//               onPageChange={handlePageChange}
//             />
//           )}
//         </div>
//       )}

//       {/* Approve Dialog */}
//       <ConfirmDialog
//         isOpen={showApproveDialog}
//         onClose={() => {
//           setShowApproveDialog(false);
//           setSelectedPromotion(null);
//         }}
//         onConfirm={handleConfirmApprove}
//         title="Phê duyệt chương trình khuyến mãi"
//         message={`Bạn có chắc chắn muốn phê duyệt chương trình "${selectedPromotion?.name}"?\n\nChương trình sẽ được kích hoạt ngay.`}
//         confirmText="Phê duyệt"
//         cancelText="Hủy"
//         variant="success"
//         isLoading={approvePromotion.isPending}
//       />

//       {/* Cancel Modal */}
//       <CancelModal
//         isOpen={showCancelModal}
//         onClose={() => {
//           setShowCancelModal(false);
//           setSelectedPromotion(null);
//         }}
//         onConfirm={handleConfirmCancel}
//         title="Hủy chương trình khuyến mãi"
//         message={`Bạn muốn hủy chương trình "${selectedPromotion?.name}". Vui lòng nhập lý do hủy:`}
//         placeholder="Nhập lý do hủy..."
//         action="hủy"
//         confirmText="Xác nhận hủy"
//         cancelText="Đóng"
//         isLoading={cancelPromotion.isPending}
//       />

//       {/* Delete Dialog */}
//       <ConfirmDialog
//         isOpen={showDeleteDialog}
//         onClose={() => {
//           setShowDeleteDialog(false);
//           setSelectedPromotion(null);
//         }}
//         onConfirm={handleConfirmDelete}
//         title="Xóa chương trình khuyến mãi"
//         message={`Bạn có chắc chắn muốn xóa chương trình "${selectedPromotion?.name}"?\n\nThao tác này không thể hoàn tác.`}
//         confirmText="Xóa"
//         cancelText="Hủy"
//         variant="danger"
//         isLoading={deletePromotion.isPending}
//       />
//     </div>
//   );
// }
"use client";

import React, { useEffect, useState } from "react";
import {
  usePromotions,
  useApprovePromotion,
  useCancelPromotion,
  useDeletePromotion,
  useRefreshPromotions,
} from "@/hooks/api/usePromotions";
import type { PromotionType, PromotionStatus as StatusType, ApplicableTo, ApiResponse, Promotion } from "@/types";
import PromotionStatus, {
  PromotionTypeBadge,
  DiscountValueDisplay,
  DateRangeDisplay,
  UsageProgressBar,
} from "@/components/promotions/PromotionStatus";
import Button from "@/components/ui/button/Button";
import { Can } from "@/components/auth/Can";
import { FinancialCard, ClassicCard } from "@/components/ui/card/StatCards";
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
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import CancelModal from "@/components/ui/modal/CancelModal";
import {
  Plus,
  CheckCircle,
  Ban,
  Trash2,
  Edit,
  Clock,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Download,
  X,
  EyeIcon,
  MoreVertical,
} from "lucide-react";
import { useDebounce } from "@/hooks";
import * as XLSX from "xlsx";
import Pagination from "@/components/tables/Pagination";

// Import các Dialog mới
import { PromotionDialog } from "./(components)/PromotionDialog";
import { ViewPromotionDialog } from "./(components)/ViewPromotionDialog";

export default function PromotionsPage() {
  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [promotionTypeFilter, setPromotionTypeFilter] = useState<PromotionType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusType | "all">("all");
  const [applicableToFilter, setApplicableToFilter] = useState<ApplicableTo | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // --- Modal States ---

  // 1. Dialog Thêm/Sửa
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // 2. Dialog Xem chi tiết
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);

  // 3. Confirm Dialogs
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [targetPromotion, setTargetPromotion] = useState<{ id: number; name: string } | null>(null);

  // Mutations
  const approvePromotion = useApprovePromotion();
  const cancelPromotion = useCancelPromotion();
  const deletePromotion = useDeletePromotion(); // Hook này đang bị lỗi vì thiếu body reason
  const refreshPromotions = useRefreshPromotions();

  // Data Fetching
  const { data: promotionWrapper, isLoading } = usePromotions({
    page,
    limit,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(promotionTypeFilter !== "all" && { promotionType: promotionTypeFilter }),
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(applicableToFilter !== "all" && { applicableTo: applicableToFilter }),
    ...(fromDate && { fromDate }),
    ...(toDate && { toDate }),
  });

  const data = promotionWrapper as unknown as ApiResponse<Promotion[]> & { statistics: any };
  const promotions = data?.data || [];
  const statistics = data?.statistics;
  const paginationMeta = data?.meta;
  const expiringPromotions = statistics?.expiringPromotions || 0;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, promotionTypeFilter, statusFilter, applicableToFilter, fromDate, toDate]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // --- Handlers ---

  const handleOpenCreate = () => {
    setEditingId(null);
    setShowPromotionDialog(true);
  };

  const handleOpenEdit = (id: number) => {
    setEditingId(id);
    setShowPromotionDialog(true);
  };

  const handleOpenView = (id: number) => {
    setViewId(id);
    setShowViewDialog(true);
  };

  const handleApprove = (id: number, name: string) => {
    setTargetPromotion({ id, name });
    setShowApproveDialog(true);
  };

  const handleConfirmApprove = async () => {
    if (targetPromotion) {
      await approvePromotion.mutateAsync({ id: targetPromotion.id });
      setShowApproveDialog(false);
      setTargetPromotion(null);
    }
  };

  // Xử lý Hủy (Soft Delete/Cancel) - Có nhập lý do từ Modal
  const handleCancel = (id: number, name: string) => {
    setTargetPromotion({ id, name });
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async (reason: string) => {
    if (targetPromotion) {
      await cancelPromotion.mutateAsync({ id: targetPromotion.id, data: { reason } });
      setShowCancelModal(false);
      setTargetPromotion(null);
    }
  };

  // Xử lý Xóa (Delete)
  const handleDelete = (id: number, name: string) => {
    setTargetPromotion({ id, name });
    setShowDeleteDialog(true);
  };

  // --- FIX LỖI 400 Ở ĐÂY ---
  const handleConfirmDelete = async () => {
    if (targetPromotion) {
      try {
        // Backend yêu cầu 'reason' ngay cả khi xóa (DELETE endpoint).
        // Hook 'deletePromotion' không gửi body -> lỗi.
        // Giải pháp: Dùng hook 'cancelPromotion' (có hỗ trợ gửi body) và truyền lý do mặc định.
        await cancelPromotion.mutateAsync({
          id: targetPromotion.id,
          data: { reason: "Xóa trực tiếp bởi quản trị viên" }
        });

        setShowDeleteDialog(false);
        setTargetPromotion(null);
      } catch (error) {
        console.error("Delete error:", error);
        // Nếu muốn thử fallback về deletePromotion (phòng trường hợp endpoint khác nhau sau này)
        // await deletePromotion.mutateAsync(targetPromotion.id);
      }
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setPromotionTypeFilter("all");
    setStatusFilter("all");
    setApplicableToFilter("all");
    setFromDate("");
    setToDate("");
  };

  const handleExport = () => {
    const exportData = promotions.map((promo: any) => ({
      "Mã khuyến mãi": promo.promotionCode,
      "Tên chương trình": promo.promotionName,
      "Loại": promo.promotionType,
      "Đối tượng": promo.applicableTo,
      "Giá trị giảm": promo.discountValue || "—",
      "Từ ngày": new Date(promo.startDate).toLocaleDateString("vi-VN"),
      "Đến ngày": new Date(promo.endDate).toLocaleDateString("vi-VN"),
      "Giới hạn sử dụng": promo.quantityLimit || "—",
      "Đã sử dụng": promo.usageCount,
      "Trạng thái": promo.status,
      "Người tạo": promo.creator?.fullName || "—",
      "Người duyệt": promo.approver?.fullName || "—",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const columnWidths = [
      { wch: 18 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
      { wch: 20 }, { wch: 20 },
    ];
    worksheet["!cols"] = columnWidths;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Khuyến mãi");
    const fileName = `khuyenmai_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all" || promotionTypeFilter !== "all" || applicableToFilter !== "all" || fromDate !== "" || toDate !== "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Chương Trình Khuyến Mãi
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý các chương trình khuyến mãi và ưu đãi
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

          <Can permission="export_reports">
            <Button
              variant="outline"
              size="ssmm"
              onClick={handleExport}
            >
              <Download className="h-5 w-5" />
              Xuất Excel
            </Button>
          </Can>

          <Can permission="create_promotion">
            <Button
              variant="primary"
              size="ssmm"
              onClick={handleOpenCreate}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo Khuyến Mãi
            </Button>
          </Can>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FinancialCard
            title="Đang chạy"
            value={statistics.activePromotions}
            icon={CheckCircle}
            color="green"
            description="Chương trình đang hoạt động"
            onClick={() => setStatusFilter("active")}
          />
          <FinancialCard
            title="Chờ duyệt"
            value={statistics.pendingPromotions}
            icon={Clock}
            color="yellow"
            description="Cần xử lý gấp"
            onClick={() => setStatusFilter("pending")}
          />
          <FinancialCard
            title="Sắp hết hạn"
            value={expiringPromotions}
            icon={AlertTriangle}
            color="red"
            description="3-7 ngày tới"
            onClick={() => setStatusFilter("expired")}
          />
          <ClassicCard
            title="Hiệu suất sử dụng"
            value={statistics.totalUsage || 0}
            icon={TrendingUp}
            color="blue"
            description="Tổng lần sử dụng tháng này"
            items={[
              { label: "Đang chạy", value: statistics.activePromotions, color: "bg-green-100" },
              { label: "Chờ duyệt", value: statistics.pendingPromotions, color: "bg-yellow-100" },
              { label: "Sắp hết hạn", value: expiringPromotions, color: "bg-red-100" },
            ]}
          />
        </div>
      )}

      {/* Search Bar & Filters */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Tìm mã khuyến mãi, tên chương trình..."
      />

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="block w-full rounded-lg border border-gray-300 bg-white py-1.5 px-3 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="active">Đang hoạt động</option>
              <option value="expired">Đã hết hạn</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Loại</label>
            <select value={promotionTypeFilter} onChange={(e) => setPromotionTypeFilter(e.target.value as any)} className="block w-full rounded-lg border border-gray-300 bg-white py-1.5 px-3 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option value="all">Tất cả loại</option>
              <option value="percent_discount">Giảm %</option>
              <option value="fixed_discount">Giảm cố định</option>
              <option value="buy_x_get_y">Mua X tặng Y</option>
              <option value="gift">Quà tặng</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Đối tượng</label>
            <select value={applicableToFilter} onChange={(e) => setApplicableToFilter(e.target.value as any)} className="block w-full rounded-lg border border-gray-300 bg-white py-1.5 px-3 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option value="all">Tất cả đối tượng</option>
              <option value="all">Tất cả khách hàng</option>
              <option value="category">Theo danh mục</option>
              <option value="product_group">Theo nhóm sản phẩm</option>
              <option value="specific_product">Sản phẩm cụ thể</option>
              <option value="customer_group">Nhóm khách hàng</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Từ ngày</label>
            <SimpleDatePicker value={fromDate} onChange={(value) => setFromDate(value)} placeholder="Chọn từ ngày" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Đến ngày</label>
            <SimpleDatePicker value={toDate} onChange={(value) => setToDate(value)} placeholder="Chọn đến ngày" />
          </div>
          <div>
            <label htmlFor="limit" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Hiển thị</label>
            <select id="limit" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
            </select>
          </div>
        </div>
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <button onClick={handleResetFilters} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              <X className="h-3 w-3" /> Xóa tất cả
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-y-visible min-h-80 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : promotions.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <p className="text-sm">Không có chương trình khuyến mãi nào</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <TableRow>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Mã & Tên</th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Loại</th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Giảm giá</th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Thời gian</th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Sử dụng</th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Trạng thái</th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Thao tác</th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((promotion: any) => (
                <TableRow key={promotion.id}>
                  <TableCell className="px-3 py-4">
                    <div className="font-bold text-gray-900 dark:text-white">
                      <button
                        onClick={() => handleOpenView(promotion.id)}
                        className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                      >
                        {promotion.promotionCode}
                      </button>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {promotion.promotionName}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-4"><PromotionTypeBadge promotionType={promotion.promotionType} size="sm" /></TableCell>
                  <TableCell className="px-3 py-4"><DiscountValueDisplay promotion={promotion} size="sm" /></TableCell>
                  <TableCell className="px-3 py-4"><DateRangeDisplay startDate={promotion.startDate} endDate={promotion.endDate} isRecurring={promotion.isRecurring} size="sm" /></TableCell>
                  <TableCell className="px-3 py-4"><UsageProgressBar usageCount={promotion.usageCount} quantityLimit={promotion.quantityLimit} size="sm" /></TableCell>
                  <TableCell className="px-3 py-4"><PromotionStatus promotion={promotion} size="sm" /></TableCell>
                  <TableCell className="px-3 py-4 text-right text-sm">
                    <div className="relative flex items-center justify-end gap-1">
                      <Button
                        onClick={() => handleOpenView(promotion.id)}
                        variant="normal" size="normal"
                        className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        title="Xem chi tiết"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>

                      <div className="relative">
                        <Button
                          onClick={() => setOpenDropdownId(openDropdownId === promotion.id ? null : promotion.id)}
                          variant="normal" size="normal"
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                          title="Thêm thao tác"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>

                        <Dropdown isOpen={openDropdownId === promotion.id} onClose={() => setOpenDropdownId(null)} className="w-48">
                          {/* Edit Action */}
                          {promotion.status === "pending" && (
                            <Can permission="update_promotion">
                              <DropdownItem
                                onClick={() => {
                                  handleOpenEdit(promotion.id);
                                  setOpenDropdownId(null);
                                }}
                                className="text-blue-600! hover:bg-blue-50!"
                              >
                                <div className="flex items-center gap-2"><Edit className="h-4 w-4" /><span>Chỉnh sửa</span></div>
                              </DropdownItem>
                            </Can>
                          )}

                          {/* Approve Action */}
                          {promotion.status === "pending" && (
                            <Can permission="approve_promotion">
                              <DropdownItem onClick={() => { handleApprove(promotion.id, promotion.promotionName); setOpenDropdownId(null); }} className="text-green-600! hover:bg-green-50!">
                                <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /><span>Phê duyệt</span></div>
                              </DropdownItem>
                            </Can>
                          )}

                          {/* Cancel Action */}
                          {(promotion.status === "pending" || promotion.status === "active") && (
                            <Can permission="cancel_promotion">
                              <DropdownItem onClick={() => { handleCancel(promotion.id, promotion.promotionName); setOpenDropdownId(null); }} className="text-orange-600! hover:bg-orange-50!">
                                <div className="flex items-center gap-2"><Ban className="h-4 w-4" /><span>Hủy</span></div>
                              </DropdownItem>
                            </Can>
                          )}

                          {/* Delete Action */}
                          {promotion.status === "pending" && (
                            <Can permission="delete_promotion">
                              <DropdownItem onClick={() => { handleDelete(promotion.id, promotion.promotionName); setOpenDropdownId(null); }} className="text-red-600! hover:bg-red-50!">
                                <div className="flex items-center gap-2"><Trash2 className="h-4 w-4" /><span>Xóa</span></div>
                              </DropdownItem>
                            </Can>
                          )}
                        </Dropdown>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {paginationMeta && paginationMeta.total > 0 && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Hiển thị <span className="font-medium">{(paginationMeta.page - 1) * paginationMeta.limit + 1}</span> đến <span className="font-medium">{Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)}</span> trong tổng số <span className="font-medium">{paginationMeta.total}</span> khuyến mãi
          </div>
          {paginationMeta.totalPages > 1 && (
            <Pagination currentPage={paginationMeta.page} totalPages={paginationMeta.totalPages} onPageChange={handlePageChange} />
          )}
        </div>
      )}

      {/* --- DIALOGS SECTION --- */}

      {/* 1. Dialog Thêm/Sửa */}
      <PromotionDialog
        isOpen={showPromotionDialog}
        onClose={() => setShowPromotionDialog(false)}
        promotionId={editingId}
      />

      {/* 2. Dialog Xem chi tiết */}
      <ViewPromotionDialog
        isOpen={showViewDialog}
        onClose={() => setShowViewDialog(false)}
        promotionId={viewId}
      />

      {/* 3. Confirm Dialogs */}
      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => { setShowApproveDialog(false); setTargetPromotion(null); }}
        onConfirm={handleConfirmApprove}
        title="Phê duyệt chương trình khuyến mãi"
        message={`Bạn có chắc chắn muốn phê duyệt chương trình "${targetPromotion?.name}"?\n\nChương trình sẽ được kích hoạt ngay.`}
        confirmText="Phê duyệt"
        cancelText="Hủy"
        variant="success"
        isLoading={approvePromotion.isPending}
      />

      <CancelModal
        isOpen={showCancelModal}
        onClose={() => { setShowCancelModal(false); setTargetPromotion(null); }}
        onConfirm={handleConfirmCancel}
        title="Hủy chương trình khuyến mãi"
        message={`Bạn muốn hủy chương trình "${targetPromotion?.name}". Vui lòng nhập lý do hủy:`}
        placeholder="Nhập lý do hủy..."
        action="hủy"
        confirmText="Xác nhận hủy"
        cancelText="Đóng"
        isLoading={cancelPromotion.isPending}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setTargetPromotion(null); }}
        onConfirm={handleConfirmDelete}
        title="Xóa chương trình khuyến mãi"
        message={`Bạn có chắc chắn muốn xóa chương trình "${targetPromotion?.name}"?\n\nThao tác này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deletePromotion.isPending || cancelPromotion.isPending}
      />
    </div>
  );
}