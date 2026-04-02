"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRoles } from "@/hooks/api";
import { Can } from "@/components/auth";
import Button from "@/components/ui/button/Button";
import { Plus, Edit, Trash2, Lock, Search, Users, Eye, MoreVertical, Shield } from "lucide-react";
import { useDeleteRole } from "@/hooks/api/useRoles";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import { useDebounce } from "@/hooks";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { format } from "date-fns";
import { ApiResponse, Role, StatusCommon } from "@/types";
import Pagination from "@/components/tables/Pagination";
import { useRouter } from "next/navigation";
import { ClassicCard } from "@/components/ui/card/StatCards";
import { permissionMapping } from "@/utils/permission-mapping";

export default function RolesPage() {
  const router = useRouter();

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [statusFilter, setStatusFilter] = useState<StatusCommon | "all">("all");

  // Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<any | null>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const { data, isLoading, error } = useRoles({
    page,
    limit,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== "all" && { status: statusFilter }),
  });
  const response = data as unknown as ApiResponse<Role[]>;
  const roles = response?.data || [];
  const paginationMeta = response?.meta;

  const deleteRoleMutation = useDeleteRole();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    // Reset scroll
  }, [debouncedSearch, statusFilter]);

  const handleDeleteClick = (role: any) => {
    setDeletingRole(role);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingRole(null);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRole) return;
    try {
      await deleteRoleMutation.mutateAsync(deletingRole.id);
      setIsDeleteDialogOpen(false);
      setDeletingRole(null);
    } catch (error) {}
  };

  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate statistics
  const totalRoles = roles.length;
  const activeRoles = roles.filter((r: any) => r.status === "active").length;
  const inactiveRoles = roles.filter((r: any) => r.status === "inactive").length;
  const totalUsers = roles.reduce((sum: number, r: any) => sum + (r._count?.users || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Vai Trò &amp; Quyền Hạn
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý vai trò người dùng và quyền hạn tương ứng
          </p>
        </div>

        <Can permission="manage_settings">
          <Button 
            variant="primary" 
            size="ssmm" 
            onClick={() => router.push('/settings/roles/create')}
          >
            <Plus className="mr-2 h-5 w-5" />
            Tạo Vai Trò Mới
          </Button>
        </Can>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ClassicCard 
          title="Tổng Vai Trò"
          value={totalRoles}
          icon={Lock}
          color="blue"
          description="Vai trò trong hệ thống"
        />
        <ClassicCard 
          title="Đang Sử Dụng"
          value={activeRoles}
          icon={Users}
          color="green"
          description="Sẵn sàng sử dụng"
        />
        <ClassicCard 
          title="Không Sử Dụng"
          value={inactiveRoles}
          icon={Edit}
          color="yellow"
          description="Ngừng sử dụng"
        />
        <ClassicCard 
          title="Tổng Người Dùng"
          value={totalUsers}
          icon={Shield}
          color="purple"
          description="Đã gán vai trò"
        />
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Search */}
          <div>
            <label
              htmlFor="search"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Tìm Kiếm
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                placeholder="Tìm theo tên hoặc mã vai trò..."
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Trạng Thái
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất Cả Trạng Thái</option>
              <option value="active">Đang Sử Dụng</option>
              <option value="inactive">Không Sử Dụng</option>
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
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
            </select>
          </div>
        </div>
      </div>

       {/* Table */}
      <div className="overflow-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : roles.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <svg
              className="mb-4 h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>Không tìm thấy vai trò nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto min-h-72">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tên Vai Trò
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Mã
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Người Dùng
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Quyền Hạn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Trạng Thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Ngày Tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {roles.map((role: any) => (
                  <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-start gap-2">
                        <span>{role.roleName}</span>
                        {["admin", "user"].includes(role.roleKey) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 whitespace-nowrap">
                            🔒 Hệ Thống
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {role.roleKey}
                      </code>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {role._count?.users || 0}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        {role._count?.rolePermissions || 0}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(role.status)}`}
                      >
                        {role.status === "active" ? "Đang Sử Dụng" : "Không Sử Dụng"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(role.createdAt), "dd/MM/yyyy")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Permissions */}
                        <Link
                          href={`/settings/roles/${role.id}`}
                          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Xem quyền hạn"
                        >
                          <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </Link>

                        {/* Dropdown Menu */}
                        <div className="relative">
                          <button
                            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setOpenDropdown(openDropdown === role.id ? null : role.id)}
                            title="Thêm hành động"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </button>

                          <Dropdown
                            isOpen={openDropdown === role.id}
                            onClose={() => setOpenDropdown(null)}
                            className="w-48"
                          >
                            {/* Edit */}
                            {!["admin", "user"].includes(role.roleKey) && (
                              <Can permission="manage_settings">
                                <DropdownItem
                                  tag="a"
                                  href={`/settings/roles/${role.id}/edit`}
                                  onItemClick={() => setOpenDropdown(null)}
                                  className="dark:hover:bg-gray-700 dark:text-gray-300"
                                >
                                  <Edit className="h-3.5 w-3.5 mr-2" />
                                  Chỉnh Sửa
                                </DropdownItem>
                              </Can>
                            )}

                            {/* Delete */}
                            {!["admin", "user"].includes(role.roleKey) && (
                              <Can permission="manage_settings">
                                <DropdownItem
                                  onClick={() => {
                                    setOpenDropdown(null);
                                    handleDeleteClick(role);
                                  }}
                                  className="text-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  Xóa
                                </DropdownItem>
                              </Can>
                            )}
                          </Dropdown>
                        </div>
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
            <span className="font-medium">{paginationMeta.total}</span> vai trò
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Xóa Vai Trò"
        message={`Bạn có chắc chắn muốn xóa vai trò "${deletingRole?.roleName}" không? Hành động này không thể
hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteRoleMutation.isPending}
      />
    </div>
  );
}
