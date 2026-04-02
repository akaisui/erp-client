"use client";

import { useAuthStore } from "@/stores";

interface CanProps {
  /**
   * Permission cần check (single permission)
   */
  permission?: string;

  /**
   * Array permissions - cần ít nhất 1 permission
   */
  anyPermissions?: string[];

  /**
   * Array permissions - cần tất cả permissions
   */
  allPermissions?: string[];

  /**
   * Role cần check
   */
  role?: string;

  /**
   * Children sẽ render nếu có permission
   */
  children: React.ReactNode;

  /**
   * Fallback sẽ render nếu không có permission
   */
  fallback?: React.ReactNode;

  /**
   * Inverse logic - render children nếu KHÔNG có permission
   */
  not?: boolean;
}

/**
 * Can Component
 * Component để conditional rendering dựa trên permissions
 *
 * @example
 * // Single permission
 * <Can permission="view_products">
 *   <ProductList />
 * </Can>
 *
 * @example
 * // Any permissions (cần ít nhất 1)
 * <Can anyPermissions={['view_products', 'view_inventory']}>
 *   <ProductList />
 * </Can>
 *
 * @example
 * // All permissions (cần tất cả)
 * <Can allPermissions={['view_products', 'update_products']}>
 *   <EditButton />
 * </Can>
 *
 * @example
 * // With fallback
 * <Can permission="delete_products" fallback={<p>Bạn không có quyền xóa</p>}>
 *   <DeleteButton />
 * </Can>
 *
 * @example
 * // Check role
 * <Can role="admin">
 *   <AdminPanel />
 * </Can>
 *
 * @example
 * // Inverse logic (NOT)
 * <Can permission="admin" not>
 *   <p>Bạn không phải admin</p>
 * </Can>
 */
export function Can({
  permission,
  anyPermissions,
  allPermissions,
  role,
  children,
  fallback = null,
  not = false,
}: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isRole } = useAuthStore();

  let hasAccess = false;

  // Check single permission
  if (permission) {
    hasAccess = hasPermission(permission);
  }
  // Check any permissions
  else if (anyPermissions && anyPermissions.length > 0) {
    hasAccess = hasAnyPermission(anyPermissions);
  }
  // Check all permissions
  else if (allPermissions && allPermissions.length > 0) {
    hasAccess = hasAllPermissions(allPermissions);
  }
  // Check role
  else if (role) {
    hasAccess = isRole(role);
  }

  // Inverse logic nếu có flag "not"
  if (not) {
    hasAccess = !hasAccess;
  }

  // Render children hoặc fallback
  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * CanView Component - Shorthand cho view permission
 */
export function CanView({
  module,
  children,
  fallback,
}: {
  module: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Can permission={`view_${module}`} fallback={fallback}>
      {children}
    </Can>
  );
}

/**
 * CanCreate Component - Shorthand cho create permission
 */
export function CanCreate({
  module,
  children,
  fallback,
}: {
  module: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Can permission={`create_${module}`} fallback={fallback}>
      {children}
    </Can>
  );
}

/**
 * CanUpdate Component - Shorthand cho update permission
 */
export function CanUpdate({
  module,
  children,
  fallback,
}: {
  module: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Can permission={`update_${module}`} fallback={fallback}>
      {children}
    </Can>
  );
}

/**
 * CanDelete Component - Shorthand cho delete permission
 */
export function CanDelete({
  module,
  children,
  fallback,
}: {
  module: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Can permission={`delete_${module}`} fallback={fallback}>
      {children}
    </Can>
  );
}

/**
 * CanApprove Component - Shorthand cho approve permission
 */
export function CanApprove({
  module,
  children,
  fallback,
}: {
  module: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Can permission={`approve_${module}`} fallback={fallback}>
      {children}
    </Can>
  );
}

/**
 * IsAdmin Component - Check if user is admin
 */
export function IsAdmin({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Can role="admin" fallback={fallback}>
      {children}
    </Can>
  );
}
