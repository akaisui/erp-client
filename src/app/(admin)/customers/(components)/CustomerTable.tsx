"use client";

import React, { useState } from "react";
import Link from "next/link";
import Divider from "@/components/ui/Divider";
import { Customer } from "@/types";
import { DebtStatusBadge } from "./DebtIndicator";
import {
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_CLASSIFICATION_LABELS,
  CUSTOMER_STATUS_COLORS,
  CUSTOMER_STATUS_LABELS,
} from "@/lib/constants";
import { Eye, Trash2, MoreVertical, Phone, Mail, Users, Edit } from "lucide-react";
import { Can } from "@/components/auth";
import Badge, { BadgeColor } from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface CustomerTableProps {
  customers: Customer[];
  isLoading?: boolean;
  onDelete?: (id: number, customerName: string) => void;
  onEdit?: (customer: Customer) => void;
  onView?: (customer: Customer) => void; // <--- ADDED: Prop to handle view action
}

export default function CustomerTable({
  customers,
  isLoading = false,
  onDelete,
  onEdit,
  onView, // <--- ADDED
}: CustomerTableProps) {
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        </div>
      ) : customers.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <Users className="mb-4 h-12 w-12" />
          <p className="text-sm">Không tìm thấy khách hàng nào</p>
        </div>
      ) : (
        <Table>
          <TableHeader className="border-b-1 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <TableRow>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Mã KH
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Khách hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Loại
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Phân loại
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Điểm thưởng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Mã thưởng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Liên hệ
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Công nợ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Thao tác
              </th>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  <button
                    onClick={() => onView && onView(customer)}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {customer.customerCode || "—"}
                  </button>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <button
                        onClick={() => onView && onView(customer)}
                        className="font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 text-left"
                      >
                        {customer.customerName}
                      </button>
                      {customer.contactPerson && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {customer.contactPerson}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-sm">
                  <Badge color={customer.customerType === "individual" ? "blue" : "purple"}>
                    {CUSTOMER_TYPE_LABELS[customer.customerType]}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 text-sm">
                  <Badge
                    color={
                      customer.classification === "retail"
                        ? "blue"
                        : customer.classification === "wholesale"
                        ? "purple"
                        : customer.classification === "vip"
                        ? "red"
                        : "orange"
                    }
                  >
                    {CUSTOMER_CLASSIFICATION_LABELS[customer.classification]}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        {customer.rewardPoints || 0}
                      </span>
                      <span className="text-xs text-gray-500">điểm</span>
                    </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-mono">
                    {customer.rewardCode ? (
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                            {customer.rewardCode}
                        </span>
                    ) : (
                        <span className="text-gray-400">—</span>
                    )}
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  <div className="space-y-1">
                    {customer.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        <span
                          className="max-w-[150px] truncate overflow-hidden whitespace-nowrap"
                          title={customer.email}
                        >{customer.email}</span>
                      </div>
                    )}
                    {!customer.phone && !customer.email && <span className="text-gray-400">—</span>}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                  <div className="min-w-[200px]">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatCurrency(customer.currentDebt || 0)}
                      </span>
                      <DebtStatusBadge
                        currentDebt={customer.currentDebt}
                        creditLimit={customer.creditLimit}
                      />
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          customer.creditLimit > 0 &&
                          (customer.currentDebt / customer.creditLimit) * 100 >= 100
                            ? "bg-red-600 dark:bg-red-500"
                            : customer.creditLimit > 0 &&
                              (customer.currentDebt / customer.creditLimit) * 100 >= 80
                            ? "bg-yellow-500 dark:bg-yellow-400"
                            : "bg-green-500 dark:bg-green-400"
                        }`}
                        style={{
                          width: `${Math.min(
                            customer.creditLimit > 0
                              ? (customer.currentDebt / customer.creditLimit) * 100
                              : 0,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Hạn mức: {formatCurrency(customer.creditLimit)}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-sm">
                  <Badge color={CUSTOMER_STATUS_COLORS[customer.status] as BadgeColor}>
                    {CUSTOMER_STATUS_LABELS[customer.status]}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 text-right text-sm font-medium">
                  <div className="relative flex items-center justify-end gap-1">
                    {/* Quick View Link */}
                    <button
                      onClick={() => onView && onView(customer)}
                      className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* Dropdown Menu */}
                    <div className="relative">
                      <Button
                        onClick={() =>
                          setOpenDropdownId(
                            openDropdownId === customer.id ? null : customer.id
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
                        isOpen={openDropdownId === customer.id}
                        onClose={() => setOpenDropdownId(null)}
                        className="w-56 border border-2"
                      >
                        {/* Chỉnh sửa - SỬ DỤNG PROP onEdit */}
                        {onEdit && (
                          <Can permission="update_customer">
                            <DropdownItem
                              onClick={() => {
                                onEdit(customer);
                                setOpenDropdownId(null);
                              }}
                              className="text-blue-600! hover:bg-blue-50! dark:text-blue-400! dark:hover:bg-blue-900/20!"
                            >
                              <div className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                <span>Chỉnh sửa</span>
                              </div>
                            </DropdownItem>
                          </Can>
                        )}

                        <Divider orientation="horizontal" />

                        {/* Xóa */}
                        {onDelete && (
                          <Can permission="delete_customer">
                            <DropdownItem
                              onClick={() => {
                                onDelete(customer.id, customer.customerName);
                                setOpenDropdownId(null);
                              }}
                              className="text-red-600! hover:bg-red-50! dark:text-red-400! dark:hover:bg-red-900/20!"
                            >
                              <div className="flex items-center gap-2">
                                <Trash2 className="h-4 w-4" />
                                <span>Xóa</span>
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
  );
}