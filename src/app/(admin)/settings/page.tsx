'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, ChevronRight } from 'lucide-react';

const SettingsPage = () => {
  const sections = [
    {
      title: 'Cài đặt Hệ thống',
      description: 'Quản lý cài đặt hệ thống chính',
      href: '/settings/system',
      icon: <Settings className="w-5 h-5" />
    },
    {
      title: 'Quản Lý Quyền Hạn',
      description: 'Cấu hình vai trò và quyền hạn người dùng',
      href: '/settings/roles',
      icon: <Settings className="w-5 h-5" />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cài đặt</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Quản lý toàn bộ cài đặt hệ thống và quyền hạn
        </p>
      </div>

      {/* Settings Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-md transition-all duration-200"
          >
            {/* Icon */}
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                {section.icon}
              </div>
            </div>

            {/* Content */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {section.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {section.description}
            </p>

            {/* Footer */}
            <div className="flex items-center text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
              <span className="text-sm font-medium">Truy cập</span>
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
