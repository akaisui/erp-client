'use client';

import { AddEmployeeDialog } from '@/components/overtime/AddEmployeeDialog';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { overtimeApi, useOvertimeSession } from '@/hooks/api/useOvertimeApi';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Loader2,
  Lock,
  Trash2,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function OvertimeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const sessionId = Number(id);
  const { session, isLoading, mutate } = useOvertimeSession(sessionId);
  const [closing, setClosing] = useState(false);

  // Helper to remove employee
  const handleRemoveEmployee = async (userId: number) => {
    if (!confirm('Bạn có chắc muốn xóa nhân viên này khỏi phiên?')) return;
    try {
      await overtimeApi.removeEmployee(sessionId, userId);
      toast.success('Đã xóa nhân viên');
      mutate();
    } catch (error) {
      toast.error('Xóa thất bại');
    }
  };

  // Helper to close session
  const handleCloseSession = async () => {
    if (!confirm('Bạn có chắc muốn đóng phiên này? Giờ công sẽ được tính toán.'))
      return;
    try {
      setClosing(true);
      await overtimeApi.closeSession(sessionId, new Date().toISOString());
      toast.success('Đã đóng phiên tăng ca');
      mutate();
    } catch (error) {
      toast.error('Đóng phiên thất bại');
    } finally {
      setClosing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/10 dark:text-red-200">
        Phiên tăng ca không tồn tại hoặc đã bị xóa.
      </div>
    );
  }

  const existingUserIds = session.entries?.map((e) => e.userId) || [];

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4">
        {/* Back Button */}
        <div>
          <Link
            href="/hr/overtime"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Quay lại danh sách
          </Link>
        </div>

        {/* Header Info */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {session.sessionName}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Tạo bởi: {session.creator?.fullName}
            </p>
          </div>
          
          <div className="flex gap-4 items-center">
            <Badge
              color={
                session.status === 'open'
                  ? 'green'
                  : session.status === 'closed'
                  ? 'gray'
                  : 'red'
              }
            >
              {session.status === 'open' ? 'Đang mở' : 'Đã đóng'}
            </Badge>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="mr-2 h-4 w-4" />
              {format(new Date(session.startTime), 'dd/MM/yyyy')}
            </div>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Clock className="mr-2 h-4 w-4" />
              {format(new Date(session.startTime), 'HH:mm')}
              {session.endTime &&
                ` - ${format(new Date(session.endTime), 'HH:mm')}`}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
            {session.status === 'open' && (
              <>
                <AddEmployeeDialog
                  sessionId={sessionId}
                  existingUserIds={existingUserIds}
                  onSuccess={mutate}
                />
                <Button variant="danger" size="smm" onClick={handleCloseSession} disabled={closing}>
                  {closing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                  Đóng phiên (Tính lương)
                </Button>
              </>
            )}
        </div>
      </div>

      <div className="grid gap-6">
        {/* Notes */}
        {session.notes && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Ghi chú</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {session.notes}
                </p>
            </div>
        )}

        {/* Employee List */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
              <Users className="h-5 w-5" />
              Danh sách nhân viên ({session.entries?.length || 0})
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Nhân viên tham gia phiên tăng ca này.
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Mã NV</TableCell>
                  <TableCell isHeader>Họ tên</TableCell>
                  <TableCell isHeader>Chức vụ</TableCell>
                  <TableCell isHeader>Giờ bắt đầu</TableCell>
                  <TableCell isHeader>Giờ kết thúc</TableCell>
                  <TableCell isHeader>Số giờ (Giờ)</TableCell>
                  <TableCell isHeader></TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {session.entries?.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.user.employeeCode}</TableCell>
                    <TableCell className="font-medium">
                      {entry.user.fullName}
                    </TableCell>
                    <TableCell>{entry.user.role?.roleName || '-'}</TableCell>
                    <TableCell>
                      {entry.startTime
                        ? format(new Date(entry.startTime), 'HH:mm')
                        : format(new Date(session.startTime), 'HH:mm (Phiên)')}
                    </TableCell>
                    <TableCell>
                      {entry.endTime
                        ? format(new Date(entry.endTime), 'HH:mm')
                        : session.endTime
                        ? format(new Date(session.endTime), 'HH:mm (Phiên)')
                        : '-'}
                    </TableCell>
                    <TableCell className="font-bold">
                        {Number(entry.actualHours)}
                    </TableCell>
                    <TableCell className="text-right">
                      {session.status === 'open' && (
                        <Button
                          variant="ghost"
                          size="smm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveEmployee(entry.userId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!session.entries || session.entries.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-gray-500">
                      Chưa có nhân viên nào trong phiên này.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
