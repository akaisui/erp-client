"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useCashFunds,
  useLockCashFund,
  useUnlockCashFund,
  useRefreshCashFund,
} from "@/hooks/api";
import type { ApiResponse } from "@/types";
import Button from "@/components/ui/button/Button";
import { Can } from "@/components/auth/Can";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Lock,
  Unlock,
  Eye,
  Download,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  RefreshCw,
  RotateCcw,
  X,
  Plus,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { SimpleDatePicker } from "@/components/form/SimpleDatePicker";
import { FinancialCard } from "@/components/ui/card/StatCards";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/tables/Pagination";
import * as XLSX from "xlsx";
import {CashFundExportPreviewDialog,} from "./(components)/CashFundExportPreviewDialog";
import {CreateCashFundDialog} from "./(components)/CreateCashFundDialog";
import {ViewCashFundDialog} from "./(components)/ViewCashFundDialog";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

interface CashFund {
  id: number;
  fundDate: string;
  openingBalance: number;
  closingBalance: number;
  totalReceipts: number;
  totalPayments: number;
  isLocked: boolean;
  lockedAt?: string;
  approver?: { id: number; fullName: string; employeeCode: string };
  reconciler?: { id: number; fullName: string; employeeCode: string };
}

interface CashFundResponse extends ApiResponse<CashFund[]> {
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  statistics?: {
    totalDays: number;
    lockedDays: number;
    unlockedDays: number;
    totalReceipts: number;
    totalPayments: number;
  };
}

export default function CashFundPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLockedFilter, setIsLockedFilter] = useState<"all" | "locked" | "unlocked">("all");

  const [selectedFund, setSelectedFund] = useState<CashFund | null>(null);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewFundDate, setViewFundDate] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isExportPreviewOpen, setExportPreviewOpen] = useState(false);

  // API Hooks
  const { data: response, isLoading, refetch } = useCashFunds({
    page,
    limit,
    startDate: fromDate,
    endDate: toDate,
    isLocked: isLockedFilter === "all" ? undefined : isLockedFilter === "locked",
  });
  console.log('response', response);

  const lockCashFund = useLockCashFund();
  const unlockCashFund = useUnlockCashFund();
  const refreshCashFund = useRefreshCashFund();

  const cashFundResponse = response as CashFundResponse | undefined;
  const cashFunds = cashFundResponse?.data || [];
  const paginationMeta = cashFundResponse?.meta;
  const statistics = cashFundResponse?.statistics;

  const handleLock = (fund: CashFund) => {
    setSelectedFund(fund);
    setShowLockDialog(true);
    setOpenDropdownId(null);
  };

  const handleUnlock = (fund: CashFund) => {
    setSelectedFund(fund);
    setShowUnlockDialog(true);
    setOpenDropdownId(null);
  };

  const handleConfirmLock = async (notes?: string) => {
    if (!selectedFund) return;
    try {
      await lockCashFund.mutateAsync({
        fundDate: selectedFund.fundDate,
        data: { notes },
      });
      setShowLockDialog(false);
      setSelectedFund(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleConfirmUnlock = async () => {
    if (!selectedFund) return;
    try {
      await unlockCashFund.mutateAsync(selectedFund.fundDate);
      setShowUnlockDialog(false);
      setSelectedFund(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleViewDetails = (fundDate: string) => {
    setViewFundDate(fundDate);
    setIsViewDialogOpen(true);
    setOpenDropdownId(null);
  };

  const handleExport = () => {
    if (!cashFunds || cashFunds.length === 0) {
      alert("Không có dữ liệu để xuất.");
      return;
    }
    setExportPreviewOpen(true);
  };

  const handleConfirmExport = () => {
    const exportData = cashFunds.map((fund) => ({
      "Ngày quỹ": format(new Date(fund.fundDate), "dd/MM/yyyy"),
      "Số dư đầu": fund.openingBalance,
      "Tổng thu": fund.totalReceipts,
      "Tổng chi": fund.totalPayments,
      "Số dư cuối": fund.closingBalance,
      "Trạng thái": fund.isLocked ? "Đã khóa" : "Chưa khóa",
      "Người đối chiếu": fund.reconciler?.fullName || "—",
      "Người phê duyệt": fund.approver?.fullName || "—",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const columnWidths = [
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 },
      { wch: 20 },
    ];
    worksheet["!cols"] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Quỹ tiền mặt");

    const fileName = `quy_tien_mat_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setExportPreviewOpen(false);
  };

  const handleResetFilters = () => {
    setFromDate("");
    setToDate("");
    setIsLockedFilter("all");
    setPage(1);
  };

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

    setFromDate(from.toISOString().split("T")[0]);
    setToDate(to.toISOString().split("T")[0]);
  };

  const hasActiveFilters = fromDate !== "" || toDate !== "" || isLockedFilter !== "all";

  const getBalanceColor = (fund: CashFund) => {
    const netChange = fund.totalReceipts - fund.totalPayments;
    if (netChange > 0) return "text-green-600 dark:text-green-400";
    if (netChange < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quỹ tiền mặt</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý và đối chiếu quỹ tiền mặt hàng ngày
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="ssmm"
            onClick={() => refreshCashFund.mutateAsync()}
            isLoading={refreshCashFund.isPending}
            title="Làm mới dữ liệu từ server"
          >
            <RefreshCw className="h-5 w-5" />
            Làm Mới
          </Button>

          {/* Standard Actions - Export */}
          <Can permission="view_cash_fund">
            <Button
              variant="outline"
              size="ssmm"
              onClick={handleExport}
            >
              <Download className="h-5 w-5" />
              Xuất Excel
            </Button>
          </Can>

          {/* <Can permission="create_cash_fund">
            <Button
              variant="primary"
              size="ssmm"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-5 w-5" />
              Tạo quỹ
            </Button>
          </Can> */}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FinancialCard
          title="Tổng ngày"
          value={statistics?.totalDays || 0}
          icon={Calendar}
          color="blue"
          description="Ngày quỹ"
          isLoading={!statistics}
        />
        <FinancialCard
          title="Ngày khóa"
          value={statistics?.lockedDays || 0}
          icon={CheckCircle}
          color="green"
          description={`${statistics?.unlockedDays || 0} chưa khóa`}
          isLoading={!statistics}
        />
        <FinancialCard
          title="Tổng thu"
          value={formatCurrency(statistics?.totalReceipts || 0)}
          icon={DollarSign}
          color="green"
          description={`Phiếu thu trong kỳ`}
          isLoading={!statistics}
        />
        <FinancialCard
          title="Tổng chi"
          value={formatCurrency(statistics?.totalPayments || 0)}
          icon={AlertCircle}
          color="red"
          description={`Phiếu chi trong kỳ`}
          isLoading={!statistics}
        />
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Trạng thái
            </label>
            <select
              value={isLockedFilter}
              onChange={(e) => setIsLockedFilter(e.target.value as any)}
              className="block w-full rounded-lg border border-gray-300 bg-white py-1.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả</option>
              <option value="locked">Đã khóa</option>
              <option value="unlocked">Chưa khóa</option>
            </select>
          </div>

          {/* Items per page */}
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
              className="block w-full rounded-lg border border-gray-300 bg-white py-1.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
            </select>
          </div>
        </div>

        {/* Date Range Presets */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Nhanh:</label>
          <button
            onClick={() => setDateRangePreset("today")}
            className="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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

            {isLockedFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                Trạng thái: {isLockedFilter === "locked" ? "Đã khóa" : "Chưa khóa"}
                <button
                  onClick={() => setIsLockedFilter("all")}
                  className="hover:text-orange-900 dark:hover:text-orange-300"
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
      <div className="overflow-auto min-h-[500px] pb-48 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : cashFunds && cashFunds.length > 0 ? (
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200">
              <TableRow>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Ngày quỹ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Số dư đầu
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Tổng thu
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Tổng chi
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Số dư cuối
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Người đối chiếu
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Thao tác
                </th>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
              {cashFunds.map((fund) => (
                <TableRow key={fund.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <TableCell className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{format(new Date(fund.fundDate), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">{formatCurrency(fund.openingBalance)}</TableCell>
                  <TableCell className="px-6 py-4 text-right text-sm text-green-600 dark:text-green-400">
                    {formatCurrency(fund.totalReceipts)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right text-sm text-red-600 dark:text-red-400">
                    {formatCurrency(fund.totalPayments)}
                  </TableCell>
                  <TableCell className={`px-6 py-4 text-right text-sm font-semibold ${getBalanceColor(fund)}`}>
                    {formatCurrency(fund.closingBalance)}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {fund.isLocked ? (
                      <Badge color="green">
                        Đã khóa
                      </Badge>
                    ) : (
                      <Badge color="yellow">
                        Chưa khóa
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{fund.reconciler?.fullName || "—"}</TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Can permission="view_cash_fund">
                        <button
                          onClick={() => handleViewDetails(fund.fundDate)}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </Can>

                      <div className={`relative ${openDropdownId === fund.id ? 'z-[100]' : 'z-50'}`}>
                        <button
                          onClick={() =>
                            setOpenDropdownId(openDropdownId === fund.id ? null : fund.id)
                          }
                          className="dropdown-toggle rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>

                        <Dropdown
                          isOpen={openDropdownId === fund.id}
                          onClose={() => setOpenDropdownId(null)}
                          className="w-48 right-0 top-full mt-1"
                        >
                          {!fund.isLocked && (
                            <Can permission="lock_cash_fund">
                              <DropdownItem onItemClick={() => handleLock(fund)}>
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                  <Lock className="h-4 w-4" />
                                  <span>Khóa quỹ</span>
                                </div>
                              </DropdownItem>
                            </Can>
                          )}

                          {fund.isLocked && (
                            <Can permission="unlock_cash_fund">
                              <DropdownItem onItemClick={() => handleUnlock(fund)}>
                                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                                  <Unlock className="h-4 w-4" />
                                  <span>Mở khóa</span>
                                </div>
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
        ) : (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <p className="text-sm">Không có dữ liệu quỹ tiền mặt</p>
          </div>
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
            <span className="font-medium">{paginationMeta.total}</span> ngày
          </div>
          {paginationMeta.totalPages > 1 && (
            <Pagination
              currentPage={paginationMeta.page}
              totalPages={paginationMeta.totalPages}
              onPageChange={(newPage) => setPage(newPage)}
            />
          )}
        </div>
      )}

      {/* Lock Dialog */}
      <ConfirmDialog
        isOpen={showLockDialog}
        title="Khóa quỹ tiền mặt"
        message={selectedFund ? `Khóa quỹ tiền mặt ngày ${format(new Date(selectedFund.fundDate), "dd/MM/yyyy")}?` : ""}
        onConfirm={() => handleConfirmLock()}
        onClose={() => {
          setShowLockDialog(false);
          setSelectedFund(null);
        }}
        confirmText="Khóa"
        variant="success"
      />

      {/* Unlock Dialog */}
      <ConfirmDialog
        isOpen={showUnlockDialog}
        title="Mở khóa quỹ tiền mặt"
        message={selectedFund ? `Mở khóa quỹ tiền mặt ngày ${format(new Date(selectedFund.fundDate), "dd/MM/yyyy")}?` : ""}
        onConfirm={handleConfirmUnlock}
        onClose={() => {
          setShowUnlockDialog(false);
          setSelectedFund(null);
        }}
        confirmText="Mở khóa"
        variant="warning"
      />

      <CreateCashFundDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />

      <ViewCashFundDialog
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        fundDate={viewFundDate}
      />
       <CashFundExportPreviewDialog
        isOpen={isExportPreviewOpen}
        onClose={() => setExportPreviewOpen(false)}
        cashFunds={cashFunds}
        onConfirm={handleConfirmExport}
      />
    </div>
  );
}
