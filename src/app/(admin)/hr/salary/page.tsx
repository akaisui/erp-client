"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Can } from "@/components/auth/Can";
import {
  useSalary,
  useApproveSalary,
  useDeleteSalary,
} from "@/hooks/api/useSalary";
import { useUsers, useWarehouses, useRoles } from "@/hooks/api";
import SalaryStatusBadge, {
  MonthDisplay,
  PostedStatus,
} from "@/components/salary/SalaryStatus";
import { dateToMonth } from "@/types/salary.types";
import { formatCurrency } from "@/lib/utils";
import type { SalaryStatus, Salary } from "@/types/salary.types";
import {
  CheckCircle,
  Trash2,
  Eye,
  Calculator,
  Banknote,
  X,
  Search,
  FileText,
} from "lucide-react";
import { useDebounce } from "@/hooks";
import { ApiResponse, PaginationMeta, Role, User, Warehouse } from "@/types";
import Pagination from "@/components/tables/Pagination";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { MonthPicker } from "@/components/form/MonthPicker";
import Button from "@/components/ui/button/Button";
import { useRouter } from "next/navigation";

export default function SalaryListPage() {
  const router = useRouter();

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [monthFilter, setMonthFilter] = useState(dateToMonth(new Date()));
  const [statusFilter, setStatusFilter] = useState<SalaryStatus | "all">("all");
  const [userFilter, setUserFilter] = useState<number>(0);
  const [roleFilter, setRoleFilter] = useState<number>(0);
  const [warehouseFilter, setWarehouseFilter] = useState<number>(0);

  const { data: salaryDataWrapper, isLoading } = useSalary({
    page,
    limit,
    month: monthFilter,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(userFilter !== 0 && { userId: userFilter }),
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(roleFilter !== 0 && { roleId: roleFilter }),
    ...(warehouseFilter !== 0 && { warehouseId: warehouseFilter }),
  });
  const salaryData = salaryDataWrapper as unknown as ApiResponse<Salary[]>;
  const salaries = salaryData?.data as unknown as Salary[] || [];
  const paginationMeta = salaryData?.meta as unknown as PaginationMeta;

  const { data: usersData } = useUsers({ limit: 1000 });
  const users = usersData?.data as unknown as User[] || []
  const { data: rolesData } = useRoles();
  const roles = rolesData?.data as unknown as Role[] || [];
  const { data: warehousesData } = useWarehouses();
  const warehouses = warehousesData?.data as unknown as Warehouse[]  || [];
  const approveMutation = useApproveSalary();
  const deleteMutation = useDeleteSalary();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, monthFilter, userFilter, statusFilter, roleFilter, warehouseFilter]);

  // Statistics
  const stats = useMemo(() => {
    const pending = salaries.filter((s) => s.status === "pending").length;
    const approved = salaries.filter((s) => s.status === "approved").length;
    const paid = salaries.filter((s) => s.status === "paid").length;
    const totalAmount = salaries.reduce((sum, s) => sum + s.totalSalary, 0);

    return { pending, approved, paid, totalAmount };
  }, [salaries]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleApprove = async (id: number) => {
    if (!confirm("Xác nhận phê duyệt bảng lương này?")) return;
    await approveMutation.mutateAsync({ id });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xác nhận xóa bảng lương này? Hành động này không thể hoàn tác!"))
      return;
    await deleteMutation.mutateAsync(id);
  };

  // Check if any filters are active
  const hasActiveFilters =
    !!searchTerm ||
    userFilter !== 0 ||
    statusFilter !== "all" ||
    roleFilter !== 0 ||
    warehouseFilter !== 0;

  // Clear all filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setMonthFilter(dateToMonth(new Date()));
    setUserFilter(0);
    setStatusFilter("all");
    setRoleFilter(0);
    setWarehouseFilter(0);
    setPage(1);
  };

  // Get status label
  const getStatusLabel = (status: SalaryStatus) => {
    const labels: Record<SalaryStatus, string> = {
      pending: "Chờ duyệt",
      approved: "Đã duyệt",
      paid: "Đã thanh toán",
    };
    return labels[status] || status;
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Quản lý Lương
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý và theo dõi bảng lương nhân viên
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Can permission="create_salary">
            <Button
              onClick={() => router.push("/hr/salary/calculate")}
              size="smm"
              variant="primary"
            >
              <Calculator className="w-5 h-5" />
              Tính lương
            </Button>
          </Can>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Card 1: Chờ duyệt */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-yellow-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer dark:border-gray-800 dark:from-gray-900 dark:to-yellow-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -z-0" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Chờ Duyệt
              </p>
              <p className="mt-3 text-3xl font-bold text-yellow-600 dark:text-yellow-400 transition-all duration-300 group-hover:scale-110">
                {stats.pending}
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative border-2 border-yellow-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Calculator className="h-7 w-7 text-yellow-600 dark:text-yellow-400" strokeWidth={2} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-yellow-200 dark:border-yellow-900">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Chờ phê duyệt
            </p>
          </div>
        </div>

        {/* Card 2: Đã duyệt */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-blue-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer dark:border-gray-800 dark:from-gray-900 dark:to-blue-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-0" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Đã Duyệt
              </p>
              <p className="mt-3 text-3xl font-bold text-blue-600 dark:text-blue-400 transition-all duration-300 group-hover:scale-110">
                {stats.approved}
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative border-2 border-blue-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <CheckCircle className="h-7 w-7 text-blue-600 dark:text-blue-400" strokeWidth={2} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-900">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Đã phê duyệt
            </p>
          </div>
        </div>

        {/* Card 3: Đã thanh toán */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-green-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer dark:border-gray-800 dark:from-gray-900 dark:to-green-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -z-0" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Đã Thanh Toán
              </p>
              <p className="mt-3 text-3xl font-bold text-green-600 dark:text-green-400 transition-all duration-300 group-hover:scale-110">
                {stats.paid}
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative border-2 border-green-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Banknote className="h-7 w-7 text-green-600 dark:text-green-400" strokeWidth={2} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-900">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Đã chi trả
            </p>
          </div>
        </div>

        {/* Card 4: Tổng tiền */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-purple-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer dark:border-gray-800 dark:from-gray-900 dark:to-purple-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-0" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tổng Tiền
              </p>
              <p className="mt-3 text-2xl font-bold text-purple-600 dark:text-purple-400 transition-all duration-300 group-hover:scale-110">
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative border-2 border-purple-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Banknote className="h-7 w-7 text-purple-600 dark:text-purple-400" strokeWidth={2} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-900">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Tổng bảng lương
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {/* Search Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tìm kiếm
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              placeholder="Tìm theo tên, mã NV..."
            />
          </div>
        </div>

        {/* Month Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tháng
          </label>
          <MonthPicker
            value={monthFilter}
            onChange={setMonthFilter}
            placeholder="Chọn tháng"
          />
        </div>

        {/* User Filter */}
        <Can permission="view_salary">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nhân viên
            </label>
            <SearchableSelect
              options={[
                { value: "", label: "Tất cả nhân viên" },
                ...users.map((u) => ({
                  value: String(u.id),
                  label: u.fullName,
                })),
              ]}
              value={userFilter === 0 ? "" : String(userFilter)}
              onChange={(value) => {
                if (value === "") {
                  setUserFilter(0);
                } else {
                  setUserFilter(Number(value));
                }
              }}
              placeholder="Tìm kiếm nhân viên..."
              isClearable={false}
            />
          </div>
        </Can>

        {/* Status Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Trạng thái
          </label>
          <select
            value={statusFilter || ""}
            onChange={(e) =>
              setStatusFilter(
                (e.target.value as SalaryStatus | "all") || "all"
              )
            }
            className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="paid">Đã thanh toán</option>
          </select>
        </div>

        {/* Role Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Vai trò
          </label>
          <SearchableSelect
            options={[
              { value: "", label: "Tất cả vai trò" },
              ...roles.map((r: any) => ({
                value: String(r.id),
                label: r.roleName,
              })),
            ]}
            value={roleFilter === 0 ? "" : String(roleFilter)}
            onChange={(value) => {
              if (value === "") {
                setRoleFilter(0);
              } else {
                setRoleFilter(Number(value));
              }
            }}
            placeholder="Tìm kiếm vai trò..."
            isClearable={false}
          />
        </div>

        {/* Warehouse Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Kho
          </label>
          <SearchableSelect
            options={[
              { value: "", label: "Tất cả kho" },
              ...warehouses.map((w: any) => ({
                value: String(w.id),
                label: `${w.warehouseName} (${w.warehouseCode})`,
              })),
            ]}
            value={warehouseFilter === 0 ? "" : String(warehouseFilter)}
            onChange={(value) => {
              if (value === "") {
                setWarehouseFilter(0);
              } else {
                setWarehouseFilter(Number(value));
              }
            }}
            placeholder="Tìm kiếm kho..."
            isClearable={false}
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Bộ lọc:
            </span>

            {userFilter !== 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                Nhân viên: {users.find((u) => u.id === userFilter)?.fullName || `Nhân viên ${userFilter}`}
                <button
                  onClick={() => setUserFilter(0)}
                  className="hover:text-blue-900 dark:hover:text-blue-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                Trạng thái: {getStatusLabel(statusFilter as SalaryStatus)}
                <button
                  onClick={() => setStatusFilter("all")}
                  className="hover:text-amber-900 dark:hover:text-amber-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {searchTerm && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                Tìm: {searchTerm}
                <button
                  onClick={() => setSearchTerm("")}
                  className="hover:text-green-900 dark:hover:text-green-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {roleFilter !== 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                Vai trò: {roles.find((r: any) => r.id === roleFilter)?.roleName || `Vai trò ${roleFilter}`}
                <button
                  onClick={() => setRoleFilter(0)}
                  className="hover:text-purple-900 dark:hover:text-purple-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {warehouseFilter !== 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                Kho: {warehouses.find((w: any) => w.id === warehouseFilter)?.warehouseName || `Kho ${warehouseFilter}`}
                <button
                  onClick={() => setWarehouseFilter(0)}
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
              <X className="h-3 w-3" />
              Xóa tất cả
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : salaries.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <FileText className="mb-4 h-12 w-12" />
            <p className="text-sm">Không tìm thấy dữ liệu lương nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nhân viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tháng
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Lương cơ bản
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Phụ cấp + OT
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Khấu trừ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tổng lương
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hạch toán
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {salaries.map((salary) => (
                <tr
                  key={salary.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {salary.user?.fullName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {salary.user?.employeeCode}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <MonthDisplay month={salary.month} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {formatCurrency(salary.basicSalary)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 dark:text-green-400">
                    {formatCurrency(
                      salary.allowance +
                        salary.overtimePay +
                        salary.bonus +
                        salary.commission
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600 dark:text-red-400">
                    {formatCurrency(salary.deduction + salary.advance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(salary.totalSalary)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <SalaryStatusBadge status={salary.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <PostedStatus isPosted={salary.isPosted} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      {/* View Details */}
                      <Link
                          href={`/hr/salary/${salary.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>

                        {/* Approve (only pending) */}
                        {salary.status === "pending" && (
                          <Can permission="approve_salary">
                            <button
                              onClick={() => handleApprove(salary.id)}
                              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                              title="Phê duyệt"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          </Can>
                        )}

                        {/* Delete (only pending) */}
                        {salary.status === "pending" && (
                          <Can permission="delete_salary">
                            <button
                              onClick={() => handleDelete(salary.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                              title="Xóa"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </Can>
                        )}
                      </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <span className="font-medium">{paginationMeta.total}</span> bảng lương
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
    </div>
  );
}
