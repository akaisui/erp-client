"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import { FileDown, FileSpreadsheet, Printer } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-hot-toast";

interface ExportButtonProps {
  data: any[];
  filename: string;
  title?: string;
  subtitle?: string;
  columns?: Array<{ header: string; key: string; format?: (value: any) => string }>;
  format?: "excel" | "pdf" | "a5" | "both" | "all";
  className?: string;
  reportData?: any; // For rich report data (with summary, charts, etc)
}

export default function ExportButton({
  data,
  filename,
  title,
  subtitle,
  columns,
  format = "both",
  className = "",
  reportData,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Export to Excel with enhanced formatting
  const exportToExcel = () => {
    try {
      setIsExporting(true);

      // Transform data if columns provided
      let exportData = data;
      if (columns && columns.length > 0) {
        exportData = data.map((item) => {
          const row: Record<string, any> = {};
          columns.forEach((col) => {
            const value = item[col.key];
            row[col.header] = col.format ? col.format(value) : value;
          });
          return row;
        });
      }

      const wb = XLSX.utils.book_new();
      
      // Sheet 1: Data
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Add title and subtitle at top if provided
      if (title || subtitle) {
        const mergedData: any[] = [];
        if (title) mergedData.push([title]);
        if (subtitle) mergedData.push([subtitle]);
        mergedData.push([]); // Empty row
        
        XLSX.utils.sheet_add_aoa(ws, mergedData, { origin: "A1" });
        XLSX.utils.sheet_add_json(ws, exportData, { origin: "A4" });
      }

      // Set column widths
      const colWidths: number[] = [];
      (columns || Object.keys(data[0] || {})).forEach(() => {
        colWidths.push(20);
      });
      ws["!cols"] = colWidths.map((w) => ({ wch: w }));

      XLSX.utils.book_append_sheet(wb, ws, "Báo cáo");

      // Sheet 2: Summary (if reportData provided)
      if (reportData?.summary) {
        const summaryData = Object.entries(reportData.summary).map(([key, value]) => ({
          Chỉ_số: key,
          Giá_trị: value,
        }));
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Tóm tắt");
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const fullFilename = `${filename}_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(wb, fullFilename);

      toast.success("✅ Xuất Excel thành công!");
    } catch (error) {
      console.error("Export to Excel error:", error);
      toast.error("❌ Xuất Excel thất bại!");
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF A4 with table
  const exportToPDF = () => {
    try {
      setIsExporting(true);

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      let currentY = 15;

      // Add title
      if (title) {
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(title, 14, currentY);
        currentY += 8;
      }

      // Add subtitle
      if (subtitle) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(subtitle, 14, currentY);
        currentY += 8;
      }

      // Add export date
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`, 14, currentY);
      currentY += 4;

      // Prepare table data
      const tableColumns = columns
        ? columns.map((col) => col.header)
        : Object.keys(data[0] || {});

      const tableRows = data.map((item) => {
        if (columns) {
          return columns.map((col) => {
            const value = item[col.key];
            return col.format ? col.format(value) : value;
          });
        }
        return Object.values(item);
      });

      // Add table
      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: currentY,
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 2,
          halign: "left",
          valign: "middle",
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        margin: { top: currentY },
      });

      // Add footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const pageCount = (doc as any).internal.getNumberOfPages?.();
      if (pageCount) {
        doc.text(`Trang 1 của ${pageCount}`, 14, doc.internal.pageSize.getHeight() - 5);
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const fullFilename = `${filename}_${timestamp}.pdf`;

      // Save file
      doc.save(fullFilename);

      toast.success("✅ Xuất PDF thành công!");
    } catch (error) {
      console.error("Export to PDF error:", error);
      toast.error("❌ Xuất PDF thất bại!");
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF A5 (for printing small reports)
  const exportToA5 = () => {
    try {
      setIsExporting(true);

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a5", // 148x210mm
      });

      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = 8;

      // Add title (small)
      if (title) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(title, 7, currentY);
        currentY += 6;
      }

      // Add subtitle (small)
      if (subtitle) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const wrappedSubtitle = doc.splitTextToSize(subtitle, pageWidth - 14);
        doc.text(wrappedSubtitle, 7, currentY);
        currentY += wrappedSubtitle.length * 3 + 2;
      }

      // Add export date
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(`Xuất: ${new Date().toLocaleDateString("vi-VN")} ${new Date().toLocaleTimeString("vi-VN")}`, 7, currentY);
      currentY += 4;

      // Prepare table data (limited rows for A5)
      const maxRows = 15;
      const tableColumns = columns
        ? columns.map((col) => col.header)
        : Object.keys(data[0] || {}).slice(0, 4); // Only first 4 columns for A5

      const tableRows = data.slice(0, maxRows).map((item) => {
        if (columns) {
          return columns.slice(0, 4).map((col) => {
            const value = item[col.key];
            const formatted = col.format ? col.format(value) : value;
            // Truncate long text for A5
            return String(formatted).substring(0, 15);
          });
        }
        return Object.values(item).slice(0, 4).map(v => String(v).substring(0, 15));
      });

      // Add table
      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: currentY,
        styles: {
          font: "helvetica",
          fontSize: 6,
          cellPadding: 1,
          overflow: "hidden",
          halign: "left",
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 6,
          halign: "center",
        },
        columnStyles: {
          0: { halign: "left" },
          1: { halign: "right" },
          2: { halign: "right" },
          3: { halign: "right" },
        },
        margin: { top: currentY, left: 7, right: 7 },
        tableWidth: "wrap",
      });

      // Add footer
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      if (data.length > maxRows) {
        doc.text(`+ ${data.length - maxRows} bản ghi khác...`, 7, pageHeight - 3);
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const fullFilename = `${filename}_A5_${timestamp}.pdf`;

      // Save file
      doc.save(fullFilename);

      toast.success("✅ Xuất PDF A5 thành công!");
    } catch (error) {
      console.error("Export to A5 error:", error);
      toast.error("❌ Xuất PDF A5 thất bại!");
    } finally {
      setIsExporting(false);
    }
  };

  if (data.length === 0) {
    return (
      <Button variant="outline" disabled className={className}>
        <FileDown className="mr-2 h-4 w-4" />
        Không có dữ liệu
      </Button>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {(format === "excel" || format === "both" || format === "all") && (
        <Button
          variant="outline"
          onClick={exportToExcel}
          disabled={isExporting}
          isLoading={isExporting}
          size="sm"
        >
          <FileSpreadsheet className="mr-1 h-4 w-4" />
          Excel
        </Button>
      )}

      {(format === "pdf" || format === "both" || format === "all") && (
        <Button
          variant="outline"
          onClick={exportToPDF}
          disabled={isExporting}
          isLoading={isExporting}
          size="sm"
        >
          <FileDown className="mr-1 h-4 w-4" />
          PDF A4
        </Button>
      )}

      {(format === "a5" || format === "all") && (
        <Button
          variant="outline"
          onClick={exportToA5}
          disabled={isExporting}
          isLoading={isExporting}
          size="sm"
        >
          <Printer className="mr-1 h-4 w-4" />
          PDF A5
        </Button>
      )}
    </div>
  );
}
