"use client";

import React, { useState, useEffect } from "react";
import { BomMaterialFormData, Product, BomMaterialType } from "@/types";
import { useProducts } from "@/hooks/api";
import { Trash2, Plus, Search } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { BOM_MATERIAL_TYPE_LABELS } from "@/lib/constants";

interface MaterialsTableProps {
  materials: BomMaterialFormData[];
  onChange: (materials: BomMaterialFormData[]) => void;
  errors?: any;
}

export default function MaterialsTable({ materials, onChange, errors }: MaterialsTableProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [materialType, setMaterialType] = useState<BomMaterialType>("raw_material");
  const [selectedMaterial, setSelectedMaterial] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Fetch products dựa trên materialType
  const { data: productsData } = useProducts({
    productType:
      materialType === "raw_material" ? "raw_material" : "packaging",
    status: "active",
    limit: 100,
  });

  const products = (productsData as any)?.data || [];

  // Filter products by search
  const filteredProducts = products.filter((p: Product) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      p.productName?.toLowerCase().includes(searchLower) ||
      p.sku?.toLowerCase().includes(searchLower)
    );
  });

  // Auto-fill unit khi chọn material
  useEffect(() => {
    if (selectedMaterial) {
      setUnit(selectedMaterial.unit || "");
    }
  }, [selectedMaterial]);

  // Handle Add Material
  const handleAddMaterial = () => {
    if (!selectedMaterial) {
      alert("Vui lòng chọn nguyên liệu!");
      return;
    }

    if (!quantity || quantity <= 0) {
      alert("Vui lòng nhập số lượng hợp lệ!");
      return;
    }

    if (!unit) {
      alert("Vui lòng nhập đơn vị!");
      return;
    }

    // Check if material already exists
    const exists = materials.find((m) => m.materialId === selectedMaterial.id);
    if (exists) {
      alert("Nguyên liệu này đã được thêm vào danh sách!");
      return;
    }

    const newMaterial: BomMaterialFormData = {
      materialId: selectedMaterial.id,
      materialName: selectedMaterial.productName,
      materialSku: selectedMaterial.sku || "",
      quantity,
      unit,
      materialType,
      notes,
    };

    onChange([...materials, newMaterial]);

    // Reset form
    setSelectedMaterial(null);
    setQuantity(1);
    setUnit("");
    setNotes("");
    setSearchTerm("");
    setShowAddDialog(false);
  };

  // Handle Remove Material
  const handleRemoveMaterial = (index: number) => {
    const newMaterials = materials.filter((_, i) => i !== index);
    onChange(newMaterials);
  };

  // Handle Update Quantity
  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    const newMaterials = [...materials];
    newMaterials[index] = { ...newMaterials[index], quantity: newQuantity };
    onChange(newMaterials);
  };

  // Handle Update Notes
  const handleUpdateNotes = (index: number, newNotes: string) => {
    const newMaterials = [...materials];
    newMaterials[index] = { ...newMaterials[index], notes: newNotes };
    onChange(newMaterials);
  };

  // Separate materials by type
  const rawMaterials = materials.filter((m) => m.materialType === "raw_material");
  const packagingMaterials = materials.filter((m) => m.materialType === "packaging");

  return (
    <div className="space-y-6">
      {/* Add Material Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Danh sách nguyên liệu
        </h3>
        <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm nguyên liệu
        </Button>
      </div>

      {/* Error Message */}
      {errors && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {errors.message || "Vui lòng thêm ít nhất một nguyên liệu"}
        </div>
      )}

      {/* Raw Materials Section */}
      {rawMaterials.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Nguyên liệu thô ({rawMaterials.length})
          </h4>
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Nguyên liệu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Số lượng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Đơn vị
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Ghi chú
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {rawMaterials.map((material, index) => {
                  const actualIndex = materials.findIndex((m) => m === material);
                  return (
                    <tr key={actualIndex}>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {material.materialName}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {material.materialSku}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={material.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(actualIndex, parseFloat(e.target.value) || 0)
                          }
                          min="0"
                          step="0.01"
                          className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {material.unit}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={material.notes || ""}
                          onChange={(e) => handleUpdateNotes(actualIndex, e.target.value)}
                          placeholder="Ghi chú..."
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(actualIndex)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Packaging Materials Section */}
      {packagingMaterials.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Bao bì ({packagingMaterials.length})
          </h4>
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Bao bì
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Số lượng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Đơn vị
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Ghi chú
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {packagingMaterials.map((material, index) => {
                  const actualIndex = materials.findIndex((m) => m === material);
                  return (
                    <tr key={actualIndex}>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {material.materialName}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {material.materialSku}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={material.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(actualIndex, parseFloat(e.target.value) || 0)
                          }
                          min="0"
                          step="0.01"
                          className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {material.unit}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={material.notes || ""}
                          onChange={(e) => handleUpdateNotes(actualIndex, e.target.value)}
                          placeholder="Ghi chú..."
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(actualIndex)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {materials.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chưa có nguyên liệu nào. Nhấn "Thêm nguyên liệu" để bắt đầu.
          </p>
        </div>
      )}

      {/* Add Material Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Thêm nguyên liệu
            </h3>

            <div className="space-y-4">
              {/* Material Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Loại nguyên liệu <span className="text-red-500">*</span>
                </label>
                <select
                  value={materialType}
                  onChange={(e) => {
                    setMaterialType(e.target.value as BomMaterialType);
                    setSelectedMaterial(null);
                    setSearchTerm("");
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="raw_material">{BOM_MATERIAL_TYPE_LABELS.raw_material}</option>
                  <option value="packaging">{BOM_MATERIAL_TYPE_LABELS.packaging}</option>
                </select>
              </div>

              {/* Search Materials */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tìm kiếm nguyên liệu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nhập tên hoặc mã SKU..."
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Material List */}
                {searchTerm && (
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-300 dark:border-gray-600">
                    {filteredProducts.length === 0 ? (
                      <p className="p-4 text-center text-sm text-gray-500">
                        Không tìm thấy nguyên liệu
                      </p>
                    ) : (
                      filteredProducts.map((product: Product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            setSelectedMaterial(product);
                            setSearchTerm(product.productName || "");
                          }}
                          className={`w-full border-b border-gray-200 p-3 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 ${
                            selectedMaterial?.id === product.id
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : ""
                          }`}
                        >
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.productName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {product.sku} | {product.unit}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Selected Material Info */}
              {selectedMaterial && (
                <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    Đã chọn: {selectedMaterial.productName}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    SKU: {selectedMaterial.sku} | Đơn vị: {selectedMaterial.unit}
                  </p>
                </div>
              )}

              {/* Quantity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Số lượng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Đơn vị <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú về nguyên liệu..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setShowAddDialog(false);
                  setSelectedMaterial(null);
                  setQuantity(1);
                  setUnit("");
                  setNotes("");
                  setSearchTerm("");
                }}
              >
                Hủy
              </Button>
              <Button variant="primary" size="md" onClick={handleAddMaterial}>
                Thêm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
