
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { Download, X } from "lucide-react";
import { CashFund } from "@/types/finance.types";
import { format } from "date-fns";


interface CashFundExportPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cashFunds: CashFund[];
  onConfirm: () => void;
}

export function CashFundExportPreviewDialog({
  isOpen,
  onClose,
  cashFunds,
  onConfirm,
}: CashFundExportPreviewDialogProps) {

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="!max-w-none w-[95vw] h-[90vh] flex flex-col"
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Xem trước dữ liệu xuất Excel
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tổng số bản ghi: <span className="font-semibold text-blue-600">{cashFunds.length}</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden p-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="h-full flex flex-col rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm">
          <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 relative">
              <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-900">
                    Ngày
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-900">
                    Tồn đầu kỳ
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-900">
                    Tổng thu
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-900">
                    Tổng chi
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-900">
                    Tồn cuối kỳ
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-900">
                    Thực tế
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-900">
                    Chênh lệch
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-900">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {cashFunds.map((cashFund) => (
                  <tr key={cashFund.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {format(new Date(cashFund.fundDate), "dd/MM/yyyy")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {cashFund.openingBalance}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-green-600 dark:text-green-500">
                      +{cashFund.totalReceipts}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-red-600 dark:text-red-500">
                      -{cashFund.totalPayments}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      {cashFund.closingBalance}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {cashFund.actualBalance ? cashFund.actualBalance : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {cashFund.discrepancy ? cashFund.discrepancy : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          cashFund.isLocked
                            ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                            : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                        }`}
                      >
                        {cashFund.isLocked ? "Đã khóa" : "Mở"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-900">
        <Button variant="outline" onClick={onClose}>
          Hủy bỏ
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          <Download className="mr-2 h-4 w-4" />
          Xác nhận xuất Excel
        </Button>
      </div>
    </Modal>
  );
}
