"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  usePaymentReceipts,
  useApprovePaymentReceipt,
  usePostPaymentReceipt,
  useDeletePaymentReceipt,
  useRefreshPaymentReceipts,
} from "@/hooks/api";
import type {
  ApiResponse,
  PaymentReceipt,
  ReceiptType,
  ReceiptPaymentMethod,
} from "@/types";
import ReceiptStatus, {
  ReceiptTypeBadge,
  PaymentMethodBadge,
} from "@/components/finance/ReceiptStatus";
import Button from "@/components/ui/button/Button";
import PendingBubble from "@/components/ui/PendingBubble";
import { Can } from "@/components/auth/Can";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import { ReceiptDialog } from "./(components)/ReceiptDialog";
import { ViewReceiptDialog } from "./(components)/ViewReceiptDialog";
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
  TrendingUp,
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
import { PaymentReceiptTemplate } from "@/components/finance/print/PaymentReceiptTemplate";

export default function PaymentReceiptsPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [receiptTypeFilter, setReceiptTypeFilter] = useState<ReceiptType | "all">("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<ReceiptPaymentMethod | "all">("all");
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<"all" | "approved" | "pending">("all");
  const [postedStatusFilter, setPostedStatusFilter] = useState<"all" | "posted" | "draft">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selectedReceipts, setSelectedReceipts] = useState<number[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{ id: number; receiptCode: string } | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [editingReceiptId, setEditingReceiptId] = useState<number | null>(null);

  const [viewReceiptId, setViewReceiptId] = useState<number | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [printData, setPrintData] = useState<PaymentReceipt | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef: printRef });

  // Fetch receipts
  const { data: receiptWrapper, isLoading } = usePaymentReceipts({
    page,
    limit,
    sortBy: "approvedAt",
    sortOrder: "asc",
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(receiptTypeFilter !== "all" && { receiptType: receiptTypeFilter }),
    ...(paymentMethodFilter !== "all" && { paymentMethod: paymentMethodFilter }),
    ...(approvalStatusFilter !== "all" && { approvalStatus: approvalStatusFilter }),
    ...(postedStatusFilter !== "all" && { postedStatus: postedStatusFilter }),
    ...(fromDate && { fromDate: fromDate }),
    ...(toDate && { toDate: toDate }),
  });

  const data = receiptWrapper as unknown as ApiResponse<PaymentReceipt[]> & { statistics: any };
  const receipts = data?.data;
  const statistics = data?.statistics;
  const paginationMeta = data?.meta;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setReceiptTypeFilter("all");
    setPaymentMethodFilter("all");
    setApprovalStatusFilter("all");
    setPostedStatusFilter("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, receiptTypeFilter, paymentMethodFilter, approvalStatusFilter, postedStatusFilter, fromDate, toDate]);

  const approveReceipt = useApprovePaymentReceipt();
  const postReceipt = usePostPaymentReceipt();
  const deleteReceipt = useDeletePaymentReceipt();
  const refreshReceipts = useRefreshPaymentReceipts();

  const handleApprove = (id: number, receiptCode: string) => {
    setSelectedReceipt({ id, receiptCode });
    setShowApproveDialog(true);
    setOpenDropdownId(null);
  };

  const handlePost = (id: number, receiptCode: string) => {
    setSelectedReceipt({ id, receiptCode });
    setShowPostDialog(true);
    setOpenDropdownId(null);
  };

  const handleConfirmApprove = async (notes?: string) => {
    if (selectedReceipt) {
      await approveReceipt.mutateAsync({
        id: selectedReceipt.id,
        data: notes ? { notes } : undefined,
      });
      setShowApproveDialog(false);
      setSelectedReceipt(null);
    }
  };

  const handleConfirmPost = async (notes?: string) => {
    if (selectedReceipt) {
      await postReceipt.mutateAsync({
        id: selectedReceipt.id,
        data: notes ? { notes } : undefined,
      });
      setShowPostDialog(false);
      setSelectedReceipt(null);
    }
  };

  const handleDelete = (id: number, receiptCode: string) => {
    setSelectedReceipt({ id, receiptCode });
    setShowDeleteDialog(true);
    setOpenDropdownId(null);
  };

  const handleConfirmDelete = async () => {
    if (selectedReceipt) {
      await deleteReceipt.mutateAsync(selectedReceipt.id);
      setShowDeleteDialog(false);
      setSelectedReceipt(null);
    }
  };

  const handlePrint = (id: number) => {
    /* 
    // Logic gốc: Mở tab mới
    window.open(`/finance/receipts/${id}/print`, "_blank");
    */

    // New logic: Print in-page
    const receiptToPrint = receipts?.find((r: any) => r.id === id);
    if (receiptToPrint) {
        setPrintData(receiptToPrint);
        setTimeout(() => {
            reactToPrintFn();
        }, 100);
    }

    setOpenDropdownId(null);
  };

  const handleView = (id: number) => {
    /* 
    // Logic gốc: Chuyển sang trang chi tiết
    router.push(`/finance/receipts/${id}`);
    */

    // Logic mới: Mở Dialog
    setViewReceiptId(id);
    setIsViewDialogOpen(true);

    setOpenDropdownId(null);
  };

  const handleExport = () => {
    if (!receipts || receipts.length === 0) {
      alert("Không có dữ liệu phiếu thu để xuất!");
      return;
    }

    const receiptTypeLabels: Record<ReceiptType, string> = {
      sales: "Thu tiền hàng",
      debt_collection: "Thu công nợ",
      refund: "Hoàn tiền",
      other: "Khác",
    };

    const paymentMethodLabels: Record<ReceiptPaymentMethod, string> = {
      cash: "Tiền mặt",
      transfer: "Chuyển khoản",
      card: "Thẻ",
    };

    const receiptStatusLabels = (receipt: any): string => {
      if (receipt.isPosted) return "Đã ghi sổ";
      if (receipt.approvedBy) return "Đã duyệt";
      return "Chờ duyệt";
    };

    const exportData = receipts.map((receipt) => ({
      "Mã phiếu": receipt.receiptCode,
      "Ngày thu": format(new Date(receipt.receiptDate), "dd/MM/yyyy"),
      "Loại phiếu": receiptTypeLabels[receipt.receiptType] || receipt.receiptType,
      "Khách hàng": receipt.customerRef?.customerName || "—",
      "Số tiền": Number(receipt.amount || 0),
      "Hình thức": paymentMethodLabels[receipt.paymentMethod] || receipt.paymentMethod,
      "Ngân hàng": receipt.bankName || "—",
      "Trạng thái": receiptStatusLabels(receipt),
      "Người lập": receipt.creator?.fullName || "—",
      "Người duyệt": receipt.approver?.fullName || "—",
      "Ghi chú": receipt.notes || "—",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    const columnWidths = [
      { wch: 15 }, // Mã phiếu
      { wch: 12 }, // Ngày thu
      { wch: 15 }, // Loại phiếu
      { wch: 25 }, // Khách hàng
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Phiếu thu");

    const fileName = `phieu_thu_${new Date().toISOString().split("T")[0]}.xlsx`;
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

  const toggleSelectReceipt = (id: number) => {
    const receipt = receipts?.find((r: any) => r.id === id);
    // Only allow selecting if approved (approvedAt exists) and not posted (isPosted is false)
    if (receipt && receipt.approvedAt && !receipt.isPosted) {
      setSelectedReceipts((prev) =>
        prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
      );
    }
  };

  const toggleSelectAll = () => {
    // Only select receipts that are approved but not posted
    const eligibleReceipts = receipts?.filter((r: any) => r.approvedAt && !r.isPosted).map((r: any) => r.id) || [];
    if (selectedReceipts.length === eligibleReceipts.length && eligibleReceipts.length > 0) {
      setSelectedReceipts([]);
    } else {
      setSelectedReceipts(eligibleReceipts);
    }
  };

  // Check if has active filters
  const hasActiveFilters =
    searchTerm !== "" ||
    receiptTypeFilter !== "all" ||
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
            Phiếu Thu
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {selectedReceipts.length > 0
              ? `Đã chọn ${selectedReceipts.length} phiếu`
              : "Quản lý phiếu thu từ khách hàng"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="ssmm"
            onClick={() => refreshReceipts.mutateAsync()}
            isLoading={refreshReceipts.isPending}
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
          <Can permission="create_payment_receipt">
            <Button
              variant="primary"
              size="ssmm"
              onClick={() => {
                // Logic Dialog mới
                setEditingReceiptId(null);
                setIsReceiptDialogOpen(true);

                // Logic cũ: Chuyển sang trang tạo mới
                // router.push("/finance/receipts/create");
              }}
            >
              <Plus className="h-5 w-5" />
              Lập Phiếu Thu
            </Button>
          </Can>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FinancialCard
          title="Tổng Thực Thu"
          value={formatCurrency(statistics?.totalAmount || 0)}
          icon={TrendingUp}
          color="green"
          description={`${statistics?.totalReceipts || 0} phiếu`}
          isLoading={!statistics}
          onClick={() => setPostedStatusFilter("all")}
        />
        <FinancialCard
          title="Tiền Mặt"
          value={formatCurrency(statistics?.cashAmount || 0)}
          icon={DollarSign}
          color="purple"
          description="Đã ghi sổ"
          isLoading={!statistics}
          onClick={() => {
            setPaymentMethodFilter("cash");
            setPostedStatusFilter("posted");
          }}
        />
        <FinancialCard
          title="Ngân Hàng"
          value={formatCurrency(statistics?.transferAmount || 0)}
          icon={DollarSign}
          color="blue"
          description="Đã ghi sổ"
          isLoading={!statistics}
          onClick={() => {
            setPaymentMethodFilter("transfer");
            setPostedStatusFilter("posted");
          }}
        />
        <FinancialCard
          title="Cần Xử Lý"
          value={formatCurrency(statistics?.unpostedAmount || 0)}
          icon={Clock}
          color="orange"
          description="Chưa ghi sổ"
          isLoading={!statistics}
          onClick={() => setPostedStatusFilter("draft")}
        />
      </div>

      {/* Search Bar */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Tìm mã phiếu, khách hàng..."
      />

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-7">
          {/* Receipt Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Loại phiếu
            </label>
            <select
              value={receiptTypeFilter}
              onChange={(e) => setReceiptTypeFilter(e.target.value as any)}
              className="block w-full rounded-lg border border-gray-300 bg-white py-1.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả loại</option>
              <option value="sales">Thu tiền hàng</option>
              <option value="debt_collection">Thu công nợ</option>
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
              <option value="card">Thẻ</option>
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

            {receiptTypeFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                Loại: {
                  {
                    sales: "Thu tiền hàng",
                    debt_collection: "Thu công nợ",
                    refund: "Hoàn tiền",
                    other: "Khác",
                  }[receiptTypeFilter as string]
                }
                <button
                  onClick={() => setReceiptTypeFilter("all")}
                  className="hover:text-yellow-900 dark:hover:text-yellow-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {paymentMethodFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                PT: {paymentMethodFilter === "cash" ? "Tiền mặt" : paymentMethodFilter === "transfer" ? "Chuyển khoản" : "Thẻ"}
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

      {/* Table */}
      <div className="overflow-x-auto overflow-y-visible min-h-80 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : receipts.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <p className="text-sm">Không có phiếu thu nào</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <TableRow>
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedReceipts.length > 0 &&
                      selectedReceipts.length === (receipts?.filter((r: any) => r.approvedAt && !r.isPosted).length || 0)
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Mã phiếu
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Ngày thu
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Loại phiếu
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Khách hàng
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Đơn hàng
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
              {receipts.map((receipt: any, index: number) => (
                <React.Fragment key={receipt.id}>
                  {!receipt.approvedAt && (
                    <TableRow className="border-t border-yellow-200 dark:border-yellow-800">
                      <TableCell colSpan={2} className="px-3 py-2 bg-white dark:bg-gray-800">
                        <PendingBubble text="⚠️ Chờ duyệt" type="pending" />
                      </TableCell>
                      <TableCell colSpan={8} className="bg-white dark:bg-gray-800"></TableCell>
                    </TableRow>
                  )}
                  {receipt.approvedAt && !receipt.isPosted && (
                    <TableRow className="border-t border-orange-200 dark:border-orange-800">
                      <TableCell colSpan={2} className="px-3 py-2 bg-white dark:bg-gray-800">
                        <PendingBubble text="⏳ Chờ ghi sổ" type="payment" />
                      </TableCell>
                      <TableCell colSpan={8} className="bg-white dark:bg-gray-800"></TableCell>
                    </TableRow>
                  )}
                  <TableRow
                    className={selectedReceipts.includes(receipt.id) ? "bg-blue-50 dark:bg-blue-900/20" : !receipt.approvedAt ? "bg-orange-50/30 dark:bg-orange-900/10" : ""}
                  >
                    <TableCell className="px-3 py-4 text-left">
                      {receipt.approvedAt && !receipt.isPosted ? (
                        <input
                          type="checkbox"
                          checked={selectedReceipts.includes(receipt.id)}
                          onChange={() => toggleSelectReceipt(receipt.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      ) : null}
                    </TableCell>
                    <TableCell className="px-3 py-4 text-sm font-bold text-gray-900 dark:text-white">
                      <button
                        onClick={() => {
                          // Logic Dialog mới
                          handleView(receipt.id);

                          // Logic cũ: Chuyển sang trang chi tiết
                          // router.push(`/finance/receipts/${receipt.id}`);
                        }}
                        className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                      >
                        {receipt.receiptCode}
                      </button>
                    </TableCell>
                    <TableCell className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {format(new Date(receipt.receiptDate), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="px-3 py-4">
                      <ReceiptTypeBadge receiptType={receipt.receiptType} size="sm" />
                    </TableCell>
                    <TableCell className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {receipt.customerRef?.customerName || "—"}
                    </TableCell>
                    <TableCell className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {receipt.order?.orderCode ? (
                        <button
                          onClick={() => router.push(`/sales/orders/${receipt.order.id}`)}
                          className="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {receipt.order.orderCode}
                        </button>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-4 text-right text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(receipt.amount)}
                    </TableCell>
                    <TableCell className="px-3 py-4">
                      <PaymentMethodBadge
                        paymentMethod={receipt.paymentMethod}
                        size="sm"
                        bankName={receipt.bankName}
                      />
                    </TableCell>
                    <TableCell className="px-3 py-4">
                      <ReceiptStatus receipt={receipt} size="sm" />
                    </TableCell>
                    <TableCell className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {receipt.creator?.fullName || "—"}
                    </TableCell>
                    <TableCell className="px-3 py-4 text-right text-sm">
                      <div className="relative flex items-center justify-end gap-1">
                        {/* Quick View Link */}
                        <Button
                          onClick={() => {
                            // New: Open Dialog
                            handleView(receipt.id);

                            // Original code:
                            // router.push(`/finance/receipts/${receipt.id}`)
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
                          onClick={() => handlePrint(receipt.id)}
                          variant="normal"
                          size="normal"
                          className="rounded p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-800"
                          title="In phiếu thu"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>

                        {/* Dropdown Menu */}
                        <div className="relative">
                          {(receipt.approvedAt && receipt.isPosted) ? null : (
                            <Button
                              onClick={() =>
                                setOpenDropdownId(
                                  openDropdownId === receipt.id ? null : receipt.id
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
                            isOpen={openDropdownId === receipt.id}
                            onClose={() => setOpenDropdownId(null)}
                            className="w-48"
                          >
                            {/* Edit - Only for pending */}
                            {!receipt.approvedAt && (
                              <Can permission="update_payment_receipt">
                                <DropdownItem
                                  onClick={() => {
                                    // Logic Dialog mới
                                    setEditingReceiptId(receipt.id);
                                    setIsReceiptDialogOpen(true);
                                    setOpenDropdownId(null);

                                    // Logic cũ: Chuyển sang trang chỉnh sửa
                                    // router.push(`/finance/receipts/${receipt.id}/edit`);
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
                            {!receipt.approvedAt && (
                              <Can permission="approve_payment">
                                <DropdownItem
                                  onClick={() => {
                                    handleApprove(receipt.id, receipt.receiptCode);
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
                            {receipt.approvedAt && !receipt.isPosted && (
                              <Can permission="post_payment_receipt">
                                <DropdownItem
                                  onClick={() => {
                                    handlePost(receipt.id, receipt.receiptCode);
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
                            {!receipt.approvedAt && (
                              <Can permission="delete_payment_receipt">
                                <DropdownItem
                                  onClick={() => {
                                    handleDelete(receipt.id, receipt.receiptCode);
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
        title="Phê duyệt phiếu thu"
        message={`Phê duyệt phiếu thu ${selectedReceipt?.receiptCode}?\n\nCông nợ khách hàng sẽ được cập nhật tự động (nếu có).`}
        confirmText="Phê duyệt"
        variant="success"
        isLoading={approveReceipt.isPending}
        showNotes={true}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa phiếu thu"
        message={`Bạn có chắc chắn muốn xóa phiếu thu ${selectedReceipt?.receiptCode}?\n\nThao tác này không thể hoàn tác.`}
        confirmText="Xóa"
        variant="danger"
        isLoading={deleteReceipt.isPending}
      />

      {/* Post Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showPostDialog}
        onClose={() => setShowPostDialog(false)}
        onConfirm={handleConfirmPost}
        title="Ghi sổ phiếu thu"
        message={`Ghi sổ phiếu thu ${selectedReceipt?.receiptCode}?\n\nSau khi ghi sổ, phiếu thu sẽ được cập nhật vào quỹ tiền mặt và công nợ khách hàng.`}
        confirmText="Ghi sổ"
        variant="success"
        isLoading={postReceipt.isPending}
        showNotes={true}
      />

      {/* Create/Edit Receipt Dialog */}
      <ReceiptDialog
        isOpen={isReceiptDialogOpen}
        onClose={() => setIsReceiptDialogOpen(false)}
        receiptId={editingReceiptId}
      />

      <ViewReceiptDialog
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        receiptId={viewReceiptId}
        onEdit={(id) => {
            setEditingReceiptId(id);
            setIsReceiptDialogOpen(true);
        }}
      />

      <div style={{ display: "none" }}>
        <PaymentReceiptTemplate ref={printRef} receipt={printData} />
      </div>

      {/* Old logic preserved as requested: 
          router.push(`/finance/receipts/${receipt.id}`) 
      */}
    </div>
  );
}
