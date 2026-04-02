"use client";

import React, { forwardRef, useImperativeHandle } from "react";

export interface ProductImageManagerRef {
  hasUnsavedImages(): boolean;
  saveImages(): Promise<void>;
}

export interface ProductImageManagerProps {
  productId: number;
  images: string[];
  maxImages?: number;
  hidePreview?: boolean;
  hideSaveButton?: boolean;
  onImagesChange?: (files: File[]) => void;
  className?: string;
}

/**
 * ProductImageManager - Manages product images upload and display.
 * TODO: Implement full image management functionality.
 */
const ProductImageManager = forwardRef<ProductImageManagerRef, ProductImageManagerProps>(
  function ProductImageManager(
    { productId, images, maxImages = 5, className = "" },
    ref
  ) {
    useImperativeHandle(ref, () => ({
      hasUnsavedImages: () => false,
      saveImages: async () => {},
    }));

    return (
      <div className={`rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-600 ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Quản lý hình ảnh sản phẩm (tối đa {maxImages} ảnh)
        </p>
        {images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Ảnh ${idx + 1}`}
                className="h-20 w-20 rounded-lg object-cover"
              />
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-gray-400">Chức năng tải ảnh đang được phát triển</p>
      </div>
    );
  }
);

export { ProductImageManager };

export interface ProductVideoManagerRef {
  hasUnsavedVideo(): boolean;
  saveVideo(): Promise<void>;
}

export interface ProductVideoManagerProps {
  productId: number;
  video?: string;
  onVideoChange?: (file: File | null) => void;
  className?: string;
}

/**
 * ProductVideoManager - Manages product video upload and display.
 * TODO: Implement full video management functionality.
 */
const ProductVideoManager = forwardRef<ProductVideoManagerRef, ProductVideoManagerProps>(
  function ProductVideoManager({ productId, video, className = "" }, ref) {
    useImperativeHandle(ref, () => ({
      hasUnsavedVideo: () => false,
      saveVideo: async () => {},
    }));

    return (
      <div className={`rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-600 ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Quản lý video sản phẩm (tối đa 1 video)
        </p>
        {video && (
          <video src={video} controls className="mt-3 max-h-48 w-full rounded" />
        )}
        <p className="mt-2 text-xs text-gray-400">Chức năng tải video đang được phát triển</p>
      </div>
    );
  }
);

export { ProductVideoManager };
