"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  AlertCircle, FileText, User, UserCheck, Calendar, 
  Search, ChevronDown, Check, X 
} from "lucide-react";

// Import Schema
import { syncDebtSchema, SyncDebtForm } from "@/lib/validations/debt-reconciliation.schema";

import { useCustomers } from "@/hooks/api/useCustomers";
import { useSuppliers } from "@/hooks/api/useSuppliers";
import { useUsers } from "@/hooks/api/useUsers";
import Button from "@/components/ui/button/Button";

// --- 1. COMPONENT TÙY CHỈNH: SEARCHABLE SELECT ---
// Component này nhận vào danh sách options, tự động lọc khi gõ, không gọi API
interface Option {
  id: number;
  label: string;
  subLabel?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  error?: string;
}

const SearchableSelect = ({ options, value, onChange, placeholder, disabled, icon, error }: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Lọc dữ liệu ngay tại Client (Cực nhanh, không gọi API)
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const lowerTerm = searchTerm.toLowerCase();
    return options.filter(opt => 
      opt.label.toLowerCase().includes(lowerTerm) || 
      (opt.subLabel && opt.subLabel.toLowerCase().includes(lowerTerm))
    );
  }, [options, searchTerm]);

  // Tìm option đang được chọn để hiển thị label
  const selectedOption = options.find(opt => opt.id === value);

  // Xử lý click ra ngoài để đóng dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Icon trái */}
      {icon && <div className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none z-10">{icon}</div>}
      
      {/* Nút bấm giả lập Select */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full pl-9 pr-8 py-2 rounded-md border bg-white text-sm cursor-pointer flex items-center justify-between
          ${error ? "border-red-500" : "border-gray-300 dark:border-gray-700"}
          ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "dark:bg-gray-800 dark:text-white hover:border-blue-400"}
        `}
      >
        <span className={`block truncate ${!selectedOption ? "text-gray-400" : ""}`}>
          {selectedOption ? (
            <span>{selectedOption.label} {selectedOption.subLabel && <span className="text-gray-400 text-xs">({selectedOption.subLabel})</span>}</span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>

      {/* Dropdown & Search Input */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 flex flex-col">
          {/* Ô tìm kiếm */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-md">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                className="w-full pl-7 pr-2 py-1.5 text-xs border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                placeholder="Gõ để tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Danh sách options */}
          <ul className="overflow-auto flex-1 p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <li
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearchTerm(""); // Reset tìm kiếm sau khi chọn
                  }}
                  className={`flex items-center justify-between px-3 py-2 text-sm rounded cursor-pointer select-none
                    ${value === opt.id 
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"}
                  `}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{opt.label}</span>
                    {opt.subLabel && <span className="text-xs text-gray-400">{opt.subLabel}</span>}
                  </div>
                  {value === opt.id && <Check className="h-3.5 w-3.5" />}
                </li>
              ))
            ) : (
              <li className="px-3 py-4 text-center text-xs text-gray-400">
                Không tìm thấy kết quả "{searchTerm}"
              </li>
            )}
          </ul>
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};


// --- 2. FORM CHÍNH ---

interface Props {
  onSubmit: (data: SyncDebtForm) => void;
  onCancel: () => void;
  loading: boolean;
  mode?: 'SNAP' | 'FULL'; 
  hideFooter?: boolean;
  formId?: string;
}

export default function ReconciliationForm({ onSubmit, onCancel, loading, mode = 'SNAP', hideFooter = false, formId }: Props) {
  const [entityType, setEntityType] = useState<"customer" | "supplier">("customer");

  const { data: customersData } = useCustomers({ status: "active", limit: 100 } as any);
  const { data: suppliersData } = useSuppliers({ status: "active", limit: 100 } as any);
  const { data: usersResponse } = useUsers({ status: "active", limit: 100 });

  // Chuẩn bị dữ liệu cho Select Searchable
  const customerOptions = useMemo(() => 
    (Array.isArray(customersData?.data) ? customersData.data : []).map((c: any) => ({
      id: c.id,
      label: c.customerName,
      subLabel: c.phone
    })), 
  [customersData]);

  const supplierOptions = useMemo(() => 
    (Array.isArray(suppliersData?.data) ? suppliersData.data : []).map((s: any) => ({
      id: s.id,
      label: s.supplierName,
      subLabel: s.taxCode // Ví dụ thêm mã số thuế nếu muốn
    })), 
  [suppliersData]);

  const userOptions = useMemo(() => 
    (Array.isArray(usersResponse?.data) ? usersResponse.data : []).map((u: any) => ({
      id: u.id,
      label: u.fullName || u.username,
      subLabel: u.role?.name
    })), 
  [usersResponse]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SyncDebtForm>({ 
    resolver: zodResolver(syncDebtSchema) as any, 
    defaultValues: {
      year: new Date().getFullYear(),
      notes: "",
      assignedUserId: undefined, 
      customerId: undefined,
      supplierId: undefined,
    }
  });

  // Watch giá trị hiện tại để truyền vào Component Select
  const currentCustomerId = watch("customerId");
  const currentSupplierId = watch("supplierId");
  const currentUserId = watch("assignedUserId");

  const handleTypeChange = (type: "customer" | "supplier") => {
    setEntityType(type);
    setValue("customerId", undefined);
    setValue("supplierId", undefined);
  };

  const onFormSubmit: SubmitHandler<SyncDebtForm> = (data) => {
    let cleanAssignedUserId: number | undefined = data.assignedUserId;
    if (!cleanAssignedUserId || isNaN(Number(cleanAssignedUserId))) {
        cleanAssignedUserId = undefined;
    }

    const payload: SyncDebtForm = {
        ...data,
        assignedUserId: cleanAssignedUserId,
        customerId: entityType === 'customer' ? data.customerId : undefined,
        supplierId: entityType === 'supplier' ? data.supplierId : undefined,
    };

    console.log(`🚀 [${mode}] Payload:`, payload);
    onSubmit(payload);
  };

  const isSnap = mode === 'SNAP';
  const submitLabel = isSnap ? "Cập nhật ngay" : "Gửi lệnh sửa lỗi";
  const submitColor = isSnap 
    ? "bg-blue-600 hover:bg-blue-700" 
    : "bg-orange-600 hover:bg-orange-700";
  
  const infoMessage = isSnap 
    ? "Hệ thống sẽ tính toán lại số liệu cho năm đã chọn dựa trên giao dịch hiện tại."
    : "Hệ thống sẽ quét lại toàn bộ lịch sử giao dịch từ quá khứ (Process nặng).";

  return (
    <form id={formId} onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
      
      {/* 1. Entity Type Selection */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Đối tượng <span className="text-red-500">*</span>
        </label>
        <div className="flex p-1 bg-gray-100 rounded-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => handleTypeChange("customer")}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              entityType === "customer" 
                ? "bg-white shadow-sm text-blue-600 dark:bg-gray-700 dark:text-blue-400" 
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            Khách hàng
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("supplier")}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              entityType === "supplier" 
                ? "bg-white shadow-sm text-blue-600 dark:bg-gray-700 dark:text-blue-400" 
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            Nhà cung cấp
          </button>
        </div>
      </div>

      {/* 2. Partner Selection Dropdown (ĐÃ NÂNG CẤP) */}
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
          {entityType === "customer" ? "Chọn Khách hàng" : "Chọn Nhà cung cấp"} <span className="text-red-500">*</span>
        </label>
        
        {entityType === "customer" ? (
            <SearchableSelect
                options={customerOptions}
                value={currentCustomerId}
                onChange={(val) => setValue("customerId", val, { shouldValidate: true })}
                placeholder="-- Tìm kiếm khách hàng --"
                disabled={loading}
                icon={<User className="h-4 w-4" />}
                error={errors.customerId?.message}
            />
        ) : (
            <SearchableSelect
                options={supplierOptions}
                value={currentSupplierId}
                onChange={(val) => setValue("supplierId", val, { shouldValidate: true })}
                placeholder="-- Tìm kiếm nhà cung cấp --"
                disabled={loading}
                icon={<User className="h-4 w-4" />}
                error={errors.supplierId?.message}
            />
        )}
      </div>

      {/* 3. Fiscal Year */}
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
          Năm tài chính <span className="text-red-500">*</span>
        </label>
        <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            <input 
              type="number"
              {...register("year", { valueAsNumber: true })}
              className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              disabled={loading}
            />
        </div>
        {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year?.message}</p>}
      </div>

      {/* 4. Assigned User (ĐÃ NÂNG CẤP) */}
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
          Người phụ trách (Tùy chọn)
        </label>
        <SearchableSelect
            options={userOptions}
            value={currentUserId}
            onChange={(val) => setValue("assignedUserId", val)}
            placeholder="-- Mặc định (Tự động) --"
            disabled={loading}
            icon={<UserCheck className="h-4 w-4" />}
        />
      </div>

      {/* 5. Notes */}
      <div>
        <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
          Ghi chú (Tùy chọn)
        </label>
        <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
            <textarea
            {...register("notes")}
            rows={3}
            className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="Ghi chú nội bộ..."
            disabled={loading}
            />
        </div>
      </div>

      {/* 6. Info Box */}
      <div className={`flex gap-3 p-3 rounded-md border text-xs ${
         isSnap 
          ? "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
          : "bg-orange-50 border-orange-100 text-orange-700"
      }`}>
        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
            <p className="font-semibold">{isSnap ? "Chế độ Cập nhật nhanh:" : "Chế độ Sửa lỗi hệ thống:"}</p>
            <p>{infoMessage}</p>
        </div>
      </div>

      {/* 7. Buttons */}
      {!hideFooter && (
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            disabled={loading}
          >
            Hủy bỏ
          </Button>
          <Button 
            type="submit" 
            isLoading={loading}
            className={`${submitColor} text-white shadow-sm transition-colors`}
          >
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}