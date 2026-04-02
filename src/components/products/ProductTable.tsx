"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { Product, ProductType } from "@/types";
import Badge from "@/components/ui/badge/Badge";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import { formatCurrency } from "@/lib/utils";
import { ChevronUp, ChevronDown, ChevronsUpDown, Eye, Edit, Delete, DeleteIcon, Trash2, AlertCircle, MoreVertical, Printer, CheckCircle, XCircle, Edit2 } from "lucide-react";
import { getImagePath } from "@/lib/utils";
import { useToggleProductStatus } from "@/hooks/api";
import toast from "react-hot-toast";

// Import BadgeColor type from Badge component
type BadgeColor = 
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "dark"
  | "blue"
  | "green"
  | "yellow"
  | "orange"
  | "purple"
  | "red"
  | "gray";

const columnHelper = createColumnHelper<Product>();

interface ProductTableProps {
  data: Product[];
  name?: string;
  urlProduct?: string;
  isLoading?: boolean;
  onDelete?: (product: Product) => void;
  onSelectionChange?: (selectedIds: number[]) => void;
  enableSelection?: boolean;
  onStatusChange?: (productId: number, status: string) => void;
}

export function ProductTable({
  data,
  name,
  urlProduct,
  isLoading = false,
  onDelete,
  onSelectionChange,
  enableSelection = true,
  onStatusChange,
}: ProductTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  
  // Status confirmation dialog state
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    product: Product;
    newStatus: "active" | "inactive" | "discontinued";
  } | null>(null);
  
  const toggleStatus = useToggleProductStatus();

  // Notify parent of selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedIds = Object.keys(rowSelection)
        .filter((key) => rowSelection[key])
        .map((key) => data[parseInt(key)]?.id)
        .filter(Boolean);
      onSelectionChange(selectedIds);
    }
  }, [rowSelection, data, onSelectionChange]);

  // Product type labels & colors
  const getTypeLabel = (type: ProductType) => {
    const labels: Record<ProductType, string> = {
      raw_material: "Nguyên liệu",
      packaging: "Bao bì",
      finished_product: "Thành phẩm",
      goods: "Hàng hóa",
    };
    return labels[type];
  };
  
  const getPackagingTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      bottle: "Chai/Lọ",
      box: "Hộp/Thùng",
      bag: "Túi",
      label: "Tem/Nhãn",
      other: "Khác",
    };
    return labels[type || "other"] || "Khác";
  };

  const getPackagingTypeBadgeColor = (type?: string): BadgeColor => {
    const colors: Record<string, BadgeColor> = {
      bottle: "blue",
      box: "orange",
      bag: "gray",
      label: "yellow",
      other: "light",
    };
    return colors[type || "other"] || "light";
  };

  const getStatusBadgeColor = (status: string): BadgeColor => {
    const colors: Record<string, BadgeColor> = {
      active: "green",
      inactive: "gray",
      discontinued: "red",
    };
    return colors[status] || "gray";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: "Hoạt động",
      inactive: "Tạm ngưng",
      discontinued: "Ngừng kinh doanh",
    };
    return labels[status] || status;
  };

  // Helper function to calculate total quantity from inventory
  const getTotalQuantity = (inventory?: any[]) => {
    if (!inventory || inventory.length === 0) return 0;
    return inventory.reduce((sum, inv) => sum + (Number(inv.quantity) || 0), 0);
  };

  // Helper function to get stock status color
  const getStockStatusColor = (quantity: number, minStockLevel?: number) => {
    if (quantity === 0) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    if (minStockLevel && quantity <= minStockLevel) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  };

  const getStockStatusLabel = (quantity: number, minStockLevel?: number) => {
    if (quantity === 0) return "Hết hàng";
    if (minStockLevel && quantity <= minStockLevel) return "Tồn kho thấp";
    return "Bình thường";
  };

  // Handler functions
  const handlePrintBarcode = (product: Product) => {
    if (!product.barcode) {
      toast.error("Sản phẩm không có mã vạch!");
      return;
    }

    const printWindow = window.open('', '', 'width=400,height=300');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>In mã vạch - ${product.productName}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              h3 { margin: 10px 0; }
              svg { max-width: 300px; }
            </style>
          </head>
          <body>
            <h3>${product.productName}</h3>
            <p>SKU: ${product.sku}</p>
            <p>Mã vạch: ${product.barcode || 'N/A'}</p>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
            <svg id="barcode"><\/svg>
            <script>
              if('${product.barcode}') {
                JsBarcode("#barcode", '${product.barcode}', { format: "CODE128" });
              }
              window.print();
            <\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
    setOpenDropdownId(null);
  };

  const handleToggleStatus = (product: Product) => {
    const newStatus = product.status === "active" ? "inactive" : "active";
    setPendingStatusChange({ product, newStatus });
    setIsStatusConfirmOpen(true);
    setOpenDropdownId(null);
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    
    toggleStatus.mutate({ id: pendingStatusChange.product.id, newStatus: pendingStatusChange.newStatus }, {
      onSuccess: () => {
        onStatusChange?.(pendingStatusChange.product.id, pendingStatusChange.newStatus);
        setIsStatusConfirmOpen(false);
        setPendingStatusChange(null);
      },
      onError: (error: any) => {
        toast.error(error?.message || "Lỗi khi cập nhật trạng thái");
      },
    });
  };

  const handleCloseStatusConfirm = () => {
    setIsStatusConfirmOpen(false);
    setPendingStatusChange(null);
  };

  // Define columns
  const columns = React.useMemo(
    () => [
      // Selection column
      ...(enableSelection
        ? [
            columnHelper.display({
              id: "select",
              header: ({ table }) => {
                const ref = useRef<HTMLInputElement>(null);

                useEffect(() => {
                    if(ref.current) {
                        ref.current.indeterminate = table.getIsSomeRowsSelected();
                    }
                }, [table.getIsSomeRowsSelected()]);

                return (
                    <input
                      ref={ref}
                      type="checkbox"
                      checked={table.getIsAllRowsSelected()}
                      onChange={table.getToggleAllRowsSelectedHandler()}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                )
              },
              cell: ({ row }) => (
                <input
                  type="checkbox"
                  checked={row.getIsSelected()}
                  disabled={!row.getCanSelect()}
                  onChange={row.getToggleSelectedHandler()}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              ),
              size: 40,
            }),
          ]
        : []),

      // Image column
      columnHelper.accessor("images", {
        id: "image",
        header: "Ảnh",
        cell: (info) => {
          const primaryImage = info.getValue()?.find((img) => img.isPrimary);
          const imageUrl = primaryImage?.imageUrl || info.getValue()?.[0]?.imageUrl;
          const imageFullPath = getImagePath(imageUrl || "");

          return imageFullPath ? (
            <img
              src={imageFullPath}
              alt={info.row.original.productName}
              className="h-12 w-12 rounded object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
              <svg
                className="h-6 w-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
          );
        },
        enableSorting: false,
        size: 80,
      }),

      // SKU column
      columnHelper.accessor("sku", {
        header: "SKU",
        cell: (info) => (
          <Link
            href={`/${urlProduct}/${info.row.original.id}`}
            className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            {info.getValue()}
          </Link>
        ),
        size: 120,
      }),

      // Name column
      columnHelper.accessor("productName", {
        header: name || "Tên sản phẩm",
        cell: (info) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {info.getValue()}
            </div>
            {info.row.original.barcode && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {info.row.original.barcode}
              </div>
            )}
          </div>
        ),
        size: 250,
      }),

      // Packaging Type column (only for packaging products)
      ...(data.length > 0 && data.some(p => p.productType === "packaging")
        ? [
            columnHelper.accessor("packagingType", {
              id: "packagingType",
              header: "Loại bao bì",
              cell: (info) => {
                // Only show for packaging products
                if (info.row.original.productType !== "packaging") {
                  return <span className="text-gray-400">—</span>;
                }
                return (
                  <Badge color={getPackagingTypeBadgeColor(info.getValue())}>
                    {getPackagingTypeLabel(info.getValue())}
                  </Badge>
                );
              },
              size: 130,
            }),
          ]
        : []),

      // Category column
      columnHelper.accessor("category.categoryName", {
        id: "category",
        header: "Danh mục",
        cell: (info) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {info.getValue() || "—"}
          </span>
        ),
        size: 150,
      }),

      // Unit column
      columnHelper.accessor("unit", {
        header: "Đơn vị",
        cell: (info) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {info.getValue()}
          </span>
        ),
        size: 80,
      }),

      // Price column
      columnHelper.accessor("purchasePrice", {
        header: "Giá nhập",
        cell: (info) => {
          const price = info.getValue();
          return price ? (
            <span className="font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(price as number)}
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          );
        },
        size: 120,
      }),

      // Retail Price column (only for finished_product & goods)
      ...(data.length > 0 && data.some(p => p.productType === "finished_product" || p.productType === "goods")
        ? [
            columnHelper.accessor("sellingPriceRetail", {
              id: "sellingPriceRetail",
              header: "Giá bán",
              cell: (info) => {
                // Only show for finished_product & goods
                if (info.row.original.productType !== "finished_product" && info.row.original.productType !== "goods") {
                  return <span className="text-gray-400">—</span>;
                }
                const price = info.getValue();
                return price ? (
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {formatCurrency(price as number)}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                );
              },
              size: 120,
            }),
          ]
        : []),

      // // Wholesale Price column (only for finished_product & goods)
      // ...(data.length > 0 && data.some(p => p.productType === "finished_product" || p.productType === "goods")
      //   ? [
      //       columnHelper.accessor("sellingPriceWholesale", {
      //         id: "sellingPriceWholesale",
      //         header: "Giá sỉ",
      //         cell: (info) => {
      //           // Only show for finished_product & goods
      //           if (info.row.original.productType !== "finished_product" && info.row.original.productType !== "goods") {
      //             return <span className="text-gray-400">—</span>;
      //           }
      //           const price = info.getValue();
      //           return price ? (
      //             <span className="font-semibold text-purple-600 dark:text-purple-400">
      //               {formatCurrency(price as number)}
      //             </span>
      //           ) : (
      //             <span className="text-gray-400">—</span>
      //           );
      //         },
      //         size: 120,
      //       }),
      //     ]
      //   : []),

      // // VIP Price column (only for finished_product & goods)
      // ...(data.length > 0 && data.some(p => p.productType === "finished_product" || p.productType === "goods")
      //   ? [
      //       columnHelper.accessor("sellingPriceVip", {
      //         id: "sellingPriceVip",
      //         header: "Giá VIP",
      //         cell: (info) => {
      //           // Only show for finished_product & goods
      //           if (info.row.original.productType !== "finished_product" && info.row.original.productType !== "goods") {
      //             return <span className="text-gray-400">—</span>;
      //           }
      //           const price = info.getValue();
      //           return price ? (
      //             <span className="font-semibold text-orange-600 dark:text-orange-400">
      //               {formatCurrency(price as number)}
      //             </span>
      //           ) : (
      //             <span className="text-gray-400">—</span>
      //           );
      //         },
      //         size: 120,
      //       }),
      //     ]
      //   : []),

      // Min Stock column
      columnHelper.accessor("minStockLevel", {
        header: "Tồn tối thiểu",
        cell: (info) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {info.getValue() || 0}
          </span>
        ),
        size: 100,
      }),

      // Stock Status column
      columnHelper.display({
        id: "stock",
        header: "Tồn kho",
        cell: ({ row }) => {
          const quantity = getTotalQuantity(row.original.inventory);
          const minStock = row.original.minStockLevel || 0;
          const statusLabel = getStockStatusLabel(quantity, minStock);
          const statusColor = getStockStatusColor(quantity, minStock);

          return (
            <div className="flex flex-col gap-2">
              <div className={`inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium ${statusColor} w-fit`}>
                {quantity === 0 && <AlertCircle className="h-4 w-4" />}
                <span>{quantity}</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {statusLabel}
              </span>
            </div>
          );
        },
        size: 130,
      }),

      // Status column
      columnHelper.accessor("status", {
        header: "Trạng thái",
        cell: (info) => (
          <Badge color={getStatusBadgeColor(info.getValue())}>
            {getStatusLabel(info.getValue())}
          </Badge>
        ),
        size: 120,
      }),

      // Actions column
      columnHelper.display({
        id: "actions",
        header: "Thao tác",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {/* Quick View Link */}
            <Link
              href={`/${urlProduct}/${row.original.id}`}
              className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              title="Xem chi tiết"
            >
              <Eye className="h-4 w-4" />
            </Link>

            {/* Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() =>
                  setOpenDropdownId(
                    openDropdownId === row.original.id ? null : row.original.id
                  )
                }
                className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                title="Thêm thao tác"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              <Dropdown
                isOpen={openDropdownId === row.original.id}
                onClose={() => setOpenDropdownId(null)}
                className="w-48"
              >
                {/* Edit */}
                <DropdownItem
                  tag="a"
                  href={`/${urlProduct}/${row.original.id}/edit`}
                  onItemClick={() => setOpenDropdownId(null)}
                  className="text-blue-600! hover:bg-blue-50! dark:text-blue-400! dark:hover:bg-blue-900/20!"
                >
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    <span>Chỉnh sửa</span>
                  </div>
                </DropdownItem>

                {/* Print Barcode */}
                <DropdownItem
                  onClick={() => handlePrintBarcode(row.original)}
                  disabled={!row.original.barcode}
                  className="text-green-600! hover:bg-green-50! dark:text-green-400! dark:hover:bg-green-900/20!"
                >
                  <div className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    <span>In mã vạch</span>
                  </div>
                </DropdownItem>

                {/* Toggle Status */}
                <DropdownItem
                  onClick={() => handleToggleStatus(row.original)}
                  className={
                    row.original.status === "active"
                      ? "text-orange-600! hover:bg-orange-50! dark:text-orange-400! dark:hover:bg-orange-900/20!"
                      : "text-green-600! hover:bg-green-50! dark:text-green-400! dark:hover:bg-green-900/20!"
                  }
                >
                  <div className="flex items-center gap-2">
                    {row.original.status === "active" ? (
                      <>
                        <XCircle className="h-4 w-4" />
                        <span>Tạm ngưng</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Kích hoạt</span>
                      </>
                    )}
                  </div>
                </DropdownItem>

                {/* Delete */}
                <DropdownItem
                  onClick={() => onDelete?.(row.original)}
                  className="text-red-600! hover:bg-red-50! dark:text-red-400! dark:hover:bg-red-900/20!"
                >
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    <span>Xóa</span>
                  </div>
                </DropdownItem>
              </Dropdown>
            </div>
          </div>
        ),
        size: 100,
      }),
    ],
    [enableSelection, data, openDropdownId]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: enableSelection,
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Không tìm thấy sản phẩm nào
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? "flex cursor-pointer select-none items-center gap-2"
                              : ""
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="text-gray-400">
                              {header.column.getIsSorted() === "asc" ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronsUpDown className="h-4 w-4" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-sm"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isStatusConfirmOpen}
        onClose={handleCloseStatusConfirm}
        onConfirm={handleConfirmStatusChange}
        title={`${pendingStatusChange?.newStatus === "active" ? "Kích hoạt" : "Tạm ngưng"} sản phẩm`}
        message={
          pendingStatusChange?.newStatus === "active"
            ? `Bạn có chắc chắn muốn kích hoạt sản phẩm "${pendingStatusChange.product.productName}"?`
            : `Bạn có chắc chắn muốn tạm ngưng sản phẩm "${pendingStatusChange?.product.productName}"?`
        }
        confirmText={pendingStatusChange?.newStatus === "active" ? "Kích hoạt" : "Tạm ngưng"}
        cancelText="Hủy"
        variant={pendingStatusChange?.newStatus === "active" ? "info" : "warning"}
        isLoading={toggleStatus.isPending}
      />
    </div>
  );
}
