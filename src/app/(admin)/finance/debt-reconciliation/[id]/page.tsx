"use client";

import React, { useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
    ArrowLeft, Mail, User, Phone, MapPin,
    RotateCcw, Package, Receipt, RefreshCw, Printer,
    RotateCw, DatabaseZap, Calendar, FileText,
    AlertCircle, ShoppingBag, FileSpreadsheet,
    ArrowDownLeft, Scale
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
import { ReconciliationPrintTemplate } from "@/components/finance/ReconciliationPrintTemplate";
import type { DebtType } from "@/types/debt-reconciliation.types";

export default function ReconciliationDetailPage() {
    // ... (Giữ nguyên phần khai báo state, params, hooks ...) ...
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = Number(params.id);
    const type = (searchParams.get('type') as DebtType) || 'customer';
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [showEmailModal, setShowEmailModal] = useState(false);
    const componentRef = useRef<HTMLDivElement>(null);

    const { data: apiResponse, isLoading, refetch, isRefetching } = useDebtReconciliation(id, type, selectedYear);
    const rawResponse = apiResponse as any;
    const data = rawResponse?.data?.info 
        ? rawResponse.data 
        : (rawResponse?.info ? rawResponse : null);

    const { mutate: syncSnap, isPending: isSnapping } = useSyncSnap();
    const { mutate: syncFull, isPending: isFulling } = useSyncFull();
    const { mutate: sendEmail, isPending: isSendingEmail } = useSendReconciliationEmail();
    const isProcessing = isSnapping || isFulling;

    // ... (Giữ nguyên phần Actions: handlePrint, handleSyncSnap, handleSyncFull) ...
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Cong_No_${data?.info?.code || id}_${selectedYear}`,
    });

    const handleSyncSnap = () => {
        if (!data) return;
        if (confirm(`Tính lại số liệu NĂM ${selectedYear} cho khách hàng này?`)) {
            syncSnap({
                year: selectedYear,
                customerId: type === 'customer' ? id : undefined,
                supplierId: type === 'supplier' ? id : undefined,
            }, { onSuccess: () => refetch() });
        }
    };

    const handleSyncFull = () => {
        if (!data) return;
        if (confirm(`⚠️ QUÉT LẠI TOÀN BỘ LỊCH SỬ?\n\nHành động này sẽ tính toán lại từ đầu. Có thể mất thời gian.`)) {
            syncFull({
                year: selectedYear,
                customerId: type === 'customer' ? id : undefined,
                supplierId: type === 'supplier' ? id : undefined,
            }, { onSuccess: () => refetch() });
        }
    };

    // ... (Phần Render Loading & Error giữ nguyên) ...
    if (isLoading) return (
        <div className="flex flex-col h-96 items-center justify-center text-gray-400 gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <p>Đang tải hồ sơ công nợ...</p>
        </div>
    );
    
    if (!data || !data.info) return (
        <div className="flex h-96 items-center justify-center text-gray-500 flex-col gap-2">
            <AlertCircle className="h-10 w-10 text-gray-300" />
            <span>Không tìm thấy dữ liệu hoặc hồ sơ không tồn tại.</span>
            <Button variant="outline" onClick={() => router.back()}>Quay lại</Button>
        </div>
    );

    const info = data.info;
    const financials = data.financials || {};
    
    // ✅ UPDATE: Lấy thêm returns và adjustments từ history
    const history = data.history || { orders: [], payments: [], products: [], returns: [], adjustments: [] };
    const assignedUser = info.assignedUser;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-12 print:bg-white print:p-0">
            {/* ... (Phần Header giữ nguyên) ... */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 print:hidden">
                <div className="max-w-[1600px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/finance/debt-reconciliation" className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-gray-900">{info.name}</h1>
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold border bg-gray-100 text-gray-600 border-gray-200">
                                    {info.code}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${financials.status === 'unpaid' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                    {financials.status === 'unpaid' ? 'ĐANG NỢ' : 'ĐÃ THANH TOÁN'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                <div className="flex items-center gap-1">
                                    <UserCogIcon className="h-3.5 w-3.5" />
                                    <span>Phụ trách: {assignedUser?.fullName || "---"}</span>
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
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <div className="flex items-center gap-1 mr-2 pr-3 border-r border-gray-200">
                            <Button variant="ghost" onClick={handleSyncSnap} isLoading={isSnapping} disabled={isProcessing} className="text-indigo-600 hover:bg-indigo-50 h-9 gap-1 text-xs font-medium">
                                <RotateCw className={`h-3.5 w-3.5 ${isSnapping ? 'animate-spin' : ''}`} /> Tính lại số liệu
                            </Button>
                            <Button variant="ghost" onClick={handleSyncFull} isLoading={isFulling} disabled={isProcessing} className="text-orange-600 hover:bg-orange-50 h-9 gap-1 text-xs font-medium">
                                <DatabaseZap className="h-3.5 w-3.5" /> Quét lịch sử
                            </Button>
                        </div>
                        <Button variant="outline" onClick={() => refetch()} disabled={isRefetching} className="h-9 w-9 p-0 rounded-full border-gray-300 text-gray-500 mr-2">
                            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                        </Button>
                        <div className="flex items-center bg-white border border-gray-300 rounded-md overflow-hidden h-9 shadow-sm">
                            <button onClick={() => exportToExcel(data, `CongNo_${info.code}_${selectedYear}`)} className="px-3 h-full hover:bg-green-50 text-green-700 border-r border-gray-200 flex items-center gap-1.5 text-xs font-medium transition-colors" title="Xuất Excel">
                                <FileSpreadsheet className="h-4 w-4" /> Excel
                            </button>
                            <button onClick={() => exportToWord(data, `CongNo_${info.code}_${selectedYear}`)} className="px-3 h-full hover:bg-blue-50 text-blue-700 border-r border-gray-200 flex items-center gap-1.5 text-xs font-medium transition-colors" title="Xuất Word">
                                <FileText className="h-4 w-4" /> Word
                            </button>
                            <button onClick={() => handlePrint()} className="px-3 h-full hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 text-xs font-medium transition-colors" title="In / PDF">
                                <Printer className="h-4 w-4" /> Print
                            </button>
                        </div>
                        {/* <Button onClick={() => setShowEmailModal(true)} className="h-9 bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm ml-2">
                            <Mail className="h-4 w-4" /> Gửi Email
                        </Button> */}
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-6 space-y-6 print:hidden">
                {/* 2. INFO CARD & FINANCIALS (Update StatBox để hiện Trả hàng & Điều chỉnh) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                        {/* ... (Info Card giữ nguyên) ... */}
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-50 p-2.5 rounded-full">
                                <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-medium text-gray-500 uppercase">Thông tin đối tác</p>
                                <p className="font-bold text-gray-900 text-lg leading-tight mt-0.5">{info.name}</p>
                                <p className="text-sm text-gray-500">{info.code}</p>
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-3 space-y-3 text-sm">
                            <InfoRow icon={Phone} label="Điện thoại" value={info.phone} />
                            <InfoRow icon={Mail} label="Email" value={info.email} />
                            <div className="flex gap-3 items-start">
                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <span className="text-gray-900">{info.address || "---"}</span>
                                    {(info.address || info.province) && (
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {info.district && `${info.district}, `}
                                            {info.province && <span className="font-medium text-blue-600">{info.province}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                        <StatBox label="Nợ đầu kỳ" value={financials.opening} />
                        <StatBox label="Tổng mua (+)" value={financials.increase} color="text-blue-600" />
                        
                        {/* ✅ UPDATE: Hiện số liệu Trả hàng & Điều chỉnh */}
                        <StatBox label="Trả hàng (-)" value={financials.returnAmount} color="text-indigo-600" />
                        
                        <StatBox label="Thanh toán (-)" value={financials.payment} color="text-green-600" />
                        
                        <StatBox label="Điều chỉnh" value={financials.adjustmentAmount} color="text-purple-600" />
                        
                        <StatBox label="Dư nợ cuối kỳ (=)" value={financials.closing} color="text-red-600" isBig bg="bg-red-50" />
                    </div>
                </div>

                {/* 3. TABS DỮ LIỆU */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-h-[500px]">
                    <Tabs defaultValue="products" className="w-full">
                        <div className="border-b px-6 pt-2">
                            <TabsList className="bg-transparent gap-6 h-auto p-0">
                                <TabItem value="products" label="Sản phẩm đã mua" icon={ShoppingBag} count={history.products?.length || 0} />
                                <TabItem value="orders" label="Lịch sử mua hàng" icon={FileText} count={history.orders?.length || 0} />
                                <TabItem value="payments" label="Lịch sử thanh toán" icon={Receipt} count={history.payments?.length || 0} />
                                
                                {/* ✅ UPDATE: Thêm Tabs mới */}
                                <TabItem value="returns" label="Lịch sử trả hàng" icon={ArrowDownLeft} count={history.returns?.length || 0} />
                                <TabItem value="adjustments" label="Lịch sử điều chỉnh" icon={Scale} count={history.adjustments?.length || 0} />
                            </TabsList>
                        </div>

                        <TabsContent value="products" className="p-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <ProductHistoryTable data={history.products} />
                        </TabsContent>

                        <TabsContent value="orders" className="p-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <DocumentHistoryTable data={history.orders} type="ORDER" />
                        </TabsContent>

                        <TabsContent value="payments" className="p-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <DocumentHistoryTable data={history.payments} type="PAYMENT" />
                        </TabsContent>

                        {/* ✅ UPDATE: Content cho 2 tab mới */}
                        <TabsContent value="returns" className="p-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <DocumentHistoryTable data={history.returns} type="RETURN" />
                        </TabsContent>

                        <TabsContent value="adjustments" className="p-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <DocumentHistoryTable data={history.adjustments} type="ADJUSTMENT" />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Print & Email Modal (Giữ nguyên) */}
            <div style={{ display: "none" }}>
                <ReconciliationPrintTemplate ref={componentRef} data={data} year={selectedYear} />
            </div>
            <Modal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} className="max-w-lg p-0 overflow-hidden rounded-xl" showCloseButton={true}>
                <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">Gửi Email Đối chiếu</h3>
                </div>
                <div className="p-6">
                    {showEmailModal && (
                        <SendEmailForm
                            isLoading={isSendingEmail}
                            onCancel={() => setShowEmailModal(false)}
                            defaultEmail={info.email || ""}
                            defaultName={info.name}
                            onSubmit={async (formData) => {
                                await sendEmail({
                                    id,
                                    data: {
                                        type: type,
                                        year: formData.isReport ? new Date().getFullYear() : undefined,
                                        message: formData.message,
                                        customEmail: formData.customEmail
                                    }
                                });
                                setShowEmailModal(false);
                            }}
                        />
                    )}
                </div>
            </Modal>
        </div>
    );
}

// ... (Sub-components InfoRow, StatBox, TabItem, ProductHistoryTable giữ nguyên) ...
// (Lưu ý: StatBox đã được dùng ở trên, nên component con bên dưới không cần sửa gì thêm trừ khi muốn style lại)

// ✅ UPDATE: Cập nhật DocumentHistoryTable để hỗ trợ loại mới
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
                            prefix = item.type === 'decrease' ? '-' : '+'; // Tùy loại điều chỉnh
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

// ... (Sub-components khác giữ nguyên) ...
function UserCogIcon({ className }: { className?: string }) { return <UserCog className={className} />; }
function UserCog(props: any) { return <User {...props} /> } 

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

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm">Không có dữ liệu trong kỳ này.</p>
        </div>
    );
}