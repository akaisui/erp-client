
import React, { useState } from "react";
import { Ticket, TicketPriority, TicketStatus } from "@/types/crm.types";
import { 
    Table, 
    TableHeader, 
    TableBody, 
    TableRow, 
    TableCell 
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { Eye, Edit2, Trash2, MoreVertical } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import Divider from "@/components/ui/Divider";
import Link from "next/link";
import { Can } from "@/components/auth";

interface TicketTableProps {
  tickets: Ticket[];
  isLoading: boolean;
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: number) => void;
  onView?: (ticket: Ticket) => void;
}

const statusColors: Record<TicketStatus | "pending", "default" | "brand" | "green" | "red" | "yellow" | "gray"> = {
  open: "brand",
  in_progress: "yellow",
  resolved: "green",
  closed: "gray",
  pending: "default",
};

const priorityColors: Record<TicketPriority, "default" | "brand" | "green" | "red" | "yellow" | "gray"> = {
  low: "gray",
  medium: "brand",
  high: "yellow",
  urgent: "red",
};

export const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  isLoading,
  onEdit,
  onDelete,
  onView
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  if (isLoading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        </div>
      );
  }

  if (!tickets || tickets.length === 0) {
      return (
        <div className="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400 border rounded-lg">
          <p className="text-sm">Không tìm thấy phiếu hỗ trợ nào</p>
        </div>
      );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <Table className="min-w-full">
        <TableHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <TableRow>
            <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Mã phiếu</TableCell>
            <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tiêu đề</TableCell>
            <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Khách hàng</TableCell>
            <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Độ ưu tiên</TableCell>
            <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Trạng thái</TableCell>
            <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ngày tạo</TableCell>
            <TableCell isHeader className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Thao tác</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
          {tickets.map((ticket) => (
            <TableRow key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <TableCell className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                {ticket.code}
              </TableCell>
              <TableCell className="px-6 py-4">
                <div className="max-w-xs truncate text-sm font-medium text-gray-900 dark:text-white" title={ticket.title}>{ticket.title}</div>
              </TableCell>
              <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                {ticket.customerName || "N/A"}
              </TableCell>
              <TableCell className="px-6 py-4">
                 <Badge color={priorityColors[ticket.priority] as any}>
                  {ticket.priority === 'urgent' ? 'Khẩn cấp' : ticket.priority === 'high' ? 'Cao' : ticket.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                </Badge>
              </TableCell>
              <TableCell className="px-6 py-4">
                <Badge color={statusColors[ticket.status] as any}>
                  {ticket.status === 'open' ? 'Mới' : ticket.status === 'in_progress' ? 'Đang xử lý' : ticket.status === 'resolved' ? 'Đã giải quyết' : 'Đóng'}
                </Badge>
              </TableCell>
              <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                {new Date(ticket.createdAt).toLocaleDateString("vi-VN")}
              </TableCell>
              <TableCell className="px-6 py-4 text-right">
                <div className="relative flex items-center justify-end gap-1">
                    {/* Quick View Link */}
                    {onView && (
                        <Button 
                            variant="ghost" 
                            size="sss" 
                            onClick={() => onView(ticket)}
                            title="Xem chi tiết"
                        >
                            <Eye className="w-4 h-4" />
                        </Button>
                    )}

                    {/* Dropdown Menu */}
                    <div className="relative">
                      <Button
                        onClick={() =>
                          setOpenDropdownId(
                            openDropdownId === ticket.id ? null : ticket.id
                          )
                        }
                        variant="ghost"
                        size="sss"
                        className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        title="Thao tác khác"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>

                      <Dropdown
                        isOpen={openDropdownId === ticket.id}
                        onClose={() => setOpenDropdownId(null)}
                        className="w-48 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-50 right-0 mr-8"
                      >
                        {/* Xem chi tiết */}
                        {onView && (
                            <DropdownItem
                              onClick={() => {
                                onView(ticket);
                                setOpenDropdownId(null);
                              }}
                              className="text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                <span>Xem chi tiết</span>
                              </div>
                            </DropdownItem>
                        )}

                        {/* Chỉnh sửa */}
                        <DropdownItem
                          onClick={() => {
                            onEdit(ticket);
                            setOpenDropdownId(null);
                          }}
                          className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        >
                          <div className="flex items-center gap-2">
                            <Edit2 className="h-4 w-4" />
                            <span>Chỉnh sửa</span>
                          </div>
                        </DropdownItem>

                        <Divider orientation="horizontal" className="my-1" />

                        {/* Xóa */}
                        <DropdownItem
                          onClick={() => {
                            onDelete(ticket.id);
                            setOpenDropdownId(null);
                          }}
                          className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <div className="flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            <span>Xóa</span>
                          </div>
                        </DropdownItem>
                      </Dropdown>
                    </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TicketTable;
