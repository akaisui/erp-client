import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import { Modal } from "@/components/ui/modal";
import { overtimeApi } from "@/hooks/api/useOvertimeApi";
import { useUsers } from "@/hooks/api/useUsers";
import { Loader2, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { User } from "@/types";

interface Props {
  sessionId: number;
  existingUserIds: number[];
  onSuccess?: () => void;
}

export function AddEmployeeDialog({ sessionId, existingUserIds, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");

  const { data: usersResponse, isLoading: usersLoading } = useUsers({ 
    status: 'active',
  });
  
  const users = (usersResponse?.data as unknown as User[]) || [];

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        !existingUserIds.includes(user.id) &&
        (user.fullName.toLowerCase().includes(search.toLowerCase()) ||
          user.employeeCode.toLowerCase().includes(search.toLowerCase()))
    );
  }, [users, existingUserIds, search]);

  const toggleUser = (userId: number) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAdd = async () => {
    if (selectedIds.length === 0) return;
    try {
      setLoading(true);
      await overtimeApi.addEmployees(sessionId, selectedIds);
      toast.success(`Đã thêm ${selectedIds.length} nhân viên`);
      setOpen(false);
      setSelectedIds([]);
      onSuccess?.();
    } catch (error) {
      toast.error("Thêm nhân viên thất bại");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="smm" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Thêm nhân viên
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} className="max-w-xl p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Thêm nhân viên vào phiên
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
               Chọn nhân viên để thêm vào phiên tăng ca này.
            </p>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input 
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Tìm kiếm nhân viên..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="h-[300px] overflow-y-auto border rounded-md p-2 space-y-1">
            {usersLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-gray-500">
                Không tìm thấy nhân viên phù hợp
              </p>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                  onClick={() => toggleUser(user.id)}
                >
                  <input
                    type="checkbox"
                    id={`user-${user.id}`}
                    checked={selectedIds.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.fullName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.employeeCode} - {user.role?.roleName}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-gray-500">
              Đã chọn: <span className="font-medium text-gray-900 dark:text-white">{selectedIds.length}</span>
            </div>
            <div className="flex gap-3">
                <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                    Hủy
                </Button>
                <Button variant="primary" onClick={handleAdd} disabled={loading || selectedIds.length === 0}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Thêm đã chọn
                </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
