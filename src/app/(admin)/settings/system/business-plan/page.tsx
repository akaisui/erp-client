'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap } from 'lucide-react';

const BusinessPlanPage = () => {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Kế hoạch kinh doanh
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Đặt mục tiêu doanh số, lợi nhuận theo tháng/quý/năm
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

      {/* Coming Soon Card */}
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-900">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-blue-100 p-4 dark:bg-blue-900/30">
              <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            Tính năng đang được phát triển
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Trang này sẽ sớm được bật. Hãy quay lại sau!
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessPlanPage;
