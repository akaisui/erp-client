"use client";

import React from "react";
import { format } from "date-fns";
import { Mail, User, ArrowRight, MapPin, Eye } from "lucide-react";
import Link from "next/link";
import { useDebtReconciliationStore } from "@/stores/debtReconciliationStore";
import type { DebtListItem } from "@/types/debt-reconciliation.types";
import { formatCurrency } from "@/lib/utils";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell
} from "@/components/ui/table";

interface Props {
  data: DebtListItem[];
  isLoading: boolean;
  onView: (id: number | string, type: DebtType, year: string) => void;
}

export default function DebtReconciliationTable({ data, isLoading, onView }: Props) {
  const { openEmailModal } = useDebtReconciliationStore();

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col items-center gap-2 animate-pulse text-gray-500">
          <div className="h-5 w-5 bg-gray-300 rounded-full animate-bounce"></div>
          <span>Đang tải danh sách công nợ...</span>
        </div>
      </div>
    );
  }

  // 2. Empty State
  if (!data || data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        <div className="flex flex-col items-center gap-1">
          <span>📭 Không tìm thấy hồ sơ công nợ nào.</span>
          <span className="text-xs text-gray-400">Thử thay đổi bộ lọc hoặc tạo mới.</span>
        </div>
      </div>
    );
  }

  // 3. Main Table
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-700/80 text-[11px] uppercase tracking-wider">
            <TableRow>
              {/* --- CỘT THÔNG TIN --- */}
              <TableCell isHeader className="w-[220px] px-4 py-3 font-bold text-gray-700">
                Đối tượng
              </TableCell>

              {/* ✅ CỘT MỚI: KHU VỰC */}
              <TableCell isHeader className="w-[140px] px-4 py-3 font-bold text-gray-600">
                Khu vực
              </TableCell>

              <TableCell isHeader className="w-[100px] px-4 py-3 font-bold text-gray-600">
                Phụ trách
              </TableCell>

              <TableCell isHeader className="w-[50px] px-2 py-3 text-center font-bold text-gray-600">
                Năm
              </TableCell>

              {/* --- CỘT SỐ LIỆU TÀI CHÍNH --- */}
              <TableCell isHeader className="px-2 py-3 text-right font-bold text-gray-500">
                Đầu kỳ
              </TableCell>

              <TableCell isHeader className="px-2 py-3 text-right font-bold text-blue-600">
                Mua hàng (+)
              </TableCell>

              {/* ✅ CỘT MỚI: TRẢ HÀNG */}
              <TableCell isHeader className="px-2 py-3 text-right font-bold text-indigo-600">
                Trả hàng (-)
              </TableCell>

              {/* ✅ CỘT MỚI: ĐIỀU CHỈNH */}
              <TableCell isHeader className="px-2 py-3 text-right font-bold text-purple-600">
                Điều chỉnh
              </TableCell>

              <TableCell isHeader className="px-2 py-3 text-right font-bold text-green-600">
                Thanh toán (-)
              </TableCell>

              {/* CỘT QUAN TRỌNG: NỢ CẦN THU */}
              <TableCell isHeader className="px-4 py-3 text-right font-bold text-red-600 bg-red-50/50 border-l border-red-100 dark:bg-red-900/10 dark:border-red-900/30">
                Nợ cuối kỳ
              </TableCell>

              <TableCell isHeader className="px-2 py-3 text-center font-bold text-gray-600">
                Trạng thái lỗ
              </TableCell>

              {/* --- CỘT THAO TÁC --- */}
              <TableCell isHeader className="px-4 py-3 text-center font-bold text-gray-600">
                Thao tác
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => {
              // 1. Chuẩn bị dữ liệu hiển thị
              const {
                name, code, type, objId, periodName,
                assignedUser, updatedAt, id, location
              } = item;

              const isCustomer = type === 'customer';
              const typeLabel = isCustomer ? "KH" : "NCC";
              const typeColor = isCustomer
                ? "text-blue-600 bg-blue-50 border-blue-100"
                : "text-orange-600 bg-orange-50 border-orange-100";

              const detailLink = `/finance/debt-reconciliation/${objId}?type=${type}&year=${periodName}`;

              // 2. Map số liệu tài chính
              const opening = Number(item.openingBalance) || 0;
              const increase = Number(item.increasingAmount) || 0;
              const returnAmt = Number(item.returnAmount) || 0;     // ✅ Lấy từ DB
              const adjustment = Number(item.adjustmentAmount) || 0; // ✅ Lấy từ DB
              const payment = Number(item.decreasingAmount) || 0;
              const closing = Number(item.closingBalance) || 0;

              return (
                <TableRow key={`${type}-${objId}`} className="group border-t border-gray-100 hover:bg-gray-50/80 dark:border-gray-700/50 dark:hover:bg-gray-800/50 transition-colors">

                  {/* Cột 1: Thông tin (Name + Code) */}
                  <TableCell className="px-4 py-3 align-top">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${typeColor}`}>
                        {typeLabel}
                      </span>
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate max-w-[160px]" title={name}>
                        {name}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 font-mono ml-9">{code}</div>
                  </TableCell>

                  {/* ✅ Cột 2: Khu vực (Mới) */}
                  <TableCell className="px-4 py-3 align-top">
                    {location ? (
                      <div className="flex items-start gap-1 text-xs text-gray-600">
                        <MapPin className="w-3 h-3 mt-0.5 text-gray-400 shrink-0" />
                        <span className="line-clamp-2" title={location}>{location}</span>
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs">-</span>
                    )}
                  </TableCell>

                  {/* Cột 3: Phụ trách */}
                  <TableCell className="px-4 py-3 align-top">
                    <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                      {assignedUser ? (
                        <>
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="truncate max-w-[80px]" title={assignedUser.fullName}>
                            {assignedUser.fullName}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-300 italic pl-1">-</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Cột 4: Năm */}
                  <TableCell className="px-2 py-3 text-center align-top">
                    <span className="text-[11px] font-mono text-gray-500">
                      {periodName}
                    </span>
                  </TableCell>

                  {/* --- SỐ LIỆU (Font Mono) --- */}

                  {/* Đầu kỳ */}
                  <TableCell className="px-2 py-3 text-right align-top text-gray-600 font-medium text-xs font-mono">
                    {opening !== 0 ? formatCurrency(opening) : <span className="text-gray-300">-</span>}
                  </TableCell>

                  {/* Mua hàng */}
                  <TableCell className="px-2 py-3 text-right align-top text-blue-600 font-bold text-xs font-mono">
                    {increase > 0 ? `+${formatCurrency(increase)}` : <span className="text-gray-300">-</span>}
                  </TableCell>

                  {/* ✅ Trả hàng */}
                  <TableCell className="px-2 py-3 text-right align-top text-indigo-600 font-medium font-mono text-xs">
                    {returnAmt > 0 ? `-${formatCurrency(returnAmt)}` : <span className="text-gray-300">-</span>}
                  </TableCell>

                  {/* ✅ Điều chỉnh */}
                  <TableCell className="px-2 py-3 text-right align-top text-purple-600 font-medium font-mono text-xs">
                    {adjustment !== 0 ? formatCurrency(adjustment) : <span className="text-gray-300">-</span>}
                  </TableCell>

                  {/* Thanh toán */}
                  <TableCell className="px-2 py-3 text-right align-top text-green-600 font-medium font-mono text-xs">
                    {payment > 0 ? `-${formatCurrency(payment)}` : <span className="text-gray-300">-</span>}
                  </TableCell>

                  {/* SỐ DƯ CUỐI */}
                  <TableCell className="px-4 py-3 text-right align-top bg-red-50/30 dark:bg-red-900/5 border-l border-red-50 dark:border-red-900/20">
                    <span className={`text-sm font-bold font-mono ${closing > 1000 ? 'text-red-600' : 'text-gray-400'}`}>
                      {formatCurrency(closing)}
                    </span>
                  </TableCell>

                  <TableCell className="px-2 py-3 text-center align-middle">
                    {closing > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                        LỖ
                      </span>
                    )}
                    {/* Nếu closing <= 0 thì không hiện gì (hoặc hiện 'Đủ' nếu muốn) */}
                  </TableCell>

                  {/* Thao tác */}
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(objId, type, periodName)}
                        className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => {
                            // openEmailModal({ id: objId, type: type, name: name, email: '' });
                          }}
                          className="rounded p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Gửi Email Đối chiếu"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </TableCell>

                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}