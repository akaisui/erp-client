import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import { useRequestLeave } from "@/hooks/api/useAttendance";

const requestLeaveSchema = z.object({
  date: z.string().min(1, "Ngày nghỉ là bắt buộc"),
  leaveType: z.enum(["annual", "sick", "unpaid", "other"]),
  shift: z.enum(["morning", "afternoon", "all_day"]),
  reason: z.string().min(1, "Lý do là bắt buộc").max(500, "Lý do không quá 500 ký tự"),
});

type RequestLeaveForm = z.infer<typeof requestLeaveSchema>;

interface RequestLeaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RequestLeaveDialog({ isOpen, onClose }: RequestLeaveDialogProps) {
  const requestLeave = useRequestLeave();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequestLeaveForm>({
    resolver: zodResolver(requestLeaveSchema),
    defaultValues: {
      leaveType: "annual",
      shift: "all_day",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = (data: RequestLeaveForm) => {
    requestLeave.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const selectClassName = "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
          Tạo đơn nghỉ phép
        </h3>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="date">Ngày nghỉ</Label>
          <Input 
            id="date" 
            type="date" 
            {...register("date")} 
            error={errors.date?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="leaveType">Loại nghỉ</Label>
            <div className="relative">
              <select
                id="leaveType"
                {...register("leaveType")}
                className={selectClassName}
              >
                <option value="annual">Nghỉ phép năm</option>
                <option value="sick">Nghỉ ốm</option>
                <option value="unpaid">Nghỉ không lương</option>
                <option value="other">Khác</option>
              </select>
            </div>
            {errors.leaveType && (
              <p className="mt-1.5 text-xs text-error-500">{errors.leaveType.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="shift">Ca nghỉ</Label>
            <div className="relative">
              <select
                id="shift"
                {...register("shift")}
                className={selectClassName}
              >
                <option value="all_day">Cả ngày</option>
                <option value="morning">Buổi sáng</option>
                <option value="afternoon">Buổi chiều</option>
              </select>
            </div>
            {errors.shift && (
              <p className="mt-1.5 text-xs text-error-500">{errors.shift.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="reason">Lý do</Label>
          <TextArea
            id="reason"
            placeholder="Nhập lý do nghỉ..."
            {...register("reason")}
            error={!!errors.reason}
            hint={errors.reason?.message}
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
            type="button"
          >
            Hủy
          </Button>
          <Button 
            type="submit" 
            isLoading={requestLeave.isPending}
            disabled={requestLeave.isPending}
          >
            Gửi yêu cầu
          </Button>
        </div>
      </form>
    </Modal>
  );
}
