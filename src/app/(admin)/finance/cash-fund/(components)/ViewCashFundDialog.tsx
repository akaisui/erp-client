"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { Can } from "@/components/auth/Can";
import {
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle,
  DollarSign,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  X
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import Badge from "@/components/ui/badge/Badge";
import { useCashFund, useCashFundDiscrepancies, useLockCashFund, useUnlockCashFund } from "@/hooks/api/useCashFund";

interface ViewCashFundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fundDate: string | null;
}

export function ViewCashFundDialog({
  isOpen,
  onClose,
  fundDate,
}: ViewCashFundDialogProps) {
  const { data: fundResponse, isLoading: isLoadingFund, refetch: refetchFund } = useCashFund(fundDate || "");
  const { data: discResponse, isLoading: isLoadingDisc, refetch: refetchDisc } = useCashFundDiscrepancies(fundDate || "");
  
  const lockCashFund = useLockCashFund();
  const unlockCashFund = useUnlockCashFund();

  const cashFund = fundResponse?.data;
  const discData = discResponse?.data;
  const receipts = discData?.receipts || [];
  const payments = discData?.payments || [];

  const isLoading = isLoadingFund || isLoadingDisc;

  const handleLock = async () => {
    if (!fundDate) return;
    if (confirm(`Khóa quỹ tiền mặt ngày ${format(new Date(fundDate), "dd/MM/yyyy")}?`)) {
        await lockCashFund.mutateAsync({ fundDate });
        refetchFund();
        refetchDisc();
    }
  };

  const handleUnlock = async () => {
    if (!fundDate) return;
    if (confirm(`Mở khóa quỹ tiền mặt ngày ${format(new Date(fundDate), "dd/MM/yyyy")}?`)) {
        await unlockCashFund.mutateAsync(fundDate);
        refetchFund();
        refetchDisc();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="!max-w-none w-[98vw] h-[95vh] flex flex-col p-0 overflow-hidden"
      showCloseButton={true}
    >
      {/* Header - Match UserDialog style */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Quỹ tiền mặt ngày {fundDate ? format(new Date(fundDate), "dd/MM/yyyy") : "---"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Chi tiết đối chiếu và quản lý quỹ tiền mặt hàng ngày</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mr-8">
          {cashFund && !cashFund.isLocked && (
            <Can permission="lock_cash_fund">
              <button onClick={handleLock} disabled={lockCashFund.isPending} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors border border-green-200">
                <Lock className="h-4 w-4" /> {lockCashFund.isPending ? "Đang khóa..." : "Khóa quỹ"}
              </button>
            </Can>
          )}

          {cashFund && cashFund.isLocked && (
            <Can permission="unlock_cash_fund">
              <button onClick={handleUnlock} disabled={unlockCashFund.isPending} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-md transition-colors border border-yellow-200">
                <Unlock className="h-4 w-4" /> {unlockCashFund.isPending ? "Đang mở..." : "Mở khóa"}
              </button>
            </Can>
          )}
          <button onClick={() => { refetchFund(); refetchDisc(); }} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
             <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
        {isLoading ? (
          <div className="flex flex-col h-full items-center justify-center text-gray-400 gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <p className="font-medium">Đang tải chi tiết quỹ...</p>
          </div>
        ) : !cashFund ? (
          <div className="flex h-full items-center justify-center text-gray-500 flex-col gap-2">
            <AlertCircle className="h-10 w-10 text-gray-300" />
            <span className="font-medium">Không tìm thấy dữ liệu quỹ tiền mặt.</span>
          </div>
        ) : (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Status & Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-8">
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Trạng thái quỹ</p>
                        <div className="mt-1">
                            {cashFund.isLocked ? (
                                <Badge color="green" className="font-bold">ĐÃ KHÓA</Badge>
                            ) : (
                                <Badge color="yellow" className="font-bold">CHƯA KHÓA</Badge>
                            )}
                        </div>
                    </div>
                    {cashFund.lockedAt && (
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Thời gian khóa</p>
                            <p className="text-sm font-bold text-gray-900 mt-1">{format(new Date(cashFund.lockedAt), "dd/MM/yyyy HH:mm")}</p>
                        </div>
                    )}
                </div>
                {cashFund.reconciler && (
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Người đối chiếu</p>
                        <p className="text-sm font-bold text-gray-900 mt-1">{cashFund.reconciler.fullName}</p>
                    </div>
                )}
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryBox label="Số dư đầu kỳ" value={cashFund.openingBalance} icon={DollarSign} color="text-blue-600" />
                <SummaryBox label="Tổng thu" value={cashFund.totalReceipts} icon={TrendingUp} color="text-green-600" />
                <SummaryBox label="Tổng chi" value={cashFund.totalPayments} icon={TrendingDown} color="text-red-600" />
                <SummaryBox label="Số dư cuối kỳ" value={cashFund.closingBalance} icon={DollarSign} color="text-indigo-600" isBig />
            </div>

            {/* Discrepancy Alert */}
            {discData?.hasDiscrepancy && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 flex items-center gap-4 shadow-sm">
                    <div className="bg-orange-100 p-2 rounded-full">
                        <AlertCircle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                        <p className="font-bold text-orange-900 text-base">Phát hiện sai lệch dữ liệu</p>
                        <p className="text-sm text-orange-800">Chênh lệch: <span className="font-bold">{formatCurrency(Math.abs(discData.discrepancy))}</span> {discData.discrepancy > 0 ? "(Dư tiền thực tế)" : "(Thiếu tiền thực tế)"}</p>
                    </div>
                </div>
            )}

            {/* Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Receipts */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" /> Phiếu thu phát sinh
                        </h2>
                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{receipts.length} PHIẾU</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                        {receipts.length > 0 ? (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-5 py-2.5 font-bold text-gray-500 uppercase text-[10px]">Mã phiếu</th>
                                        <th className="px-5 py-2.5 font-bold text-gray-500 uppercase text-[10px] text-right">Số tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {receipts.map((r: any) => (
                                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3 font-bold text-blue-600">{r.receiptCode}</td>
                                            <td className="px-5 py-3 text-right font-bold text-green-600">+{formatCurrency(r.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-12 text-center">
                                <Package className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                                <p className="text-gray-400 text-sm font-medium">Không có phiếu thu phát sinh</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payments */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-600" /> Phiếu chi phát sinh
                        </h2>
                        <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{payments.length} PHIẾU</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                        {payments.length > 0 ? (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-5 py-2.5 font-bold text-gray-500 uppercase text-[10px]">Mã phiếu</th>
                                        <th className="px-5 py-2.5 font-bold text-gray-500 uppercase text-[10px] text-right">Số tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {payments.map((p: any) => (
                                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3 font-bold text-orange-600">{p.voucherCode}</td>
                                            <td className="px-5 py-3 text-right font-bold text-red-600">-{formatCurrency(p.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-12 text-center">
                                <Package className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                                <p className="text-gray-400 text-sm font-medium">Không có phiếu chi phát sinh</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Notes */}
            {cashFund.notes && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Ghi chú nội bộ</h2>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">{cashFund.notes}</p>
                </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - Match UserDialog style */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
              Đóng
          </button>
      </div>
    </Modal>
  );
}

function SummaryBox({ label, value, icon: Icon, color, bg, isBig = false }: any) {
    return (
        <div className={`rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-center bg-white hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
                <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`font-bold tracking-tight ${color} ${isBig ? 'text-xl' : 'text-lg'}`}>
                {formatCurrency(value)}
            </p>
        </div>
    );
}
