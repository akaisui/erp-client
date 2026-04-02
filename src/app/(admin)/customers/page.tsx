"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCustomers, useDeleteCustomer, useCreateCustomer } from "@/hooks/api";
import { Can } from "@/components/auth";
import Button from "@/components/ui/button/Button";
import SearchableSelect from "@/components/ui/SearchableSelect";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import ExcelPreviewDialog from "@/components/ui/modal/ExcelPreviewDialog";
import { GradientCard, FinancialCard, ProgressCard, MiniListCard } from "@/components/ui/card/StatCards";
import { ApiResponse, Customer, CustomerStatus, CustomerType, CustomerClassification, DebtStatus, CustomerCard } from "@/types";
import { Plus, Users, DollarSign, Download, Upload, X, RotateCcw, SearchIcon } from "lucide-react";
import { VIETNAM_PROVINCES } from "@/types";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks";
import Pagination from "@/components/tables/Pagination";
import * as XLSX from "xlsx";

// --- IMPORTS MỚI TỪ FOLDER (components) ---
import CustomerTable from "./(components)/CustomerTable";
import { CustomerDialog } from "./(components)/CustomerDialog";
import { ViewCustomerDialog } from "./(components)/ViewCustomerDialog";

export default function CustomersPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination & Filters state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [customerTypeFilter, setCustomerTypeFilter] = useState<CustomerType | "all">("all");
  const [classificationFilter, setClassificationFilter] = useState<CustomerClassification | "all">("all");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "all">("all");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [debtStatusFilter, setdebtStatusFilter] = useState<DebtStatus | "all">("all");
  const [creditLimitFilterActive, setCreditLimitFilterActive] = useState(false);

  // --- STATE CHO DIALOG (Create/Edit) ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  // View dialog state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedViewCustomerId, setSelectedViewCustomerId] = useState<number | null>(null);

  const handleOpenView = (customer: Customer) => {
    setSelectedViewCustomerId(customer.id);
    setIsViewDialogOpen(true);
  };

  // Excel Preview state
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false);
  const [exportPreviewData, setExportPreviewData] = useState<any[]>([]);

  // Fetch Customers
  const { data, isLoading, error } = useCustomers({
    page,
    limit,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(customerTypeFilter !== "all" && { customerType: customerTypeFilter }),
    ...(classificationFilter !== "all" && { classification: classificationFilter }),
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(provinceFilter !== "all" && { province: provinceFilter }),
    ...(debtStatusFilter !== "all" && { debtStatus: debtStatusFilter }),
  });
  
  const response = data as unknown as ApiResponse<Customer[]> & { cards: CustomerCard };
  const customers = response?.data || [];
  const paginationMeta = response?.meta;
  const cards = response?.cards;

  useEffect(() => {
      setPage(1);
  }, [debouncedSearch, statusFilter, customerTypeFilter, classificationFilter, provinceFilter, debtStatusFilter]);

  const deleteCustomer = useDeleteCustomer();
  const createCustomer = useCreateCustomer();

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  }

  // --- HANDLERS CHO DIALOG ---
  const handleOpenCreate = () => {
    setSelectedCustomer(null); // Null = Mode tạo mới
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setSelectedCustomer(customer); // Có data = Mode chỉnh sửa
    setIsDialogOpen(true);
  };

  // --- HANDLERS DELETE ---
  const openDeleteDialog = (customer: Customer) => {
    setDeletingCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingCustomer(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return;

    try {
      await deleteCustomer.mutateAsync(deletingCustomer.id);
      toast.success("Xóa khách hàng thành công");
      closeDeleteDialog();
    } catch (error) {
      console.error(error);
      // Toast lỗi đã được handle trong hook useDeleteCustomer nếu có
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setCustomerTypeFilter("all");
    setClassificationFilter("all");
    setStatusFilter("all");
    setProvinceFilter("all");
    setdebtStatusFilter("all");
    setCreditLimitFilterActive(false);
  };

  // Format data for export
  const getFormattedExportData = () => {
    return customers.map((customer) => ({
      "Mã KH": customer.customerCode,
      "Tên KH": customer.customerName,
      "Giới tính": customer.gender === "male" ? "Nam" : customer.gender === "female" ? "Nữ" : "Khác",
      "Loại KH": customer.customerType === "individual" ? "Cá nhân" : "Công ty",
      "Phân loại": 
        customer.classification === "retail" ? "Bán lẻ" :
        customer.classification === "wholesale" ? "Bán sỉ" :
        customer.classification === "vip" ? "VIP" :
        customer.classification === "distributor" ? "Đại lý" : customer.classification,
      "Người liên hệ": customer.contactPerson || "-",
      "Điện thoại": customer.phone || "-",
      "Email": customer.email || "-",
      "Địa chỉ": customer.address || "-",
      "Tỉnh/TP": customer.province || "-",
      "Quận/Huyện": customer.district || "-",
      "MST": customer.taxCode || "-",
      "CCCD/CMND": customer.cccd || "-",
      "Ngày cấp": customer.issuedAt ? new Date(customer.issuedAt).toLocaleDateString("vi-VN") : "-",
      "Nơi cấp": customer.issuedBy || "-",
      "Hạn mức tín dụng": customer.creditLimit || 0,
      "Công nợ hiện tại": customer.currentDebt || 0,
      "Điểm tích lũy": customer.rewardPoints || 0,
      "Trạng thái": customer.status === "active" ? "Hoạt động" : customer.status === "inactive" ? "Tạm ngưng" : "Danh sách đen",
      "Ghi chú": customer.notes || "-",
    }));
  };

  // Handle Export Click (Show Preview)
  const handleExportClick = () => {
    const data = getFormattedExportData();
    setExportPreviewData(data);
    setIsExportPreviewOpen(true);
  };

  // Confirm Export (Actual Download)
  const handleConfirmExport = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(exportPreviewData);
      const columnWidths = [
        { wch: 12 },   // Mã KH
        { wch: 25 },   // Tên KH
        { wch: 10 },   // Giới tính
        { wch: 12 },   // Loại KH
        { wch: 12 },   // Phân loại
        { wch: 20 },   // Người liên hệ
        { wch: 15 },   // Điện thoại
        { wch: 25 },   // Email
        { wch: 30 },   // Địa chỉ
        { wch: 15 },   // Tỉnh/TP
        { wch: 15 },   // Quận/Huyện
        { wch: 15 },   // MST
        { wch: 15 },   // CCCD
        { wch: 15 },   // Ngày cấp
        { wch: 20 },   // Nơi cấp
        { wch: 15 },   // Hạn mức
        { wch: 15 },   // Công nợ
        { wch: 12 },   // Điểm
        { wch: 15 },   // Trạng thái
        { wch: 30 },   // Ghi chú
      ];
      worksheet["!cols"] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Khách hàng");

      const fileName = `khachhang_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success("Xuất danh sách khách hàng thành công!");
      setIsExportPreviewOpen(false);
    } catch (error) {
        toast.error("Lỗi khi xuất danh sách khách hàng");
        console.error(error);
    }
  };

  // Handle Import Excel
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const validCustomers: any[] = [];
          const errors: Array<{ row: number; customerName: string; message: string }> = [];
          const duplicates: Array<{ row: number; customerCode: string }> = [];
          const processedCodes = new Set<string>();

          // ... (Giữ nguyên logic mapping cột như cũ của bạn) ...
          const columnMapping: Record<string, string[]> = {
            customerCode: ["Mã KH", "customerCode", "Code"],
            customerName: ["Tên KH", "customerName", "Customer Name"],
            customerType: ["Loại KH", "customerType", "Type"],
            classification: ["Phân loại", "classification", "Classification"],
            taxCode: ["MST", "taxCode", "Tax Code"],
            phone: ["Số điện thoại", "phone", "Phone"],
            email: ["Email", "email", "Email"],
            address: ["Địa chỉ", "address", "Address"],
            province: ["Tỉnh/TP", "province", "Province"],
            district: ["Quận/Huyện", "district", "District"],
            creditLimit: ["Hạn mức tín dụng", "creditLimit", "Credit Limit"],
            status: ["Trạng thái", "status", "Status"],
          };

          const getColumnValue = (row: any, columnAlternatives: string[]) => {
            for (const alt of columnAlternatives) {
              if (row[alt] !== undefined && row[alt] !== null && row[alt] !== "") {
                return row[alt];
              }
            }
            return undefined;
          };

          jsonData.forEach((row: any, index: number) => {
            const rowNumber = index + 2;
            const customerCode = getColumnValue(row, columnMapping.customerCode);
            const customerName = getColumnValue(row, columnMapping.customerName);

            if (!customerCode || !customerCode.toString().trim()) {
              errors.push({
                row: rowNumber,
                customerName: customerName || "Unknown",
                message: "Mã KH là bắt buộc",
              });
              return;
            }

            const codeStr = customerCode.toString().trim().toUpperCase();

            if (processedCodes.has(codeStr)) {
              duplicates.push({
                row: rowNumber,
                customerCode: codeStr,
              });
              return;
            }

            if (!customerName || !customerName.toString().trim()) {
              errors.push({
                row: rowNumber,
                customerName: codeStr,
                message: "Tên KH là bắt buộc",
              });
              return;
            }

            // ... (Logic parse values giống cũ) ...
            let customerType: "individual" | "company" = "individual";
            const typeVal = getColumnValue(row, columnMapping.customerType);
            if (typeVal && typeVal.toString().includes("Công ty")) {
              customerType = "company";
            }

            let classification: "retail" | "wholesale" | "vip" | "distributor" = "retail";
            const classVal = getColumnValue(row, columnMapping.classification);
            if (classVal) {
              const classStr = classVal.toString().trim().toLowerCase();
              if (classStr.includes("sỉ")) classification = "wholesale";
              else if (classStr.includes("vip")) classification = "vip";
              else if (classStr.includes("đại")) classification = "distributor";
            }

            const creditLimitVal = getColumnValue(row, columnMapping.creditLimit);
            const creditLimit = creditLimitVal ? parseFloat(creditLimitVal.toString()) : 0;
            if (isNaN(creditLimit) || creditLimit < 0) {
              errors.push({
                row: rowNumber,
                customerName: customerName.toString().trim(),
                message: "Hạn mức tín dụng phải là số không âm",
              });
              return;
            }

            let status: "active" | "inactive" | "blacklisted" = "active";
            const statusVal = getColumnValue(row, columnMapping.status);
            if (statusVal) {
              const statusStr = statusVal.toString().toLowerCase().trim();
              if (statusStr.includes("tạm ngưng")) status = "inactive";
              else if (statusStr.includes("danh sách đen") || statusStr.includes("blacklist")) status = "blacklisted";
            }

            validCustomers.push({
              customerCode: codeStr,
              customerName: customerName.toString().trim(),
              customerType,
              classification,
              taxCode: getColumnValue(row, columnMapping.taxCode)?.toString().trim(),
              phone: getColumnValue(row, columnMapping.phone)?.toString().trim(),
              email: getColumnValue(row, columnMapping.email)?.toString().trim(),
              address: getColumnValue(row, columnMapping.address)?.toString().trim(),
              province: getColumnValue(row, columnMapping.province)?.toString().trim(),
              district: getColumnValue(row, columnMapping.district)?.toString().trim(),
              creditLimit,
              status,
            });

            processedCodes.add(codeStr);
          });

          // Show summary
          let summary = `Thành công: ${validCustomers.length} khách hàng`;
          if (errors.length > 0) summary += `\nLỗi: ${errors.length} hàng`;
          if (duplicates.length > 0) summary += `\nTrùng: ${duplicates.length} mã`;

          if (errors.length > 0 || duplicates.length > 0) {
            let errorMsg = summary;
            if (errors.length > 0) {
              errorMsg += "\n\nLỗi chi tiết:\n" + errors.slice(0, 3).map(e => `Hàng ${e.row}: ${e.message}`).join("\n");
              if (errors.length > 3) errorMsg += `\n... và ${errors.length - 3} lỗi khác`;
            }
            toast.error(errorMsg);
          }

          // Import valid customers
          if (validCustomers.length > 0) {
            let successCount = 0;
            for (const customer of validCustomers) {
              try {
                await createCustomer.mutateAsync(customer);
                successCount++;
              } catch (err) {
                console.error("Error importing customer:", err);
              }
            }
            toast.success(`Nhập thành công ${successCount}/${validCustomers.length} khách hàng`);
          }
        } catch (error: any) {
          toast.error(`Lỗi khi đọc file: ${error.message}`);
        }
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      toast.error("Lỗi khi xử lý file");
      console.error(error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const hasActiveFilters =
    searchTerm ||
    customerTypeFilter !== "all" ||
    classificationFilter !== "all" ||
    statusFilter !== "all" ||
    provinceFilter !== "all" ||
    debtStatusFilter !== "all";

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <h3 className="font-semibold text-red-900 dark:text-red-300">
          Lỗi khi tải danh sách khách hàng
        </h3>
        <p className="mt-1 text-sm text-red-800 dark:text-red-400">
          {(error as any)?.message || "Đã có lỗi xảy ra"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản Lý Khách Hàng
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý thông tin khách hàng và theo dõi công nợ
          </p>
        </div>

        <Can permission="create_customer">
          <div className="flex items-center gap-3">
            {/* Import Excel */}
            <Button
              variant="outline"
              size="ssmm"
              onClick={handleImportClick}
            >
              <Upload className="mr-2 h-5 w-5" />
              Nhập Excel
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Export Excel */}
            <Button
              variant="outline"
              size="ssmm"
              onClick={handleExportClick}
              disabled={customers.length === 0}
            >
              <Download className="mr-2 h-5 w-5" />
              Xuất Excel
            </Button>

            {/* Add Customer - SỬ DỤNG DIALOG */}
            <Button 
              variant="primary"
              size="ssmm"
              onClick={handleOpenCreate} 
            >
              <Plus className="mr-2 h-5 w-5" />
              Thêm khách hàng
            </Button>
          </div>
        </Can>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          // Loading Skeleton
          <>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse"
              />
            ))}
          </>
        ) : (
          <>
            <GradientCard
              title="Tổng khách hàng"
              value={cards?.total || 0}
              icon={Users}
              color="blue"
              trend={cards?.newThisMonth && cards?.total 
                ? Math.round((cards.newThisMonth / cards.total) * 100)
                : 0
              }
            />

            <FinancialCard
              title="Tổng công nợ"
              value={formatCurrency(cards?.totalDebt || 0)}
              icon={DollarSign}
              color="red"
              description="Cần theo dõi"
              onClick={() => {
                setdebtStatusFilter("with-debt");
                setStatusFilter("all");
              }}
            />

            <ProgressCard
              title="Vượt hạn mức"
              value={cards?.overLimit || 0}
              subValue={`${cards?.total || 0}`}
              color="orange"
              trend={cards?.overLimit && cards?.total
                ? Math.round((cards.overLimit / cards.total) * 100)
                : 0
              }
            />

            <MiniListCard
              title="Phân loại khách hàng"
              items={[
                { label: "Bán lẻ", value: cards?.byClassification.retail || 0 },
                { label: "Bán sỉ", value: cards?.byClassification.wholesale || 0 },
                { label: "VIP", value: cards?.byClassification.vip || 0 },
                { label: "Đại lý", value: cards?.byClassification.distributor || 0 },
              ]}
            />
          </>
        )}
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          id="search"
          placeholder="Mã, tên, SĐT, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
        />
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {/* Customer Type Filter */}
          <div>
            <label
              htmlFor="customerType"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Loại KH
            </label>
            <select
              id="customerType"
              value={customerTypeFilter}
              onChange={(e) => setCustomerTypeFilter(e.target.value as CustomerType | "all")}
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả loại</option>
              <option value="individual">Cá nhân</option>
              <option value="company">Công ty</option>
            </select>
          </div>

          {/* Classification Filter */}
          <div>
            <label
              htmlFor="classification"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Phân loại
            </label>
            <select
              id="classification"
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value as CustomerClassification | "all")}
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả phân loại</option>
              <option value="retail">Bán lẻ</option>
              <option value="wholesale">Bán sỉ</option>
              <option value="vip">VIP</option>
              <option value="distributor">Đại lý</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Trạng thái
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CustomerStatus | "all")}
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm ngưng</option>
              <option value="blacklisted">Danh sách đen</option>
            </select>
          </div>

          {/* Province Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tỉnh/TP
            </label>
            <SearchableSelect
              options={[
                { label: "Tất cả tỉnh/TP", value: "all" },
                ...VIETNAM_PROVINCES.map((province) => ({
                  label: province,
                  value: province,
                })),
              ]}
              value={provinceFilter}
              onChange={(value) => setProvinceFilter(String(value))}
              placeholder="Chọn tỉnh/TP..."
            />
          </div>

          {/* Debt Status Filter */}
          <div>
            <label
              htmlFor="debtStatus"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Công nợ
            </label>
            <select
              id="debtStatus"
              value={debtStatusFilter}
              onChange={(e) => setdebtStatusFilter(e.target.value as DebtStatus | "all")}
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả</option>
              <option value="with-debt">Đang có nợ</option>
              <option value="no-debt">Không có nợ</option>
              <option value="over-limit">Vượt hạn mức</option>
            </select>
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
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
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

            {customerTypeFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                Loại: {customerTypeFilter === "individual" ? "Cá nhân" : "Công ty"}
                <button
                  onClick={() => setCustomerTypeFilter("all")}
                  className="hover:text-purple-900 dark:hover:text-purple-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {classificationFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-sm text-pink-700 dark:bg-pink-900/20 dark:text-pink-400">
                Phân loại: {
                  classificationFilter === "retail" ? "Bán lẻ" :
                  classificationFilter === "wholesale" ? "Bán sỉ" :
                  classificationFilter === "vip" ? "VIP" : "Đại lý"
                }
                <button
                  onClick={() => setClassificationFilter("all")}
                  className="hover:text-pink-900 dark:hover:text-pink-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                Trạng thái: {statusFilter === "active" ? "Hoạt động" : statusFilter === "inactive" ? "Tạm ngưng" : "Danh sách đen"}
                <button
                  onClick={() => setStatusFilter("all")}
                  className="hover:text-yellow-900 dark:hover:text-yellow-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {provinceFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                Tỉnh: {provinceFilter}
                <button
                  onClick={() => setProvinceFilter("all")}
                  className="hover:text-indigo-900 dark:hover:text-indigo-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {debtStatusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                Công nợ: {debtStatusFilter === "with-debt" ? "Đang có nợ" : debtStatusFilter === "no-debt" ? "Không có nợ" : "Vượt hạn mức"}
                <button
                  onClick={() => setdebtStatusFilter("all")}
                  className="hover:text-red-900 dark:hover:text-red-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {creditLimitFilterActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                Vượt hạn mức
                <button
                  onClick={() => setCreditLimitFilterActive(false)}
                  className="hover:text-orange-900 dark:hover:text-orange-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            <Button variant="outline" size="sss" onClick={handleResetFilters}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>

      {/* Customers Table */}
      <CustomerTable
        customers={customers}
        isLoading={isLoading}
        onDelete={(id, customerName) => {
          const customer = customers.find(c => c.id === id);
          if (customer) {
            openDeleteDialog(customer);
          }
        }}
        onEdit={handleOpenEdit} // Pass the edit handler to the table
        onView={handleOpenView} // Pass the view handler
      />

      <ViewCustomerDialog
        isOpen={isViewDialogOpen}
        onClose={() => {
          setIsViewDialogOpen(false);
          setSelectedViewCustomerId(null);
        }}
        customerId={selectedViewCustomerId}
        onEdit={(customer) => {
            setIsViewDialogOpen(false);
            handleOpenEdit(customer);
        }}
      />

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
            <span className="font-medium">{paginationMeta.total}</span> khách hàng
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

    {/* CUSTOMER DIALOG (Create/Edit) */}
    <CustomerDialog
      isOpen={isDialogOpen}
      onClose={() => setIsDialogOpen(false)}
      customer={selectedCustomer}
    />

    {/* Delete Confirmation Dialog */}
    <ConfirmDialog
      isOpen={isDeleteDialogOpen}
      onClose={closeDeleteDialog}
      onConfirm={handleConfirmDelete}
      title="Xóa khách hàng"
      message={`Bạn có chắc chắn muốn xóa khách hàng "${deletingCustomer?.customerName}"? Hành động này không thể hoàn tác.`}
      confirmText="Xóa"
      cancelText="Hủy"
      variant="danger"
      isLoading={deleteCustomer.isPending}
    />

    {/* Excel Preview Dialog */}
    <ExcelPreviewDialog
      isOpen={isExportPreviewOpen}
      onClose={() => setIsExportPreviewOpen(false)}
      onExport={handleConfirmExport}
      data={exportPreviewData}
      fileName={`khachhang_${new Date().toISOString().split("T")[0]}.xlsx`}
    />
  </div>
  );
}