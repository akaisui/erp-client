"use client";

import React from "react";
import { CrmTask, TaskPriority, TaskStatus, TaskType } from "@/types/crm.types";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import Badge, { BadgeColor } from "@/components/ui/badge/Badge";
import { Edit, Eye, Phone, Mail, Users, Calendar, Trash2 } from "lucide-react";

interface TaskTableProps {
  tasks: CrmTask[];
  isLoading: boolean;
  onEdit: (task: CrmTask) => void;
  onDelete: (id: number) => void;
  onView?: (task: CrmTask) => void;
}

const statusColors: Record<TaskStatus, BadgeColor> = {
  pending: "primary",
  in_progress: "yellow",
  completed: "green",
  cancelled: "gray",
};

const priorityColors: Record<TaskPriority, BadgeColor> = {
  low: "gray",
  medium: "primary",
  high: "red",
};

const TaskTypeIcon = ({ type }: { type: TaskType }) => {
  switch (type) {
    case "call": return <Phone className="w-4 h-4 text-blue-500" />;
    case "email": return <Mail className="w-4 h-4 text-orange-500" />;
    case "meeting": return <Users className="w-4 h-4 text-purple-500" />;
    default: return <Calendar className="w-4 h-4 text-gray-500" />;
  }
};

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  isLoading,
  onEdit,
  onDelete,
  onView,
}) => {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center border rounded-lg text-gray-500 dark:text-gray-400">
        <p className="text-sm">Không tìm thấy nhiệm vụ nào</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <Table className="min-w-full">
        <TableHeader className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <TableRow>
            <TableCell className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tiêu đề</TableCell>
            <TableCell className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Khách hàng</TableCell>
            <TableCell className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Hạn chót</TableCell>
            <TableCell className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Độ ưu tiên</TableCell>
            <TableCell className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Trạng thái</TableCell>
            <TableCell className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Người thực hiện</TableCell>
            <TableCell className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Thao tác</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
          {tasks.map((task) => {
            // FIX LOGIC HIỂN THỊ TÊN KHÁCH HÀNG:
            // Kiểm tra các trường hợp: customerName, hoặc nested object customer.customerName, hoặc customer.name
            const customerNameDisplay = 
                task.customerName || 
                (task as any).customer?.customerName || 
                (task as any).customer?.name || 
                "N/A";

            return (
            <TableRow key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <TableCell className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <TaskTypeIcon type={task.type} />
                  <span className="max-w-[200px] truncate font-medium text-gray-900 dark:text-white" title={task.title}>{task.title}</span>
                </div>
              </TableCell>
              
              {/* Hiển thị tên khách hàng đã xử lý */}
              <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                {customerNameDisplay}
              </TableCell>

              <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                {task.dueDate ? new Date(task.dueDate).toLocaleString("vi-VN") : "—"}
              </TableCell>
              <TableCell className="px-6 py-4">
                <Badge color={priorityColors[task.priority]}>
                  {task.priority === "high" ? "Cao" : task.priority === "medium" ? "Trung bình" : "Thấp"}
                </Badge>
              </TableCell>
              <TableCell className="px-6 py-4">
                <Badge color={statusColors[task.status]}>
                  {task.status === "pending" ? "Chờ xử lý" : task.status === "in_progress" ? "Đang thực hiện" : task.status === "completed" ? "Hoàn thành" : "Hủy"}
                </Badge>
              </TableCell>
              <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                {task.assignedToName || <span className="italic text-gray-400">Chưa phân công</span>}
              </TableCell>
              
              <TableCell className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  {onView && (
                    <button
                      onClick={() => onView(task)}
                      title="Xem chi tiết"
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => onEdit(task)}
                    title="Chỉnh sửa"
                    className="rounded p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => onDelete(task.id)}
                    title="Xóa"
                    className="rounded p-1.5 text-red-600 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
    </div>
  );
};

export default TaskTable;