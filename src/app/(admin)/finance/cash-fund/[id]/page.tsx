"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { Can } from "@/components/auth/Can";
import {
  ArrowLeft,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import Badge from "@/components/ui/badge/Badge";

interface CashFund {
  id: number;
  fundDate: string;
  openingBalance: number;
  closingBalance: number;
  totalReceipts: number;
  totalPayments: number;
  isLocked: boolean;
  lockedAt?: string;
  approver?: { id: number; fullName: string; employeeCode: string };
  reconciler?: { id: number; fullName: string; employeeCode: string };
  notes?: string;
}

interface Receipt {
  id: number;
  receiptCode: string;
  amount: number;
  receiptDate: string;
  isPosted: boolean;
}

interface Payment {
  id: number;
  voucherCode: string;
  amount: number;
  paymentDate: string;
  isPosted: boolean;
}

export default function CashFundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fundDate = params.id as string;

  const [cashFund, setCashFund] = useState<CashFund | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    // TODO: Fetch cash fund details
    console.log("Fetch cash fund for date:", fundDate);
    setIsLoading(false);
  }, [fundDate]);

  const handleLock = () => {
    // TODO: Call lock API
    console.log("Lock fund");
  };

  const handleUnlock = () => {
    // TODO: Call unlock API
    console.log("Unlock fund");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          <span className="text-gray-600 dark:text-gray-400">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!cashFund) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <h3 className="font-semibold text-red-900 dark:text-red-300">Không tìm thấy quỹ tiền mặt</h3>
        <p className="mt-1 text-sm text-red-800 dark:text-red-400">Quỹ tiền mặt cho ngày này không tồn tại</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>
    );
  }

  const netChange = cashFund.totalReceipts - cashFund.totalPayments;
  const discrepancy = cashFund.closingBalance - (cashFund.openingBalance + netChange);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Quỹ tiền mặt ngày {format(new Date(cashFund.fundDate), "dd/MM/yyyy")}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Chi tiết đối chiếu quỹ tiền mặt</p>
          </div>
        </div>

        <div className="flex gap-2">
          {!cashFund.isLocked && (
            <Can permission="lock_cash_fund">
              <Button variant="success" size="sm" onClick={handleLock} icon={<Lock className="h-4 w-4" />}>
                Khóa quỹ
              </Button>
            </Can>
          )}

          {cashFund.isLocked && (
            <Can permission="unlock_cash_fund">
              <Button variant="warning" size="sm" onClick={handleUnlock} icon={<Unlock className="h-4 w-4" />}>
                Mở khóa
              </Button>
            </Can>
          )}
        </div>
      </div>

      {/* Status Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Trạng thái quỹ</p>
            <div className="mt-2 flex items-center gap-2">
              {cashFund.isLocked ? (
                <Badge color="green" className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Đã khóa
                </Badge>
              ) : (
                <Badge color="yellow" className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Chưa khóa
                </Badge>
              )}
            </div>
          </div>

          {cashFund.isLocked && (
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Khóa lúc</p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                {cashFund.lockedAt ? format(new Date(cashFund.lockedAt), "dd/MM/yyyy HH:mm") : "—"}
              </p>
            </div>
          )}

          {cashFund.reconciler && (
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Người đối chiếu</p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">{cashFund.reconciler.fullName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Financial Summary */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Số dư đầu kỳ</p>
              <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(cashFund.openingBalance)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-300" />
          </div>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tổng thu</p>
              <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(cashFund.totalReceipts)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-300" />
          </div>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tổng chi</p>
              <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(cashFund.totalPayments)}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-300" />
          </div>
        </div>

        <div className={`rounded-lg border p-6 ${
          discrepancy === 0
            ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20"
            : "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-900/20"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Số dư cuối kỳ</p>
              <p className={`mt-2 text-2xl font-bold ${
                discrepancy === 0 ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"
              }`}>
                {formatCurrency(cashFund.closingBalance)}
              </p>
            </div>
            <DollarSign className={`h-8 w-8 ${
              discrepancy === 0 ? "text-green-300" : "text-orange-300"
            }`} />
          </div>
        </div>
      </div>

      {/* Discrepancy Alert */}
      {discrepancy !== 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-900/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="font-semibold text-orange-900 dark:text-orange-300">Phát hiện sai lệch</p>
              <p className="mt-1 text-sm text-orange-800 dark:text-orange-400">
                Sai lệch: {formatCurrency(Math.abs(discrepancy))} {discrepancy > 0 ? "(Thừa)" : "(Thiếu)"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Receipts Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Phiếu thu</h2>
        <div className="mt-4 space-y-3">
          {receipts && receipts.length > 0 ? (
            receipts.map((receipt) => (
              <div key={receipt.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{receipt.receiptCode}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(receipt.receiptDate), "dd/MM/yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(receipt.amount)}</p>
                  {receipt.isPosted && (
                    <Badge color="green" className="mt-1 text-xs">
                      Đã ghi sổ
                    </Badge>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">Không có phiếu thu</p>
          )}
        </div>
      </div>

      {/* Payments Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Phiếu chi</h2>
        <div className="mt-4 space-y-3">
          {payments && payments.length > 0 ? (
            payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{payment.voucherCode}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(payment.paymentDate), "dd/MM/yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(payment.amount)}</p>
                  {payment.isPosted && (
                    <Badge color="green" className="mt-1 text-xs">
                      Đã ghi sổ
                    </Badge>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">Không có phiếu chi</p>
          )}
        </div>
      </div>

      {/* Notes */}
      {cashFund.notes && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ghi chú</h2>
          <p className="mt-3 text-gray-700 dark:text-gray-300">{cashFund.notes}</p>
        </div>
      )}
    </div>
  );
}
