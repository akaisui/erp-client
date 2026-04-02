import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { Download, X } from "lucide-react";
import { User } from "@/types";

interface UserExportPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onConfirm: () => void;
}

export function UserExportPreviewDialog({
  isOpen,
  onClose,
  users,
  onConfirm,
}: UserExportPreviewDialogProps) {
  const getStatusText = (status: string) => {
    const labels: Record<string, string> = {
      active: "Hoạt động",
      inactive: "Ngưng hoạt động",
      locked: "Bị khóa",
    };
    return labels[status] || status;
  };

  const getGenderText = (gender?: string) => {
    const labels: Record<string, string> = {
      male: "Nam",
      female: "Nữ",
      other: "Khác",
    };
    return labels[gender || ""] || "—";
  };

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
            Tổng số bản ghi: <span className="font-semibold text-blue-600">{users.length}</span>
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
                    Mã NV
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-900">
                    Họ Tên
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-900">
                    Email
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-900">
                    SĐT
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-900">
                    Giới tính
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-900">
                    Vai trò
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-900">
                    Kho
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-900">
                    Địa chỉ
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-900">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {user.employeeCode}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {user.fullName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {user.phone || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {getGenderText(user.gender)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {user.role?.roleName || "—"}
                    </td>
                     <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {user.warehouse?.warehouseName || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate" title={user.address}>
                      {user.address || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          user.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                            : user.status === "inactive"
                            ? "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                        }`}
                      >
                        {getStatusText(user.status)}
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
