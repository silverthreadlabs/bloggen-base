'use client';

import { FileIcon, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { File as DBFile } from '@/lib/db/schema';
import { PromptInputActionMenuItem } from '@/components/ai-elements/prompt-input';
import { cn } from '@/lib/utils';

export type DocumentAttachment = DBFile & {
  id: string;
  isUploading?: boolean;
};

export type UseDocumentUploadsReturn = {
  documents: DocumentAttachment[];
  uploadDocument: (file: File, chatId?: string) => Promise<void>;
  removeDocument: (id: string) => void;
  clearDocuments: () => void;
  isUploading: boolean;
};

export function useDocumentUploads(): UseDocumentUploadsReturn {
  const [documents, setDocuments] = useState<DocumentAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadDocument = useCallback(async (fileToUpload: File, chatId?: string) => {
    // Optimistic update - show the file immediately
    const tempId = `temp-${Date.now()}`;
    const tempDoc: DocumentAttachment = {
      id: tempId,
      name: fileToUpload.name,
      size: fileToUpload.size,
      mediaType: fileToUpload.type,
      url: '',
      userId: '',
      chatId: chatId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isUploading: true,
    };

    setDocuments(prev => [...prev, tempDoc]);
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
      
      // Replace temp document with real one
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === tempId 
            ? { ...uploadedFile, isUploading: false }
            : doc
        )
      );

      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      // Remove the temp document on error
      setDocuments(prev => prev.filter(doc => doc.id !== tempId));
      toast.error(error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const removeDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  }, []);

  const clearDocuments = useCallback(() => {
    setDocuments([]);
  }, []);

  return {
    documents,
    uploadDocument,
    removeDocument,
    clearDocuments,
    isUploading,
  };
}

export type DocumentUploadActionProps = {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  accept?: string;
};

export function DocumentUploadAction({ 
  onFileSelect, 
  disabled = false,
  accept = '.pdf,.doc,.docx,.txt,.md,.csv,.json'
}: DocumentUploadActionProps) {
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset input to allow selecting the same file again
    event.target.value = '';
  };

  return (
    <>
      <input
        type="file"
        id="document-upload"
        className="hidden"
        accept={accept}
        onChange={handleFileSelect}
        disabled={disabled}
      />
      <PromptInputActionMenuItem
        disabled={disabled}
        onSelect={(e) => {
          e.preventDefault();
          document.getElementById('document-upload')?.click();
        }}
      >
        <FileIcon className="mr-2 size-4" />
        Add documents
      </PromptInputActionMenuItem>
    </>
  );
}

export type DocumentAttachmentDisplayProps = {
  document: DocumentAttachment;
  onRemove: (id: string) => void;
  className?: string;
};

export function DocumentAttachmentDisplay({
  document,
  onRemove,
  className,
}: DocumentAttachmentDisplayProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mediaType: string) => {
    if (mediaType.startsWith('image/')) {
      return '🖼️';
    } else if (mediaType === 'application/pdf') {
      return '📄';
    } else if (mediaType.includes('word') || mediaType === 'application/msword') {
      return '📝';
    } else if (mediaType === 'text/csv') {
      return '📊';
    } else {
      return '📎';
    }
  };

  return (
    <div
      className={cn(
        'group relative flex h-8 cursor-default select-none items-center gap-1.5 rounded-md border border-canvas-border px-1.5 font-medium text-sm transition-all hover:bg-secondary-bg-hover hover:text-canvas-text-contrast',
        document.isUploading && 'opacity-50',
        className
      )}
    >
      <div className="relative size-5 shrink-0">
        <div className="absolute inset-0 flex size-5 items-center justify-center overflow-hidden rounded bg-canvas-bg transition-opacity group-hover:opacity-0">
          {document.isUploading ? (
            <div className="size-3 animate-spin rounded-full border border-canvas-text border-t-transparent" />
          ) : (
            <span className="text-xs">{getFileIcon(document.mediaType)}</span>
          )}
        </div>
        {!document.isUploading && (
          <button
            aria-label="Remove document"
            className="absolute inset-0 size-5 cursor-pointer rounded p-0 opacity-0 transition-opacity hover:bg-red-500 hover:text-white group-hover:pointer-events-auto group-hover:opacity-100 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(document.id);
            }}
            type="button"
          >
            <X className="size-2.5" />
          </button>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <span className="truncate block">{document.name}</span>
        <span className="text-xs text-muted-foreground">
          {formatFileSize(document.size)}
        </span>
      </div>
    </div>
  );
}