"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useRole,
  useRolePermissions,
  useAssignPermissions,
  useApiPermissions
} from "@/hooks";
import Button from "@/components/ui/button/Button";
import { ArrowLeft, Check, Lock, CheckSquare, TrendingUp } from "lucide-react";
import { ApiResponse, Permission, Role } from "@/types";
import { permissionMapping } from "@/utils/permission-mapping";
import { ClassicCard, ProgressCard, ComparisonCard } from "@/components/ui/card/StatCards";

export default function RolePermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = parseInt(params.id as string);

  const { data: roleDataWrapper, isLoading: roleLoading } = useRole(roleId);
  const { data: permissionsDataWrapper, isLoading: permissionsLoading } = useRolePermissions(roleId);
  const { data: allPermissionsData, isLoading: allPermissionsLoading } = useApiPermissions();
  const assignMutation = useAssignPermissions(roleId);

  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const roleData = roleDataWrapper as unknown as ApiResponse<Role>;
  const permissionsData = permissionsDataWrapper as unknown as ApiResponse<any>;
  const allPermissionsResponse = allPermissionsData as unknown as ApiResponse<any>;

  const role = roleData?.data;
  const currentPermissions = permissionsData?.data?.permissions || [];
  const allPermissions = (allPermissionsResponse?.data?.permissions || []) as Permission[];

  // Luôn group từ allPermissions (toàn bộ permissions) để hiển thị checkbox
  const groupedPermissions = allPermissions.reduce((acc: any, perm: any) => {
    const module = perm.module || "General";
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(perm);
    return acc;
  }, {});

  // Initialize selected permissions
  useEffect(() => {
    const ids = new Set<number>(currentPermissions.map((p: any) => p.id as number));
    setSelectedPermissions(ids);
  }, [currentPermissions]);

  const togglePermission = (permissionId: number) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const toggleModule = (module: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(module)) {
      newExpanded.delete(module);
    } else {
      newExpanded.add(module);
    }
    setExpandedModules(newExpanded);
  };

  const handleSave = async () => {
    try {
      await assignMutation.mutateAsync(Array.from(selectedPermissions));
      router.push("/settings/roles");
    } catch (error) {}
  };

  const isModified =
    selectedPermissions.size !== currentPermissions.length ||
    !Array.from(selectedPermissions).every((id) =>
      currentPermissions.some((p: any) => p.id === id)
    );

  // Show loading state while fetching
  if (roleLoading || permissionsLoading || allPermissionsLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="mt-2 h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
          <div className="h-10 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>

        {/* Summary Skeletons */}
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="mt-3 h-8 w-16 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
          ))}
        </div>

        {/* Permissions List Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-red-500">Không tìm thấy vai trò</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản Lý Quyền Hạn
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý quyền hạn cho vai trò: {role.roleName} ({role.roleKey})
          </p>
        </div>
        <Link
          href="/settings/roles"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
          Quay lại
        </Link>
      </div>

      {/* Summary */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ClassicCard 
          title="Tổng Quyền Hạn"
          value={allPermissions.length}
          icon={Lock}
          color="blue"
          description="Quyền hạn trong hệ thống"
        />
        <ProgressCard 
          title="Quyền Được Gán"
          value={selectedPermissions.size}
          subValue={`/ ${allPermissions.length}`}
          color="indigo"
          trend={allPermissions.length > 0 ? Math.round((selectedPermissions.size / allPermissions.length) * 100) : 0}
          description="Đã gán cho vai trò"
        />
        <ComparisonCard 
          title="Tỉ Lệ Phủ Sóng"
          value={`${allPermissions.length > 0 ? Math.round((selectedPermissions.size / allPermissions.length) * 100) : 0}%`}
          subValue={`${selectedPermissions.size} / ${allPermissions.length}`}
          icon={TrendingUp}
        />
      </div>

      {/* Permissions List */}
      <div className="space-y-3">
        {Object.entries(groupedPermissions).map(([module, permissions]: [string, any]) => (
          <div
            key={module}
            className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
          >
            {/* Module Header */}
            <button
              onClick={() => toggleModule(module)}
              className="flex w-full items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <span className="font-semibold text-gray-900 dark:text-white">
                {permissionMapping[module]}
              </span>
              <span
                className={`transition-transform ${
                  expandedModules.has(module) ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </button>

            {/* Permissions Grid */}
            {expandedModules.has(module) && (
              <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                <div className="grid gap-3 lg:grid-cols-2">
                  {permissions.map((permission: any) => (
                    <label
                      key={permission.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.has(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 dark:border-gray-600 dark:bg-gray-700"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {permission.permissionName}
                        </p>
                        {permission.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {permission.description}
                          </p>
                        )}
                        <code className="mt-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {permission.permissionKey}
                        </code>
                      </div>
                      {selectedPermissions.has(permission.id) && (
                        <Check className="h-5 w-5 text-blue-600" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleSave}
          variant="primary"
          disabled={!isModified || assignMutation.isPending}
        >
          {assignMutation.isPending ? "Đang Lưu..." : "Lưu Thay Đổi"}
        </Button>
        <Link href="/settings/roles">
          <Button variant="outline">Hủy</Button>
        </Link>
      </div>

      {/* Info Box */}
      {!isModified && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Không có thay đổi nào được thực hiện trên quyền hạn.
          </p>
        </div>
      )}
    </div>
  );
}
