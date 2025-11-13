'use client';

import { FileIcon, ImageIcon, X, Upload } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { File as DBFile } from '@/lib/db/schema';
import { PromptInputActionMenuItem } from '@/components/ai-elements/prompt-input';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type FileAttachment = DBFile & {
  id: string;
  isUploading?: boolean;
  localUrl?: string; // For preview purposes
};

export type UseFileUploadsReturn = {
  files: FileAttachment[];
  uploadFile: (file: File, chatId?: string) => Promise<void>;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  isUploading: boolean;
};

export function useFileUploads(): UseFileUploadsReturn {
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(async (fileToUpload: File, chatId?: string) => {
    // Validate file size (10MB limit)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (fileToUpload.size > maxFileSize) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    // Validate file type
    const allowedTypes = [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
      'text/rtf',
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',
    ];

    if (!allowedTypes.includes(fileToUpload.type)) {
      toast.error('File type not supported. Supported types: PDF, Word docs, Excel sheets, PowerPoint, text files, images');
      return;
    }

    // Optimistic update - show the file immediately
    const tempId = `temp-${Date.now()}`;
    const localUrl = URL.createObjectURL(fileToUpload);
    const tempFile: FileAttachment = {
      id: tempId,
      name: fileToUpload.name,
      size: fileToUpload.size,
      mediaType: fileToUpload.type,
      url: '',
      localUrl,
      userId: '',
      chatId: chatId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isUploading: true,
    };

    setFiles(prev => [...prev, tempFile]);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      if (chatId) {
        formData.append('chatId', chatId);
      }

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const uploadedFile: DBFile = await response.json();
      
      // Replace temp file with real one
      setFiles(prev => 
        prev.map(file => 
          file.id === tempId 
            ? { ...uploadedFile, isUploading: false, localUrl }
            : file
        )
      );

      toast.success(`${getFileTypeDisplay(fileToUpload.type)} uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      // Remove the temp file on error and cleanup URL
      setFiles(prev => {
        const filtered = prev.filter(file => file.id !== tempId);
        URL.revokeObjectURL(localUrl);
        return filtered;
      });
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.localUrl) {
        URL.revokeObjectURL(fileToRemove.localUrl);
      }
      return prev.filter(file => file.id !== id);
    });
  }, []);

  const clearFiles = useCallback(() => {
    setFiles(prev => {
      // Cleanup all local URLs
      prev.forEach(file => {
        if (file.localUrl) {
          URL.revokeObjectURL(file.localUrl);
        }
      });
      return [];
    });
  }, []);

  return {
    files,
    uploadFile,
    removeFile,
    clearFiles,
    isUploading,
  };
}

function getFileTypeDisplay(mediaType: string): string {
  if (mediaType.startsWith('image/')) return 'Image';
  if (mediaType === 'application/pdf') return 'PDF';
  if (mediaType.includes('word') || mediaType === 'application/msword') return 'Word document';
  if (mediaType.includes('sheet') || mediaType.includes('excel')) return 'Excel spreadsheet';
  if (mediaType.includes('presentation') || mediaType.includes('powerpoint')) return 'PowerPoint presentation';
  if (mediaType === 'text/csv') return 'CSV file';
  if (mediaType === 'application/json') return 'JSON file';
  if (mediaType.startsWith('text/')) return 'Text file';
  return 'File';
}

export type FileUploadActionProps = {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  multiple?: boolean;
  className?: string;
};

export function FileUploadAction({ 
  onFileSelect, 
  disabled = false,
  multiple = false,
  className
}: FileUploadActionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (multiple) {
        Array.from(files).forEach(file => onFileSelect(file));
      } else {
        onFileSelect(files[0]);
      }
    }
    // Reset input to allow selecting the same file again
    event.target.value = '';
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.json,.rtf,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff"
        multiple={multiple}
        onChange={handleFileSelect}
        disabled={disabled}
      />
      <PromptInputActionMenuItem
        disabled={disabled}
        onSelect={(e) => {
          e.preventDefault();
          handleClick();
        }}
        className={className}
      >
        <Upload className="mr-2 size-4" />
        Add photos or files
      </PromptInputActionMenuItem>
    </>
  );
}

export type FileUploadButtonProps = {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  multiple?: boolean;
  variant?: 'outline' | 'ghost' | 'solid' | 'soft' | 'surface' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
};

export function FileUploadButton({ 
  onFileSelect, 
  disabled = false,
  multiple = false,
  variant = 'outline',
  size = 'sm',
  className
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (multiple) {
        Array.from(files).forEach(file => onFileSelect(file));
      } else {
        onFileSelect(files[0]);
      }
    }
    // Reset input to allow selecting the same file again
    event.target.value = '';
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.json,.rtf,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff"
        multiple={multiple}
        onChange={handleFileSelect}
        disabled={disabled}
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={handleClick}
        className={className}
      >
        <Upload className="mr-2 size-4" />
        Add photos or files
      </Button>
    </>
  );
}

export type FileAttachmentDisplayProps = {
  file: FileAttachment;
  onRemove: (id: string) => void;
  className?: string;
  showPreview?: boolean;
};

export function FileAttachmentDisplay({
  file,
  onRemove,
  className,
  showPreview = false,
}: FileAttachmentDisplayProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mediaType: string) => {
    if (mediaType.startsWith('image/')) return <ImageIcon className="size-4" />;
    return <FileIcon className="size-4" />;
  };

  const getFileEmoji = (mediaType: string) => {
    if (mediaType.startsWith('image/')) return '🖼️';
    if (mediaType === 'application/pdf') return '📄';
    if (mediaType.includes('word') || mediaType === 'application/msword') return '📝';
    if (mediaType.includes('sheet') || mediaType.includes('excel')) return '📊';
    if (mediaType.includes('presentation') || mediaType.includes('powerpoint')) return '📋';
    if (mediaType === 'text/csv') return '📊';
    if (mediaType === 'application/json') return '🔧';
    if (mediaType.startsWith('text/')) return '📄';
    return '📎';
  };

  const isImage = file.mediaType.startsWith('image/');
  const previewUrl = file.localUrl || file.url;

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 rounded-md border bg-background/50 p-2 transition-all hover:bg-muted/50',
        file.isUploading && 'opacity-50',
        className
      )}
    >
      {showPreview && isImage && previewUrl ? (
        <div className="relative size-10 shrink-0 overflow-hidden rounded bg-muted/30">
          <img 
            src={previewUrl} 
            alt={file.name}
            className="size-full object-cover"
          />
          {file.isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="size-4 animate-spin rounded-full border border-foreground border-t-transparent" />
            </div>
          )}
        </div>
      ) : (
        <div className="relative size-10 shrink-0 flex items-center justify-center overflow-hidden rounded bg-muted/30">
          {file.isUploading ? (
            <div className="size-4 animate-spin rounded-full border border-foreground border-t-transparent" />
          ) : (
            <span className="text-lg">{getFileEmoji(file.mediaType)}</span>
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)} • {getFileTypeDisplay(file.mediaType)}
        </p>
      </div>

      {!file.isUploading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(file.id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500 hover:text-white rounded"
          aria-label="Remove file"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export type FileListProps = {
  files: FileAttachment[];
  onRemove: (id: string) => void;
  className?: string;
  showPreview?: boolean;
};

export function FileList({ 
  files, 
  onRemove, 
  className,
  showPreview = false 
}: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {files.map((file) => (
        <FileAttachmentDisplay
          key={file.id}
          file={file}
          onRemove={onRemove}
          showPreview={showPreview}
        />
      ))}
    </div>
  );
}