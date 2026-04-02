"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
    Plus, Filter, RefreshCcw, DollarSign, Calendar, Layers,
    Activity, ShieldAlert, AlertTriangle, MapPin, Users, UserCog,
    Search, XCircle, ArrowUpRight, ArrowDownLeft, Info, Scale,
    ChevronDown, FileDown 
} from "lucide-react";

// Import Hooks
import {
    useDebtReconciliations,
    useSyncSnapBatch,
    useSyncFullBatch,
    useDebtEmployees,
    useExportDebtMutation, // ✅ Dùng Hook Mutation (Action-based)
} from "@/hooks/api/useDebtReconciliation";
import { useDebounce } from "@/hooks/useDebounce";

// Import Components
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import DebtReconciliationTable from "@/components/finance/ReconciliationTable";
import DebtReconciliationModals from "@/components/finance/ReconciliationModals";
import IntegrityWidget from "@/components/finance/IntegrityWidget";
import { formatCurrency } from "@/lib/utils";
import {  DebtReconciliationExportPreviewDialog } from "./(components)/DebtReconciliationExportPreviewDialog";

// Types & Utils
import type { DebtListItem, DebtSummary, DebtReconciliationParams, DebtType } from "@/types/debt-reconciliation.types";
import { exportDebtToExcel } from "@/utils/list-debt-excel-export"; 
import { ViewDebtReconciliationDialog } from "./(components)/ViewDebtReconciliationDialog";

export default function DebtReconciliationPage() {
    const isAdmin = true;

    // --- 1. LOCAL STATE ---
    const [searchTerm, setSearchTerm] = useState("");
    const [provinceTerm, setProvinceTerm] = useState("");

    const debouncedSearch = useDebounce(searchTerm, 500);
    const debouncedProvince = useDebounce(provinceTerm, 500);

    const [filters, setFilters] = useState<DebtReconciliationParams>({
        page: 1,
        limit: 20,
        year: new Date().getFullYear(),
        type: undefined,
        status: undefined,
        assignedUserId: undefined,
        province: undefined
    });

    // State cho Menu Dropdown
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const [isMaintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);

    // State cho View Dialog
    const [viewData, setViewData] = useState<{ id: number | null, type: DebtType, year: number }>({
        id: null,
        type: 'customer',
        year: new Date().getFullYear()
    });
    const [isViewOpen, setIsViewOpen] = useState(false);

    // State for Export Preview Dialog
    const [isExportPreviewOpen, setExportPreviewOpen] = useState(false);
    const [exportData, setExportData] = useState<DebtListItem[]>([]);
    const [exportType, setExportType] = useState<'all' | 'customer' | 'supplier'>('all');

    const handleView = (id: number | string, type: DebtType, year: string) => {
        setViewData({ id: Number(id), type, year: Number(year) });
        setIsViewOpen(true);
    };

    // --- 2. DATA FETCHING (LIST & STATS) ---
    const queryParams = useMemo(() => ({
        ...filters,
        search: debouncedSearch,
        province: debouncedProvince
    }), [filters, debouncedSearch, debouncedProvince]);

    const { data: apiResponse, isLoading: isLoadingList, refetch } = useDebtReconciliations(queryParams);
    const { data: employees } = useDebtEmployees();

    const { mutate: syncSnapBatch, isPending: isSnapping } = useSyncSnapBatch();
    const { mutate: syncFullBatch, isPending: isFulling } = useSyncFullBatch();
    const isBatchProcessing = isSnapping || isFulling;

    const currentViewYear = filters.year || new Date().getFullYear();

    // --- 3. EXPORT EXCEL LOGIC ---
    const exportMutation = useExportDebtMutation();
    const isExporting = exportMutation.isPending;

    const handleExportClick = (type: 'all' | 'customer' | 'supplier') => {
        setIsMenuOpen(false);
        setExportType(type);
        exportMutation.mutate(
            { year: currentViewYear, type },
            {
                onSuccess: (data) => {
                    if (data && data.length > 0) {
                        setExportData(data);
                        setExportPreviewOpen(true);
                    } else {
                        alert(`Không tìm thấy dữ liệu (${type}) để xuất file!`);
                    }
                },
                onError: (error) => {
                    console.error("Export error:", error);
                    alert("Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.");
                }
            }
        );
    };

    const handleConfirmExport = () => {
        exportDebtToExcel(exportData, currentViewYear, exportType);
        setExportPreviewOpen(false);
    };


    // --- 4. LOGIC XỬ LÝ DỮ LIỆU HIỂN THỊ TRÊN BẢNG ---
    const rawData = apiResponse as any;
    const tableData: DebtListItem[] = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);

    const backendSummary = rawData?.meta?.summary as DebtSummary | undefined;

    const pageSummary: DebtSummary = useMemo(() => tableData.reduce((acc, item) => ({
        opening: acc.opening + Number(item.openingBalance || 0),
        increase: acc.increase + Number(item.increasingAmount || 0),
        returnAmount: (acc.returnAmount || 0) + Number(item.returnAmount || 0),
        adjustmentAmount: (acc.adjustmentAmount || 0) + Number(item.adjustmentAmount || 0),
        payment: acc.payment + Number(item.decreasingAmount || 0),
        closing: acc.closing + Number(item.closingBalance || 0),
    }), { opening: 0, increase: 0, returnAmount: 0, adjustmentAmount: 0, payment: 0, closing: 0 }), [tableData]);

    const finalSummary = backendSummary || pageSummary;
    const summaryInfoText = backendSummary ? "Thống kê: Toàn hệ thống (Cố định)" : "Thống kê: Trang hiện tại";

    // --- 5. HANDLERS KHÁC ---
    const handleResetFilters = () => {
        setSearchTerm("");
        setProvinceTerm("");
        setFilters({
            page: 1,
            limit: 20,
            year: new Date().getFullYear(),
            type: undefined,
            status: undefined,
            assignedUserId: undefined,
            province: undefined
        });
    };

    const updateFilter = (key: keyof DebtReconciliationParams, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    // Click outside để đóng menu
    useEffect(() => {
        function handleClickOutside(event: any) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isMaintenanceModalOpen && countdown > 0) {
            timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [isMaintenanceModalOpen, countdown]);

    const handleOpenMaintenance = () => { setCountdown(10); setMaintenanceModalOpen(true); };
    const handleConfirmMaintenance = () => { syncFullBatch({ year: currentViewYear }); setMaintenanceModalOpen(false); };
    const handleDailySync = () => { if (confirm(`Chốt sổ nhanh cho danh sách hiện tại?`)) syncSnapBatch({ year: currentViewYear }); };

    return (
        <div className="space-y-6 p-6 max-w-[1600px] mx-auto bg-gray-50/50 min-h-screen">
            {/* HEADER */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        Tổng hợp công nợ <span className="text-blue-600 px-2 py-0.5 bg-blue-50 rounded text-lg border border-blue-100">Master View</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Quản lý và đối soát công nợ toàn hệ thống.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    
                    {/* --- NÚT XUẤT EXCEL (ĐÃ FIX CSS & LOGIC) --- */}
                    <div className="relative" ref={menuRef}>
                        <Button 
                            // 🛑 Đã bỏ variant="outline" để fix lỗi màu nền
                            onClick={() => setIsMenuOpen(!isMenuOpen)} 
                            disabled={isExporting || isBatchProcessing}
                            // 🟢 Class chuẩn: bg-green-600 + text-white + shadow-md
                            className="gap-2 bg-green-600 hover:bg-green-700 text-white border-transparent min-w-[140px] justify-between shadow-md transition-all h-10 px-4 py-2 rounded-md"
                        >
                            <div className="flex items-center gap-2">
                                {isExporting ? <span className="animate-spin">⏳</span> : <FileDown className="h-4 w-4" />}
                                <span>Xuất Excel</span>
                            </div>
                            <ChevronDown className={`h-4 w-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                        </Button>

                        {/* Menu thả xuống */}
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-xl border border-gray-200 z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                                <button 
                                    onClick={() => handleExportClick('all')}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 hover:text-blue-600 transition-colors"
                                >
                                    <span className="p-1 bg-blue-100 rounded text-blue-600">📑</span> 
                                    <div>
                                        <div className="font-medium">Toàn hệ thống</div>
                                        <div className="text-xs text-gray-400">Khách hàng & NCC</div>
                                    </div>
                                </button>
                                <button 
                                    onClick={() => handleExportClick('customer')}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 hover:text-orange-600 transition-colors"
                                >
                                    <span className="p-1 bg-orange-100 rounded text-orange-600">👤</span> 
                                    Chỉ Khách hàng
                                </button>
                                <button 
                                    onClick={() => handleExportClick('supplier')}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 hover:text-purple-600 transition-colors"
                                >
                                    <span className="p-1 bg-purple-100 rounded text-purple-600">🏢</span> 
                                    Chỉ Nhà cung cấp
                                </button>
                            </div>
                        )}
                    </div>

                    {isAdmin && (
                        <Button variant="danger" onClick={handleOpenMaintenance} isLoading={isFulling} disabled={isBatchProcessing} className="gap-2 shadow-sm opacity-90 hover:opacity-100">
                            <ShieldAlert className="h-4 w-4" /> Tính lại toàn bộ
                        </Button>
                    )}
                    <Button variant="outline" onClick={handleDailySync} isLoading={isSnapping} disabled={isBatchProcessing} className="bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 gap-2">
                        <Layers className="h-4 w-4" /> Tính lại công nợ kỳ
                    </Button>
                    <Button onClick={() => setCreateModalOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                        <Plus className="h-4 w-4" /> Tạo mới/Cập nhật
                    </Button>
                </div>
            </div>

            <IntegrityWidget year={currentViewYear} />

            {/* FINANCIAL STRIP */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-gray-500 ml-1 italic">
                    <Info className="h-3.5 w-3.5" />
                    <span>{summaryInfoText}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <SummaryCard label="Nợ đầu kỳ" value={finalSummary.opening} icon={Activity} color="text-gray-600" bg="bg-white" />
                    <SummaryCard label="Tổng mua (+)" value={finalSummary.increase} icon={ArrowUpRight} color="text-blue-600" bg="bg-white" />
                    <SummaryCard label="Tổng trả hàng (-)" value_obj={finalSummary.returnAmount} icon={ArrowDownLeft} color="text-indigo-600" bg="bg-white" />
                    <SummaryCard label="Điều chỉnh" value_obj={finalSummary.adjustmentAmount} icon={Scale} color="text-purple-600" bg="bg-white" />
                    <SummaryCard label="Tổng thanh toán (-)" value={finalSummary.payment} icon={DollarSign} color="text-green-600" bg="bg-white" />

                    <div className="col-span-2 md:col-span-1 lg:col-span-1 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-red-600 mb-1">
                            <AlertTriangle className="h-4 w-4" /> Nợ phải thu
                        </div>
                        <div className="text-xl font-extrabold text-red-700 tracking-tight">
                            {formatCurrency(finalSummary.closing)}
                        </div>
                    </div>
                </div>
            </div>

            {/* FILTER BAR (Giữ nguyên) */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-[180px] relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500" />
                        </div>
                        <input
                            type="number"
                            className="block w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Năm"
                            value={filters.year || ""}
                            onChange={(e) => updateFilter('year', e.target.value ? Number(e.target.value) : undefined)}
                        />
                        {filters.year && (
                            <button onClick={() => updateFilter('year', undefined)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500">
                                <XCircle className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Tìm kiếm theo Mã, Tên, SĐT..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => refetch()} title="Tải lại" className="px-3">
                            <RefreshCcw className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button variant="outline" onClick={handleResetFilters} className="border-dashed text-gray-500 hover:text-red-600 hover:border-red-200 px-4">
                            <Filter className="h-4 w-4 mr-2" /> Xóa lọc
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-gray-100">
                    <div className="relative">
                        <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <select
                            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                            value={filters.type || ""}
                            onChange={(e) => updateFilter('type', e.target.value || undefined)}
                        >
                            <option value="">👤 Tất cả đối tượng</option>
                            <option value="customer">Khách hàng</option>
                            <option value="supplier">Nhà cung cấp</option>
                        </select>
                    </div>

                    <div className="relative">
                        <UserCog className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <select
                            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                            value={filters.assignedUserId || ""}
                            onChange={(e) => updateFilter('assignedUserId', e.target.value ? Number(e.target.value) : undefined)}
                        >
                            <option value="">👮 Phụ trách: Tất cả</option>
                            {employees?.map((emp: any) => (
                                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="📍 Nhập Tỉnh/Thành..."
                            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            value={provinceTerm}
                            onChange={(e) => setProvinceTerm(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute left-3 top-2.5 h-2 w-2 rounded-full bg-gray-400" />
                        <select
                            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                            value={filters.status || ""}
                            onChange={(e) => updateFilter('status', e.target.value || undefined)}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="unpaid">🔴 Đang nợ</option>
                            <option value="paid">🟢 Đã trả hết</option>
                        </select>
                    </div>
                </div>
            </div>

            <DebtReconciliationTable data={tableData} isLoading={isLoadingList} onView={handleView} />

            <DebtReconciliationModals
                isCreateOpen={isCreateModalOpen}
                closeCreate={() => setCreateModalOpen(false)}
            />

             <ViewDebtReconciliationDialog
                isOpen={isViewOpen}
                onClose={() => setIsViewOpen(false)}
                id={viewData.id}
                type={viewData.type}
                year={viewData.year}
            />

            <DebtReconciliationExportPreviewDialog
                isOpen={isExportPreviewOpen}
                onClose={() => setExportPreviewOpen(false)}
                debts={exportData}
                onConfirm={handleConfirmExport}
            />

            <Modal isOpen={isMaintenanceModalOpen} onClose={() => setMaintenanceModalOpen(false)} className="max-w-md p-0 rounded-xl" showCloseButton={true}>
                <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
                    <h3 className="text-lg font-bold text-red-900">Cảnh báo bảo trì!</h3>
                    <p className="text-sm text-red-700 mt-2">Hệ thống sẽ tính toán lại toàn bộ lịch sử giao dịch từ đầu đến nay.</p>
                </div>
                <div className="p-6 space-y-4">
                    <Button onClick={handleConfirmMaintenance} disabled={countdown > 0} className="w-full bg-red-600 hover:bg-red-700 text-white">
                        {countdown > 0 ? `Vui lòng đợi ${countdown}s...` : "XÁC NHẬN CHẠY"}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}

function SummaryCard({ label, value, icon: Icon, color, bg }: any) {
    return (
        <div className={`rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col justify-center ${bg}`}>
            <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 uppercase tracking-wide">
                <Icon className={`h-3.5 w-3.5 ${color}`} /> {label}
            </p>
            <p className={`mt-1.5 text-lg font-bold ${color}`}>
                {formatCurrency(value)}
            </p>
        </div>
    );
}