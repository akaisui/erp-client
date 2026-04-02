"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSalesOrders, useDeleteSalesOrder, useRefreshSalesOrders, useCustomers, useApproveSalesOrder, useCreateDelivery, useCancelSalesOrder, useProcessPayment } from "@/hooks/api";
import { Can } from "@/components/auth";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import CancelModal from "@/components/ui/modal/CancelModal";
import { GradientCard, ProgressCard, FinancialCard, ClassicCard } from "@/components/ui/card/StatCards";
import type {
  ApiResponse,
  SalesOrder,
  OrderStatus,
  PaymentStatus,
  SalesChannel,
  CreateDeliveryDto,
  PaymentMethod,
} from "@/types";
import {
  Plus,
  Eye,
  Trash2,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Download,
  X,
  RotateCcw,
  Printer,
  CheckCircle,
  Truck,
  DollarSign,
  MoreVertical,
  Edit,
} from "lucide-react";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
} from "@/lib/constants";
import { SearchBar } from "@/components/ui/SearchBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { useWarehouses } from "@/hooks/api/useWarehouses";
import { useUsers } from "@/hooks/api/useUsers";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { SimpleDatePicker } from "@/components/form/SimpleDatePicker";
import { formatCurrency } from "@/lib/utils";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { useDebounce } from "@/hooks";
import Pagination from "@/components/tables/Pagination";

export default function SalesOrdersPage() {
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [orderStatusFilters, setOrderStatusFilters] = useState<OrderStatus[]>([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | "all">("all");
  const [salesChannelFilter, setSalesChannelFilter] = useState<SalesChannel | "all">("all");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [createdByFilter, setCreatedByFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Dropdown & Dialog States
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<{ id: number; orderCode: string } | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Delivery form state
  const [deliveryForm, setDeliveryForm] = useState({
    deliveryStaffId: "",
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryCost: 0,
    codAmount: 0,
    notes: "",
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: "cash" as PaymentMethod,
    notes: "",
  });

  // Fetch Sales Orders
  const { data, isLoading, error } = useSalesOrders({
    page,
    limit,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(orderStatusFilters.length > 0 && { orderStatus: orderStatusFilters }),
    ...(paymentStatusFilter !== "all" && { paymentStatus: paymentStatusFilter }),
    ...(salesChannelFilter !== "all" && { salesChannel: salesChannelFilter }),
    ...(warehouseFilter !== "all" && { warehouseId: parseInt(warehouseFilter) }),
    ...(createdByFilter !== "all" && { createdBy: parseInt(createdByFilter) }),
    ...(customerFilter !== "all" && { customerId: parseInt(customerFilter) }),
    ...(fromDate && { fromDate: fromDate }),
    ...(toDate && { toDate: toDate }),
  });
  const response = data as unknown as ApiResponse<SalesOrder[]> & { statistics: any };
  const orders = response?.data;
  const statistics = response?.statistics;
  const paginationMeta = response?.meta;

  const deleteOrder = useDeleteSalesOrder();
  const cancelOrder = useCancelSalesOrder();
  const refreshOrders = useRefreshSalesOrders();
  const approveOrder = useApproveSalesOrder();
  const createDelivery = useCreateDelivery();
  const processPayment = useProcessPayment();

  // Fetch warehouses and users
  const { data: warehousesData, isLoading: warehousesLoading } = useWarehouses({
    limit: 100,
  });
  const { data: usersData, isLoading: usersLoading } = useUsers({
    limit: 100,
  });
  const { data: customersData, isLoading: customersLoading } = useCustomers({
    limit: 100,
  });

  const warehouses = (warehousesData as unknown as ApiResponse<any[]>)?.data || [];
  const users = (usersData as unknown as ApiResponse<any[]>)?.data || [];
  const customers = (customersData as unknown as ApiResponse<any[]>)?.data || [];

  // Transform data for SearchableSelect
  const warehouseOptions = [
    { value: "all", label: "Tất cả kho" },
    ...warehouses.map((w) => ({ value: w.id.toString(), label: w.warehouseName || w.name })),
  ];

  const userOptions = [
    { value: "all", label: "Tất cả nhân viên" },
    ...users.map((u) => ({ value: u.id.toString(), label: u.fullName || u.username })),
  ];

  const customerOptions = [
    { value: "all", label: "Tất cả khách hàng" },
    ...customers.map((u) => ({ value: u.id.toString(), label: u.customerName || u.customerCode })),
  ];

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, orderStatusFilters, paymentStatusFilter, salesChannelFilter, warehouseFilter, createdByFilter, fromDate, toDate]);

  // Handle Delete
  const handleDelete = (id: number, orderCode: string) => {
    setSelectedOrder({ id, orderCode });
    setShowCancelDialog(true);
    setOpenDropdownId(null);
  };

  const handleConfirmCancel = async (reason: string) => {
    if (selectedOrder && reason.trim()) {
      await cancelOrder.mutateAsync({ id: selectedOrder.id, data: { reason } });
      setShowCancelDialog(false);
      setSelectedOrder(null);
    }
  };

  // Handle View
  const handleView = (id: number) => {
    window.location.href = `/sales/orders/${id}`;
    setOpenDropdownId(null);
  };

  // Handle Print
  const handlePrint = (id: number, printType: string) => {
    window.open(`/sales/orders/${id}/print?type=${printType}`, "_blank");
    setOpenDropdownId(null);
  };

  // Handle Edit
  const handleEdit = (id: number) => {
    window.location.href = `/sales/orders/${id}/edit`;
    setOpenDropdownId(null);
  };

  // Handle Approve (giống như vouchers page)
  const handleApprove = (id: number, orderCode: string) => {
    setSelectedOrder({ id, orderCode });
    setShowApproveDialog(true);
    setOpenDropdownId(null);
  };

  const handleConfirmApprove = async (notes?: string) => {
    if (selectedOrder) {
      await approveOrder.mutateAsync({ 
        id: selectedOrder.id,
        data: notes ? { notes } : undefined,
      });
      setShowApproveDialog(false);
      setSelectedOrder(null);
    }
  };

  // Handle Create Delivery
  const handleCreateDelivery = (id: number, orderCode: string, order: SalesOrder) => {
    setSelectedOrder({ id, orderCode });
    // Set default COD amount = totalAmount - paidAmount
    const codAmount = Number(order.totalAmount) - Number(order.paidAmount);
    setDeliveryForm({
      deliveryStaffId: "",
      deliveryDate: new Date().toISOString().split('T')[0],
      deliveryCost: 0,
      codAmount,
      notes: "",
    });
    setShowDeliveryModal(true);
    setOpenDropdownId(null);
  };

  const handleConfirmDelivery = async () => {
    if (!selectedOrder || !deliveryForm.deliveryStaffId) {
      toast.error("Vui lòng chọn nhân viên giao hàng");
      return;
    }

    try {
      // Create delivery (Backend sẽ tự động update SalesOrder status → delivering)
      const deliveryData = {
        orderId: selectedOrder.id,
        deliveryStaffId: parseInt(deliveryForm.deliveryStaffId),
        deliveryDate: deliveryForm.deliveryDate,
        deliveryCost: deliveryForm.deliveryCost || 0,
        codAmount: deliveryForm.codAmount,
        notes: deliveryForm.notes,
      };

      await createDelivery.mutateAsync(deliveryData);

      setShowDeliveryModal(false);
      setSelectedOrder(null);
      setDeliveryForm({
        deliveryStaffId: "",
        deliveryDate: new Date().toISOString().split('T')[0],
        deliveryCost: 0,
        codAmount: 0,
        notes: "",
      });
    } catch (error) {
      console.error("Error creating delivery:", error);
    }
  };

  // Handle Collect Payment
  const handleCollectPayment = (id: number, order: SalesOrder) => {
    setSelectedOrder({ id, orderCode: order.orderCode });
    // Set default amount = remaining balance
    const remainingAmount = Number(order.totalAmount) - Number(order.paidAmount);
    setPaymentForm({
      amount: remainingAmount,
      paymentMethod: "cash",
      notes: "",
    });
    setShowPaymentModal(true);
    setOpenDropdownId(null);
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrder || paymentForm.amount <= 0) {
      toast.error("Vui lòng nhập số tiền cần thu");
      return;
    }

    try {
      await processPayment.mutateAsync({
        id: selectedOrder.id,
        data: {
          paidAmount: paymentForm.amount,
          paymentMethod: paymentForm.paymentMethod,
          notes: paymentForm.notes,
        },
      });

      setShowPaymentModal(false);
      setSelectedOrder(null);
      setPaymentForm({
        amount: 0,
        paymentMethod: "cash",
        notes: "",
      });
    } catch (error) {
      console.error("Error processing payment:", error);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setOrderStatusFilters([]);
    setPaymentStatusFilter("all");
    setSalesChannelFilter("all");
    setWarehouseFilter("all");
    setCreatedByFilter("all");
    setCustomerFilter("all");
    setFromDate("");
    setToDate("");
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const exportData = orders.map((order) => ({
        "Mã đơn": order.orderCode,
        "Khách hàng": order.customer?.customerName || "-",
        "Ngày": format(new Date(order.orderDate), "dd/MM/yyyy"),
        "Số lượng": order.details?.length || 0,
        "Tổng tiền": Number(order.totalAmount || 0),
        "Giảm giá": Number(order.discountAmount || 0),
        "Thuế": Number(order.taxAmount || 0),
        "Phí vận chuyển": Number(order.shippingFee || 0),
        "Tổng thanh toán": 
          Number(order.totalAmount || 0) - 
          Number(order.discountAmount || 0) + 
          Number(order.taxAmount || 0) + 
          Number(order.shippingFee || 0),
        "Đã thanh toán": Number(order.paidAmount || 0),
        "Còn nợ": 
          Number(order.totalAmount || 0) - 
          Number(order.discountAmount || 0) + 
          Number(order.taxAmount || 0) + 
          Number(order.shippingFee || 0) - 
          Number(order.paidAmount || 0),
        "Kênh bán": order.salesChannel,
        "Trạng thái đơn": ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus,
        "Trạng thái thanh toán": PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus,
        "Phương thức thanh toán": order.paymentMethod,
        "Địa chỉ giao": order.deliveryAddress || "-",
        "Ghi chú": order.notes || "-",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const columnWidths = [
        { wch: 12 },   // Mã đơn
        { wch: 20 },   // Khách hàng
        { wch: 12 },   // Ngày
        { wch: 10 },   // Số lượng
        { wch: 15 },   // Tổng tiền
        { wch: 12 },   // Giảm giá
        { wch: 10 },   // Thuế
        { wch: 15 },   // Phí vận chuyển
        { wch: 15 },   // Tổng thanh toán
        { wch: 15 },   // Đã thanh toán
        { wch: 12 },   // Còn nợ
        { wch: 12 },   // Kênh bán
        { wch: 15 },   // Trạng thái đơn
        { wch: 15 },   // Trạng thái thanh toán
        { wch: 15 },   // Phương thức thanh toán
        { wch: 25 },   // Địa chỉ giao
        { wch: 30 },   // Ghi chú
      ];
      worksheet["!cols"] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Đơn hàng");

      const fileName = `donhang_${format(new Date(), "dd-MM-yyyy_HHmm")}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success("Xuất danh sách đơn hàng thành công!");
    } catch (error) {
      toast.error("Lỗi khi xuất danh sách đơn hàng");
      console.error(error);
    }
  };

  const hasActiveFilters =
    searchTerm ||
    orderStatusFilters.length > 0 ||
    paymentStatusFilter !== "all" ||
    salesChannelFilter !== "all" ||
    warehouseFilter !== "all" ||
    createdByFilter !== "all" ||
    customerFilter !== "all" ||
    fromDate ||
    toDate;

  // Get order status color
  const getOrderStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      preparing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      delivering: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return colors[status];
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <h3 className="font-semibold text-red-900 dark:text-red-300">
          Lỗi khi tải danh sách đơn hàng
        </h3>
        <p className="mt-1 text-sm text-red-800 dark:text-red-400">
          {(error as any)?.message || "Đã có lỗi xảy ra"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Đơn Hàng Bán
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý đơn hàng bán và theo dõi thanh toán
          </p>
        </div>

        <Can permission="create_sales_order">
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <Button
              variant="outline"
              size="ssmm"
              onClick={() => refreshOrders.mutateAsync()}
              isLoading={refreshOrders.isPending}
              title="Làm mới dữ liệu từ server"
            >
              <RotateCcw className="h-5 w-5" />
              Làm Mới
            </Button>

            {/* Export Button */}
            <Button
              variant="outline"
              size="ssmm"
              onClick={handleExportExcel}
              disabled={orders?.length === 0}
            >
              <Download className="mr-2 h-5 w-5" />
              Xuất Excel
            </Button>
            <Link href="/sales/orders/create">
              <Button variant="primary" size="ssmm">
                <Plus className="mr-2 h-5 w-5" />
                Tạo đơn hàng
              </Button>
            </Link>
          </div>
        </Can>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          // Loading Skeleton
          <>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse"
              />
            ))}
          </>
        ) : (
          <>
            {/* Card 1: Doanh số dự kiến (Total Revenue) - GRADIENT CARD */}
            <GradientCard
              title="Doanh số dự kiến"
              value={formatCurrency(statistics.totalRevenue)}
              icon={TrendingUp}
              color="blue"
              trend={0}
            />

            {/* Card 2: Cần xử lý (Pending Orders) - ENHANCED PROGRESS CARD */}
            <ProgressCard
              title="Cần xử lý"
              value={statistics.pending}
              subValue={orders.length > 0 ? `${orders.length}` : "0"}
              color="orange"
              trend={
                orders.length > 0
                  ? Math.round((statistics.pending / orders.length) * 100)
                  : 0
              }
              description="Đơn hàng chờ xử lý"
            />

            {/* Card 3: Đang giao hàng (Delivering) - ENHANCED CLASSIC CARD */}
            <ClassicCard
              title="Đang giao hàng"
              value={statistics.delivering + statistics.preparing}
              icon={ShoppingCart}
              color="indigo"
              items={[
                { label: "Chuẩn bị", value: statistics.preparing, color: "bg-blue-500" },
                { label: "Đang giao", value: statistics.delivering, color: "bg-indigo-500" },
              ]}
            />

            {/* Card 4: Công nợ chưa thanh toán (Unpaid Debt) - FINANCIAL CARD */}
            <FinancialCard
              title="Công nợ chưa thanh toán"
              value={formatCurrency(statistics.unpaidDebt)}
              icon={AlertCircle}
              color="red"
              description="Cần theo dõi thanh toán"
              onClick={() => {
                setPaymentStatusFilter("unpaid");
              }}
            />
          </>
        )}
      </div>

      {/* Search Input - Separated */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Mã đơn, tên KH, SĐT..."
      />

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {/* Row 1: Date Range + Basic Filters */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {/* From Date */}
          <div>
            <label
              htmlFor="fromDate"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Từ ngày
            </label>
            <SimpleDatePicker
              className="py-2"
              value={fromDate}
              onChange={setFromDate}
              placeholder="Chọn ngày bắt đầu"
            />
          </div>

          {/* To Date */}
          <div>
            <label
              htmlFor="toDate"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Đến ngày
            </label>
            <SimpleDatePicker
              className="py-2"
              value={toDate}
              onChange={setToDate}
              placeholder="Chọn ngày kết thúc"
            />
          </div>

          {/* Payment Status */}
          <div>
            <label
              htmlFor="paymentStatus"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Thanh toán
            </label>
            <select
              id="paymentStatus"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value as PaymentStatus | "all")}
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả</option>
              <option value="unpaid">Chưa trả</option>
              <option value="partial">Một phần</option>
              <option value="paid">Đã trả</option>
            </select>
          </div>

          {/* Sales Channel */}
          <div>
            <label
              htmlFor="salesChannel"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Kênh bán
            </label>
            <select
              id="salesChannel"
              value={salesChannelFilter}
              onChange={(e) => setSalesChannelFilter(e.target.value as SalesChannel | "all")}
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả kênh</option>
              <option value="retail">Bán lẻ</option>
              <option value="wholesale">Bán sỉ</option>
              <option value="online">Online</option>
              <option value="distributor">Đại lý</option>
            </select>
          </div>

          {/* Warehouse */}
          <div>
            <label
              htmlFor="warehouse"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Kho xuất
            </label>
            <SearchableSelect
              options={warehouseOptions}
              value={warehouseFilter}
              onChange={(value) => setWarehouseFilter(String(value))}
              placeholder="Chọn kho..."
              isLoading={warehousesLoading}
            />
          </div>

          {/* Created By (Staff) */}
          <div>
            <label
              htmlFor="staff"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Nhân viên
            </label>
            <SearchableSelect
              options={userOptions}
              value={createdByFilter}
              onChange={(value) => setCreatedByFilter(String(value))}
              placeholder="Chọn nhân viên..."
              isLoading={usersLoading}
            />
          </div>
        </div>

        {/* Row 2: Order Status (Multi-select) */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="col-span-4">
            <label
              htmlFor="orderStatus"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Trạng thái đơn
            </label>
            <div className="space-y-2 rounded-lg border border-gray-300 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {(["pending", "preparing", "delivering", "completed", "cancelled"] as OrderStatus[]).map((status) => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={orderStatusFilters.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setOrderStatusFilters([...orderStatusFilters, status]);
                        } else {
                          setOrderStatusFilters(orderStatusFilters.filter((s) => s !== status));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {status === "pending" ? "Chờ duyệt"
                        : status === "preparing" ? "Chuẩn bị"
                        : status === "delivering" ? "Đang giao"
                        : status === "completed" ? "Hoàn thành"
                        : "Hủy"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="col-span-1">
            <label
              htmlFor="staff"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Khách Hàng
            </label>
            <SearchableSelect
              options={customerOptions}
              value={createdByFilter}
              onChange={(value) => setCustomerFilter(String(value))}
              placeholder="Chọn khách hàng..."
              isLoading={customersLoading}
            />
          </div>

          {/* Items per page */}
          <div className="col-span-1">
            <label
              htmlFor="limit"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Hiển thị
            </label>
            <select
              id="limit"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Bộ lọc:
            </span>

            {searchTerm && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                🔍 "{searchTerm}"
                <button
                  onClick={() => setSearchTerm("")}
                  className="hover:text-blue-900 dark:hover:text-blue-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {fromDate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                Từ: {format(new Date(fromDate), "dd/MM/yyyy")}
                <button
                  onClick={() => setFromDate("")}
                  className="hover:text-green-900 dark:hover:text-green-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {toDate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                Đến: {format(new Date(toDate), "dd/MM/yyyy")}
                <button
                  onClick={() => setToDate("")}
                  className="hover:text-green-900 dark:hover:text-green-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {paymentStatusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                Thanh toán: {paymentStatusFilter === "unpaid" ? "Chưa trả" : paymentStatusFilter === "partial" ? "Một phần" : "Đã trả"}
                <button
                  onClick={() => setPaymentStatusFilter("all")}
                  className="hover:text-purple-900 dark:hover:text-purple-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {salesChannelFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-sm text-pink-700 dark:bg-pink-900/20 dark:text-pink-400">
                Kênh: {
                  salesChannelFilter === "retail" ? "Bán lẻ" :
                  salesChannelFilter === "wholesale" ? "Bán sỉ" :
                  salesChannelFilter === "online" ? "Online" : "Đại lý"
                }
                <button
                  onClick={() => setSalesChannelFilter("all")}
                  className="hover:text-pink-900 dark:hover:text-pink-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {orderStatusFilters.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                Trạng thái: {orderStatusFilters.length} mục
                <button
                  onClick={() => setOrderStatusFilters([])}
                  className="hover:text-yellow-900 dark:hover:text-yellow-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {warehouseFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                Kho: {warehouses.find((w: any) => w.id === parseInt(warehouseFilter))?.warehouseName || warehouseFilter}
                <button
                  onClick={() => setWarehouseFilter("all")}
                  className="hover:text-indigo-900 dark:hover:text-indigo-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {createdByFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                NV: {users?.find((u: any) => u.id === parseInt(createdByFilter))?.fullName || createdByFilter}
                <button
                  onClick={() => setCreatedByFilter("all")}
                  className="hover:text-red-900 dark:hover:text-red-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            <Button variant="outline" size="sss" onClick={handleResetFilters}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto overflow-y-visible min-h-80 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <p className="text-sm">Không có đơn hàng nào</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <TableRow>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Mã đơn
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Khách hàng
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Ngày đặt
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Tổng tiền
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Đã trả
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  TT Thanh toán
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  TT Đơn hàng
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Thao tác
                </th>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell className="px-3 py-3">
                    <button
                      onClick={() => window.location.href = `/sales/orders/${order.id}`}
                      className="text-sm font-bold text-gray-900 hover:text-blue-600 hover:underline dark:text-white dark:hover:text-blue-400"
                    >
                      {order.orderCode}
                    </button>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <p className="text-gray-900 dark:text-white">
                      {order.customer?.customerName || "—"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {order.customer?.phone || ""}
                    </p>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {format(new Date(order.orderDate), "dd/MM/yyyy")}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-right">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-right">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatCurrency(order.paidAmount)}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        PAYMENT_STATUS_COLORS[order.paymentStatus]
                      }`}
                    >
                      {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getOrderStatusColor(
                        order.orderStatus
                      )}`}
                    >
                      {ORDER_STATUS_LABELS[order.orderStatus]}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-right">
                    <div className="relative flex items-center justify-end gap-1">
                      {/* Quick View Link */}
                      <Button
                        onClick={() => handleView(order.id)}
                        variant="normal"
                        size="normal"
                        className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Quick Print Button */}
                      <Button
                        onClick={() => handlePrint(order.id, "invoice")}
                        variant="normal"
                        size="normal"
                        className="rounded p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-800"
                        title="In hóa đơn"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>

                      {/* Dropdown Menu */}
                      <div className="relative">
                        <Button
                          onClick={() =>
                            setOpenDropdownId(
                              openDropdownId === order.id ? null : order.id
                            )
                          }
                          variant="normal"
                          size="normal"
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                          title="Thêm thao tác"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>

                        <Dropdown
                          isOpen={openDropdownId === order.id}
                          onClose={() => setOpenDropdownId(null)}
                          className="w-48"
                        >
                          {/* Sửa - pending only */}
                          {order.orderStatus === "pending" && (
                            <Can permission="update_sales_order">
                              <DropdownItem
                                onClick={() => handleEdit(order.id)}
                                className="text-blue-600! hover:bg-blue-50! dark:text-blue-400! dark:hover:bg-blue-900/20!"
                              >
                                <div className="flex items-center gap-2">
                                  <Edit className="h-4 w-4" />
                                  <span>Sửa đơn hàng</span>
                                </div>
                              </DropdownItem>
                            </Can>
                          )}

                          {/* Duyệt đơn - pending only */}
                          {order.orderStatus === "pending" && (
                            <Can permission="approve_sales_order">
                              <DropdownItem
                                onClick={() => handleApprove(order.id, order.orderCode)}
                                className="text-green-600! hover:bg-green-50! dark:text-green-400! dark:hover:bg-green-900/20!"
                              >
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Duyệt đơn hàng</span>
                                </div>
                              </DropdownItem>
                            </Can>
                          )}

                          {/* Tạo phiếu giao - preparing only */}
                          {order.orderStatus === "preparing" && (
                            <Can permission="create_delivery">
                              <DropdownItem
                                onClick={() => handleCreateDelivery(order.id, order.orderCode, order)}
                                className="text-blue-600! hover:bg-blue-50! dark:text-blue-400! dark:hover:bg-blue-900/20!"
                              >
                                <div className="flex items-center gap-2">
                                  <Truck className="h-4 w-4" />
                                  <span>Tạo phiếu giao hàng</span>
                                </div>
                              </DropdownItem>
                            </Can>
                          )}

                          {/* Thu tiền - unpaid or partial */}
                          {(order.paymentStatus === "unpaid" || order.paymentStatus === "partial") && (
                            <Can permission="process_payment">
                              <DropdownItem
                                onClick={() => handleCollectPayment(order.id, order)}
                                className="text-emerald-600! hover:bg-emerald-50! dark:text-emerald-400! dark:hover:bg-emerald-900/20!"
                              >
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  <span>Thu tiền</span>
                                </div>
                              </DropdownItem>
                            </Can>
                          )}

                          {/* Hủy đơn - pending or preparing */}
                          {(order.orderStatus === "pending" || order.orderStatus === "preparing") && (
                            <Can permission="cancel_sales_order">
                              <DropdownItem
                                onClick={() => handleDelete(order.id, order.orderCode)}
                                className="text-red-600! hover:bg-red-50! dark:text-red-400! dark:hover:bg-red-900/20!"
                              >
                                <div className="flex items-center gap-2">
                                  <Trash2 className="h-4 w-4" />
                                  <span>Hủy đơn hàng</span>
                                </div>
                              </DropdownItem>
                            </Can>
                          )}
                        </Dropdown>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {paginationMeta && paginationMeta.total > 0 && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Hiển thị{" "}
            <span className="font-medium">
              {(paginationMeta.page - 1) * paginationMeta.limit + 1}
            </span>{" "}
            đến{" "}
            <span className="font-medium">
              {Math.min(
                paginationMeta.page * paginationMeta.limit,
                paginationMeta.total
              )}
            </span>{" "}
            trong tổng số{" "}
            <span className="font-medium">{paginationMeta.total}</span> phiếu
          </div>
          {paginationMeta.totalPages > 1 && (
            <Pagination
              currentPage={paginationMeta.page}
              totalPages={paginationMeta.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      )}

      {/* Cancel Order Modal - Using CancelModal Component */}
      <CancelModal
        isOpen={showCancelDialog}
        onClose={() => {
          setShowCancelDialog(false);
          setSelectedOrder(null);
        }}
        onConfirm={handleConfirmCancel}
        title={`Hủy đơn hàng: ${selectedOrder?.orderCode}`}
        message="Số lượng sản phẩm sẽ được hoàn trả vào tồn kho. Vui lòng nhập lý do hủy đơn hàng."
        placeholder="Nhập lý do hủy đơn..."
        action="hủy đơn"
        confirmText="Xác nhận hủy"
        cancelText="Đóng"
        isLoading={cancelOrder.isPending}
      />

      {/* Approve Order Dialog */}
      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={handleConfirmApprove}
        title="Duyệt đơn hàng"
        message={`Duyệt đơn hàng ${selectedOrder?.orderCode}?\n\nĐơn hàng sẽ chuyển sang trạng thái "Chuẩn bị" và sẵn sàng để giao hàng.`}
        confirmText="Duyệt"
        variant="success"
        isLoading={approveOrder.isPending}
        showNotes={true}
      />

      {/* Create Delivery Modal */}
      {showDeliveryModal && selectedOrder && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tạo phiếu giao hàng: {selectedOrder.orderCode}
            </h3>

            <div className="space-y-4">
              {/* Delivery Staff */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nhân viên giao hàng <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={userOptions}
                  value={deliveryForm.deliveryStaffId}
                  onChange={(value) => setDeliveryForm({ ...deliveryForm, deliveryStaffId: String(value) })}
                  placeholder="Chọn nhân viên giao hàng..."
                  isLoading={usersLoading}
                />
              </div>

              {/* Delivery Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngày giao hàng <span className="text-red-500">*</span>
                </label>
                <SimpleDatePicker
                  value={deliveryForm.deliveryDate}
                  onChange={(value) => setDeliveryForm({ ...deliveryForm, deliveryDate: value })}
                  placeholder="Chọn ngày giao hàng"
                />
              </div>

              {/* COD Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tiền thu hộ (COD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={deliveryForm.codAmount}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, codAmount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-gray-500 dark:text-gray-400">VND</span>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Tự động: Tổng tiền - Đã thanh toán
                </p>
              </div>

              {/* Delivery Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chi phí giao hàng
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={deliveryForm.deliveryCost}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryCost: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-gray-500 dark:text-gray-400">VND</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ghi chú giao hàng
                </label>
                <textarea
                  value={deliveryForm.notes}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                  placeholder="Ví dụ: Giao giờ hành chính, hàng dễ vỡ..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDeliveryModal(false);
                  setSelectedOrder(null);
                  setDeliveryForm({
                    deliveryStaffId: "",
                    deliveryDate: new Date().toISOString().split('T')[0],
                    deliveryCost: 0,
                    codAmount: 0,
                    notes: "",
                  });
                }}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDelivery}
                disabled={createDelivery.isPending || !deliveryForm.deliveryStaffId}
                isLoading={createDelivery.isPending}
              >
                Xác nhận & Xuất kho
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Collection Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Thu tiền - {selectedOrder.orderCode}
            </h3>

            <div className="space-y-4">
              {/* Remaining Amount (Read-only) */}
              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                  Số tiền còn nợ
                </p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency((orders?.find((o) => o.id === selectedOrder.id)?.totalAmount || 0) - (orders?.find((o) => o.id === selectedOrder.id)?.paidAmount || 0))}
                </p>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Số tiền cần thu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-gray-500 dark:text-gray-400">VND</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phương thức thanh toán <span className="text-red-500">*</span>
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as PaymentMethod })}
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="transfer">Chuyển khoản</option>
                  <option value="card">Thẻ</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ghi chú (Tuỳ chọn)
                </label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Ví dụ: Khách trả nợ đợt 1, hoàn tiền khuyến mãi..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedOrder(null);
                  setPaymentForm({
                    amount: 0,
                    paymentMethod: "cash",
                    notes: "",
                  });
                }}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmPayment}
                disabled={processPayment.isPending || paymentForm.amount <= 0}
                isLoading={processPayment.isPending}
              >
                Xác nhận & Lưu
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
