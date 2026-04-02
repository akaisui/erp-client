'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, Monitor, CheckCircle, XCircle } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { useLoginHistory, useRevokeLoginSessions } from '@/hooks/api/useLoginHistory';

const LoginHistoryPage = () => {
  const router = useRouter();
  const { data: loginLogsResponse, isLoading } = useLoginHistory();
  const { mutateAsync: revokeTokens, isPending } = useRevokeLoginSessions();
  
  const loginLogs = loginLogsResponse?.data || [];
  const [selectedTokens, setSelectedTokens] = useState<number[]>([]);

  const handleCheckboxChange = (logId: number) => {
    setSelectedTokens((prev) =>
      prev.includes(logId) ? prev.filter((id) => id !== logId) : [...prev, logId]
    );
  };

  const handleRevokeTokens = async () => {
    if (selectedTokens.length === 0) return;
    try {
      await revokeTokens(selectedTokens);
      setSelectedTokens([]);
    } catch (error) {
      console.error('Error revoking tokens:', error);
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Lịch sử đăng nhập
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Xem chi tiết các lần đăng nhập của người dùng
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
          Quay lại
        </button>
      </div>

      {/* Action Bar */}
      <div className="flex justify-end">
        <Button
          variant="danger"
          size="smm"
          onClick={handleRevokeTokens}
          disabled={selectedTokens.length === 0}
          isLoading={isPending}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất ({selectedTokens.length})
        </Button>
      </div>

      {/* Login Logs List */}
      <div className="space-y-3">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 animate-pulse"
            />
          ))
        ) : loginLogs.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
            <Monitor className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">Không có lịch sử đăng nhập</p>
          </div>
        ) : (
          loginLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              {/* Left Content */}
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1 rounded-lg bg-blue-50 p-2 dark:bg-blue-900/30">
                  <Monitor className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {log.userAgent}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>IP: {log.ipAddress}</span>
                    <span>•</span>
                    <span>{getTimeAgo(log.createdAt)}</span>
                    <span>•</span>
                    {log.logoutAt ? (
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        Đã đăng xuất
                        <XCircle className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                        Đang hoạt động
                        <CheckCircle className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Checkbox */}
              {!log.logoutAt && (
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={selectedTokens.includes(log.id)}
                    onChange={() => handleCheckboxChange(log.id)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Info Alert */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          💡 Thông tin
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-400">
          Chỉ các phiên đang hoạt động mới có thể bị đăng xuất. Các phiên đã kết thúc sẽ hiển thị
          thông tin lịch sử.
        </p>
      </div>
    </div>
  );
};

export default LoginHistoryPage;
