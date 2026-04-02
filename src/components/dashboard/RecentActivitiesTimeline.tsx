"use client";

import React from "react";
import { useActivityLogs } from "@/hooks/api";
import { formatDate, formatTime } from "@/lib/utils";
import { User, Package, CheckCircle, Clock } from "lucide-react";

type ActivityType = "order" | "inventory" | "production" | "finance" | "user";

interface Activity {
  id: number;
  timestamp: string;
  userName: string;
  action: string;
  description: string;
  type: ActivityType;
}

interface RecentActivitiesTimelineProps {
  initialData?: any[];
}

export function RecentActivitiesTimeline({ initialData }: RecentActivitiesTimelineProps) {
  const { data: activitiesResponse, isLoading } = useActivityLogs(10);
  
  // Safe access to data array
  const rawActivities = initialData || (Array.isArray(activitiesResponse) 
    ? activitiesResponse 
    : (activitiesResponse?.data || []));

  const mapActionToText = (action: string) => {
    switch (action) {
      case 'create': return 'Tạo mới';
      case 'update': return 'Cập nhật';
      case 'delete': return 'Xóa';
      case 'approve': return 'Phê duyệt';
      case 'login': return 'Đăng nhập';
      case 'logout': return 'Đăng xuất';
      case 'cancel': return 'Hủy bỏ';
      default: return action;
    }
  };

  const mapTableToText = (tableName: string) => {
    switch (tableName) {
      case 'users': return 'Nhân viên';
      case 'products': return 'Sản phẩm';
      case 'orders': return 'Đơn hàng';
      case 'sales_orders': return 'Đơn bán hàng';
      case 'purchase_orders': return 'Đơn nhập hàng';
      case 'inventory': return 'Kho hàng';
      case 'attendance': return 'Chấm công';
      case 'customers': return 'Khách hàng';
      case 'suppliers': return 'Nhà cung cấp';
      default: return tableName;
    }
  };

  // Map API data to component interface
  const activities: Activity[] = rawActivities.map((item: any) => {
    let type: ActivityType = 'user';
    const table = item.tableName?.toLowerCase() || '';
    
    if (table.includes('order') || table.includes('sale')) type = 'order';
    else if (table.includes('inventory') || table.includes('stock') || table.includes('warehouse')) type = 'inventory';
    else if (table.includes('production') || table.includes('bom')) type = 'production';
    else if (table.includes('payment') || table.includes('finance') || table.includes('money')) type = 'finance';
    
    // Construct meaningful description
    let description = item.reason || item.description || `Thực hiện thao tác trên ${mapTableToText(item.tableName)}`;
    if (!description || description === 'null') {
        description = `${mapActionToText(item.action)} ${mapTableToText(item.tableName)}`;
    }

    return {
      id: item.id,
      timestamp: item.timestamp || item.createdAt,
      userName: item.user?.fullName || item.userName || item.user_name || 'Người dùng hệ thống',
      action: mapActionToText(item.action),
      description: item.description || description,
      type: item.type || type,
    };
  });

  const getIcon = (type: ActivityType) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case "order":
        return <Package className={`${iconClass} text-blue-600 dark:text-blue-400`} />;
      case "inventory":
        return <CheckCircle className={`${iconClass} text-green-600 dark:text-green-400`} />;
      case "production":
        return <Clock className={`${iconClass} text-purple-600 dark:text-purple-400`} />;
      case "finance":
        return <Package className={`${iconClass} text-orange-600 dark:text-orange-400`} />;
      default:
        return <User className={`${iconClass} text-gray-600 dark:text-gray-400`} />;
    }
  };

  const getBgColor = (type: ActivityType) => {
    switch (type) {
      case "order":
        return "bg-blue-100 dark:bg-blue-900/30";
      case "inventory":
        return "bg-green-100 dark:bg-green-900/30";
      case "production":
        return "bg-purple-100 dark:bg-purple-900/30";
      case "finance":
        return "bg-orange-100 dark:bg-orange-900/30";
      default:
        return "bg-gray-100 dark:bg-gray-700";
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
      {/* Header */}
      <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
        Hoạt động gần đây
      </h3>

      {/* Timeline */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          activities.map((activity, index) => (
            <div key={activity.id} className="flex gap-4">
              {/* Timeline line and icon */}
              <div className="flex flex-col items-center">
                <div className={`rounded-lg p-2 ${getBgColor(activity.type)}`}>
                  {getIcon(activity.type)}
                </div>
                {index < activities.length - 1 && (
                  <div className="my-2 h-8 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                )}
              </div>

              {/* Activity content */}
              <div className="flex-1 pt-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.description}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      Bởi <span className="font-medium">{activity.userName}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {formatTime(activity.timestamp)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Không có hoạt động gần đây
          </p>
        )}
      </div>
    </div>
  );
}
