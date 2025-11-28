/**
 * Hook for managing file uploads with immediate upload on selection
 */
'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export type UploadingFile = {
  id: string;
  file: File;
  status: 'uploading' | 'success' | 'error';
  uploadedFileId?: string;
  uploadedFileUrl?: string;
  uploadedFileType?: string;
  uploadedFileSize?: number;
  progress?: number;
  error?: string;
};

export type UseFileUploadsOptions = {
  chatId?: string;
  onUploadComplete?: (fileId: string, file: File) => void;
  onUploadError?: (error: string, file: File) => void;
};

export function useFileUploads(options: UseFileUploadsOptions = {}) {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const uploadFile = useCallback(
    async (fileId: string, file: File) => {
      const abortController = new AbortController();
      abortControllersRef.current.set(fileId, abortController);

      setUploadingFiles((prev) => {
        const next = new Map(prev);
        next.set(fileId, {
          id: fileId,
          file,
          status: 'uploading',
          progress: 0,
        });
        return next;
      });

      try {
        const formData = new FormData();
        formData.append('file', file);
        // Don't send messageId - files are uploaded before message is created

        const response = await fetch('/api/files', {
          method: 'POST',
          body: formData,
          signal: abortController.signal,
        });

        if (!response.ok) {
          let errorMessage = 'Upload failed';
          try {
            const error = await response.json();
            errorMessage = error.error || error.message || errorMessage;
          } catch {
            // If response is not JSON (e.g., HTML error page), use status text
            errorMessage = `Upload failed: ${response.statusText} (${response.status})`;
          }
          throw new Error(errorMessage);
        }

        const uploadedFile = await response.json();

        setUploadingFiles((prev) => {
          const next = new Map(prev);
          next.set(fileId, {
            id: fileId,
            file,
            status: 'success',
            uploadedFileId: uploadedFile.id,
            uploadedFileUrl: uploadedFile.url,
            uploadedFileType: uploadedFile.type,
            uploadedFileSize: uploadedFile.size,
            progress: 100,
          });
          return next;
        });

        options.onUploadComplete?.(uploadedFile.id, file);

        return uploadedFile.id;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          // Upload was cancelled
          setUploadingFiles((prev) => {
            const next = new Map(prev);
            next.delete(fileId);
            return next;
          });
          return null;
        }

        const errorMessage = error instanceof Error ? error.message : 'Upload failed';

        setUploadingFiles((prev) => {
          const next = new Map(prev);
          next.set(fileId, {
            id: fileId,
            file,
            status: 'error',
            error: errorMessage,
          });
          return next;
        });

        options.onUploadError?.(errorMessage, file);
        toast.error(`Failed to upload ${file.name}: ${errorMessage}`);

        return null;
      } finally {
        abortControllersRef.current.delete(fileId);
      }
    },
    [options],
  );

  const cancelUpload = useCallback((fileId: string) => {
    const controller = abortControllersRef.current.get(fileId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(fileId);
    }

    setUploadingFiles((prev) => {
      const next = new Map(prev);
      next.delete(fileId);
      return next;
    });
  }, []);

  const deleteFile = useCallback(async (fileId: string, uploadedFileId: string) => {
    try {
      const response = await fetch(`/api/files/${uploadedFileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete file';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch {
          errorMessage = `Failed to delete file: ${response.statusText} (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      setUploadingFiles((prev) => {
        const next = new Map(prev);
        next.delete(fileId);
        return next;
      });
    } catch (error) {
      console.error('Failed to delete file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete file');
    }
  }, []);

  const removeFile = useCallback(
    async (fileId: string) => {
      const uploadingFile = uploadingFiles.get(fileId);
      
      if (!uploadingFile) return;

      // If upload is in progress, cancel it
      if (uploadingFile.status === 'uploading') {
        cancelUpload(fileId);
        return;
      }

      // If upload succeeded, delete from server
      if (uploadingFile.status === 'success' && uploadingFile.uploadedFileId) {
        await deleteFile(fileId, uploadingFile.uploadedFileId);
        return;
      }

      // If upload failed, just remove from state
      setUploadingFiles((prev) => {
        const next = new Map(prev);
        next.delete(fileId);
        return next;
      });
    },
    [uploadingFiles, cancelUpload, deleteFile],
  );

  const clearAll = useCallback(() => {
    // Cancel all ongoing uploads
    for (const controller of abortControllersRef.current.values()) {
      controller.abort();
    }
    abortControllersRef.current.clear();

    setUploadingFiles(new Map());
  }, []);

  const getUploadedFileIds = useCallback(() => {
    const fileIds: string[] = [];
    uploadingFiles.forEach((file) => {
      if (file.status === 'success' && file.uploadedFileId) {
        fileIds.push(file.uploadedFileId);
      }
    });
    return fileIds;
  }, [uploadingFiles]);

  const isAnyUploading = useCallback(() => {
    for (const file of uploadingFiles.values()) {
      if (file.status === 'uploading') {
        return true;
      }
    }
    return false;
  }, [uploadingFiles]);

  const hasErrors = useCallback(() => {
    for (const file of uploadingFiles.values()) {
      if (file.status === 'error') {
        return true;
      }
    }
    return false;
  }, [uploadingFiles]);

  const getUploadedFiles = useCallback(() => {
    const files: Array<{ id: string; name: string; url: string; type: string; size: number }> = [];
    uploadingFiles.forEach((file) => {
      if (file.status === 'success' && file.uploadedFileId && file.uploadedFileUrl) {
        files.push({
          id: file.uploadedFileId,
          name: file.file.name,
          url: file.uploadedFileUrl,
          type: file.uploadedFileType || file.file.type,
          size: file.uploadedFileSize || file.file.size,
        });
      }
    });
    return files;
  }, [uploadingFiles]);

  return {
    uploadingFiles,
    uploadFile,
    removeFile,
    clearAll,
    getUploadedFileIds,
    getUploadedFiles,
    isAnyUploading,
    hasErrors,
  };
}
