import React from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CheckCircle, AlertCircle, PlusCircle, Edit3, Trash2, CheckCircle2 } from "lucide-react";

interface ActivityLog {
  id: string;
  action: "create" | "update" | "delete" | "approve";
  tableName: string;
  recordId?: number | null;
  oldValue?: any;
  newValue?: any;
  reason?: string | null;
  status: "success" | "failure";
  createdAt: Date;
}

interface ActivityTimelineProps {
  logs: ActivityLog[];
  isLoading?: boolean;
}

export default function ActivityTimeline({ logs, isLoading }: ActivityTimelineProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case "create":
        return <PlusCircle className="h-5 w-5 text-green-500" />;
      case "update":
        return <Edit3 className="h-5 w-5 text-blue-500" />;
      case "delete":
        return <Trash2 className="h-5 w-5 text-red-500" />;
      case "approve":
        return <CheckCircle2 className="h-5 w-5 text-purple-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getActionLabel = (action: string, tableName: string) => {
    const actionMap: Record<string, string> = {
      create: "Tạo mới",
      update: "Cập nhật",
      delete: "Xóa",
      approve: "Phê duyệt",
    };

    const tableLabels: Record<string, string> = {
      users: "nhân viên",
      products: "sản phẩm",
      sales_orders: "đơn hàng bán",
      purchase_orders: "đơn hàng mua",
      stock_transactions: "giao dịch tồn kho",
      stock_transfers: "chuyển kho",
      production_orders: "đơn sản xuất",
      deliveries: "giao hàng",
      customers: "khách hàng",
      suppliers: "nhà cung cấp",
      categories: "danh mục",
      inventory: "tồn kho",
      salaries: "lương",
      attendance: "chấm công",
    };

    const action_text = actionMap[action] || action;
    const table_text = tableLabels[tableName] || tableName;

    return `${action_text} ${table_text}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">Không có nhật ký hoạt động</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {logs.map((log, index) => (
        <div key={log.id} className="flex gap-4">
          {/* Timeline line and dot */}
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-4 ring-white dark:bg-gray-800 dark:ring-gray-800">
              {getActionIcon(log.action)}
            </div>
            {index < logs.length - 1 && (
              <div className="mb-4 mt-2 w-1 flex-1 bg-gray-200 dark:bg-gray-700"></div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pt-1">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getActionLabel(log.action, log.tableName)}
                  </p>
                  {log.recordId && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      ID: {log.recordId}
                    </p>
                  )}
                </div>
                <div
                  className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                    log.status === "success"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                  }`}
                >
                  {log.status === "success" ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Thành công
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3" />
                      Lỗi
                    </>
                  )}
                </div>
              </div>

              {/* Reason if available */}
              {log.reason && (
                <div className="mt-3 rounded bg-blue-50 p-2 dark:bg-blue-900/20">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <span className="font-medium">Lý do:</span> {log.reason}
                  </p>
                </div>
              )}

              {/* Changes (oldValue & newValue) */}
              {(log.oldValue || log.newValue) && (
                <div className="mt-3 space-y-2">
                  {log.oldValue && (
                    <div className="rounded bg-red-50 p-2 dark:bg-red-900/20">
                      <p className="text-xs font-medium text-red-700 dark:text-red-300">Giá trị cũ:</p>
                      <pre className="mt-1 text-xs text-red-600 dark:text-red-400 overflow-auto max-h-32 bg-white dark:bg-gray-900 p-1 rounded border border-red-200 dark:border-red-800">
                        {JSON.stringify(log.oldValue, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.newValue && (
                    <div className="rounded bg-green-50 p-2 dark:bg-green-900/20">
                      <p className="text-xs font-medium text-green-700 dark:text-green-300">Giá trị mới:</p>
                      <pre className="mt-1 text-xs text-green-600 dark:text-green-400 overflow-auto max-h-32 bg-white dark:bg-gray-900 p-1 rounded border border-green-200 dark:border-green-800">
                        {JSON.stringify(log.newValue, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Timestamp */}
              <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                {format(new Date(log.createdAt), "HH:mm:ss • dd/MM/yyyy", {
                  locale: vi,
                })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
