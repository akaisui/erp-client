"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import Button from "@/components/ui/button/Button";
import toast from "react-hot-toast";

// Import Components
import TaskTable from "@/components/crm/TaskTable";
import TaskDialog from "@/components/crm/TaskDialog";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog"; // Đừng quên import ConfirmDialog

// Import Hooks & Types
import { 
  useCrmTasks, 
  useCreateCrmTask, 
  useUpdateCrmTask,
  useDeleteCrmTask // Import hook xóa mới thêm
} from "@/hooks/api/useCrm";
import { CrmTask, CreateTaskDto } from "@/types/crm.types";

export default function TaskPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CrmTask | null>(null);

  // State cho Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<number | null>(null);

  // API Hooks
  const { data: response, isLoading } = useCrmTasks();
  const createTask = useCreateCrmTask();
  const updateTask = useUpdateCrmTask();
  const deleteTask = useDeleteCrmTask(); // Sử dụng hook xóa

  // Logic lấy data an toàn
  let tasks: CrmTask[] = [];
  if (Array.isArray(response)) {
      tasks = response;
  } else if (response && (response as any).data && Array.isArray((response as any).data)) {
      tasks = (response as any).data;
  }

  // Handlers Create/Edit
  const handleOpenCreate = () => {
    setSelectedTask(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (task: CrmTask) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  // --- Handlers Delete (Mới) ---
  const handleOpenDelete = (id: number) => {
    setTaskToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDeleteId) return;
    try {
      await deleteTask.mutateAsync(taskToDeleteId);
      toast.success("Xóa nhiệm vụ thành công");
      setIsDeleteDialogOpen(false);
      setTaskToDeleteId(null);
    } catch (error) {
      toast.error("Lỗi khi xóa nhiệm vụ");
      console.error(error);
    }
  };
  // ---------------------------

  const handleSubmit = async (formData: CreateTaskDto | Partial<CrmTask>) => {
    try {
      if (selectedTask) {
        await updateTask.mutateAsync({ 
            id: selectedTask.id, 
            data: formData as Partial<CreateTaskDto> 
        });
        toast.success("Cập nhật nhiệm vụ thành công");
      } else {
        await createTask.mutateAsync(formData as CreateTaskDto);
        toast.success("Tạo nhiệm vụ CSKH thành công");
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nhiệm vụ CSKH
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Quản lý các công việc chăm sóc khách hàng hàng ngày
          </p>
        </div>
        <Button 
            variant="primary" 
            size="sm" 
            onClick={handleOpenCreate}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tạo nhiệm vụ mới
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <TaskTable 
            tasks={tasks} 
            isLoading={isLoading} 
            onEdit={handleOpenEdit} 
            onDelete={handleOpenDelete} // Truyền hàm mở dialog xóa
        />
      </div>

      {/* Create/Edit Dialog */}
      <TaskDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedTask}
        isSubmitting={createTask.isPending || updateTask.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa nhiệm vụ"
        message="Bạn có chắc chắn muốn xóa nhiệm vụ này không? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteTask.isPending}
      />
    </div>
  );
}