"use client";

/**
 * Proof Upload Component
 * Upload ảnh chứng minh giao hàng (Proof of Delivery)
 */

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import { useUploadDeliveryProof } from "@/hooks/api";

interface ProofUploadProps {
  deliveryId: number;
  currentProof?: string;
  onSuccess?: (proofUrl: string) => void;
  disabled?: boolean;
}

export default function ProofUpload({
  deliveryId,
  currentProof,
  onSuccess,
  disabled = false,
}: ProofUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentProof || null);
  const uploadProof = useUploadDeliveryProof();

  const onDrop = async (acceptedFiles: File[]) => {
    if (disabled || acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    // Tạo preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Upload
    try {
      const result = await uploadProof.mutateAsync({ id: deliveryId, file });
      if (result.deliveryProof && onSuccess) {
        onSuccess(result.deliveryProof);
      }
    } catch (error) {
      // Error đã được handle trong hook
      setPreview(currentProof || null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: disabled || uploadProof.isPending,
  });

  const removeProof = () => {
    setPreview(null);
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
  };

  return (
    <div className="space-y-4">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Ảnh chứng minh giao hàng
        <span className="ml-1 text-gray-400">(tối đa 5MB)</span>
      </label>

      {/* Preview hoặc Upload Zone */}
      {preview ? (
        <div className="relative">
          {/* Image Preview */}
          <div className="overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700">
            <img
              src={preview}
              alt="Proof of delivery"
              className="h-64 w-full object-cover"
            />
          </div>

          {/* Remove Button */}
          {!disabled && (
            <button
              type="button"
              onClick={removeProof}
              className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-colors hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Upload Status */}
          {uploadProof.isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="flex flex-col items-center gap-2 text-white">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
                <span className="text-sm font-medium">Đang tải lên...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "relative cursor-pointer rounded-lg border-2 border-dashed p-8 transition-colors",
            isDragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500",
            disabled && "cursor-not-allowed opacity-50",
            uploadProof.isPending && "pointer-events-none"
          )}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center gap-3 text-center">
            {/* Icon */}
            {uploadProof.isPending ? (
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
            ) : (
              <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-800">
                <Upload className="h-8 w-8 text-gray-400" />
              </div>
            )}

            {/* Text */}
            {uploadProof.isPending ? (
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Đang tải lên...
              </p>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {isDragActive
                      ? "Thả ảnh vào đây"
                      : "Kéo thả ảnh hoặc click để chọn"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, WEBP tối đa 5MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {uploadProof.isSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
          <CheckCircle className="h-4 w-4" />
          <span>Tải ảnh chứng minh thành công!</span>
        </div>
      )}

      {uploadProof.isError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
          <AlertCircle className="h-4 w-4" />
          <span>Tải ảnh thất bại. Vui lòng thử lại.</span>
        </div>
      )}
    </div>
  );
}

/**
 * Proof Display Component
 * Hiển thị ảnh chứng minh đã có (read-only)
 */
interface ProofDisplayProps {
  proofUrl: string;
  alt?: string;
  className?: string;
  onRemove?: () => void;
}

export function ProofDisplay({
  proofUrl,
  alt = "Proof of delivery",
  className,
  onRemove,
}: ProofDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Thumbnail */}
      <div className={cn("relative group", className)}>
        <div
          onClick={() => setIsOpen(true)}
          className="cursor-pointer overflow-hidden rounded-lg border-2 border-gray-200 transition-all hover:border-blue-500 dark:border-gray-700 dark:hover:border-blue-400"
        >
          <img
            src={proofUrl}
            alt={alt}
            className="h-48 w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>

        {/* Actions */}
        <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="rounded-full bg-white p-2 shadow-lg transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
            title="Xem ảnh"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-full bg-red-500 p-2 text-white shadow-lg transition-colors hover:bg-red-600"
              title="Xóa ảnh"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div className="relative max-h-full max-w-4xl">
            <img
              src={proofUrl}
              alt={alt}
              className="max-h-[90vh] w-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-white p-2 shadow-lg transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
