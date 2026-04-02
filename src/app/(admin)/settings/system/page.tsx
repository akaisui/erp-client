'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Scale, 
  LogIn, 
  Bell, 
  Info, 
  TrendingUp, 
  FileText,
  ChevronRight
} from 'lucide-react';

interface SettingCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
}

const SystemSettingsPage = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const settingCards: SettingCard[] = [
    {
      id: 'company-info',
      icon: <Settings className="w-5 h-5" />,
      title: 'Cài đặt thông tin cơ bản',
      description: 'Cài đặt thông tin cơ bản cho hệ thống (bao gồm tên, email, số điện thoại, địa chỉ, mã số thuế...)',
      actionLabel: 'Thiết lập'
    },
    {
      id: 'sales-ratio',
      icon: <Scale className="w-5 h-5" />,
      title: 'Tỷ lệ hưởng doanh số',
      description: 'Cấu hình tỷ lệ hoa hồng cho nhân viên bán hàng',
      actionLabel: 'Thiết lập'
    },
    {
      id: 'login-history',
      icon: <LogIn className="w-5 h-5" />,
      title: 'Lịch sử đăng nhập',
      description: 'Xem chi tiết các lần đăng nhập của bạn thân mình',
      actionLabel: 'Quản lý'
    },
    {
      id: 'notifications',
      icon: <Bell className="w-5 h-5" />,
      title: 'Cài đặt thông báo',
      description: 'Cấu hình các loại thông báo hệ thống',
      actionLabel: 'Thiết lập'
    },
    {
      id: 'system-info',
      icon: <Info className="w-5 h-5" />,
      title: 'Thông tin hệ thống',
      description: 'Xem thông tin phiên bản, dung lượng database',
      actionLabel: 'Xem'
    },
    {
      id: 'business-plan',
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Kế hoạch kinh doanh',
      description: 'Đặt mục tiêu doanh số, lợi nhuận theo tháng/quý/năm',
      actionLabel: 'Quản lý'
    },
    {
      id: 'viettel-invoice',
      icon: <FileText className="w-5 h-5" />,
      title: 'Hóa đơn điện tử Viettel',
      description: 'Kết nối và cấu hình hóa đơn điện tử HTKK',
      actionLabel: 'Thiết lập'
    }
  ];

  const handleSettingClick = (sectionId: string) => {
    const routes: Record<string, string> = {
      'company-info': '/settings/system/general-information',
      'sales-ratio': '/settings/system/sales-ratio',
      'login-history': '/settings/system/login-history',
      'notifications': '/settings/system/notifications',
      'system-info': '/settings/system/system-info',
      'business-plan': '/settings/system/business-plan',
      'viettel-invoice': '/settings/system/viettel-invoice',
    };
    
    const route = routes[sectionId];
    if (route) {
      router.push(route);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cài đặt hệ thống</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Quản lý toàn bộ cài đặt hệ thống, thông tin công ty và các tùy chọn cấu hình
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingCards.map((card) => (
          <div
            key={card.id}
            className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all duration-200"
          >
            {/* Header with Icon */}
            <div className="flex items-start justify-between mb-4">
              {/* Icon Container */}
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                {card.icon}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleSettingClick(card.id)}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              >
                {card.actionLabel}
              </button>
            </div>

            {/* Content */}
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                {card.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {card.description}
              </p>
            </div>

            {/* Footer with Link */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => handleSettingClick(card.id)}
                className="flex items-center justify-between w-full text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group/link"
              >
                <span>Truy cập</span>
                <ChevronRight className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">💡 Gợi ý</h3>
        <p className="text-sm text-blue-800 dark:text-blue-400">
          Các thay đổi trong cài đặt hệ thống sẽ áp dụng ngay lập tức cho tất cả người dùng. 
          Hãy chắc chắn rằng bạn có quyền quản trị trước khi thực hiện các thay đổi.
        </p>
      </div>
    </div>
  );
};

export default SystemSettingsPage;
