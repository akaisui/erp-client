'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { useGeneralSettings, useUpdateGeneralSettings } from '@/hooks/api/useGeneralSettings';
import toast from 'react-hot-toast';
import { User } from '@/types';

interface Bank {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankBranch: string;
}

interface GeneralSettings {
  brandName: string;
  logo: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxCode: string;
  website: string;
  banks: Bank[];
  updatedBy?: User;
  updatedAt: string;
}

const GeneralInformationPage = () => {
  const router = useRouter();
  const { data: settingsDataWrapper, isLoading: isLoadingSettings } = useGeneralSettings();
  const settingsData = settingsDataWrapper?.data as unknown as GeneralSettings;
  const { mutateAsync: updateSettings, isPending: isUpdating } = useUpdateGeneralSettings();
  
  const [banks, setBanks] = useState<Bank[]>([
    {
      accountNumber: '',
      accountName: '',
      bankName: '',
      bankBranch: '',
    },
  ]);
  const [lastUpdater, setLastUpdater] = useState<string>('Admin');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toLocaleString('vi-VN'));

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<GeneralSettings>({
    defaultValues: {
      brandName: '',
      logo: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      taxCode: '',
      website: '',
      banks,
    },
  });

  // Load settings data when available
  useEffect(() => {
    if (settingsData) {
      reset({
        brandName: settingsData.brandName,
        logo: settingsData.logo || '',
        name: settingsData.name,
        email: settingsData.email,
        phone: settingsData.phone,
        address: settingsData.address,
        taxCode: settingsData.taxCode,
        website: settingsData.website,
        banks: settingsData.banks && settingsData.banks.length > 0 ? settingsData.banks : banks,
      });
      
      if (settingsData.banks && settingsData.banks.length > 0) {
        setBanks(settingsData.banks);
      }

      if (settingsData.updatedBy) {
        setLastUpdater(settingsData.updatedBy.fullName);
        setLastUpdatedAt(new Date(settingsData.updatedAt).toLocaleString('vi-VN'));
      }
    }
  }, [settingsData, reset]);

  const handleAddBank = () => {
    setBanks([
      ...banks,
      {
        accountNumber: '',
        accountName: '',
        bankName: '',
        bankBranch: '',
      },
    ]);
  };

  const handleRemoveBank = (index: number) => {
    if (banks.length > 1) {
      setBanks(banks.filter((_, i) => i !== index));
    }
  };

  const handleBankChange = (index: number, field: keyof Bank, value: string) => {
    const newBanks = [...banks];
    newBanks[index][field] = value;
    setBanks(newBanks);
  };

  const onSubmit = async (data: GeneralSettings) => {
    try {
      data.banks = banks;
      await updateSettings(data);
    } catch (error: any) {
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cài đặt thông tin cơ bản
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Quản lý thông tin công ty, logo, tài khoản ngân hàng
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/settings/system')}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
          Quay lại
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* General Information Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 mb-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Thông tin công ty
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Tên công ty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tên công ty <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="Vui lòng nhập tên công ty"
                {...register('brandName', { required: 'Tên công ty là bắt buộc' })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.brandName && (
                <p className="mt-1 text-sm text-red-600">{errors.brandName.message}</p>
              )}
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Logo
              </label>
              <input
                type="text"
                placeholder="URL của logo"
                {...register('logo')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Tên website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tên website <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="Nhập tên website"
                {...register('name', { required: 'Tên website là bắt buộc' })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                placeholder="Nhập địa chỉ email"
                {...register('email', { required: 'Email là bắt buộc' })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Số điện thoại <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                placeholder="Nhập số điện thoại"
                {...register('phone', { required: 'Số điện thoại là bắt buộc' })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Địa chỉ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Địa chỉ <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="Nhập địa chỉ công ty"
                {...register('address', { required: 'Địa chỉ là bắt buộc' })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            {/* Mã số thuế */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mã số thuế <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="Nhập mã số thuế"
                {...register('taxCode', { required: 'Mã số thuế là bắt buộc' })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.taxCode && (
                <p className="mt-1 text-sm text-red-600">{errors.taxCode.message}</p>
              )}
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Địa chỉ website <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="Nhập địa chỉ website"
                {...register('website', { required: 'Website là bắt buộc' })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.website && (
                <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Bank Accounts Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tài khoản ngân hàng
            </h2>
            <button
              type="button"
              onClick={handleAddBank}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              <Plus className="w-4 h-4" />
              Thêm tài khoản
            </button>
          </div>

          <div className="space-y-4">
            {banks.map((bank, index) => (
              <div
                key={index}
                className="grid gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700 md:grid-cols-[1fr_1fr_1fr_1fr_auto]"
              >
                {/* Số tài khoản */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Số tài khoản
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập số tài khoản"
                    value={bank.accountNumber}
                    onChange={(e) => handleBankChange(index, 'accountNumber', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Tên tài khoản */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tên tài khoản
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập tên tài khoản"
                    value={bank.accountName}
                    onChange={(e) => handleBankChange(index, 'accountName', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Ngân hàng */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ngân hàng
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Vietcombank"
                    value={bank.bankName}
                    onChange={(e) => handleBankChange(index, 'bankName', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Chi nhánh */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Chi nhánh
                  </label>
                  <input
                    type="text"
                    placeholder="VD: CN Cần Thơ"
                    value={bank.bankBranch}
                    onChange={(e) => handleBankChange(index, 'bankBranch', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Delete Button */}
                <div className="flex items-end justify-center pb-1">
                  {banks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBank(index)}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      title="Xóa tài khoản"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Alert */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20 mb-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            💡 Thông tin về cài đặt
          </h3>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
            <li>
              <strong>Người cập nhật sau cùng:</strong> {lastUpdater}
            </li>
            <li>
              <strong>Lần cập nhật mới nhất:</strong> {lastUpdatedAt}
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isUpdating}
          >
            Cập nhật
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GeneralInformationPage;

