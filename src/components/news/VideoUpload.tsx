"use client";

import React, { useState } from "react";
import axios from "axios";
import { Upload, X, Loader2, Film, Image as ImageIcon } from "lucide-react";
import { toast } from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface VideoUploadProps {
    onVideoUploaded: (videoPath: string) => void;
    onThumbnailUploaded: (thumbnailPath: string) => void;
    currentVideo?: string;
    currentThumbnail?: string;
}

export default function VideoUpload({
    onVideoUploaded,
    onThumbnailUploaded,
    currentVideo,
    currentThumbnail,
}: VideoUploadProps) {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [videoProgress, setVideoProgress] = useState(0);
    const [thumbnailProgress, setThumbnailProgress] = useState(0);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

    const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (file.type !== "video/mp4") {
            toast.error("Chỉ chấp nhận file MP4!");
            return;
        }

        // Validate file size (50MB)
        if (file.size > 50 * 1024 * 1024) {
            toast.error("File video không được vượt quá 50MB!");
            return;
        }

        setVideoFile(file);
        await uploadVideo(file);
    };

    const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Chỉ chấp nhận file ảnh!");
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File ảnh không được vượt quá 5MB!");
            return;
        }

        setThumbnailFile(file);
        await uploadThumbnail(file);
    };

    const uploadVideo = async (file: File) => {
        const formData = new FormData();
        formData.append("video", file);

        setIsUploadingVideo(true);
        setVideoProgress(0);

        try {
            const response = await axios.post(`${API_URL}/news/admin/upload-video`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total
                        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        : 0;
                    setVideoProgress(progress);
                },
            });

            if (response.data.success) {
                onVideoUploaded(response.data.data.videoFile);
                toast.success("Upload video thành công!");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Upload video thất bại!");
            setVideoFile(null);
        } finally {
            setIsUploadingVideo(false);
            setVideoProgress(0);
        }
    };

    const uploadThumbnail = async (file: File) => {
        const formData = new FormData();
        formData.append("thumbnail", file);

        setIsUploadingThumbnail(true);
        setThumbnailProgress(0);

        try {
            const response = await axios.post(`${API_URL}/news/admin/upload-thumbnail`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total
                        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        : 0;
                    setThumbnailProgress(progress);
                },
            });

            if (response.data.success) {
                onThumbnailUploaded(response.data.data.videoThumbnail);
                toast.success("Upload thumbnail thành công!");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Upload thumbnail thất bại!");
            setThumbnailFile(null);
        } finally {
            setIsUploadingThumbnail(false);
            setThumbnailProgress(0);
        }
    };

    const removeVideo = () => {
        setVideoFile(null);
        onVideoUploaded("");
    };

    const removeThumbnail = () => {
        setThumbnailFile(null);
        onThumbnailUploaded("");
    };

    return (
        <div className="space-y-4">
            {/* Video Upload */}
            <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Video File (MP4, max 50MB) *
                </label>

                {!videoFile && !currentVideo ? (
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                        <Upload className="mb-2 h-10 w-10 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Click để chọn video MP4
                        </span>
                        <span className="mt-1 text-xs text-gray-500">Tối đa 50MB</span>
                        <input
                            type="file"
                            accept="video/mp4"
                            onChange={handleVideoChange}
                            className="hidden"
                            disabled={isUploadingVideo}
                        />
                    </label>
                ) : (
                    <div className="rounded-lg border border-gray-300 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Film className="h-8 w-8 text-blue-500" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {videoFile?.name || currentVideo}
                                    </p>
                                    {videoFile && (
                                        <p className="text-xs text-gray-500">
                                            {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                    )}
                                </div>
                            </div>
                            {!isUploadingVideo && (
                                <button
                                    type="button"
                                    onClick={removeVideo}
                                    className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        {isUploadingVideo && (
                            <div className="mt-3">
                                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>Đang upload...</span>
                                    <span>{videoProgress}%</span>
                                </div>
                                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div
                                        className="h-full bg-blue-600 transition-all duration-300"
                                        style={{ width: `${videoProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Thumbnail Upload */}
            <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Thumbnail (Tùy chọn, max 5MB)
                </label>

                {!thumbnailFile && !currentThumbnail ? (
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                        <ImageIcon className="mb-2 h-10 w-10 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Click để chọn ảnh thumbnail
                        </span>
                        <span className="mt-1 text-xs text-gray-500">JPG, PNG, WebP - Tối đa 5MB</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                            className="hidden"
                            disabled={isUploadingThumbnail}
                        />
                    </label>
                ) : (
                    <div className="rounded-lg border border-gray-300 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {thumbnailFile ? (
                                    <img
                                        src={URL.createObjectURL(thumbnailFile)}
                                        alt="Thumbnail preview"
                                        className="h-16 w-16 rounded object-cover"
                                    />
                                ) : (
                                    <img
                                        src={`${API_URL}/uploads/${currentThumbnail}`}
                                        alt="Current thumbnail"
                                        className="h-16 w-16 rounded object-cover"
                                    />
                                )}
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {thumbnailFile?.name || currentThumbnail}
                                    </p>
                                    {thumbnailFile && (
                                        <p className="text-xs text-gray-500">
                                            {(thumbnailFile.size / 1024).toFixed(2)} KB
                                        </p>
                                    )}
                                </div>
                            </div>
                            {!isUploadingThumbnail && (
                                <button
                                    type="button"
                                    onClick={removeThumbnail}
                                    className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        {isUploadingThumbnail && (
                            <div className="mt-3">
                                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>Đang upload...</span>
                                    <span>{thumbnailProgress}%</span>
                                </div>
                                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div
                                        className="h-full bg-green-600 transition-all duration-300"
                                        style={{ width: `${thumbnailProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 Nếu không upload thumbnail, hệ thống sẽ tự động tạo từ video
            </p>
        </div>
    );
}
