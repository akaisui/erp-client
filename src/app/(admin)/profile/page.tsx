"use client";

import React from "react";
import { useProfile } from "@/hooks/api/useUsers";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";

export default function Profile() {
  const { data: profileData, isLoading } = useProfile();
  const user = (profileData as any)?.data;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Hồ Sơ
        </h3>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <p className="text-red-500">Không thể tải hồ sơ người dùng</p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Hồ Sơ
        </h3>
        <div className="space-y-6">
          <UserMetaCard user={user} canEdit={user.canEditProfile} />
          <UserInfoCard user={user} canEdit={user.canEditProfile} />
        </div>
      </div>
    </div>
  );
}
