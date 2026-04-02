import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import InputField from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label"; 
import { useCreateOvertimeSession } from "@/hooks/api/useOvertimeApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  sessionName: z.string().min(1, "Tên phiên bắt buộc"),
  startTime: z.string().min(1, "Thời gian bắt đầu bắt buộc"),
  notes: z.string().optional(),
});

interface Props {
  onSuccess?: () => void;
}

export function CreateSessionDialog({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const createSession = useCreateOvertimeSession();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sessionName: "",
      startTime: "",
      notes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createSession.mutateAsync({
        ...values,
        startTime: new Date(values.startTime).toISOString(),
      });
      // Toast success is handled in the hook
      reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      // Toast error is handled in the hook
      console.error(error);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="smm" variant="primary">
        <Plus className="mr-2 h-4 w-4" />
        Mở phiên tăng ca
      </Button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        className="max-w-md p-6"
      >
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Mở phiên tăng ca mới
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Tạo phiên tăng ca để bắt đầu tính giờ làm thêm cho nhân viên.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <Label htmlFor="sessionName">Tên phiên</Label>
                <InputField
                    id="sessionName"
                    placeholder="VD: Tăng ca tối 24/10"
                    {...register("sessionName")}
                    error={errors.sessionName?.message}
                />
            </div>

            <div>
                <Label htmlFor="startTime">Thời gian bắt đầu</Label>
                <InputField
                    id="startTime"
                    type="datetime-local"
                    {...register("startTime")}
                    error={errors.startTime?.message}
                />
            </div>

            <div>
                <Label htmlFor="notes">Ghi chú</Label>
                <TextArea
                    id="notes"
                    placeholder="Ghi chú thêm..."
                    {...register("notes")}
                    error={!!errors.notes}
                    hint={errors.notes?.message}
                />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createSession.isPending}
              >
                Hủy
              </Button>
              <Button type="submit" variant="primary" disabled={createSession.isPending}>
                {createSession.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tạo phiên
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
