"use client";

import React, { useState, useEffect } from "react";
import { Plus, SearchIcon, X, Download, RotateCcw, Ticket as TicketIcon, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/button/Button";
import TicketTable from "@/components/crm/TicketTable";
import TicketDialog from "@/components/crm/TicketDialog";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import ExcelPreviewDialog from "@/components/ui/modal/ExcelPreviewDialog";
import { GradientCard } from "@/components/ui/card/StatCards";
import { useTickets, useCreateTicket, useUpdateTicket, useDeleteTicket } from "@/hooks/api/useCrm";
import { Ticket, TicketStatus, TicketPriority } from "@/types/crm.types";
import toast from "react-hot-toast";
import { useDebounce } from "@/hooks";
import Pagination from "@/components/tables/Pagination";
import * as XLSX from "xlsx";

export default function TicketPage() {
  // State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingTicketId, setDeletingTicketId] = useState<number | null>(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "all">("all");

  // Excel Preview
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false);
  const [exportPreviewData, setExportPreviewData] = useState<any[]>([]);

  // API Hooks
  const { data: ticketData, isLoading } = useTickets({
    page,
    limit,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(priorityFilter !== "all" && { priority: priorityFilter }),
  });
  console.log(ticketData)

  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();

  const tickets = ticketData?.data || [];
  const meta = (ticketData as any)?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, priorityFilter]);

  // Actions
  const handleOpenCreate = () => {
    setSelectedTicket(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (id: number) => {
    setDeletingTicketId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (selectedTicket) {
        await updateTicket.mutateAsync({ id: selectedTicket.id, data: formData });
        toast.success("Cập nhật phiếu hỗ trợ thành công");
      } else {
        await createTicket.mutateAsync(formData);
        toast.success("Tạo phiếu hỗ trợ thành công");
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
      console.error(error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTicketId) return;
    try {
      await deleteTicket.mutateAsync(deletingTicketId);
      toast.success("Xóa phiếu hỗ trợ thành công");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Lỗi khi xóa phiếu hỗ trợ");
      console.error(error);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  // Export Excel Logic
  const getFormattedExportData = () => {
    return tickets.map((ticket: Ticket) => ({
      "Mã phiếu": ticket.code,
      "Tiêu đề": ticket.title,
      "Khách hàng": ticket.customerName,
      "Trạng thái": 
        ticket.status === 'open' ? 'Mới' : 
        ticket.status === 'in_progress' ? 'Đang xử lý' : 
        ticket.status === 'resolved' ? 'Đã giải quyết' : 'Đóng',
      "Độ ưu tiên": 
        ticket.priority === 'urgent' ? 'Khẩn cấp' : 
        ticket.priority === 'high' ? 'Cao' : 
        ticket.priority === 'medium' ? 'Trung bình' : 'Thấp',
      "Ngày tạo": new Date(ticket.createdAt).toLocaleDateString("vi-VN"),
      "Mô tả": ticket.description || "",
    }));
  };

  const handleExportClick = () => {
    const data = getFormattedExportData();
    setExportPreviewData(data);
    setIsExportPreviewOpen(true);
  };

  const handleConfirmExport = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(exportPreviewData);
      const columnWidths = [
          { wch: 15 }, // Mã
          { wch: 40 }, // Tiêu đề
          { wch: 25 }, // Khách hàng
          { wch: 15 }, // Trạng thái
          { wch: 15 }, // Ưu tiên
          { wch: 15 }, // Ngày tạo
          { wch: 50 }, // Mô tả
      ];
      worksheet["!cols"] = columnWidths;
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
      const fileName = `tickets_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success("Xuất danh sách thành công!");
      setIsExportPreviewOpen(false);
    } catch (error) {
      toast.error("Lỗi khi xuất file");
      console.error(error);
    }
  };

  const hasActiveFilters = searchTerm || statusFilter !== "all" || priorityFilter !== "all";

  // Calculate stats (simple mock derivation if API doesn't provide them yet, 
  // or better: just show total from meta and some placeholders/derived if avail)
  // Ideally, backend brings 'cards' stats. For now we use what we have or generic counts.
  // Since we don't have separate stats API call here yet, we will just use placeholders 
  // or simple counts if efficient. Let's trust the design requested Stats Cards.
  // We'll show "Total" from meta.total. Others might be 0 or N/A until backend update.
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Phiếu Hỗ Trợ
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý và theo dõi yêu cầu hỗ trợ từ khách hàng
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="ssmm"
            onClick={handleExportClick}
            disabled={tickets.length === 0}
          >
            <Download className="mr-2 h-5 w-5" />
            Xuất Excel
          </Button>
          <Button 
            variant="primary" 
            size="ssmm"
            onClick={handleOpenCreate}
          >
            <Plus className="mr-2 h-5 w-5" />
            Tạo phiếu mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
         <GradientCard
            title="Tổng phiếu hỗ trợ"
            value={meta.total || 0}
            icon={TicketIcon}
            color="blue"
          />
          <GradientCard
            title="Đang xử lý"
            value={tickets.filter((t: Ticket) => t.status === 'in_progress').length} // Client-side calc for demo page
            icon={Clock}
            color="orange"
             // Note: real app should fetch from API stats
            trend={0} 
          />
          <GradientCard
            title="Đã giải quyết"
            value={tickets.filter((t: Ticket) => t.status === 'resolved').length}
            icon={CheckCircle}
            color="green"
            trend={0}
          />
           <GradientCard
            title="Khẩn cấp"
            value={tickets.filter((t: Ticket) => t.priority === 'urgent').length}
            icon={AlertTriangle}
            color="red"
            trend={0}
          />
      </div>

      <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm phiếu hỗ trợ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
          />
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Status Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TicketStatus | "all")}
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả</option>
              <option value="open">Mới</option>
              <option value="in_progress">Đang xử lý</option>
              <option value="resolved">Đã giải quyết</option>
              <option value="closed">Đóng</option>
            </select>
          </div>

          {/* Priority Filter */}
           <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Độ ưu tiên
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | "all")}
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả</option>
              <option value="urgent">Khẩn cấp</option>
              <option value="high">Cao</option>
              <option value="medium">Trung bình</option>
              <option value="low">Thấp</option>
            </select>
          </div>

           {/* Limit */}
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
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
           <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bộ lọc:</span>
            
            {searchTerm && (
               <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                 🔍 "{searchTerm}"
                 <button onClick={() => setSearchTerm("")} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
               </span>
            )}
            
            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                Trạng thái: {statusFilter}
                <button onClick={() => setStatusFilter("all")} className="hover:text-yellow-900"><X className="h-3 w-3" /></button>
              </span>
            )}

            {priorityFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                Độ ưu tiên: {priorityFilter}
                <button onClick={() => setPriorityFilter("all")} className="hover:text-red-900"><X className="h-3 w-3" /></button>
              </span>
            )}

            <Button variant="outline" size="sss" onClick={handleResetFilters}>
              <RotateCcw className="h-4 w-4 mr-1" /> Xóa bộ lọc
            </Button>
           </div>
        )}
      </div>

      {/* Table */}
       <div className="rounded-xl border border-gray-200 bg-white p-0 shadow-sm dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
        <TicketTable 
            tickets={tickets} 
            isLoading={isLoading} 
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete} 
        />
        
        {/* Pagination */}
        {meta.total > 0 && (
           <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
             <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Hiển thị <span className="font-medium">{(page - 1) * limit + 1}</span> đến <span className="font-medium">{Math.min(page * limit, meta.total)}</span> trong tổng số <span className="font-medium">{meta.total}</span>
                </div>
                {meta.totalPages > 1 && (
                  <Pagination 
                    currentPage={page}
                    totalPages={meta.totalPages}
                    onPageChange={setPage}
                  />
                )}
             </div>
           </div>
        )}
      </div>

      {/* Dialogs */}
      <TicketDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedTicket}
        isSubmitting={createTicket.isPending || updateTicket.isPending}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa phiếu hỗ trợ"
        message="Bạn có chắc chắn muốn xóa phiếu hỗ trợ này không? Hành động này không thể hoàn tác."
        variant="danger"
        isLoading={deleteTicket.isPending}
      />

      <ExcelPreviewDialog
        isOpen={isExportPreviewOpen}
        onClose={() => setIsExportPreviewOpen(false)}
        onExport={handleConfirmExport}
        data={exportPreviewData}
        fileName={`tickets_${new Date().toISOString().split("T")[0]}.xlsx`}
      />
    </div>
  );
}
