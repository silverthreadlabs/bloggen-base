'use client';

import { FileIcon, ImageIcon, X, Upload } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { File as DBFile } from '@/lib/db/schema';
import { PromptInputActionMenuItem } from '@/chat/components/ai-elements/prompt-input';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FileTypes } from '@/chat/utils';

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

    // Validate file type - comprehensive list of supported document, text, code, and image files
    // const allowedTypes = [
    //   // PDF Documents
    //   'application/pdf',
      
    //   // Microsoft Office Documents
    //   'application/msword', // .doc
    //   'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    //   'application/vnd.ms-powerpoint', // .ppt
    //   'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    //   'application/vnd.ms-excel', // .xls
    //   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      
    //   // Text Files
    //   'text/plain', // .txt
    //   'application/rtf', // .rtf
    //   'text/markdown', // .md
      
    //   // OpenDocument Files
    //   'application/vnd.oasis.opendocument.text', // .odt
    //   'application/vnd.oasis.opendocument.spreadsheet', // .ods
    //   'application/vnd.oasis.opendocument.presentation', // .odp
      
    //   // Data Files
    //   'text/csv', // .csv
    //   'text/tab-separated-values', // .tsv
    //   'application/json', // .json
    //   'application/x-yaml', // .yaml
    //   'text/yaml', // .yaml, .yml
    //   'application/xml', // .xml
    //   'text/xml', // .xml
    //   'text/html', // .html, .htm
      
    //   // Programming Languages
    //   'text/javascript', // .js
    //   'application/javascript', // .js
    //   'text/typescript', // .ts
    //   'application/typescript', // .ts
    //   'text/jsx', // .jsx
    //   'text/tsx', // .tsx
    //   'text/x-python', // .py
    //   'text/python', // .py
    //   'text/x-java-source', // .java
    //   'text/x-c', // .c
    //   'text/x-c++src', // .cpp
    //   'text/x-chdr', // .h
    //   'text/x-c++hdr', // .hpp
    //   'text/x-csharp', // .cs
    //   'text/x-php', // .php
    //   'application/x-httpd-php', // .php
    //   'text/x-ruby', // .rb
    //   'text/x-go', // .go
    //   'text/x-rustsrc', // .rs
    //   'text/x-swift', // .swift
    //   'text/x-kotlin', // .kt
    //   'text/x-scala', // .scala
    //   'text/x-shellscript', // .sh, .bash
    //   'application/x-sh', // .sh
    //   'application/x-bash', // .bash
      
    //   // Images
    //   'image/jpeg', // .jpg, .jpeg
    //   'image/png', // .png
    //   'image/gif', // .gif
    //   'image/webp', // .webp
    //   'image/svg+xml', // .svg
    //   'image/bmp', // .bmp
    //   'image/tiff', // .tiff
    //   'image/heic', // .heic
    //   'image/heif', // .heif
    // ];

    if (!FileTypes.isMimeTypeAllowed(fileToUpload.type)) {
      const allowedExts = FileTypes.getAllowedExtensions().map(ext => `.${ext}`).join(', ');
      toast.error(`File type not supported. Allowed: ${allowedExts}`);
      return;
    }

    // Optimistic update - show the file immediately
    const tempId = `temp-${Date.now()}`;
    const localUrl = URL.createObjectURL(fileToUpload);
    const tempFile: FileAttachment = {
      id: tempId,
      name: fileToUpload.name,
      size: fileToUpload.size,
      type: fileToUpload.type,
      url: '',
      localUrl,
      userId: '',
      messageId: chatId || null,
      createdAt: new Date(),
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
  if (mediaType.includes('opendocument.text')) return 'OpenDocument text';
  if (mediaType.includes('opendocument.spreadsheet')) return 'OpenDocument spreadsheet';
  if (mediaType.includes('opendocument.presentation')) return 'OpenDocument presentation';
  if (mediaType === 'text/csv') return 'CSV file';
  if (mediaType === 'text/tab-separated-values') return 'TSV file';
  if (mediaType === 'application/json') return 'JSON file';
  if (mediaType.includes('yaml')) return 'YAML file';
  if (mediaType.includes('xml')) return 'XML file';
  if (mediaType === 'text/html') return 'HTML file';
  if (mediaType === 'application/rtf') return 'RTF document';
  if (mediaType === 'text/markdown') return 'Markdown file';
  if (mediaType === 'text/javascript' || mediaType === 'application/javascript') return 'JavaScript file';
  if (mediaType.includes('typescript')) return 'TypeScript file';
  if (mediaType.includes('python')) return 'Python file';
  if (mediaType.includes('java')) return 'Java file';
  if (mediaType.includes('c++') || mediaType.includes('cpp')) return 'C++ file';
  if (mediaType.includes('c') && !mediaType.includes('c++')) return 'C file';
  if (mediaType.includes('csharp')) return 'C# file';
  if (mediaType.includes('php')) return 'PHP file';
  if (mediaType.includes('ruby')) return 'Ruby file';
  if (mediaType.includes('go')) return 'Go file';
  if (mediaType.includes('rust')) return 'Rust file';
  if (mediaType.includes('swift')) return 'Swift file';
  if (mediaType.includes('kotlin')) return 'Kotlin file';
  if (mediaType.includes('scala')) return 'Scala file';
  if (mediaType.includes('shell') || mediaType.includes('bash') || mediaType.includes('sh')) return 'Shell script';
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
        Array.from(files).forEach(file => {
          onFileSelect(file);
        });
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
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.txt,.md,.jpg,.jpeg,.png,.svg"
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
        Array.from(files).forEach(file => {
          onFileSelect(file);
        });
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
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.txt,.md,.jpg,.jpeg,.png,.svg"
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
    if (mediaType.includes('opendocument')) return '📋';
    if (mediaType === 'text/csv' || mediaType === 'text/tab-separated-values') return '📊';
    if (mediaType === 'application/json') return '🔧';
    if (mediaType.includes('yaml')) return '⚙️';
    if (mediaType.includes('xml')) return '📋';
    if (mediaType === 'text/html') return '🌐';
    if (mediaType === 'text/markdown') return '📝';
    if (mediaType === 'text/javascript' || mediaType === 'application/javascript') return '📜';
    if (mediaType.includes('typescript')) return '📜';
    if (mediaType.includes('python')) return '🐍';
    if (mediaType.includes('java')) return '☕';
    if (mediaType.includes('c++') || mediaType.includes('cpp')) return '⚡';
    if (mediaType.includes('c') && !mediaType.includes('c++')) return '⚡';
    if (mediaType.includes('csharp')) return '💎';
    if (mediaType.includes('php')) return '🐘';
    if (mediaType.includes('ruby')) return '💎';
    if (mediaType.includes('go')) return '🐹';
    if (mediaType.includes('rust')) return '🦀';
    if (mediaType.includes('swift')) return '🐦';
    if (mediaType.includes('kotlin')) return '🎯';
    if (mediaType.includes('scala')) return '⚡';
    if (mediaType.includes('shell') || mediaType.includes('bash') || mediaType.includes('sh')) return '🐚';
    if (mediaType.startsWith('text/')) return '📄';
    return '📎';
  };

  const isImage = file.type.startsWith('image/');
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
            <span className="text-lg">{getFileEmoji(file.type)}</span>
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)} • {getFileTypeDisplay(file.type)}
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