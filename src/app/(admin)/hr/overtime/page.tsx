'use client';

import React, { useState } from "react";
import Link from 'next/link';
import { format } from 'date-fns';
import { Eye, Plus, Search, RotateCcw, X, Users, Clock, CheckCircle } from 'lucide-react';

import { useOvertimeSessions, useOvertimeStats, OvertimeSession } from '@/hooks/api/useOvertimeApi';
import { useDebounce } from "@/hooks";

import { CreateSessionDialog } from '@/components/overtime/CreateSessionDialog';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import Pagination from "@/components/tables/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { GradientCard, FinancialCard, ProgressCard } from "@/components/ui/card/StatCards";

export default function OvertimePage() {
  // Filters State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch Data
  const { data, isLoading } = useOvertimeSessions({
    page,
    limit,
    search: debouncedSearch,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { data: statsData } = useOvertimeStats();

  const sessions = data?.data as OvertimeSession[] || [];
  const meta = data?.meta;

  // Handle Page Change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setLimit(20);
    setPage(1);
  };

  const hasActiveFilters = searchTerm || statusFilter !== "all";

  const getStatusLabel = (status: string) => {
      switch (status) {
          case 'open': return 'Đang mở';
          case 'closed': return 'Đã đóng';
          case 'cancelled': return 'Đã hủy';
          default: return status;
      }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý tăng ca
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
             Theo dõi và quản lý các phiên làm việc ngoài giờ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CreateSessionDialog onSuccess={() => setPage(1)} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Sessions */}
        <GradientCard
          title="Tổng phiên"
          value={statsData?.total || 0}
          icon={Users}
          color="blue"
        />

        {/* Open Sessions */}
        <ProgressCard
          title="Đang mở"
          value={statsData?.open || 0}
          subValue={`${statsData?.total || 0}`}
          color="green"
          trend={statsData?.total ? Math.round((statsData?.open / statsData?.total) * 100) : 0}
          description="Phiên đang hoạt động"
        />

         {/* Closed Sessions */}
         <FinancialCard
            title="Đã đóng"
            value={statsData?.closed || 0}
            icon={CheckCircle}
            color="purple"
            description="Phiên đã hoàn thành"
         />

        {/* Total Hours */}
        <GradientCard
            title="Tổng giờ tăng ca"
            value={statsData?.totalHours ? `${statsData.totalHours}h` : "0h"}
            icon={Clock}
            color="orange"
        />
      </div>


      {/* Main Content Card (Filters & Table) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
         {/* Search */}
         <div className="lg:col-span-2">
           <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
             Tìm kiếm
           </label>
           <div className="relative">
             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
               <Search className="h-5 w-5 text-gray-400" />
             </div>
             <input
               type="text"
               placeholder="Tìm phiên, người tạo..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
             />
           </div>
         </div>

         {/* Status Filter */}
         <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
             Trạng thái
           </label>
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
                <option value="all">Tất cả trạng thái</option>
                <option value="open">Đang mở</option>
                <option value="closed">Đã đóng</option>
                <option value="cancelled">Đã hủy</option>
            </select>
         </div>

         {/* Limit Selector */}
         <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
             Hiển thị
           </label>
             <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
            </select>
         </div>
      </div>

       {/* Active Filters Display */}
       {hasActiveFilters && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center gap-2">
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

            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                Trạng thái: {getStatusLabel(statusFilter)}
                <button
                  onClick={() => setStatusFilter("all")}
                  className="hover:text-amber-900 dark:hover:text-amber-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RotateCcw className="h-3 w-3" />
              Xóa tất cả
            </button>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="overflow-x-auto">
                <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-900">
                    <TableRow>
                    <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Tên phiên</TableCell>
                    <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Thời gian bắt đầu</TableCell>
                    <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Trạng thái</TableCell>
                    <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Ghi chú</TableCell>
                    <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Người tạo</TableCell>
                    <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Nhân sự</TableCell>
                    <TableCell isHeader className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Hành động</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                    {isLoading ? (
                        // Loading State
                        Array.from({ length: 5 }).map((_, idx) => (
                             <TableRow key={idx}>
                                <TableCell className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell className="px-6 py-4"><div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell className="px-6 py-4"><div className="h-4 w-10 bg-gray-200 rounded animate-pulse"></div></TableCell>
                                <TableCell className="px-6 py-4"><div className="h-8 w-8 bg-gray-200 rounded animate-pulse ml-auto"></div></TableCell>
                             </TableRow>
                        ))
                    ) : sessions.length > 0 ? (
                        sessions.map((session) => (
                        <TableRow key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <TableCell className="px-6 py-4 font-medium text-gray-900 dark:text-white">{session.sessionName}</TableCell>
                            <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {format(new Date(session.startTime), 'dd/MM/yyyy HH:mm')}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-sm">
                            <Badge
                                color={
                                session.status === 'open'
                                    ? 'green'
                                    : session.status === 'closed'
                                    ? 'gray'
                                    : 'red'
                                }
                            >
                                {getStatusLabel(session.status)}
                            </Badge>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-[200px] truncate" title={session.notes}>{session.notes || '-'}</TableCell>
                            <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{session.creator?.fullName}</TableCell>
                            <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {session._count?.entries || 0} nhân viên
                            </TableCell>
                            <TableCell className="px-6 py-4 text-right text-sm">
                            <Link href={`/hr/overtime/${session.id}`}>
                                <Button variant="ghost" size="smm">
                                    <Eye className="h-4 w-4 text-gray-500" />
                                </Button>
                            </Link>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} className="px-6 py-4 text-center h-32 text-gray-500">
                                <div className="flex flex-col items-center justify-center">
                                    <Search className="h-8 w-8 text-gray-300 mb-2" />
                                    <p>Không tìm thấy phiên tăng ca nào.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
      </div>

        {/* Pagination */}
        {meta && meta.total > 0 && (
             <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Hiển thị <span className="font-medium text-gray-900 dark:text-white">{(page - 1) * limit + 1}-{Math.min(page * limit, meta.total)}</span> của <span className="font-medium text-gray-900 dark:text-white">{meta.total}</span>
                </div>
                 <Pagination
                    currentPage={page}
                    totalPages={meta.totalPages}
                    onPageChange={handlePageChange}
                />
             </div>
        )}
    </div>
  );
}
