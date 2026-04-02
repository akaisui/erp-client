import React from 'react';
import { useCheckDataIntegrity, useSyncFull } from "@/hooks/api/useDebtReconciliation";
import { AlertTriangle, CheckCircle, RefreshCw, Wrench, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function IntegrityWidget({ year }: { year: number }) {
  // 1. Dùng Hook lấy dữ liệu
  const { data: result, isLoading, refetch, isRefetching } = useCheckDataIntegrity(year);
  
  // 2. Hook sửa lỗi (SyncFull)
  const { mutate: syncFull, isPending: isFixing } = useSyncFull();

  // Loading state ban đầu
  if (isLoading) return (
    <div className="h-24 bg-gray-50/50 animate-pulse rounded-lg border border-gray-200 mb-4 flex flex-col items-center justify-center text-sm text-gray-500 gap-2">
      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      <span>Đang kiểm tra sức khỏe dữ liệu...</span>
    </div>
  );

  // Nếu không có kết quả hoặc API lỗi
  if (!result) return null;

  // ---------------------------------------------------------------------------
  // TRƯỜNG HỢP 1: DỮ LIỆU SẠCH (Màu xanh)
  // ---------------------------------------------------------------------------
  if (result.discrepanciesCount === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 mb-6 transition-all shadow-sm">
        <div className="bg-green-100 p-2 rounded-full">
            <CheckCircle className="text-green-600 w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-green-800 text-sm">Dữ liệu công nợ toàn vẹn</h4>
          <p className="text-xs text-green-700 mt-0.5">
            Đã kiểm tra <b>{result.totalChecked}</b> hồ sơ năm {year}. Hệ thống vận hành ổn định.
          </p>
        </div>
        <button 
           onClick={() => refetch()}
           disabled={isRefetching}
           className="text-green-700 hover:bg-green-100 p-2 rounded-full transition-colors"
           title="Kiểm tra lại"
        >
           <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // TRƯỜNG HỢP 2: CÓ LỖI (Màu đỏ)
  // ---------------------------------------------------------------------------
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 transition-all shadow-md">
      {/* Header Cảnh báo */}
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-red-100 p-2 rounded-full mt-0.5">
            <AlertTriangle className="text-red-600 w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-red-800 flex items-center gap-2 text-sm">
            Cảnh báo: Phát hiện {result.discrepanciesCount} lỗi dữ liệu!
            <span className="bg-red-200 text-red-800 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
              Cần xử lý
            </span>
          </h4>
          <p className="text-xs text-red-700 mt-1 leading-relaxed">
            Phát hiện sự sai lệch giữa số liệu tổng hợp và chi tiết. 
            Vui lòng bấm nút <b>"Sửa ngay"</b> ở danh sách dưới để hệ thống tự động đồng bộ lại.
          </p>
        </div>
        <button 
           onClick={() => refetch()}
           disabled={isRefetching}
           className="text-red-700 hover:bg-red-100 p-2 rounded-full transition-colors"
           title="Làm mới danh sách lỗi"
        >
           <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Danh sách lỗi (Table) */}
      <div className="max-h-60 overflow-y-auto bg-white rounded-md border border-red-100 shadow-sm scrollbar-thin scrollbar-thumb-gray-200">
        <table className="w-full text-sm text-left border-collapse">
           <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
             <tr className="text-gray-500 text-xs uppercase font-semibold">
               <th className="px-4 py-2 bg-gray-50">Đối tượng</th>
               <th className="px-4 py-2 bg-gray-50">Chi tiết lỗi</th>
               <th className="px-4 py-2 text-right bg-gray-50">Thao tác</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-100">
             {result.discrepancies.map((err, idx) => (
               <tr key={idx} className="hover:bg-red-50/30 group transition-colors duration-150">
                 
                 {/* Cột Tên Khách Hàng */}
                 <td className="px-4 py-3 align-top">
                    <div className="font-medium text-gray-900 text-xs sm:text-sm">
                        {err.customerName || "Không xác định"}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        MASTER ID: {err.masterId}
                    </div>
                 </td>

                 {/* Cột Lý Do Lỗi */}
                 <td className="px-4 py-3 align-top">
                    <div className="text-red-600 text-xs font-semibold mb-0.5">
                        {err.reason}
                    </div>
                    <div className="text-gray-500 text-[11px] leading-tight line-clamp-2" title={err.details}>
                        {err.details}
                    </div>
                 </td>

                 {/* Cột Action */}
                 <td className="px-4 py-3 text-right align-top">
                    <button 
                      disabled={isFixing}
                      onClick={() => {
                        // Logic xử lý thông minh: Kiểm tra Customer hay Supplier
                        if (err.customerId) {
                            syncFull({ customerId: err.customerId, year });
                        } else if (err.supplierId) {
                            syncFull({ supplierId: err.supplierId, year });
                        } else {
                            toast.error("Không tìm thấy ID đối tượng để sửa lỗi.");
                        }
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Wrench className="w-3 h-3" />
                      Sửa ngay
                    </button>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );
}