"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import { FileDown, FileSpreadsheet, Printer } from "lucide-react";
import { toast } from "react-hot-toast";
import { RevenueReportExporterV2 } from "@/lib/revenue-report-exporter-v2";
import type { RevenueReport } from "@/types/report.types";

interface RevenueExportMenuProps {
  data: RevenueReport;
  fromDate?: string;
  toDate?: string;
  className?: string;
}

export default function RevenueExportMenu({ data, fromDate, toDate, className = "" }: RevenueExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExcelExport = async () => {
    try {
      setIsExporting(true);
      RevenueReportExporterV2.exportToExcel(data, {
        title: "Báo Cáo Doanh Thu Bán Hàng",
        fromDate,
        toDate,
      });
      toast.success("✅ Xuất Excel thành công!");
      setShowMenu(false);
    } catch (error) {
      toast.error("❌ Xuất Excel thất bại!");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePDFExport = async () => {
    try {
      setIsExporting(true);
      RevenueReportExporter.exportToPDFA4(data, {
        title: "Báo cáo Doanh Thu Bán Hàng",
        fromDate,
        toDate,
      });
      toast.success("✅ Xuất PDF A4 thành công!");
      setShowMenu(false);
    } catch (error) {
      toast.error("❌ Xuất PDF A4 thất bại!");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleA5Export = async () => {
    try {
      setIsExporting(true);
      RevenueReportExporter.exportToPDFA5(data, {
        title: "Báo cáo Doanh Thu",
        fromDate,
        toDate,
      });
      toast.success("✅ Xuất PDF A5 thành công!");
      setShowMenu(false);
    } catch (error) {
      toast.error("❌ Xuất PDF A5 thất bại!");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExcelExport}
          disabled={isExporting}
          isLoading={isExporting}
          title="Xuất toàn bộ báo cáo sang Excel với 6 sheet"
        >
          <FileSpreadsheet className="mr-1 h-4 w-4" />
          Excel
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handlePDFExport}
          disabled={isExporting}
          isLoading={isExporting}
          title="Xuất báo cáo đầy đủ sang PDF A4 (4 trang)"
        >
          <FileDown className="mr-1 h-4 w-4" />
          PDF A4
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleA5Export}
          disabled={isExporting}
          isLoading={isExporting}
          title="Xuất báo cáo tóm tắt sang PDF A5 (in ấn nhỏ gọn)"
        >
          <Printer className="mr-1 h-4 w-4" />
          A5
        </Button>
      </div>

      {/* Tooltip info */}
      <div className="mt-2 rounded bg-blue-50 p-2 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
        💡 <strong>Excel:</strong> 6 sheet (Tóm tắt, Đơn hàng, Sản phẩm, Khách hàng, Kênh, Xu hướng) | <strong>PDF A4:</strong> 4 trang chi tiết | <strong>A5:</strong>
        In ấn nhỏ gọn
      </div>
    </div>
  );
}
