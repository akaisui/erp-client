"use client";

import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import {
    Mail, User, Phone, MapPin,
    RotateCcw, Package, Receipt, RefreshCw, Printer,
    RotateCw, DatabaseZap, Calendar, FileText,
    AlertCircle, ShoppingBag, FileSpreadsheet,
    ArrowDownLeft, Scale, X, UserCog
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { 
    useDebtReconciliation, 
    useSendReconciliationEmail,
    useSyncSnap, 
    useSyncFull 
} from "@/hooks/api/useDebtReconciliation";
import { formatCurrency } from "@/lib/utils";
import { exportToExcel, exportToWord } from "@/utils/export-reconciliation";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { SendEmailForm } from "@/components/finance/ReconciliationModals";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import type { DebtType } from "@/types/debt-reconciliation.types";

interface ViewDebtReconciliationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    id: number | null;
    type: DebtType;
    year?: number;
}

export function ViewDebtReconciliationDialog({
    isOpen,
    onClose,
    id,
    type,
    year
}: ViewDebtReconciliationDialogProps) {
    const [selectedYear, setSelectedYear] = useState<number>(year || new Date().getFullYear());
    const [showEmailModal, setShowEmailModal] = useState(false);
    const componentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (year) setSelectedYear(year);
    }, [year]);

    const { data: apiResponse, isLoading, refetch, isRefetching } = useDebtReconciliation(id, type, selectedYear);
    const rawResponse = apiResponse as any;
    const data = rawResponse?.data?.info 
        ? rawResponse.data 
        : (rawResponse?.info ? rawResponse : null);

    const { mutate: syncSnap, isPending: isSnapping } = useSyncSnap();
    const { mutate: syncFull, isPending: isFulling } = useSyncFull();
    const { mutate: sendEmail, isPending: isSendingEmail } = useSendReconciliationEmail();
    const isProcessing = isSnapping || isFulling;

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Cong_No_${data?.info?.code || id}_${selectedYear}`,
    });

    const handleSyncSnap = () => {
        if (!data || !id) return;
        if (confirm(`Tính lại số liệu NĂM ${selectedYear} cho khách hàng này?`)) {
            syncSnap({
                year: selectedYear,
                customerId: type === 'customer' ? id : undefined,
                supplierId: type === 'supplier' ? id : undefined,
            }, { onSuccess: () => refetch() });
        }
    };

    const handleSyncFull = () => {
        if (!data || !id) return;
        if (confirm(`⚠️ QUÉT LẠI TOÀN BỘ LỊCH SỬ?\n\nHành động này sẽ tính toán lại từ đầu. Có thể mất thời gian.`)) {
            syncFull({
                year: selectedYear,
                customerId: type === 'customer' ? id : undefined,
                supplierId: type === 'supplier' ? id : undefined,
            }, { onSuccess: () => refetch() });
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="!max-w-none w-[98vw] h-[95vh] flex flex-col p-0 overflow-hidden"
            showCloseButton={true}
        >
            {/* Header - Match UserDialog style */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-4">
                    {isLoading ? (
                        <div className="h-10 w-48 bg-gray-100 animate-pulse rounded"></div>
                    ) : data?.info ? (
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{data.info.name}</h2>
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold border bg-gray-100 text-gray-600 border-gray-200">
                                    {data.info.code}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${data.financials?.status === 'unpaid' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                    {data.financials?.status === 'unpaid' ? 'ĐANG NỢ' : 'ĐÃ THANH TOÁN'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                <div className="flex items-center gap-1 font-medium">
                                    <UserCog className="h-3.5 w-3.5" />
                                    <span>Phụ trách: {data.info.assignedUser?.fullName || "---"}</span>
                                </div>
                                <span className="text-gray-300">|</span>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>Kỳ dữ liệu:</span>
                                    <select 
                                        value={selectedYear} 
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="bg-gray-50 border border-gray-200 rounded px-1 py-0.5 text-xs font-semibold text-gray-900 cursor-pointer hover:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        {Array.from({ length: 5 }).map((_, i) => {
                                            const y = new Date().getFullYear() - i;
                                            return <option key={y} value={y}>{y}</option>;
                                        })}
                                    </select>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-red-500 font-bold">Lỗi tải dữ liệu</div>
                    )}
                </div>

                <div className="flex items-center gap-2 mr-8">
                    <div className="flex items-center gap-1 mr-2 pr-3 border-r border-gray-200">
                        <button onClick={handleSyncSnap} disabled={isProcessing || !data} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors">
                            <RotateCw className={`h-3.5 w-3.5 ${isSnapping ? 'animate-spin' : ''}`} /> Tính lại
                        </button>
                        <button onClick={handleSyncFull} disabled={isProcessing || !data} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors">
                            <DatabaseZap className="h-3.5 w-3.5" /> Quét lịch sử
                        </button>
                    </div>
                    <button onClick={() => refetch()} disabled={isRefetching || !data} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                        <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="flex items-center bg-white border border-gray-300 rounded-md overflow-hidden shadow-sm h-9">
                        <button onClick={() => data && exportToExcel(data, `CongNo_${data.info.code}_${selectedYear}`)} disabled={!data} className="px-3 h-full hover:bg-green-50 text-green-700 border-r border-gray-200 flex items-center gap-1.5 text-xs font-medium transition-colors">
                            <FileSpreadsheet className="h-4 w-4" /> Excel
                        </button>
                        <button onClick={() => data && handlePrint()} disabled={!data} className="px-3 h-full hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 text-xs font-medium transition-colors">
                            <Printer className="h-4 w-4" /> Print
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
                {isLoading ? (
                    <div className="flex flex-col h-full items-center justify-center text-gray-400 gap-3">
                        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                        <p className="font-medium">Đang tải hồ sơ công nợ...</p>
                    </div>
                ) : !data || !data.info ? (
                    <div className="flex h-full items-center justify-center text-gray-500 flex-col gap-2">
                        <AlertCircle className="h-10 w-10 text-gray-300" />
                        <span className="font-medium">Không tìm thấy dữ liệu hoặc hồ sơ không tồn tại.</span>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Info Card & Financials */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="bg-blue-50 p-2.5 rounded-full">
                                        <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thông tin đối tác</p>
                                        <p className="font-bold text-gray-900 text-lg leading-tight mt-1">{data.info.name}</p>
                                        <p className="text-sm text-gray-500 font-mono">{data.info.code}</p>
                                    </div>
                                </div>
                                <div className="border-t border-gray-100 pt-3 space-y-3 text-sm">
                                    <InfoRow icon={Phone} label="Điện thoại" value={data.info.phone} />
                                    <InfoRow icon={Mail} label="Email" value={data.info.email} />
                                    <div className="flex gap-3 items-start">
                                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <span className="text-gray-900">{data.info.address || "---"}</span>
                                            {(data.info.address || data.info.province) && (
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {data.info.district && `${data.info.district}, `}
                                                    {data.info.province && <span className="font-bold text-blue-600">{data.info.province}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                <StatBox label="Nợ đầu kỳ" value={data.financials?.opening} />
                                <StatBox label="Tổng mua (+)" value={data.financials?.increase} color="text-blue-600" />
                                <StatBox label="Trả hàng (-)" value={data.financials?.returnAmount} color="text-indigo-600" />
                                <StatBox label="Thanh toán (-)" value={data.financials?.payment} color="text-green-600" />
                                <StatBox label="Điều chỉnh" value={data.financials?.adjustmentAmount} color="text-purple-600" />
                                <StatBox label="Dư nợ cuối kỳ (=)" value={data.financials?.closing} color="text-red-600" isBig bg="bg-red-50" />
                            </div>
                        </div>

                        {/* Tabs Data */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-h-[400px]">
                            <Tabs defaultValue="products" className="w-full">
                                <div className="border-b px-6 pt-2">
                                    <TabsList className="bg-transparent gap-6 h-auto p-0">
                                        <TabItem value="products" label="Sản phẩm" icon={ShoppingBag} count={data.history?.products?.length || 0} />
                                        <TabItem value="orders" label="Đơn hàng" icon={FileText} count={data.history?.orders?.length || 0} />
                                        <TabItem value="payments" label="Thanh toán" icon={Receipt} count={data.history?.payments?.length || 0} />
                                        <TabItem value="returns" label="Trả hàng" icon={ArrowDownLeft} count={data.history?.returns?.length || 0} />
                                        <TabItem value="adjustments" label="Điều chỉnh" icon={Scale} count={data.history?.adjustments?.length || 0} />
                                    </TabsList>
                                </div>

                                <TabsContent value="products" className="p-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <ProductHistoryTable data={data.history?.products} />
                                </TabsContent>

                                <TabsContent value="orders" className="p-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <DocumentHistoryTable data={data.history?.orders} type="ORDER" />
                                </TabsContent>

                                <TabsContent value="payments" className="p-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <DocumentHistoryTable data={data.history?.payments} type="PAYMENT" />
                                </TabsContent>

                                <TabsContent value="returns" className="p-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <DocumentHistoryTable data={data.history?.returns} type="RETURN" />
                                </TabsContent>

                                <TabsContent value="adjustments" className="p-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <DocumentHistoryTable data={data.history?.adjustments} type="ADJUSTMENT" />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer - Match UserDialog style */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    Đóng
                </button>
            </div>
        </Modal>
    );
}

function InfoRow({ label, value, icon: Icon }: any) {
    return (
        <div className="flex gap-3 items-center">
            <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1 flex justify-between">
                <span className="text-gray-500">{label}:</span>
                <span className="font-medium text-gray-900 truncate max-w-[200px]" title={value}>{value || "---"}</span>
            </div>
        </div>
    );
}

function StatBox({ label, value, color = "text-gray-900", isBig = false, bg = "bg-white" }: any) {
    return (
        <div className={`${bg} p-4 flex flex-col justify-center items-center text-center h-28 hover:bg-gray-50 transition-colors`}>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{label}</span>
            <span className={`font-bold tracking-tight ${color} ${isBig ? 'text-2xl' : 'text-xl'}`}>
                {formatCurrency(value)}
            </span>
        </div>
    );
}

function TabItem({ value, label, icon: Icon, count }: any) {
    return (
        <TabsTrigger 
            value={value} 
            className="group flex items-center gap-2 border-b-2 border-transparent px-1 pb-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none transition-all"
        >
            <Icon className="h-4 w-4" />
            {label}
            {count > 0 && (
                <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 group-data-[state=active]:bg-blue-100 group-data-[state=active]:text-blue-600">
                    {count}
                </span>
            )}
        </TabsTrigger>
    );
}

function ProductHistoryTable({ data }: { data: any[] }) {
    if (!data || data.length === 0) return <EmptyState />;
    
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-gray-50/50">
                    <TableRow>
                        <TableCell isHeader className="pl-6 w-[300px]">Sản phẩm</TableCell>
                        <TableCell isHeader>Ngày mua</TableCell>
                        <TableCell isHeader>Mã đơn</TableCell>
                        <TableCell isHeader className="text-right">SL</TableCell>
                        <TableCell isHeader className="text-right">Đơn giá</TableCell>
                        <TableCell isHeader className="text-right pr-6">Thành tiền</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-gray-50/50">
                            <TableCell className="pl-6 align-top">
                                <div className="font-medium text-gray-900">{item.productName}</div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5">{item.sku}</div>
                            </TableCell>
                            <TableCell className="text-gray-600 text-xs">
                                {format(new Date(item.date), "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell>
                                <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                    {item.orderCode}
                                </span>
                            </TableCell>
                            <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                            <TableCell className="text-right text-gray-600 text-xs">{formatCurrency(item.price)}</TableCell>
                            <TableCell className="text-right font-bold text-gray-900 pr-6">
                                {formatCurrency(item.quantity * item.price)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function DocumentHistoryTable({ data, type }: { data: any[], type: 'ORDER' | 'PAYMENT' | 'RETURN' | 'ADJUSTMENT' }) {
    if (!data || data.length === 0) return <EmptyState />;

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-gray-50/50">
                    <TableRow>
                        <TableCell isHeader className="pl-6">Mã chứng từ</TableCell>
                        <TableCell isHeader>Thời gian</TableCell>
                        <TableCell isHeader>Nội dung / Ghi chú</TableCell>
                        <TableCell isHeader className="text-right pr-6">Giá trị</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item: any) => {
                        const code = item.orderCode || item.poCode || item.receiptCode || item.voucherCode || item.code || `#${item.id}`;
                        const date = item.orderDate || item.receiptDate || item.paymentDate || item.date;
                        const amount = item.totalAmount || item.amount;
                        
                        let note = item.notes || item.note || item.reason || "";
                        if (!note) {
                            if (type === 'ORDER') note = "Đơn hàng bán";
                            else if (type === 'PAYMENT') note = "Phiếu thu/chi";
                            else if (type === 'RETURN') note = "Phiếu trả hàng";
                            else if (type === 'ADJUSTMENT') note = "Phiếu điều chỉnh";
                        }

                        let amountColor = 'text-gray-900';
                        let prefix = '';
                        
                        if (type === 'ORDER') { amountColor = 'text-blue-600'; prefix = '+'; } 
                        else if (type === 'PAYMENT') { amountColor = 'text-green-600'; prefix = '-'; } 
                        else if (type === 'RETURN') { amountColor = 'text-indigo-600'; prefix = '-'; } 
                        else if (type === 'ADJUSTMENT') { 
                            amountColor = 'text-purple-600'; 
                            prefix = item.type === 'decrease' ? '-' : '+'; 
                        }

                        return (
                            <TableRow key={item.id} className="hover:bg-gray-50/50">
                                <TableCell className="pl-6 font-medium text-blue-600">{code}</TableCell>
                                <TableCell className="text-gray-600 text-sm">
                                    {date ? format(new Date(date), "dd/MM/yyyy HH:mm") : "-"}
                                </TableCell>
                                <TableCell className="text-gray-600 max-w-[300px] truncate">{note}</TableCell>
                                <TableCell className={`text-right font-bold pr-6 ${amountColor}`}>
                                    {prefix}{formatCurrency(amount)}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm">Không có dữ liệu trong kỳ này.</p>
        </div>
    );
}
