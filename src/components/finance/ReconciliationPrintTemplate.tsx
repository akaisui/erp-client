import React from 'react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

interface Props {
  data: any; 
  year?: number;
  title?: string;
}

// ✅ Thêm title và year vào trong dấu ngoặc nhọn
export const ReconciliationPrintTemplate = React.forwardRef<HTMLDivElement, Props>(({ data, title, year }, ref) => {
  if (!data || data.length === 0) {
      return <div ref={ref}>Đang tải dữ liệu in...</div>;
  }

  const { info, financials, history, periodName } = data;

  // --- 1. CHUẨN BỊ DỮ LIỆU (GỘP 4 NGUỒN VÀO 1 DANH SÁCH DUY NHẤT) ---
  const allItems = [
    // A. Mua hàng (Tăng)
    ...(history.products || []).map((p: any) => ({
      date: p.date,
      name: p.productName,
      unit: 'Cái', 
      qty: p.quantity,
      price: Number(p.price),
      increase: Number(p.quantity) * Number(p.price), // Cột Tăng
      decrease: 0,
      note: p.orderCode || ''
    })),
    // B. Thanh toán (Giảm)
    ...(history.payments || []).map((pay: any) => ({
      date: pay.receiptDate || pay.paymentDate,
      name: `Thanh toán (${pay.receiptCode || pay.voucherCode})`,
      unit: '', qty: '', price: 0,
      increase: 0,
      decrease: Number(pay.amount), // Cột Giảm
      note: pay.notes || ''
    })),
    // C. Trả hàng (Giảm) - ✅ Đưa vào cột Giảm
    ...(history.returns || []).map((ret: any) => ({
      date: ret.date,
      name: `Trả hàng (${ret.code})`,
      unit: '', qty: '', price: 0,
      increase: 0,
      decrease: Number(ret.amount), // Cột Giảm
      note: ret.note || ''
    })),
    // D. Điều chỉnh (Tăng/Giảm) - ✅ Tùy loại
    ...(history.adjustments || []).map((adj: any) => ({
      date: adj.date,
      name: `Điều chỉnh (${adj.code})`,
      unit: '', qty: '', price: 0,
      increase: adj.type === 'increase' ? Number(adj.amount) : 0, 
      decrease: adj.type !== 'increase' ? Number(adj.amount) : 0,
      note: adj.reason || ''
    }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // --- 2. TÍNH TỔNG ---
  const totalIncrease = allItems.reduce((sum, item) => sum + item.increase, 0);
  const totalDecrease = allItems.reduce((sum, item) => sum + item.decrease, 0);

  return (
    <div ref={ref} className="hidden print:block font-serif text-sm text-gray-900 bg-white p-8 max-w-[210mm] mx-auto leading-snug">
      
      {/* --- HEADER CÔNG TY --- */}
      <div className="flex gap-4 mb-6 border-b-2 border-gray-300 pb-4">
        <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo/logo-nobackground.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 text-center space-y-1">
            <h2 className="text-2xl font-bold uppercase" style={{ color: '#008000' }}>CÔNG TY CỔ PHẦN HÓA SINH NAM VIỆT</h2>
            <p className="font-semibold text-base" style={{ color: '#002060' }}>Quốc Lộ 30, ấp Đông Mỹ, xã Mỹ Thọ, tỉnh Đồng Tháp</p>
            <p className="font-bold text-base" style={{ color: '#C00000' }}>088 635 7788 - 0868 759 588</p>
            <h1 className="text-2xl font-bold uppercase mt-4 text-red-600">
            { title || `BẢNG TỔNG HỢP CÔNG NỢ NĂM ${year || periodName}`}
        </h1>
        </div>
      </div>

      {/* --- TIÊU ĐỀ --- */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold uppercase mb-1" style={{ color: '#FF0000' }}>ĐỐI CHIẾU CÔNG NỢ KHÁCH HÀNG</h1>
        <p className="italic text-gray-500 text-xs">Năm tài chính: {periodName}</p>
      </div>

      {/* --- INFO KHÁCH HÀNG --- */}
      <div className="mb-6 ml-2">
        <div className="grid grid-cols-[130px_1fr] gap-y-1.5">
            <div className="font-medium">Tên khách hàng:</div>
            <div className="font-bold text-lg uppercase" style={{ color: '#002060' }}>{info.name}</div>
            <div className="font-medium">Địa chỉ:</div>
            <div>{[info.address, info.district, info.province].filter(Boolean).join(', ')}</div>
            <div className="font-medium">Điện thoại:</div>
            <div>{info.phone}</div>
        </div>
      </div>

      {/* --- BẢNG CHI TIẾT --- */}
      <table className="w-full border-collapse border border-gray-400 text-xs mb-6">
        <thead>
            <tr className="uppercase font-bold text-center h-10" style={{ backgroundColor: '#FFFF00', color: '#002060' }}>
                <th className="border border-gray-400 w-8">STT</th>
                <th className="border border-gray-400 w-20">Ngày</th>
                <th className="border border-gray-400">Diễn giải</th>
                <th className="border border-gray-400 w-10">ĐVT</th>
                <th className="border border-gray-400 w-10">SL</th>
                <th className="border border-gray-400 w-20">Đơn Giá</th>
                <th className="border border-gray-400 w-24">Phát sinh (+)</th>
                <th className="border border-gray-400 w-24">Đã trả/Giảm (-)</th>
                <th className="border border-gray-400 w-24">Ghi Chú</th>
            </tr>
        </thead>
        <tbody>
            {/* 1. Dòng Dư nợ đầu kỳ */}
            <tr className="h-8 bg-gray-50">
                <td className="border border-gray-400 text-center">-</td>
                <td className="border border-gray-400 text-center text-gray-500 italic">01/01</td>
                <td className="border border-gray-400 px-2 font-bold italic" style={{ color: '#FF0000' }}>
                    Dư nợ đầu kỳ
                </td>
                <td className="border border-gray-400"></td>
                <td className="border border-gray-400"></td>
                <td className="border border-gray-400"></td>
                <td className="border border-gray-400 px-2 text-right font-medium">
                    {Number(financials.opening) > 0 ? formatCurrency(financials.opening) : ''}
                </td>
                <td className="border border-gray-400 px-2 text-right font-medium">
                     {Number(financials.opening) < 0 ? formatCurrency(Math.abs(Number(financials.opening))) : ''}
                </td>
                <td className="border border-gray-400"></td>
            </tr>

            {/* 2. Danh sách chi tiết */}
            {allItems.length > 0 ? (
                allItems.map((item, index) => (
                    <tr key={index} className="h-8 hover:bg-gray-50">
                        <td className="border border-gray-400 text-center">{index + 1}</td>
                        <td className="border border-gray-400 text-center">
                            {format(new Date(item.date), 'dd/MM/yyyy')}
                        </td>
                        <td className="border border-gray-400 px-2 font-medium">
                            {item.name}
                        </td>
                        <td className="border border-gray-400 text-center">{item.unit}</td>
                        <td className="border border-gray-400 text-center">{item.qty}</td>
                        <td className="border border-gray-400 px-2 text-right">
                            {item.price ? formatCurrency(item.price) : ''}
                        </td>
                        <td className="border border-gray-400 px-2 text-right">
                            {item.increase > 0 ? formatCurrency(item.increase) : ''}
                        </td>
                        <td className="border border-gray-400 px-2 text-right">
                            {item.decrease > 0 ? formatCurrency(item.decrease) : ''}
                        </td>
                        <td className="border border-gray-400 px-1 text-center text-[10px] text-gray-500">
                            {item.note}
                        </td>
                    </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={9} className="border border-gray-400 py-8 text-center text-gray-400 italic">
                        Không có giao dịch phát sinh trong kỳ
                    </td>
                </tr>
            )}

            {/* 3. Tổng Phát sinh trong kỳ */}
            <tr className="h-9 font-bold bg-gray-100">
                <td colSpan={6} className="border border-gray-400 text-center uppercase">
                    TỔNG PHÁT SINH TRONG KỲ
                </td>
                <td className="border border-gray-400 px-2 text-right text-blue-800">
                    {formatCurrency(totalIncrease)}
                </td>
                <td className="border border-gray-400 px-2 text-right text-green-800">
                    {formatCurrency(totalDecrease)}
                </td>
                <td className="border border-gray-400"></td>
            </tr>

            {/* 4. Dư nợ cuối kỳ */}
            <tr className="h-12 text-base bg-red-50">
                <td colSpan={6} className="border border-gray-400 text-center font-bold uppercase text-red-700">
                    TỔNG DƯ NỢ PHẢI THANH TOÁN
                </td>
                <td colSpan={2} className="border border-gray-400 px-2 text-center font-bold text-xl text-red-700">
                    {formatCurrency(financials.closing)}
                </td>
                <td className="border border-gray-400"></td>
            </tr>
        </tbody>
      </table>

      {/* --- FOOTER --- */}
      <div className="mt-8">
          <div className="flex justify-end mb-4 italic text-xs">
              <p>Đồng Tháp, ngày {format(new Date(), 'dd')} tháng {format(new Date(), 'MM')} năm {format(new Date(), 'yyyy')}</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="font-bold uppercase text-sm mb-20">Khách hàng</p><p className="italic text-xs text-gray-500">(Ký và ghi rõ họ tên)</p></div>
              <div><p className="font-bold uppercase text-sm mb-20">Kế toán lập phiếu</p><p className="italic text-xs text-gray-500">(Ký và ghi rõ họ tên)</p></div>
              <div><p className="font-bold uppercase text-sm mb-20">Giám đốc</p><p className="italic text-xs text-gray-500">(Ký và đóng dấu)</p></div>
          </div>
      </div>
    </div>
  );
});

ReconciliationPrintTemplate.displayName = 'ReconciliationPrintTemplate';