"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  usePaymentVouchers,
  useApprovePaymentVoucher,
  usePostPaymentVoucher,
  useDeletePaymentVoucher,
  useBulkPostPaymentVouchers,
  useRefreshPaymentVouchers,
} from "@/hooks/api";
import type { VoucherType, VoucherPaymentMethod, ApiResponse, PaymentVoucher } from "@/types";
import VoucherStatus, {
  VoucherTypeBadge,
  PaymentMethodBadge,
} from "@/components/finance/VoucherStatus";
import Button from "@/components/ui/button/Button";
import PendingBubble from "@/components/ui/PendingBubble";
import { Can } from "@/components/auth/Can";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import { VoucherDialog } from "./(components)/VoucherDialog";
import { ViewVoucherDialog } from "./(components)/ViewVoucherDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Download,
  DollarSign,
  TrendingDown,
  CheckCircle,
  Clock,
  Printer,
  Trash2,
  EyeIcon,
  RotateCcw,
  FileCheck,
  X,
  MoreVertical,
  Edit,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { SimpleDatePicker } from "@/components/form/SimpleDatePicker";
import { FinancialCard } from "@/components/ui/card/StatCards";
import { SearchBar } from "@/components/ui/SearchBar";
import Pagination from "@/components/tables/Pagination";
import { useDebounce } from "@/hooks";
import * as XLSX from "xlsx";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { PaymentVoucherTemplate } from "@/components/finance/print/PaymentVoucherTemplate";

export default function PaymentVouchersPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [voucherTypeFilter, setVoucherTypeFilter] = useState<VoucherType | "all">("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<VoucherPaymentMethod | "all">("all");
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<"all" | "approved" | "pending">("all");
  const [postedStatusFilter, setPostedStatusFilter] = useState<"all" | "posted" | "draft">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selectedVouchers, setSelectedVouchers] = useState<number[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showBulkPostDialog, setShowBulkPostDialog] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<{ id: number; voucherCode: string } | null>(null);
  const [isVoucherDialogOpen, setIsVoucherDialogOpen] = useState(false);
  const [editingVoucherId, setEditingVoucherId] = useState<number | null>(null);
  
  const [viewVoucherId, setViewVoucherId] = useState<number | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [printData, setPrintData] = useState<PaymentVoucher | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef: printRef });

  // Fetch vouchers
  const { data: voucherWrapper, isLoading } = usePaymentVouchers({
    page,
    limit,
    sortBy: "approvedAt",
    sortOrder: "asc",
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(voucherTypeFilter !== "all" && { voucherType: voucherTypeFilter }),
    ...(paymentMethodFilter !== "all" && { paymentMethod: paymentMethodFilter }),
    ...(approvalStatusFilter !== "all" && { approvalStatus: approvalStatusFilter }),
    ...(postedStatusFilter !== "all" && { postedStatus: postedStatusFilter }),
    ...(fromDate && { fromDate: fromDate }),
    ...(toDate && { toDate: toDate }),
  });

  const data = voucherWrapper as unknown as ApiResponse<PaymentVoucher[]> & { statistics: any };
  const vouchers = data?.data;
  const statistics = data?.statistics;
  const paginationMeta = data?.meta;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setVoucherTypeFilter("all");
    setPaymentMethodFilter("all");
    setApprovalStatusFilter("all");
    setPostedStatusFilter("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, voucherTypeFilter, paymentMethodFilter, approvalStatusFilter, postedStatusFilter, fromDate, toDate]);

  const approveVoucher = useApprovePaymentVoucher();
  const postVoucher = usePostPaymentVoucher();
  const bulkPostVoucher = useBulkPostPaymentVouchers();
  const deleteVoucher = useDeletePaymentVoucher();
  const refreshVouchers = useRefreshPaymentVouchers();

  const handleApprove = (id: number, voucherCode: string) => {
    setSelectedVoucher({ id, voucherCode });
    setShowApproveDialog(true);
    setOpenDropdownId(null);
  };

  const handlePost = (id: number, voucherCode: string) => {
    setSelectedVoucher({ id, voucherCode });
    setShowPostDialog(true);
    setOpenDropdownId(null);
  };

  const handleConfirmApprove = async (notes?: string) => {
    if (selectedVoucher) {
      await approveVoucher.mutateAsync({ 
        id: selectedVoucher.id,
        data: notes ? { notes } : undefined,
      });
      setShowApproveDialog(false);
      setSelectedVoucher(null);
    }
  };

  const handleConfirmPost = async (notes?: string) => {
    if (selectedVoucher) {
      await postVoucher.mutateAsync({ 
        id: selectedVoucher.id,
        data: notes ? { notes } : undefined,
      });
      setShowPostDialog(false);
      setSelectedVoucher(null);
    }
  };

  const handleDelete = (id: number, voucherCode: string) => {
    setSelectedVoucher({ id, voucherCode });
    setShowDeleteDialog(true);
    setOpenDropdownId(null);
  };

  const handleConfirmDelete = async () => {
    if (selectedVoucher) {
      await deleteVoucher.mutateAsync(selectedVoucher.id);
      setShowDeleteDialog(false);
      setSelectedVoucher(null);
    }
  };

  const handlePrint = (id: number) => {
    /* 
    // Logic gốc: Mở tab mới
    window.open(`/finance/vouchers/${id}/print`, "_blank");
    */

    // Logic mới: In tại trang
    const voucherToPrint = vouchers?.find((v: any) => v.id === id);
    if (voucherToPrint) {
        setPrintData(voucherToPrint);
        setTimeout(() => {
            reactToPrintFn();
        }, 100);
    }
    
    setOpenDropdownId(null);
  };

  const handleView = (id: number) => {
    /* 
    // Logic gốc: Chuyển sang trang chi tiết
    router.push(`/finance/vouchers/${id}`);
    */

    // Logic mới: Mở Dialog
    setViewVoucherId(id);
    setIsViewDialogOpen(true);
    
    setOpenDropdownId(null);
  };

  const handleExport = () => {
    if (!vouchers || vouchers.length === 0) {
      alert("Không có dữ liệu phiếu chi để xuất!");
      return;
    }

    const voucherTypeLabels: Record<VoucherType, string> = {
      salary: "Trả lương",
      supplier_payment: "Thanh toán NCC",
      operating_cost: "Chi phí vận hành",
      refund: "Hoàn tiền",
      other: "Khác",
    };

    const paymentMethodLabels: Record<VoucherPaymentMethod, string> = {
      cash: "Tiền mặt",
      transfer: "Chuyển khoản",
    };

    const voucherStatusLabels = (voucher: any): string => {
      if (voucher.isPosted) return "Đã ghi sổ";
      if (voucher.approvedBy) return "Đã duyệt";
      return "Chờ duyệt";
    };

    const exportData = vouchers.map((voucher) => ({
      "Mã phiếu": voucher.voucherCode,
      "Ngày chi": format(new Date(voucher.paymentDate), "dd/MM/yyyy"),
      "Loại chi": voucherTypeLabels[voucher.voucherType] || voucher.voucherType,
      "Đối tượng nhận": getRecipientName(voucher),
      "TK chi phí": voucher.expenseAccount || "—",
      "Số tiền": Number(voucher.amount || 0),
      "Hình thức": paymentMethodLabels[voucher.paymentMethod] || voucher.paymentMethod,
      "Ngân hàng": voucher.bankName || "—",
      "Trạng thái": voucherStatusLabels(voucher),
      "Người lập": voucher.creator?.fullName || "—",
      "Người duyệt": voucher.approver?.fullName || "—",
      "Ghi chú": voucher.notes || "—",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    const columnWidths = [
      { wch: 15 }, // Mã phiếu
      { wch: 12 }, // Ngày chi
      { wch: 15 }, // Loại chi
      { wch: 25 }, // Đối tượng nhận
      { wch: 12 }, // TK chi phí
      { wch: 15 }, // Số tiền
      { wch: 15 }, // Hình thức
      { wch: 20 }, // Ngân hàng
      { wch: 12 }, // Trạng thái
      { wch: 20 }, // Người lập
      { wch: 20 }, // Người duyệt
      { wch: 30 }, // Ghi chú
    ];
    worksheet["!cols"] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Phiếu chi");

    const fileName = `phieu_chi_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Date range presets
  const setDateRangePreset = (preset: string) => {
    const now = new Date();
    let from = new Date();
    let to = new Date();

    switch (preset) {
      case "today":
        from = new Date(now);
        to = new Date(now);
        break;
      case "this_week":
        from = new Date(now);
        from.setDate(now.getDate() - now.getDay());
        to = new Date(now);
        break;
      case "this_month":
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now);
        break;
      case "last_month":
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "this_quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        from = new Date(now.getFullYear(), quarter * 3, 1);
        to = new Date(now);
        break;
    }

    setFromDate(from.toISOString().split('T')[0]);
    setToDate(to.toISOString().split('T')[0]);
  };

  const toggleSelectVoucher = (id: number) => {
    const voucher = vouchers?.find((v: any) => v.id === id);
    // Only allow selecting if approved (approvedAt exists) and not posted (isPosted is false)
    if (voucher && voucher.approvedAt && !voucher.isPosted) {
      setSelectedVouchers((prev) =>
        prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
      );
    }
  };

  const toggleSelectAll = () => {
    // Only select vouchers that are approved but not posted
    const eligibleVouchers = vouchers?.filter((v: any) => v.approvedAt && !v.isPosted).map((v: any) => v.id) || [];
    if (selectedVouchers.length === eligibleVouchers.length && eligibleVouchers.length > 0) {
      setSelectedVouchers([]);
    } else {
      setSelectedVouchers(eligibleVouchers);
    }
  };

  // Helper function to get recipient name based on complex logic
  const getRecipientName = (voucher: any): string => {
    // If has supplier: show Supplier.supplierName
    if (voucher.supplier) {
      return voucher.supplier.supplierName;
    }
    
    // If is salary: show "Bảng lương tháng X"
    if (voucher.voucherType === 'salary') {
      const paymentDate = new Date(voucher.paymentDate);
      const month = paymentDate.getMonth() + 1;
      const year = paymentDate.getFullYear();
      return `Bảng lương tháng ${month}/${year}`;
    }
    
    // Otherwise: show excerpt from notes or default
    if (voucher.notes) {
      return voucher.notes.substring(0, 50) + (voucher.notes.length > 50 ? '...' : '');
    }
    
    return '—';
  };

  const handleBulkPost = () => {
    if (selectedVouchers.length === 0) {
      alert("Chọn ít nhất 1 phiếu để ghi sổ");
      return;
    }
    setShowBulkPostDialog(true);
  };

  const handleConfirmBulkPost = async () => {
    await bulkPostVoucher.mutateAsync(selectedVouchers);
    setShowBulkPostDialog(false);
    setSelectedVouchers([]);
  };

  // Check if has active filters
  const hasActiveFilters =
    searchTerm !== "" ||
    voucherTypeFilter !== "all" ||
    paymentMethodFilter !== "all" ||
    approvalStatusFilter !== "all" ||
    postedStatusFilter !== "all" ||
    fromDate !== "" ||
    toDate !== "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Phiếu Chi
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {selectedVouchers.length > 0
              ? `Đã chọn ${selectedVouchers.length} phiếu`
              : "Quản lý phiếu chi tiền"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="ssmm"
            onClick={() => refreshVouchers.mutateAsync()}
            isLoading={refreshVouchers.isPending}
            title="Làm mới dữ liệu từ server"
          >
            <RefreshCw className="h-5 w-5" />
            Làm Mới
          </Button>

          {/* Standard Actions - Create & Export */}
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
          <Can permission="create_payment_voucher">
            <Button
              variant="primary"
              size="ssmm"
              onClick={() => {
                // Logic Dialog mới
                setEditingVoucherId(null);
                setIsVoucherDialogOpen(true);

                // Logic cũ: Chuyển sang trang tạo mới
                // router.push("/finance/vouchers/create");
              }}
            >
              <Plus className="h-5 w-5" />
              Lập Phiếu Chi
            </Button>
          </Can>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FinancialCard
          title="Tổng chi trong kỳ"
          value={formatCurrency(statistics?.totalAmount || 0)}
          icon={TrendingDown}
          color="red"
          description={`${statistics?.totalVouchers || 0} phiếu`}
          isLoading={!statistics}
          onClick={() => setPostedStatusFilter("all")}
        />
        <FinancialCard
          title="Chờ duyệt"
          value={statistics?.pendingVouchers || 0}
          icon={Clock}
          color="yellow"
          description={formatCurrency(statistics?.pendingAmount || 0)}
          isLoading={!statistics}
          onClick={() => setApprovalStatusFilter("pending")}
        />
        <FinancialCard
          title="Tiền mặt"
          value={formatCurrency(statistics?.cashAmount || 0)}
          icon={DollarSign}
          color="green"
          description="Thanh toán tiền mặt"
          isLoading={!statistics}
          onClick={() => setPaymentMethodFilter("cash")}
        />
        <FinancialCard
          title="Đã ghi sổ"
          value={statistics?.postedVouchers || 0}
          icon={FileCheck}
          color="blue"
          description={`${(statistics?.totalVouchers || 0) - (statistics?.postedVouchers || 0)} chưa ghi`}
          isLoading={!statistics}
          onClick={() => setPostedStatusFilter("posted")}
        />
      </div>

      {/* Search Bar */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Tìm mã phiếu, NCC..."
      />

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-7">
          {/* Voucher Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Loại phiếu
            </label>
            <select
              value={voucherTypeFilter}
              onChange={(e) => setVoucherTypeFilter(e.target.value as any)}
              className="block w-full rounded-lg border border-gray-300 bg-white py-1.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả loại</option>
              <option value="salary">Chi lương</option>
              <option value="operating_cost">Chi phí vận hành</option>
              <option value="supplier_payment">Thanh toán NCC</option>
              <option value="refund">Hoàn tiền</option>
              <option value="other">Khác</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phương thức
            </label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value as any)}
              className="block w-full rounded-lg border border-gray-300 bg-white py-1.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả</option>
              <option value="cash">Tiền mặt</option>
              <option value="transfer">Chuyển khoản</option>
            </select>
          </div>

          {/* Approval Status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Duyệt
            </label>
            <select
              value={approvalStatusFilter}
              onChange={(e) => setApprovalStatusFilter(e.target.value as any)}
              className="block w-full rounded-lg border border-gray-300 bg-white py-1.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả</option>
              <option value="approved">Đã duyệt</option>
              <option value="pending">Chờ duyệt</option>
            </select>
          </div>

          {/* Posted Status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sổ sách
            </label>
            <select
              value={postedStatusFilter}
              onChange={(e) => setPostedStatusFilter(e.target.value as any)}
              className="block w-full rounded-lg border border-gray-300 bg-white py-1.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả</option>
              <option value="posted">Đã ghi sổ</option>
              <option value="draft">Chưa ghi sổ</option>
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Từ ngày
            </label>
            <SimpleDatePicker
              value={fromDate}
              onChange={(value) => setFromDate(value)}
              placeholder="Chọn từ ngày"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Đến ngày
            </label>
            <SimpleDatePicker
              value={toDate}
              onChange={(value) => setToDate(value)}
              placeholder="Chọn đến ngày"
            />
          </div>

          {/* Items per page */}
          <div>
            <label
              htmlFor="limit"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Hiển thị
            </label>
            <select
              id="limit"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
            </select>
          </div>
        </div>

        {/* Date Range Presets and Reset Button */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Nhanh:</label>
          <button
            onClick={() => setDateRangePreset("today")}
            className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              fromDate === new Date().toISOString().split('T')[0]
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            Hôm nay
          </button>
          <button
            onClick={() => setDateRangePreset("this_week")}
            className="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Tuần này
          </button>
          <button
            onClick={() => setDateRangePreset("this_month")}
            className="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Tháng này
          </button>
          <button
            onClick={() => setDateRangePreset("last_month")}
            className="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Tháng trước
          </button>
          <button
            onClick={() => setDateRangePreset("this_quarter")}
            className="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Quý này
          </button>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-5">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Bộ lọc:
            </span>

            {searchTerm && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                🔍 "{searchTerm}"
                <button
                  onClick={() => setSearchTerm("")}
                  className="hover:text-blue-900 dark:hover:text-blue-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {voucherTypeFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                Loại: {
                  {
                    salary: "Chi lương",
                    operating_cost: "Chi phí vận hành",
                    supplier_payment: "Thanh toán NCC",
                    refund: "Hoàn tiền",
                    other: "Khác",
                  }[voucherTypeFilter as string]
                }
                <button
                  onClick={() => setVoucherTypeFilter("all")}
                  className="hover:text-yellow-900 dark:hover:text-yellow-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {paymentMethodFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                PT: {paymentMethodFilter === "cash" ? "Tiền mặt" : "Chuyển khoản"}
                <button
                  onClick={() => setPaymentMethodFilter("all")}
                  className="hover:text-purple-900 dark:hover:text-purple-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {approvalStatusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                Duyệt: {approvalStatusFilter === "approved" ? "Đã duyệt" : "Chờ duyệt"}
                <button
                  onClick={() => setApprovalStatusFilter("all")}
                  className="hover:text-indigo-900 dark:hover:text-indigo-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {postedStatusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                Sổ: {postedStatusFilter === "posted" ? "Đã ghi sổ" : "Chưa ghi sổ"}
                <button
                  onClick={() => setPostedStatusFilter("all")}
                  className="hover:text-orange-900 dark:hover:text-orange-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {(fromDate || toDate) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                📅 {fromDate && new Date(fromDate).toLocaleDateString("vi-VN")}
                {fromDate && toDate && " - "}
                {toDate && new Date(toDate).toLocaleDateString("vi-VN")}
                <button
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                  className="hover:text-green-900 dark:hover:text-green-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RotateCcw className="h-3 w-3" />
              Xóa tất cả
            </button>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedVouchers.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/20">
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Đã chọn {selectedVouchers.length} phiếu
            </p>
          </div>
          <Button
            variant="outline"
            size="ssmm"
            onClick={() => setSelectedVouchers([])}
          >
            Bỏ chọn
          </Button>
          <Can permission="post_payment_voucher">
            <Button
              variant="primary"
              size="ssmm"
              onClick={handleBulkPost}
              disabled={bulkPostVoucher.isPending}
              isLoading={bulkPostVoucher.isPending}
            >
              Ghi sổ {selectedVouchers.length} phiếu
            </Button>
          </Can>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto overflow-y-visible min-h-80 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <p className="text-sm">Không có phiếu chi nào</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <TableRow>
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedVouchers.length > 0 &&
                      selectedVouchers.length === (vouchers?.filter((v: any) => v.approvedAt && !v.isPosted).length || 0)
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Mã phiếu
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Ngày chi
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Loại chi
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Đối tượng nhận
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  TK Chi phí
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Số tiền
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Hình thức
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Trạng thái
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Người lập
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Thao tác
                </th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.map((voucher: any, index: number) => (
                <React.Fragment key={voucher.id}>
                  {!voucher.approvedAt && (
                    <TableRow className="border-t border-yellow-200 dark:border-yellow-800">
                      <TableCell colSpan={2} className="px-3 py-2 bg-white dark:bg-gray-800">
                        <PendingBubble text="⚠️ Chờ duyệt" type="pending" />
                      </TableCell>
                      <TableCell colSpan={9} className="bg-white dark:bg-gray-800"></TableCell>
                    </TableRow>
                  )}
                  {voucher.approvedAt && !voucher.isPosted && (
                    <TableRow className="border-t border-orange-200 dark:border-orange-800">
                      <TableCell colSpan={2} className="px-3 py-2 bg-white dark:bg-gray-800">
                        <PendingBubble text="⏳ Chờ thanh toán" type="payment" />
                      </TableCell>
                      <TableCell colSpan={9} className="bg-white dark:bg-gray-800"></TableCell>
                    </TableRow>
                  )}
                  <TableRow
                    className={selectedVouchers.includes(voucher.id) ? "bg-blue-50 dark:bg-blue-900/20" : !voucher.approvedAt ? "bg-orange-50/30 dark:bg-orange-900/10" : ""}
                  >
                  <TableCell className="px-3 py-4 text-left">
                    {voucher.approvedAt && !voucher.isPosted ? (
                      <input
                        type="checkbox"
                        checked={selectedVouchers.includes(voucher.id)}
                        onChange={() => toggleSelectVoucher(voucher.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    ) : null}
                  </TableCell>
                  <TableCell className="px-3 py-4 text-sm font-bold text-gray-900 dark:text-white">
                    <button
                      onClick={() => {
                        // Logic Dialog mới
                        handleView(voucher.id);

                        // Logic cũ: Chuyển sang trang chi tiết
                        // router.push(`/finance/vouchers/${voucher.id}`);
                      }}
                      className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                    >
                      {voucher.voucherCode}
                    </button>
                  </TableCell>
                  <TableCell className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {format(new Date(voucher.paymentDate), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="px-3 py-4">
                    <VoucherTypeBadge voucherType={voucher.voucherType} size="sm" />
                  </TableCell>
                  <TableCell className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {getRecipientName(voucher)}
                  </TableCell>
                  <TableCell className="px-3 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {voucher.expenseAccount || '—'}
                  </TableCell>
                  <TableCell className="px-3 py-4 text-right text-sm font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(voucher.amount)}
                  </TableCell>
                  <TableCell className="px-3 py-4">
                    <PaymentMethodBadge
                      paymentMethod={voucher.paymentMethod}
                      size="sm"
                      bankName={voucher.bankName}
                    />
                  </TableCell>
                  <TableCell className="px-3 py-4">
                    <VoucherStatus voucher={voucher} size="sm" />
                  </TableCell>
                  <TableCell className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {voucher.creator?.fullName || '—'}
                  </TableCell>
                  <TableCell className="px-3 py-4 text-right text-sm">
                    <div className="relative flex items-center justify-end gap-1">
                      {/* Quick View Link */}
                      <Button
                        onClick={() => {
                          // New: Open Dialog
                          handleView(voucher.id);
                          
                          // Original code:
                          // router.push(`/finance/vouchers/${voucher.id}`)
                        }}
                        variant="normal"
                        size="normal"
                        className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        title="Xem chi tiết"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>

                      {/* Quick Print Button */}
                      <Button
                        onClick={() => handlePrint(voucher.id)}
                        variant="normal"
                        size="normal"
                        className="rounded p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-800"
                        title="In phiếu chi"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>

                      {/* Dropdown Menu */}
                      <div className="relative">
                        {(voucher.approvedAt && voucher.isPosted) ? null : (
                          <Button
                            onClick={() =>
                              setOpenDropdownId(
                                openDropdownId === voucher.id ? null : voucher.id
                              )
                            }
                            variant="normal"
                            size="normal"
                            className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                            title="Thêm thao tác"
                          >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        )}

                        <Dropdown
                          isOpen={openDropdownId === voucher.id}
                          onClose={() => setOpenDropdownId(null)}
                          className="w-48"
                        >
                          {/* Edit - Only for pending */}
                          {!voucher.approvedAt && (
                            <Can permission="update_payment_voucher">
                              <DropdownItem
                                onClick={() => {
                                  // Logic Dialog mới
                                  setEditingVoucherId(voucher.id);
                                  setIsVoucherDialogOpen(true);
                                  setOpenDropdownId(null);

                                  // Logic cũ: Chuyển sang trang chỉnh sửa
                                  // router.push(`/finance/vouchers/${voucher.id}/edit`);
                                }}
                                className="text-blue-600! hover:bg-blue-50! dark:text-blue-400! dark:hover:bg-blue-900/20!"
                              >
                                <div className="flex items-center gap-2">
                                  <Edit className="h-4 w-4" />
                                  <span>Chỉnh sửa</span>
                                </div>
                              </DropdownItem>
                            </Can>
                          )}

                          {/* Approve - Only for pending */}
                          {!voucher.approvedAt && (
                            <Can permission="approve_payment">
                              <DropdownItem
                                onClick={() => {
                                  handleApprove(voucher.id, voucher.voucherCode);
                                  setOpenDropdownId(null);
                                }}
                                className="text-green-600! hover:bg-green-50! dark:text-green-400! dark:hover:bg-green-900/20!"
                              >
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Phê duyệt</span>
                                </div>
                              </DropdownItem>
                            </Can>
                          )}

                          {/* Post - Only for approved but not posted */}
                          {voucher.approvedAt && !voucher.isPosted && (
                            <Can permission="post_payment_voucher">
                              <DropdownItem
                                onClick={() => {
                                  handlePost(voucher.id, voucher.voucherCode);
                                }}
                                className="text-blue-600! hover:bg-blue-50! dark:text-blue-400! dark:hover:bg-blue-900/20!"
                              >
                                <div className="flex items-center gap-2">
                                  <FileCheck className="h-4 w-4" />
                                  <span>Ghi sổ</span>
                                </div>
                              </DropdownItem>
                            </Can>
                          )}

                          {/* Delete - Only for pending */}
                          {!voucher.approvedAt && (
                            <Can permission="delete_payment_voucher">
                              <DropdownItem
                                onClick={() => {
                                  handleDelete(voucher.id, voucher.voucherCode);
                                  setOpenDropdownId(null);
                                }}
                                className="text-red-600! hover:bg-red-50! dark:text-red-400! dark:hover:bg-red-900/20!"
                              >
                                <div className="flex items-center gap-2">
                                  <Trash2 className="h-4 w-4" />
                                  <span>Xóa</span>
                                </div>
                              </DropdownItem>
                            </Can>
                          )}
                        </Dropdown>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {paginationMeta && paginationMeta.total > 0 && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Hiển thị{" "}
            <span className="font-medium">
              {(paginationMeta.page - 1) * paginationMeta.limit + 1}
            </span>{" "}
            đến{" "}
            <span className="font-medium">
              {Math.min(
                paginationMeta.page * paginationMeta.limit,
                paginationMeta.total
              )}
            </span>{" "}
            trong tổng số{" "}
            <span className="font-medium">{paginationMeta.total}</span> phiếu
          </div>
          {paginationMeta.totalPages > 1 && (
            <Pagination
              currentPage={paginationMeta.page}
              totalPages={paginationMeta.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      )}

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={handleConfirmApprove}
        title="Phê duyệt phiếu chi"
        message={`Phê duyệt phiếu chi ${selectedVoucher?.voucherCode}?\n\nCông nợ nhà cung cấp sẽ được cập nhật tự động (nếu có).`}
        confirmText="Phê duyệt"
        variant="success"
        isLoading={approveVoucher.isPending}
        showNotes={true}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa phiếu chi"
        message={`Bạn có chắc chắn muốn xóa phiếu chi ${selectedVoucher?.voucherCode}?\n\nThao tác này không thể hoàn tác.`}
        confirmText="Xóa"
        variant="danger"
        isLoading={deleteVoucher.isPending}
      />

      {/* Post Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showPostDialog}
        onClose={() => setShowPostDialog(false)}
        onConfirm={handleConfirmPost}
        title="Ghi sổ phiếu chi"
        message={`Ghi sổ phiếu chi ${selectedVoucher?.voucherCode}?\n\nSau khi ghi sổ, phiếu chi sẽ được cập nhật vào quỹ tiền mặt, công nợ nhà cung cấp và trạng thái lương.`}
        confirmText="Ghi sổ"
        variant="success"
        isLoading={postVoucher.isPending}
        showNotes={true}
      />

      {/* Bulk Post Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showBulkPostDialog}
        onClose={() => setShowBulkPostDialog(false)}
        onConfirm={handleConfirmBulkPost}
        title="Ghi sổ hàng loạt"
        message={`Ghi sổ ${selectedVouchers.length} phiếu chi?\n\nThao tác này không thể hoàn tác.`}
        confirmText="Ghi sổ"
        variant="success"
        isLoading={bulkPostVoucher.isPending}
      />

      {/* Create/Edit Voucher Dialog */}
      <VoucherDialog
        isOpen={isVoucherDialogOpen}
        onClose={() => setIsVoucherDialogOpen(false)}
        voucherId={editingVoucherId}
      />

      <ViewVoucherDialog
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        voucherId={viewVoucherId}
        onEdit={(id) => {
            setEditingVoucherId(id);
            setIsVoucherDialogOpen(true);
        }}
      />

      <div style={{ display: "none" }}>
        <PaymentVoucherTemplate ref={printRef} voucher={printData} />
      </div>
      
      {/* Old logic preserved as requested: 
          router.push(`/finance/vouchers/${voucher.id}`) 
      */}
    </div>
  );
}
