/**
 * File Upload Component
 * Component for uploading files to Supabase Storage
 * Copyright © 2024-2026 Dakinis Systems. All rights reserved.
 */

import { useState } from 'react';
import { Upload, Image, Video, Loader2 } from 'lucide-react';
import { handleUpload, getUploadStats } from '../utils/uploadHelper';
import { formatDateTime } from '../utils/dateUtils';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';
import { devCatchLog } from '../utils/devCatchLog';

function getVideoDuration(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(Math.round(video.duration) || 0);
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });
}

export default function FileUpload({ user, onUploadComplete, uploadStats }) {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Determine if user is trial
  const isTrialUser = user?.licenseType === 'trial';

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast.error(t('media.invalidFileType'));
      return;
    }

    // Validate file size (10MB for images, 100MB for videos)
    const maxImageSize = 10 * 1024 * 1024; // 10MB
    const maxVideoSize = 100 * 1024 * 1024; // 100MB
    const maxSize = isImage ? maxImageSize : maxVideoSize;

    if (file.size > maxSize) {
      toast.error(t('media.fileTooLarge', { maxSize: isImage ? '10MB' : '100MB' }));
      return;
    }

    setUploading(true);

    try {
      const bucket = isImage ? 'images' : 'videos';
      const userId = user?.id?.toString();

      const result = await handleUpload({
        file,
        bucket,
        userId,
        isTrialUser
      });

      if (result.error) {
        // Error already shown by toast in handleUpload
        return;
      }

      let durationSeconds;
      if (isVideo) {
        durationSeconds = await getVideoDuration(file);
      }

      const meta = {
        fileName: file.name,
        type: isImage ? 'image' : 'video',
        ...(durationSeconds !== undefined && { durationSeconds }),
        ...(result.path && { file_path: result.path })
      };

      // Add to uploaded files list
      setUploadedFiles(prev => [...prev, {
        url: result.url,
        bucket,
        fileName: file.name,
        uploadedAt: new Date(),
        ...(durationSeconds !== undefined && { durationSeconds })
      }]);

      // Update stats after successful upload
      if (userId) {
        try {
          await getUploadStats(userId);
        } catch (error) {
          devCatchLog('FileUpload.refreshStatsAfterUpload', error);
        }
      }

      // Notify parent component (url, bucket, meta) - meta includes file_path for backend to get fresh signed URL when publishing
      if (onUploadComplete) {
        onUploadComplete(result.url, bucket, meta);
      }

    } catch (error) {
      toast.error(t('media.uploadError'));
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Stats: solo mostrar límite si aplica (no trial = 1 subida/día; trial por ahora sin límite) */}
      {uploadStats && uploadStats.dailyLimit != null && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {t('media.remainingToday', { remaining: uploadStats.remainingUploads ?? 0, limit: uploadStats.dailyLimit })}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                {t('media.total24hCount', { count: uploadStats.totalUploads24h })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 sm:p-6 hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
        <label className="cursor-pointer flex flex-col items-center justify-center space-y-3 sm:space-y-4 min-h-[44px]">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>
          <div className="text-center px-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {uploading ? t('media.uploading') : t('media.clickToUpload')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('media.fileTypes')}
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('media.uploadedFilesList')}
          </h3>
          {uploadedFiles.map((file) => (
            <div
              key={file.url || file.path || `${file.fileName}-${file.bucket}`}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-0"
            >
              <div className="flex items-center space-x-3 min-w-0">
                {file.bucket === 'images' ? (
                  <Image className="w-5 h-5 text-blue-500 flex-shrink-0" />
                ) : (
                  <Video className="w-5 h-5 text-purple-500 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDateTime(file.uploadedAt)}
                  </p>
                </div>
              </div>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex-shrink-0 self-start sm:self-auto"
              >
                {t('media.view')}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
